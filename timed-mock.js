(function exposeTimedMock(root) {
  "use strict";

  function grade(question, selected = []) {
    return selected.length === question.answers.length &&
      new Set(selected).size === selected.length &&
      selected.every((index) => question.answers.includes(index));
  }

  function score(questions, selections) {
    return questions.reduce((total, question) => total + Number(grade(question, selections[question.id])), 0);
  }

  function answerFeedback(question, selected = []) {
    return {
      wrong: selected.filter((index) => !question.answers.includes(index)).map((index) => question.choices[index]),
      omitted: question.answers.filter((index) => !selected.includes(index)).map((index) => question.choices[index])
    };
  }

  function shuffleChoices(question) {
    const order = question.choices.map((_, index) => index);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }

  if (typeof module === "object" && module.exports) module.exports = { grade, score, answerFeedback };
  if (typeof document === "undefined") return;

  const byId = (id) => document.getElementById(id);
  const panel = byId("timed-mock");
  const prefix = "shikaku-no-tane:timed-mock:";
  let material, key, selectedSet, attempts = {}, ticker;

  function save() {
    const status = byId("timed-mock-storage-status");
    try {
      localStorage.setItem(key, JSON.stringify(attempts));
      status.hidden = true;
    } catch {
      status.textContent = "この端末に模試を保存できません。画面を閉じると進捗が失われます。";
      status.hidden = false;
    }
  }

  function updateClock() {
    const attempt = selectedSet && attempts[selectedSet.id];
    if (!attempt || attempt.finishedAt) return;
    const seconds = Math.max(0, Math.ceil((attempt.deadline - Date.now()) / 1000));
    if (!seconds) {
      finish(true);
      return;
    }
    byId("timed-mock-clock").textContent =
      "残り " + Math.floor(seconds / 60) + "分" + String(seconds % 60).padStart(2, "0") + "秒";
  }

  function finish(expired = false) {
    const attempt = attempts[selectedSet.id];
    if (!attempt || attempt.finishedAt) return;
    if (!expired && !window.confirm("採点すると、この回の解答は変更できません。提出しますか？")) return;
    attempt.finishedAt = Math.min(Date.now(), attempt.deadline);
    attempt.expired = expired || Date.now() >= attempt.deadline;
    save();
    render();
    byId("timed-mock-message").tabIndex = -1;
    byId("timed-mock-message").focus();
  }

  function render() {
    clearInterval(ticker);
    const status = byId("timed-mock-message");
    status.textContent = "";
    const review = byId("timed-mock-review");
    review.replaceChildren();
    const run = byId("timed-mock-run");
    run.hidden = true;
    if (!material) return;
    byId("timed-mock-info").textContent = material.sets[0].questions.length + "問 · " + material.minutes +
      "分。公式の合格ラインは" + material.passMark + "％です。提出後に正解と解説を確認できます。進捗はこの端末に保存します。";
    byId("timed-mock-sets").replaceChildren(...material.sets.map((set) => {
      const button = document.createElement("button");
      const attempt = attempts[set.id];
      button.className = "ghost-button";
      button.type = "button";
      button.textContent = set.label + (attempt?.finishedAt ? "の結果" : attempt ? "を再開" : "を始める");
      button.setAttribute("aria-pressed", String(selectedSet === set));
      button.addEventListener("click", () => {
        if (!attempt) {
          const active = material.sets.find((entry) => attempts[entry.id] && !attempts[entry.id].finishedAt &&
            attempts[entry.id].deadline > Date.now());
          if (active) {
            status.textContent = active.label + "を提出してから次の模試を始めてください。";
            return;
          }
          if (!window.confirm(set.label + "を開始すると制限時間のカウントが始まります。始めますか？")) return;
          attempts[set.id] = {
            deadline: Date.now() + material.minutes * 60000,
            index: 0,
            selections: {},
            orders: Object.fromEntries(set.questions.map((question) => [question.id, shuffleChoices(question)]))
          };
          save();
        }
        selectedSet = set;
        render();
        if (!run.hidden) byId("timed-mock-question").focus();
      });
      return button;
    }));
    if (!selectedSet) return;
    const attempt = attempts[selectedSet.id];
    const questions = selectedSet.questions;
    if (attempt.finishedAt) {
      renderResult(attempt, questions, status, review);
      return;
    }
    if (Date.now() >= attempt.deadline) {
      finish(true);
      return;
    }
    const index = attempt.index;
    const question = questions[index];
    run.hidden = false;
    byId("timed-mock-position").textContent = selectedSet.label + " · " + (index + 1) + " / " + questions.length +
      "問 · 選択済み " + Object.values(attempt.selections).filter((selection) => selection.length).length + "問";
    byId("timed-mock-question").textContent = question.question + "（" + question.answers.length + "つ選択）";
    byId("timed-mock-choices").replaceChildren(...attempt.orders[question.id].map((choiceIndex) => {
      const label = document.createElement("label");
      label.className = "choice-button";
      const input = document.createElement("input");
      input.type = question.answers.length === 1 ? "radio" : "checkbox";
      input.name = "mock-answer";
      input.value = String(choiceIndex);
      input.checked = (attempt.selections[question.id] || []).includes(choiceIndex);
      label.append(input, " " + question.choices[choiceIndex]);
      return label;
    }));
    byId("timed-mock-prev").disabled = index === 0;
    byId("timed-mock-next").disabled = index === questions.length - 1;
    updateClock();
    ticker = setInterval(updateClock, 1000);
  }

  function renderResult(attempt, questions, status, review) {
    const correct = score(questions, attempt.selections);
    const percent = correct * 100 / questions.length;
    status.textContent = selectedSet.label + " · " + correct + " / " + questions.length + "問正解（" + percent.toFixed(1) +
      "％）。" + (attempt.expired ? "時間切れで採点しました。" : "") +
      "練習目安 " + material.goalMark + "％ " + (percent >= material.goalMark ? "達成" : "未達");
    const domains = new Map();
    for (const question of questions) {
      if (!domains.has(question.domain)) domains.set(question.domain, { correct: 0, total: 0 });
      const group = domains.get(question.domain);
      group.total++;
      group.correct += Number(grade(question, attempt.selections[question.id]));
    }
    const breakdown = document.createElement("details");
    const heading = document.createElement("summary");
    heading.textContent = "分野別の結果";
    const list = document.createElement("ul");
    for (const [name, group] of domains) {
      const item = document.createElement("li");
      item.textContent = name + " " + group.correct + " / " + group.total;
      list.append(item);
    }
    breakdown.append(heading, list);
    review.append(breakdown);
    const reviewed = questions.map((question, index) => {
      const selected = attempt.selections[question.id] || [];
      return { question, index, selected, correct: grade(question, selected) };
    });
    const mistakes = reviewed.filter((entry) => !entry.correct);
    const successes = reviewed.filter((entry) => entry.correct);
    for (const [label, entries] of [["間違えた問題・未解答", mistakes], ["正解した問題", successes]]) {
      if (!entries.length) continue;
      const title = document.createElement("h3");
      title.textContent = label + " " + entries.length + "問";
      review.append(title);
      for (const entry of entries) review.append(renderQuestionReview(entry));
    }
  }

  function renderQuestionReview({ question, index, selected, correct }) {
    const details = document.createElement("details");
    const heading = document.createElement("summary");
    heading.textContent = (index + 1) + ". " + (correct ? "正解" : selected.length ? "要復習" : "未解答") + " · " + question.domain;
    const prompt = document.createElement("p");
    prompt.textContent = question.question;
    const chosen = document.createElement("p");
    chosen.textContent = "自分の解答 " + (selected.map((choice) => question.choices[choice]).join(" ／ ") || "未解答");
    const answer = document.createElement("p");
    answer.textContent = "正解 " + question.answers.map((choice) => question.choices[choice]).join(" ／ ");
    details.append(heading, prompt, chosen, answer);
    if (!correct && selected.length) {
        const { wrong, omitted } = answerFeedback(question, selected);
        for (const [label, options] of [["選んだ誤答", wrong], ["選び漏らした正答", omitted]]) {
          if (!options.length) continue;
          const mistakes = document.createElement("p");
          mistakes.textContent = label + "　" + options.join(" ／ ");
          details.append(mistakes);
        }
    }
    const explanation = document.createElement("p");
    explanation.textContent = "解説　" + question.explanation;
    const source = document.createElement("a");
    source.href = material.sourceBase + question.doc;
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    source.textContent = "公式資料で確認";
    details.append(explanation, source);
    return details;
  }

  byId("timed-mock-answer").addEventListener("change", (event) => {
    const attempt = attempts[selectedSet.id];
    if (Date.now() >= attempt.deadline) { finish(true); return; }
    const question = selectedSet.questions[attempt.index];
    const checked = [...event.currentTarget.querySelectorAll("input:checked")];
    const status = byId("timed-mock-message");
    if (checked.length > question.answers.length) {
      event.target.checked = false;
      status.textContent = question.answers.length + "つまで選べます。";
      return;
    }
    attempt.selections[question.id] = checked.map((input) => Number(input.value));
    status.textContent = "";
    byId("timed-mock-position").textContent = selectedSet.label + " · " + (attempt.index + 1) + " / " + selectedSet.questions.length +
      "問 · 選択済み " + Object.values(attempt.selections).filter((selection) => selection.length).length + "問";
    save();
  });

  function move(delta) {
    const attempt = attempts[selectedSet.id];
    if (Date.now() >= attempt.deadline) { finish(true); return; }
    const next = attempt.index + delta;
    if (next < 0 || next >= selectedSet.questions.length) return;
    attempt.index = next;
    save();
    render();
    byId("timed-mock-question").focus();
  }
  byId("timed-mock-prev").onclick = () => move(-1);
  byId("timed-mock-next").onclick = () => move(1);
  byId("timed-mock-submit").onclick = () => finish();

  function setMaterial(next, goalId) {
    const nextKey = next ? prefix + goalId : null;
    if (material === next && key === nextKey) return;
    material = next;
    key = nextKey;
    panel.hidden = !material;
    byId("timed-mock-storage-status").hidden = true;
    attempts = {};
    if (key) {
      try {
        attempts = JSON.parse(localStorage.getItem(key) || "{}") || {};
      } catch { attempts = {}; }
    }
    selectedSet = material?.sets.find((set) => attempts[set.id] && !attempts[set.id].finishedAt);
    render();
  }

  function clear() {
    try {
      for (const name of Object.keys(localStorage)) {
        if (name.startsWith(prefix)) localStorage.removeItem(name);
      }
    } catch { /* Local storage may be unavailable. */ }
    setMaterial(null);
  }

  document.addEventListener("visibilitychange", updateClock);
  window.addEventListener("storage", (event) => {
    if (!key || (event.key !== key && event.key !== null)) return;
    const next = material;
    const goalId = key.slice(prefix.length);
    key = null;
    setMaterial(next, goalId);
  });
  root.PassDeckTimedMock = { setMaterial, clear };
})(globalThis);
