(function exposeOracleSilverSql(root) {
  "use strict";

  const cards = [
    {
      id: "sql-fetch-ties", domain: "行の制限とソート",
      question: "売上額が高い順に最大3行を取得したい。同額なら注文IDの昇順とする。売上額はすべて非NULL、注文IDは一意。正しいSELECT文は？",
      answer: "SELECT * FROM orders ORDER BY amount DESC, order_id FETCH FIRST 3 ROWS ONLY",
      distractors: ["SELECT * FROM orders WHERE ROWNUM <= 3 ORDER BY amount DESC, order_id", "SELECT * FROM orders ORDER BY amount DESC, order_id OFFSET 3 ROWS FETCH NEXT 3 ROWS ONLY", "SELECT * FROM orders ORDER BY amount DESC FETCH FIRST 3 ROWS WITH TIES"],
      explanation: "ORDER BYで両方の順序を指定し、FETCH FIRSTで先頭から最大3行を取得します。同じ問合せブロックのWHEREでROWNUMを制限すると、ソート前に行を選びます。OFFSET 3は先頭3行を飛ばします。売上額だけのWITH TIESでは境界と同額の行も返り、注文IDによる順序も指定されません。",
      doc: "sqlrf/SELECT.html"
    },
    {
      id: "sql-sort-null", domain: "行の制限とソート",
      question: "表TのN列に2、NULL、8が1行ずつ入っている。ORDER BY n DESCとだけ指定した場合、値の並びはどれ？",
      answer: "NULL、8、2",
      distractors: ["8、2、NULL", "2、8、NULL", "NULL、2、8"],
      explanation: "Oracleの降順ではNULLS FIRSTが既定で、その後に8、2が続きます。8、2、NULLは降順でNULLS LASTを指定した場合、2、8、NULLは既定の昇順、NULL、2、8は昇順でNULLS FIRSTを指定した場合です。",
      doc: "sqlrf/SELECT.html"
    },
    {
      id: "sql-date-literal", domain: "変換関数と条件式",
      question: "NLS_DATE_FORMATが異なるセッションでも、2026年11月21日の午前0時をDATE値として指定できる式は？",
      answer: "DATE '2026-11-21'",
      distractors: ["TO_DATE('2026-11-21')", "DATE '21-11-2026'", "TO_DATE('2026-11-21', 'YYYY-DD-MM')"],
      explanation: "ANSI日付リテラルはYYYY-MM-DD形式で、時刻は午前0時です。書式を省略したTO_DATEは既定の日付書式に依存します。21-11-2026は日付リテラルの書式に合いません。YYYY-DD-MMは21を月として解釈するためエラーになります。",
      doc: "sqlrf/Literals.html"
    },
    {
      id: "sql-nullif-coalesce", domain: "変換関数と条件式",
      question: "割引率の候補としてNUMBER型の a、b がある。aの0は未入力扱いとし、aがNULLまたは0ならbを使う。bもNULLなら5を返す。正しい式は？",
      answer: "COALESCE(NULLIF(a, 0), b, 5)",
      distractors: ["COALESCE(a, b, 5)", "COALESCE(NULLIF(b, 0), a, 5)", "COALESCE(NULLIF(a, 0), 5, b)"],
      explanation: "NULLIF(a, 0)はaが0ならNULLを返し、COALESCEは最初の非NULL値を返します。aを直接渡すと0を採用します。bにNULLIFを適用する選択肢は候補の優先順位も逆です。5をbより先に置くとbには到達しません。",
      doc: "sqlrf/COALESCE.html"
    },
    {
      id: "sql-distinct", domain: "SQLによるデータ取得",
      question: "Tの2列A、Bに ('X', 1)、('X', 1)、('X', 2)、('Y', 1) の4行がある。SELECT DISTINCT a, b FROM t は何行を返す？",
      answer: "3行",
      distractors: ["2行", "4行", "1行"],
      explanation: "DISTINCTは選択リスト全体が同じ行を1つにまとめます。2行はA列だけを重複排除した場合の件数です。4行は重複排除をしない件数です。重複のある組合せだけを返す処理は行わないので、1行にもなりません。",
      doc: "sqlrf/SELECT.html"
    },
    {
      id: "sql-concat-null", domain: "単一行関数",
      question: "Oracle Database 19cで SELECT CONCAT('AB', NULL), LENGTH('AB') FROM dual を実行した。結果は左からどれ？",
      answer: "'AB'、2",
      distractors: ["NULL、2", "'ABNULL'、2", "'AB'、1"],
      explanation: "Oracleの文字列連結では、一方がNULLならもう一方の文字列が返ります。したがって連結結果はNULLでも、NULLという文字を付けたABNULLでもありません。LENGTHはABの文字数を数えるため2です。",
      doc: "sqlrf/CONCAT.html"
    },
    {
      id: "sql-date-round", domain: "単一行関数",
      question: "SELECT ROUND(DATE '2024-02-15', 'MM'), TRUNC(DATE '2024-02-15', 'MM') FROM dual が返す日付の組合せは？",
      answer: "2024年2月1日、2024年2月1日",
      distractors: ["2024年3月1日、2024年2月1日", "2024年2月1日、2024年2月15日", "2024年2月29日、2024年2月1日"],
      explanation: "月単位のROUNDは16日を境に翌月初へ丸めるので、15日は当月初です。TRUNCは指定単位の先頭へ切り捨てるので2月1日です。翌月初への丸めは16日以降に起こり、TRUNCが15日を維持することも、ROUNDが月末の29日を返すこともありません。",
      doc: "sqlrf/ROUND-and-TRUNC-Date-Functions.html"
    },
    {
      id: "sql-not-in-null", domain: "副問合せ",
      question: "DEPTにはIDが1、2、3の3行、EMPにはDEPT_IDが2とNULLの2行がある。SELECT id FROM dept WHERE id NOT IN (SELECT dept_id FROM emp) が返す行は？",
      answer: "0行",
      distractors: ["1と3の2行", "2の1行", "1、2、3の3行"],
      explanation: "2は副問合せに存在するため条件はFALSEです。1と3はNULLとの不一致を確定できずUNKNOWNとなり、WHEREでは除外されます。1と3は副問合せからNULLを除外した場合の結果です。2だけを返すのはINの場合で、3行すべてを通す条件でもありません。",
      doc: "sqlrf/IN-Condition.html"
    },
    {
      id: "sql-scalar-empty", domain: "副問合せ",
      question: "EMPにIDが-1の行は存在しない。SELECT (SELECT salary FROM emp WHERE id = -1) AS s FROM dual の結果は？",
      answer: "SがNULLの1行",
      distractors: ["結果は0行", "Sが0の1行", "副問合せが0行なのでエラー"],
      explanation: "スカラー副問合せが0行の場合、式の値はNULLです。外側のFROM dualは1行を返します。0への変換は自動では行われません。単一列のスカラー副問合せで行数によるエラーが起こるのは、2行以上を返した場合です。",
      doc: "sqlrf/Scalar-Subquery-Expressions.html"
    },
    {
      id: "sql-alter-drop", domain: "データ定義",
      question: "既存の表Tから、依存する制約がない列OLD_CODEの定義とデータを削除したい。実行するSQLは？",
      answer: "ALTER TABLE t DROP COLUMN old_code",
      distractors: ["UPDATE t SET old_code = NULL", "ALTER TABLE t RENAME COLUMN old_code TO archived_code", "TRUNCATE TABLE t"],
      explanation: "DROP COLUMNはその列の定義とデータを削除します。UPDATEでNULLを設定しても列定義は残ります。RENAME COLUMNは列名だけを変えます。TRUNCATE TABLEは表の全行を削除し、列定義は残します。",
      doc: "sqlrf/ALTER-TABLE.html"
    },
    {
      id: "sql-check-option", domain: "ビュー",
      question: "CREATE VIEW v AS SELECT id, enabled FROM tasks WHERE enabled = 1 WITH CHECK OPTION で作ったビューに、IDが10の行が表示される。適切な権限を持つユーザーが UPDATE v SET enabled = 0 WHERE id = 10 を実行するとどうなる？",
      answer: "更新後の行がビューの条件に合わないため、UPDATEはエラーになる",
      distractors: ["更新に成功し、行はビューから見えなくなる", "UPDATEに成功し、基表の行が削除される", "UPDATEは成功したと表示されるが、値は1のままになる"],
      explanation: "WITH CHECK OPTIONはビュー経由の更新で、結果の行がビューから見えなくなる操作を拒否します。行が単に非表示になるのは検査がない場合の挙動です。このUPDATEがDELETEに置き換わったり、値を維持したまま成功したりすることはありません。",
      doc: "sqlrf/CREATE-VIEW.html"
    },
    {
      id: "sql-current-timestamp", domain: "タイムゾーン",
      question: "クライアントのセッション・タイムゾーンで現在時刻を取得し、戻り値自体にもタイムゾーン情報を含めたい。どの式を選ぶ？",
      answer: "CURRENT_TIMESTAMP",
      distractors: ["LOCALTIMESTAMP", "CURRENT_DATE", "SYSDATE"],
      explanation: "CURRENT_TIMESTAMPはセッション・タイムゾーンでの現在時刻をTIMESTAMP WITH TIME ZONE型で返します。LOCALTIMESTAMPはセッションの現在時刻をTIMESTAMP型で返し、CURRENT_DATEはセッション時刻をDATE型で返します。SYSDATEはデータベース・サーバーのOSの現在時刻をDATE型で返します。",
      doc: "sqlrf/CURRENT_TIMESTAMP.html"
    },
    {
      id: "sql-sequence-current", domain: "シーケンス・シノニム・索引",
      question: "セッションAが新規シーケンスSのNEXTVALを一度取得した。Sを参照できる別セッションBではSのNEXTVALをまだ取得していない。Bが最初に SELECT s.CURRVAL FROM dual を実行するとどうなる？",
      answer: "BのセッションでCURRVALが未定義のためエラーになる",
      distractors: ["Aが直近に取得したNEXTVALを返す", "Bのために次の番号を払い出す", "NULLを返す"],
      explanation: "CURRVALは同じセッションでNEXTVALを取得してから使用できます。Aで払い出した番号はBのCURRVALを初期化しません。番号を進める疑似列はNEXTVALです。未初期化のCURRVALを呼ぶとNULLではなくエラーになります。",
      doc: "sqlrf/Sequence-Pseudocolumns.html"
    },
    {
      id: "sql-synonym-access", domain: "シーケンス・シノニム・索引",
      question: "ユーザーAPPは自身のスキーマに SALES.ORDERS を指すプライベート・シノニムを作成できた。APPは対象表へのSELECTを許す権限を一切持たない。シノニム名を使うSELECTはどうなる？",
      answer: "参照に必要な権限がないため失敗する",
      distractors: ["シノニムの所有者なので実行できる", "プライベート・シノニムをパブリックに変更すれば実行できる", "対象表へのUPDATE権限だけを得ればSELECTできる"],
      explanation: "シノニムはオブジェクトの別名です。自身が所有するシノニムでも、パブリック・シノニムでも、対象表への参照権限は自動で得られません。UPDATEは行の更新を許す権限で、単独のSELECTには参照権限が必要です。",
      doc: "sqlrf/CREATE-SYNONYM.html"
    },
    {
      id: "sql-index-null", domain: "シーケンス・シノニム・索引",
      question: "TのNULL許容列Nだけに通常のBツリー索引を作成した。NがNULLの行はこの索引にどう格納される？",
      answer: "索引キーの全列がNULLなので、その行の索引エントリは作られない",
      distractors: ["NULLを0に変換したキーが入る", "NULLの索引エントリがすべての対象行について入る", "NULLの行が1件でもあれば索引の作成はエラーになる"],
      explanation: "通常のBツリー索引は、キーの全列がNULLの行を格納しません。NULLを0へ自動変換する処理はなく、この単一列索引には該当する行のエントリが入りません。列にNULLの行があっても、索引作成の妨げにはなりません。",
      doc: "sqlrf/CREATE-INDEX.html"
    },
    {
      id: "sql-check-unknown", domain: "制約と一時表",
      question: "数量QTYには CHECK (qty > 0) を定義した。NOT NULL制約や既定値、トリガーはない。QTYに明示的にNULLを指定したINSERTはどうなる？",
      answer: "検査結果がUNKNOWNなので、NULLのまま挿入できる",
      distractors: ["検査結果がFALSEなので挿入できない", "検査がTRUEになる最小整数の1に置き換わる", "CHECK制約が無効な場合だけ挿入できる"],
      explanation: "CHECK制約に違反するのは述語がFALSEのときです。NULLとの比較はUNKNOWNなので、制約が有効でも挿入できます。CHECK制約は入力を1などの別の値に置き換えません。",
      doc: "sqlrf/constraint.html"
    },
    {
      id: "sql-gtt-preserve", domain: "制約と一時表",
      question: "ON COMMIT PRESERVE ROWS を指定したグローバル一時表に、セッションAが1行挿入してCOMMITした。直後、同じ表に対してAと別セッションBがSELECTするとどうなる？ どちらにも参照権限があり、Bはこの表に挿入していない。",
      answer: "Aだけが挿入行を参照できる",
      distractors: ["AもBも挿入行を参照できる", "COMMITで行が消え、AもBも参照できない", "Aは挿入行を参照できるが、Bは表が存在しないというエラーになる"],
      explanation: "PRESERVE ROWSでは行がセッション終了まで保持され、Aだけに見えます。COMMITで行を消去する指定はDELETE ROWSです。グローバル一時表の定義は共有されるので、参照権限のあるBの問合せはエラーではなく0行を返します。",
      doc: "sqlrf/CREATE-TABLE.html"
    },
    {
      id: "sql-group-having", domain: "SQL集計",
      question: "ORDERS(dept_id, amount) から、個々の注文額が100以上の行だけを集計し、その合計が1000以上の部署を取得したい。正しいSELECT文は？",
      answer: "SELECT dept_id FROM orders WHERE amount >= 100 GROUP BY dept_id HAVING SUM(amount) >= 1000",
      distractors: ["SELECT dept_id FROM orders WHERE SUM(amount) >= 1000 GROUP BY dept_id HAVING MIN(amount) >= 100", "SELECT dept_id FROM orders WHERE amount >= 1000 GROUP BY dept_id HAVING SUM(amount) >= 100", "SELECT dept_id FROM orders GROUP BY dept_id HAVING MIN(amount) >= 100 AND SUM(amount) >= 1000"],
      explanation: "WHEREで集計前の個別行を絞り、HAVINGで集計後の部署を絞ります。SUMをWHEREに直接書くことはできません。100と1000を逆にすると、1000未満の注文を除外してしまいます。HAVINGのMINで100以上を要求すると、100未満の注文を1件でも含む部署を丸ごと除外します。",
      doc: "sqlrf/SELECT.html"
    }
  ];

  if (typeof module === "object" && module.exports) module.exports = cards;
  root.OracleSilverSql = cards;
})(globalThis);
