(function exposeOracleSilver(root) {
  "use strict";

  const title = "ORACLE MASTER Silver DBA 2019（1Z0-082-JPN）";
  const cards = [
    {
      id: "mount", domain: "インスタンス管理",
      question: "単一インスタンスで STARTUP MOUNT が成功した直後。OPEN する前に、すでに読み取られたファイルはどれ？",
      answer: "制御ファイル", distractors: ["すべてのユーザー表領域のデータファイル", "すべてのオンラインREDOログ・ファイル", "すべての一時ファイル"],
      explanation: "MOUNTでは制御ファイルを開き、データファイルやオンラインREDOログの所在を把握します。ユーザー表領域のデータファイルとオンラインREDOログ自体を開くのはOPEN段階です。一時ファイルの読み取りもMOUNTの成立条件ではありません。",
      doc: "cncpt/oracle-database-instance.html"
    },
    {
      id: "writer", domain: "アーキテクチャ",
      question: "通常の同期コミットで、COMMIT の成功をクライアントに返す前に、コミット記録をオンラインREDOログへ書き出すのはどのプロセス？",
      answer: "LGWR", distractors: ["DBWn", "CKPT", "ARCn"],
      explanation: "LGWRがコミット記録を含むREDOを書き出します。DBWnは変更済みデータブロックを書き出し、CKPTはチェックポイント情報を更新します。ARCnは切替済みのREDOログをアーカイブします。",
      doc: "cncpt/process-architecture.html"
    },
    {
      id: "extent", domain: "記憶域管理",
      question: "表のセグメントに領域が足りず、エクステントを1つ追加した。新たに割り当てた領域の説明として正しいものは？",
      answer: "1つのデータファイル内にある、論理的に連続したデータブロックの集まり",
      distractors: ["複数のデータファイルをまたいで連続するブロックの集まり", "1つの表領域に含まれるすべてのセグメント", "表の行ごとに必ず1つ割り当てる最小の領域"],
      explanation: "エクステントは1つのデータファイル内で完結します。複数ファイルにまたがれるのはセグメントです。表領域はセグメントを収容する上位の区分で、エクステントを行ごとに割り当てることもありません。",
      doc: "cncpt/logical-storage-structures.html"
    },
    {
      id: "undo", domain: "UNDO管理",
      question: "通常の READ COMMITTED で、問合せ開始後に別セッションが対象行を更新してコミットした。更新済みブロックから問合せ開始時点の行を再構成するために使うものは？",
      answer: "UNDOデータ", distractors: ["アーカイブREDOログ", "制御ファイル", "一時表領域のソート用領域"],
      explanation: "UNDOには変更を取り消すための情報があり、読取り一貫性にも使われます。アーカイブREDOログはリカバリで変更を再適用するためのものです。制御ファイルはデータベースの構成情報を保持し、ソート用領域は並べ替えなどの作業に使います。",
      doc: "admin/managing-undo.html"
    },
    {
      id: "listener", domain: "Oracle Net",
      question: "クライアントはサービス名と接続先アドレスを解決できた。サーバー側で最初の接続要求を受け、対象サービスのハンドラへ接続を引き渡すのは？",
      answer: "Oracle Net Listener", distractors: ["クライアントの tnsnames.ora", "Database Configuration Assistant", "SQL*Plus"],
      explanation: "リスナーは受信した接続要求をサービスのハンドラへ仲介します。tnsnames.oraは接続記述子を引くための設定ファイル、DBCAはデータベース構成ツール、SQL*Plusは接続を要求する側のクライアントです。",
      doc: "netag/understanding-oracle-net-architecture.html"
    },
    {
      id: "grant", domain: "権限管理",
      question: "REPORTER は接続可能で、SALES.ORDERS の全列を参照する必要がある。更新も他ユーザーへの再付与も不要。表の所有者が行う最小限の付与は？",
      answer: "GRANT SELECT ON sales.orders TO reporter",
      distractors: ["GRANT SELECT ANY TABLE TO reporter", "GRANT UPDATE ON sales.orders TO reporter", "GRANT SELECT ON sales.orders TO reporter WITH GRANT OPTION"],
      explanation: "表に対するSELECTで対象表を参照できます。SELECT ANY TABLEは対象を広げすぎます。UPDATEは更新用です。WITH GRANT OPTIONを付けると、今回不要な再付与まで認めてしまいます。",
      doc: "sqlrf/GRANT.html"
    },
    {
      id: "count", domain: "SQL集計",
      question: "表 T の列 N は4行で、値は 5、NULL、5、9。SELECT COUNT(*), COUNT(n), COUNT(DISTINCT n) FROM t の結果は左からどれ？",
      answer: "4, 3, 2", distractors: ["4, 4, 3", "4, 3, 3", "3, 3, 2"],
      explanation: "COUNT(*)は全4行、COUNT(n)は非NULLの3行、COUNT(DISTINCT n)は5と9の2種類です。「4, 4, 3」はNULLまで値として数え、「4, 3, 3」は5の重複を残し、「3, 3, 2」はCOUNT(*)からNULLの行を落としています。",
      doc: "sqlrf/COUNT.html"
    },
    {
      id: "outer", domain: "SQL結合",
      question: "部署10・20のうち、部署10には在籍者が1人、部署20には退職者しかいない。部署をすべて残し、在籍者だけを対応づけたい。次の結合のうち適切なのは？",
      answer: "dept d LEFT JOIN emp e ON e.deptno=d.deptno AND e.status='在籍'",
      distractors: ["dept d LEFT JOIN emp e ON e.deptno=d.deptno WHERE e.status='在籍'", "dept d INNER JOIN emp e ON e.deptno=d.deptno AND e.status='在籍'", "dept d CROSS JOIN emp e"],
      explanation: "LEFT JOINのON句で在籍者に絞ると、部署20は社員側がNULLの行として残ります。WHEREで在籍を要求すると部署20が消えます。INNER JOINも一致しない部署を返さず、CROSS JOINは部署と社員の全組合せを作ります。",
      doc: "sqlrf/Joins.html"
    },
    {
      id: "ddl", domain: "トランザクション",
      question: "同じセッションで通常の表AをUPDATEし、続いて通常の表BをCREATE TABLEで作成した。両方成功した直後にROLLBACKするとどうなる？",
      answer: "Aの更新は残り、Bも残る", distractors: ["Aの更新は戻り、Bも消える", "Aの更新は戻り、Bは残る", "Aの更新は残り、Bは消える"],
      explanation: "OracleはこのDDLの実行前に暗黙のCOMMITを行うため、先行するAの更新は確定します。成功したDDLの後にもCOMMITするためBも残ります。Aだけ、Bだけ、または両方を後続のROLLBACKで取り消すことはできません。",
      doc: "sqlrf/COMMIT.html"
    },
    {
      id: "sets", domain: "SQL集合演算",
      question: "同じ型の列を持つ表Aには 1、1、2、表Bには 1、3 がある。SELECT n FROM a MINUS SELECT n FROM b の結果は？",
      answer: "2 の1行", distractors: ["1 と 2 の2行", "1 の1行", "2 と 3 の2行"],
      explanation: "MINUSは左側だけに現れる値を重複なしで返します。1は右にもあるため左に2件あっても残りません。「1 の1行」はINTERSECTの結果です。3は右側だけにあり、両方向の差を集めた「2 と 3」も該当しません。",
      doc: "sqlrf/Set-Operators.html"
    }
  ];

  const originalDomains = [...new Set(cards.map((card) => card.domain))];
  const extra = typeof module === "object" && module.exports
    ? [
      ...require("./oracle-silver-dba.js"), ...require("./oracle-silver-sql.js"),
      ...require("./oracle-silver-dba-extra.js"), ...require("./oracle-silver-sql-extra.js"),
      ...require("./oracle-silver-cases.js"), ...require("./scenarios.js"),
      ...require("./dba-practice.js"), ...require("./sql-practice.js"), ...require("./final-practice.js")
    ]
    : [...root.OracleSilverDba, ...root.OracleSilverSql,
      ...root.OracleSilverDbaExtra, ...root.OracleSilverSqlExtra, ...root.OracleSilverCases,
      ...root.OracleSilverScenarios, ...root.OracleSilverDbaPractice, ...root.OracleSilverSqlPractice,
      ...root.OracleSilverFinalPractice];
  cards.push(...extra);
  const id = "1Z0-082-JPN";

  function includeCards(state) {
    const plans = [state.plan, ...state.otherPlans].filter((plan) => plan?.packId === id);
    if (!plans.length) return state;
    const goals = new Set(plans.map((plan) => plan.qualificationId || plan.id));
    state.items = state.items.filter((item) => !(item.cardId === "xdba-pdb-save-state" &&
      goals.has(item.qualificationId || item.planId)));
    const known = new Map(state.items.map((item, index) => [item.id, index]));
    for (const plan of plans) {
      const goal = plan.qualificationId || plan.id;
      if (!plan.oracleEdition && originalDomains.every((domain) => plan.config.domains.includes(domain))) {
        plan.config = { ...plan.config, domains: [...new Set([...plan.config.domains, ...cards.map((card) => card.domain)])] };
      }
      plan.oracleEdition = 2;
      for (const card of cards) {
        const itemId = goal + "-" + card.id;
        if (known.has(itemId)) {
          const index = known.get(itemId);
          const saved = state.items[index];
          if (saved.cardId === card.id) state.items[index] = { ...saved, ...card, id: itemId };
          continue;
        }
        known.set(itemId, state.items.length);
        state.items.push({ ...card, cardId: card.id, id: itemId, qualificationId: goal,
          planId: goal, createdAt: plan.generatedAt });
      }
    }
    return state;
  }

  // Use the latest saved outcome for each question. A first correct answer
  // and a correct recall on another day are different evidence of learning.
  function diagnose(items, records, today) {
    const latest = new Map();
    const correctDates = new Map();
    for (const record of records) {
      const day = record.studyDate || record.completedAt?.slice(0, 10);
      if (!day || day > today) continue;
      for (const result of record.recallResults || []) {
        if (!["independent", "hint", "missed"].includes(result.outcome)) continue;
        const key = result.itemId;
        const stamp = day + "/" + (record.completedAt || "");
        if (!latest.has(key) || stamp >= latest.get(key).stamp) latest.set(key, { outcome: result.outcome, stamp });
        if (result.outcome === "independent") {
          if (!correctDates.has(key)) correctDates.set(key, new Set());
          correctDates.get(key).add(day);
        }
      }
    }
    const groups = new Map();
    for (const item of items) {
      if (!item.cardId) continue;
      if (!groups.has(item.domain)) groups.set(item.domain, { domain: item.domain, unseen: [], revisit: [], once: [], retained: [] });
      const group = groups.get(item.domain);
      const last = latest.get(item.id);
      if (!last) group.unseen.push(item);
      else if (last.outcome !== "independent") group.revisit.push(item);
      else if (correctDates.get(item.id)?.size >= 2) group.retained.push(item);
      else group.once.push(item);
    }
    return [...groups.values()];
  }

  function sampleMock(items, lastSeen, random = Math.random) {
    const pool = items.map((item) => ({ item, seen: lastSeen.get(item.id) || "", tie: random() }));
    const domainCounts = new Map();
    const questions = [];
    while (questions.length < 10 && pool.length) {
      pool.sort((a, b) => Number(Boolean(a.seen)) - Number(Boolean(b.seen))
        || (domainCounts.get(a.item.domain) || 0) - (domainCounts.get(b.item.domain) || 0)
        || a.seen.localeCompare(b.seen) || a.tie - b.tie);
      const { item } = pool.shift();
      questions.push(item);
      domainCounts.set(item.domain, (domainCounts.get(item.domain) || 0) + 1);
    }
    return questions;
  }
  const [mockA, mockB] = typeof module === "object" && module.exports
    ? [require("./mock-a.js"), require("./mock-b.js")]
    : [root.OracleSilverMockA, root.OracleSilverMockB];
  const exam = {
    minutes: 120, passMark: 60, goalMark: 80,
    sourceBase: "https://docs.oracle.com/en/database/oracle/oracle-database/19/",
    sets: [{ id: "a", label: "模試 A", questions: mockA }, { id: "b", label: "模試 B", questions: mockB }]
  };
  const pack = { id, title, cards, exam, includeCards, diagnose, sampleMock };
  if (typeof module === "object" && module.exports) module.exports = pack;
  root.OracleSilverPack = pack;
})(globalThis);
