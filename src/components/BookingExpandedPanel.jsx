/**
 * Panel ที่ขยายใต้ row ของ Booking List
 *
 * แสดง:
 *  - Transfer (timeline ซ้าย) — list ของ booking_transfers + จับคู่ flight ที่ตรงวัน
 *  - Hotel (cards ขวาบน) — checkbox + ชื่อ + IN/OUT + RSVN NO + DUE DATE
 *  - Tour/Boat (table ขวาล่าง) — checkbox + Date + Description + Time + Supp
 *  - Remark + ปุ่ม + Issued Voucher (ยังไม่ทำ logic)
 *
 * Checkbox state เก็บใน parent (BookingList) — local เท่านั้น ยังไม่ persist
 */
export default function BookingExpandedPanel({
  detail,
  loading,
  selection,
  onToggleSelect,
}) {
  if (loading || !detail) {
    return (
      <div className="px-6 py-6 text-center text-sm font-light text-slate-400">
        กำลังโหลดรายละเอียด...
      </div>
    );
  }

  const transfers = detail.transfers || [];
  const hotels = detail.hotels || [];
  const tours = detail.tours || [];
  const boats = detail.boats || [];
  const flights = detail.flights || [];

  return (
    <div className="bg-slate-50 border-t border-slate-200 py-4">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-3">
          <TransferTimeline transfers={transfers} flights={flights} />

          <div className="space-y-3 min-w-0">
            <HotelSection
              hotels={hotels}
              selected={selection?.hotels}
              onToggle={(id) => onToggleSelect("hotels", id)}
            />
            <TourSection
              tours={tours}
              boats={boats}
              selectedTours={selection?.tours}
              selectedBoats={selection?.boats}
              onToggleTour={(id) => onToggleSelect("tours", id)}
              onToggleBoat={(id) => onToggleSelect("boats", id)}
            />
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 bg-white border border-slate-200 rounded px-3 py-2">
          <span className="text-xs font-medium text-slate-600 shrink-0 pt-0.5">
            Remark :
          </span>
          <span className="text-sm font-light text-slate-700 whitespace-pre-wrap break-words">
            {detail.remark || ""}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Transfer ---------- */

function TransferTimeline({ transfers, flights }) {
  const flightByDate = {};
  for (const f of flights) {
    if (f.flight_date) flightByDate[f.flight_date] = f;
  }

  return (
    <div className="bg-white border border-slate-200 rounded">
      <div className="px-3 py-2 border-b border-slate-200">
        <span className="text-sm font-bold text-blue-600 uppercase tracking-wide">
          Transfer
        </span>
      </div>
      <div className="p-3">
        {transfers.length === 0 ? (
          <div className="text-xs font-light text-slate-400 py-4 text-center">
            ไม่มีรายการ transfer
          </div>
        ) : (
          <ol className="relative border-l-2 border-blue-300 ml-2 space-y-4">
            {transfers.map((t) => {
              const f = flightByDate[t.service_date];
              return (
                <li key={t.id} className="pl-4 relative">
                  <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow" />
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-slate-800">
                      {formatDate(t.service_date)}
                    </span>
                    <span className="text-sm font-medium text-slate-500">
                      ({(t.service_type || "").toUpperCase()})
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-700 mt-0.5 uppercase">
                    {t.from_text || "-"} - {t.to_text || "-"}
                  </div>
                  {f && (
                    <div className="text-sm font-light text-slate-600 mt-0.5 flex gap-3">
                      <span>
                        <b className="font-bold text-slate-700">
                          {t.service_type === "Sending" ? "DEP" : "ARR"}
                        </b>{" "}
                        : {(f.time || "").slice(0, 5) || "-"}
                      </span>
                      <span>
                        <b className="font-bold text-slate-700">FLT</b> :{" "}
                        {f.flight_no || "-"}
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

/* ---------- Hotel ---------- */

function HotelSection({ hotels, selected, onToggle }) {
  return (
    <div className="bg-white border border-slate-200 rounded">
      <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
        <span className="text-sm font-bold text-amber-600 uppercase tracking-wide">
          Hotel
        </span>
        <button
          type="button"
          className="bg-brand-700 hover:bg-brand-800 text-white text-xs font-medium px-3 py-2 rounded transition"
        >
          + Issued Voucher
        </button>
      </div>
      <div className="p-3">
        {hotels.length === 0 ? (
          <div className="text-xs font-light text-slate-400 py-4 text-center">
            ไม่มีรายการ hotel
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hotels.map((h) => (
              <HotelCard
                key={h.id}
                hotel={h}
                checked={selected?.has(h.id) || false}
                onToggle={() => onToggle(h.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HotelCard({ hotel, checked, onToggle }) {
  return (
    <div className="border border-slate-200 rounded p-3 space-y-2">
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="mt-1 w-4 h-4 accent-brand-700 cursor-pointer"
        />
        <div className="flex-1 min-w-0 flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-bold text-slate-800 uppercase">
            {hotel.place_name || "-"}
          </span>
          <span className="text-sm font-medium text-slate-500">
            ({hotel.managed_by === "BY AGENT" ? "AGT" : "SLC"})
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm font-medium text-slate-700 pl-6">
        <span>
          <b className="font-bold">IN</b> {formatDate(hotel.check_in)}
        </span>
        <span>
          <b className="font-bold">OUT</b> {formatDate(hotel.check_out)}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 pl-6">
        <LabeledInput label="RSVN NO." value={hotel.rsvn_no || ""} />
        <LabeledInput label="DUE DATE" value={formatDate(hotel.due_payment)} />
      </div>
    </div>
  );
}

function LabeledInput({ label, value = "" }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold text-slate-700 w-20 shrink-0">
        {label}
      </span>
      <input
        type="text"
        defaultValue={value}
        className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm font-light focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
      />
    </div>
  );
}

/* ---------- Tour + Boat ---------- */

function TourSection({
  tours,
  boats,
  selectedTours,
  selectedBoats,
  onToggleTour,
  onToggleBoat,
}) {
  // รวม tours + boats เรียงตาม service_date
  const rows = [
    ...boats.map((b) => ({
      kind: "boat",
      id: b.id,
      date: b.service_date,
      desc: b.service_type || "Boat Ticket",
      detail: `${b.from_text || "-"} - ${b.to_text || "-"}`,
      time: (b.boat_time || "").slice(0, 5),
      supp: b.supplier_code || "-",
    })),
    ...tours.map((t) => ({
      kind: "tour",
      id: t.id,
      date: t.service_date,
      desc: t.tour_name || "-",
      detail: "",
      time: (t.pickup_time || "").slice(0, 5),
      supp: t.supplier_code || "-",
    })),
  ].sort((a, b) => String(a.date).localeCompare(String(b.date)));

  return (
    <div className="bg-white border border-slate-200 rounded">
      <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
        <span className="text-sm font-bold text-emerald-600 uppercase tracking-wide">
          Tour
        </span>
        <button
          type="button"
          className="bg-brand-700 hover:bg-brand-800 text-white text-xs font-medium px-3 py-2 rounded transition"
        >
          + Issued Voucher
        </button>
      </div>
      <div className="p-3">
        {rows.length === 0 ? (
          <div className="text-xs font-light text-slate-400 py-4 text-center">
            ไม่มีรายการ tour / boat
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-slate-600 border-b border-slate-100">
              <tr className="text-left">
                <th className="w-8 py-1"></th>
                <th className="py-1 font-medium">Date</th>
                <th className="py-1 font-medium">Description</th>
                <th className="py-1 font-medium">Time</th>
                <th className="py-1 font-medium">Sup</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const checked =
                  r.kind === "tour"
                    ? selectedTours?.has(r.id) || false
                    : selectedBoats?.has(r.id) || false;
                const onToggle = () =>
                  r.kind === "tour" ? onToggleTour(r.id) : onToggleBoat(r.id);
                return (
                  <tr
                    key={`${r.kind}-${r.id}`}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="py-1.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={onToggle}
                        className="w-4 h-4 accent-brand-700 cursor-pointer"
                      />
                    </td>
                    <td className="py-1.5 font-medium text-slate-700 whitespace-nowrap">
                      {formatDate(r.date)}
                    </td>
                    <td className="py-1.5 font-light text-slate-700 uppercase">
                      {r.desc}
                      {r.detail && (
                        <span className="text-slate-500">
                          {" "}
                          &nbsp;{r.detail}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 font-light text-slate-700 whitespace-nowrap">
                      {r.time || "-"}
                    </td>
                    <td className="py-1.5 font-light text-slate-700">
                      {r.supp}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

const MONTH_SHORT = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

function formatDate(s) {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const day = String(d.getDate()).padStart(2, "0");
  const mon = MONTH_SHORT[d.getMonth()];
  const yr = String(d.getFullYear()).slice(-2);
  return `${day}${mon}${yr}`;
}
