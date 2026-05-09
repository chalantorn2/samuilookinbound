import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import Booking from "./Booking.jsx";
import BookingExpandedPanel from "../components/BookingExpandedPanel.jsx";
import { api } from "../lib/api";

const SEARCH_FIELDS = [
  { value: "id", label: "ID" },
  { value: "agent", label: "AGENT" },
  { value: "customer", label: "CUSTOMER NAME" },
  { value: "date_in", label: "DATE IN" },
];

export default function BookingList() {
  const [from, setFrom] = useState(() => isoFirstOfMonth());
  const [to, setTo] = useState(() => isoLastOfMonth());
  const [searchField, setSearchField] = useState("id");
  const [search, setSearch] = useState("");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [sort, setSort] = useState({ key: "created_at", dir: "desc" });

  const [editingId, setEditingId] = useState(null);
  const [emailingRow, setEmailingRow] = useState(null);
  const [sentIds, setSentIds] = useState(() => new Set());

  // expand state
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [details, setDetails] = useState({}); // { [id]: booking }
  const [detailLoading, setDetailLoading] = useState({}); // { [id]: bool }
  const [selections, setSelections] = useState({}); // { [id]: { hotels: Set, tours: Set, boats: Set } }

  const ensureDetail = useCallback(
    (id) => {
      if (details[id] || detailLoading[id]) return;
      setDetailLoading((m) => ({ ...m, [id]: true }));
      api.get(`/bookings.php?id=${id}`).then(
        (res) => {
          setDetails((m) => ({ ...m, [id]: res.booking }));
          setDetailLoading((m) => ({ ...m, [id]: false }));
        },
        () => {
          setDetailLoading((m) => ({ ...m, [id]: false }));
        },
      );
    },
    [details, detailLoading],
  );

  const toggleExpand = useCallback(
    (id) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
          ensureDetail(id);
        }
        return next;
      });
      setSelections((m) =>
        m[id]
          ? m
          : {
              ...m,
              [id]: {
                hotels: new Set(),
                tours: new Set(),
                boats: new Set(),
              },
            },
      );
    },
    [ensureDetail],
  );

  const toggleSelection = useCallback((bookingId, kind, rowId) => {
    setSelections((m) => {
      const cur = m[bookingId] || {
        hotels: new Set(),
        tours: new Set(),
        boats: new Set(),
      };
      const nextSet = new Set(cur[kind]);
      if (nextSet.has(rowId)) nextSet.delete(rowId);
      else nextSet.add(rowId);
      return { ...m, [bookingId]: { ...cur, [kind]: nextSet } };
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (search.trim()) {
      params.set("search", search.trim());
      params.set("searchField", searchField);
    }
    api.get(`/bookings.php?${params.toString()}`).then(
      (res) => {
        if (cancelled) return;
        const items = res.items || [];
        setItems(items);
        setSentIds(
          new Set(items.filter((r) => r.voucher_sent_at).map((r) => r.id)),
        );
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
  }, [from, to, search, searchField, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const sortedItems = useMemo(() => sortItems(items, sort), [items, sort]);

  const onSort = useCallback((key) => {
    setSort((cur) => {
      if (cur.key === key) {
        return { key, dir: cur.dir === "asc" ? "desc" : "asc" };
      }
      // default dir per type
      const dateKeys = ["trip_start", "trip_end", "created_at"];
      const numKeys = ["pax_adult", "pax_child", "pax_infant"];
      const dir =
        dateKeys.includes(key) || numKeys.includes(key) ? "desc" : "asc";
      return { key, dir };
    });
  }, []);

  return (
    <div>
      <PageHeader
        title="BOOKING LIST"
        subtitle="รายการ Booking ทั้งหมด"
        action={
          <div className="text-sm font-light text-slate-500">
            {loading ? "กำลังโหลด..." : `${items.length} Booking`}
          </div>
        }
      />

      <div className="p-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm font-light">
            {error}
          </div>
        )}

        <FilterBar
          from={from}
          to={to}
          searchField={searchField}
          search={search}
          onFromChange={setFrom}
          onToChange={setTo}
          onSearchFieldChange={setSearchField}
          onSearchChange={setSearch}
        />

        <BookingTable
          items={sortedItems}
          loading={loading}
          onEdit={(row) => setEditingId(row.id)}
          onEmail={(row) => setEmailingRow(row)}
          sentIds={sentIds}
          expandedIds={expandedIds}
          onToggleExpand={toggleExpand}
          details={details}
          detailLoading={detailLoading}
          selections={selections}
          onToggleSelect={toggleSelection}
          sort={sort}
          onSort={onSort}
        />
      </div>

      {editingId && (
        <BookingEditModal
          bookingId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={reload}
          onDeleted={() => {
            setExpandedIds((prev) => {
              const next = new Set(prev);
              next.delete(editingId);
              return next;
            });
            reload();
          }}
        />
      )}

      {emailingRow && (
        <EmailModal
          row={emailingRow}
          onClose={() => setEmailingRow(null)}
          onSent={(id, sentAt) => {
            setSentIds((prev) => {
              const next = new Set(prev);
              next.add(id);
              return next;
            });
            setItems((prev) =>
              prev.map((r) =>
                r.id === id ? { ...r, voucher_sent_at: sentAt } : r,
              ),
            );
            setEmailingRow(null);
          }}
        />
      )}
    </div>
  );
}

/* ---------- Filter ---------- */

function FilterBar({
  from,
  to,
  searchField,
  search,
  onFromChange,
  onToChange,
  onSearchFieldChange,
  onSearchChange,
}) {
  const inputCls =
    "px-3 py-1.5 border border-slate-300 rounded text-sm font-light focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600";
  const labelCls = "text-sm font-medium text-slate-600 shrink-0";

  const placeholder = useMemo(() => {
    switch (searchField) {
      case "id":
        return "BK2605001";
      case "agent":
        return "ชื่อ agent";
      case "customer":
        return "ชื่อลูกค้า";
      case "date_in":
        return "DD-MM-YY";
      default:
        return "ค้นหา...";
    }
  }, [searchField]);

  return (
    <div className="bg-white border border-slate-200 rounded p-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-2">
        <span className={labelCls}>จากวันที่</span>
        <input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className={inputCls}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className={labelCls}>ถึงวันที่</span>
        <input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className={inputCls}
        />
      </div>

      <div className="flex items-center gap-2 w-120 max-w-full">
        <span className={labelCls}>ค้นหา</span>
        <div className="flex flex-1 min-w-0">
          <SearchFieldDropdown
            value={searchField}
            onChange={onSearchFieldChange}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 min-w-0 px-3 py-1.5 border border-slate-300 rounded-r text-sm font-light focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </div>
      </div>
    </div>
  );
}

function SearchFieldDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const cur = SEARCH_FIELDS.find((o) => o.value === value);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-full px-3 py-1.5 border border-slate-300 rounded-l text-sm font-medium bg-slate-50 text-slate-700 hover:bg-slate-100 -mr-px inline-flex items-center gap-1 whitespace-nowrap focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
      >
        <span>{cur?.label || ""}</span>
        <svg
          viewBox="0 0 12 8"
          className="w-2.5 h-1.5 text-slate-500"
          fill="currentColor"
        >
          <path d="M6 8L0 0h12z" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 left-0 bg-white border border-slate-200 rounded shadow-md min-w-full">
          {SEARCH_FIELDS.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`block w-full text-left px-3 py-1.5 text-sm font-medium whitespace-nowrap hover:bg-slate-50 ${active ? "bg-slate-100 text-brand-700" : "text-slate-700"}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Table ---------- */

function BookingTable({
  items,
  loading,
  onEdit,
  onEmail,
  sentIds,
  expandedIds,
  onToggleExpand,
  details,
  detailLoading,
  selections,
  onToggleSelect,
  sort,
  onSort,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th
                rowSpan={2}
                className="px-3 py-2 w-10 text-left font-medium"
              ></th>
              <SortableTh
                rowSpan={2}
                sortKey="booking_code"
                sort={sort}
                onSort={onSort}
              >
                ID
              </SortableTh>
              <th rowSpan={2} className="px-3 py-2 text-left font-medium">
                AGENT
              </th>
              <SortableTh
                rowSpan={2}
                sortKey="customer_name"
                sort={sort}
                onSort={onSort}
              >
                CUSTOMER NAME
              </SortableTh>
              <th
                colSpan={3}
                className="px-3 py-1 text-center font-medium border-l border-slate-200"
              >
                PAX
              </th>
              <th
                colSpan={2}
                className="px-3 py-1 text-center font-medium border-l border-slate-200"
              >
                DATE
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2 text-center font-medium border-l border-slate-200 w-32"
              >
                ACTIONS
              </th>
              <SortableTh
                rowSpan={2}
                sortKey="created_at"
                sort={sort}
                onSort={onSort}
                className="border-l border-slate-200"
              >
                CREATED AT
              </SortableTh>
              <SortableTh
                rowSpan={2}
                sortKey="recorded_by_name"
                sort={sort}
                onSort={onSort}
              >
                CREATED BY
              </SortableTh>
            </tr>
            <tr className="text-[11px] text-slate-500">
              <SortableTh
                sortKey="pax_adult"
                sort={sort}
                onSort={onSort}
                align="center"
                small
                className="border-l border-slate-200"
              >
                ADL
              </SortableTh>
              <SortableTh
                sortKey="pax_child"
                sort={sort}
                onSort={onSort}
                align="center"
                small
              >
                CHD
              </SortableTh>
              <SortableTh
                sortKey="pax_infant"
                sort={sort}
                onSort={onSort}
                align="center"
                small
              >
                INF
              </SortableTh>
              <SortableTh
                sortKey="trip_start"
                sort={sort}
                onSort={onSort}
                align="center"
                small
                className="border-l border-slate-200"
              >
                IN
              </SortableTh>
              <SortableTh
                sortKey="trip_end"
                sort={sort}
                onSort={onSort}
                align="center"
                small
              >
                OUT
              </SortableTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan={12}
                  className="px-4 py-8 text-center font-light text-slate-400"
                >
                  กำลังโหลด...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  className="px-4 py-8 text-center font-light text-slate-400"
                >
                  ไม่มีข้อมูล
                </td>
              </tr>
            ) : (
              items.map((row, i) => (
                <Row
                  key={row.id}
                  index={i}
                  row={row}
                  onEdit={onEdit}
                  onEmail={onEmail}
                  sent={sentIds.has(row.id)}
                  expanded={expandedIds.has(row.id)}
                  onToggleExpand={() => onToggleExpand(row.id)}
                  detail={details[row.id]}
                  detailLoading={!!detailLoading[row.id]}
                  selection={selections[row.id]}
                  onToggleSelect={(kind, rowId) =>
                    onToggleSelect(row.id, kind, rowId)
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  index,
  row,
  onEdit,
  onEmail,
  sent,
  expanded,
  onToggleExpand,
  detail,
  detailLoading,
  selection,
  onToggleSelect,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!expanded) return;
    // รอ panel mount + browser layout เสร็จก่อน scroll
    const id = requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => cancelAnimationFrame(id);
  }, [expanded, detail]);

  return (
    <>
      <tr className={expanded ? "bg-slate-50" : "hover:bg-slate-50"}>
        <td className="px-3 py-2 font-light text-slate-500">{index + 1}</td>
        <td className="px-3 py-2 font-medium text-slate-800">
          {row.booking_code || "-"}
        </td>
        <td className="px-3 py-2 font-light text-slate-500"></td>
        <td className="px-3 py-2 font-light text-slate-700 uppercase">
          {row.customer_name || "-"}
        </td>
        <td className="px-2 py-2 text-center font-light text-slate-700 border-l border-slate-100">
          {row.pax_adult ?? 0}
        </td>
        <td className="px-2 py-2 text-center font-light text-slate-700">
          {row.pax_child ?? 0}
        </td>
        <td className="px-2 py-2 text-center font-light text-slate-700">
          {row.pax_infant ?? 0}
        </td>
        <td className="px-2 py-2 text-center font-light text-slate-700 border-l border-slate-100 whitespace-nowrap">
          {formatDate(row.trip_start)}
        </td>
        <td className="px-2 py-2 text-center font-light text-slate-700 whitespace-nowrap">
          {formatDate(row.trip_end)}
        </td>
        <td className="px-3 py-2 text-center border-l border-slate-100">
          <div className="inline-flex items-center gap-1">
            <IconBtn
              title={expanded ? "ซ่อนรายละเอียด" : "ดูรายละเอียด"}
              onClick={onToggleExpand}
              active={expanded}
              variant="blue"
            >
              <IconChevronDown
                className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </IconBtn>
            <IconBtn title="แก้ไข" onClick={() => onEdit(row)} accent>
              <IconEdit />
            </IconBtn>
            <IconBtn
              title={
                sent
                  ? `ส่งอีเมลแล้ว${row.voucher_sent_at ? " - " + formatDateTime(row.voucher_sent_at) : ""}`
                  : "ส่งอีเมล"
              }
              onClick={() => onEmail(row)}
              variant={sent ? "green" : undefined}
              active={sent}
            >
              <IconMail />
            </IconBtn>
          </div>
        </td>
        <td className="px-3 py-2 font-light text-slate-500 whitespace-nowrap">
          {formatDateTime(row.created_at)}
        </td>
        <td className="px-3 py-2 font-light text-slate-500">
          {row.recorded_by_name || "-"}
        </td>
      </tr>
      {expanded && (
        <tr ref={panelRef}>
          <td colSpan={12} className="p-0">
            <BookingExpandedPanel
              detail={detail}
              loading={detailLoading}
              selection={selection}
              onToggleSelect={onToggleSelect}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function SortableTh({
  sortKey,
  sort,
  onSort,
  children,
  rowSpan,
  align = "left",
  small = false,
  className = "",
}) {
  const active = sort?.key === sortKey;
  const dir = active ? sort.dir : null;
  const padY = small ? "py-1" : "py-2";
  const padX = small ? "px-2" : "px-3";
  const justify =
    align === "center"
      ? "justify-center"
      : align === "right"
        ? "justify-end"
        : "justify-start";
  return (
    <th
      rowSpan={rowSpan}
      className={`${padX} ${padY} text-${align} font-medium ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 ${justify} w-full hover:text-slate-900 transition`}
      >
        <span>{children}</span>
        <SortIcon dir={dir} />
      </button>
    </th>
  );
}

function SortIcon({ dir }) {
  if (!dir) return null;
  return (
    <svg
      viewBox="0 0 12 8"
      className="w-2.5 h-1.5 text-slate-500"
      fill="currentColor"
    >
      {dir === "asc" ? <path d="M6 0l6 8H0z" /> : <path d="M6 8L0 0h12z" />}
    </svg>
  );
}

function IconBtn({
  title,
  onClick,
  children,
  accent = false,
  active = false,
  variant,
}) {
  let cls;
  if (variant === "blue") {
    cls = active
      ? "bg-blue-100 text-blue-700"
      : "text-blue-600 hover:bg-blue-100";
  } else if (variant === "green") {
    cls = active
      ? "bg-green-100 text-green-700"
      : "text-green-600 hover:bg-green-100";
  } else if (active) {
    cls = "bg-brand-50 text-brand-700";
  } else if (accent) {
    cls = "text-brand-700 hover:bg-brand-50 hover:text-brand-900";
  } else {
    cls = "text-slate-500 hover:bg-slate-100 hover:text-slate-700";
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center w-7 h-7 rounded transition ${cls}`}
    >
      {children}
    </button>
  );
}

/* ---------- Edit modal (reuse จาก Home) ---------- */

function BookingEditModal({ bookingId, onClose, onSaved, onDeleted }) {
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
        <Booking
          bookingId={bookingId}
          onClose={onClose}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      </div>
    </div>
  );
}

/* ---------- Email modal ---------- */

function EmailModal({ row, onClose, onSent }) {
  const [to, setTo] = useState(row.customer_email || "");
  const [subject, setSubject] = useState(`Voucher - ${row.booking_code || ""}`);
  const [body, setBody] = useState(
    "ขอบคุณที่ใช้บริการ\nบริษัท สมุย ลุค จำกัด\nโทร 077-950550\nอีเมล samuilook@yahoo.com, usmlook@ksc.th.com",
  );
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const inputCls =
    "w-full px-3 py-2 border border-slate-300 rounded text-sm font-light focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600";

  const handleSend = async () => {
    setSending(true);
    setErr("");
    try {
      // TODO: integrate real email send (with voucher attachment) later
      const res = await api.post(
        `/bookings.php?id=${row.id}&action=mark_voucher_sent`,
      );
      onSent(row.id, res.voucher_sent_at);
    } catch (e) {
      setErr(e.message || "ส่งไม่สำเร็จ");
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded shadow-xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-medium text-slate-800">
            ส่งอีเมล - {row.booking_code}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="ปิด"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              ผู้รับ
            </label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={inputCls}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              หัวข้อ
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              เนื้อหา
            </label>
            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={inputCls + " resize-y"}
            />
          </div>
        </div>

        {err && (
          <div className="mx-5 mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm font-light">
            {err}
          </div>
        )}

        <div className="px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="px-4 py-1.5 border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!to.trim() || sending}
            className="px-4 py-1.5 rounded text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "กำลังส่ง..." : "ส่ง"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

const NUMERIC_KEYS = new Set(["pax_adult", "pax_child", "pax_infant"]);
const DATE_KEYS = new Set(["trip_start", "trip_end", "created_at"]);

function sortItems(items, sort) {
  if (!sort?.key) return items;
  const { key, dir } = sort;
  const mul = dir === "desc" ? -1 : 1;
  const isNum = NUMERIC_KEYS.has(key);
  const isDate = DATE_KEYS.has(key);
  return [...items].sort((a, b) => {
    const va = a?.[key];
    const vb = b?.[key];
    // null / undefined → ท้ายเสมอ ไม่ว่าจะ asc / desc
    const aNull = va === null || va === undefined || va === "";
    const bNull = vb === null || vb === undefined || vb === "";
    if (aNull && bNull) return 0;
    if (aNull) return 1;
    if (bNull) return -1;
    if (isNum) return (Number(va) - Number(vb)) * mul;
    if (isDate) {
      const ta = new Date(String(va).replace(" ", "T")).getTime();
      const tb = new Date(String(vb).replace(" ", "T")).getTime();
      return (ta - tb) * mul;
    }
    return String(va).localeCompare(String(vb)) * mul;
  });
}

function isoFirstOfMonth() {
  const d = new Date();
  return iso(new Date(d.getFullYear(), d.getMonth(), 1));
}

function isoLastOfMonth() {
  const d = new Date();
  return iso(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

function iso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

function formatDateTime(s) {
  if (!s) return "-";
  const d = new Date(s.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return s;
  const day = String(d.getDate()).padStart(2, "0");
  const mon = MONTH_SHORT[d.getMonth()];
  const yr = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day}${mon}${yr} ${hh}:${mm}`;
}

/* ---------- icons ---------- */

function IconChevronDown({ className = "w-4 h-4", ...p }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...p}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function IconEdit(p) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
      {...p}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}
function IconMail(p) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
      {...p}
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 7 9-7" />
    </svg>
  );
}
