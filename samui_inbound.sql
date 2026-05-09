-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 09, 2026 at 04:47 PM
-- Server version: 10.11.14-MariaDB-0+deb12u2-log
-- PHP Version: 8.4.19

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `samui_inbound`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `booking_code` varchar(30) NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `customer_code` varchar(50) DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `recorded_by_id` int(11) DEFAULT NULL,
  `recorded_by_name` varchar(150) DEFAULT NULL,
  `trip_start` date DEFAULT NULL,
  `trip_end` date DEFAULT NULL,
  `status` enum('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
  `remark` text DEFAULT NULL,
  `total_hotel_net` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_hotel_sale` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_transfer_net` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_transfer_sale` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_boat_net` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_boat_sale` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_tour_net` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_tour_sale` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_net` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_sale` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `booking_code`, `reference`, `customer_id`, `customer_code`, `customer_name`, `recorded_by_id`, `recorded_by_name`, `trip_start`, `trip_end`, `status`, `remark`, `total_hotel_net`, `total_hotel_sale`, `total_transfer_net`, `total_transfer_sale`, `total_boat_net`, `total_boat_sale`, `total_tour_net`, `total_tour_sale`, `total_net`, `total_sale`, `created_at`, `updated_at`) VALUES
(6, 'BK-2026-0001', NULL, 4, 'CCOVE', 'CHAWENG COVE RESOTEL CO.,LTD.', 1, 'Administrator', '0000-00-00', '0000-00-00', 'pending', NULL, 0.00, 0.00, 500.00, 1200.00, 0.00, 0.00, 0.00, 0.00, 500.00, 1200.00, '2026-05-09 16:43:14', '2026-05-09 16:43:14');

-- --------------------------------------------------------

--
-- Table structure for table `booking_boats`
--

CREATE TABLE `booking_boats` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `service_date` date DEFAULT NULL,
  `service_type` varchar(50) NOT NULL DEFAULT 'Boat Ticket',
  `pax_text` varchar(20) DEFAULT NULL,
  `from_place_id` int(11) DEFAULT NULL,
  `from_text` varchar(255) DEFAULT NULL,
  `to_place_id` int(11) DEFAULT NULL,
  `to_text` varchar(255) DEFAULT NULL,
  `boat_time` varchar(50) DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `supplier_code` varchar(50) DEFAULT NULL,
  `net_adult` decimal(12,2) NOT NULL DEFAULT 0.00,
  `net_child` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sale_adult` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sale_child` decimal(12,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking_flights`
--

CREATE TABLE `booking_flights` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `direction` enum('arrival','departure') NOT NULL,
  `flight_date` date DEFAULT NULL,
  `flight_id` int(11) DEFAULT NULL,
  `flight_no` varchar(20) DEFAULT NULL,
  `route` varchar(20) DEFAULT NULL,
  `time` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking_hotels`
--

CREATE TABLE `booking_hotels` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `place_id` int(11) DEFAULT NULL,
  `place_name` varchar(255) DEFAULT NULL,
  `check_in` date DEFAULT NULL,
  `check_out` date DEFAULT NULL,
  `night` int(11) NOT NULL DEFAULT 0,
  `room_type` varchar(100) DEFAULT NULL,
  `bed_type` varchar(50) DEFAULT NULL,
  `room_count` int(11) NOT NULL DEFAULT 1,
  `breakfast` enum('included','not_included','none') NOT NULL DEFAULT 'none',
  `managed_by` enum('BY AGENT','Samui Look') NOT NULL DEFAULT 'Samui Look',
  `net_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sale_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `due_payment` date DEFAULT NULL,
  `status` enum('pending','paid') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking_tours`
--

CREATE TABLE `booking_tours` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `service_date` date DEFAULT NULL,
  `tour_id` int(11) DEFAULT NULL,
  `tour_name` varchar(255) DEFAULT NULL,
  `pax_text` varchar(20) DEFAULT NULL,
  `pickup_location` varchar(255) DEFAULT NULL,
  `pickup_time` time DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `supplier_code` varchar(50) DEFAULT NULL,
  `tour_type` enum('included','option') NOT NULL DEFAULT 'option',
  `net_adult` decimal(12,2) NOT NULL DEFAULT 0.00,
  `net_child` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sale_adult` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sale_child` decimal(12,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking_transfers`
--

CREATE TABLE `booking_transfers` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `service_date` date DEFAULT NULL,
  `service_type` enum('Meeting','Transfer','Sending') NOT NULL DEFAULT 'Transfer',
  `vehicle_count` int(11) NOT NULL DEFAULT 1,
  `from_place_id` int(11) DEFAULT NULL,
  `from_text` varchar(255) DEFAULT NULL,
  `to_place_id` int(11) DEFAULT NULL,
  `to_text` varchar(255) DEFAULT NULL,
  `pickup_time` time DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `supplier_code` varchar(50) DEFAULT NULL,
  `net_per_car` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sale_adult` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sale_child` decimal(12,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `booking_transfers`
--

INSERT INTO `booking_transfers` (`id`, `booking_id`, `sort_order`, `service_date`, `service_type`, `vehicle_count`, `from_place_id`, `from_text`, `to_place_id`, `to_text`, `pickup_time`, `supplier_id`, `supplier_code`, `net_per_car`, `sale_adult`, `sale_child`) VALUES
(1, 6, 0, '0000-00-00', 'Transfer', 1, 1, 'CHAWENG NOI POOL VILLA', 2, 'SAMUI AIRPORT (USM)', '12:30:00', 1, 'SUNTR', 500.00, 1200.00, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `booking_travelers`
--

CREATE TABLE `booking_travelers` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `title` varchar(10) DEFAULT NULL,
  `name` varchar(200) NOT NULL DEFAULT '',
  `age` int(11) DEFAULT NULL,
  `traveler_type` enum('adult','child','infant') NOT NULL DEFAULT 'adult',
  `passport_no` varchar(50) DEFAULT NULL,
  `passport_expiry` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `booking_travelers`
--

INSERT INTO `booking_travelers` (`id`, `booking_id`, `sort_order`, `title`, `name`, `age`, `traveler_type`, `passport_no`, `passport_expiry`, `created_at`) VALUES
(1, 6, 0, 'MR', 'Test', NULL, 'adult', 'Test', NULL, '2026-05-09 16:43:14');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `code` varchar(5) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `code`, `name`, `email`, `phone`, `created_at`, `updated_at`) VALUES
(4, 'CCOVE', 'CHAWENG COVE RESOTEL CO.,LTD.', 'reservation@chawengcove.com', '077-422-509', '2026-05-09 14:41:53', '2026-05-09 14:41:53'),
(5, 'HWATA', 'HAJIME WATANABE', 'hajime.w@example.com', '+81-90-1234-5678', '2026-05-09 14:41:53', '2026-05-09 14:41:53'),
(6, 'JSMTH', 'JOHN SMITH', NULL, '+44-20-7946-0958', '2026-05-09 14:41:53', '2026-05-09 14:41:53');

-- --------------------------------------------------------

--
-- Table structure for table `flights`
--

CREATE TABLE `flights` (
  `id` int(11) NOT NULL,
  `flight_no` varchar(20) NOT NULL,
  `origin` varchar(10) NOT NULL,
  `destination` varchar(10) NOT NULL,
  `dep_time` time DEFAULT NULL,
  `arr_time` time DEFAULT NULL,
  `airline` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `flights`
--

INSERT INTO `flights` (`id`, `flight_no`, `origin`, `destination`, `dep_time`, `arr_time`, `airline`, `created_at`, `updated_at`) VALUES
(1, 'SQ8340', 'SIN', 'USM', '08:30:00', '09:50:00', 'Singapore Airlines', '2026-05-09 14:30:19', '2026-05-09 15:23:56'),
(2, 'PG125', 'BKK', 'USM', '07:45:00', '09:00:00', 'Bangkok Airways', '2026-05-09 14:30:19', '2026-05-09 15:23:56'),
(3, 'TG2125', 'BKK', 'USM', '15:30:00', '16:50:00', 'Thai Airways', '2026-05-09 14:30:19', '2026-05-09 15:23:56');

-- --------------------------------------------------------

--
-- Table structure for table `places`
--

CREATE TABLE `places` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('hotel','airport','pier','place','other') NOT NULL DEFAULT 'place',
  `location` text DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `places`
--

INSERT INTO `places` (`id`, `name`, `type`, `location`, `phone`, `created_at`, `updated_at`) VALUES
(1, 'CHAWENG NOI POOL VILLA', 'hotel', 'https://maps.app.goo.gl/351DBS4fNpuL1cad9', '077-123-456', '2026-05-09 14:30:19', '2026-05-09 14:58:55'),
(2, 'SAMUI AIRPORT (USM)', 'airport', 'https://maps.app.goo.gl/351DBS4fNpuL1cad9', '077-428-500', '2026-05-09 14:30:19', '2026-05-09 14:59:08'),
(3, 'SEATRAN PIER', 'pier', 'https://maps.app.goo.gl/351DBS4fNpuL1cad9', '077-246-001', '2026-05-09 14:30:19', '2026-05-09 14:59:11');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL,
  `code` varchar(5) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('transfer','boat','tour','hotel','agent','other') NOT NULL DEFAULT 'other',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `code`, `name`, `type`, `created_at`, `updated_at`) VALUES
(1, 'SUNTR', 'Sun Transfer', 'transfer', '2026-05-09 14:30:19', '2026-05-09 15:29:13'),
(2, 'LOMPB', 'Lomprayah Boat', 'boat', '2026-05-09 14:30:19', '2026-05-09 15:29:13'),
(3, 'FUNNY', 'Funny Tour', 'tour', '2026-05-09 14:30:19', '2026-05-09 14:30:19');

-- --------------------------------------------------------

--
-- Table structure for table `tours`
--

CREATE TABLE `tours` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tours`
--

INSERT INTO `tours` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Safari Tour Half Day', 'ตะลุยป่า ขับ ATV ดูช้าง น้ำตก ครึ่งวัน', '2026-05-09 14:30:19', '2026-05-09 14:30:19'),
(2, 'Angthong Marine Park', 'ดำน้ำตื้น พายคายัค ทัวร์ 1 วัน', '2026-05-09 14:30:19', '2026-05-09 14:30:19'),
(3, 'Koh Tao + Koh Nangyuan', 'Snorkeling 2 เกาะ Speedboat 1 วัน', '2026-05-09 14:30:19', '2026-05-09 14:30:19');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `role`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2y$10$YINi/wngpLSmEw82U7ITrew867Nf/yAWQ..16ULY6hwW4y2NS3R3e', 'Administrator', 'admin', '2026-05-07 09:59:04', '2026-05-07 09:59:04');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `booking_code` (`booking_code`),
  ADD KEY `fk_booking_user` (`recorded_by_id`),
  ADD KEY `idx_bookings_trip` (`trip_start`,`trip_end`),
  ADD KEY `idx_bookings_status` (`status`),
  ADD KEY `fk_booking_customer` (`customer_id`);

--
-- Indexes for table `booking_boats`
--
ALTER TABLE `booking_boats`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_bboat_from` (`from_place_id`),
  ADD KEY `fk_bboat_to` (`to_place_id`),
  ADD KEY `idx_bboats_booking` (`booking_id`,`sort_order`),
  ADD KEY `idx_bboats_date` (`service_date`),
  ADD KEY `fk_bboat_supplier` (`supplier_id`);

--
-- Indexes for table `booking_flights`
--
ALTER TABLE `booking_flights`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_bflight_flight` (`flight_id`),
  ADD KEY `idx_bflights_booking` (`booking_id`);

--
-- Indexes for table `booking_hotels`
--
ALTER TABLE `booking_hotels`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_bhotel_place` (`place_id`),
  ADD KEY `idx_bhotels_booking` (`booking_id`,`sort_order`),
  ADD KEY `idx_bhotels_dates` (`check_in`,`check_out`);

--
-- Indexes for table `booking_tours`
--
ALTER TABLE `booking_tours`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_btour_tour` (`tour_id`),
  ADD KEY `idx_btours_booking` (`booking_id`,`sort_order`),
  ADD KEY `idx_btours_date` (`service_date`),
  ADD KEY `fk_btour_supplier` (`supplier_id`);

--
-- Indexes for table `booking_transfers`
--
ALTER TABLE `booking_transfers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_btransfer_from` (`from_place_id`),
  ADD KEY `fk_btransfer_to` (`to_place_id`),
  ADD KEY `idx_btransfers_booking` (`booking_id`,`sort_order`),
  ADD KEY `idx_btransfers_date` (`service_date`),
  ADD KEY `fk_btransfer_supplier` (`supplier_id`);

--
-- Indexes for table `booking_travelers`
--
ALTER TABLE `booking_travelers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_travelers_booking` (`booking_id`,`sort_order`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_customers_name` (`name`);

--
-- Indexes for table `flights`
--
ALTER TABLE `flights`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `flight_no` (`flight_no`);

--
-- Indexes for table `places`
--
ALTER TABLE `places`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_places_type` (`type`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_suppliers_type` (`type`);

--
-- Indexes for table `tours`
--
ALTER TABLE `tours`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `booking_boats`
--
ALTER TABLE `booking_boats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `booking_flights`
--
ALTER TABLE `booking_flights`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `booking_hotels`
--
ALTER TABLE `booking_hotels`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `booking_tours`
--
ALTER TABLE `booking_tours`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `booking_transfers`
--
ALTER TABLE `booking_transfers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `booking_travelers`
--
ALTER TABLE `booking_travelers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `flights`
--
ALTER TABLE `flights`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `places`
--
ALTER TABLE `places`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tours`
--
ALTER TABLE `tours`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_booking_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_booking_user` FOREIGN KEY (`recorded_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `booking_boats`
--
ALTER TABLE `booking_boats`
  ADD CONSTRAINT `fk_bboat_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bboat_from` FOREIGN KEY (`from_place_id`) REFERENCES `places` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_bboat_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_bboat_to` FOREIGN KEY (`to_place_id`) REFERENCES `places` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `booking_flights`
--
ALTER TABLE `booking_flights`
  ADD CONSTRAINT `fk_bflight_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bflight_flight` FOREIGN KEY (`flight_id`) REFERENCES `flights` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `booking_hotels`
--
ALTER TABLE `booking_hotels`
  ADD CONSTRAINT `fk_bhotel_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bhotel_place` FOREIGN KEY (`place_id`) REFERENCES `places` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `booking_tours`
--
ALTER TABLE `booking_tours`
  ADD CONSTRAINT `fk_btour_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_btour_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_btour_tour` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `booking_transfers`
--
ALTER TABLE `booking_transfers`
  ADD CONSTRAINT `fk_btransfer_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_btransfer_from` FOREIGN KEY (`from_place_id`) REFERENCES `places` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_btransfer_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_btransfer_to` FOREIGN KEY (`to_place_id`) REFERENCES `places` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `booking_travelers`
--
ALTER TABLE `booking_travelers`
  ADD CONSTRAINT `fk_traveler_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
