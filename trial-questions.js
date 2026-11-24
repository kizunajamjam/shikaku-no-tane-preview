(function exposeTrialQuestions(root) {
  "use strict";

  const domain = "学び方の練習";
  const cards = [
    {
      id: "trial-explain-rule",
      question: "用語の定義は言える。事例問題でも使えるか、どう確かめる？",
      answer: "新しい事例に当てはめて判断の根拠を言う",
      distractors: ["定義のキーワードを順番どおりに書く", "教材と同じ事例で用語を言い当てる"],
      explanation: "初めて見る事例で根拠まで説明すると、定義を覚えた先の使い方を確認できます。"
    },
    {
      id: "trial-hint-dependence",
      question: "練習問題はヒントを見れば解ける。試験に向けて何を練習する？",
      answer: "ヒントなしで、最初に何をすべきか考える",
      distractors: ["ヒントが出た後の計算だけを繰り返す", "ヒントの文をそのまま暗記する"],
      explanation: "試験では手がかりを自分で見つけます。問題文から最初の一手を選ぶ練習をしましょう。"
    },
    {
      id: "trial-revisit-forgotten",
      question: "先週は解けた問題で、今日つまずいた。次の復習予定をどう調整する？",
      answer: "つまずいた問題を早めにもう一度解く",
      distractors: ["全問を前回と同じ順番で復習する", "今も解ける問題から次の復習枠に入れる"],
      explanation: "今回つまずいた問題を早めに復習枠へ入れると、うろ覚えだった箇所を再確認できます。"
    },
    {
      id: "trial-mixed-practice",
      question: "問題の種類が分かれば解けるが、模試では解き方を選び間違える。次はどう練習する？",
      answer: "似た種類の問題を混ぜ、使う解き方から選ぶ",
      distractors: ["種類ごとにまとめて解く時間を増やす", "各問題に使う解き方を書いてから解く"],
      explanation: "似た問題を混ぜると、問題文のどこを見て解き方を区別するか練習できます。"
    },
    {
      id: "trial-correct-guess",
      question: "模試で二択まで絞ったが、最後は勘で選んで正解した。見直すなら何をする？",
      answer: "二択を分ける根拠を解説で確認する",
      distractors: ["消去できた選択肢だけ根拠を確認する", "正解にたどり着いた選択肢の順番をメモする"],
      explanation: "迷った二択の違いを言葉にしておくと、聞き方が変わっても判断に使えます。"
    },
    {
      id: "trial-recurring-error",
      question: "別々の過去問で、同じ条件を見落とした。次の演習に向けて何をメモする？",
      answer: "どの表現が出たら何を確認するか書く",
      distractors: ["間違えた過去問の年度と番号を控える", "次はもっと丁寧に読むと書いておく"],
      explanation: "見落とした表現と確認する内容をセットで書くと、次の問題で取る行動が具体的になります。"
    },
    {
      id: "trial-realistic-week",
      question: "残業で平日の学習時間が読めない。来週の計画はどう組む？",
      answer: "短い枠でできる課題を決め、予備の時間も残す",
      distractors: ["平日の長い枠に各章を均等に割り振る", "平日にできなかった課題はすべて日曜に回す"],
      explanation: "短い枠で進められる課題と予備の時間があれば、予定がずれたときに調整できます。"
    },
    {
      id: "trial-restart",
      question: "勉強が数日止まった。今日は15分だけ取れそう。どう再開する？",
      answer: "気になっていた誤答を1問だけ解き直す",
      distractors: ["遅れた分をいつ取り戻すか計画し直す", "再開に備えて教材の残りを一覧にする"],
      explanation: "取れる時間で終わる課題を一つ選ぶと、その日のうちに学習を再開できます。"
    },
    {
      id: "trial-prioritize",
      question: "試験まであと1週間。基礎問題で失点が続く一方、難問も気になる。何を優先する？",
      answer: "繰り返し間違えた基礎問題を解き直す",
      distractors: ["難問の解説を読んで解ける範囲を広げる", "すでに安定して解ける基礎問題で正答を重ねる"],
      explanation: "基礎の失点が繰り返されているなら、まずその原因を確かめて解き直す時間を取りましょう。"
    }
  ];

  const api = { domain, cards };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.PassDeckTrialQuestions = api;
})(globalThis);
