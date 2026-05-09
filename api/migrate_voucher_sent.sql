-- Add voucher_sent_at column to track if voucher email has been sent
ALTER TABLE bookings
  ADD COLUMN voucher_sent_at DATETIME NULL DEFAULT NULL AFTER updated_at;
