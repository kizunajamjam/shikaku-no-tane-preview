(function exposeOracleSilverDbaExtra(root) {
  "use strict";

  const cards = [
    {
      id: "xdba-omf-destination", domain: "表領域とデータファイル",
      question: "ファイルシステム上でOracle Managed Filesを使い、DB_CREATE_FILE_DESTを別のディレクトリに変更した。変更後にファイル名を指定せず恒久表領域を作成すると、既存と新規のデータファイルはどうなる？",
      answer: "新規ファイルは新しい設定先に作られ、既存ファイルは元の場所に残る",
      distractors: ["新規ファイルは元の場所に作られ、既存ファイルは新しい設定先に移る", "新規ファイルも既存ファイルも新しい設定先に移される", "新規ファイルも既存ファイルも元の場所に残る"],
      explanation: "DB_CREATE_FILE_DESTは、ファイル名を省略して作成するデータファイルの既定の配置先です。変更は新規作成に適用され、既存ファイルの移動は行われません。新規ファイルに旧設定を適用する選択肢と、既存ファイルの移動を伴う選択肢は誤りです。",
      doc: "admin/using-oracle-managed-files.html"
    },
    {
      id: "xdba-deferred-creation", domain: "記憶域管理",
      question: "SEGMENT CREATION DEFERREDを明示して、ローカル管理の恒久表領域に空の通常のヒープ表を作成した。表セグメントが初めて割り当てられるのは原則としていつ？",
      answer: "その表に最初の行を挿入するとき",
      distractors: ["CREATE TABLE文が完了したとき", "その表への最初のSELECT文を実行したとき", "その表に対する最初のINSERTをコミットしたとき"],
      explanation: "遅延セグメント作成では、CREATE TABLEで定義を登録し、最初の行の挿入に伴って表セグメントを作成します。SELECTで空の表を参照しても領域は割り当てられません。挿入処理自体に領域が必要なので、コミットまで割当てを待つわけではありません。",
      doc: "refrn/DEFERRED_SEGMENT_CREATION.html"
    },
    {
      id: "xdba-shrink-compact", domain: "記憶域管理",
      question: "ASSM表領域にある、オンライン縮小の対象となるヒープ表で行移動を有効にした。ALTER TABLE events SHRINK SPACE COMPACTの直後、高水位標と空き領域はどうなる？",
      answer: "行は詰め直されるが、高水位標の変更と領域の返却は後続の縮小操作まで行われない",
      distractors: ["行を移動せず、高水位標を下げて領域を返却する", "行を詰め直し、同じ操作で高水位標も下げて領域を返却する", "高水位標を維持したまま、表の定義と全行を削除する"],
      explanation: "COMPACTを指定するとセグメント内のデータの詰め直しまで行います。COMPACTを付けないSHRINK SPACEを続けて実行すると、高水位標の調整と領域の返却を行えます。行の移動を省く指定でも、表を削除する指定でもありません。",
      doc: "admin/managing-space-for-schema-objects.html"
    },
    {
      id: "xdba-profile-resource-limit", domain: "権限管理",
      question: "利用者のプロファイルにSESSIONS_PER_USER 2とFAILED_LOGIN_ATTEMPTS 4を設定し、RESOURCE_LIMITをFALSEにした。他に制限がない場合、そのプロファイルのどの制限が適用される？",
      answer: "連続ログイン失敗回数の制限だけが適用される",
      distractors: ["同時セッション数の制限だけが適用される", "同時セッション数と連続ログイン失敗回数の両方の制限が適用される", "同時セッション数と連続ログイン失敗回数のどちらの制限も適用されない"],
      explanation: "SESSIONS_PER_USERはリソース制限なので、RESOURCE_LIMIT=FALSEでは適用されません。FAILED_LOGIN_ATTEMPTSはパスワード関連の制限なので、RESOURCE_LIMITの値に関係なく適用されます。",
      doc: "sqlrf/CREATE-PROFILE.html"
    },
    {
      id: "xdba-quota-privilege", domain: "権限管理",
      question: "APP_USERはCREATE TABLE権限を持つが、恒久表領域APP_DATAにクォータが付与されておらず、UNLIMITED TABLESPACE権限も持たない。APP_DATAで最大50 MBの領域を割り当てられるようにする操作は？",
      answer: "ALTER USER app_user QUOTA 50M ON app_data",
      distractors: ["ALTER USER app_user DEFAULT TABLESPACE app_data", "GRANT UNLIMITED TABLESPACE TO app_user", "ALTER TABLESPACE app_data AUTOEXTEND ON MAXSIZE 50M"],
      explanation: "QUOTAは指定した利用者が指定表領域で割り当てられる領域の上限です。DEFAULT TABLESPACEは既定の格納先だけを指定します。UNLIMITED TABLESPACEは表領域を限定せずクォータを上書きします。AUTOEXTENDのMAXSIZEはデータファイルの拡張上限で、利用者別の上限を設定しません。",
      doc: "sqlrf/ALTER-USER.html"
    },
    {
      id: "xdba-quota-zero", domain: "権限管理",
      question: "UNLIMITED TABLESPACEを持たない利用者は、APP_DATAに既存の表セグメントを持つ。DBAがその利用者のAPP_DATAのクォータを0にした後、既存セグメントはどう扱われる？",
      answer: "既存セグメントは残るが、その表領域で新たにエクステントを割り当てられなくなる",
      distractors: ["既存セグメントは即座に削除される", "既存セグメントは利用者のデフォルト表領域に自動で移動する", "既存セグメントなら以前と同じようにエクステントを追加できる"],
      explanation: "クォータを0にしても割当て済みの領域や既存オブジェクトはその場に残ります。追加の領域割当てはできません。既存オブジェクトの削除や移動はクォータの変更に含まれず、既存セグメントの拡張も制限の対象です。",
      doc: "sqlrf/ALTER-USER.html"
    },
    {
      id: "xdba-dynamic-memory-scope", domain: "インスタンス管理",
      question: "単一インスタンスの非CDBをSPFILEで起動している。動的なシステム・パラメータの変更を今すぐ試し、次回の起動では変更前のSPFILEの値に戻したい。ALTER SYSTEM SETの指定は？",
      answer: "SCOPE=MEMORY",
      distractors: ["SCOPE=SPFILE", "SCOPE=BOTH", "SCOPEを省略する"],
      explanation: "MEMORYは稼働中の値だけを変更し、SPFILEを更新しません。SPFILEは次回起動時からの変更です。BOTHは即時変更と永続化の両方を行い、SPFILEで起動した場合にSCOPEを省略したときもBOTHになります。",
      doc: "sqlrf/ALTER-SYSTEM.html"
    },
    {
      id: "xdba-pfile-from-memory", domain: "インスタンス管理",
      question: "起動後、SCOPE=MEMORYで初期化パラメータを変更した。現在稼働中の値を含むテキスト形式の初期化パラメータ・ファイルをサーバー上に出力する文は？",
      answer: "CREATE PFILE='/tmp/init_review.ora' FROM MEMORY",
      distractors: ["CREATE PFILE='/tmp/init_review.ora' FROM SPFILE", "CREATE SPFILE='/tmp/init_review.ora' FROM MEMORY", "ALTER SYSTEM SET SPFILE='/tmp/init_review.ora' SCOPE=MEMORY"],
      explanation: "CREATE PFILE FROM MEMORYは現在のインメモリー設定をサーバー上のテキスト・ファイルに書き出します。FROM SPFILEではメモリーだけの変更を取り込めません。CREATE SPFILEはバイナリ形式を作成し、ALTER SYSTEM SETは設定をファイルにエクスポートする文ではありません。",
      doc: "sqlrf/CREATE-PFILE.html"
    },
    {
      id: "xdba-shared-dispatcher", domain: "アーキテクチャ",
      question: "クライアントが共有サーバー構成で接続済みである。接続中のクライアントからSQLの要求を受け、空いている共有サーバー・プロセスが処理できるよう要求キューに入れるのは？",
      answer: "ディスパッチャ・プロセス",
      distractors: ["リスナー・プロセス", "当該クライアント専用のサーバー・プロセス", "データベース・ライター・プロセス（DBWn）"],
      explanation: "共有サーバー構成では、ディスパッチャがクライアントの要求をキューに置き、空いている共有サーバーが処理します。リスナーは初期接続を扱います。専用サーバーは専用接続を処理し、DBWnは変更済みブロックをデータファイルへ書き込みます。",
      doc: "cncpt/process-architecture.html"
    },
    {
      id: "xdba-easy-connect", domain: "Oracle Net",
      question: "SQL*Plusクライアントで、接続先のホストdb01、ポート1521、サービス名salespdbが分かっている。tnsnames.oraの別名やLDAPディレクトリを用意せず、user@//db01:1521/salespdbの形式で接続するネーミング方式は？",
      answer: "簡易接続ネーミング（Easy Connect）",
      distractors: ["ローカル・ネーミング", "ディレクトリ・ネーミング", "外部ネーミング"],
      explanation: "簡易接続ではホスト、ポート、サービス名を接続文字列に直接指定します。ローカル・ネーミングはtnsnames.oraの別名を、ディレクトリ・ネーミングはLDAPディレクトリを使います。外部ネーミングは外部のネーミング・サービスによる名前解決を使います。",
      doc: "netag/configuring-naming-methods.html"
    },
    {
      id: "xdba-spool-append", domain: "管理ツール",
      question: "PC上のSQL*Plusからリモートのデータベースに接続している。PC上の既存ファイルreport.txtを残したまま、これから実行する問合せの出力をその末尾に追加するコマンドは？",
      answer: "SPOOL report.txt APPEND",
      distractors: ["SPOOL report.txt REPLACE", "SPOOL report.txt CREATE", "SPOOL OFF"],
      explanation: "APPENDはSQL*Plusの出力をクライアント側のファイルの末尾に追加します。REPLACEはファイルを置き換え、CREATEは新規ファイルを作る指定です。OFFはスプールを停止します。",
      doc: "sqpug/SPOOL.html"
    },
    {
      id: "xdba-sqlerror-rollback", domain: "管理ツール",
      question: "SQL*PlusでDMLだけのバッチを実行する。途中でSQL文がエラーになったら、未コミットの変更を取り消し、SQL*Plusを失敗ステータスで終了させたい。スクリプト先頭の指定は？",
      answer: "WHENEVER SQLERROR EXIT FAILURE ROLLBACK",
      distractors: ["WHENEVER SQLERROR EXIT FAILURE COMMIT", "WHENEVER SQLERROR CONTINUE ROLLBACK", "WHENEVER OSERROR EXIT FAILURE ROLLBACK"],
      explanation: "SQLERRORを条件とし、EXIT FAILUREで終了し、ROLLBACKで未コミットの変更を取り消します。COMMITはそれまでの変更を確定し、CONTINUEは処理を継続します。OSERRORはファイル書込み失敗などのOSエラーが対象です。",
      doc: "sqpug/WHENEVER-SQLERROR.html"
    },
    {
      id: "xdba-pump-network-import", domain: "データ移動",
      question: "移行先に接続したimpdpで、移行元の表をダンプファイルを経由せず取り込みたい。移行先で使用できる移行元へのデータベース・リンクがSRC_LINKのとき、使う指定は？",
      answer: "NETWORK_LINK=SRC_LINK",
      distractors: ["DUMPFILE=SRC_LINK", "DIRECTORY=SRC_LINK", "ATTACH=SRC_LINK"],
      explanation: "NETWORK_LINKを指定すると、impdpはデータベース・リンクを介して移行元から直接取り込みます。DUMPFILEは既存のダンプファイル、DIRECTORYはファイルへのアクセスに使うディレクトリ・オブジェクト、ATTACHは既存のData Pumpジョブを指定します。",
      doc: "sutil/datapump-import-utility.html"
    },
    {
      id: "xdba-startup-force", domain: "インスタンス管理",
      question: "単一インスタンスのデータベースでSHUTDOWN IMMEDIATEを完了できず、インスタンスはまだ稼働している。SQL*PlusでSTARTUP FORCEを実行すると、再起動に先立ってどの停止モードが使われる？",
      answer: "ABORT",
      distractors: ["NORMAL", "IMMEDIATE", "TRANSACTIONAL"],
      explanation: "稼働中のインスタンスに対するSTARTUP FORCEは、ABORTで停止してからインスタンスを起動します。NORMALは利用者の切断を待ち、IMMEDIATEは未コミットの変更をロールバックし、TRANSACTIONALは実行中のトランザクションの終了を待ちます。",
      doc: "admin/starting-up-and-shutting-down.html"
    },
    {
      id: "xdba-password-expire", domain: "権限管理",
      question: "パスワード認証を使う既存の未ロックの利用者APP_USERに、次回ログイン時にそのパスワードを本人に変更させたい。管理者が行う操作は？",
      answer: "ALTER USER app_user PASSWORD EXPIRE",
      distractors: ["ALTER USER app_user ACCOUNT LOCK", "ALTER USER app_user ACCOUNT UNLOCK", "ALTER USER app_user DEFAULT ROLE NONE"],
      explanation: "PASSWORD EXPIREで現在のパスワードを失効させると、次回ログイン時に変更が求められます。ACCOUNT LOCKとUNLOCKはアカウントのロック状態を制御します。DEFAULT ROLE NONEはログオン時に既定で有効になるロールをなくす指定です。",
      doc: "sqlrf/ALTER-USER.html"
    },
    {
      id: "xdba-undo-switch", domain: "UNDO管理",
      question: "自動UNDO管理の単一インスタンスで、処理中のトランザクションがUNDOTBS1を使用している。DBAがUNDO_TABLESPACEをUNDOTBS2へ変更した直後、新旧のトランザクションのUNDOはどう扱われる？",
      answer: "処理中のトランザクションはUNDOTBS1を使い続け、切替え後に開始するトランザクションはUNDOTBS2を使う",
      distractors: ["処理中のトランザクションのUNDOも直ちにUNDOTBS2に移される", "処理中のトランザクションはすべてロールバックされる", "処理中のトランザクションが終わるまで、新規トランザクションもUNDOTBS1を使う"],
      explanation: "切替えの時点で進行中のトランザクションは旧UNDO表領域を使い続けます。切替え後の新規トランザクションは新しい表領域に割り当てられます。切替えのために処理中のUNDOを移動したりトランザクションをロールバックしたりする必要はありません。",
      doc: "admin/managing-undo.html"
    },
    {
      id: "xdba-restricted-session-enable", domain: "インスタンス管理",
      question: "稼働中のデータベースでALTER SYSTEM ENABLE RESTRICTED SESSIONを実行した。CREATE SESSIONは持つがRESTRICTED SESSIONを持たない一般利用者は、既存と新規の接続についてどうなる？",
      answer: "接続済みのセッションは維持され、新規接続は拒否される",
      distractors: ["接続済みのセッションは切断され、新規接続も拒否される", "接続済みのセッションは切断されるが、新規接続は許可される", "接続済みのセッションも新規接続も許可される"],
      explanation: "この文は新規接続にRESTRICTED SESSION権限を要求します。すでに接続している利用者を切断する作用はありません。CREATE SESSIONだけでは制限中の新規接続に必要な権限を満たしません。",
      doc: "admin/starting-up-and-shutting-down.html"
    },
    {
      id: "xdba-default-role", domain: "権限管理",
      question: "パスワードなしのロールREAD_RとEDIT_RがAPP_USERに直接付与されている。再ログオン時に自動で有効にするのはREAD_Rだけにし、必要時は本人がSET ROLEでEDIT_Rを有効にできるようにする操作は？",
      answer: "ALTER USER app_user DEFAULT ROLE read_r",
      distractors: ["REVOKE edit_r FROM app_user", "ALTER USER app_user DEFAULT ROLE ALL", "ALTER USER app_user DEFAULT ROLE NONE"],
      explanation: "DEFAULT ROLE read_rはログオン時に有効にするロールをREAD_Rに絞ります。EDIT_Rの付与は維持されるので、APP_USERはSET ROLEでそのロールを有効にできます。REVOKEは付与を取り消し、ALLは両方を、NONEはどちらも既定では有効にしません。",
      doc: "sqlrf/ALTER-USER.html"
    }
  ];

  if (typeof module === "object" && module.exports) module.exports = cards;
  root.OracleSilverDbaExtra = cards;
})(globalThis);
