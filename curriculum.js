(function exposeCurriculum(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CurriculumEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCurriculumEngine() {
  "use strict";

  const PHASES = [
    {
      id: "diagnostic",
      label: "診断と地図づくり",
      shortLabel: "診断",
      ratio: 0.08,
      goal: "現在地を測り、知っている・曖昧・未学習を分ける",
      principle: "事前テスト"
    },
    {
      id: "foundation",
      label: "基礎理解と最初の想起",
      shortLabel: "基礎",
      ratio: 0.27,
      goal: "新しい知識を小分けに学び、同じ日に一度思い出す",
      principle: "想起練習"
    },
    {
      id: "retrieval",
      label: "間隔を空けた再想起",
      shortLabel: "定着",
      ratio: 0.28,
      goal: "忘れかけた時点で取り出し、長期記憶への経路を強くする",
      principle: "間隔反復"
    },
    {
      id: "integration",
      label: "分野横断と見分ける練習",
      shortLabel: "横断",
      ratio: 0.20,
      goal: "異なる分野を混ぜ、問題に応じた知識を選べるようにする",
      principle: "交互学習"
    },
    {
      id: "simulation",
      label: "本番形式と弱点修正",
      shortLabel: "実戦",
      ratio: 0.12,
      goal: "時間制約の中で解き、誤答原因を知識・読解・時間に分類する",
      principle: "転移とフィードバック"
    },
    {
      id: "taper",
      label: "直前の軽い再想起",
      shortLabel: "直前",
      ratio: 0.05,
      goal: "新しい範囲を増やさず、重要事項と試験手順を軽く確認する",
      principle: "過剰学習の回避"
    }
  ];

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function toDateKey(date = new Date()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function parseDateKey(key) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key || "")) return null;
    const [year, month, day] = key.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return date;
  }

  function addDays(key, amount) {
    const date = parseDateKey(key);
    if (!date) return "";
    date.setDate(date.getDate() + amount);
    return toDateKey(date);
  }

  function daysBetween(startKey, endKey) {
    const start = parseDateKey(startKey);
    const end = parseDateKey(endKey);
    if (!start || !end) return null;
    return Math.round((end.getTime() - start.getTime()) / 86400000);
  }

  function normalizeDomains(value) {
    const raw = Array.isArray(value) ? value : String(value || "").split(/[\n,、]+/);
    return [...new Set(raw.map((item) => String(item).trim()).filter(Boolean))];
  }

  function normalizeConfig(input) {
    return {
      title: String(input?.title || "資格試験").trim().slice(0, 60) || "資格試験",
      startDate: parseDateKey(input?.startDate) ? input.startDate : toDateKey(),
      targetDate: String(input?.targetDate || ""),
      daysPerWeek: Math.round(Number(input?.daysPerWeek) || 4),
      minutesPerSession: Math.round(Number(input?.minutesPerSession) || 30),
      level: ["beginner", "intermediate", "review"].includes(input?.level) ? input.level : "beginner",
      domains: normalizeDomains(input?.domains)
    };
  }

  function validateConfig(input) {
    const config = normalizeConfig(input);
    const errors = [];
    const duration = daysBetween(config.startDate, config.targetDate);
    if (!parseDateKey(config.targetDate)) errors.push("目標日を入力してください。");
    else if (duration < 14) errors.push("研究ベースの段階学習には、目標日まで14日以上確保してください。");
    if (config.daysPerWeek < 1 || config.daysPerWeek > 7) errors.push("週の学習日は1〜7日で指定してください。");
    if (config.minutesPerSession < 5 || config.minutesPerSession > 180) errors.push("1回の学習時間は5〜180分で指定してください。");
    if (!config.domains.length) errors.push("学習分野を1つ以上入力してください。");
    return { config, errors };
  }

  function getStudyWeekdays(startKey, daysPerWeek) {
    const start = parseDateKey(startKey);
    const count = Math.max(1, Math.min(7, daysPerWeek));
    const weekdays = new Set();
    for (let index = 0; index < count; index += 1) {
      weekdays.add((start.getDay() + Math.floor((index * 7) / count)) % 7);
    }
    return weekdays;
  }

  function buildStudyDates(startKey, targetKey, daysPerWeek) {
    const span = daysBetween(startKey, targetKey);
    if (span === null || span < 0) return [];
    const weekdays = getStudyWeekdays(startKey, daysPerWeek);
    const dates = [];
    for (let offset = 0; offset <= span; offset += 1) {
      const key = addDays(startKey, offset);
      if (weekdays.has(parseDateKey(key).getDay())) dates.push(key);
    }
    return dates;
  }

  function activePhaseTemplates(totalSessions) {
    if (totalSessions >= PHASES.length) return PHASES;
    const compactOrder = [PHASES[0], PHASES[2], PHASES[4], PHASES[1], PHASES[3], PHASES[5]];
    return compactOrder.slice(0, totalSessions).sort((left, right) => PHASES.indexOf(left) - PHASES.indexOf(right));
  }

  function allocatePhaseCounts(totalSessions) {
    if (totalSessions <= 0) return [];
    const phases = activePhaseTemplates(totalSessions);
    const counts = phases.map(() => 1);
    let remaining = totalSessions - phases.length;
    const ratioTotal = phases.reduce((sum, phase) => sum + phase.ratio, 0);
    const raw = phases.map((phase) => (remaining * phase.ratio) / ratioTotal);
    raw.forEach((value, index) => {
      const whole = Math.floor(value);
      counts[index] += whole;
      remaining -= whole;
    });
    const remainderOrder = raw
      .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
      .sort((left, right) => right.remainder - left.remainder);
    for (let index = 0; index < remaining; index += 1) counts[remainderOrder[index % remainderOrder.length].index] += 1;
    return phases.map((phase, index) => ({ ...phase, count: counts[index] }));
  }

  function allocateMinutes(total, weights) {
    const result = weights.map((weight) => Math.max(1, Math.floor(total * weight)));
    let difference = total - result.reduce((sum, value) => sum + value, 0);
    let index = 0;
    while (difference !== 0) {
      const direction = difference > 0 ? 1 : -1;
      if (direction > 0 || result[index] > 1) {
        result[index] += direction;
        difference -= direction;
      }
      index = (index + 1) % result.length;
    }
    return result;
  }

  function focusDomains(domains, phaseId, phaseIndex) {
    if (phaseId === "diagnostic" || phaseId === "integration" || phaseId === "simulation" || phaseId === "taper") return domains;
    if (phaseId === "foundation") return [domains[phaseIndex % domains.length]];
    return [domains[phaseIndex % domains.length], domains[(phaseIndex + 1) % domains.length]].filter((value, index, all) => all.indexOf(value) === index);
  }

  function buildTasks(phaseId, totalMinutes, domains) {
    const domainText = domains.join("・");
    const recipes = {
      diagnostic: [
        [0.55, "資料を見ずに診断問題へ回答する"],
        [0.30, "誤答を『未学習・混同・思い出せない』に分類する"],
        [0.15, "分野ごとの現在地を1行で記録する"]
      ],
      foundation: [
        [0.15, "前回内容を白紙から思い出す"],
        [0.45, `${domainText}の新しい範囲を小分けに理解する`],
        [0.30, "資料を閉じて練習問題へ回答する"],
        [0.10, "迷った点と次回の手掛かりを記録する"]
      ],
      retrieval: [
        [0.40, `${domainText}の期限到来項目を資料なしで思い出す`],
        [0.35, "短い問題演習で取り出し方を確認する"],
        [0.15, "正誤にかかわらず根拠をフィードバックで照合する"],
        [0.10, "次に復習する項目を決める"]
      ],
      integration: [
        [0.15, "重要事項を1分ずつ自由再生する"],
        [0.55, `${domainText}を混ぜた問題を解く`],
        [0.20, "似た概念の見分け方を対比して書く"],
        [0.10, "弱点の優先順位を更新する"]
      ],
      simulation: [
        [0.70, "本番と同じ時間制約で模擬セットを解く"],
        [0.20, "誤答原因を『知識・読解・時間』に分類する"],
        [0.10, "次回に変える行動を1つ決める"]
      ],
      taper: [
        [0.45, "最重要事項と直近の誤答だけを軽く再想起する"],
        [0.30, "試験の時間配分と見直し手順を確認する"],
        [0.25, "新規学習を止め、持ち物と睡眠計画を整える"]
      ]
    };
    const recipe = recipes[phaseId];
    const minutes = allocateMinutes(totalMinutes, recipe.map(([weight]) => weight));
    return recipe.map(([, label], index) => ({ label, minutes: minutes[index] }));
  }

  function generateCurriculum(input, now = new Date()) {
    const { config, errors } = validateConfig(input);
    if (errors.length) return { plan: null, errors };
    const studyDates = buildStudyDates(config.startDate, config.targetDate, config.daysPerWeek);
    const allocations = allocatePhaseCounts(studyDates.length);
    const sessions = [];
    const phases = [];
    let cursor = 0;

    allocations.forEach((allocation) => {
      const phaseSessions = [];
      for (let phaseIndex = 0; phaseIndex < allocation.count; phaseIndex += 1) {
        const date = studyDates[cursor];
        const domains = focusDomains(config.domains, allocation.id, phaseIndex);
        const session = {
          id: `${date}-${String(cursor + 1).padStart(3, "0")}`,
          index: cursor + 1,
          date,
          phaseId: allocation.id,
          phaseLabel: allocation.label,
          title: `${allocation.shortLabel}セッション ${phaseIndex + 1}`,
          focusDomains: domains,
          plannedMinutes: config.minutesPerSession,
          tasks: buildTasks(allocation.id, config.minutesPerSession, domains)
        };
        sessions.push(session);
        phaseSessions.push(session);
        cursor += 1;
      }
      phases.push({
        id: allocation.id,
        label: allocation.label,
        goal: allocation.goal,
        principle: allocation.principle,
        sessionCount: phaseSessions.length,
        startDate: phaseSessions[0].date,
        endDate: phaseSessions.at(-1).date
      });
    });

    const generatedAt = now.toISOString();
    return {
      errors: [],
      plan: {
        id: `plan-${now.getTime()}`,
        generatedAt,
        config,
        sessions,
        phases,
        totalMinutes: sessions.length * config.minutesPerSession
      }
    };
  }

  function planRecords(plan, records) {
    return (Array.isArray(records) ? records : []).filter((record) => record.planId === plan?.id);
  }

  // In a legacy save the first plan ID also identifies its qualification.
  function belongsToGoal(plan, entry) {
    return (entry.qualificationId || entry.planId) === (plan.qualificationId || plan.id);
  }

  const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14];
  const RECALL_OUTCOMES = new Set(["independent", "hint", "missed"]);

  // A date contributes at most one result. Any assisted or failed attempt
  // on that date keeps the item at the shortest interval.
  function reviewFromDailyResults(dailyResults, studyDates, targetDate, selfPaced) {
    const dates = [...dailyResults.keys()].sort();
    if (!dates.length) return { status: "new", dueDate: null, intervalDays: null };

    let streak = 0;
    for (const date of dates) {
      streak = dailyResults.get(date) ? Math.min(streak + 1, REVIEW_INTERVAL_DAYS.length) : 0;
    }
    const intervalDays = REVIEW_INTERVAL_DAYS[Math.max(0, streak - 1)];
    const earliest = addDays(dates.at(-1), intervalDays);
    const dueDate = selfPaced ? earliest :
      studyDates.find((date) => date >= earliest && date <= targetDate) ?? null;
    return { status: dueDate ? "scheduled" : "ended", dueDate, intervalDays };
  }

  // A record may contain recallResults: [{ itemId, outcome }]. Records
  // predating that field still count toward the existing session history.
  function getReviewSchedule(plan, items, records, asOfDate) {
    const selfPaced = plan.selfPaced === true;
    const studyDates = selfPaced ? [] : [...new Set(plan.sessions.map((session) => session.date))].sort();
    const dailyByItem = new Map();
    for (const record of records || []) {
      if (!belongsToGoal(plan, record) || !parseDateKey(record.studyDate) ||
          (record.planId === plan.id && record.studyDate < plan.config.startDate) ||
          (!selfPaced && record.studyDate > plan.config.targetDate) || (asOfDate && record.studyDate > asOfDate) ||
          !Array.isArray(record.recallResults)) continue;
      for (const result of record.recallResults) {
        if (!result?.itemId || !RECALL_OUTCOMES.has(result.outcome)) continue;
        if (!dailyByItem.has(result.itemId)) dailyByItem.set(result.itemId, new Map());
        const daily = dailyByItem.get(result.itemId);
        const independent = result.outcome === "independent";
        daily.set(record.studyDate, daily.get(record.studyDate) !== false && independent);
      }
    }
    return items.filter((item) => belongsToGoal(plan, item) &&
      (!plan.config.domains || plan.config.domains.includes(item.domain))).map((item) => ({
      item,
      ...reviewFromDailyResults(dailyByItem.get(item.id) ?? new Map(), studyDates, plan.config.targetDate, selfPaced)
    }));
  }

  function compareIds(left, right) {
    return left < right ? -1 : left > right ? 1 : 0;
  }

  function alternateReviewDomains(tasks) {
    const ordered = [];
    const remaining = [...tasks];
    while (remaining.length) {
      const previousDomain = ordered.at(-1)?.item.domain;
      const index = remaining.findIndex((task) => task.item.domain !== previousDomain);
      ordered.push(remaining.splice(index < 0 ? 0 : index, 1)[0]);
    }
    return ordered;
  }

  // budgetMinutes is the part of the session reserved for these tasks.
  // Callers can use plannedMinutes or pass a smaller budget to retain other tasks.
  function buildDailyStudy(plan, items, records, date, budgetMinutes, studyDate = date) {
    const session = plan.sessions.find((entry) => entry.date === date) ?? null;
    const reviewSchedule = getReviewSchedule(plan, items, records, studyDate);
    const due = reviewSchedule
      .filter((entry) => entry.status === "scheduled" && entry.dueDate <= studyDate)
      .sort((left, right) => compareIds(left.dueDate, right.dueDate) || compareIds(left.item.id, right.item.id));
    const fresh = session && !["integration", "simulation", "taper"].includes(session.phaseId)
      ? reviewSchedule
        .filter((entry) => entry.status === "new" && session.focusDomains.includes(entry.item.domain))
        .sort((left, right) => compareIds(left.item.id, right.item.id))
      : [];
    const limit = session ? Math.max(0, Math.min(session.plannedMinutes,
      Number.isFinite(budgetMinutes) ? Math.floor(budgetMinutes) : session.plannedMinutes)) : 0;
    const reviews = due.slice(0, Math.floor(limit / 3)).map((entry) => ({
      ...entry,
      kind: entry.dueDate < studyDate ? "overdue" : "review",
      minutes: 3
    }));
    const newTasks = fresh.slice(0, Math.floor((limit - reviews.length * 3) / 6)).map((entry) => ({
      ...entry, kind: "new", minutes: 6
    }));
    const orderedReviews = session?.phaseId === "integration"
      ? [
        ...alternateReviewDomains(reviews.filter((task) => task.kind === "overdue")),
        ...alternateReviewDomains(reviews.filter((task) => task.kind === "review"))
      ]
      : reviews;
    return {
      session,
      tasks: [...orderedReviews, ...newTasks],
      plannedMinutes: reviews.length * 3 + newTasks.length * 6,
      deferredReviewCount: due.length - reviews.length,
      deferredNewCount: fresh.length - newTasks.length
    };
  }

  function nextPendingSession(plan, records, todayKey = toDateKey()) {
    if (!plan) return null;
    const completed = new Set(planRecords(plan, records).map((record) => record.sessionId));
    const pending = plan.sessions.filter((session) => !completed.has(session.id));
    return pending.find((session) => session.date >= todayKey) || pending[0] || null;
  }

  function estimateExamWindow(plan, items = [], records = [], today = toDateKey()) {
    if (!plan) return { message: "受験時期の目安を出すには、学習計画を作成してください。" };
    if (plan.trial === true) return { message: "お試し学習の記録からは、受験時期を見積もれません。" };
    const registered = new Map(items.filter((item) => belongsToGoal(plan, item) &&
      (!plan.config.domains || plan.config.domains.includes(item.domain)))
      .map((item) => [item.id, new Map()]));
    if (!registered.size) return { message: "受験時期の目安を出すには、学習項目を登録してください。" };

    const recentStart = addDays(today, -27);
    const studyDates = new Set();
    for (const record of records) {
      const date = record.studyDate;
      if (!belongsToGoal(plan, record) || !parseDateKey(date) || date > today) continue;
      studyDates.add(date);
      if (!Array.isArray(record.recallResults)) continue;
      for (const result of record.recallResults) {
        const daily = registered.get(result?.itemId);
        if (!daily || !RECALL_OUTCOMES.has(result.outcome)) continue;
        daily.set(date, daily.get(date) !== false && result.outcome === "independent");
      }
    }

    let covered = 0;
    let newlyCovered = 0;
    for (const daily of registered.values()) {
      const dates = [...daily.keys()].sort();
      if (daily.get(dates.at(-1)) !== true) continue;
      covered += 1;
      const firstIndependent = dates.find((date) => daily.get(date));
      if (firstIndependent >= recentStart) newlyCovered += 1;
    }

    const remaining = registered.size - covered;
    const coverage = `登録${registered.size}項目のうち、自力で思い出せた項目は${covered}件です（各項目の最新の結果）。`;
    const dates = [...studyDates].sort();
    const latestDate = dates.at(-1);
    if (latestDate && daysBetween(latestDate, today) >= 14) {
      return { message: `${coverage}直近14日間の学習記録がないため、受験時期の見積もりは保留です。学習を再開し、現在のペースを記録してください。` };
    }
    if (!remaining) {
      return { message: `${coverage}本番と同じ時間制限で模試や過去問に取り組み、試験範囲と合格ラインを確認してから受験日を検討してください。` };
    }

    const observedStart = dates[0] > recentStart ? dates[0] : recentStart;
    const observedDays = dates.length ? daysBetween(observedStart, today) + 1 : 0;
    const studyDayCount = dates.filter((date) => date >= recentStart).length;
    if (observedDays < 14 || studyDayCount < 3 || newlyCovered < 2) {
      return { message: `${coverage}時期の見積もりには、14日以上の観測期間に3日以上の学習記録と、2件以上の新たな自力想起が必要です。` };
    }

    const pace = newlyCovered * 7 / observedDays;
    const earlyWeeks = Math.ceil(remaining / pace);
    const lateWeeks = Math.max(earlyWeeks + 1, Math.ceil(remaining / (pace * 0.75)));
    const earlyDate = addDays(today, earlyWeeks * 7);
    const lateDate = addDays(today, lateWeeks * 7);
    return { earlyDate, lateDate, message: `${coverage}直近${observedDays}日間に${studyDayCount}日学習し、${newlyCovered}件を新たに自力で思い出せるようになりました（週約${pace.toFixed(1)}件）。このペースが続くか、約25％落ちる場合を見込むと、登録済みの残り${remaining}件を確認できる目安は${earlyDate}〜${lateDate}です。受験日は、模試や過去問で試験範囲と合格ラインを確認してから検討してください。` };
  }

  function computePlanStats(plan, records) {
    if (!plan) return { completed: 0, total: 0, percent: 0, actualMinutes: 0, averageConfidence: null };
    const related = planRecords(plan, records);
    const sessionIds = new Set(plan.sessions.map((session) => session.id));
    const completed = new Set(related.map((record) => record.sessionId).filter((id) => sessionIds.has(id))).size;
    const confidenceValues = related.map((record) => Number(record.confidence))
      .filter((value) => value >= 1 && value <= 5);
    return {
      completed,
      total: plan.sessions.length,
      percent: plan.sessions.length ? Math.round((completed / plan.sessions.length) * 100) : 0,
      actualMinutes: related.reduce((sum, record) => sum + (Number(record.actualMinutes) || 0), 0),
      averageConfidence: confidenceValues.length
        ? Math.round((confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length) * 10) / 10
        : null
    };
  }

  return {
    PHASES,
    toDateKey,
    parseDateKey,
    addDays,
    daysBetween,
    normalizeDomains,
    normalizeConfig,
    validateConfig,
    getStudyWeekdays,
    buildStudyDates,
    allocatePhaseCounts,
    allocateMinutes,
    buildTasks,
    generateCurriculum,
    planRecords,
    belongsToGoal,
    getReviewSchedule,
    buildDailyStudy,
    nextPendingSession,
    estimateExamWindow,
    computePlanStats
  };
});
