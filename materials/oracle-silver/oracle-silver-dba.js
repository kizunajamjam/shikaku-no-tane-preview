(function exposeOracleSilverDba(root) {
  "use strict";

  const cards = [
    {
      id: "dba-pump-directory", domain: "データ移動",
      question: "PCからリモートのOracle Databaseにexpdpで接続した。DIRECTORY=STAGEを指定すると、ダンプファイルの出力先はどこで決まる？",
      answer: "接続先データベースのディレクトリ・オブジェクトSTAGE",
      distractors: ["PCでexpdpを実行した作業ディレクトリ", "PCのtnsnames.oraを格納したディレクトリ", "エクスポート対象表の表領域に属するデータファイル"],
      explanation: "Data Pumpのファイル入出力は接続先サーバーで行われ、STAGEがサーバー上の場所を指します。PCの作業ディレクトリや接続設定の保存先はダンプの場所を決めません。表領域のデータファイルは表の格納先であり、ダンプの出力先とは別です。",
      doc: "sutil/oracle-data-pump-overview.html"
    },
    {
      id: "dba-pump-preview", domain: "データ移動",
      question: "既存のダンプをimpdpで取り込む前に、実行予定のDDLをファイルでレビューしたい。対象オブジェクトを実際に作成しない方法は？",
      answer: "SQLFILEを指定する",
      distractors: ["CONTENT=METADATA_ONLYを指定する", "LOGFILEを指定して通常のインポートを行う", "TABLE_EXISTS_ACTION=SKIPを指定する"],
      explanation: "SQLFILEは実行予定のDDLをファイルに出力し、そのDDLを実行しません。METADATA_ONLYはメタデータを実際に取り込みます。LOGFILEは処理ログの出力先を指定します。SKIPは既存表がある場合の扱いを決める指定です。",
      doc: "sutil/datapump-import-utility.html"
    },
    {
      id: "dba-loader-rejects", domain: "データ移動",
      question: "SQL*Loaderで、選択条件を満たした1件が値の書式エラーで拒否され、別の1件はどのロード先のWHEN条件も満たさなかった。BADファイルとDISCARDファイルを使うとき、2件は順にどこへ出力される？",
      answer: "BADファイル、DISCARDファイル",
      distractors: ["DISCARDファイル、BADファイル", "どちらもBADファイル", "どちらもDISCARDファイル"],
      explanation: "書式エラーなどによる拒否はBADファイルに記録され、選択条件を満たさないレコードはDISCARDファイルに出力されます。逆に割り当てたり両方を同じファイルに分類したりすると、拒否と条件除外を取り違えます。",
      doc: "sutil/oracle-sql-loader-concepts.html"
    },
    {
      id: "dba-external-csv", domain: "データ移動",
      question: "サーバー上に毎日届くCSVを、内部表に取り込まず、既存表とSQLで結合して検査したい。どの構成が適切？",
      answer: "ORACLE_LOADERを使う外部表を定義し、SELECTで既存表と結合する",
      distractors: ["SQL*Loaderで既存の内部表にCSVをロードする", "impdpでCSVをダンプファイルとして指定する", "CREATE DIRECTORYだけを実行し、その名前を表としてSELECTする"],
      explanation: "ORACLE_LOADER外部表はサーバーのテキストファイルをSQLで参照できます。SQL*Loaderで内部表にロードすると要件に反します。impdpはData Pump形式のダンプを扱います。ディレクトリ・オブジェクトはパスを表すだけで、列やファイルの読取り規則は外部表の定義に必要です。",
      doc: "sutil/oracle-external-tables-concepts.html"
    },
    {
      id: "dba-dbca-template", domain: "管理ツール",
      question: "Oracle Databaseソフトウェアの導入は済んでいる。テンプレートを選び、画面の案内に従って新しいデータベースを作るツールは？",
      answer: "Database Configuration Assistant（DBCA）",
      distractors: ["Oracle Universal Installer（OUI）", "Oracle Net Configuration Assistant（NETCA）", "Automatic Diagnostic Repository Command Interpreter（ADRCI）"],
      explanation: "DBCAはテンプレートを使用したデータベース作成を支援します。OUIはOracleソフトウェアのインストーラで、NETCAはOracle Netの構成を支援します。ADRCIは診断情報を扱うコマンドライン・ツールです。",
      doc: "cncpt/concepts-for-database-administrators.html"
    },
    {
      id: "dba-adrci-alert", domain: "インスタンス管理",
      question: "データベースが起動途中に停止した。SQLでインスタンスに接続せず、ADRに残ったアラート・ログをコマンドラインで確認する方法は？",
      answer: "ADRCIで対象のADRホームを選び、SHOW ALERTを実行する",
      distractors: ["LSNRCTL STATUSを実行する", "SQL*PlusでSHOW PARAMETERを実行する", "DBCAで作成済みのテンプレートを開く"],
      explanation: "ADRCIはADRのアラート・ログを表示できます。LSNRCTL STATUSはリスナーの状態を表示します。SHOW PARAMETERは初期化パラメータを確認するSQL*Plusコマンドで、アラート・ログを読みません。DBCAのテンプレートには起動時の診断記録はありません。",
      doc: "sutil/oracle-adr-command-interpreter-adrci.html"
    },
    {
      id: "dba-dictionary-view", domain: "インスタンス管理",
      question: "表の定義を調べるため、接続中のユーザーが参照できる表を、他スキーマが所有する表も含めて一覧したい。参照先は？",
      answer: "ALL_TABLES",
      distractors: ["USER_TABLES", "DBA_TABLES", "V$DATAFILE"],
      explanation: "ALL_TABLESは現在のユーザーがアクセスできる表を対象とします。USER_TABLESは自分が所有する表に限られ、DBA_TABLESは個々のユーザーのアクセス可否で範囲を絞らずに全表を示します。V$DATAFILEはデータファイルの動的パフォーマンス・ビューです。",
      doc: "cncpt/data-dictionary-and-dynamic-performance-views.html"
    },
    {
      id: "dba-bigfile-grow", domain: "表領域とデータファイル",
      question: "BIGFILE表領域APP_DATAのデータファイルは80 GB。OSやファイルサイズの上限に余裕があるとき、今すぐ100 GBに増やす操作は？",
      answer: "ALTER TABLESPACE app_data RESIZE 100G",
      distractors: ["ALTER TABLESPACE app_data ADD DATAFILE '/data/app02.dbf' SIZE 20G", "ALTER TABLESPACE app_data AUTOEXTEND ON MAXSIZE 100G", "ALTER TABLESPACE app_data ADD TEMPFILE '/data/app02.tmp' SIZE 20G"],
      explanation: "BIGFILE表領域は単一ファイルで、ALTER TABLESPACEのRESIZEで現在のサイズを変更できます。ADD DATAFILEで2本目は追加できません。AUTOEXTENDのMAXSIZEは将来の自動拡張上限で、即時のサイズ指定ではありません。ADD TEMPFILEは一時表領域用です。",
      doc: "admin/managing-data-files-and-temp-files.html"
    },
    {
      id: "dba-online-datafile-move", domain: "表領域とデータファイル",
      question: "データベースを開いたまま、稼働中の恒久表領域のデータファイルを別のファイルシステムに移す。移動先に十分な空きがある場合、物理的な移動とデータベースでの参照先更新を行う文は？",
      answer: "ALTER DATABASE MOVE DATAFILE ... TO ...",
      distractors: ["ALTER DATABASE RENAME FILE ... TO ...", "ALTER TABLESPACE ... ADD DATAFILE ...", "ALTER TABLE ... MOVE TABLESPACE ..."],
      explanation: "MOVE DATAFILEはオンラインのデータファイルを指定先へ移し、参照先を更新します。RENAME FILEはデータベースが記録した名前の変更用で、OS上のファイルは移動しません。ADD DATAFILEは新規ファイルを追加し、ALTER TABLE MOVEは対象表のセグメントを移動します。",
      doc: "admin/managing-data-files-and-temp-files.html"
    },
    {
      id: "dba-temp-sort", domain: "表領域とデータファイル",
      question: "PGAに収まらないソートで、一時表領域TEMPの空き不足が発生した。TEMPはローカル管理のSMALLFILE一時表領域。TEMPの容量をファイル追加で増やす操作は？",
      answer: "ALTER TABLESPACE temp ADD TEMPFILE '/data/temp02.dbf' SIZE 4G",
      distractors: ["ALTER TABLESPACE temp ADD DATAFILE '/data/temp02.dbf' SIZE 4G", "恒久表領域USERSにDATAFILEを追加する", "UNDO表領域にDATAFILEを追加する"],
      explanation: "一時表領域へのファイル追加にはADD TEMPFILEを使います。ADD DATAFILEは恒久表領域などのデータファイルを追加する構文です。USERSやUNDOを拡張してもTEMPのソート作業領域は増えません。",
      doc: "admin/managing-tablespaces.html"
    },
    {
      id: "dba-assm-bitmap", domain: "ストレージ管理",
      question: "ローカル管理の恒久表領域にSEGMENT SPACE MANAGEMENT AUTOを指定した。セグメント内で挿入先に適した空きのあるブロックを探すため、Oracleは何を使う？",
      answer: "ブロックの空き領域の状態を管理するビットマップ",
      distractors: ["手動セグメント領域管理のフリーリスト", "エクステントの割当てを管理する表領域のビットマップだけ", "チェックポイントで更新する制御ファイル内の記録"],
      explanation: "自動セグメント領域管理（ASSM）はセグメント内のブロックの空き状態をビットマップで管理します。フリーリストは手動方式で使います。表領域のエクステント割当て用ビットマップは管理単位が異なり、制御ファイルのチェックポイント情報も挿入先の選定には使いません。",
      doc: "cncpt/logical-storage-structures.html"
    },
    {
      id: "dba-pctfree-growth", domain: "ストレージ管理",
      question: "ヒープ表では、短い行をINSERTした後にUPDATEで長くなることが多い。新規行を詰め込みすぎないよう、ブロックに既存行の更新用の余裕を多めに取る設定は？",
      answer: "PCTFREEを高くする",
      distractors: ["PCTFREEを低くする", "AUTOEXTENDのNEXTを大きくする", "表領域のUNIFORMエクステントのサイズを大きくする"],
      explanation: "PCTFREEを高くすると、INSERTで埋めるのを早く止め、既存行の拡大用にブロック内の空きを多く残します。低くすると逆の効果になります。NEXTはファイルの拡張増分、UNIFORMのサイズはエクステントの割当て単位です。",
      doc: "cncpt/logical-storage-structures.html"
    },
    {
      id: "dba-shutdown-immediate", domain: "インスタンス管理",
      question: "保守停止の際、接続中の利用者が自発的に終了するのを待たず、未コミットの処理を取り消して正常にデータベースを閉じたい。どの停止モードを選ぶ？",
      answer: "SHUTDOWN IMMEDIATE",
      distractors: ["SHUTDOWN NORMAL", "SHUTDOWN TRANSACTIONAL", "SHUTDOWN ABORT"],
      explanation: "IMMEDIATEは未コミットのトランザクションをロールバックし、利用者を切断して正常に停止します。NORMALは利用者が切断するまで待ち、TRANSACTIONALは実行中のトランザクションの終了を待ちます。ABORTはロールバックを待たずに停止し、次回起動時にインスタンス・リカバリが必要になります。",
      doc: "admin/starting-up-and-shutting-down.html"
    },
    {
      id: "dba-sqlplus-nolog", domain: "管理ツール",
      question: "保守作業で、まずOracleのコマンドライン・クライアントをデータベース未接続で起動し、そのプロンプトからCONNECTを入力したい。どのコマンドで起動する？",
      answer: "sqlplus /nolog",
      distractors: ["sqlplus /", "lsnrctl", "adrci"],
      explanation: "sqlplus /nologは未接続のSQL*Plusセッションを開始し、後からCONNECTで接続できます。sqlplus /は外部認証による接続を試みます。lsnrctlはリスナーの制御、adrciは診断データの操作に使います。",
      doc: "admin/getting-started-with-database-administration.html"
    },
    {
      id: "dba-arc-process", domain: "アーキテクチャ",
      question: "ARCHIVELOGモードでアーカイブ先の空き不足が起きた。ログスイッチ後に、切替済みオンラインREDOログをアーカイブ先へコピーする担当は？",
      answer: "ARCn",
      distractors: ["LGWR", "DBWn", "CKPT"],
      explanation: "ARCnはログスイッチ後にオンラインREDOログをアーカイブします。LGWRはREDOログ・バッファから現在のオンラインREDOログへ書き込み、DBWnは変更済みデータブロックを書き出します。CKPTはチェックポイント情報を制御ファイルやデータファイルのヘッダーに記録します。",
      doc: "cncpt/process-architecture.html"
    },
    {
      id: "dba-undo-guarantee", domain: "UNDO管理",
      question: "RETENTION GUARANTEEを有効にしたUNDO表領域が満杯になった。拡張や期限切れ領域の再利用もできず、新しいDMLがさらにUNDOを必要とするとき、何が起こり得る？",
      answer: "期限内のUNDOは保持され、新しいDMLが空き不足で失敗する",
      distractors: ["新しいDMLを通すため、期限内のUNDOが上書きされる", "UNDOは自動で一時表領域に書かれる", "UNDOを確保するため、Oracleが他のセッションを自動でCOMMITする"],
      explanation: "RETENTION GUARANTEEは期限内のUNDOの上書きを防ぎ、空きがなければDMLが失敗する場合があります。期限内のUNDOの上書きは保持保証が無効な場合に起こり得ます。一時表領域への退避や他セッションの自動コミットで領域を確保する仕組みではありません。",
      doc: "admin/managing-undo.html"
    },
    {
      id: "dba-net-service-error", domain: "Oracle Net",
      question: "新しい接続記述子で接続するとORA-12514になった。接続先ホストのリスナーは応答している。このエラーから最初に確認すべきことは？",
      answer: "要求したSERVICE_NAMEが接続先リスナーの認識しているサービスに含まれるか",
      distractors: ["接続ユーザーのパスワードが期限切れか", "クライアント側で接続識別子を解決できるか", "ユーザーのデフォルト表領域に割当て制限があるか"],
      explanation: "ORA-12514は接続要求がリスナーに届いたものの、リスナーが要求先サービスを認識していないことを示します。パスワードと表領域の割当て制限は別段階の問題です。接続識別子を解決できない場合にはORA-12154が該当します。",
      doc: "netag/troubleshooting-oracle-net-services.html"
    },
    {
      id: "dba-grant-role-admin", domain: "権限管理",
      question: "DBAが担当者に業務ロールSALES_READを直接付与する。その担当者が同じロールを別のユーザーに付与でき、他のロールを一律に付与する権限は与えない指定は？",
      answer: "GRANT sales_read TO lead_user WITH ADMIN OPTION",
      distractors: ["GRANT sales_read TO lead_user", "GRANT sales_read TO lead_user WITH GRANT OPTION", "GRANT ANY ROLEシステム権限をlead_userに付与する"],
      explanation: "ロールを直接WITH ADMIN OPTIONで付与すると、受領者はそのロールを他のユーザーに付与できます。通常の付与ではその権限が付きません。WITH GRANT OPTIONはオブジェクト権限用です。GRANT ANY ROLEは対象範囲が広すぎます。",
      doc: "sqlrf/GRANT.html"
    }
  ];

  if (typeof module === "object" && module.exports) module.exports = cards;
  root.OracleSilverDba = cards;
})(globalThis);
