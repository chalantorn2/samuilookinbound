// Helper utilities + constants ที่ใช้ร่วมกันในหน้า Booking

export const TRANSFER_SERVICES = ["Meeting", "Transfer", "Sending"];
export const HOTEL_BREAKFAST = [
  { value: "none", label: "-" },
  { value: "included", label: "Included" },
  { value: "not_included", label: "Not Included" },
];
export const HOTEL_MANAGED_BY = [
  { value: "Samui Look", label: "Samui Look" },
  { value: "BY AGENT", label: "BY AGENT" },
];
export const TOUR_TYPES = [
  { value: "option", label: "Option" },
  { value: "included", label: "Included" },
];
export const BOOKING_STATUS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

/** สำหรับ display ในปุ่ม +Add */
export function emptyTraveler() {
  return {
    title: "",
    name: "",
    traveler_type: "adult",
    passport_no: "",
    passport_expiry: "",
  };
}

export function emptyFlight(direction = "arrival") {
  return {
    direction,
    flight_date: "",
    flight_id: null,
    flight_no: "",
    route: "",
    time: "",
  };
}

export function emptyHotel() {
  return {
    place_id: null,
    place_name: "",
    check_in: "",
    check_out: "",
    night: "",
    room_type: "",
    bed_type: "",
    room_count: 1,
    breakfast: "none",
    managed_by: "Samui Look",
    net_amount: "",
    sale_amount: "",
  };
}

export function emptyTransfer() {
  return {
    service_date: "",
    service_type: "Transfer",
    vehicle_count: 1,
    from_place_id: null,
    from_text: "",
    to_place_id: null,
    to_text: "",
    pickup_time: "",
    supplier_id: null,
    supplier_code: "",
    net_per_car: "",
    sale_adult: "",
    sale_child: "",
  };
}

export function emptyBoat() {
  return {
    service_date: "",
    service_type: "Boat Ticket",
    pax_text: "",
    from_place_id: null,
    from_text: "",
    to_place_id: null,
    to_text: "",
    boat_time: "",
    supplier_id: null,
    supplier_code: "",
    net_adult: "",
    net_child: "",
    sale_adult: "",
    sale_child: "",
  };
}

export function emptyTour() {
  return {
    service_date: "",
    tour_id: null,
    tour_name: "",
    pax_text: "",
    pickup_location: "",
    pickup_time: "",
    supplier_id: null,
    supplier_code: "",
    tour_type: "option",
    net_adult: "",
    net_child: "",
    sale_adult: "",
    sale_child: "",
  };
}

export function emptyBookingForm() {
  return {
    reference: "",
    customer_id: null,
    customer_code: "",
    customer_name: "",
    remark: "",
    status: "pending",
    travelers: [],
    flights: [],
    hotels: [],
    transfers: [],
    boats: [],
    tours: [],
  };
}

/** sum ของยอดในแต่ละกลุ่ม + รวม */
export function computeTotals(form) {
  const hotelNet = form.hotels.reduce(
    (s, r) => s + (Number(r.net_amount) || 0),
    0,
  );
  const hotelSale = form.hotels.reduce(
    (s, r) => s + (Number(r.sale_amount) || 0),
    0,
  );
  const trNet = form.transfers.reduce(
    (s, r) =>
      s +
      (Number(r.net_per_car) || 0) * Math.max(1, Number(r.vehicle_count) || 1),
    0,
  );
  const trSale = form.transfers.reduce(
    (s, r) => s + (Number(r.sale_adult) || 0) + (Number(r.sale_child) || 0),
    0,
  );
  const boNet = form.boats.reduce(
    (s, r) => s + (Number(r.net_adult) || 0) + (Number(r.net_child) || 0),
    0,
  );
  const boSale = form.boats.reduce(
    (s, r) => s + (Number(r.sale_adult) || 0) + (Number(r.sale_child) || 0),
    0,
  );
  const toNet = form.tours.reduce(
    (s, r) => s + (Number(r.net_adult) || 0) + (Number(r.net_child) || 0),
    0,
  );
  const toSale = form.tours.reduce(
    (s, r) => s + (Number(r.sale_adult) || 0) + (Number(r.sale_child) || 0),
    0,
  );
  return {
    hotelNet,
    hotelSale,
    trNet,
    trSale,
    boNet,
    boSale,
    toNet,
    toSale,
    grandNet: hotelNet + trNet + boNet + toNet,
    grandSale: hotelSale + trSale + boSale + toSale,
  };
}

/** ตัด row ว่าง (ไม่ได้กรอกข้อมูลสำคัญ) ออก + แปลง date fields เป็น ISO ก่อนส่ง backend */
export function stripEmptyRows(form) {
  return {
    ...form,
    travelers: form.travelers.filter(
      (r) =>
        (r.name || "").trim() !== "" ||
        (r.passport_no || "").trim() !== "" ||
        (r.title || "").trim() !== "",
    ),
    flights: form.flights
      .filter(
        (r) =>
          (r.flight_no || "").trim() !== "" ||
          (r.flight_date || "").trim() !== "",
      )
      .map((r) => ({ ...r, flight_date: toISO(r.flight_date) })),
    hotels: form.hotels
      .filter(
        (r) =>
          (r.place_name || "").trim() !== "" ||
          (r.check_in || "").trim() !== "" ||
          (r.check_out || "").trim() !== "",
      )
      .map((r) => ({
        ...r,
        check_in: toISO(r.check_in),
        check_out: toISO(r.check_out),
      })),
    transfers: form.transfers
      .filter(
        (r) =>
          (r.service_date || "").trim() !== "" ||
          (r.from_text || "").trim() !== "" ||
          (r.to_text || "").trim() !== "" ||
          (r.supplier_code || "").trim() !== "",
      )
      .map((r) => ({ ...r, service_date: toISO(r.service_date) })),
    boats: form.boats
      .filter(
        (r) =>
          (r.service_date || "").trim() !== "" ||
          (r.from_text || "").trim() !== "" ||
          (r.to_text || "").trim() !== "" ||
          (r.supplier_code || "").trim() !== "",
      )
      .map((r) => ({ ...r, service_date: toISO(r.service_date) })),
    tours: form.tours
      .filter(
        (r) =>
          (r.service_date || "").trim() !== "" ||
          (r.tour_name || "").trim() !== "" ||
          (r.pickup_location || "").trim() !== "" ||
          (r.supplier_code || "").trim() !== "",
      )
      .map((r) => ({ ...r, service_date: toISO(r.service_date) })),
  };
}

/** "09MAY26" → "2026-05-09" สำหรับส่งให้ MySQL DATE column. คืน "" ถ้า parse ไม่ได้ */
export function toISO(s) {
  const d = parseShortDate(s);
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MONTHS = { JAN:0, FEB:1, MAR:2, APR:3, MAY:4, JUN:5, JUL:6, AUG:7, SEP:8, OCT:9, NOV:10, DEC:11 };

/** parse "16MAY26" → Date object (or null if invalid) */
export function parseShortDate(s) {
  if (!s || typeof s !== "string") return null;
  const m = /^(\d{2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})$/.exec(s.toUpperCase());
  if (!m) return null;
  const d = parseInt(m[1], 10);
  const mo = MONTHS[m[2]];
  const y = 2000 + parseInt(m[3], 10);
  const date = new Date(y, mo, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** จำนวนคืนระหว่าง check_in และ check_out (รูปแบบ "16MAY26"); คืน null ถ้า parse ไม่ได้หรือ <= 0 */
export function nightsBetween(checkIn, checkOut) {
  const ci = parseShortDate(checkIn);
  const co = parseShortDate(checkOut);
  if (!ci || !co) return null;
  const diff = Math.round((co - ci) / 86400000);
  return diff > 0 ? diff : null;
}

export function formatNumber(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "-";
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
