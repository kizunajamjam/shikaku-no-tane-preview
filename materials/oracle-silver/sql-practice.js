(function exposeOracleSilverSqlPractice(root) {
  "use strict";

  const cards = [
    {
      id: "psql-null-arithmetic", domain: "SQLによるデータ取得",
      question: "UNIT_PRICEが1200、DISCOUNTがNULLの行について、SELECT unit_price - discount AS net FROM sales が返すNETの値は？",
      answer: "NULL",
      distractors: ["1200", "0", "計算時にエラーになる"],
      explanation: "減算の一方がNULLなので結果はNULLです。1200を返すには割引をNVLなどで0に置き換えます。計算結果が0になることも、NULLを引いただけでエラーになることもありません。",
      doc: "sqlrf/Nulls.html"
    },
    {
      id: "psql-carton-operator", domain: "SQLによるデータ取得",
      question: "表SHIPMENTSのある行で、BOXESが3、UNITS_PER_BOXが8、LOOSE_UNITSが2である。SELECT boxes * units_per_box + loose_units FROM shipments がこの行について返す値は？",
      answer: "26",
      distractors: ["30", "40", "24"],
      explanation: "乗算が加算より先なので3×8＋2は26です。30は3×(8＋2)、40は(3＋2)×8と括弧を付けた結果です。24にはバラの2個が含まれていません。",
      doc: "sqlrf/About-SQL-Operators.html"
    },
    {
      id: "psql-or-and", domain: "行の制限とソート",
      question: "ORDERSのSTATUSとAMOUNTに、('NEW', 10)、('NEW', 200)、('HELD', 10)、('HELD', 200) が1行ずつある。WHERE status = 'NEW' OR status = 'HELD' AND amount >= 100 で返る組合せは？",
      answer: "('NEW', 10)、('NEW', 200)、('HELD', 200)",
      distractors: ["('NEW', 200)、('HELD', 200)", "('NEW', 10)、('NEW', 200)", "4行すべて"],
      explanation: "ANDはORより優先されるので、すべてのNEWと、金額が100以上のHELDが該当します。両方の状態に金額条件をかけるにはORの部分を括弧で囲みます。NEWの2行だけでは該当するHELDを落とし、全4行では金額が10のHELDも含めてしまいます。",
      doc: "sqlrf/About-SQL-Conditions.html"
    },
    {
      id: "psql-select-alias", domain: "行の制限とソート",
      question: "AMOUNTを持ち、TAXEDという列を持たないSALES表で、税込額の列にTAXEDという別名を付けて昇順に表示したい。19cで有効な文は？",
      answer: "SELECT amount * 1.1 AS taxed FROM sales ORDER BY taxed",
      distractors: ["SELECT amount * 1.1 AS taxed FROM sales WHERE taxed > 0 ORDER BY taxed", "SELECT amount * 1.1 AS taxed FROM sales GROUP BY taxed ORDER BY taxed", "SELECT amount * 1.1 AS taxed FROM sales ORDER BY 2"],
      explanation: "ORDER BYでは同じ問合せブロックの選択リストの列別名を使えます。19cでは同じブロックのWHEREやGROUP BYでこの別名を参照できません。ORDER BY 2は選択リストの2番目を指しますが、この文には1列しかありません。",
      doc: "sqlrf/SELECT.html"
    },
    {
      id: "psql-substr-tail", domain: "単一行関数",
      question: "SELECT SUBSTR('ZX-2026', -4, 2) FROM dual が返す文字列は？",
      answer: "'20'",
      distractors: ["'26'", "'2026'", "NULL"],
      explanation: "負の開始位置は末尾から数えます。末尾から4番目の2を起点に2文字を取るため、結果は20です。26は末尾2文字、2026は末尾4文字です。開始位置と長さが範囲内なのでNULLにはなりません。",
      doc: "sqlrf/SUBSTR.html"
    },
    {
      id: "psql-replace-delete", domain: "単一行関数",
      question: "SELECT REPLACE('A-B--C', '-') FROM dual が返す文字列は？",
      answer: "'ABC'",
      distractors: ["'AB--C'", "'A B  C'", "'A-B--C'"],
      explanation: "REPLACEの第3引数を省略すると、対象文字列のすべての出現箇所を削除します。最初のハイフンだけを削除する処理でも、空白に置換する処理でもありません。元の値のままになるのは検索文字列が現れない場合です。",
      doc: "sqlrf/REPLACE.html"
    },
    {
      id: "psql-trunc-towards-zero", domain: "単一行関数",
      question: "SELECT TRUNC(-48.76, 1) FROM dual の結果は？",
      answer: "-48.7",
      distractors: ["-48.8", "-49", "-40"],
      explanation: "TRUNCの第2引数が1なら小数第1位まで残し、それ以降を切り捨てます。-48.8はROUND(-48.76, 1)、-49はFLOOR(-48.76)、-40はTRUNC(-48.76, -1)の結果です。",
      doc: "sqlrf/TRUNC-number.html"
    },
    {
      id: "psql-decode-null", domain: "変換関数と条件式",
      question: "SELECT DECODE(CAST(NULL AS NUMBER), NULL, '未入力', 0, 'ゼロ', 'その他') FROM dual が返す文字列は？",
      answer: "'未入力'",
      distractors: ["'ゼロ'", "'その他'", "NULL"],
      explanation: "DECODEは2つのNULLを等しいものとして扱うため、最初の検索値に対応する未入力が返ります。ここでNULLを0に変換してゼロを返す処理は行いません。一致する検索値があるので既定値のその他は選ばれず、返される値自体もNULLではありません。",
      doc: "sqlrf/DECODE.html"
    },
    {
      id: "psql-to-number-fallback", domain: "変換関数と条件式",
      question: "Oracle Database 19cで、SELECT TO_NUMBER('N/A' DEFAULT 0 ON CONVERSION ERROR) FROM dual が返す値は？",
      answer: "数値の0",
      distractors: ["NULL", "文字列の'N/A'", "数値への変換エラー"],
      explanation: "N/Aを数値へ変換できないので、ON CONVERSION ERRORで指定した代替値0がNUMBERとして返ります。代替値にNULLを指定したわけではなく、元の文字列を返す関数でもありません。この入力の変換エラーは指定した代替値で処理されます。",
      doc: "sqlrf/TO_NUMBER.html"
    },
    {
      id: "psql-unmatched-both", domain: "SQL結合",
      question: "A.IDに1と2、B.IDに2と3が1行ずつある。AとBをFULL OUTER JOINし、条件をa.id = b.idとした。SELECT a.id, b.idで返る組合せは？（順不同）",
      answer: "(1, NULL)、(2, 2)、(NULL, 3)",
      distractors: ["(2, 2)のみ", "(1, NULL)、(2, 2)", "(2, 2)、(NULL, 3)"],
      explanation: "FULL OUTER JOINは一致したペアと、左右それぞれの未一致行を返します。一致だけなら内部結合、A側の未一致だけを加えるなら左外部結合、B側の未一致だけを加えるなら右外部結合の結果です。",
      doc: "sqlrf/Joins.html"
    },
    {
      id: "psql-natural-two-columns", domain: "SQL結合",
      question: "AにはIDとREGION、BにもIDとREGIONがあり、対応する列の型は同じである。Aに(1, 'E')、Bに(1, 'W')の1行だけがある。SELECT * FROM a NATURAL JOIN b は何行を返す？",
      answer: "0行",
      distractors: ["1行", "2行", "ON句がないためエラー"],
      explanation: "NATURAL JOINは同名のIDとREGIONの両方を等価結合の条件にします。REGIONが一致しないので0行です。IDだけで結合すれば1行になり、両側の未一致行を個別に保つ完全外部結合なら2行です。NATURAL JOINにON句は付けません。",
      doc: "sqlrf/SELECT.html"
    },
    {
      id: "psql-using-unqualified", domain: "SQL結合",
      question: "AとBはどちらも型が同じITEM_IDを持つ。SELECT句で結合キーを1列取得する場合、FROM a JOIN b USING (item_id) と組み合わせて指定できる選択リストは？",
      answer: "item_id",
      distractors: ["a.item_id", "b.item_id", "COALESCE(a.item_id, b.item_id)"],
      explanation: "USINGで指定した列を参照するときは修飾なしのitem_idを使います。a.item_idとb.item_idはどちらも表名による修飾が禁止されます。関数の引数に置いても修飾の制約は変わりません。",
      doc: "sqlrf/SELECT.html"
    },
    {
      id: "psql-avg-null-zero", domain: "SQL集計",
      question: "表RのNUMBER列SCOREに20、NULL、0が1行ずつある。SELECT AVG(score), AVG(NVL(score, 0)) FROM r の結果は左からどれ？",
      answer: "10、20÷3",
      distractors: ["20÷3、10", "10、10", "NULL、20÷3"],
      explanation: "AVG(score)はNULLを除いて20と0の2件を平均します。AVG(NVL(score, 0))はNULLを0に変換した3件を平均します。両者の分母を逆にした結果や両方の分母を2とした結果は誤りです。非NULL値があるため最初のAVGはNULLになりません。",
      doc: "sqlrf/Aggregate-Functions.html"
    },
    {
      id: "psql-sum-empty", domain: "SQL集計",
      question: "Tのどの行もWHERE n > 100を満たさない。SELECT COUNT(*), SUM(n) FROM t WHERE n > 100 の結果は？",
      answer: "(0, NULL)の1行",
      distractors: ["0行", "(0, 0)の1行", "(NULL, NULL)の1行"],
      explanation: "GROUP BYのない集計は対象が空でも1行を返します。COUNT(*)は0、SUMは入力がないためNULLです。元の行をそのまま取得する問合せなら0行になります。SUMを0とするにはNVLなどが必要で、COUNT(*)はNULLを返しません。",
      doc: "sqlrf/Aggregate-Functions.html"
    },
    {
      id: "psql-any-threshold", domain: "副問合せ",
      question: "基準値表LIMITSのN列には20と50だけがあり、TのN列には10、30、60が1行ずつある。SELECT n FROM t WHERE n > ANY (SELECT n FROM limits) の結果は？",
      answer: "30と60",
      distractors: ["60だけ", "30だけ", "10、30、60のすべて"],
      explanation: "> ANYは比較先のうち1つでも超えれば成立するので、20を超える30と60が返ります。すべての基準を超えることを求める> ALLなら60だけです。30が通る場合は両方を上回る60も通り、10はどの基準も上回りません。",
      doc: "sqlrf/Comparison-Conditions.html"
    },
    {
      id: "psql-scalar-two", domain: "副問合せ",
      question: "PRODUCTSに同じCATEGORYを持つ2行があり、両方のPRICEは900である。SELECT (SELECT price FROM products WHERE category = 'BOOK') FROM dual で、BOOKがその2行に一致すると結果は？",
      answer: "単一行を要求する副問合せが2行を返したためエラーになる",
      distractors: ["900が1行返る", "900が2行返る", "NULLが1行返る"],
      explanation: "スカラー副問合せの制限は値の種類ではなく行数です。2行が同じ値でも自動で重複排除されず、外側の問合せに2行として展開することもありません。NULLが返るのは副問合せが0行のときです。",
      doc: "sqlrf/Scalar-Subquery-Expressions.html"
    },
    {
      id: "psql-union-type-groups", domain: "SQL集合演算",
      question: "A.NはNUMBER、B.CODEはVARCHAR2であり、B.CODEの値はどれも数字だけで構成される。SELECT n FROM a UNION SELECT code FROM b はどうなる？",
      answer: "対応する列のデータ型グループが異なるためエラーになる",
      distractors: ["B.CODEを自動でNUMBERに変換して結果を返す", "A.Nを自動でVARCHAR2に変換して結果を返す", "変換なしで両方の型の値を同じ結果列に返す"],
      explanation: "集合演算では対応する選択式のデータ型グループをそろえる必要があります。文字と数値のグループをまたぐ暗黙変換はどちらの方向にも行われません。型が異なる行が同じ結果列に混在するわけでもありません。明示変換を指定すれば型をそろえられます。",
      doc: "sqlrf/The-UNION-ALL-INTERSECT-MINUS-Operators.html"
    },
    {
      id: "psql-intersect-both-distinct", domain: "SQL集合演算",
      question: "A.Nの値は4、4、7で、B.Nの値は4、4、9である。SELECT n FROM a INTERSECT SELECT n FROM b の結果は？",
      answer: "4が1行",
      distractors: ["4が2行", "4、7、9が1行ずつ", "7が1行"],
      explanation: "INTERSECTは両方に存在する値を重複なしで返すので4が1行です。両方に4が2件あっても結果に重複は残りません。4、7、9はUNION、7だけはAを左辺としたMINUSの結果です。",
      doc: "sqlrf/The-UNION-ALL-INTERSECT-MINUS-Operators.html"
    },
    {
      id: "psql-select-lock", domain: "トランザクション",
      question: "別セッションが表Tの対象行をすでに更新している。更新が未コミットの間にロックが取れるか試し、相手の終了を待つことなく失敗として扱いたい。どのSQL文を使う？",
      answer: "SELECT * FROM t WHERE id = 10 FOR UPDATE NOWAIT",
      distractors: ["SELECT * FROM t WHERE id = 10 FOR UPDATE", "SELECT * FROM t WHERE id = 10 FOR UPDATE SKIP LOCKED", "SELECT * FROM t WHERE id = 10"],
      explanation: "FOR UPDATE NOWAITは対象行がロック済みなら待機せずエラーを返します。FOR UPDATE単独ではロックの解除を待ちます。SKIP LOCKEDはロック済み行を結果から除きます。通常のSELECTは対象行の更新ロックを取得しません。",
      doc: "sqlrf/SELECT.html"
    },
    {
      id: "psql-statement-rollback", domain: "トランザクション",
      question: "制約が即時検査される表Tで、キー1の値を更新するUPDATEは成功した。次の複数行INSERTはエラー・ロギングを指定せずに実行し、一意制約違反で失敗した。両文は同じセッションで自動コミット無効の状態で実行し、エラー後に手動でCOMMITした。何が確定する？",
      answer: "UPDATEだけが確定する",
      distractors: ["UPDATEと、INSERTのうち違反していない行が確定する", "UPDATEとINSERTのすべての行が確定する", "どちらも確定しない"],
      explanation: "一意制約違反で失敗した文は、その文の変更全体が取り消されます。INSERTのうち違反していない行も残らず、INSERT全体が確定することもありません。先に成功したUPDATEは文単位のロールバックの対象外なので、後続のCOMMITで確定します。",
      doc: "cncpt/transactions.html"
    },
    {
      id: "psql-insert-first", domain: "トランザクション",
      question: "各受注行に対し、金額が100以上ならHIGH_ORDERSへ、そうでなく金額が50以上ならMID_ORDERSへ、残りはLOW_ORDERSへ1回だけ挿入する。WHEN条件に >= 100 と >= 50 を個別に使う場合、どの指定が要件を満たす？",
      answer: "INSERT FIRSTで >= 100、>= 50、ELSEの順に指定する",
      distractors: ["INSERT FIRSTで >= 50、>= 100、ELSEの順に指定する", "INSERT ALLで >= 100、>= 50、ELSEの順に指定する", "INSERT FIRSTで >= 100、>= 50 だけを指定する"],
      explanation: "INSERT FIRSTは入力行ごとに最初に成立したWHENを使います。>= 50を先に置くと100以上の行もMID_ORDERSに入ります。INSERT ALLでは複数のWHENが成立すればすべての挿入を行います。ELSEを省くと、50未満など両方のWHENを満たさない行はどこにも入りません。",
      doc: "sqlrf/INSERT.html"
    },
    {
      id: "psql-alter-add-not-null", domain: "データ定義",
      question: "通常のヒープ表Tに既存行がある。新規列STATUSを追加し、既存行も新規行もNULLを許さず、既存行のSTATUSを'NEW'にしたい。要件を満たす単一のDDLは？",
      answer: "ALTER TABLE t ADD (status VARCHAR2(10) DEFAULT 'NEW' NOT NULL)",
      distractors: ["ALTER TABLE t ADD (status VARCHAR2(10) NOT NULL)", "ALTER TABLE t ADD (status VARCHAR2(10) DEFAULT 'NEW')", "ALTER TABLE t MODIFY (status VARCHAR2(10) DEFAULT 'NEW' NOT NULL)"],
      explanation: "ADDで新しい列にDEFAULTとNOT NULLを同時に設定すれば、既存行には既定値が適用され、NULLを禁止できます。既存行があるため既定値なしでNOT NULLの新規列は追加できません。DEFAULTだけでは明示的なNULLを禁止できません。MODIFYは既存列を変更する構文です。",
      doc: "sqlrf/ALTER-TABLE.html"
    },
    {
      id: "psql-composite-primary-key", domain: "制約と一時表",
      question: "LINE_ITEMS表の主キーは(ORDER_ID, LINE_NO)である。既存行は(12, 1)の1行だけで、他に関連する制約はない。次のうち挿入できる行は？",
      answer: "(12, 2)",
      distractors: ["(12, 1)", "(12, NULL)", "(NULL, 2)"],
      explanation: "複合主キーの一意性は列の組合せに適用されるので、(12, 2)は挿入できます。(12, 1)は既存の主キーと同じです。主キーを構成する列はそれぞれNULLを許容しないため、片方だけがNULLでも挿入できません。",
      doc: "sqlrf/constraint.html"
    },
    {
      id: "psql-drop-index-data", domain: "シーケンス・シノニム・索引",
      question: "通常の表Tに対し、制約の実施に使っていない非一意索引IDX_Tを作成した。所有者がDROP INDEX idx_tを正常に実行した直後の状態は？",
      answer: "索引は削除され、Tの表データは残る",
      distractors: ["索引とTがともに削除される", "Tは残るが、索引を通じて参照されたことのある行だけ削除される", "索引と表データは残り、索引がINVISIBLEに変更される"],
      explanation: "DROP INDEXの対象は索引です。表の定義も格納された行も削除されません。索引の利用履歴によって行が消えることもありません。索引を残してオプティマイザから通常は見えないようにする操作はALTER INDEXによるINVISIBLEの指定です。",
      doc: "sqlrf/DROP-INDEX.html"
    }
  ];

  if (typeof module === "object" && module.exports) module.exports = cards;
  root.OracleSilverSqlPractice = cards;
})(globalThis);
