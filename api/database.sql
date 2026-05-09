-- SamuiLook Inbound — schema
-- รันด้วย phpMyAdmin หรือใช้ /api/setup.php?key=samui-setup-2025 แทน
--
-- ทุกตารางใช้ IF NOT EXISTS เพื่อให้รันซ้ำได้อย่างปลอดภัย
-- (ALTER แยกในไฟล์ migration ภายหลังถ้ามีการเปลี่ยน schema)

-- ============================================================
-- 1) AUTH / USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    full_name   VARCHAR(150) NOT NULL,
    role        ENUM('admin','user') NOT NULL DEFAULT 'user',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 2) MASTER DATA (เมนู INFORMATION)
-- ============================================================

-- ลูกค้า / Agent
CREATE TABLE IF NOT EXISTS customers (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    code         VARCHAR(5)   NOT NULL UNIQUE,        -- รหัสย่อ 5 ตัว เช่น CCOVE
    name         VARCHAR(255) NOT NULL,
    email        VARCHAR(255) NULL,
    phone        VARCHAR(50)  NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customers_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- สถานที่ — รวมโรงแรม / สนามบิน / ท่าเรือ / สถานที่ท่องเที่ยว
CREATE TABLE IF NOT EXISTS places (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255) NOT NULL UNIQUE,
    type       ENUM('hotel','airport','pier','place','other') NOT NULL DEFAULT 'place',
    location   TEXT NULL,                          -- Google Maps URL หรือพิกัด/ที่อยู่ (TEXT รองรับลิงก์ยาว)
    phone      VARCHAR(50)  NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_places_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- เที่ยวบิน (สำหรับ auto-fill ในหน้า Booking)
CREATE TABLE IF NOT EXISTS flights (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    flight_no   VARCHAR(20) NOT NULL UNIQUE,
    origin      VARCHAR(10) NOT NULL,           -- ต้นทาง เช่น SIN
    destination VARCHAR(10) NOT NULL,           -- ปลายทาง เช่น USM
    dep_time    TIME NULL,
    arr_time    TIME NULL,
    airline     VARCHAR(100) NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ผู้ให้บริการ (SUN, LOM, FUNNY, MR UNG, BY AGENT, Samui Look)
CREATE TABLE IF NOT EXISTS suppliers (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    code       VARCHAR(5)   NOT NULL UNIQUE,        -- รหัสย่อ 5 ตัว เช่น SUNTR
    name       VARCHAR(255) NOT NULL,
    type       ENUM('transfer','boat','tour','hotel','agent','other') NOT NULL DEFAULT 'other',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_suppliers_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- รายการทัวร์ master
CREATE TABLE IF NOT EXISTS tours (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 3) BOOKINGS (หัวการจอง)
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    booking_code        VARCHAR(30) NOT NULL UNIQUE,        -- BK-2026-0001
    reference           VARCHAR(100) NULL,
    customer_id         INT NULL,
    customer_code       VARCHAR(50)  NULL,                  -- snapshot
    customer_name       VARCHAR(255) NULL,                  -- snapshot
    recorded_by_id      INT NULL,
    recorded_by_name    VARCHAR(150) NULL,                  -- snapshot ตอนบันทึก

    trip_start          DATE NULL,                          -- earliest date (ไว้ render calendar)
    trip_end            DATE NULL,
    status              ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
    remark              TEXT NULL,

    -- ยอดรวม (cache; recalc ทุกครั้งที่บันทึก)
    total_hotel_net     DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_hotel_sale    DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_transfer_net  DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_transfer_sale DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_boat_net      DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_boat_sale     DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_tour_net      DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_tour_sale     DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_net           DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_sale          DECIMAL(12,2) NOT NULL DEFAULT 0,

    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    CONSTRAINT fk_booking_user     FOREIGN KEY (recorded_by_id) REFERENCES users(id)  ON DELETE SET NULL,

    INDEX idx_bookings_trip (trip_start, trip_end),
    INDEX idx_bookings_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ผู้เดินทาง
CREATE TABLE IF NOT EXISTS booking_travelers (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    booking_id      INT NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0,
    title           VARCHAR(10) NULL,                       -- MR / MS / MRS / MISS / MSTR / CHD / INF
    name            VARCHAR(200) NOT NULL,                  -- ชื่อเต็ม "SUZUKI / TOSHIE"
    age             INT NULL,
    traveler_type   ENUM('adult','child','infant') NOT NULL DEFAULT 'adult',
    passport_no     VARCHAR(50) NULL,
    passport_expiry DATE NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_traveler_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_travelers_booking (booking_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ไฟลท์ขาเข้า / ขาออก
CREATE TABLE IF NOT EXISTS booking_flights (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    booking_id   INT NOT NULL,
    direction    ENUM('arrival','departure') NOT NULL,
    flight_date  DATE NULL,
    flight_id    INT NULL,                                  -- FK → flights master
    flight_no    VARCHAR(20) NULL,                          -- snapshot
    route        VARCHAR(20) NULL,                          -- snapshot
    time         TIME NULL,                                 -- snapshot (arr_time หรือ dep_time)

    CONSTRAINT fk_bflight_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_bflight_flight  FOREIGN KEY (flight_id)  REFERENCES flights(id)  ON DELETE SET NULL,
    INDEX idx_bflights_booking (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ที่พัก
CREATE TABLE IF NOT EXISTS booking_hotels (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    booking_id   INT NOT NULL,
    sort_order   INT NOT NULL DEFAULT 0,
    place_id     INT NULL,                                  -- FK → places (type=hotel)
    place_name   VARCHAR(255) NULL,                         -- snapshot
    check_in     DATE NULL,
    check_out    DATE NULL,
    night        INT NOT NULL DEFAULT 0,
    room_type    VARCHAR(100) NULL,
    bed_type     VARCHAR(50)  NULL,
    room_count   INT NOT NULL DEFAULT 1,
    breakfast    ENUM('included','not_included','none') NOT NULL DEFAULT 'none',
    managed_by   ENUM('BY AGENT','Samui Look') NOT NULL DEFAULT 'Samui Look',
    net_amount   DECIMAL(12,2) NOT NULL DEFAULT 0,
    sale_amount  DECIMAL(12,2) NOT NULL DEFAULT 0,
    due_payment  DATE NULL,
    status       ENUM('pending','paid') NOT NULL DEFAULT 'pending',

    CONSTRAINT fk_bhotel_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_bhotel_place   FOREIGN KEY (place_id)   REFERENCES places(id)   ON DELETE SET NULL,
    INDEX idx_bhotels_booking (booking_id, sort_order),
    INDEX idx_bhotels_dates (check_in, check_out)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- รถรับส่ง
CREATE TABLE IF NOT EXISTS booking_transfers (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    booking_id    INT NOT NULL,
    sort_order    INT NOT NULL DEFAULT 0,
    service_date  DATE NULL,
    service_type  ENUM('Meeting','Transfer','Sending') NOT NULL DEFAULT 'Transfer',
    vehicle_count INT NOT NULL DEFAULT 1,
    from_place_id INT NULL,
    from_text     VARCHAR(255) NULL,                        -- snapshot
    to_place_id   INT NULL,
    to_text       VARCHAR(255) NULL,                        -- snapshot
    pickup_time   TIME NULL,
    supplier_id   INT NULL,
    supplier_code VARCHAR(50) NULL,                         -- snapshot
    net_per_car   DECIMAL(12,2) NOT NULL DEFAULT 0,
    sale_adult    DECIMAL(12,2) NOT NULL DEFAULT 0,
    sale_child    DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT fk_btransfer_booking  FOREIGN KEY (booking_id)    REFERENCES bookings(id)  ON DELETE CASCADE,
    CONSTRAINT fk_btransfer_from     FOREIGN KEY (from_place_id) REFERENCES places(id)    ON DELETE SET NULL,
    CONSTRAINT fk_btransfer_to       FOREIGN KEY (to_place_id)   REFERENCES places(id)    ON DELETE SET NULL,
    CONSTRAINT fk_btransfer_supplier FOREIGN KEY (supplier_id)   REFERENCES suppliers(id) ON DELETE SET NULL,
    INDEX idx_btransfers_booking (booking_id, sort_order),
    INDEX idx_btransfers_date (service_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ตั๋วเรือ
CREATE TABLE IF NOT EXISTS booking_boats (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    booking_id    INT NOT NULL,
    sort_order    INT NOT NULL DEFAULT 0,
    service_date  DATE NULL,
    service_type  VARCHAR(50) NOT NULL DEFAULT 'Boat Ticket',
    pax_text      VARCHAR(20) NULL,                         -- "2+1"
    from_place_id INT NULL,
    from_text     VARCHAR(255) NULL,
    to_place_id   INT NULL,
    to_text       VARCHAR(255) NULL,
    boat_time     VARCHAR(50) NULL,                         -- "08.00 - 09.30"
    supplier_id   INT NULL,
    supplier_code VARCHAR(50) NULL,
    net_adult     DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_child     DECIMAL(12,2) NOT NULL DEFAULT 0,
    sale_adult    DECIMAL(12,2) NOT NULL DEFAULT 0,
    sale_child    DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT fk_bboat_booking  FOREIGN KEY (booking_id)    REFERENCES bookings(id)  ON DELETE CASCADE,
    CONSTRAINT fk_bboat_from     FOREIGN KEY (from_place_id) REFERENCES places(id)    ON DELETE SET NULL,
    CONSTRAINT fk_bboat_to       FOREIGN KEY (to_place_id)   REFERENCES places(id)    ON DELETE SET NULL,
    CONSTRAINT fk_bboat_supplier FOREIGN KEY (supplier_id)   REFERENCES suppliers(id) ON DELETE SET NULL,
    INDEX idx_bboats_booking (booking_id, sort_order),
    INDEX idx_bboats_date (service_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ทัวร์เสริม
CREATE TABLE IF NOT EXISTS booking_tours (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    booking_id      INT NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0,
    service_date    DATE NULL,
    tour_id         INT NULL,
    tour_name       VARCHAR(255) NULL,                      -- snapshot
    pax_text        VARCHAR(20) NULL,                       -- "2+1"
    pickup_location VARCHAR(255) NULL,
    pickup_time     TIME NULL,
    supplier_id     INT NULL,
    supplier_code   VARCHAR(50) NULL,
    tour_type       ENUM('included','option') NOT NULL DEFAULT 'option',
    net_adult       DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_child       DECIMAL(12,2) NOT NULL DEFAULT 0,
    sale_adult      DECIMAL(12,2) NOT NULL DEFAULT 0,
    sale_child      DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT fk_btour_booking  FOREIGN KEY (booking_id) REFERENCES bookings(id)  ON DELETE CASCADE,
    CONSTRAINT fk_btour_tour     FOREIGN KEY (tour_id)    REFERENCES tours(id)     ON DELETE SET NULL,
    CONSTRAINT fk_btour_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    INDEX idx_btours_booking (booking_id, sort_order),
    INDEX idx_btours_date (service_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
