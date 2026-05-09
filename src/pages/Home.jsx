import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import Calendar from "../components/Calendar.jsx";
import EventDetailPanel from "../components/EventDetailPanel.jsx";
import Booking from "./Booking.jsx";
import { api } from "../lib/api";

export default function Home() {
  const [month, setMonth] = useState(() => firstOfMonth(new Date()));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedDay, setSelectedDay] = useState(() => iso(new Date())); // ISO date — default = today
  const [editingId, setEditingId] = useState(null);

  // ขอบเขตเดือนสำหรับ fetch (ครอบ leading/trailing days ของ grid 6 weeks)
  const range = useMemo(() => {
    const first = firstOfMonth(month);
    const dow = first.getDay();
    const from = new Date(first);
    from.setDate(first.getDate() - dow);
    const to = new Date(from);
    to.setDate(from.getDate() + 41);
    return { from: iso(from), to: iso(to) };
  }, [month]);

  useEffect(() => {
    let cancelled = false;
    api.get(`/bookings.php?view=events&from=${range.from}&to=${range.to}`).then(
      (res) => {
        if (cancelled) return;
        setEvents(res.events || []);
        setError("");
        setLoading(false);
      },
      (err) => {
        if (cancelled) return;
        setError(err.message || "โหลดข้อมูลไม่สำเร็จ");
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to, reloadKey]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return events.filter((ev) => ev.date === selectedDay);
  }, [events, selectedDay]);

  const openEdit = (ev) => {
    if (ev?.booking_id) setEditingId(ev.booking_id);
  };

  return (
    <div className="h-screen flex flex-col">
      <PageHeader
        title="HOME"
        subtitle="ภาพรวมการจองทั้งหมดในเดือนนี้"
        // action={<TodayLabel />}
      />

      <div className="flex-1 min-h-0 p-4 flex flex-col">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm font-light mb-3">
            {error}
          </div>
        )}

        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
          <div className="min-w-0 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 max-h-[720px]">
              <Calendar
                month={month}
                events={events}
                onMonthChange={setMonth}
                onSelectDay={(iso) => setSelectedDay(iso)}
                selectedDate={selectedDay}
              />
            </div>
            {loading && (
              <div className="mt-2 text-xs font-light text-slate-400">
                กำลังโหลด events...
              </div>
            )}
          </div>

          <aside className="min-w-0 min-h-0 overflow-auto">
            <EventDetailPanel
              dayDate={selectedDay}
              dayEvents={selectedDayEvents}
              onCloseDay={() => setSelectedDay(null)}
              onPickEvent={openEdit}
            />
          </aside>
        </div>
      </div>

      {editingId && (
        <BookingEditModal
          bookingId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={() => setReloadKey((k) => k + 1)}
        />
      )}
    </div>
  );
}

function BookingEditModal({ bookingId, onClose, onSaved }) {
  // ป้องกัน background scroll ตอน modal เปิด
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-50 w-[95vw] rounded shadow-xl my-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Booking bookingId={bookingId} onClose={onClose} onSaved={onSaved} />
      </div>
    </div>
  );
}

function TodayLabel() {
  const today = new Date();
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const text = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
  return <div className="text-sm font-light text-slate-600">{text}</div>;
}

function firstOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function iso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
