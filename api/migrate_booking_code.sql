-- Migrate booking_code from old format BK-YYYY-NNNN to new format BK{YY}{MM}{NNN}
-- Old: BK-2026-0001
-- New: BK2605001 (uses created_at year+month, last 3 digits of running number)

UPDATE bookings
SET booking_code = CONCAT(
    'BK',
    DATE_FORMAT(created_at, '%y%m'),
    LPAD(CAST(SUBSTRING_INDEX(booking_code, '-', -1) AS UNSIGNED), 3, '0')
)
WHERE booking_code LIKE 'BK-%';

-- Verify
SELECT id, booking_code, created_at FROM bookings ORDER BY id;
