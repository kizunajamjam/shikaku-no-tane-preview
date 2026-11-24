(function startCurriculumPlanner() {
  "use strict";

  const engine = globalThis.CurriculumEngine;
  const library = globalThis.PassDeckPlanLibrary;
  const practiceEngine = globalThis.PassDeckPractice;
  const trialQuestions = globalThis.PassDeckTrialQuestions;
  const oracle = globalThis.OracleSilverPack;
  const timedMock = globalThis.PassDeckTimedMock;
  const googleApi = globalThis.PassDeckGoogleSync;
  const storage = globalThis.PassDeckStudyStorage;
  const recallLabels = { independent: "自力でできた", hint: "ヒントが必要", missed: "できなかった" };
  const byId = (id) => document.getElementById(id);
  const ui = {
    setupView: byId("setup-view"),
    planView: byId("plan-view"),
    planActions: byId("plan-actions"),
    planSelect: byId("plan-select"),
    allRecords: byId("all-records"),
    installApp: byId("install-app"),
    googleConnect: byId("google-connect"),
    accountMenu: byId("account-menu"),
    accountAvatar: byId("account-avatar"),
    accountName: byId("account-name"),
    accountEmail: byId("account-email"),
    syncStatus: byId("sync-status"),
    setupError: byId("setup-error"),
    planHeading: byId("plan-heading"),
    planPeriod: byId("plan-period"),
    progressOrbit: byId("progress-orbit"),
    progressPercent: byId("progress-percent"),
    statCompleted: byId("stat-completed"),
    statActual: byId("stat-actual"),
    statConfidence: byId("stat-confidence"),
    todayCard: byId("today-card"),
    todayPhase: byId("today-phase"),
    todayDate: byId("today-date"),
    todayTitle: byId("today-title"),
    todayDomains: byId("today-domains"),
    todayTasks: byId("today-tasks"),
    recallList: byId("recall-list"),
    reviewSummary: byId("review-summary"),
    reviewForm: byId("review-item-form"),
    reviewDomain: byId("review-domain"),
    reviewQuestion: byId("review-question"),
    reviewAnswer: byId("review-answer"),
    reviewItems: byId("review-items"),
    recordForm: byId("record-form"),
    actualMinutes: byId("actual-minutes"),
    confidence: byId("confidence"),
    studyNote: byId("study-note"),
    recordError: byId("record-error"),
    phaseTimeline: byId("phase-timeline"),
    scheduleList: byId("schedule-list"),
    recordsList: byId("records-list"),
    toast: byId("toast")
  };

  let state = normalizeState();
  let saving = false;
  let recallTasks = [];
  let recordLimit = 30;
  let selectedSessionId = null;
  let practice = null;
  let displayedStudyDate = "";
  let dayTimer;
  let toastTimer = null;
  let deferredInstallPrompt = null;
  let googleSync = null;

  function normalizeState(value) {
    const [plan = null, ...otherPlans] = library.plansIn(value)
      .filter((entry) => Array.isArray(entry.sessions) && entry.config)
      .map((entry) => ({ ...entry }));
    return oracle.includeCards({
      plan, otherPlans,
      records: Array.isArray(value?.records) ? value.records.filter(validRecord) : [],
      harvests: Array.isArray(value?.harvests) ? value.harvests.filter((entry) =>
        typeof entry?.id === "string" && Number.isFinite(Date.parse(entry.completedAt))) : [],
      items: Array.isArray(value?.items) ? value.items.filter((item) =>
        item && ["id", "planId", "domain", "question", "answer"].every((key) => typeof item[key] === "string")) : [],
      resetAt: typeof value?.resetAt === "string" ? value.resetAt : "",
      updatedAt: typeof value?.updatedAt === "string" ? value.updatedAt : ""
    });
  }

  function validRecord(record) {
    return Boolean(record && typeof record.planId === "string" && typeof record.sessionId === "string" && typeof record.completedAt === "string");
  }

  async function saveState(next, notifyGoogle = true) {
    if (saving) return false;
    saving = true;
    try {
      const nextTime = Math.max(Date.now(), (Date.parse(state.updatedAt) || 0) + 1);
      const snapshot = { ...next, updatedAt: new Date(nextTime).toISOString() };
      await storage.save(snapshot, state.updatedAt);
      state = snapshot;
      if (notifyGoogle) googleSync?.scheduleSync();
      return true;
    } catch (error) {
      console.warn("保存に失敗しました。", error);
      showToast("保存できませんでした。別のタブで更新した場合は再読み込みしてください");
      return false;
    } finally {
      saving = false;
    }
  }

  function newId(prefix) {
    return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
  }

  function createNode(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  const siteMenu = byId("site-menu");
  const menuLinks = [...siteMenu.querySelectorAll("nav a")];

  function renderNavigation(focusHeading = false) {
    const link = menuLinks.find((entry) => entry.hash === location.hash) || menuLinks[0];
    const page = link.hash.slice(1);
    const home = page === "home";
    const inPlan = ui.planView.classList.contains("active");
    byId("open-menu").hidden = !inPlan || Boolean(practice);
    ui.planView.querySelectorAll("[data-page]").forEach((section) => {
      section.hidden = section.dataset.page !== page || Boolean(practice);
    });
    ui.planView.querySelector(".practice-panel").hidden = !home && !practice;
    byId("section-header").hidden = home || Boolean(practice);
    byId("section-title").textContent = link.textContent;
    for (const entry of menuLinks) {
      if (entry === link) entry.setAttribute("aria-current", "page");
      else entry.removeAttribute("aria-current");
    }
    if (focusHeading && inPlan && !practice) {
      (home ? byId("plan-heading") : byId("section-title")).focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }

  byId("open-menu").addEventListener("click", () => siteMenu.showModal());
  byId("close-menu").addEventListener("click", () => siteMenu.close());
  siteMenu.addEventListener("click", (event) => {
    if (event.target === siteMenu || event.target.closest("nav a")) siteMenu.close();
  });
  window.addEventListener("hashchange", () => renderNavigation(true));
  document.querySelector(".skip-link").addEventListener("click", (event) => {
    event.preventDefault();
    byId("main").focus();
  });

  function showView(name) {
    ui.setupView.classList.toggle("active", name === "setup");
    ui.planView.classList.toggle("active", name === "plan");
    renderNavigation();
    ui.planActions.hidden = name !== "plan" || Boolean(practice);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function applyMergedState(merged) {
    const previousId = state.plan?.id;
    const next = normalizeState(merged);
    next.updatedAt = state.updatedAt;
    if (JSON.stringify(next) === JSON.stringify(state)) return;
    if (!await saveState(next, false)) throw new Error("同期データを端末に保存できませんでした。");
    if (previousId !== state.plan?.id) clearPlanInputs();
    if (!state.plan?.sessions.some((session) => session.id === selectedSessionId)) selectedSessionId = null;
    if (state.plan) {
      renderPlan();
      showView("plan");
    } else {
      renderSetup();
      showView("setup");
    }
  }

  function showToast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ui.toast.classList.remove("show"), 2400);
  }

  function formatDate(dateKey, options = { year: "numeric", month: "short", day: "numeric" }) {
    const date = engine.parseDateKey(dateKey);
    return date ? new Intl.DateTimeFormat("ja-JP", options).format(date) : "—";
  }

  function formatMinutes(total) {
    if (total > 0 && total < 1) return "1分未満";
    total = Math.round(total);
    if (total < 60) return `${total}分`;
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    return `${hours}時間${minutes ? `${minutes}分` : ""}`;
  }

  function renderSetup() {
    ui.setupError.hidden = true;
    byId("cancel-plan").hidden = !state.plan;
    byId("quick-start").hidden = Boolean(state.plan);
    byId("oracle-start").hidden = false;
  }

  async function createPlan(title, domains, pack = null) {
    const quickStart = !pack;
    const startDate = engine.toDateKey();
    const result = engine.generateCurriculum({
      title,
      startDate,
      targetDate: engine.addDays(startDate, quickStart ? 28 : 83),
      daysPerWeek: quickStart ? 1 : 7,
      minutesPerSession: quickStart ? 5 : 15,
      level: "beginner",
      domains
    });
    if (result.errors.length) {
      showToast(result.errors.join(" "));
      return;
    }
    result.plan.selfPaced = !quickStart;
    result.plan.id = newId("plan");
    result.plan.qualificationId = result.plan.id;
    const next = library.selectPlan(state, result.plan);
    if (quickStart) {
      result.plan.trial = true;
      next.items = [...state.items, ...practiceEngine.buildTrialItems(result.plan, trialQuestions.cards)];
    } else {
      result.plan.packId = pack.id;
      result.plan.oracleEdition = 2;
      next.items = [...state.items, ...pack.cards.map((card) => ({
        ...card, cardId: card.id, id: result.plan.id + "-" + card.id, planId: result.plan.id,
        qualificationId: result.plan.qualificationId, createdAt: result.plan.generatedAt
      }))];
    }
    if (!await saveState(next)) return;
    clearPlanInputs();
    renderPlan();
    showView("plan");
    if (location.hash) location.hash = "home";
    startPractice("mini");
  }

  function currentPlanRecords() {
    return engine.planRecords(state.plan, state.records);
  }

  function clearPlanInputs() {
    byId("pass-confirmation").hidden = true;
    selectedSessionId = null;
    practice = null;
    recordLimit = 30;
    ui.allRecords.checked = false;
    ui.reviewForm.reset();
  }

  async function switchPlan() {
    const plan = library.plansIn(state).find((entry) => entry.id === ui.planSelect.value);
    if (!plan || plan.id === state.plan.id) return;
    if (!await saveState(library.selectPlan(state, plan), false)) {
      ui.planSelect.value = state.plan.id;
      return;
    }
    clearPlanInputs();
    renderPlan();
  }

  function currentSession() {
    if (!state.plan) return null;
    const completed = new Set(currentPlanRecords().map((record) => record.sessionId));
    const selected = state.plan.sessions.find((session) => session.id === selectedSessionId && !completed.has(session.id));
    return selected || engine.nextPendingSession(state.plan, state.records);
  }

  function renderPlan(preserveDraft = false) {
    const plan = state.plan;
    if (!plan) return;
    const stats = engine.computePlanStats(plan, state.records);
    const plans = library.plansIn(state).sort((a, b) =>
      a.generatedAt.localeCompare(b.generatedAt) || a.id.localeCompare(b.id));
    ui.planSelect.replaceChildren(...plans.map((entry, index) => {
      const option = createNode("option", "", `${index + 1}. ${entry.config.title}（${formatDate(entry.config.startDate)} 開始）`);
      option.value = entry.id;
      return option;
    }));
    ui.planSelect.value = plan.id;
    ui.planHeading.textContent = plan.config.title;
    ui.planPeriod.textContent = plan.selfPaced ? `${formatDate(plan.config.startDate)} 学習開始` : `${formatDate(plan.config.startDate)} — ${formatDate(plan.config.targetDate)} ／ 週${plan.config.daysPerWeek}日・1回${plan.config.minutesPerSession}分`;
    ui.progressOrbit.style.setProperty("--progress", stats.percent);
    ui.progressPercent.textContent = String(stats.percent);
    ui.statCompleted.textContent = String(stats.completed);
    ui.statActual.textContent = formatMinutes(stats.actualMinutes);
    ui.statConfidence.textContent = stats.averageConfidence === null ? "—" : `${stats.averageConfidence} / 5`;
    renderNextSession(preserveDraft);
    renderPhases();
    renderSchedule();
    renderRecords();
    renderReviewItems();
    renderPractice();
  }

  function renderReviewItems() {
    const previousDomain = ui.reviewDomain.value;
    ui.reviewDomain.replaceChildren(...state.plan.config.domains.map((domain) => {
      const option = createNode("option", "", domain);
      option.value = domain;
      return option;
    }));
    if (state.plan.config.domains.includes(previousDomain)) ui.reviewDomain.value = previousDomain;
    const schedule = engine.getReviewSchedule(state.plan, state.items, state.records);
    ui.reviewItems.replaceChildren(...schedule.map(({ item, status, dueDate }) => {
      const row = createNode("li");
      const next = dueDate ? `次回 ${formatDate(dueDate, { month: "short", day: "numeric" })}`
        : status === "ended" ? "計画期間終了" : "未学習";
      row.append(createNode("strong", "", item.question), createNode("span", "", `${item.domain} ／ ${next}`));
      return row;
    }));
  }

  async function submitReviewItem(event) {
    event.preventDefault();
    if (saving || !state.plan) return;
    const question = ui.reviewQuestion.value.trim();
    const answer = ui.reviewAnswer.value.trim();
    const distractors = byId("review-distractors").value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (distractors.length > 3 || new Set([answer, ...distractors]).size !== distractors.length + 1) {
      showToast("誤答は正解と異なる選択肢を3つまで入力してください");
      return;
    }
    const domain = ui.reviewDomain.value;
    if (!question || !answer || !state.plan.config.domains.includes(domain)) {
      showToast("学習分野・問い・答えまたは参照先を入力してください");
      return;
    }
    const item = { id: newId("item"), planId: state.plan.id, qualificationId: state.plan.qualificationId || state.plan.id,
      domain, question, answer, ...(distractors.length ? { distractors } : {}), createdAt: new Date().toISOString() };
    if (!await saveState({ ...state, items: [...state.items, item] })) return;
    ui.reviewQuestion.value = "";
    ui.reviewAnswer.value = "";
    byId("review-distractors").value = "";
    renderReviewItems();
    renderPractice();
    renderNextSession(true);
    showToast("問いを端末に保存しました");
    ui.reviewQuestion.focus();
  }

  function recallCard(task) {
    const card = createNode("article", "recall-card");
    const label = task.kind === "new" ? "新規" : task.kind === "overdue" ? "期限超過" : "復習";
    card.append(createNode("p", "recall-meta", `${label} ／ ${task.item.domain} ／ ${task.minutes}分`),
      createNode("h4", "", task.item.question));
    const disclosure = createNode("details");
    disclosure.append(createNode("summary", "", "答え・参照先を表示"), createNode("p", "recall-answer", task.item.answer));
    const rating = createNode("label", "recall-rating", "思い出せましたか？");
    const select = createNode("select");
    select.append(createNode("option", "", "未評価"));
    select.firstChild.value = "";
    for (const [value, text] of Object.entries(recallLabels)) {
      const option = createNode("option", "", text);
      option.value = value;
      select.append(option);
    }
    rating.append(select);
    disclosure.append(rating);
    card.append(disclosure);
    return { card, select, item: task.item };
  }

  function renderNextSession(preserveDraft = false) {
    const session = currentSession();
    const previousDraft = preserveDraft ? new Map(recallTasks.map(({ item, select }) =>
      [item.id, { value: select.value, open: select.closest("details").open }])) : new Map();
    recallTasks = [];
    ui.recallList.replaceChildren();
    ui.reviewSummary.textContent = "";
    if (!session) {
      ui.todayCard.classList.add("complete-state");
      ui.todayPhase.textContent = "完了";
      ui.todayDate.textContent = "全セッション完了";
      ui.todayTitle.textContent = "カリキュラムを完走しました";
      ui.todayDomains.textContent = "記録を振り返り、必要なら条件を変更して次の計画を作りましょう。";
      ui.todayTasks.replaceChildren(createNode("li", "", "学習記録から、理解度が低かった分野を確認する"));
      ui.recordForm.hidden = true;
      return;
    }
    ui.todayCard.classList.remove("complete-state");
    ui.recordForm.hidden = false;
    ui.todayPhase.textContent = session.phaseLabel;
    ui.todayDate.textContent = `${formatDate(session.date, { month: "long", day: "numeric", weekday: "short" })} ／ ${session.plannedMinutes}分`;
    ui.todayTitle.textContent = session.title;
    ui.todayDomains.textContent = `対象：${session.focusDomains.join("・")}`;
    ui.todayTasks.replaceChildren();
    const today = engine.toDateKey();
    const daily = today >= state.plan.config.startDate && (state.plan.selfPaced || today <= state.plan.config.targetDate)
      ? engine.buildDailyStudy(state.plan, state.items, state.records, session.date,
        Math.min(session.plannedMinutes, Math.max(6, Math.floor(session.plannedMinutes / 2))), today)
      : { tasks: [], plannedMinutes: 0, deferredReviewCount: 0, deferredNewCount: 0 };
    let replacedMinutes = daily.plannedMinutes;
    session.tasks.forEach((task) => {
      const consumed = Math.min(replacedMinutes, task.minutes);
      replacedMinutes -= consumed;
      const minutes = task.minutes - consumed;
      if (!minutes) return;
      const item = createNode("li");
      item.append(createNode("span", "task-time", `${minutes}分`), createNode("span", "", task.label));
      ui.todayTasks.append(item);
    });
    recallTasks = daily.tasks.map(recallCard);
    for (const { card, item, select } of recallTasks) {
      const draft = previousDraft.get(item.id);
      if (draft) {
        select.value = draft.value;
        select.closest("details").open = draft.open;
      }
      ui.recallList.append(card);
    }
    if (daily.deferredReviewCount || daily.deferredNewCount) {
      ui.reviewSummary.textContent = `今回の時間枠に入りきらない問いは次回へ（復習 ${daily.deferredReviewCount}件・新規 ${daily.deferredNewCount}件）。`;
    }
    if (!preserveDraft) {
      ui.actualMinutes.value = "";
      ui.actualMinutes.placeholder = String(session.plannedMinutes);
      ui.confidence.value = "";
      ui.studyNote.value = "";
    }
    ui.recordError.hidden = true;
  }

  function renderPhases() {
    const completed = new Set(currentPlanRecords().map((record) => record.sessionId));
    ui.phaseTimeline.replaceChildren();
    state.plan.phases.forEach((phase, index) => {
      const phaseSessions = state.plan.sessions.filter((session) => session.phaseId === phase.id);
      const done = phaseSessions.filter((session) => completed.has(session.id)).length;
      const card = createNode("article", "phase-card");
      if (done === phase.sessionCount) card.classList.add("done");
      card.append(createNode("span", "phase-number", String(index + 1).padStart(2, "0")));
      const body = createNode("div", "phase-body");
      body.append(
        createNode("span", "phase-principle", phase.principle),
        createNode("h3", "", phase.label),
        createNode("p", "", phase.goal),
        createNode("small", "", `${formatDate(phase.startDate, { month: "short", day: "numeric" })} — ${formatDate(phase.endDate, { month: "short", day: "numeric" })} ／ ${done} / ${phase.sessionCount} 完了`)
      );
      card.append(body);
      ui.phaseTimeline.append(card);
    });
  }

  function renderSchedule() {
    const completed = new Set(currentPlanRecords().map((record) => record.sessionId));
    const next = currentSession();
    ui.scheduleList.replaceChildren();
    state.plan.sessions.forEach((session) => {
      const isDone = completed.has(session.id);
      const row = createNode("button", `schedule-row${isDone ? " done" : ""}${next?.id === session.id ? " current" : ""}`);
      row.type = "button";
      row.disabled = isDone;
      row.append(
        createNode("span", "schedule-check", isDone ? "✓" : String(session.index).padStart(2, "0")),
        createNode("span", "schedule-date", formatDate(session.date, { month: "short", day: "numeric", weekday: "short" })),
        createNode("span", "schedule-title", session.title),
        createNode("span", "schedule-minutes", `${session.plannedMinutes}分`)
      );
      if (!isDone) row.addEventListener("click", () => {
        if (saving) return;
        selectedSessionId = session.id;
        renderNextSession();
        renderSchedule();
        document.getElementById("today-card").scrollIntoView({ behavior: "smooth", block: "start" });
      });
      ui.scheduleList.append(row);
    });
  }

  function renderRecords() {
    ui.recordsList.replaceChildren();
    const records = state.records.filter((record) => ui.allRecords.checked || engine.belongsToGoal(state.plan, record))
      .sort((left, right) => right.completedAt.localeCompare(left.completedAt));
    if (!records.length) {
      ui.recordsList.append(createNode("div", "empty-state", "セッションを完了すると、実績時間・理解度・メモがここに残ります。"));
      return;
    }
    records.slice(0, recordLimit).forEach((record) => {
      const card = createNode("article", "record-card");
      const top = createNode("div", "record-top");
      top.append(createNode("strong", "", record.sessionTitle), createNode("span", "",
        `${formatMinutes(record.actualMinutes)}${record.confidence ? ` ／ 理解度${record.confidence}` : ""}`));
      const date = new Date(record.completedAt);
      card.append(
        top,
        createNode("p", "record-meta", `${record.planTitle}・${record.phaseLabel}・${new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date)}`)
      );
      if (Array.isArray(record.recallResults) && record.recallResults.length) {
        const results = createNode("ul", "record-recall");
        for (const result of record.recallResults) {
          const item = state.items.find((entry) => entry.id === result?.itemId && entry.planId === record.planId);
          const label = recallLabels[result?.outcome];
          if (typeof label !== "string") continue;
          results.append(createNode("li", "", `${result.domain || item?.domain || "復習"} ／ ${result.question || item?.question || "登録した問い"} ／ ${label}`));
        }
        if (results.childElementCount) card.append(results);
      }
      if (record.note) card.append(createNode("p", "record-note", record.note));
      if (record.mock) card.append(createNode("p", "record-note", practiceEngine.describeResult(record.mock)));
      ui.recordsList.append(card);
    });
    if (records.length > recordLimit) {
      const more = createNode("button", "ghost-button", "以前の記録を表示");
      more.type = "button";
      more.addEventListener("click", () => {
        const previousLimit = recordLimit;
        recordLimit += 30;
        renderRecords();
        const firstAdded = ui.recordsList.children[previousLimit];
        firstAdded.tabIndex = -1;
        firstAdded.focus();
      });
      ui.recordsList.append(more);
    }
  }

  function practiceContext() {
    const today = engine.toDateKey();
    const records = state.records.filter((record) => engine.belongsToGoal(state.plan, record));
    const schedule = engine.getReviewSchedule(state.plan, state.items, records, today);
    const progress = practiceEngine.gameProgress(records, today);
    if (schedule.length) {
      progress.todayCount = schedule.filter(({ item }) => progress.lastSeen.get(item.id)?.startsWith(today)).length;
    }
    const habit = practiceEngine.studyHabit(state.records, today);
    return { today, records, schedule, progress, habit };
  }

  function renderPassRecord() {
    const goalId = state.plan.qualificationId || state.plan.id;
    const record = state.harvests.find((entry) => entry.id === goalId);
    byId("pass-record").hidden = Boolean(state.plan.trial);
    const status = byId("pass-record-date");
    status.hidden = !record;
    status.textContent = record ? `本試験合格　${formatDate(engine.toDateKey(new Date(record.completedAt)))}` : "";
    byId("record-pass").hidden = Boolean(record);
    if (record) byId("pass-confirmation").hidden = true;
  }
  async function recordExamPass() {
    if (saving || !state.plan || state.plan.trial || practice) return;
    const id = state.plan.qualificationId || state.plan.id;
    if (state.harvests.some((entry) => entry.id === id)) return;
    const harvests = [...state.harvests, { id, completedAt: new Date().toISOString() }];
    if (!await saveState({ ...state, harvests })) return;
    byId("pass-confirmation").hidden = true;
    renderPractice();
    byId("pass-record-date").focus();
    showToast("合格おめでとうございます。合格日を保存しました！");
  }

  function renderPractice() {
    const { today, records, schedule, progress, habit } = practiceContext();
    const isOracle = state.plan.packId === oracle.id;
    byId("trial-oracle-start").hidden = !state.plan.trial;
    timedMock.setMaterial(isOracle ? oracle.exam : null, state.plan.qualificationId || state.plan.id);
    byId("oracle-diagnosis").hidden = !isOracle;
    if (isOracle && !practice) renderOracleDiagnosis(schedule, records, today, progress.lastSeen);
    displayedStudyDate = today;
    renderPassRecord();
    byId("exam-outlook").hidden = Boolean(state.plan.trial);
    if (!state.plan.trial) {
      const estimate = engine.estimateExamWindow(state.plan, state.items, state.records, today);
      byId("exam-basis").hidden = !estimate.earlyDate;
      byId("exam-estimate").textContent = estimate.earlyDate
        ? `${formatDate(estimate.earlyDate)}〜${formatDate(estimate.lateDate)}ごろが候補です。登録した問いが試験範囲をカバーし、本番形式の模試でも合格ラインに届いたら、受験を検討しましょう。`
        : estimate.message;
      byId("exam-explanation").textContent = estimate.earlyDate ? estimate.message : "";
    }
    const target = progress.gentleStart ? 1 : Math.min(3, schedule.length || 3);
    const complete = progress.todayCount >= target;
    byId("quest-title").textContent = complete ? "今日の目標クリア" : "今日の目標";
    byId("quest-count").textContent = `${Math.min(progress.todayCount, target)} / ${target} 問`;
    byId("quest-progress").max = target;
    byId("quest-progress").value = Math.min(progress.todayCount, target);
    byId("quest-level").textContent = `Lv. ${progress.level}　·　${progress.xp} XP`;
    const studiedToday = habit.studiedToday;
    const streak = byId("daily-streak");
    streak.classList.toggle("earned", studiedToday);
    streak.textContent = studiedToday ? `✓ 全資格で${habit.currentStreak}日連続`
      : habit.currentStreak ? `今日の1問で${habit.currentStreak + 1}日連続` : "今日の1問で連続記録スタート";
    byId("start-mini").textContent = complete ? "もう少し解く" : progress.gentleStart ? "1問だけ解く" : "今日のチャレンジを始める";
    byId("challenge-intro").textContent = progress.gentleStart && !complete
      ? (progress.gentleStart === "return" ? "おかえりなさい。今日は1問で再開できます。" : "まずは1問から始めましょう。")
      : schedule.length
      ? `復習日が来た問いを優先して、${Math.min(3, schedule.length)}問。` : "学び方の練習問題を3問。";
    byId("habit-summary").textContent = `全資格で連続 ${habit.currentStreak}日 · 自己ベスト ${habit.longestStreak}日`;
    byId("activity-week").replaceChildren(...Array.from({ length: 7 }, (_, index) => {
      const date = engine.addDays(today, index - 6);
      const active = habit.dates.has(date);
      const day = createNode("li", active ? "studied" : "", index === 6 ? "今日" : date.slice(-2).replace(/^0/, "") + "日");
      const description = `${formatDate(date)} ${active ? "学習済み" : "記録なし"}`;
      day.title = description;
      const status = createNode("span", "day-mark", active ? "✓" : "·");
      status.setAttribute("aria-hidden", "true");
      day.append(status, createNode("span", "sr-only", description));
      return day;
    }));
    const solved = schedule.filter(({ item }) => progress.solvedItems.has(item.id)).length;
    const due = schedule.filter(({ dueDate }) => dueDate && dueDate <= today).length;
    byId("solved-stat").textContent = schedule.length ? `自力正解したことがある問い ${solved} / ${schedule.length}問` : "練習問題は未登録";
    byId("review-status").textContent = schedule.length
      ? (due ? `復習日が来た問い ${due}問` : "今日が復習期限の問いはありません")
      : "登録すると、問いごとの進み具合が見られます。";
    byId("start-mock").disabled = schedule.length === 0;
    const mockSource = state.plan.trial ? "学び方の練習セット" : "登録した問い";
    byId("mock-availability").textContent = schedule.length
      ? `${mockSource}から${Math.min(10, schedule.length)}問を出題。選択式は自動で採点します。`
      : "メニューの「練習問題」で問いを追加すると受けられます。";
    if (isOracle && schedule.length) byId("mock-availability").textContent =
      `未解答を優先し、分野を分散して${Math.min(10, schedule.length)}問出題します。結果は今回の練習セットに対する成績です。`;
    byId("trial-mock-note").hidden = !state.plan.trial;
    const last = records.filter((r) => r.mock).sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
    byId("mock-result").textContent = last ? "直近の模試　" + practiceEngine.describeResult(last.mock) : "";
    const mark = byId("pass-mark");
    const goalId = state.plan.qualificationId || state.plan.id;
    if (mark.dataset.goal !== goalId) {
      mark.value = last?.mock.passMark ?? (state.plan.packId === oracle.id ? 60 : 70);
      mark.dataset.goal = goalId;
    }
    ui.planView.classList.toggle("in-practice", Boolean(practice));
    renderNavigation();
    ui.planActions.hidden = Boolean(practice);
    byId("practice-options").hidden = Boolean(practice);
    const summary = practice?.stage === "summary";
    byId("practice-run").hidden = !practice || summary;
    byId("challenge-result").hidden = !summary;
    if (!practice) return;
    const { kind, item, stage, index, questions, feedback, missed, xp, correct, retry, startingLevel } = practice;
    if (summary) {
      byId("challenge-title").textContent = retry ? "再挑戦完了" : "チャレンジクリア";
      byId("challenge-score").textContent = `${questions.length}問中 ${correct}問正解`;
      byId("challenge-reward").textContent = [
        ...(xp ? [`＋${xp} XP`] : ["復習を記録しました"]),
        ...(progress.level > startingLevel ? [`レベルアップ！ Lv. ${progress.level}`] : []),
      ].join("　·　");
      byId("challenge-missed").replaceChildren(...missed.map(({ question }) => createNode("li", "", question)));
      byId("retry-challenge").hidden = !missed.length;
      byId("repeat-challenge").className = missed.length ? "ghost-button" : "primary-button";
      return;
    }
    const label = kind === "mock" ? "簡易模試" : practice.domainPractice ? "分野別演習" : retry ? "再挑戦" : "今日のチャレンジ";
    const mode = `${label}　${index + 1} / ${questions.length} 問`;
    byId("practice-position").textContent = (practice.revisit && index === 0 ? "昨日のリベンジ　·　" : "") + mode + "　·　" + item.domain;
    byId("practice-question").textContent = item.question;
    const gradedChoice = stage === "saved" && practice.selectedChoice !== undefined;
    const wrongChoice = gradedChoice && practice.selectedChoice !== item.answer;
    const verdict = byId("practice-verdict");
    if (gradedChoice) verdict.dataset.result = wrongChoice ? "incorrect" : "correct";
    else delete verdict.dataset.result;
    verdict.textContent = gradedChoice ? (wrongChoice ? "× 不正解" : "✓ 正解") : stage === "saved" ? practice.selfAssessment : "";
    byId("practice-answer").textContent = stage === "question" ? "" :
      (wrongChoice ? "あなたの回答　" + practice.selectedChoice + "\n" : "") +
      (gradedChoice ? "正しい答え　" : "") + item.answer + (item.explanation ? "\n\n解説　" + item.explanation : "");
    byId("practice-answer").hidden = stage === "question";
    if (stage !== "question" && state.plan.packId === oracle.id) {
      const card = oracle.cards.find((entry) => entry.id === item.cardId);
      if (card) {
        const source = createNode("a", "", "Oracle公式資料で確認");
        source.href = "https://docs.oracle.com/en/database/oracle/oracle-database/19/" + card.doc;
        source.target = "_blank";
        source.rel = "noopener noreferrer";
        byId("practice-answer").append(document.createElement("br"), source);
      }
    }
    const choiceBox = byId("practice-choices");
    choiceBox.replaceChildren();
    if (stage === "question") {
      for (const choice of practice.choices) {
        const button = createNode("button", "choice-button", choice);
        button.type = "button";
        button.addEventListener("click", () => gradePractice(choice === item.answer ? "independent" : "missed", choice));
        choiceBox.append(button);
      }
    }
    byId("practice-feedback").textContent = feedback;
    byId("reveal-answer").hidden = stage !== "question" || practice.choices.length > 0;
    byId("grade-correct").hidden = byId("grade-missed").hidden = stage !== "answer";
    const finished = index + 1 === questions.length;
    byId("next-question").hidden = stage !== "saved" || (finished && kind === "mock");
    byId("next-question").textContent = practice.singleStart ? "もう1問解く" : finished ? "チャレンジ結果を見る" : "次の1問へ";
    byId("leave-practice").textContent = finished && stage === "saved" && kind === "mock" ? "結果を見て終了" : "ここで終える";
  }

  function renderOracleDiagnosis(schedule, records, today, lastSeen) {
    const groups = oracle.diagnose(schedule.map(({ item }) => item), records, today);
    const total = groups.reduce((sum, group) => sum + group.retained.length + group.once.length + group.revisit.length + group.unseen.length, 0);
    const retained = groups.reduce((sum, group) => sum + group.retained.length, 0);
    const weak = groups.filter((group) => group.revisit.length).sort((a, b) => b.revisit.length - a.revisit.length);
    byId("oracle-coverage").textContent = `別々の日に自力で正解　${retained}／${total}問`;
    const untried = groups.find((group) => group.unseen.length);
    const delayed = groups.map((group) => ({ domain: group.domain,
      questions: group.once.filter((item) => !lastSeen.get(item.id)?.startsWith(today)) }))
      .find((group) => group.questions.length);
    const recommended = weak[0] || untried || delayed;
    const next = byId("oracle-next");
    next.hidden = !recommended;
    if (recommended) {
      const questions = weak.length ? recommended.revisit : untried ? recommended.unseen : recommended.questions;
      next.textContent = recommended.domain + (weak.length ? "の苦手問題を復習" : untried ? "の未解答に挑戦" : "を別の日に解き直す");
      next.onclick = () => startPractice("mini", questions.slice(0, 3), true);
    }
    byId("oracle-domains").replaceChildren(...groups.map((group) => {
      const row = createNode("li", "", `${group.domain}　未解答${group.unseen.length}・要復習${group.revisit.length}・自力正解1日${group.once.length}・別日正解${group.retained.length}`);
      return row;
    }));
  }

  function startPractice(kind, retryQuestions, domainPractice = false) {
    if (saving || !state.plan) return;
    const { today, schedule, progress } = practiceContext();
    const mark = byId("pass-mark");
    if (kind === "mock" && (!schedule.length || !mark.reportValidity())) return;
    let questions;
    if (kind === "mock") {
      const items = schedule.map(({ item }) => item);
      questions = state.plan.packId === oracle.id ? oracle.sampleMock(items, progress.lastSeen) : practiceEngine.sampleQuestions(items);
    } else {
      questions = retryQuestions || practiceEngine.miniQuestions(schedule, progress.lastSeen, today,
        progress.todayCount ? null : progress.yesterdayResults);
    }
    const previous = progress.yesterdayResults.get(questions[0].id);
    const revisit = kind === "mini" && !retryQuestions && !progress.todayCount &&
      previous?.outcome !== "independent" ? previous?.outcome : null;
    const singleStart = kind === "mini" && !retryQuestions && Boolean(progress.gentleStart) && !progress.todayCount;
    if (singleStart) questions.splice(1);
    practice = { kind, questions, singleStart, revisit, domainPractice, startDay: today, index: 0, correct: 0, passMark: Number(mark.value),
      item: questions[0], xp: 0, missed: [], startingLevel: progress.level, retry: Boolean(retryQuestions) && !domainPractice };
    showPracticeQuestion();
  }

  function showPracticeQuestion() {
    practice.stage = "question";
    const { answer, distractors } = practice.item;
    practice.choices = Array.isArray(distractors) && distractors.length
      ? practiceEngine.sampleQuestions([answer, ...distractors]) : [];
    practice.feedback = "";
    practice.selectedChoice = undefined;
    practice.elapsed = 0;
    practice.visibleSince = performance.now();
    renderPractice();
    returnToPracticeQuestion();
  }

  function returnToPracticeQuestion() {
    byId("practice-question").focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function trackPracticeTime() {
    if (!practice || !["question", "answer"].includes(practice.stage)) return;
    if (practice.visibleSince !== null) practice.elapsed += performance.now() - practice.visibleSince;
    practice.visibleSince = document.hidden ? null : performance.now();
  }

  async function gradePractice(outcome, choice) {
    if (saving || !practice || practice.stage !== (choice === undefined ? "answer" : "question")) return;
    const run = practice;
    trackPracticeTime();
    const now = new Date();
    const today = engine.toDateKey(now);
    const { item, kind } = run;
    const index = run.index + 1;
    const correct = run.correct + Number(outcome === "independent");
    const id = newId(kind);
    const record = {
      id, sessionId: id, kind, planId: state.plan.id, qualificationId: state.plan.qualificationId || state.plan.id,
      planTitle: state.plan.config.title, sessionTitle: kind === "mini" ? "3分学習" : `簡易模試（${index}/${run.questions.length}問）`,
      phaseLabel: item.domain, studyDate: today, completedAt: now.toISOString(), confidence: null,
      actualMinutes: Math.max(1, Math.round(run.elapsed / 1000)) / 60,
      recallResults: [{ itemId: item.id, question: item.question, domain: item.domain, outcome,
        ...(choice === undefined ? {} : { choice }) }]
    };
    if (kind === "mock" && index === run.questions.length) {
      record.mock = { correct, total: index, passMark: run.passMark };
    }
    const { progress, schedule, habit } = practiceContext();
    const earned = !progress.lastSeen.get(item.id)?.startsWith(today);
    if (!await saveState({ ...state, records: [...state.records, record] })) return;
    run.correct = correct;
    if (earned) run.xp += 10;
    if (outcome !== "independent") run.missed.push(item);
    run.stage = "saved";
    run.selectedChoice = choice;
    const reward = earned ? "＋10 XP" : "復習を記録";
    const target = progress.gentleStart ? 1 : Math.min(3, schedule.length || 3);
    const goal = earned && progress.todayCount + 1 === target ? "　今日の目標クリア！" : "";
    if (choice === undefined) {
      run.selfAssessment = outcome === "independent" ? "自力で解けました" : "復習として記録しました";
    }
    run.feedback = reward + goal;
    if (run.revisit && index === 1 && today === run.startDay && outcome === "independent") {
      run.feedback = (run.revisit === "hint" ? "昨日はヒントを見た問題、今日は自力で解けました！"
        : "昨日は解けなかった問題、今日は自力で解けました！") + "　" + reward + goal;
    }
    run.feedback += streakReward(habit);
    if (record.mock) run.feedback += "　" + practiceEngine.describeResult(record.mock);
    renderPlan(true);
    returnToPracticeQuestion();
  }

  function nextPracticeQuestion() {
    if (saving || practice?.stage !== "saved") return;
    if (practice.singleStart) {
      startPractice("mini");
      return;
    }
    if (practice.index + 1 === practice.questions.length) {
      if (practice.kind === "mini") {
        practice.stage = "summary";
        renderPractice();
        byId("challenge-title").focus();
      }
      return;
    }
    practice.item = practice.questions[++practice.index];
    showPracticeQuestion();
  }

  function leavePractice() {
    if (saving || !practice) return;
    const trigger = practice.domainPractice || practice.kind === "mock" ? byId("start-mock") : byId("start-mini");
    practice = null;
    renderPractice();
    trigger.focus();
  }

  function streakReward(habit) {
    return habit.studiedToday ? "" : `　全資格で${habit.currentStreak + 1}日連続！`;
  }
  async function submitRecord(event) {
    event.preventDefault();
    if (saving) return;
    const session = currentSession();
    if (!session) return;
    const actualMinutes = Number(ui.actualMinutes.value);
    const confidence = ui.confidence.value ? Number(ui.confidence.value) : null;
    if (!Number.isInteger(actualMinutes) || actualMinutes < 1 || actualMinutes > 360) {
      ui.recordError.textContent = "実績時間を1〜360分で入力してください。";
      ui.recordError.hidden = false;
      return;
    }
    if (currentPlanRecords().some((record) => record.sessionId === session.id)) return;
    const now = new Date();
    const record = {
      id: newId("record"),
      planId: state.plan.id,
      qualificationId: state.plan.qualificationId || state.plan.id,
      planTitle: state.plan.config.title,
      sessionId: session.id,
      sessionTitle: session.title,
      phaseId: session.phaseId,
      phaseLabel: session.phaseLabel,
      scheduledDate: session.date,
      studyDate: engine.toDateKey(now),
      completedAt: now.toISOString(),
      actualMinutes,
      confidence,
      note: ui.studyNote.value.trim(),
      recallResults: recallTasks.filter(({ select }) => select.value).map(({ item, select }) => ({
        itemId: item.id, outcome: select.value, question: item.question, domain: item.domain
      }))
    };
    const { habit } = practiceContext();
    if (!await saveState({ ...state, records: [...state.records, record] })) return;
    selectedSessionId = null;
    renderPlan();
    showToast("学習記録を保存しました" + streakReward(habit));
  }

  async function resetAll() {
    if (saving || !window.confirm("すべての資格の計画、登録した問い、学習記録、合格記録を削除しますか？")) return;
    const resetAt = new Date().toISOString();
    if (!await saveState({ plan: null, otherPlans: [], records: [], items: [], harvests: [], resetAt })) return;
    timedMock.clear();
    clearPlanInputs();
    renderSetup();
    showView("setup");
    showToast("すべてのデータを削除しました");
  }

  function renderGoogleStatus(status) {
    const profile = status.profile || googleSync?.profile;
    const connected = ["connected", "syncing", "synced"].includes(status.state) && profile;
    ui.googleConnect.hidden = status.state === "unconfigured" || Boolean(connected);
    ui.accountMenu.hidden = !connected;
    ui.googleConnect.disabled = status.state === "authorizing";

    if (status.state === "unconfigured") {
      ui.googleConnect.querySelector("span").textContent = "Google同期を設定";
      ui.googleConnect.title = "google-config.js にOAuthクライアントIDを設定してください";
    } else if (status.state === "authorizing") {
      ui.googleConnect.querySelector("span").textContent = "接続中…";
    } else if (status.state === "expired") {
      ui.googleConnect.hidden = false;
      ui.accountMenu.hidden = true;
      ui.googleConnect.querySelector("span").textContent = "Googleに再接続";
    } else if (!connected) {
      ui.googleConnect.querySelector("span").textContent = "Googleで同期";
    }

    if (profile) {
      ui.accountName.textContent = profile.name;
      ui.accountEmail.textContent = profile.email;
      ui.accountAvatar.textContent = (profile.name || profile.email || "G").slice(0, 1).toUpperCase();
      if (profile.picture) {
        ui.accountAvatar.style.backgroundImage = `url("${profile.picture.replaceAll('"', "%22")}")`;
        ui.accountAvatar.classList.add("has-image");
      }
    }
    if (status.message) ui.syncStatus.textContent = status.message;
    if (status.state === "error" && status.message) showToast(status.message);
  }

  async function initializeGoogleSync() {
    if (!googleApi) return;
    googleSync = new googleApi.DriveStateSync({
      clientId: globalThis.PASS_DECK_GOOGLE_CONFIG?.clientId || "",
      getLocalState: () => state,
      applyMergedState,
      onStatus: renderGoogleStatus
    });
    await googleSync.initialize();
  }

  function initializePwa() {
    const installGuide = byId("install-guide");
    const installed = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    const webAppSupported = isSecureContext && location.protocol !== "file:";
    installGuide.hidden = installed || !webAppSupported;
    if ("serviceWorker" in navigator && webAppSupported) {
      navigator.serviceWorker.register("./service-worker.js").catch((error) => console.warn("Service Workerを登録できませんでした。", error));
    }
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      ui.installApp.hidden = false;
    });
    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      ui.installApp.hidden = true;
      installGuide.hidden = true;
      showToast("資格のタネをインストールしました");
    });
  }

  async function installPwa() {
    if (!deferredInstallPrompt) {
      showToast("ブラウザーのメニューからホーム画面への追加を選べます");
      return;
    }
    await deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    if (choice.outcome === "accepted") ui.installApp.hidden = true;
    deferredInstallPrompt = null;
  }

  byId("quick-start").addEventListener("click", () => {
    if (saving || state.plan) return;
    createPlan("お試し学習", [trialQuestions.domain]);
  });
  async function startOracle() {
    if (saving) return;
    const existing = library.plansIn(state).filter((plan) => plan.packId === oracle.id)
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0];
    if (existing) {
      if (!await saveState(library.selectPlan(state, existing))) return;
      clearPlanInputs();
      renderPlan();
      showView("plan");
      if (location.hash) location.hash = "home";
      startPractice("mini");
      return;
    }
    await createPlan(oracle.title, [...new Set(oracle.cards.map((card) => card.domain))], oracle);
  }
  byId("oracle-start").addEventListener("click", startOracle);
  byId("trial-oracle-start").addEventListener("click", startOracle);
  ui.recordForm.addEventListener("submit", submitRecord);
  ui.reviewForm.addEventListener("submit", submitReviewItem);
  byId("start-mini").addEventListener("click", () => startPractice("mini"));
  byId("start-mock").addEventListener("click", () => startPractice("mock"));
  byId("reveal-answer").addEventListener("click", () => {
    if (practice?.stage !== "question") return;
    practice.stage = "answer";
    renderPractice();
    returnToPracticeQuestion();
  });
  byId("grade-correct").addEventListener("click", () => gradePractice("independent"));
  byId("grade-missed").addEventListener("click", () => gradePractice("missed"));
  byId("next-question").addEventListener("click", nextPracticeQuestion);
  byId("leave-practice").addEventListener("click", leavePractice);
  byId("end-challenge").addEventListener("click", leavePractice);
  byId("repeat-challenge").addEventListener("click", () => startPractice("mini"));
  byId("retry-challenge").addEventListener("click", () => {
    if (practice?.stage === "summary" && practice.missed.length) startPractice("mini", practice.missed);
  });
  document.addEventListener("visibilitychange", trackPracticeTime);
  function watchStudyDay() {
    clearTimeout(dayTimer);
    if (document.hidden) return;
    const now = new Date();
    if (state.plan && displayedStudyDate !== engine.toDateKey(now)) renderPractice();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    dayTimer = setTimeout(watchStudyDay, midnight - now + 50);
  }
  document.addEventListener("visibilitychange", watchStudyDay);
  watchStudyDay();
  byId("record-pass").addEventListener("click", () => {
    byId("pass-confirmation").hidden = false;
    byId("confirm-pass").focus();
  });
  byId("confirm-pass").addEventListener("click", recordExamPass);
  byId("cancel-pass").addEventListener("click", () => {
    byId("pass-confirmation").hidden = true;
    byId("record-pass").focus();
  });
  byId("add-plan").addEventListener("click", () => {
    if (saving) return;
    renderSetup();
    showView("setup");
    byId("oracle-start").focus({ preventScroll: true });
  });
  byId("cancel-plan").addEventListener("click", () => {
    if (saving) return;
    showView("plan");
    byId("add-plan").focus({ preventScroll: true });
  });
  ui.planSelect.addEventListener("change", switchPlan);
  ui.allRecords.addEventListener("change", () => { recordLimit = 30; renderRecords(); });
  byId("reset-all").addEventListener("click", resetAll);
  ui.installApp.addEventListener("click", installPwa);
  ui.googleConnect.addEventListener("click", () => googleSync?.connect());
  byId("sync-now").addEventListener("click", () => googleSync?.syncNow().catch(() => {}));
  byId("disconnect-google").addEventListener("click", () => {
    if (!window.confirm("Google連携を解除しますか？ 端末内の学習記録は残ります。")) return;
    googleSync?.disconnect();
    ui.accountMenu.open = false;
  });
  byId("brand-button").addEventListener("click", () => {
    if (state.plan && !practice) location.hash = "home";
    if (state.plan) { renderPlan(); showView("plan"); }
    else showView("setup");
  });

  async function initialize() {
    initializePwa();
    try {
      state = normalizeState(await storage.load());
    } catch (error) {
      console.warn("保存データを読み込めませんでした。", error);
      ui.setupError.textContent = "端末の保存領域を開けませんでした。別のタブを閉じ、再読み込みしてください。";
      ui.setupError.hidden = false;
      return;
    }
    if (state.plan) {
      renderPlan();
      showView("plan");
    } else {
      renderSetup();
      showView("setup");
    }
    await initializeGoogleSync();
  }

  initialize();
})();
