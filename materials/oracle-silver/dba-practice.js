(function exposeOracleSilverDbaPractice(root) {
  "use strict";

  const cards = [
    {
      id: "pdba-write-ahead", domain: "アーキテクチャ",
      question: "DBWnが変更済みブロックをデータファイルに書こうとしたが、その変更に対応するREDOがまだREDOログ・バッファにしかない。Oracleは書込み順序をどう制御する？",
      answer: "LGWRが必要なREDOをオンラインREDOログに書き出してから、DBWnがブロックを書き込む",
      distractors: ["DBWnがブロックを書き込んでから、LGWRが対応するREDOを出す", "DBWnがブロックと対応するREDOの両方をデータファイルに書く", "対応するREDOがアーカイブされるまでDBWnはブロックを書けない"],
      explanation: "先行書込みの規則により、対応するREDOは関連するデータブロックより先に永続化されます。DBWnとLGWRの書込み先は異なり、オンラインREDOログへの書込みで条件を満たすため、アーカイブ完了は不要です。",
      doc: "cncpt/process-architecture.html"
    },
    {
      id: "pdba-smon-recovery", domain: "アーキテクチャ",
      question: "単一インスタンスが異常終了した。データファイルにはメディア障害がなく、再起動時にインスタンス・リカバリが必要である。担当するバックグラウンド・プロセスは？",
      answer: "SMON",
      distractors: ["LREG", "ARCn", "MMON"],
      explanation: "SMONは必要に応じて起動時にインスタンス・リカバリを行います。LREGはリスナーにサービス情報を登録し、ARCnはオンラインREDOログのアーカイブを担当します。MMONは自動ワークロード・リポジトリなどの管理処理を担当します。",
      doc: "cncpt/process-architecture.html"
    },
    {
      id: "pdba-library-cache", domain: "アーキテクチャ",
      question: "SQLがもう一度発行され、共有可能な解析済みカーソルを再利用できた。再利用に直接関係するメモリー領域は？",
      answer: "共有プールのライブラリ・キャッシュ",
      distractors: ["データベース・バッファ・キャッシュ", "REDOログ・バッファ", "PGAのソート領域"],
      explanation: "ライブラリ・キャッシュにある共有可能な解析済み表現を再利用する処理はソフト解析です。バッファ・キャッシュはデータ・ブロックを保持し、REDOログ・バッファは変更のREDOを保持します。PGAのソート領域は演算用の作業領域です。",
      doc: "cncpt/memory-architecture.html"
    },
    {
      id: "pdba-pga-hash", domain: "アーキテクチャ",
      question: "専用サーバー接続でハッシュ結合を行う。メモリー内にハッシュ表を組み立てる作業領域はどこにある？",
      answer: "サーバー・プロセスのPGA",
      distractors: ["共有プールのディクショナリ・キャッシュ", "SGAのREDOログ・バッファ", "制御ファイル"],
      explanation: "ハッシュ結合にはPGAのSQL作業領域が使われます。ディクショナリ・キャッシュはデータ・ディクショナリ情報を保持します。REDOログ・バッファはREDOを保持し、制御ファイルはデータベースの物理構成などを記録します。",
      doc: "cncpt/memory-architecture.html"
    },
    {
      id: "pdba-open-read-only", domain: "インスタンス管理",
      question: "リカバリが不要な通常のデータベースを既にMOUNTしている。一般ユーザーに参照を許しつつ、通常の表の更新を許さないモードで開く文は？",
      answer: "ALTER DATABASE OPEN READ ONLY",
      distractors: ["ALTER DATABASE OPEN READ WRITE", "ALTER SYSTEM ENABLE RESTRICTED SESSION", "STARTUP NOMOUNT"],
      explanation: "マウント状態からREAD ONLYで開くと表を参照でき、データの変更は制限されます。READ WRITEは変更を許すモードです。RESTRICTED SESSIONは新規接続に権限を要求し、更新を禁止する指定ではありません。NOMOUNTではインスタンスだけを開始し、表にアクセスできません。",
      doc: "admin/starting-up-and-shutting-down.html"
    },
    {
      id: "pdba-transactional-stop", domain: "インスタンス管理",
      question: "計画停止で新規トランザクションを受け付けず、進行中の取引は完了を待ちたい。既存クライアントの自発的な切断までは待たずに済む停止モードは？",
      answer: "SHUTDOWN TRANSACTIONAL",
      distractors: ["SHUTDOWN NORMAL", "SHUTDOWN IMMEDIATE", "SHUTDOWN ABORT"],
      explanation: "TRANSACTIONALは新規トランザクションを禁止し、進行中のトランザクションが完了してから残っているクライアントを切断します。NORMALはユーザーによる切断を待ちます。IMMEDIATEは未コミットの処理をロールバックします。ABORTは正常にクローズせずに停止し、次回起動時にインスタンス・リカバリが必要になります。",
      doc: "admin/starting-up-and-shutting-down.html"
    },
    {
      id: "pdba-trace-location", domain: "インスタンス管理",
      question: "専用サーバー接続で、自分のセッションを処理する現在のサーバー・プロセスの既定トレース・ファイル名をSQLで調べたい。参照先は？",
      answer: "V$DIAG_INFOのNAMEが'Default Trace File'の行",
      distractors: ["V$DIAG_INFOのNAMEが'ADR Base'の行", "V$CONTROLFILEのNAME列", "V$DATABASEのNAME列"],
      explanation: "V$DIAG_INFOのDefault Trace Fileは現在のプロセスの既定トレース・ファイルを示します。ADR BaseはADRの基点ディレクトリです。V$CONTROLFILEは制御ファイルを示し、V$DATABASEのNAMEはデータベース名です。",
      doc: "refrn/V-DIAG_INFO.html"
    },
    {
      id: "pdba-log-switch", domain: "インスタンス管理",
      question: "単一インスタンスで、現在のオンラインREDOログ・グループが一杯になる前に次のグループへ切り替えるSQL文は？",
      answer: "ALTER SYSTEM SWITCH LOGFILE",
      distractors: ["ALTER SYSTEM CHECKPOINT", "ALTER SYSTEM FLUSH SHARED_POOL", "ALTER SYSTEM REGISTER"],
      explanation: "SWITCH LOGFILEはログ・スイッチを強制します。CHECKPOINTはチェックポイントを実行し、FLUSH SHARED_POOLは共有プールをフラッシュします。REGISTERはリスナーへのサービス登録を促します。",
      doc: "sqlrf/ALTER-SYSTEM.html"
    },
    {
      id: "pdba-offline-normal", domain: "表領域とデータファイル",
      question: "全データファイルが正常な恒久表領域を一時的にアクセス不可にし、再オンライン化にメディア・リカバリを要求しないようにする。推奨される指定は？",
      answer: "ALTER TABLESPACE app_data OFFLINE NORMAL",
      distractors: ["ALTER TABLESPACE app_data OFFLINE IMMEDIATE", "ALTER TABLESPACE app_data READ ONLY", "ALTER TABLESPACE app_data ONLINE"],
      explanation: "OFFLINE NORMALではデータファイルのチェックポイントをとってからオフラインにするため、再オンライン化前のメディア・リカバリは不要です。IMMEDIATEではチェックポイントを待たず、再オンライン化前にリカバリが必要です。READ ONLYでは読取りが可能なままで、ONLINEは表領域を利用可能にします。",
      doc: "admin/managing-tablespaces.html"
    },
    {
      id: "pdba-drop-datafiles", domain: "表領域とデータファイル",
      question: "ユーザー作成の恒久表領域ARCHIVE_DATAを廃止する。削除を妨げる制約はない。通常のOSファイルとして管理されているデータファイルと、表領域内のオブジェクトも同時に削除するSQL文は？",
      answer: "DROP TABLESPACE archive_data INCLUDING CONTENTS AND DATAFILES",
      distractors: ["DROP TABLESPACE archive_data INCLUDING CONTENTS KEEP DATAFILES", "ALTER TABLESPACE archive_data OFFLINE NORMAL", "ALTER TABLESPACE archive_data READ ONLY"],
      explanation: "INCLUDING CONTENTS AND DATAFILESは、表領域とその内容に加えてデータファイルを削除します。KEEP DATAFILESはファイルを保持します。OFFLINE NORMALは一時的にアクセスを止め、READ ONLYは書込みを止めますが、どちらも削除は行いません。",
      doc: "sqlrf/DROP-TABLESPACE.html"
    },
    {
      id: "pdba-temp-group", domain: "表領域とデータファイル",
      question: "既存の一時表領域TEMP_Aを、まだ存在しない一時表領域グループBATCH_TMPの最初のメンバーにする文は？",
      answer: "ALTER TABLESPACE temp_a TABLESPACE GROUP batch_tmp",
      distractors: ["CREATE TABLESPACE GROUP batch_tmp", "ALTER USER batch_user TEMPORARY TABLESPACE batch_tmp", "ALTER DATABASE DEFAULT TEMPORARY TABLESPACE batch_tmp"],
      explanation: "TABLESPACE GROUP句で最初の一時表領域を割り当てると、グループが暗黙に作成されます。CREATE TABLESPACE GROUPという独立した作成文はありません。ALTER USERとALTER DATABASEの選択肢は、既に存在する一時表領域またはグループの割当てに使います。",
      doc: "admin/managing-tablespaces.html"
    },
    {
      id: "pdba-migration", domain: "記憶域管理",
      question: "ヒープ表の行がUPDATEで長くなり、元のブロックには収まらないが、別の空いたブロックには行全体が収まる。元の位置にポインタを残し、行全体を移す現象は？",
      answer: "行移行（row migration）",
      distractors: ["行連鎖（row chaining）", "エクステントの割当て", "チェックポイント"],
      explanation: "行移行では更新で大きくなった行を別ブロックへ移動し、元の位置に参照先を残します。行連鎖では行が複数の行ピースに分かれます。エクステントの割当てはセグメントへブロック群を追加する処理で、チェックポイントはリカバリに関わる処理です。",
      doc: "cncpt/logical-storage-structures.html"
    },
    {
      id: "pdba-undo-stats", domain: "UNDO管理",
      question: "自動UNDO管理の環境で、10分ごとのUNDO使用量や最長問合せの実行時間を確認する。どのビューを参照する？",
      answer: "V$UNDOSTAT",
      distractors: ["DBA_UNDO_EXTENTS", "V$LOG", "V$DATAFILE"],
      explanation: "V$UNDOSTATはUNDO消費量や最長問合せ時間を10分間隔で集計します。DBA_UNDO_EXTENTSはUNDOエクステント単位の情報を示します。V$LOGはオンラインREDOログ・グループ、V$DATAFILEはデータファイルの情報を示します。",
      doc: "refrn/V-UNDOSTAT.html"
    },
    {
      id: "pdba-undo-tuned", domain: "UNDO管理",
      question: "書込みが多い時間帯で、Oracleが自動調整したUNDO保持時間の推移を秒単位で確認する。V$UNDOSTATのどの列を確認する？",
      answer: "TUNED_UNDORETENTION",
      distractors: ["MAXQUERYLEN", "UNDOBLKS", "SSOLDERRCNT"],
      explanation: "TUNED_UNDORETENTIONは自動調整された保持時間を秒単位で示します。MAXQUERYLENは最長の問合せ実行時間、UNDOBLKSは消費したUNDOブロック数、SSOLDERRCNTはスナップショットが古すぎるエラーの発生数を示します。",
      doc: "refrn/V-UNDOSTAT.html"
    },
    {
      id: "pdba-pump-truncate", domain: "データ移動",
      question: "参照制約による妨げのない既存表へimpdpで取り込む。表の定義と権限は維持し、現在の行を全て取り除いてからダンプ内の行をロードする指定は？",
      answer: "TABLE_EXISTS_ACTION=TRUNCATE",
      distractors: ["TABLE_EXISTS_ACTION=APPEND", "TABLE_EXISTS_ACTION=REPLACE", "TABLE_EXISTS_ACTION=SKIP"],
      explanation: "TRUNCATEは既存表の行を取り除いてからロードし、既存の表定義を維持します。APPENDは既存行を残して追加します。REPLACEは表をドロップして再作成し、SKIPは既存表をそのままにして次のオブジェクトへ進みます。",
      doc: "sutil/datapump-import-utility.html"
    },
    {
      id: "pdba-pump-flashback-scn", domain: "データ移動",
      question: "業務更新が続く中で、既知のSCNを基準に複数の通常の表を一貫した時点でexpdpしたい。必要なUNDOは保持されている。どのパラメータを指定する？",
      answer: "FLASHBACK_SCN",
      distractors: ["FLASHBACK_TIME", "QUERY", "VERSION"],
      explanation: "FLASHBACK_SCNは指定したSCNに整合するデータをエクスポートします。FLASHBACK_TIMEは時刻を入力して対応するSCNを決定します。QUERYは抽出行の絞込みに使い、VERSIONはエクスポートするオブジェクトの互換性を指定します。",
      doc: "sutil/oracle-data-pump-export-utility.html"
    },
    {
      id: "pdba-loader-ctl", domain: "データ移動",
      question: "SQL*Loaderで固定長テキストをロードする。入力レコードのバイト位置とロード先の列の対応を定義するファイルは？",
      answer: "CONTROLパラメータで指定する制御ファイル",
      distractors: ["DATAパラメータで指定する入力データ・ファイル", "BADパラメータで指定するファイル", "LOGパラメータで指定するファイル"],
      explanation: "SQL*Loaderの制御ファイルにはロード先やフィールド位置などの解析規則を定義します。DATAで指定するファイルは入力レコードそのものです。BADのファイルには拒否レコードが、LOGのファイルには実行状況や結果が出力されます。",
      doc: "sutil/oracle-sql-loader-concepts.html"
    },
    {
      id: "pdba-listener-handlers", domain: "Oracle Net",
      question: "カスタム名LIST_APPのリスナーについて、登録済みの各インスタンスに対応するサービス・ハンドラの詳細を確認するコマンドは？",
      answer: "LSNRCTL SERVICES LIST_APP",
      distractors: ["TNSPING LIST_APP", "LSNRCTL RELOAD LIST_APP", "LSNRCTL VERSION LIST_APP"],
      explanation: "SERVICESは登録されたサービス、インスタンス、ハンドラの詳細を表示します。TNSPINGは接続識別子を使った到達性の確認用です。RELOADは構成を再読込みし、VERSIONはリスナーのバージョンを表示します。",
      doc: "netag/configuring-and-administering-oracle-net-listener.html"
    },
    {
      id: "pdba-local-register", domain: "Oracle Net",
      question: "単一インスタンス構成で、同じサーバーのTCPポート1526にあるリスナーへLREGによる動的登録を行いたい。接続先アドレスを指定する初期化パラメータは？",
      answer: "LOCAL_LISTENER",
      distractors: ["REMOTE_LISTENER", "DB_DOMAIN", "DB_UNIQUE_NAME"],
      explanation: "LOCAL_LISTENERにローカル・リスナーのアドレスまたは解決可能な別名を指定できます。REMOTE_LISTENERはリモート・リスナーの登録先を指定します。DB_DOMAINはデータベースのドメイン、DB_UNIQUE_NAMEはデータベース固有名を指定します。",
      doc: "netag/configuring-and-administering-oracle-net-listener.html"
    },
    {
      id: "pdba-naming-order", domain: "Oracle Net",
      question: "クライアントで、名前解決時にローカル・ネーミングを先に、Easy Connectを次に試すように設定したい。設定する項目は？",
      answer: "sqlnet.oraのNAMES.DIRECTORY_PATH",
      distractors: ["listener.oraのSID_LIST_LISTENER", "tnsnames.oraのSERVICE_NAME", "sqlnet.oraのSQLNET.AUTHENTICATION_SERVICES"],
      explanation: "NAMES.DIRECTORY_PATHにtnsnames、ezconnectの順で指定すると、その順で名前解決を試みます。SID_LIST_LISTENERはリスナーの静的登録情報、SERVICE_NAMEは接続先サービス名、SQLNET.AUTHENTICATION_SERVICESは利用する認証サービスの設定です。",
      doc: "netag/configuring-naming-methods.html"
    },
    {
      id: "pdba-delegate-object", domain: "権限管理",
      question: "表所有者SALESが、ユーザーLEADにSALES.ORDERSへのSELECTを付与し、そのユーザー自身も同じオブジェクト権限を別ユーザーに付与できるようにしたい。使う句は？",
      answer: "WITH GRANT OPTION",
      distractors: ["WITH ADMIN OPTION", "WITH HIERARCHY OPTION", "CASCADE CONSTRAINTS"],
      explanation: "WITH GRANT OPTIONはユーザーが受け取ったオブジェクト権限の再付与を認めます。WITH ADMIN OPTIONはシステム権限やロールの管理に使います。WITH HIERARCHY OPTIONは対象の下位オブジェクトに権限を広げる句です。CASCADE CONSTRAINTSは参照権限の取消しで依存する参照制約を削除する場合に使います。",
      doc: "sqlrf/GRANT.html"
    },
    {
      id: "pdba-references-revoke", domain: "権限管理",
      question: "別スキーマの表を参照する外部キーをREPORT_APPが作成している。付与済みのREFERENCES権限を取り消し、その権限に依存する外部キーも削除する句は？",
      answer: "REVOKE文のCASCADE CONSTRAINTS",
      distractors: ["REVOKE文のWITH ADMIN OPTION", "REVOKE文のWITH GRANT OPTION", "REVOKE文のINCLUDING CONTENTS"],
      explanation: "REFERENCES権限に依存する外部キーを削除するには、REVOKE文にCASCADE CONSTRAINTSを指定します。WITH ADMIN OPTIONとWITH GRANT OPTIONは付与時の句で、INCLUDING CONTENTSは表領域の削除などで使う句です。",
      doc: "sqlrf/REVOKE.html"
    },
    {
      id: "pdba-nested-scripts", domain: "管理ツール",
      question: "SQL*Plusを別のディレクトリから起動した。実行中のparent.sqlから、parent.sqlと同じディレクトリのchild.sqlを相対指定で呼び出したい。どのコマンドを使う？",
      answer: "@@child.sql",
      distractors: ["@child.sql", "START child.sql", "RUN child.sql"],
      explanation: "スクリプト内の@@は呼出し元スクリプトのディレクトリを基準にします。@とSTARTはカレント・ディレクトリなどから探し、呼出し元の場所を基準にはしません。RUNはSQLバッファにあるSQL文またはPL/SQLブロックを実行するコマンドです。",
      doc: "sqpug/double-at-sign.html"
    },
    {
      id: "pdba-describe-table", domain: "管理ツール",
      question: "SQL*Plusで、表SALES.ORDERSに対して列名、データ型、NULL可否を短いコマンドで表示したい。どれを実行する？",
      answer: "DESCRIBE sales.orders",
      distractors: ["LIST sales.orders", "SHOW PARAMETER sales.orders", "PRINT sales.orders"],
      explanation: "DESCRIBEは表の列定義を表示します。LISTはSQLバッファの内容を表示するコマンドです。SHOW PARAMETERは初期化パラメータを表示し、PRINTはバインド変数の値を表示します。",
      doc: "sqpug/SQL-Plus-basics.html"
    }
  ];

  if (typeof module === "object" && module.exports) module.exports = cards;
  if (root) root.OracleSilverDbaPractice = cards;
})(typeof globalThis === "object" ? globalThis : this);
