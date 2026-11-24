(function exposeOracleCases(root) {
  "use strict";

  const cards = [
    {
      id: "case-checkpoint", domain: "アーキテクチャ",
      question: "チェックポイントの説明で、担当プロセスと書込み先が正しく対応しているものは？",
      answer: "DBWnが変更済みのデータブロックをデータファイルに書く",
      distractors: ["CKPTが変更済みのデータブロックをデータファイルに書く", "LGWRが変更済みのデータブロックをデータファイルに書く", "ARCnがチェックポイントのたびにデータファイル全体をコピーする"],
      explanation: "変更済みブロックの書込み担当はDBWnです。CKPTはDBWnに通知し、チェックポイント情報を更新します。LGWRの出力先はオンラインREDOログです。ARCnは切替済みREDOログをアーカイブします。",
      doc: "cncpt/process-architecture.html"
    },
    {
      id: "case-control", domain: "インスタンス管理",
      question: "制御ファイルを多重化して稼働中のデータベースで、追加データファイルの情報が制御ファイルに記録される。通常、Oracleはどのコピーを更新する？",
      answer: "CONTROL_FILESに指定されたすべての制御ファイル",
      distractors: ["先頭のコピーだけ。残りは次回起動時に同期する", "現在のREDOログと同じグループ番号のコピーだけ", "更新のたびに1つずつ順番に選んだコピー"],
      explanation: "指定されたコピーは同じ情報を保つため、すべて書込み対象です。先頭を主に読み取る動作と、更新時の書込み先は区別します。制御ファイルにREDOログのグループ番号や順番に切り替える仕組みはありません。",
      doc: "admin/managing-control-files.html"
    },
    {
      id: "case-temp-undo", domain: "UNDO管理",
      question: "通常の永続表を大量にUPDATEした後、同じトランザクションをROLLBACKする。対象行を元の値に戻すための情報を主にどこから得る？",
      answer: "UNDOセグメント", distractors: ["ソート用の一時セグメント", "アラート・ログ", "サーバー・パラメータ・ファイル"],
      explanation: "永続表への変更を取り消すための情報はUNDOに記録されます。一時セグメントはソートなどの作業用です。アラート・ログは診断用、サーバー・パラメータ・ファイルはインスタンス設定用です。",
      doc: "admin/managing-undo.html"
    },
    {
      id: "case-external-path", domain: "データ移動",
      question: "ORACLE_LOADER外部表の定義とデータベース上の権限は正しい。CSVが担当者のノートPCにしかない状態でサーバーから読めない。必要な対応は？",
      answer: "CSVを、指定したディレクトリ・オブジェクトに対応し、DBサーバーのプロセスが読める場所に置く",
      distractors: ["SQLクライアントのカレント・ディレクトリをCSVのフォルダーにする", "外部表を通常の表と同じ表領域に移動する", "CSVの拡張子を.dmpに変更する"],
      explanation: "この外部表のデータファイルはサーバー側からアクセスします。クライアントの作業場所を変えてもパスは解決されません。表領域の変更や拡張子の変更でも、ファイル自体にはアクセスできません。",
      doc: "sutil/oracle-external-tables-concepts.html"
    },
    {
      id: "case-remap", domain: "データ移動",
      question: "Data Pumpで元スキーマ OLD_APP の表を、既にある別スキーマ NEW_APP の所有物として取り込みたい。必要な権限があるとき、impdpのパラメータは？",
      answer: "REMAP_SCHEMA=OLD_APP:NEW_APP", distractors: ["REMAP_SCHEMA=NEW_APP:OLD_APP", "SCHEMAS=NEW_APP", "REMAP_TABLESPACE=OLD_APP:NEW_APP"],
      explanation: "REMAP_SCHEMAは元の所有者、取り込み先の所有者の順です。逆順は逆方向の指定です。SCHEMASは取り込む元スキーマの選択、REMAP_TABLESPACEは格納先表領域の置換です。",
      doc: "sutil/datapump-import-utility.html"
    },
    {
      id: "case-loader-path", domain: "データ移動",
      question: "SQL*Loaderの従来型パスとダイレクト・パスの違いを説明しているものは？",
      answer: "従来型パスはSQL INSERTを使い、ダイレクト・パスはデータブロックを組み立ててロードする",
      distractors: ["両方とも必ず行ごとに独立してCOMMITする", "ダイレクト・パスはData Pumpのダンプだけを入力に取る", "従来型パスでロードすると表は自動的に読取り専用になる"],
      explanation: "従来型パスはSQLの挿入処理を利用し、ダイレクト・パスは通常のSQL挿入処理の一部を省きます。両方式に1行ごとのCOMMIT義務はありません。Data Pump専用の入力形式や表の読取り専用化も方式の違いではありません。",
      doc: "sutil/oracle-sql-loader-conventional-and-direct-loads.html"
    },
    {
      id: "case-readonly", domain: "表領域とデータファイル",
      question: "履歴表のある通常の永続表領域がREAD ONLYになった。履歴表に対するSELECTとUPDATEの権限がある利用者は、既存行に何ができる？",
      answer: "SELECTで参照できるが、既存行のUPDATEはできない", distractors: ["SELECTもUPDATEもできる", "SELECTもUPDATEもできない", "索引を使ったUPDATEだけできる"],
      explanation: "オンラインの読取り専用表領域は問合せに使えます。オブジェクト権限があっても格納データの書換えはできず、索引経由でも同じです。OFFLINE状態とは異なります。",
      doc: "admin/managing-tablespaces.html"
    },
    {
      id: "case-segment-files", domain: "記憶域管理",
      question: "通常の非パーティション表のデータセグメントに複数のエクステントがある。1つのセグメントのエクステントはどの範囲に配置できる？",
      answer: "同じ表領域に属する複数のデータファイルに分散できる",
      distractors: ["必ず1つのデータファイルの連続領域にまとめる", "同じデータベースなら複数の表領域にまたがれる", "各エクステントが2つ以上のファイルにまたがる必要がある"],
      explanation: "1つのセグメントは1つの表領域に属し、エクステント同士は連続している必要がありません。同じ表領域内なら別のファイルに追加できます。個々のエクステントは1つのファイル内で完結します。",
      doc: "cncpt/logical-storage-structures.html"
    },
    {
      id: "case-session", domain: "インスタンス管理",
      question: "単一インスタンスで、現在接続中のユーザーセッションのSIDと状態を調べたい。参照権限があるとき、目的に合うビューは？",
      answer: "V$SESSION", distractors: ["DBA_USERS", "DBA_TABLES", "V$DATAFILE"],
      explanation: "V$SESSIONはセッションごとのSIDやSTATUSを示します。DBA_USERSは登録ユーザー、DBA_TABLESは表、V$DATAFILEはデータファイルの情報で、どれも現在の接続一覧ではありません。",
      doc: "refrn/V-SESSION.html"
    },
    {
      id: "case-left-count", domain: "SQL結合",
      question: "部署20に社員はいない。部署Dを左側として社員EにLEFT JOINし、部署ごとに集計した。社員IDは主キー。部署20の COUNT(*) と COUNT(e.id) は？",
      answer: "1 と 0", distractors: ["0 と 0", "1 と 1", "部署20の結果行はない"],
      explanation: "LEFT JOINは一致する社員がいない部署にも社員列がNULLの行を1行返します。COUNT(*)はその行を数えます。COUNT(e.id)はNULLを除くので0です。内部結合と異なり部署20のグループも残ります。",
      doc: "sqlrf/Joins.html"
    },
    {
      id: "case-union-all", domain: "SQL集合演算",
      question: "表AのNは 4、4、8、表BのNは 4、9。SELECT n FROM a UNION ALL SELECT n FROM b の結果全体に、値4は何行含まれる？",
      answer: "3行", distractors: ["1行", "2行", "5行"],
      explanation: "UNION ALLは重複を残すためAの2行とBの1行で3行です。UNIONなら値4は1行です。2行はAだけの件数、5行は4以外も含む結果全体の件数です。",
      doc: "sqlrf/The-UNION-ALL-INTERSECT-MINUS-Operators.html"
    },
    {
      id: "case-date-range", domain: "行の制限とソート",
      question: "注文日時Dは時刻も含むDATE型。2026年4月の全注文だけを取り出す条件はどれ？",
      answer: "d >= DATE '2026-04-01' AND d < DATE '2026-05-01'",
      distractors: ["d BETWEEN DATE '2026-04-01' AND DATE '2026-04-30'", "d > DATE '2026-04-01' AND d < DATE '2026-05-01'", "d >= DATE '2026-04-01' AND d <= DATE '2026-05-01'"],
      explanation: "日付リテラルの時刻は午前0時です。翌月初日の直前まで含めるには「以上、翌月未満」にします。BETWEENの指定では4月30日の日中を落とし、開始を > にすると4月1日午前0時を落とし、終了を <= にすると5月1日午前0時が混ざります。",
      doc: "sqlrf/Literals.html"
    },
    {
      id: "case-count-case", domain: "SQL集計",
      question: "売上表の3行は、商品Aが「返品」、商品Aが「販売」、商品Bが「返品」。COUNT(DISTINCT CASE WHEN 種別='販売' THEN 商品 END) の値は？",
      answer: "1", distractors: ["0", "2", "3"],
      explanation: "販売行で式が返すのはAです。返品行ではELSEを省いたCASEがNULLを返し、COUNTでは数えません。販売が1行あるので0にはならず、全商品の種類数2や表全体の行数3にもなりません。",
      doc: "sqlrf/COUNT.html"
    },
    {
      id: "case-exists", domain: "副問合せ",
      question: "部署は10と20が各1行。社員は2人とも部署10。SELECT d.id FROM dept d WHERE EXISTS (SELECT NULL FROM emp e WHERE e.dept_id=d.id) の結果は？",
      answer: "10 が1行", distractors: ["10 が2行", "10 と 20 が各1行", "0行"],
      explanation: "EXISTSは相関条件を満たす行があるかだけを調べます。部署10は社員が2人いても外側の1行を返し、部署20は返しません。内側のSELECTがNULLを返すことと、行が存在しないことは別です。",
      doc: "sqlrf/EXISTS-Condition.html"
    },
    {
      id: "case-savepoint", domain: "トランザクション",
      question: "同じトランザクションでAをINSERT → SAVEPOINT s → BをINSERT → ROLLBACK TO s。自動コミットは無効。この直後の状態は？",
      answer: "Aは未コミットで残り、Bは取り消される", distractors: ["AとBの両方が取り消される", "Aはコミットされ、Bだけが取り消される", "AとBの両方がコミットされる"],
      explanation: "ROLLBACK TOはセーブポイントより後の変更だけを取り消します。トランザクションは続き、Aはまだ確定していません。全体の取消しはセーブポイントを指定しないROLLBACK、確定にはCOMMITが必要です。",
      doc: "sqlrf/ROLLBACK.html"
    },
    {
      id: "case-union-sort", domain: "SQL集合演算",
      question: "SELECT code, price FROM a UNION ALL SELECT code, price FROM b ORDER BY 2 DESC の最後の句は、何を並べ替える？",
      answer: "結合した結果全体をpriceの降順に並べる", distractors: ["Bから返る行だけをpriceの降順に並べる", "結合した結果全体をcodeの降順に並べる", "結合した結果の先頭2行だけを並べる"],
      explanation: "末尾のORDER BYは複合問合せ全体に作用し、2は選択リストの第2列priceを示します。第1列codeの指定でも、行数の制限でもありません。",
      doc: "sqlrf/The-UNION-ALL-INTERSECT-MINUS-Operators.html"
    },
    {
      id: "case-sequence-gap", domain: "シーケンス・シノニム・索引",
      question: "新しい昇順シーケンスSはSTART WITH 1、INCREMENT BY 1、NOCACHE。単一セッションだけがS.NEXTVALで1を取得して行を挿入し、ROLLBACKした。再起動も設定変更もなく次にS.NEXTVALを取ると？",
      answer: "2", distractors: ["1", "NULL", "COMMITまで取得できずエラー"],
      explanation: "シーケンスの採番は行のトランザクションから独立しています。挿入を取り消しても1は消費済みなので次は2です。NOCACHEでも番号を再利用せず、次の採番にCOMMITは必要ありません。",
      doc: "sqlrf/CREATE-SEQUENCE.html"
    },
    {
      id: "case-unique-null", domain: "制約と一時表",
      question: "ある表の列EMAILには単一列のUNIQUE制約があり、NULLを許可している。別々の行にEMAILをNULLで2回挿入する。他の制約やトリガーに抵触しない場合の結果は？",
      answer: "2行とも挿入できる", distractors: ["1行目だけ挿入でき、2行目は一意制約違反", "1行目からNOT NULL違反", "2行目が1行目を自動的に上書きする"],
      explanation: "単一列のUNIQUE制約は複数行のNULLを許します。主キーのようなNOT NULLの要件はありません。通常のINSERTが、既存行を自動更新することもありません。",
      doc: "sqlrf/constraint.html"
    }
  ];
  if (typeof module === "object" && module.exports) module.exports = cards;
  root.OracleSilverCases = cards;
})(globalThis);
