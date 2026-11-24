(function exposeOracleSilverSqlExtra(root) {
  "use strict";

  const cards = [
    {
      id: "xsql-substitution-persistence", domain: "SQLによるデータ取得",
      question: "SQL*PlusでSET DEFINE ONの状態にあり、変数P_CODEは未定義である。SELECT '&&p_code' FROM dual; を実行して入力要求にA7と入力した直後、同じセッションで SELECT '&p_code' FROM dual; を実行した。2文目の結果は？",
      answer: "入力を求められず、文字列A7が返る",
      distractors: ["再度入力を求められ、入力した値が返る", "入力を求められず、文字列&p_codeが返る", "A7が列名として扱われ、列が存在しないというエラーになる"],
      explanation: "未定義の変数を&&で参照すると、SQL*Plusは入力値を代入して変数を定義します。2文目の&は定義済みの値を再利用するため、入力要求はありません。置換は引用符の内側でも行われ、データベースには引用符付きの'A7'が渡るので列参照にもなりません。",
      doc: "sqpug/using-scripts-in-SQL-Plus.html"
    },
    {
      id: "xsql-substitution-identifier", domain: "SQLによるデータ取得",
      question: "SQL*PlusでSET DEFINE ONを設定し、DEFINE target = employees を実行した。EMPLOYEES表への参照権限がある場合、SELECT COUNT(*) FROM &target; で何が起こる？",
      answer: "SQL*Plusが表名をEMPLOYEESに置換して文を送信し、その表の行数が返る",
      distractors: ["データベースが&targetをバインド変数として解決し、その表の行数が返る", "単一の&を指定したため、定義済みでも毎回新しい入力を求められる", "FROM句では置換変数を使用できず、SQL構文エラーになる"],
      explanation: "SQL*Plusの置換はSQL文をデータベースに送信する前のテキスト処理なので、FROM句の表名にも使えます。バインド変数の実行時解決とは処理が異なります。単一の&でも定義済みの値を再利用するため、この例では入力要求がありません。",
      doc: "sqpug/DEFINE.html"
    },
    {
      id: "xsql-literal-quote", domain: "SQLによるデータ取得",
      question: "SELECTリストに、アポストロフィを1文字含む文字列 O'Reilly を指定したい。Oracle SQLの代替引用メカニズムを使った正しい式は？",
      answer: "q'[O'Reilly]'",
      distractors: ["q'[O''Reilly]'", "q'[O'Reilly}'", "q'{O'Reilly]'"],
      explanation: "q'[...]'では角括弧が対応する区切りになり、内側のアポストロフィをそのまま記述できます。O''Reillyと書くとこの引用形式ではアポストロフィが2文字になります。残り2つは開始区切りに対応する終了区切りがなく、リテラルとして成立しません。",
      doc: "sqlrf/Literals.html"
    },
    {
      id: "xsql-like-escape", domain: "行の制限とソート",
      question: "PRODUCTSのVARCHAR2列CODEに A_、A_12、AB12、A@_12 が1行ずつある。二進照合で WHERE code LIKE 'A@_%' ESCAPE '@' を指定すると、該当する値は？",
      answer: "A_ と A_12",
      distractors: ["A_12 だけ", "A_12 と AB12", "A@_12 だけ"],
      explanation: "パターンの@_はアンダースコアそのものを表し、%は0文字以上と一致するため、接頭辞A_を持つ2行が該当します。%は0文字とも一致するのでA_も含まれます。AB12のBはリテラルの_と一致しません。@はエスケープ記号なのでA@_12のように値の中に@があることも要求しません。",
      doc: "sqlrf/Pattern-matching-Conditions.html"
    },
    {
      id: "xsql-offset-window", domain: "行の制限とソート",
      question: "一意のIDがそれぞれ10、20、30、40、50である5行について、SELECT id FROM t ORDER BY id DESC OFFSET 1 ROW FETCH NEXT 2 ROWS ONLY を実行した。返る順序と値は？",
      answer: "40、30",
      distractors: ["50、40", "20、30", "40、30、20"],
      explanation: "IDを降順にすると50、40、30、20、10です。OFFSETは先頭の50を飛ばし、FETCHはそこから2行を返します。50、40はOFFSETを省略した結果、20、30は昇順にした場合の結果です。20まで返すにはFETCHの上限を3行にする必要があります。",
      doc: "sqlrf/SELECT.html"
    },
    {
      id: "xsql-instr-backward", domain: "単一行関数",
      question: "SELECT INSTR('A-B-C-D', '-', -1, 2) FROM dual が返す値は？",
      answer: "4",
      distractors: ["2", "6", "0"],
      explanation: "開始位置-1は末尾から逆方向の検索を指定し、出現回数2は右から2番目のハイフンを選びます。返り値は先頭を1とする左からの位置なので4です。2は左端のハイフンの位置、6は右から1番目の位置です。0は指定回数の一致が見つからない場合です。",
      doc: "sqlrf/INSTR.html"
    },
    {
      id: "xsql-round-negative-precision", domain: "単一行関数",
      question: "OracleのNUMBERリテラルに対する SELECT ROUND(164.7, -2), ROUND(164.7, 0) FROM dual の結果は左からどれ？",
      answer: "200、165",
      distractors: ["100、164", "160、165", "164.7、165"],
      explanation: "ROUNDの桁数-2は百の位への丸めで200、桁数0は整数への丸めで165です。100と164は同じ桁数で切り捨てる場合の値です。160は-1で十の位に丸めた結果で、-2で元の小数164.7が保持されることもありません。",
      doc: "sqlrf/ROUND-number.html"
    },
    {
      id: "xsql-number-format-leading-zero", domain: "変換関数と条件式",
      question: "数値42を、余分な空白のない文字列00042に変換したい。どの式を使う？",
      answer: "TO_CHAR(42, 'FM00000')",
      distractors: ["TO_CHAR(42, 'FM99999')", "TO_CHAR(42, '00000')", "TO_CHAR(42, 'FM0000')"],
      explanation: "書式要素0は不足する桁を0で埋め、FMは正の符号用の先頭空白などを除くので00042になります。9を使うFM99999は先頭ゼロを補いません。FMがない00000には正の数用の先頭空白が付きます。FM0000では4桁の0042になります。",
      doc: "sqlrf/Format-Models.html"
    },
    {
      id: "xsql-case-first-match", domain: "変換関数と条件式",
      question: "NUMBER列SCOREの値が95、75、NULLのとき、CASE WHEN score >= 70 THEN 'PASS' WHEN score >= 90 THEN 'HIGH' ELSE 'REVIEW' END が返す値の組合せは？",
      answer: "'PASS'、'PASS'、'REVIEW'",
      distractors: ["'HIGH'、'PASS'、'REVIEW'", "'PASS'、'PASS'、NULL", "'PASS'、'REVIEW'、'REVIEW'"],
      explanation: "検索CASEは記述順で最初に真になるWHENを採用するため、95も75も先頭の条件でPASSになります。95がHIGHになるには、それより先に90以上を判定する必要があります。NULLは比較がUNKNOWNでどのWHENも真にならず、明示的なELSEのREVIEWになります。75も70以上なのでREVIEWにはなりません。",
      doc: "sqlrf/CASE-Expressions.html"
    },
    {
      id: "xsql-interval-minute", domain: "タイムゾーン",
      question: "TIMESTAMP値に加えるため、日と秒の間の期間として90分を表すINTERVALリテラルが必要である。有効な式は？",
      answer: "INTERVAL '90' MINUTE",
      distractors: ["INTERVAL '0:90' HOUR TO MINUTE", "INTERVAL '90' SECOND", "INTERVAL '90' MONTH"],
      explanation: "MINUTEを先頭フィールドとして90を指定でき、既定の先頭精度2桁にも収まります。HOUR TO MINUTEの従属する分フィールドは0～59なので0:90は無効です。SECONDの90は1分30秒を表します。MONTHの90は年・月系の90か月です。",
      doc: "sqlrf/Literals.html"
    },
    {
      id: "xsql-self-join", domain: "SQL結合",
      question: "EMP(id, manager_id) の全行は (10, NULL)、(20, 10)、(30, 20)。SELECT e.id, m.id FROM emp e JOIN emp m ON e.manager_id = m.id の結果の組合せは？ 行の順序は問わない。",
      answer: "(20, 10)、(30, 20)",
      distractors: ["(10, 20)、(20, 30)", "(10, NULL)、(20, 10)、(30, 20)", "(10, 10)、(20, 20)、(30, 30)"],
      explanation: "eは従業員、mはその上司です。e.manager_idに一致するm.idを取得するので、従業員20の上司は10、従業員30の上司は20です。逆順の組は選択リストを交換した結果です。上司がNULLの行は内部結合に残りません。同じID同士の組はe.id = m.idで結合する場合に得られます。",
      doc: "sqlrf/Joins.html"
    },
    {
      id: "xsql-band-join", domain: "SQL結合",
      question: "ORDERSの注文額AMOUNTを、GRADE(lo, hi, label) の「lo以上かつhi未満」の区間に割り当てたい。区間は [0, 100) と [100, 200) のように接し、AMOUNTと境界は非NULLである。正しい結合条件は？",
      answer: "o.amount >= g.lo AND o.amount < g.hi",
      distractors: ["o.amount BETWEEN g.lo AND g.hi", "o.amount > g.lo AND o.amount <= g.hi", "o.amount >= g.lo OR o.amount < g.hi"],
      explanation: "下限は>=、上限は<で判定し、ANDで両方を要求すると指定どおりの非等価結合になります。BETWEENは両端を含むので100が両方の区間に該当します。>と<=では100が下側の区間に入ります。ORでは片方の境界だけを満たす値まで結合します。",
      doc: "sqlrf/Joins.html"
    },
    {
      id: "xsql-cross-join", domain: "SQL結合",
      question: "SIZE_OPTIONSに3行、COLOR_OPTIONSに4行があり、列名は重複しない。SELECT * FROM size_options CROSS JOIN color_options は何行返す？",
      answer: "12行",
      distractors: ["7行", "4行", "3行"],
      explanation: "CROSS JOINは一方の各行を他方の全行と組み合わせるので3×4で12行です。7は両方の行数を足した値です。4と3は片側だけを読んだ場合の行数で、結合後には各側の行が相手の行数ぶん繰り返されます。",
      doc: "sqlrf/Joins.html"
    },
    {
      id: "xsql-conditional-group", domain: "SQL集計",
      question: "TASKS(dept_id, status) の各部署について、全タスク数と、STATUSが'DONE'の件数を両方出したい。'DONE'が0件の部署も、その部署に別ステータスの行があれば表示する。正しい問合せは？",
      answer: "SELECT dept_id, COUNT(*), COUNT(CASE WHEN status = 'DONE' THEN 1 END) FROM tasks GROUP BY dept_id",
      distractors: ["SELECT dept_id, COUNT(*), COUNT(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) FROM tasks GROUP BY dept_id", "SELECT dept_id, COUNT(*), COUNT(*) FROM tasks WHERE status = 'DONE' GROUP BY dept_id", "SELECT dept_id, COUNT(*), COUNT(CASE WHEN status <> 'DONE' THEN 1 END) FROM tasks GROUP BY dept_id"],
      explanation: "ELSEを省略したCASEは該当しない行でNULLになり、COUNT(式)は非NULL値だけ数えます。COUNT(*)は部署の全行を数えるので、完了が0件でも部署は残ります。ELSE 0では0もカウントされ、WHEREを使うと未完了行が集計前に消えます。<>を使う式は'DONE'と異なる非NULLステータスを数えます。",
      doc: "sqlrf/Aggregate-Functions.html"
    },
    {
      id: "xsql-grouping-columns", domain: "SQL集計",
      question: "ORDERS(dept_id, channel, amount) に対して、部署と販売チャネルの組合せごとの金額合計を1行ずつ取得したい。正しいSELECT文は？",
      answer: "SELECT dept_id, channel, SUM(amount) FROM orders GROUP BY dept_id, channel",
      distractors: ["SELECT dept_id, channel, SUM(amount) FROM orders GROUP BY dept_id", "SELECT dept_id, channel, SUM(amount) FROM orders GROUP BY dept_id, channel, amount", "SELECT dept_id, MAX(channel), SUM(amount) FROM orders GROUP BY dept_id"],
      explanation: "部署とチャネルの両方をグループ化すると、組合せごとにSUMを計算します。部署だけをGROUP BYしながら非集計のチャネルを表示する文はエラーです。金額までグループ化すると異なる額が別行に分かれます。MAX(channel)の文は部署全体を集計し、チャネルの最大値を表示します。",
      doc: "sqlrf/SELECT.html"
    },
    {
      id: "xsql-all-empty", domain: "副問合せ",
      question: "SCORE_LOG表に行がないとき、SELECT 1 FROM dual WHERE 10 > ALL (SELECT score FROM score_log) はどうなる？",
      answer: "1を含む1行が返る",
      distractors: ["条件が偽になり0行が返る", "条件がUNKNOWNになり0行が返る", "副問合せに行がないためエラーになる"],
      explanation: "ALL比較は副問合せが0行ならTRUEです。DUALから取得される1行がそのまま残ります。0行の副問合せでFALSEになるのはANY比較の場合です。NULLを含む比較結果によってUNKNOWNになる場合はありますが、この副問合せにはNULLを持つ行もありません。ALLは副問合せの0行を許容します。",
      doc: "sqlrf/Comparison-Conditions.html"
    },
    {
      id: "xsql-view-read-only", domain: "ビュー",
      question: "タスク表TASKSから CREATE VIEW v AS SELECT id, status FROM tasks WITH READ ONLY でビューを作成した。元の表は通常の更新可能な表で、利用者には必要な権限がある。WITH READ ONLYの影響は？",
      answer: "ビューを参照でき、元の表を直接更新できるが、ビュー経由では更新できない",
      distractors: ["ビューの絞り込み条件を満たす行ならビュー経由で更新できる", "ビューを参照できるが、元の表を直接更新することもできなくなる", "ビューの作成後に元の表で変更されたデータはビューに反映されなくなる"],
      explanation: "WITH READ ONLYはそのビューを介した変更を禁止します。ビューの条件を満たす行の更新を許すWITH CHECK OPTIONとは効果が異なります。元の表への直接更新には影響せず、通常のビューからは読取り一貫性に従って元の表のデータを参照できます。",
      doc: "sqlrf/CREATE-VIEW.html"
    },
    {
      id: "xsql-insert-omitted-default", domain: "データ定義",
      question: "CREATE TABLE tickets (id NUMBER PRIMARY KEY, priority NUMBER DEFAULT 5) で表を作成した。トリガーは存在しない。INSERT INTO tickets (id) VALUES (1) と INSERT INTO tickets (id, priority) VALUES (2, NULL) の実行後、ID 1とID 2のPRIORITYはそれぞれ何になる？",
      answer: "5、NULL",
      distractors: ["5、5", "NULL、NULL", "NULL、5"],
      explanation: "ID 1はPRIORITYを列リストから省略したため既定値5になります。ID 2は明示的にNULLを指定し、PRIORITYがNULL許容なのでNULLが入ります。通常のDEFAULTでは明示的なNULLに5を適用しません。省略時にNULLが入るのは既定値がないNULL許容列の場合なので、ID 1をNULLとする選択肢も誤りです。",
      doc: "sqlrf/INSERT.html"
    }
  ];

  if (typeof module === "object" && module.exports) module.exports = cards;
  root.OracleSilverSqlExtra = cards;
})(globalThis);
