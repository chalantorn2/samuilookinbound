# SamuiLook Inbound

ระบบจัดการภายใน — React + Vite + Tailwind v4 (frontend) + PHP 8.3 (API) + MySQL

## โครงสร้าง

```
src/                 React app
  components/        Sidebar, Layout, ProtectedRoute, ...
  contexts/          AuthContext
  pages/             Login, Home, UsersManagement
  lib/api.js         fetch wrapper

api/                 PHP backend (deploy ไปที่ httpdocs/api/)
  db.php             ตั้งค่า DB + helper
  auth.php           login / logout / me
  users.php          CRUD users
  setup.php          สร้างตาราง + admin user (รันครั้งเดียวแล้วลบ)
  database.sql       schema
  .htaccess          กัน access ไฟล์ภายใน

public/.htaccess     SPA fallback (จะถูก copy ไป dist/)
```

## ขั้นตอน Deploy ไปยัง Plesk

### 1. ติดตั้ง dependencies + build

```bash
npm install
npm run build
```

ผลลัพธ์อยู่ที่โฟลเดอร์ `dist/`

### 2. อัพโหลดไฟล์ไปยัง Plesk

อัพโหลดไปยังโฟลเดอร์ `httpdocs/` ของโดเมน `inbound.samuilookbiz.com`:

| Source                      | Destination                       |
| --------------------------- | --------------------------------- |
| `dist/*` (ทุกไฟล์ในโฟลเดอร์) | `httpdocs/`                       |
| `api/` (ทั้งโฟลเดอร์)        | `httpdocs/api/`                   |

หลังจากอัพโหลด โครงสร้างใน Plesk ควรมีหน้าตาแบบนี้:

```
httpdocs/
  index.html
  .htaccess
  assets/
  logo.png
  ...
  api/
    db.php
    auth.php
    users.php
    setup.php
    .htaccess
```

### 3. รัน setup ครั้งเดียวเพื่อสร้างตาราง + admin user

เปิด browser ไปที่:

```
https://inbound.samuilookbiz.com/api/setup.php?key=samui-setup-2025
```

จะได้ผลลัพธ์:

```
[OK] users table ready
[OK] admin user created
       username: admin
       password: admin123
```

**สำคัญมาก** — หลังจากเห็นข้อความเสร็จสิ้นแล้ว ให้**ลบไฟล์ `api/setup.php` ออกจากเซิร์ฟเวอร์ทันที**

### 4. Login

```
https://inbound.samuilookbiz.com/login

username: admin
password: admin123
```

จากนั้นไปที่เมนู **USERS MANAGEMENT** เพื่อสร้างผู้ใช้คนอื่น และเปลี่ยนรหัสผ่าน admin

## การตั้งค่า DB

อยู่ที่ `api/db.php` (constants ด้านบนสุดของไฟล์):

```php
const DB_HOST = 'localhost';
const DB_PORT = 3306;
const DB_NAME = 'samui_inbound';
const DB_USER = 'samui_inbound';
const DB_PASS = 'S4ZJ@_tihyenzn89';
```

## เมนูที่พร้อมใช้งาน

| เมนู              | สถานะ        |
| ----------------- | ------------ |
| HOME              | ใช้งานได้    |
| BOOKING           | กำลังพัฒนา   |
| BOOKING LIST      | กำลังพัฒนา   |
| VOUCHER LIST      | กำลังพัฒนา   |
| INVOICE LIST      | กำลังพัฒนา   |
| PAYMENT LIST      | กำลังพัฒนา   |
| REPORT            | กำลังพัฒนา   |
| USERS MANAGEMENT  | ใช้งานได้ (admin) |

## Dev (เครื่อง local)

```bash
npm install
npm run dev
```

Frontend dev server จะวิ่งที่ `http://localhost:5173`

`vite.config.js` ตั้ง proxy ให้ forward `/api/*` ไปยัง `https://inbound.samuilookbiz.com` พร้อม rewrite cookie ให้ localhost เก็บ session ได้ — login บนเครื่อง dev ใช้บัญชีจริงบน production

> ระวัง: dev mode จะคุยกับ DB production จริง การกด "ลบ" / "เพิ่มผู้ใช้" บน localhost จะส่งผลต่อข้อมูลจริง
