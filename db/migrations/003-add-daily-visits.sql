-- サイト全体の訪問者数・セッション数を日ごとに持つ。
-- page_views.visitors は「そのページを見た人数」であり、合計するとサイト全体の
-- 訪問者数にはならない（1人が3ページ見ると3人になる）。そのため別テーブルにする。
CREATE TABLE IF NOT EXISTS daily_visits (
  day      TEXT    NOT NULL PRIMARY KEY, -- JST基準の YYYY-MM-DD
  visitors INTEGER NOT NULL DEFAULT 0,   -- その日はじめてサイトに来た人の数
  sessions INTEGER NOT NULL DEFAULT 0    -- タブのセッション数
);
