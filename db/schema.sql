-- アクセス解析用テーブル
-- 1行 = 「あるパスの、ある日の集計」。個人を特定する情報は一切保存しない。
CREATE TABLE IF NOT EXISTS page_views (
  path             TEXT    NOT NULL,           -- 正規化済みパス（末尾スラッシュなし。トップは '/'）
  day              TEXT    NOT NULL,           -- JST基準の YYYY-MM-DD
  views            INTEGER NOT NULL DEFAULT 0, -- 表示回数（セッション内の再読み込みは除外）
  visitors         INTEGER NOT NULL DEFAULT 0, -- その日はじめてそのページを見た人の数
  total_seconds    INTEGER NOT NULL DEFAULT 0, -- 滞在秒数の合計（タブが裏に回っている間は数えない）
  duration_samples INTEGER NOT NULL DEFAULT 0, -- 滞在時間を測れた回数。平均はこの数で割る
  PRIMARY KEY (path, day)
);

CREATE INDEX IF NOT EXISTS idx_page_views_day  ON page_views (day);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views (path);

-- 流入元・デバイス・時間帯の集計。
-- 1行 = 「日 × 時 × デバイス × 流入元 の表示回数」。
CREATE TABLE IF NOT EXISTS visit_events (
  day    TEXT    NOT NULL,           -- JST基準の YYYY-MM-DD
  hour   INTEGER NOT NULL,           -- JST基準の 0-23
  device TEXT    NOT NULL,           -- desktop / tablet / mobile / unknown
  source TEXT    NOT NULL,           -- direct / internal / ドメイン名
  views  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, hour, device, source)
);

CREATE INDEX IF NOT EXISTS idx_visit_events_day ON visit_events (day);

-- サイト全体の訪問者数・セッション数。
-- page_views.visitors は「そのページを見た人数」なので、合計してもサイト全体の
-- 訪問者数にはならない（1人が3ページ見ると3人になる）。そのため別に持つ。
CREATE TABLE IF NOT EXISTS daily_visits (
  day      TEXT    NOT NULL PRIMARY KEY, -- JST基準の YYYY-MM-DD
  visitors INTEGER NOT NULL DEFAULT 0,   -- その日はじめてサイトに来た人の数
  sessions INTEGER NOT NULL DEFAULT 0    -- タブのセッション数
);
