(function exposeOracleSilverScenarios(root) {
  "use strict";

  const cards = [
    {
      id: "scenario-force-view", domain: "ビュー",
      question: "移行スクリプトで、作成予定のTASKS表より先に TASK_LIST ビューの定義を登録したい。必要な権限があり、制約は定義しない。どの指定が使える？",
      answer: "CREATE FORCE VIEW task_list AS SELECT id FROM tasks",
      distractors: ["CREATE NOFORCE VIEW task_list AS SELECT id FROM tasks", "CREATE VIEW task_list AS SELECT id FROM tasks WITH READ ONLY", "CREATE OR REPLACE VIEW task_list AS SELECT id FROM tasks"],
      explanation: "FORCEなら基になる表が未作成でもビューの定義を作成できます。利用できるのは表が作成され、依存関係が解決されてからです。NOFORCEは既定で、READ ONLYは更新の可否、OR REPLACEは既存定義の置き換えを制御します。",
      doc: "sqlrf/CREATE-VIEW.html"
    },
    {
      id: "scenario-view-compile", domain: "ビュー",
      question: "参照先の変更でビューがINVALIDになった。参照先は修正済みで、ビューのSELECT文は有効である。定義を変更せず明示的に再コンパイルする文は？",
      answer: "ALTER VIEW task_list COMPILE",
      distractors: ["ALTER VIEW task_list ENABLE", "ALTER TABLE task_list COMPILE", "CREATE VIEW task_list COMPILE"],
      explanation: "ALTER VIEWのCOMPILEは、ビューの定義を変更せずに明示的に再コンパイルします。ENABLEはこの用途の構文ではありません。ALTER TABLEは表の変更、CREATE VIEWにはCOMPILE句がありません。",
      doc: "sqlrf/ALTER-VIEW.html"
    },
    {
      id: "scenario-drop-view", domain: "ビュー",
      question: "分析用の通常のビューMONTHLY_SUMMARYを作り直すため、DROP VIEW monthly_summary を実行した。参照元の表とそのデータはどうなる？",
      answer: "ビューの定義が削除され、参照元の表とデータは残る",
      distractors: ["ビューの定義と参照元の表が削除される", "ビューで表示されていた表の行だけが削除される", "ビューを作成した時点の状態まで参照元の表が巻き戻る"],
      explanation: "DROP VIEWで消えるのはビューの定義です。参照元の表のDROP、表示された行のDELETE、過去時点への復元はいずれも行いません。",
      doc: "sqlrf/DROP-VIEW.html"
    },
    {
      id: "scenario-aggregate-view", domain: "ビュー",
      question: "V_TOTALを SELECT dept_id, SUM(amount) total FROM sales GROUP BY dept_id で定義した。INSTEAD OFトリガーはない。適切な権限のある利用者が UPDATE v_total SET total=100 WHERE dept_id=10 を実行すると？",
      answer: "集計ビューのためUPDATEはエラーになる",
      distractors: ["部署10の全売上行のAMOUNTが100になる", "部署10の最初の売上行だけが変更される", "ビューにだけ100が保存され、元表には影響しない"],
      explanation: "GROUP BYや集計関数を含むビューはこの方法では更新できません。SUMの結果から元表のどの行をどう変えるかは決まりません。通常のビューは計算済みの値を独自に保存しません。",
      doc: "sqlrf/CREATE-VIEW.html"
    },
    {
      id: "scenario-replace-view", domain: "ビュー",
      question: "REPORTERにSELECTを直接付与済みの通常のビューを、適切な権限でCREATE OR REPLACE VIEWを使って差し替える。列名と型は維持する。既存の付与はどうなる？",
      answer: "ビューに付与済みのSELECTは維持される",
      distractors: ["SELECT権限は新定義から必ず剥奪される", "REPORTERに元表のSELECTも自動付与される", "REPORTERがビューの所有者に変更される"],
      explanation: "OR REPLACEで再定義したビューの既存オブジェクト権限は維持されます。参照元への権限が自動で広がったり、所有者が変わったりすることもありません。",
      doc: "sqlrf/CREATE-VIEW.html"
    },
    {
      id: "scenario-local-timestamp", domain: "タイムゾーン",
      question: "セッションのタイムゾーンで現在の日時を取得したい。小数秒を保持し、結果のデータ型はタイムゾーン情報を含まないTIMESTAMPとする。どの式が適切？",
      answer: "LOCALTIMESTAMP",
      distractors: ["CURRENT_DATE", "CURRENT_TIMESTAMP", "SYSTIMESTAMP"],
      explanation: "LOCALTIMESTAMPはセッションの時刻をTIMESTAMP型で返します。CURRENT_DATEはDATE型なので小数秒を持ちません。CURRENT_TIMESTAMPとSYSTIMESTAMPはタイムゾーン付きで、後者はデータベースが稼働するシステム側の日時です。",
      doc: "sqlrf/LOCALTIMESTAMP.html"
    },
    {
      id: "scenario-current-date", domain: "タイムゾーン",
      question: "クライアントからALTER SESSION SET TIME_ZONE = '+09:00'を実行した。現在日時をセッション側のタイムゾーンに合わせ、DATE型で取得する関数は？",
      answer: "CURRENT_DATE",
      distractors: ["SYSDATE", "LOCALTIMESTAMP", "CURRENT_TIMESTAMP"],
      explanation: "CURRENT_DATEはセッションのタイムゾーンで日時を計算し、DATEを返します。SYSDATEもDATEですがサーバー側の時刻に基づきます。LOCALTIMESTAMPとCURRENT_TIMESTAMPはTIMESTAMP系の型です。",
      doc: "sqlrf/CURRENT_DATE.html"
    },
    {
      id: "scenario-interval-midnight", domain: "タイムゾーン",
      question: "SELECT TIMESTAMP '2026-04-30 23:45:00' + INTERVAL '0 00:30:00' DAY TO SECOND FROM dual が表す日時は？",
      answer: "2026年5月1日 00:15:00",
      distractors: ["2026年4月30日 23:45:30", "2026年4月30日 00:15:00", "2026年5月1日 05:45:00"],
      explanation: "DAY TO SECONDの文字列は日と、時・分・秒を表します。この間隔は30分なので日付をまたぎます。30秒、日付据え置き、6時間後のいずれでもありません。",
      doc: "sqlrf/Literals.html"
    },
    {
      id: "scenario-interval-precision", domain: "タイムゾーン",
      question: "Oracle SQLのINTERVALリテラルで、120日5時間を指定したい。開始フィールドと精度も考慮すると、有効な式は？",
      answer: "INTERVAL '120 05' DAY(3) TO HOUR",
      distractors: ["INTERVAL '120 05' DAY(2) TO HOUR", "INTERVAL '120:05' HOUR(3) TO MINUTE", "INTERVAL '120' DAY(3)"],
      explanation: "120日は3桁なのでDAY(3)が必要で、空白の後の05は時です。DAY(2)は日数の桁が足りません。HOUR TO MINUTEは120時間5分で、DAYだけでは5時間が含まれません。",
      doc: "sqlrf/Literals.html"
    },
    {
      id: "scenario-invisible-index", domain: "シーケンス・シノニム・索引",
      question: "索引を削除せずに候補から外した場合の実行計画を確認したい。通常のBツリー索引をINVISIBLEにし、OPTIMIZER_USE_INVISIBLE_INDEXESはFALSEのままにした。索引はどうなる？",
      answer: "オプティマイザは使わないが、表のDMLに合わせて索引は保守される",
      distractors: ["オプティマイザもDMLも引き続き通常どおり利用する", "索引が即時削除され、領域が回収される", "索引は残るがDMLで保守されず、VISIBLEに戻すときに常に再構築が必要になる"],
      explanation: "INVISIBLEはオプティマイザから隠す指定です。索引自体は残り、表のINSERT・UPDATE・DELETEに応じて保守されます。DROPや保守の停止とは異なります。",
      doc: "sqlrf/ALTER-INDEX.html"
    },
    {
      id: "scenario-function-index", domain: "シーケンス・シノニム・索引",
      question: "SELECT * FROM customer WHERE UPPER(email) = 'A@EXAMPLE.COM' の条件で評価する式そのものを索引に格納したい。どの定義が適切？",
      answer: "CREATE INDEX ix_email_upper ON customer (UPPER(email))",
      distractors: ["CREATE INDEX ix_email_upper ON customer (email)", "CREATE INDEX ix_email_upper ON customer (LOWER(email))", "CREATE INDEX ix_email_upper ON customer (email DESC)"],
      explanation: "UPPER(email)のファンクション索引が、問合せに現れる式の値を格納します。emailは元の値、LOWER(email)は小文字化した値です。DESCは格納順を指定し、大文字化は行いません。",
      doc: "sqlrf/CREATE-INDEX.html"
    },
    {
      id: "scenario-connect-alias", domain: "Oracle Net",
      question: "SQL*Plusを実行する端末で、同じホスト・ポートにある2つのデータベースサービスを別々の別名で区別したい。ローカル・ネーミングでは何を変える？",
      answer: "tnsnames.oraに2つの別名を定義し、それぞれの接続記述子で異なるSERVICE_NAMEを指定する",
      distractors: ["sqlnet.oraの名前解決順序にサービスを2つ直接並べる", "接続先に同じSERVICE_NAMEを指定し、別名の文字列だけ変える", "クライアント側のlistener.oraに2つのサービスの待受けを定義する"],
      explanation: "ローカル・ネーミングは別名と接続記述子の対応をtnsnames.oraに定義します。名前解決順序は検索する方式の順番です。同じサービス名では接続先サービスを区別できず、listener.oraは待受け側の構成に使います。",
      doc: "netag/identifying-and-accessing-database.html"
    },
    {
      id: "scenario-merge", domain: "トランザクション",
      question: "STAGINGにID 10、20が各1行あり、ORDERSにはID 10だけがある。IDで照合し、一致時にUPDATEし、不一致時にINSERTするMERGEが成功した。ORDERSの変化は？",
      answer: "ID 10を更新し、ID 20を新規に挿入する",
      distractors: ["ID 10と20を新規に挿入する", "ID 10だけを更新し、ID 20を無視する", "ID 10を削除してID 20を新規に挿入する"],
      explanation: "照合条件で一致する10にはUPDATE、不一致の20にはINSERTが適用されます。両方を挿入する処理でも、一致行だけを処理する文でもありません。DELETEを指定していないので10は削除されません。",
      doc: "sqlrf/MERGE.html"
    },
    {
      id: "scenario-read-only-transaction", domain: "トランザクション",
      question: "一般ユーザーがトランザクションの最初の文でSET TRANSACTION READ ONLYを実行した。別セッションが後から通常の表の行を更新してコミットした。自分の同じトランザクション内の別のSELECTには何が見える？",
      answer: "トランザクション開始時点のデータ",
      distractors: ["各SELECTのたびに新しいコミット済みデータ", "別セッションの未コミットの値も含む最新データ", "他セッションが更新した表はその後一切参照できない"],
      explanation: "READ ONLYトランザクションでは複数の問合せが同じトランザクション開始時点のスナップショットを読みます。各文の時点で参照する通常のREAD COMMITTEDとは異なります。未コミット値は見えず、別セッションが更新しても参照できます。",
      doc: "sqlrf/SET-TRANSACTION.html"
    },
    {
      id: "scenario-reader-undo", domain: "トランザクション",
      question: "ID 1の値は100でコミット済み。セッションAが値を200にUPDATEして未コミット。通常のREAD COMMITTEDのセッションBが、ロックを要求しないSELECTでその行を読むと？",
      answer: "Aのコミットを待たず、100を読む",
      distractors: ["Aのコミットを待たず、200を読む", "Aがトランザクションを終了するまで必ず待つ", "更新処理中なので対象行は結果に含まれない"],
      explanation: "通常のSELECTには一貫性読取りが適用され、この時点のコミット済み値100が見えます。他セッションの未確定値200を読まず、更新中を理由に行を除外しません。更新用のロックを要求するSELECT FOR UPDATEとの違いです。",
      doc: "cncpt/data-concurrency-and-consistency.html"
    },
    {
      id: "scenario-ordinary-truncate", domain: "データ定義",
      question: "外部キーの参照を受けていない通常の永続表LOGSに対し、TRUNCATE TABLE logs が成功した。表の定義と行はどうなり、直後のROLLBACKでどうなる？",
      answer: "定義は残り、全行が取り除かれ、ROLLBACKでは行は戻らない",
      distractors: ["表の定義と行が消え、ROLLBACKで両方が戻る", "定義は残り、全行を取り除くがROLLBACKで行が戻る", "表の定義と行が消え、ROLLBACKでも戻らない"],
      explanation: "TRUNCATEは表を残して行を取り除くDDLです。通常の永続表ではROLLBACKで取り消せません。定義まで消すのはDROPで、コミット前に取り消せる行削除にはDELETEを使えます。",
      doc: "sqlrf/TRUNCATE-TABLE.html"
    },
    {
      id: "scenario-fk-set-null", domain: "制約と一時表",
      question: "TICKETSのNULL許容列ASSIGNEE_IDは、USERSの主キーをON DELETE SET NULLで参照する。利用者1を削除し、ほかに制約・トリガーの影響がない場合、その利用者に割り当てたチケットは？",
      answer: "チケット行は残り、ASSIGNEE_IDがNULLになる",
      distractors: ["割当て済みのチケットも削除される", "チケットが参照しているので利用者の削除が拒否される", "チケットに利用者1のIDが残る"],
      explanation: "SET NULLでは子行を残して外部キー値をNULLにします。子行を削除するのはCASCADEです。削除時の動作を指定しなければ参照中の親行の削除は拒否され、今回の設定では消えた親の値が子行に残ることもありません。",
      doc: "sqlrf/constraint.html"
    },
    {
      id: "scenario-null-predicate", domain: "行の制限とソート",
      question: "表の列NOTEにNULL、文字列'A'、文字列'B'が1行ずつある。WHERE note <> 'A' で返る値は？",
      answer: "'B'だけ",
      distractors: ["NULLと'B'", "NULLだけ", "'A'と'B'"],
      explanation: "NULLと'A'の比較はUNKNOWNなのでWHEREを通りません。'A'同士では不等号の条件はFALSEで、'B'だけがTRUEです。NULLも取得したい場合はOR note IS NULLなどで明示します。",
      doc: "sqlrf/Null-Conditions.html"
    }
  ];

  if (typeof module === "object" && module.exports) module.exports = cards;
  root.OracleSilverScenarios = cards;
})(globalThis);
