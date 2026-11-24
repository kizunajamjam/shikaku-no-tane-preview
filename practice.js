(function exposePractice(root) {
  "use strict";

  const engine = root.CurriculumEngine || (typeof require === "function" && require("./curriculum.js"));
  const starterCards = [
    { id: "starter-recall", question: "昨日読んだ章の要点を覚えているか、どう確かめる？", answer: "教材を閉じて要点を言ってみる",
      distractors: ["目次を見て聞き覚えのある語を探す", "大事そうな一文に線を引く"], explanation: "自分の言葉で要点を出してから教材と照合すると、抜けていた部分が分かります。" },
    { id: "starter-correct", question: "間違えた問題の解説を読み終えた。理解を確かめる次の一手は？", answer: "解説を閉じて解き方を再現する",
      distractors: ["正解の番号だけをメモする", "解説を見たまま答えを写す"], explanation: "理由も含めて解き直すと、どの手順を自力で再現できるか分かります。" },
    { id: "starter-space", question: "今日解けた問題を、来週も思い出せるか確かめるには？", answer: "別の日に答えを隠して解き直す",
      distractors: ["今日のうちに続けて3回解く", "正答マークを付けて学習を終える"], explanation: "時間を空けて記憶から取り出す機会を作ります。" }
  ].map((card) => ({ ...card, domain: "学び方の練習" }));

  function buildTrialItems(plan, cards) {
    const qualificationId = plan.qualificationId || plan.id;
    return [...starterCards, ...cards].map((card) => ({
      ...card,
      id: `${plan.id}-${card.id}`,
      planId: plan.id,
      qualificationId,
      domain: plan.config.domains[0],
      createdAt: plan.generatedAt
    }));
  }

  function recordDay(record) {
    return record.studyDate || engine.toDateKey(new Date(record.completedAt));
  }

  function streakFromDates(dates, today) {
    let run = 0;
    let longestStreak = 0;
    for (let i = 0; i < dates.length; i++) {
      run = i && engine.daysBetween(dates[i - 1], dates[i]) === 1 ? run + 1 : 1;
      longestStreak = Math.max(longestStreak, run);
    }
    const latest = dates.at(-1);
    return { currentStreak: latest && engine.daysBetween(latest, today) <= 1 ? run : 0,
      longestStreak, studiedToday: latest === today };
  }

  function studyHabit(records, today) {
    const dates = new Set(records.map(recordDay).filter((day) => day <= today && engine.parseDateKey(day)));
    return { ...streakFromDates([...dates].sort(), today), dates };
  }

  function gameProgress(records, today) {
    const weekStart = engine.addDays(today, -6);
    const activeDays = new Set();
    const solvedItems = new Set();
    const byDate = new Map();
    const lastSeen = new Map();
    const domains = new Set();
    const reviewedItems = new Set();
    const yesterday = engine.addDays(today, -1);
    const yesterdayResults = new Map();
    for (const record of records) {
      const date = recordDay(record);
      if (!engine.parseDateKey(date) || date > today) continue;
      if (date >= weekStart) activeDays.add(date);
      if (!byDate.has(date)) byDate.set(date, new Set());
      for (const result of record.recallResults || []) {
        if (!result?.itemId || !["independent", "hint", "missed"].includes(result.outcome)) continue;
        byDate.get(date).add(result.itemId);
        if (result.outcome === "independent") solvedItems.add(result.itemId);
        const time = date + " " + (record.completedAt || "");
        if (date === yesterday && time >= (yesterdayResults.get(result.itemId)?.time || "")) {
          yesterdayResults.set(result.itemId, { time, outcome: result.outcome });
        }
        const previous = lastSeen.get(result.itemId);
        if (previous && !previous.startsWith(date)) reviewedItems.add(result.itemId);
        if (result.domain) domains.add(result.domain);
        if (time > (lastSeen.get(result.itemId) || "")) lastSeen.set(result.itemId, time);
      }
    }
    const xp = [...byDate.values()].reduce((sum, ids) => sum + 10 * ids.size, 0);
    const dates = [...byDate.keys()].sort();
    const latest = dates.at(-1);
    const previousDay = latest === today ? dates.at(-2) : latest;
    const gentleStart = !previousDay ? "first" : engine.daysBetween(previousDay, today) >= 3 ? "return" : null;
    const idleDays = byDate.has(today) || !previousDay ? 0 : engine.daysBetween(previousDay, today) - 1;
    return { xp, level: 1 + Math.floor(xp / 100), gentleStart, idleDays, ...streakFromDates(dates, today), yesterdayResults,
      domainCount: domains.size, reviewedCount: reviewedItems.size, todayCount: byDate.get(today)?.size || 0,
      activeDays: activeDays.size, totalDays: byDate.size, activeDates: activeDays, solvedItems, lastSeen };
  }

  function miniQuestions(schedule, lastSeen, today, yesterdayResults) {
    const candidates = schedule.length ? [...schedule] : starterCards.map((item) => ({ item }));
    const priority = ({ item, dueDate }) => {
      if (lastSeen.get(item.id)?.startsWith(today)) return 2;
      return dueDate && dueDate <= today ? 0 : 1;
    };
    candidates.sort((a, b) => priority(a) - priority(b) ||
      (lastSeen.get(a.item.id) || "").localeCompare(lastSeen.get(b.item.id) || ""));
    if (yesterdayResults) {
      const index = candidates.findIndex(({ item }) => {
        const result = yesterdayResults.get(item.id);
        return result && result.outcome !== "independent" && !lastSeen.get(item.id)?.startsWith(today);
      });
      if (index > 0) candidates.unshift(candidates.splice(index, 1)[0]);
    }
    return candidates.slice(0, 3).map(({ item }) => item);
  }

  function sampleQuestions(items, random = Math.random) {
    const pool = [...items];
    const size = Math.min(10, pool.length);
    for (let i = 0; i < size; i++) {
      const j = i + Math.floor(random() * (pool.length - i));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, size);
  }

  // Beta(1,1) prior. Sum the beta-binomial predictive mass at and above
  // the passing score for another test of the same length and difficulty.
  function passProbability(correct, total, passMark) {
    if (!Number.isInteger(total) || total < 3 || total > 10 ||
        !Number.isInteger(correct) || correct < 0 || correct > total ||
        !Number.isInteger(passMark) || passMark < 1 || passMark > 100) return null;
    const a = correct + 1;
    const b = total - correct + 1;
    const required = Math.ceil(total * passMark / 100);
    let mass = 1;
    for (let i = 0; i < total; i++) mass *= (b + i) / (a + b + i);
    let probability = 0;
    for (let k = 1; k <= total; k++) {
      mass *= (total - k + 1) * (a + k - 1) / (k * (b + total - k));
      if (k >= required) probability += mass;
    }
    return Math.min(1, probability);
  }

  function describeResult({ correct, total, passMark }) {
    const probability = passProbability(correct, total, passMark);
    const score = `${total}問中${correct}問正解 ／ 合格ライン${passMark}％`;
    if (probability === null) return score + " ／ 3問以上で合格率を推定";
    const percent = Math.round(probability * 100);
    const estimate = percent === 100 ? "99％超" : percent === 0 ? "1％未満" : `約${percent}％`;
    return score + ` ／ 同程度の模試の想定合格率 ${estimate}`;
  }

  const api = { buildTrialItems, studyHabit, gameProgress, miniQuestions, sampleQuestions, passProbability, describeResult };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.PassDeckPractice = api;
})(globalThis);
