<?php

declare(strict_types=1);
require __DIR__ . '/db.php';

class BookingValidationException extends RuntimeException {}

$me = require_login();
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

try {
    // ----- CALENDAR EVENTS -----------------------------------------------
    // GET /bookings.php?view=events&from=YYYY-MM-DD&to=YYYY-MM-DD
    // คืน events ที่ flatten แล้วจาก hotels / transfers / boats / tours
    if ($method === 'GET' && ($_GET['view'] ?? '') === 'events') {
        $from = trim((string)($_GET['from'] ?? ''));
        $to   = trim((string)($_GET['to']   ?? ''));
        if ($from === '' || $to === '') json_error('Missing from/to', 400);
        json_response(['success' => true, 'events' => fetch_events($from, $to)]);
    }

    if ($method === 'GET' && $id <= 0) {
        // ----- LIST ----------------------------------------------------------
        $params = [];
        $where  = '1=1';

        // filter ตามช่วงวันที่ (สำหรับ calendar): from / to (YYYY-MM-DD)
        $from = trim((string)($_GET['from'] ?? ''));
        $to   = trim((string)($_GET['to']   ?? ''));
        if ($from !== '' && $to !== '') {
            $where .= ' AND trip_start <= :to AND trip_end >= :from';
            $params[':from'] = $from;
            $params[':to']   = $to;
        }

        $search = trim((string)($_GET['search'] ?? ''));
        $field  = trim((string)($_GET['searchField'] ?? ''));
        if ($search !== '') {
            $like = '%' . $search . '%';
            switch ($field) {
                case 'id':
                    $where .= ' AND booking_code LIKE :q';
                    $params[':q'] = $like;
                    break;
                case 'customer':
                    $where .= ' AND customer_name LIKE :q';
                    $params[':q'] = $like;
                    break;
                case 'agent':
                    // ยังไม่มี agent column — match กับ recorded_by_name ไว้ก่อน
                    $where .= ' AND recorded_by_name LIKE :q';
                    $params[':q'] = $like;
                    break;
                case 'date_in':
                    $where .= ' AND CAST(trip_start AS CHAR) LIKE :q';
                    $params[':q'] = $like;
                    break;
                default:
                    $where .= ' AND (booking_code LIKE :q OR customer_name LIKE :q OR reference LIKE :q)';
                    $params[':q'] = $like;
            }
        }

        $sql = "SELECT b.id, b.booking_code, b.reference, b.customer_id, b.customer_code, b.customer_name,
                       b.recorded_by_id, b.recorded_by_name, b.trip_start, b.trip_end, b.status, b.remark,
                       b.total_net, b.total_sale,
                       b.total_hotel_net, b.total_hotel_sale,
                       b.total_transfer_net, b.total_transfer_sale,
                       b.total_boat_net, b.total_boat_sale,
                       b.total_tour_net, b.total_tour_sale,
                       b.created_at, b.updated_at, b.voucher_sent_at,
                       c.email AS customer_email,
                       (SELECT COUNT(*) FROM booking_travelers t WHERE t.booking_id = b.id AND t.traveler_type = 'adult')  AS pax_adult,
                       (SELECT COUNT(*) FROM booking_travelers t WHERE t.booking_id = b.id AND t.traveler_type = 'child')  AS pax_child,
                       (SELECT COUNT(*) FROM booking_travelers t WHERE t.booking_id = b.id AND t.traveler_type = 'infant') AS pax_infant
                FROM bookings b
                LEFT JOIN customers c ON c.id = b.customer_id
                WHERE $where ORDER BY b.trip_start DESC, b.id DESC";
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        $rows = array_map('cast_booking_row', $stmt->fetchAll());
        json_response(['success' => true, 'items' => $rows]);
    }

    if ($method === 'GET' && $id > 0) {
        // ----- DETAIL --------------------------------------------------------
        $b = fetch_booking_full($id);
        if (!$b) json_error('ไม่พบ booking', 404);
        json_response(['success' => true, 'booking' => $b]);
    }

    if ($method === 'POST') {
        // mark voucher as sent: POST /bookings.php?id=X&action=mark_voucher_sent
        if ($id > 0 && ($_GET['action'] ?? '') === 'mark_voucher_sent') {
            $stmt = db()->prepare('UPDATE bookings SET voucher_sent_at = NOW() WHERE id = :id');
            $stmt->execute([':id' => $id]);
            $stmt = db()->prepare('SELECT voucher_sent_at FROM bookings WHERE id = :id');
            $stmt->execute([':id' => $id]);
            json_response(['success' => true, 'voucher_sent_at' => $stmt->fetchColumn()]);
        }

        $body = read_json_body();
        $newId = save_booking($body, null, $me);
        $b = fetch_booking_full($newId);
        json_response(['success' => true, 'booking' => $b], 201);
    }

    if ($method === 'PUT') {
        if ($id <= 0) json_error('Missing id', 400);
        $body = read_json_body();
        save_booking($body, $id, $me);
        $b = fetch_booking_full($id);
        json_response(['success' => true, 'booking' => $b]);
    }

    if ($method === 'DELETE') {
        if ($id <= 0) json_error('Missing id', 400);
        $stmt = db()->prepare('DELETE FROM bookings WHERE id = :id');
        $stmt->execute([':id' => $id]);
        json_response(['success' => true]);
    }

    json_error('Method not allowed', 405);
} catch (BookingValidationException $e) {
    json_error($e->getMessage(), 400);
} catch (Throwable $e) {
    json_error('Server error: ' . $e->getMessage(), 500);
}


// ===========================================================================
// Helpers
// ===========================================================================

/**
 * ดึง events รายวันสำหรับ calendar — flatten จาก booking_hotels (multi-day),
 * booking_transfers, booking_boats, booking_tours
 */
function fetch_events(string $from, string $to): array
{
    $events = [];

    // ----- HOTELS: ทับช่วง [from, to] (multi-day → ขยายเป็นรายวัน) ---------
    $sql = "SELECT bh.id AS row_id, bh.booking_id, b.booking_code, b.customer_name,
                   bh.place_name, bh.room_type, bh.bed_type, bh.room_count,
                   bh.check_in, bh.check_out,
                   bh.due_payment, bh.status
            FROM booking_hotels bh
            JOIN bookings b ON b.id = bh.booking_id
            WHERE bh.check_in <= :to AND bh.check_out >= :from
            ORDER BY bh.check_in ASC";
    $stmt = db()->prepare($sql);
    $stmt->execute([':from' => $from, ':to' => $to]);
    foreach ($stmt->fetchAll() as $h) {
        // ขยายเป็นแต่ละคืน [check_in, check_out)
        $start = max($h['check_in'], $from);
        $end   = min($h['check_out'], date('Y-m-d', strtotime($to . ' +1 day')));
        for ($d = $start; $d < $end; $d = date('Y-m-d', strtotime($d . ' +1 day'))) {
            $events[] = [
                'date'         => $d,
                'type'         => 'hotel',
                'booking_id'   => (int)$h['booking_id'],
                'booking_code' => $h['booking_code'],
                'customer_name' => $h['customer_name'],
                'title'        => $h['place_name'] ?: 'HOTEL',
                'detail'       => [
                    'place_name' => $h['place_name'],
                    'room_type'  => $h['room_type'],
                    'bed_type'   => $h['bed_type'],
                    'room_count' => (int)$h['room_count'],
                    'check_in'   => $h['check_in'],
                    'check_out'  => $h['check_out'],
                    'due_payment' => $h['due_payment'],
                    'status'     => $h['status'],
                ],
            ];
        }
    }

    // ----- TRANSFERS -----------------------------------------------------
    $sql = "SELECT bt.id AS row_id, bt.booking_id, b.booking_code, b.customer_name,
                   bt.service_date, bt.service_type, bt.vehicle_count,
                   bt.from_text, bt.to_text, bt.pickup_time, bt.supplier_code,
                   bf.flight_no, bf.time AS flight_time
            FROM booking_transfers bt
            JOIN bookings b ON b.id = bt.booking_id
            LEFT JOIN booking_flights bf ON bf.booking_id = bt.booking_id
                                         AND bf.flight_date = bt.service_date
            WHERE bt.service_date BETWEEN :from AND :to
            ORDER BY bt.service_date ASC, bt.pickup_time ASC";
    $stmt = db()->prepare($sql);
    $stmt->execute([':from' => $from, ':to' => $to]);
    foreach ($stmt->fetchAll() as $t) {
        $events[] = [
            'date'         => $t['service_date'],
            'type'         => 'transfer',
            'booking_id'   => (int)$t['booking_id'],
            'booking_code' => $t['booking_code'],
            'customer_name' => $t['customer_name'],
            'title'        => strtoupper((string)$t['service_type']),
            'detail'       => [
                'service_type' => $t['service_type'],
                'from'         => $t['from_text'],
                'to'           => $t['to_text'],
                'pickup_time'  => $t['pickup_time'],
                'supplier'     => $t['supplier_code'],
                'vehicle_count' => (int)$t['vehicle_count'],
                'flight_no'    => $t['flight_no'],
                'flight_time'  => $t['flight_time'],
            ],
        ];
    }

    // ----- BOATS ---------------------------------------------------------
    $sql = "SELECT bb.id AS row_id, bb.booking_id, b.booking_code, b.customer_name,
                   bb.service_date, bb.service_type, bb.pax_text,
                   bb.from_text, bb.to_text, bb.boat_time, bb.supplier_code
            FROM booking_boats bb
            JOIN bookings b ON b.id = bb.booking_id
            WHERE bb.service_date BETWEEN :from AND :to
            ORDER BY bb.service_date ASC";
    $stmt = db()->prepare($sql);
    $stmt->execute([':from' => $from, ':to' => $to]);
    foreach ($stmt->fetchAll() as $r) {
        $events[] = [
            'date'         => $r['service_date'],
            'type'         => 'tour',                       // โชว์เป็นกลุ่มเดียวกับ tour (เขียว) ตาม mockup
            'subtype'      => 'boat',
            'booking_id'   => (int)$r['booking_id'],
            'booking_code' => $r['booking_code'],
            'customer_name' => $r['customer_name'],
            'title'        => strtoupper((string)$r['service_type']),
            'detail'       => [
                'service_type' => $r['service_type'],
                'from'         => $r['from_text'],
                'to'           => $r['to_text'],
                'boat_time'    => $r['boat_time'],
                'pax_text'     => $r['pax_text'],
                'supplier'     => $r['supplier_code'],
            ],
        ];
    }

    // ----- TOURS ---------------------------------------------------------
    $sql = "SELECT bo.id AS row_id, bo.booking_id, b.booking_code, b.customer_name,
                   bo.service_date, bo.tour_name, bo.pax_text,
                   bo.pickup_location, bo.pickup_time, bo.supplier_code, bo.tour_type
            FROM booking_tours bo
            JOIN bookings b ON b.id = bo.booking_id
            WHERE bo.service_date BETWEEN :from AND :to
            ORDER BY bo.service_date ASC, bo.pickup_time ASC";
    $stmt = db()->prepare($sql);
    $stmt->execute([':from' => $from, ':to' => $to]);
    foreach ($stmt->fetchAll() as $r) {
        $events[] = [
            'date'         => $r['service_date'],
            'type'         => 'tour',
            'booking_id'   => (int)$r['booking_id'],
            'booking_code' => $r['booking_code'],
            'customer_name' => $r['customer_name'],
            'title'        => strtoupper((string)$r['tour_name']),
            'detail'       => [
                'tour_name'      => $r['tour_name'],
                'pickup_location' => $r['pickup_location'],
                'pickup_time'    => $r['pickup_time'],
                'supplier'       => $r['supplier_code'],
                'pax_text'       => $r['pax_text'],
                'tour_type'      => $r['tour_type'],
            ],
        ];
    }

    // sort: date ASC → service (Hotel→Transfer→Boat→Tour) → time ASC
    $order = ['hotel' => 0, 'transfer' => 1, 'boat' => 2, 'tour' => 3];
    usort($events, function ($a, $b) use ($order) {
        $cmp = strcmp($a['date'], $b['date']);
        if ($cmp !== 0) return $cmp;
        $ka = ($a['subtype'] ?? '') === 'boat' ? 'boat' : $a['type'];
        $kb = ($b['subtype'] ?? '') === 'boat' ? 'boat' : $b['type'];
        $cmp = ($order[$ka] ?? 9) <=> ($order[$kb] ?? 9);
        if ($cmp !== 0) return $cmp;
        return strcmp(event_sort_time($a), event_sort_time($b));
    });

    return $events;
}

/** time string สำหรับ secondary sort ใน service เดียวกัน */
function event_sort_time(array $ev): string
{
    $d = $ev['detail'] ?? [];
    if ($ev['type'] === 'hotel')    return (string)($d['check_in']    ?? '');
    if ($ev['type'] === 'transfer') return (string)($d['pickup_time'] ?? '');
    if (($ev['subtype'] ?? '') === 'boat') return (string)($d['boat_time'] ?? '');
    return (string)($d['pickup_time'] ?? '');
}

function cast_booking_row(array $r): array
{
    foreach (['id', 'customer_id', 'recorded_by_id', 'pax_adult', 'pax_child', 'pax_infant'] as $k) {
        if (isset($r[$k])) $r[$k] = $r[$k] === null ? null : (int)$r[$k];
    }
    foreach (
        [
            'total_net',
            'total_sale',
            'total_hotel_net',
            'total_hotel_sale',
            'total_transfer_net',
            'total_transfer_sale',
            'total_boat_net',
            'total_boat_sale',
            'total_tour_net',
            'total_tour_sale'
        ] as $k
    ) {
        if (isset($r[$k])) $r[$k] = (float)$r[$k];
    }
    return $r;
}

function fetch_booking_full(int $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM bookings WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $b = $stmt->fetch();
    if (!$b) return null;
    $b = cast_booking_row($b);

    $b['travelers'] = fetch_children('booking_travelers', $id);
    $b['flights']   = fetch_children('booking_flights',   $id);
    $b['hotels']    = fetch_children('booking_hotels',    $id);
    $b['transfers'] = fetch_children('booking_transfers', $id);
    $b['boats']     = fetch_children('booking_boats',     $id);
    $b['tours']     = fetch_children('booking_tours',     $id);
    return $b;
}

function fetch_children(string $table, int $bookingId): array
{
    // booking_flights ไม่มี sort_order; sort by direction
    $orderBy = $table === 'booking_flights' ? 'direction ASC, id ASC' : 'sort_order ASC, id ASC';
    $stmt = db()->prepare("SELECT * FROM {$table} WHERE booking_id = :b ORDER BY {$orderBy}");
    $stmt->execute([':b' => $bookingId]);
    $rows = $stmt->fetchAll();
    return array_map(function ($r) {
        if (isset($r['id']))         $r['id'] = (int)$r['id'];
        if (isset($r['booking_id'])) $r['booking_id'] = (int)$r['booking_id'];
        if (isset($r['sort_order'])) $r['sort_order'] = (int)$r['sort_order'];
        foreach (
            [
                'net_amount',
                'sale_amount',
                'net_per_car',
                'sale_adult',
                'sale_child',
                'net_adult',
                'net_child'
            ] as $k
        ) {
            if (isset($r[$k])) $r[$k] = (float)$r[$k];
        }
        return $r;
    }, $rows);
}

/**
 * Save (insert/update) booking + ทุก sub-table ใน transaction เดียว
 * คืน booking id
 */
function save_booking(array $b, ?int $existingId, array $me): int
{
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $reference     = trim((string)($b['reference'] ?? ''));
        $customerId    = !empty($b['customer_id']) ? (int)$b['customer_id'] : null;
        $customerCode  = trim((string)($b['customer_code'] ?? ''));
        $customerName  = trim((string)($b['customer_name'] ?? ''));
        $remark        = trim((string)($b['remark'] ?? ''));
        $status        = (string)($b['status'] ?? 'pending');
        if (!in_array($status, ['pending', 'confirmed', 'cancelled'], true)) $status = 'pending';

        // sub-arrays (ทำให้เป็น array เสมอ)
        $travelers = array_values(is_array($b['travelers'] ?? null) ? $b['travelers'] : []);
        $flights   = array_values(is_array($b['flights']   ?? null) ? $b['flights']   : []);
        $hotels    = array_values(is_array($b['hotels']    ?? null) ? $b['hotels']    : []);
        $transfers = array_values(is_array($b['transfers'] ?? null) ? $b['transfers'] : []);
        $boats     = array_values(is_array($b['boats']     ?? null) ? $b['boats']     : []);
        $tours     = array_values(is_array($b['tours']     ?? null) ? $b['tours']     : []);

        if (!$hotels && !$transfers && !$boats && !$tours) {
            throw new BookingValidationException('ต้องมีอย่างน้อย 1 รายการใน ที่พัก / รับส่ง / เรือ / ทัวร์');
        }

        // ----- คำนวณ trip_start / trip_end จากทุก sub-table ------------------
        [$tripStart, $tripEnd] = compute_trip_range($flights, $hotels, $transfers, $boats, $tours);

        // ----- คำนวณ total_* cache ------------------------------------------
        $totals = compute_totals($hotels, $transfers, $boats, $tours);

        if ($existingId === null) {
            $code = next_booking_code($pdo);
            $stmt = $pdo->prepare(
                "INSERT INTO bookings
                  (booking_code, reference, customer_id, customer_code, customer_name,
                   recorded_by_id, recorded_by_name,
                   trip_start, trip_end, status, remark,
                   total_hotel_net, total_hotel_sale,
                   total_transfer_net, total_transfer_sale,
                   total_boat_net, total_boat_sale,
                   total_tour_net, total_tour_sale,
                   total_net, total_sale)
                 VALUES
                  (:code, :ref, :cid, :ccode, :cname,
                   :uid, :uname,
                   :ts, :te, :st, :rm,
                   :thn, :ths,
                   :ttn, :tts,
                   :tbn, :tbs,
                   :ton, :tos,
                   :tn, :tsale)"
            );
            $stmt->execute([
                ':code' => $code,
                ':ref'  => $reference !== '' ? $reference : null,
                ':cid'  => $customerId,
                ':ccode' => $customerCode !== '' ? $customerCode : null,
                ':cname' => $customerName !== '' ? $customerName : null,
                ':uid'  => (int)$me['id'],
                ':uname' => (string)($me['full_name'] ?? $me['username'] ?? ''),
                ':ts'   => $tripStart,
                ':te'   => $tripEnd,
                ':st'   => $status,
                ':rm'   => $remark !== '' ? $remark : null,
                ':thn'  => $totals['hotel_net'],
                ':ths' => $totals['hotel_sale'],
                ':ttn'  => $totals['transfer_net'],
                ':tts' => $totals['transfer_sale'],
                ':tbn'  => $totals['boat_net'],
                ':tbs' => $totals['boat_sale'],
                ':ton'  => $totals['tour_net'],
                ':tos' => $totals['tour_sale'],
                ':tn'   => $totals['net'],
                ':tsale' => $totals['sale'],
            ]);
            $bookingId = (int)$pdo->lastInsertId();
        } else {
            $bookingId = $existingId;
            $stmt = $pdo->prepare(
                "UPDATE bookings SET
                   reference = :ref,
                   customer_id = :cid, customer_code = :ccode, customer_name = :cname,
                   trip_start = :ts, trip_end = :te, status = :st, remark = :rm,
                   total_hotel_net = :thn, total_hotel_sale = :ths,
                   total_transfer_net = :ttn, total_transfer_sale = :tts,
                   total_boat_net = :tbn, total_boat_sale = :tbs,
                   total_tour_net = :ton, total_tour_sale = :tos,
                   total_net = :tn, total_sale = :tsale
                 WHERE id = :id"
            );
            $stmt->execute([
                ':ref' => $reference !== '' ? $reference : null,
                ':cid' => $customerId,
                ':ccode' => $customerCode !== '' ? $customerCode : null,
                ':cname' => $customerName !== '' ? $customerName : null,
                ':ts'  => $tripStart,
                ':te' => $tripEnd,
                ':st' => $status,
                ':rm'  => $remark !== '' ? $remark : null,
                ':thn' => $totals['hotel_net'],
                ':ths' => $totals['hotel_sale'],
                ':ttn' => $totals['transfer_net'],
                ':tts' => $totals['transfer_sale'],
                ':tbn' => $totals['boat_net'],
                ':tbs' => $totals['boat_sale'],
                ':ton' => $totals['tour_net'],
                ':tos' => $totals['tour_sale'],
                ':tn'  => $totals['net'],
                ':tsale' => $totals['sale'],
                ':id'  => $bookingId,
            ]);
            // ลบ sub ทั้งหมด (CASCADE จะทำตอนเรา DELETE FROM ... WHERE booking_id)
            foreach (
                [
                    'booking_travelers',
                    'booking_flights',
                    'booking_hotels',
                    'booking_transfers',
                    'booking_boats',
                    'booking_tours'
                ] as $t
            ) {
                $pdo->prepare("DELETE FROM {$t} WHERE booking_id = :b")->execute([':b' => $bookingId]);
            }
        }

        // ----- INSERT sub-tables ใหม่ทั้งหมด ---------------------------------
        insert_travelers($pdo, $bookingId, $travelers);
        insert_flights($pdo, $bookingId, $flights);
        insert_hotels($pdo, $bookingId, $hotels);
        insert_transfers($pdo, $bookingId, $transfers);
        insert_boats($pdo, $bookingId, $boats);
        insert_tours($pdo, $bookingId, $tours);

        $pdo->commit();
        return $bookingId;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function next_booking_code(PDO $pdo): string
{
    // Format: BK{YY}{MM}{NNN} — running resets every year, e.g. BK2605001
    $yy = date('y');
    $mm = date('m');
    $yearPrefix = 'BK' . $yy;
    $stmt = $pdo->prepare(
        "SELECT booking_code FROM bookings WHERE booking_code LIKE :p
         ORDER BY booking_code DESC LIMIT 1"
    );
    $stmt->execute([':p' => $yearPrefix . '%']);
    $last = $stmt->fetchColumn();
    $next = 1;
    if ($last) {
        $tail = (int)substr((string)$last, -3);
        $next = $tail + 1;
    }
    return $yearPrefix . $mm . str_pad((string)$next, 3, '0', STR_PAD_LEFT);
}

/** หา trip_start/trip_end จากทุก date ใน sub-tables — คืน [start, end] หรือ [null, null] */
function compute_trip_range(array $flights, array $hotels, array $transfers, array $boats, array $tours): array
{
    $dates = [];
    foreach ($flights as $r) {
        if (!empty($r['flight_date'])) $dates[] = $r['flight_date'];
    }
    foreach ($hotels as $r) {
        if (!empty($r['check_in']))  $dates[] = $r['check_in'];
        if (!empty($r['check_out'])) $dates[] = $r['check_out'];
    }
    foreach ([$transfers, $boats, $tours] as $group) {
        foreach ($group as $r) {
            if (!empty($r['service_date'])) $dates[] = $r['service_date'];
        }
    }
    if (!$dates) return [null, null];
    sort($dates);
    return [$dates[0], end($dates)];
}

function compute_totals(array $hotels, array $transfers, array $boats, array $tours): array
{
    $hn = 0.0;
    $hs = 0.0;
    foreach ($hotels as $r) {
        $hn += (float)($r['net_amount']  ?? 0);
        $hs += (float)($r['sale_amount'] ?? 0);
    }
    $tn = 0.0;
    $ts = 0.0;
    foreach ($transfers as $r) {
        $cars = (int)($r['vehicle_count'] ?? 1);
        $tn  += (float)($r['net_per_car'] ?? 0) * max(1, $cars);
        $ts  += (float)($r['sale_adult']  ?? 0) + (float)($r['sale_child'] ?? 0);
    }
    $bn = 0.0;
    $bs = 0.0;
    foreach ($boats as $r) {
        $bn += (float)($r['net_adult']  ?? 0) + (float)($r['net_child']  ?? 0);
        $bs += (float)($r['sale_adult'] ?? 0) + (float)($r['sale_child'] ?? 0);
    }
    $on = 0.0;
    $os = 0.0;
    foreach ($tours as $r) {
        $on += (float)($r['net_adult']  ?? 0) + (float)($r['net_child']  ?? 0);
        $os += (float)($r['sale_adult'] ?? 0) + (float)($r['sale_child'] ?? 0);
    }
    return [
        'hotel_net' => $hn,
        'hotel_sale' => $hs,
        'transfer_net' => $tn,
        'transfer_sale' => $ts,
        'boat_net' => $bn,
        'boat_sale' => $bs,
        'tour_net' => $on,
        'tour_sale' => $os,
        'net'  => $hn + $tn + $bn + $on,
        'sale' => $hs + $ts + $bs + $os,
    ];
}

function insert_travelers(PDO $pdo, int $bid, array $rows): void
{
    if (!$rows) return;
    $sql = "INSERT INTO booking_travelers
              (booking_id, sort_order, title, name, age, traveler_type,
               passport_no, passport_expiry)
            VALUES (:b, :so, :t, :n, :ag, :tt, :pn, :pe)";
    $stmt = $pdo->prepare($sql);
    foreach ($rows as $i => $r) {
        $age  = isset($r['age']) && $r['age'] !== '' ? (int)$r['age'] : null;
        $type = (string)($r['traveler_type'] ?? '');
        if (!in_array($type, ['adult', 'child', 'infant'], true)) $type = classify_age($age);
        $stmt->execute([
            ':b'  => $bid,
            ':so' => (int)($r['sort_order'] ?? $i),
            ':t'  => trim((string)($r['title'] ?? '')) ?: null,
            ':n'  => trim((string)($r['name'] ?? '')),
            ':ag' => $age,
            ':tt' => $type,
            ':pn' => trim((string)($r['passport_no'] ?? '')) ?: null,
            ':pe' => !empty($r['passport_expiry']) ? $r['passport_expiry'] : null,
        ]);
    }
}

function classify_age(?int $age): string
{
    if ($age === null) return 'adult';
    if ($age < 2)  return 'infant';
    if ($age < 12) return 'child';
    return 'adult';
}

function insert_flights(PDO $pdo, int $bid, array $rows): void
{
    if (!$rows) return;
    $sql = "INSERT INTO booking_flights
              (booking_id, direction, flight_date, flight_id, flight_no, route, time)
            VALUES (:b, :dir, :fd, :fid, :fn, :rt, :tm)";
    $stmt = $pdo->prepare($sql);
    foreach ($rows as $r) {
        $dir = (string)($r['direction'] ?? 'arrival');
        if (!in_array($dir, ['arrival', 'departure'], true)) $dir = 'arrival';
        $stmt->execute([
            ':b'   => $bid,
            ':dir' => $dir,
            ':fd'  => !empty($r['flight_date']) ? $r['flight_date'] : null,
            ':fid' => !empty($r['flight_id']) ? (int)$r['flight_id'] : null,
            ':fn'  => trim((string)($r['flight_no'] ?? '')) ?: null,
            ':rt'  => trim((string)($r['route'] ?? '')) ?: null,
            ':tm'  => !empty($r['time']) ? $r['time'] : null,
        ]);
    }
}

function insert_hotels(PDO $pdo, int $bid, array $rows): void
{
    if (!$rows) return;
    $sql = "INSERT INTO booking_hotels
              (booking_id, sort_order, place_id, place_name, check_in, check_out, night,
               room_type, bed_type, room_count, breakfast, managed_by,
               net_amount, sale_amount, due_payment, rsvn_no, status)
            VALUES (:b, :so, :pid, :pn, :ci, :co, :ng, :rt, :bt, :rc, :bf, :mb,
                    :na, :sa, :dp, :rn, :st)";
    $stmt = $pdo->prepare($sql);
    foreach ($rows as $i => $r) {
        $bf = (string)($r['breakfast'] ?? 'none');
        if (!in_array($bf, ['included', 'not_included', 'none'], true)) $bf = 'none';
        $mb = (string)($r['managed_by'] ?? 'Samui Look');
        if (!in_array($mb, ['BY AGENT', 'Samui Look'], true)) $mb = 'Samui Look';
        $st = (string)($r['status'] ?? 'pending');
        if (!in_array($st, ['pending', 'paid'], true)) $st = 'pending';

        $stmt->execute([
            ':b'  => $bid,
            ':so' => (int)($r['sort_order'] ?? $i),
            ':pid' => !empty($r['place_id']) ? (int)$r['place_id'] : null,
            ':pn' => trim((string)($r['place_name'] ?? '')) ?: null,
            ':ci' => !empty($r['check_in'])  ? $r['check_in']  : null,
            ':co' => !empty($r['check_out']) ? $r['check_out'] : null,
            ':ng' => (int)($r['night'] ?? 0),
            ':rt' => trim((string)($r['room_type'] ?? '')) ?: null,
            ':bt' => trim((string)($r['bed_type']  ?? '')) ?: null,
            ':rc' => (int)($r['room_count'] ?? 1),
            ':bf' => $bf,
            ':mb' => $mb,
            ':na' => (float)($r['net_amount']  ?? 0),
            ':sa' => (float)($r['sale_amount'] ?? 0),
            ':dp' => !empty($r['due_payment']) ? $r['due_payment'] : null,
            ':rn' => trim((string)($r['rsvn_no'] ?? '')) ?: null,
            ':st' => $st,
        ]);
    }
}

function insert_transfers(PDO $pdo, int $bid, array $rows): void
{
    if (!$rows) return;
    $sql = "INSERT INTO booking_transfers
              (booking_id, sort_order, service_date, service_type, vehicle_count,
               from_place_id, from_text, to_place_id, to_text, pickup_time,
               supplier_id, supplier_code,
               net_per_car, sale_adult, sale_child)
            VALUES (:b, :so, :sd, :st, :vc, :fpid, :ft, :tpid, :tt, :pt, :sid, :sc,
                    :npc, :sa, :sch)";
    $stmt = $pdo->prepare($sql);
    foreach ($rows as $i => $r) {
        $type = (string)($r['service_type'] ?? 'Transfer');
        if (!in_array($type, ['Meeting', 'Transfer', 'Sending'], true)) $type = 'Transfer';
        $stmt->execute([
            ':b'   => $bid,
            ':so' => (int)($r['sort_order'] ?? $i),
            ':sd'  => !empty($r['service_date']) ? $r['service_date'] : null,
            ':st'  => $type,
            ':vc'  => (int)($r['vehicle_count'] ?? 1),
            ':fpid' => !empty($r['from_place_id']) ? (int)$r['from_place_id'] : null,
            ':ft'  => trim((string)($r['from_text'] ?? '')) ?: null,
            ':tpid' => !empty($r['to_place_id']) ? (int)$r['to_place_id'] : null,
            ':tt'  => trim((string)($r['to_text'] ?? '')) ?: null,
            ':pt'  => !empty($r['pickup_time']) ? $r['pickup_time'] : null,
            ':sid' => !empty($r['supplier_id']) ? (int)$r['supplier_id'] : null,
            ':sc'  => trim((string)($r['supplier_code'] ?? '')) ?: null,
            ':npc' => (float)($r['net_per_car'] ?? 0),
            ':sa'  => (float)($r['sale_adult']  ?? 0),
            ':sch' => (float)($r['sale_child']  ?? 0),
        ]);
    }
}

function insert_boats(PDO $pdo, int $bid, array $rows): void
{
    if (!$rows) return;
    $sql = "INSERT INTO booking_boats
              (booking_id, sort_order, service_date, service_type, pax_text,
               from_place_id, from_text, to_place_id, to_text, boat_time,
               supplier_id, supplier_code,
               net_adult, net_child, sale_adult, sale_child)
            VALUES (:b, :so, :sd, :st, :px, :fpid, :ft, :tpid, :tt, :bt, :sid, :sc,
                    :na, :nc, :sa, :sch)";
    $stmt = $pdo->prepare($sql);
    foreach ($rows as $i => $r) {
        $stmt->execute([
            ':b'   => $bid,
            ':so' => (int)($r['sort_order'] ?? $i),
            ':sd'  => !empty($r['service_date']) ? $r['service_date'] : null,
            ':st'  => trim((string)($r['service_type'] ?? 'Boat Ticket')) ?: 'Boat Ticket',
            ':px'  => trim((string)($r['pax_text'] ?? '')) ?: null,
            ':fpid' => !empty($r['from_place_id']) ? (int)$r['from_place_id'] : null,
            ':ft'  => trim((string)($r['from_text'] ?? '')) ?: null,
            ':tpid' => !empty($r['to_place_id']) ? (int)$r['to_place_id'] : null,
            ':tt'  => trim((string)($r['to_text'] ?? '')) ?: null,
            ':bt'  => trim((string)($r['boat_time'] ?? '')) ?: null,
            ':sid' => !empty($r['supplier_id']) ? (int)$r['supplier_id'] : null,
            ':sc'  => trim((string)($r['supplier_code'] ?? '')) ?: null,
            ':na'  => (float)($r['net_adult']  ?? 0),
            ':nc'  => (float)($r['net_child']  ?? 0),
            ':sa'  => (float)($r['sale_adult'] ?? 0),
            ':sch' => (float)($r['sale_child'] ?? 0),
        ]);
    }
}

function insert_tours(PDO $pdo, int $bid, array $rows): void
{
    if (!$rows) return;
    $sql = "INSERT INTO booking_tours
              (booking_id, sort_order, service_date, tour_id, tour_name, pax_text,
               pickup_location, pickup_time,
               supplier_id, supplier_code, tour_type,
               net_adult, net_child, sale_adult, sale_child)
            VALUES (:b, :so, :sd, :tid, :tn, :px, :pl, :pt, :sid, :sc, :tt,
                    :na, :nc, :sa, :sch)";
    $stmt = $pdo->prepare($sql);
    foreach ($rows as $i => $r) {
        $tt = (string)($r['tour_type'] ?? 'option');
        if (!in_array($tt, ['included', 'option'], true)) $tt = 'option';
        $stmt->execute([
            ':b'   => $bid,
            ':so' => (int)($r['sort_order'] ?? $i),
            ':sd'  => !empty($r['service_date']) ? $r['service_date'] : null,
            ':tid' => !empty($r['tour_id']) ? (int)$r['tour_id'] : null,
            ':tn'  => trim((string)($r['tour_name'] ?? '')) ?: null,
            ':px'  => trim((string)($r['pax_text']  ?? '')) ?: null,
            ':pl'  => trim((string)($r['pickup_location'] ?? '')) ?: null,
            ':pt'  => !empty($r['pickup_time']) ? $r['pickup_time'] : null,
            ':sid' => !empty($r['supplier_id']) ? (int)$r['supplier_id'] : null,
            ':sc'  => trim((string)($r['supplier_code'] ?? '')) ?: null,
            ':tt'  => $tt,
            ':na'  => (float)($r['net_adult']  ?? 0),
            ':nc'  => (float)($r['net_child']  ?? 0),
            ':sa'  => (float)($r['sale_adult'] ?? 0),
            ':sch' => (float)($r['sale_child'] ?? 0),
        ]);
    }
}
