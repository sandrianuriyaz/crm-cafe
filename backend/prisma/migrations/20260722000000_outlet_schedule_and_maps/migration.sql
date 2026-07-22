-- AlterTable
ALTER TABLE "outlets" ADD COLUMN     "openTime" TEXT,
ADD COLUMN     "closeTime" TEXT,
ADD COLUMN     "closedDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "mapsUrl" TEXT;

-- Backfill jadwal dari kolom `hours` yang selama ini teks bebas. Hanya pola
-- HH:MM-HH:MM yang bisa dipercaya; hari tidak diurai (closedDays dibiarkan
-- kosong) karena penulisannya tidak konsisten.
UPDATE "outlets"
SET
  "openTime"  = lpad(split_part((regexp_match("hours", '(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})'))[1], ':', 1), 2, '0') || ':' || split_part((regexp_match("hours", '(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})'))[1], ':', 2),
  "closeTime" = lpad(split_part((regexp_match("hours", '(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})'))[2], ':', 1), 2, '0') || ':' || split_part((regexp_match("hours", '(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})'))[2], ':', 2)
WHERE "hours" ~ '\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}';
