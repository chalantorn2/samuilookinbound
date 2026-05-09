import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PageHeader from "../components/PageHeader.jsx";
import Autocomplete from "../components/Autocomplete.jsx";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext.jsx";

import SectionCard from "../components/booking/SectionCard.jsx";
import TravelersTable from "../components/booking/TravelersTable.jsx";
import FlightSection from "../components/booking/FlightSection.jsx";
import HotelsTable from "../components/booking/HotelsTable.jsx";
import TransfersTable from "../components/booking/TransfersTable.jsx";
import BoatsTable from "../components/booking/BoatsTable.jsx";
import ToursTable from "../components/booking/ToursTable.jsx";

import {
  emptyBookingForm,
  emptyBoat,
  computeTotals,
  formatNumber,
  stripEmptyRows,
  bookingToForm,
} from "../components/booking/helpers";

export default function Booking({
  bookingId = null,
  onClose,
  onSaved,
  onDeleted,
} = {}) {
  const isEdit = !!bookingId;
  const isModal = !!onClose;

  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyBookingForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    api.get(`/bookings.php?id=${bookingId}`).then(
      (res) => {
        if (cancelled) return;
        setForm(bookingToForm(res.booking));
        setLoading(false);
      },
      (err) => {
        if (cancelled) return;
        toast.error("โหลด booking ไม่สำเร็จ", {
          description: err.message || undefined,
        });
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [bookingId, isEdit]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setSection = (key) => (rows) => set({ [key]: rows });

  const totals = computeTotals(form);

  const submit = async (e) => {
    e.preventDefault();

    const payload = stripEmptyRows(form);
    const hasService =
      payload.hotels.length > 0 ||
      payload.transfers.length > 0 ||
      payload.boats.length > 0 ||
      payload.tours.length > 0;

    if (!hasService) {
      toast.error("ต้องมีอย่างน้อย 1 รายการใน ที่พัก / รับส่ง / เรือ / ทัวร์", {
        description: "ใช้วันที่อ้างอิงสำหรับแสดงในหน้า Home",
      });
      return;
    }

    setSaving(true);
    try {
      const res = isEdit
        ? await api.put(`/bookings.php?id=${bookingId}`, payload)
        : await api.post("/bookings.php", payload);
      const code = res?.booking?.booking_code || "";
      toast.success(isEdit ? "บันทึกการแก้ไขสำเร็จ" : "บันทึก Booking สำเร็จ", {
        description: code ? `Booking Code: ${code}` : undefined,
      });
      if (isEdit) {
        onSaved?.(res?.booking);
        onClose?.();
      } else {
        setForm(emptyBookingForm());
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      toast.error("บันทึกไม่สำเร็จ", {
        description: err.message || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const addBoatRow = () => set({ boats: [...form.boats, emptyBoat()] });

  const handleDelete = async () => {
    if (!isEdit || deleting || saving) return;
    const code = form.booking_code || `#${bookingId}`;
    const typed = window.prompt(
      `ลบ Booking ${code} ถาวร — พิมพ์ ${code} เพื่อยืนยัน:`,
    );
    if (typed === null) return;
    if (typed.trim() !== code) {
      toast.error("ยกเลิกการลบ", { description: "ข้อความยืนยันไม่ตรง" });
      return;
    }
    setDeleting(true);
    try {
      await api.del(`/bookings.php?id=${bookingId}`);
      toast.success("ลบ Booking สำเร็จ", { description: code });
      onDeleted?.(bookingId);
      onClose?.();
    } catch (err) {
      toast.error("ลบไม่สำเร็จ", { description: err.message || undefined });
    } finally {
      setDeleting(false);
    }
  };

  const headerTitle = isEdit
    ? `EDIT BOOKING${form.booking_code ? ` — ${form.booking_code}` : ""}`
    : "BOOKING";
  const headerSubtitle = isEdit ? "แก้ไขการจอง" : "หน้าบันทึกการจอง";

  const submitLabel = saving
    ? "กำลังบันทึก..."
    : isEdit
      ? "บันทึกการแก้ไข"
      : "บันทึก Booking";

  const headerAction = isModal ? (
    <button
      type="button"
      onClick={onClose}
      className="text-slate-400 hover:text-slate-700 text-2xl leading-none px-2"
      aria-label="ปิด"
    >
      ×
    </button>
  ) : (
    <button
      type="button"
      onClick={() => navigate("/booking-list")}
      className="text-sm font-normal text-slate-500 hover:text-slate-700"
    >
      → Booking List
    </button>
  );

  if (isEdit && loading) {
    return (
      <div className="p-8 text-center text-sm font-light text-slate-500">
        กำลังโหลด booking...
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        action={headerAction}
      />

      <form onSubmit={submit} className="p-6 space-y-4">
        {/* ----- 1) ข้อมูลลูกค้า ----- */}
        <SectionCard title="ข้อมูลลูกค้า">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_10fr_4fr_4fr] gap-3">
            <Field label="Customer Code">
              <Autocomplete
                endpoint="/customers.php"
                value={form.customer_code || ""}
                displayKey="code"
                onChange={(v) => set({ customer_code: v })}
                onSelect={(it) =>
                  set({
                    customer_id: it.id,
                    customer_code: it.code,
                    customer_name: it.name,
                  })
                }
                inputClassName={inputCls}
              />
            </Field>
            <Field
              label="Customer Name"
              required
              hint={
                <button
                  type="button"
                  onClick={() => set({ customer_id: null })}
                  className="text-xs font-medium text-brand-600 hover:text-brand-800 underline-offset-2 hover:underline"
                  title="เลิก link กับ master, พิมพ์ชื่อเอง"
                >
                  กรอกข้อมูลเอง
                </button>
              }
            >
              <Autocomplete
                endpoint="/customers.php"
                value={form.customer_name || ""}
                displayKey="name"
                onChange={(v) => set({ customer_name: v })}
                onSelect={(it) =>
                  set({
                    customer_id: it.id,
                    customer_code: it.code,
                    customer_name: it.name,
                  })
                }
                required
                inputClassName={inputCls}
              />
            </Field>
            <Field label="Reference">
              <input
                type="text"
                value={form.reference || ""}
                onChange={(e) => set({ reference: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="ชื่อผู้บันทึก" required>
              <input
                type="text"
                value={user?.full_name || user?.username || ""}
                disabled
                className={inputCls + " bg-slate-100 text-slate-500"}
              />
            </Field>
          </div>
        </SectionCard>

        {/* ----- 2) Travelers + Flight (แถวเดียวกัน) ----- */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
          <SectionCard title="ผู้เดินทาง (Travelers)">
            <TravelersTable
              rows={form.travelers}
              onChange={setSection("travelers")}
            />
          </SectionCard>

          <SectionCard title="Flight Details (For Reference)">
            <FlightSection
              rows={form.flights}
              onChange={setSection("flights")}
            />
          </SectionCard>
        </div>

        {/* ----- 3) Hotels ----- */}
        <SectionCard title="รายละเอียดที่พัก (Hotel Details)">
          <HotelsTable rows={form.hotels} onChange={setSection("hotels")} />
        </SectionCard>

        {/* ----- 4) Transfer & Boat (รวม section) ----- */}
        <SectionCard title="ตารางบริการรับส่งและเรือ (Transfer & Boat)">
          <TransfersTable
            rows={form.transfers}
            onChange={setSection("transfers")}
            onAddBoat={addBoatRow}
          />
          <div className="my-4 border-t border-slate-100" />
          <BoatsTable rows={form.boats} onChange={setSection("boats")} />
        </SectionCard>

        {/* ----- 5) Tours ----- */}
        <SectionCard title="รายการทัวร์เสริม (Optional Tour)">
          <ToursTable rows={form.tours} onChange={setSection("tours")} />
        </SectionCard>

        {/* ----- 6) Remark ----- */}
        <SectionCard title="Remark">
          <textarea
            value={form.remark || ""}
            onChange={(e) => set({ remark: e.target.value })}
            rows={3}
            className={inputCls}
          />
        </SectionCard>

        {/* ----- Summary + Submit ----- */}
        <div className="bg-white border border-slate-200 rounded p-4 sticky bottom-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {isEdit && isModal && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="text-sm font-medium px-4 py-2 rounded border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition disabled:opacity-60"
              >
                {deleting ? "กำลังลบ..." : "ลบ Booking"}
              </button>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-sm font-normal">
              <SummaryItem
                label="Hotels"
                net={totals.hotelNet}
                sale={totals.hotelSale}
              />
              <SummaryItem
                label="Transfers"
                net={totals.trNet}
                sale={totals.trSale}
              />
              <SummaryItem
                label="Boats"
                net={totals.boNet}
                sale={totals.boSale}
              />
              <SummaryItem
                label="Tours"
                net={totals.toNet}
                sale={totals.toSale}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 px-4 py-2 rounded border border-slate-200 bg-slate-50">
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wide font-normal text-slate-500">
                    Net
                  </div>
                  <div className="text-base font-medium text-slate-700 tabular-nums">
                    {formatNumber(totals.grandNet)}
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-300" />
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wide font-normal text-blue-700">
                    Sale
                  </div>
                  <div className="text-lg font-semibold text-blue-700 tabular-nums">
                    {formatNumber(totals.grandSale)}
                  </div>
                </div>
              </div>
              {isModal && (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm font-medium px-4 py-2 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
                >
                  ยกเลิก
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="bg-brand-700 hover:bg-brand-800 text-white text-sm font-medium px-5 py-2 rounded transition disabled:opacity-60"
              >
                {submitLabel}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1">
        <span>
          {label}
          {required && <span className="text-red-500"> *</span>}
        </span>
        {hint}
      </label>
      {children}
    </div>
  );
}

function SummaryItem({ label, net, sale }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-slate-700">
        N: {formatNumber(net)} <span className="text-slate-300">|</span> S:{" "}
        {formatNumber(sale)}
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-1.5 border border-slate-300 rounded text-base font-normal focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600";
