-- 滞在時間の計測を後から追加する場合のみ実行する。
-- まだ page_views を作っていないなら db/schema.sql だけでよい。
ALTER TABLE page_views ADD COLUMN total_seconds    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE page_views ADD COLUMN duration_samples INTEGER NOT NULL DEFAULT 0;
