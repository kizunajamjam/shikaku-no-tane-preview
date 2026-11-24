(function exposeStudyStorage(root) {
  "use strict";

  const LEGACY_KEY = "pass-deck-curriculum-v1";
  const STORE = "state";
  const KEY = "guest";
  let database;

  function legacyState() {
    return JSON.parse(localStorage.getItem(LEGACY_KEY));
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("pass-deck", 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("別のタブを閉じて再読み込みしてください。"));
    });
  }

  function updateState(update) {
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const request = store.get(KEY);
      let result;
      let error;
      request.onsuccess = () => {
        try {
          result = update(request.result);
          if (result !== request.result) store.put(result, KEY);
        } catch (cause) {
          error = cause;
          tx.abort();
        }
      };
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(error || tx.error);
    });
  }

  async function load() {
    // The original app also runs directly from index.html.
    if (location.protocol === "file:") return legacyState();
    database = await openDatabase();
    return updateState((saved) => saved === undefined ? (legacyState() ?? {}) : saved);
  }

  async function save(next, expectedUpdatedAt) {
    if (location.protocol === "file:") {
      if ((legacyState()?.updatedAt ?? "") !== expectedUpdatedAt) throw new Error("別のタブで更新されました。");
      localStorage.setItem(LEGACY_KEY, JSON.stringify(next));
      return;
    }
    if (!database) throw new Error("保存領域を初期化できていません。");
    await updateState((saved) => {
      if ((saved?.updatedAt ?? "") !== expectedUpdatedAt) throw new Error("別のタブで更新されました。");
      return next;
    });
  }

  root.PassDeckStudyStorage = { load, save };
})(globalThis);
