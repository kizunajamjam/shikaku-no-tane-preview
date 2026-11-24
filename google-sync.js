(function exposeGoogleSync(root, factory) {
  const api = factory(root.PassDeckPlanLibrary || (typeof require === "function" && require("./plan-library.js")));
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PassDeckGoogleSync = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createGoogleSyncApi(library) {
  "use strict";

  const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
  const IDENTITY_SCOPES = "openid email profile";
  const FILE_NAME = "pass-deck-state.json";

  function uniqueRecords(records) {
    const map = new Map();
    (Array.isArray(records) ? records : []).forEach((record) => {
      if (!record?.id) return;
      const current = map.get(record.id);
      if (!current || String(record.completedAt || "") > String(current.completedAt || "")) map.set(record.id, record);
    });
    return [...map.values()].sort((left, right) => String(left.completedAt || "").localeCompare(String(right.completedAt || "")));
  }

  function newerPlan(left, right) {
    if (!left) return right || null;
    if (!right) return left;
    return String(left.generatedAt || "") >= String(right.generatedAt || "") ? left : right;
  }

  function mergeStates(localState, remoteState, now = new Date()) {
    const local = localState && typeof localState === "object" ? localState : {};
    const remote = remoteState && typeof remoteState === "object" ? remoteState : {};
    const resetAt = [local.resetAt, remote.resetAt].filter(Boolean).sort().at(-1) || "";
    return {
      ...library.mergeLibraries(local, remote, resetAt),
      records: uniqueRecords([...(local.records || []), ...(remote.records || [])])
        .filter((record) => !resetAt || String(record.completedAt || "") > resetAt),
      harvests: uniqueRecords([...(Array.isArray(local.harvests) ? local.harvests : []),
        ...(Array.isArray(remote.harvests) ? remote.harvests : [])])
        .filter((record) => !resetAt || String(record.completedAt || "") > resetAt),
      items: [...new Map([...(remote.items || []), ...(local.items || [])]
        .filter((item) => item?.id && (!resetAt || String(item.createdAt || "") > resetAt))
        .map((item) => [item.id, item])).values()],
      resetAt,
      updatedAt: now.toISOString()
    };
  }

  function loadGoogleIdentityScript(documentObject = document) {
    if (globalThis.google?.accounts?.oauth2) return Promise.resolve();
    const existing = documentObject.querySelector('script[data-pass-deck-google="true"]');
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
      });
    }
    return new Promise((resolve, reject) => {
      const script = documentObject.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.passDeckGoogle = "true";
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", () => reject(new Error("Google Identity Servicesを読み込めませんでした。")), { once: true });
      documentObject.head.append(script);
    });
  }

  class DriveStateSync {
    constructor(options) {
      this.clientId = options.clientId || "";
      this.getLocalState = options.getLocalState;
      this.applyMergedState = options.applyMergedState;
      this.onStatus = options.onStatus || (() => {});
      this.fetch = options.fetch || globalThis.fetch.bind(globalThis);
      this.accessToken = "";
      this.fileId = "";
      this.profile = null;
      this.tokenClient = null;
      this.syncTimer = null;
      this.syncing = false;
      this.pending = false;
    }

    get configured() {
      return Boolean(this.clientId && !this.clientId.includes("YOUR_"));
    }

    async initialize() {
      if (!this.configured) {
        this.onStatus({ state: "unconfigured" });
        return false;
      }
      try {
        await loadGoogleIdentityScript();
        this.tokenClient = globalThis.google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: `${IDENTITY_SCOPES} ${DRIVE_SCOPE}`,
          callback: (response) => this.handleToken(response),
          error_callback: (error) => this.onStatus({ state: "error", message: error?.message || "Google認証を完了できませんでした。" })
        });
        this.onStatus({ state: "ready" });
        return true;
      } catch (error) {
        this.onStatus({ state: "error", message: error.message });
        return false;
      }
    }

    connect() {
      if (!this.configured) {
        this.onStatus({ state: "unconfigured", message: "google-config.js にOAuthクライアントIDを設定してください。" });
        return;
      }
      if (!this.tokenClient) {
        this.onStatus({ state: "error", message: "Google認証の準備中です。少し待って再試行してください。" });
        return;
      }
      this.onStatus({ state: "authorizing" });
      this.tokenClient.requestAccessToken({ prompt: "consent" });
    }

    async handleToken(response) {
      if (!response?.access_token || response.error) {
        this.onStatus({ state: "error", message: response?.error_description || "Google認証に失敗しました。" });
        return;
      }
      this.accessToken = response.access_token;
      try {
        this.profile = await this.getProfile();
        this.onStatus({ state: "connected", profile: this.profile, message: "Google Driveと同期しています…" });
        await this.syncNow();
      } catch (error) {
        this.onStatus({ state: "error", profile: this.profile, message: error.message });
      }
    }

    async authorizedFetch(url, options = {}) {
      const response = await this.fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ...(options.headers || {})
        }
      });
      if (response.status === 401) {
        this.accessToken = "";
        this.onStatus({ state: "expired", profile: this.profile, message: "同期を続けるには再接続してください。" });
        throw new Error("Googleのアクセストークンが期限切れです。");
      }
      if (!response.ok) {
        let detail = "";
        try { detail = (await response.json())?.error?.message || ""; } catch { /* response is not JSON */ }
        throw new Error(detail || `Google APIエラー (${response.status})`);
      }
      return response;
    }

    async getProfile() {
      const response = await this.authorizedFetch("https://www.googleapis.com/oauth2/v3/userinfo");
      const profile = await response.json();
      return { name: profile.name || profile.email || "Googleユーザー", email: profile.email || "", picture: profile.picture || "" };
    }

    async findFile() {
      const params = new URLSearchParams({
        spaces: "appDataFolder",
        q: `name = '${FILE_NAME}'`,
        fields: "files(id,name,modifiedTime)",
        orderBy: "modifiedTime desc",
        pageSize: "1"
      });
      const response = await this.authorizedFetch(`https://www.googleapis.com/drive/v3/files?${params}`);
      const result = await response.json();
      this.fileId = result.files?.[0]?.id || "";
      return this.fileId;
    }

    async downloadState(fileId) {
      const response = await this.authorizedFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`);
      return response.json();
    }

    async createStateFile(state) {
      const boundary = `pass-deck-${Date.now()}`;
      const metadata = JSON.stringify({ name: FILE_NAME, parents: ["appDataFolder"], mimeType: "application/json" });
      const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(state)}\r\n--${boundary}--`;
      const response = await this.authorizedFetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
        method: "POST",
        headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
        body
      });
      const result = await response.json();
      this.fileId = result.id;
    }

    async updateStateFile(fileId, state) {
      await this.authorizedFetch(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state)
      });
    }

    scheduleSync() {
      if (!this.accessToken) return;
      clearTimeout(this.syncTimer);
      this.syncTimer = setTimeout(() => this.syncNow().catch(() => {}), 900);
    }

    async syncNow() {
      if (!this.accessToken) {
        this.onStatus({ state: "expired", profile: this.profile, message: "Googleへ接続してください。" });
        return;
      }
      if (this.syncing) {
        this.pending = true;
        return;
      }
      this.syncing = true;
      this.onStatus({ state: "syncing", profile: this.profile, message: "同期しています…" });
      try {
        const fileId = this.fileId || await this.findFile();
        const remote = fileId ? await this.downloadState(fileId) : null;
        const merged = mergeStates(this.getLocalState(), remote);
        await this.applyMergedState(merged);
        if (fileId) await this.updateStateFile(fileId, merged);
        else await this.createStateFile(merged);
        this.onStatus({ state: "synced", profile: this.profile, message: "Google Driveと同期済み", syncedAt: new Date().toISOString() });
      } catch (error) {
        this.onStatus({ state: "error", profile: this.profile, message: error.message });
        throw error;
      } finally {
        this.syncing = false;
        if (this.pending) {
          this.pending = false;
          this.scheduleSync();
        }
      }
    }

    disconnect() {
      clearTimeout(this.syncTimer);
      if (this.accessToken && globalThis.google?.accounts?.oauth2) globalThis.google.accounts.oauth2.revoke(this.accessToken);
      this.accessToken = "";
      this.fileId = "";
      this.profile = null;
      this.onStatus({ state: "ready", message: "Google連携を解除しました。端末内の記録は残っています。" });
    }
  }

  return { DRIVE_SCOPE, FILE_NAME, uniqueRecords, newerPlan, mergeStates, DriveStateSync };
});
