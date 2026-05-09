/**
 * Panel แสดงรายละเอียด event ในปฏิทิน
 *
 * โหมดการแสดงผล (priority):
 *   1. event != null  → single mode (hover/pin event เดียว)
 *   2. dayDate != null → day mode (แสดง list ของ booking ทุกตัวในวันนั้น)
 *   3. else → placeholder
 */
export default function EventDetailPanel({
  event, pinned, onClose,
  dayDate, dayEvents, onCloseDay, onPickEvent,
}) {
  if (event) {
    return <SingleCard event={event} pinned={pinned} onClose={onClose} />
  }

  if (dayDate) {
    return <DayCard date={dayDate} events={dayEvents || []} onClose={onCloseDay} onPickEvent={onPickEvent} />
  }

  return (
    <div className="bg-white border border-slate-200 rounded p-4 text-sm font-light text-slate-400 sticky top-0">
      คลิกที่ช่องวันในปฏิทินเพื่อดู booking ของวันนั้น หรือเอาเมาส์ชี้แถบสีเพื่อดูรายละเอียด
    </div>
  )
}

// -------- Day mode --------

function DayCard({ date, events, onClose, onPickEvent }) {
  return (
    <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden sticky top-0">
      <header className="px-3 py-2 flex items-center justify-between bg-slate-50 border-b border-slate-200">
        <div className="text-sm font-medium text-slate-800">{formatDate(date)}</div>
        <div className="text-xs font-light text-slate-500">
          {events.length} booking{events.length !== 1 ? 's' : ''}
        </div>
      </header>

      <div className="p-3 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-sm font-light text-slate-400 text-center py-4">
            ไม่มี booking ในวันนี้
          </div>
        ) : (
          events.map((ev, i) => (
            <MiniEventCard key={i} event={ev} onClick={() => onPickEvent?.(ev)} />
          ))
        )}
      </div>
    </div>
  )
}

function MiniEventCard({ event, onClick }) {
  const accentClass = ACCENT_CLASS[event.type] || ACCENT_CLASS.tour
  const colorClass  = TYPE_COLOR[event.type]   || TYPE_COLOR.tour
  const borderColor = HEADER_BORDER[event.type] || HEADER_BORDER.tour

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left bg-white border-l-4 ${accentClass} border border-slate-200 rounded overflow-hidden hover:shadow transition`}
    >
      <div className={`px-2 py-1 flex items-center justify-between border-b ${borderColor}`}>
        <div className={`text-xs font-bold uppercase tracking-wide ${colorClass}`}>
          {LABEL[event.type] || event.type}
        </div>
        <div className={`text-xs font-bold ${colorClass}`}>{formatDate(event.date)}</div>
      </div>
      <div className="p-2 space-y-1">
        <div className="text-sm font-bold text-slate-800 uppercase truncate">{event.customer_name || event.title}</div>
        <Detail event={event} compact />
        {event.booking_code && (
          <div className="text-xs font-light text-slate-500 truncate pt-1 border-t border-slate-100">
            {event.booking_code}
          </div>
        )}
      </div>
    </button>
  )
}

// -------- Single mode --------

function SingleCard({ event, pinned, onClose }) {
  const accentClass = ACCENT_CLASS[event.type] || ACCENT_CLASS.tour
  const colorClass  = TYPE_COLOR[event.type]   || TYPE_COLOR.tour
  const borderColor = HEADER_BORDER[event.type] || HEADER_BORDER.tour

  return (
    <div className={`bg-white border-l-4 ${accentClass} border border-slate-200 rounded shadow-sm overflow-hidden sticky top-0`}>
      <header className={`px-4 py-2.5 flex items-center justify-between border-b-2 ${borderColor}`}>
        <div className={`text-lg font-bold uppercase tracking-wide ${colorClass}`}>
          {LABEL[event.type] || event.type}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${colorClass}`}>{formatDate(event.date)}</span>
          {pinned && (
            <button onClick={onClose} className="hover:text-slate-700 text-slate-400 text-base leading-none">×</button>
          )}
        </div>
      </header>

      <div className="p-4 space-y-3">
        <div className="text-base font-bold text-slate-800 uppercase">{event.title}</div>
        <Detail event={event} />

        <div className="pt-3 border-t border-slate-200 space-y-1.5">
          <Field label="Cust Name" value={event.customer_name} />
          <Field label="Booking" value={event.booking_code} />
        </div>
      </div>
    </div>
  )
}

// -------- Detail per type --------

function Detail({ event, compact = false }) {
  const d = event.detail || {}

  if (event.type === 'transfer') {
    const arrTime = d.flight_time?.slice(0, 5)
    return (
      <Stack compact={compact}>
        <Field label="From" value={d.from} compact={compact} />
        <Field label="To"   value={d.to} compact={compact} />
        {(arrTime || d.flight_no) && (
          <Pair compact={compact}>
            <Field label="ARR" value={arrTime} compact={compact} />
            <Field label="FLT" value={d.flight_no} compact={compact} />
          </Pair>
        )}
        <Pair compact={compact}>
          <Field label="Pickup Time" value={d.pickup_time?.slice(0, 5)} compact={compact} />
          <Field label="Vehicles"    value={d.vehicle_count} compact={compact} />
        </Pair>
        <Field label="Supplier" value={d.supplier} compact={compact} />
      </Stack>
    )
  }

  if (event.type === 'hotel') {
    return (
      <Stack compact={compact}>
        <Pair compact={compact}>
          <Field label="Type" value={d.bed_type} compact={compact} />
          <Field label="Room" value={d.room_count} compact={compact} />
        </Pair>
        <Pair compact={compact}>
          <Field label="IN"  value={formatDate(d.check_in)} compact={compact} />
          <Field label="OUT" value={formatDate(d.check_out)} compact={compact} />
        </Pair>
        <Field label="Room Type" value={d.room_type} compact={compact} />
        {d.due_payment && (
          <Field label="Due Payment" value={formatDate(d.due_payment)} valueClass="text-red-600 font-bold" compact={compact} />
        )}
        <Field label="Status" value={d.status} compact={compact} />
      </Stack>
    )
  }

  if (event.subtype === 'boat') {
    return (
      <Stack compact={compact}>
        <Pair compact={compact}>
          <Field label="From" value={d.from} compact={compact} />
          <Field label="To"   value={d.to} compact={compact} />
        </Pair>
        <Pair compact={compact}>
          <Field label="Time" value={d.boat_time} compact={compact} />
          <Field label="PAX"  value={d.pax_text} compact={compact} />
        </Pair>
        <Field label="By" value={d.supplier} compact={compact} />
      </Stack>
    )
  }

  return (
    <Stack compact={compact}>
      <Field label="HTL" value={d.pickup_location} compact={compact} />
      <Pair compact={compact}>
        <Field label="Pickup Time" value={d.pickup_time?.slice(0, 5)} compact={compact} />
        <Field label="PAX"         value={d.pax_text} compact={compact} />
      </Pair>
      <Pair compact={compact}>
        <Field label="By"   value={d.supplier} compact={compact} />
        <Field label="Type" value={d.tour_type} compact={compact} />
      </Pair>
    </Stack>
  )
}

// -------- layout helpers --------

function Stack({ children, compact }) {
  return <div className={compact ? 'space-y-1' : 'space-y-1.5'}>{children}</div>
}

function Pair({ children, compact }) {
  return <div className={`grid grid-cols-2 ${compact ? 'gap-x-2' : 'gap-x-4'}`}>{children}</div>
}

function Field({ label, value, valueClass = '', compact = false }) {
  if (value === null || value === undefined || value === '') return null
  const sizeLabel = compact ? 'text-[11px]' : 'text-sm'
  const sizeValue = compact ? 'text-[11px]' : 'text-sm'
  return (
    <div className="flex items-baseline gap-1.5 min-w-0">
      <span className={`${sizeLabel} font-bold uppercase text-slate-800 shrink-0`}>{label}</span>
      <span className={`${sizeLabel} text-slate-500 shrink-0`}>:</span>
      <span className={`${sizeValue} text-slate-700 font-medium truncate ${valueClass}`}>{value}</span>
    </div>
  )
}

// -------- format helpers --------

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const day = String(d.getDate()).padStart(2, '0')
  const mon = MONTH_SHORT[d.getMonth()]
  const yr  = String(d.getFullYear()).slice(-2)
  return `${day}${mon}${yr}`
}

const MONTH_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

const LABEL = {
  transfer: 'TRANSFER',
  hotel:    'HOTEL',
  tour:     'TOUR',
}

const ACCENT_CLASS = {
  transfer: 'border-l-blue-500',
  hotel:    'border-l-amber-500',
  tour:     'border-l-emerald-500',
}

const TYPE_COLOR = {
  transfer: 'text-blue-600',
  hotel:    'text-amber-600',
  tour:     'text-emerald-600',
}

const HEADER_BORDER = {
  transfer: 'border-b-blue-400',
  hotel:    'border-b-amber-400',
  tour:     'border-b-emerald-500',
}
