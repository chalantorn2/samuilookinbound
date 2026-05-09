<?php
declare(strict_types=1);
require __DIR__ . '/db.php';

// ===========================================================================
// SamuiLook Inbound — One-shot setup script
//
//   เปิดใน browser ครั้งแรก:
//       /api/setup.php?key=samui-setup-2025
//
//   จะสร้าง:
//     - ทุกตารางใน database.sql (idempotent — รันซ้ำได้)
//     - admin user (username: admin, password: admin123) ถ้ายังไม่มี
//     - master data ตัวอย่าง (suppliers, routes, hotels, flights, tours)
//
//   *** หลังรันเสร็จ ต้องลบไฟล์นี้ออกจากเซิร์ฟเวอร์ทันที ***
// ===========================================================================

const SETUP_KEY = 'samui-setup-2025';

if (($_GET['key'] ?? '') !== SETUP_KEY) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo "[FORBIDDEN] missing or wrong key";
    exit;
}

header('Content-Type: text/plain; charset=utf-8');

$out = function (string $msg) {
    echo $msg . "\n";
    @ob_flush();
    @flush();
};

try {
    $pdo = db();

    // ---------- 1) Run schema -----------------------------------------------
    $sqlPath = __DIR__ . '/database.sql';
    if (!is_readable($sqlPath)) {
        throw new RuntimeException("ไม่พบไฟล์ database.sql");
    }
    $sql = file_get_contents($sqlPath);
    if ($sql === false || trim($sql) === '') {
        throw new RuntimeException("อ่าน database.sql ไม่สำเร็จ");
    }

    // แยก statement ตาม ; ที่อยู่นอก string literal (database.sql ของเราไม่มี ;
    // ใน string literal เลย จึง split ด้วย ; ตรงๆ ได้)
    $statements = array_filter(
        array_map('trim', preg_split('/;\s*[\r\n]+/', $sql)),
        fn($s) => $s !== '' && !str_starts_with($s, '--')
    );

    foreach ($statements as $stmt) {
        $pdo->exec($stmt);
    }
    $out("[OK] schema applied (" . count($statements) . " statements)");

    // ---- migrations (idempotent) ----
    migrate_travelers_name($pdo, $out);

    // ---------- 2) Admin user -----------------------------------------------
    $check = $pdo->prepare('SELECT COUNT(*) FROM users WHERE username = :u');
    $check->execute([':u' => 'admin']);
    if ((int)$check->fetchColumn() === 0) {
        $hash = password_hash('admin123', PASSWORD_DEFAULT);
        $ins = $pdo->prepare(
            'INSERT INTO users (username, password, full_name, role) VALUES (:u, :p, :f, :r)'
        );
        $ins->execute([
            ':u' => 'admin',
            ':p' => $hash,
            ':f' => 'Administrator',
            ':r' => 'admin',
        ]);
        $out("[OK] admin user created");
        $out("       username: admin");
        $out("       password: admin123");
    } else {
        $out("[skip] admin user already exists");
    }

    // ---------- 3) Seed master data -----------------------------------------
    $seeded = seed_master($pdo);
    foreach ($seeded as $line) $out($line);

    $out("");
    $out("เสร็จสิ้น — กรุณาลบไฟล์ api/setup.php ออกจากเซิร์ฟเวอร์");
} catch (Throwable $e) {
    http_response_code(500);
    $out("[ERROR] " . $e->getMessage());
}


/**
 * Migration: เปลี่ยน booking_travelers จาก first_name + last_name → name field เดียว
 * (idempotent — ถ้ามี name column แล้วก็ข้าม)
 */
function migrate_travelers_name(PDO $pdo, callable $out): void {
    $cols = $pdo->query("SHOW COLUMNS FROM booking_travelers")->fetchAll(PDO::FETCH_COLUMN);
    $hasName  = in_array('name', $cols, true);
    $hasFirst = in_array('first_name', $cols, true);
    $hasLast  = in_array('last_name',  $cols, true);

    if ($hasName && !$hasFirst && !$hasLast) {
        return;  // already migrated
    }

    if (!$hasName) {
        $pdo->exec("ALTER TABLE booking_travelers ADD COLUMN name VARCHAR(200) NOT NULL DEFAULT '' AFTER title");
        $out("[migrate] booking_travelers: added 'name'");
    }
    if ($hasFirst || $hasLast) {
        $pdo->exec("UPDATE booking_travelers
                    SET name = TRIM(CONCAT_WS(' / ', NULLIF(first_name,''), NULLIF(last_name,'')))
                    WHERE name = ''");
        if ($hasFirst) $pdo->exec("ALTER TABLE booking_travelers DROP COLUMN first_name");
        if ($hasLast)  $pdo->exec("ALTER TABLE booking_travelers DROP COLUMN last_name");
        $out("[migrate] booking_travelers: merged first_name + last_name → name");
    }
}

/**
 * Seed ข้อมูล master ตัวอย่าง โดยใช้ INSERT IGNORE เพื่อให้รันซ้ำได้
 * คืน array ของบรรทัด log
 */
function seed_master(PDO $pdo): array {
    $log = [];

    // -- suppliers --------------------------------------------------------
    $suppliers = [
        ['SUN',        'Sun Transfer',     'transfer'],
        ['LOM',        'Lomprayah',        'boat'],
        ['FUNNY',      'Funny Tour',       'tour'],
        ['MR UNG',     'Mr Ung Safari',    'tour'],
        ['BY AGENT',   'By Agent',         'agent'],
        ['Samui Look', 'Samui Look',       'agent'],
    ];
    $log[] = seed_table($pdo, 'suppliers',
        'INSERT IGNORE INTO suppliers (code, name, type) VALUES (:code, :name, :type)',
        $suppliers,
        fn($r) => [':code' => $r[0], ':name' => $r[1], ':type' => $r[2]]
    );

    // -- places (รวมโรงแรม / สนามบิน / ท่าเรือ / สถานที่) -----------------
    $places = [
        // โรงแรม
        ['CHAWENG NOI POOL VILLA',  'hotel',   'Chaweng Noi, Koh Samui'],
        ["Ban's Diving Resort",     'hotel',   'Koh Tao'],
        // สนามบิน
        ['SAMUI AIRPORT',           'airport', 'Bophut, Koh Samui'],
        // ท่าเรือ
        ['BANGRAK PIER',            'pier',    'Bophut, Koh Samui'],
        ['NATHON PIER',             'pier',    'Nathon, Koh Samui'],
        ['LIPA NOI PIER',           'pier',    'Lipa Noi, Koh Samui'],
        // สถานที่ท่องเที่ยว
        ['CHAWENG NOI',             'place',   null],
        ['LAMAI BEACH',             'place',   null],
        ['BOPHUT',                  'place',   null],
        ['KOH TAO',                 'place',   null],
        ['KOH PHANGAN',             'place',   null],
    ];
    $log[] = seed_table($pdo, 'places',
        'INSERT IGNORE INTO places (name, type, location) VALUES (:name, :type, :loc)',
        $places,
        fn($r) => [':name' => $r[0], ':type' => $r[1], ':loc' => $r[2]]
    );

    // -- flights ----------------------------------------------------------
    $flights = [
        ['SQ8340', 'SIN-USM', null,      '07:45:00', 'Singapore Airlines'],
        ['SQ8341', 'USM-SIN', '08:40:00', null,     'Singapore Airlines'],
    ];
    $log[] = seed_table($pdo, 'flights',
        'INSERT IGNORE INTO flights (flight_no, route, dep_time, arr_time, airline)
         VALUES (:fn, :rt, :dep, :arr, :al)',
        $flights,
        fn($r) => [
            ':fn' => $r[0], ':rt' => $r[1],
            ':dep' => $r[2], ':arr' => $r[3], ':al' => $r[4],
        ]
    );

    // -- tours ------------------------------------------------------------
    $tours = [
        ['Safari Tour',       'Jeep safari around Koh Samui'],
        ['Private City Tour', 'Private city tour with English-speaking guide'],
        ['Snorkeling Trip',   'Half-day snorkeling around nearby islands'],
    ];
    $log[] = seed_table($pdo, 'tours',
        'INSERT IGNORE INTO tours (name, description) VALUES (:name, :desc)',
        $tours,
        fn($r) => [':name' => $r[0], ':desc' => $r[1]]
    );

    // -- customers (ตัวอย่าง 1 รายการตาม mockup) -------------------------
    $customers = [
        ['HAJIME', 'HAJIME WATANABE'],
    ];
    $log[] = seed_table($pdo, 'customers',
        'INSERT IGNORE INTO customers (code, name) VALUES (:code, :name)',
        $customers,
        fn($r) => [':code' => $r[0], ':name' => $r[1]]
    );

    return $log;
}

function seed_table(PDO $pdo, string $name, string $sql, array $rows, callable $bind): string {
    $stmt = $pdo->prepare($sql);
    $inserted = 0;
    foreach ($rows as $r) {
        $stmt->execute($bind($r));
        if ($stmt->rowCount() > 0) $inserted++;
    }
    return "[OK] {$name}: inserted {$inserted}, skipped " . (count($rows) - $inserted);
}
