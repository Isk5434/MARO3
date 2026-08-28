-- 流入元・デバイス・時間帯の集計を追加する。
-- page_views とは別テーブルにして、1行 = 「日 × 時 × デバイス × 流入元 の表示回数」とする。
CREATE TABLE IF NOT EXISTS visit_events (
  day    TEXT    NOT NULL,           -- JST基準の YYYY-MM-DD
  hour   INTEGER NOT NULL,           -- JST基準の 0-23
  device TEXT    NOT NULL,           -- desktop / tablet / mobile / unknown
  source TEXT    NOT NULL,           -- direct / internal / ドメイン名
  views  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, hour, device, source)
);

CREATE INDEX IF NOT EXISTS idx_visit_events_day ON visit_events (day);
