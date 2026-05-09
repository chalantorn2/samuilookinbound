import { useMemo } from 'react'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const TYPE_STYLES = {
  transfer: { bar: 'bg-blue-100 text-blue-800 border-blue-200' },
  hotel:    { bar: 'bg-amber-100 text-amber-800 border-amber-200' },
  tour:     { bar: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
}

/**
 * Calendar — month grid พร้อม event bars
 *
 * Props:
 *   month         Date    — เดือนปัจจุบันที่แสดง (วันที่ใดก็ได้ในเดือน)
 *   events        Array<{ date, type, title, ... }>  — พร้อม flatten
 *   onMonthChange (Date) → void  — กดปุ่มเดือนก่อน/ถัดไป
 *   onHoverEvent  (event|null) → void
 *   onClickEvent  (event) → void
 *   onSelectDay   (isoDate, eventsOfDay) → void — คลิกที่ช่องวัน
 *   selectedDate  string|null — ISO date ของวันที่ถูกเลือก (เพื่อ highlight)
 */
export default function Calendar({ month, events, onMonthChange, onHoverEvent, onClickEvent, onSelectDay, selectedDate }) {
  const grid = useMemo(() => buildGrid(month), [month])
  const eventsByDate = useMemo(() => groupByDate(events), [events])

  const goPrev  = () => onMonthChange(addMonth(month, -1))
  const goNext  = () => onMonthChange(addMonth(month, 1))
  const goToday = () => onMonthChange(new Date())

  return (
    <div className="bg-white border border-slate-200 rounded flex flex-col h-full min-h-0">
      {/* header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-slate-200 shrink-0">
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-medium text-slate-800">
            {MONTH_NAMES[month.getMonth()]} <span className="text-slate-500">{month.getFullYear()}</span>
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={goPrev}  className={navBtn} aria-label="Previous month">‹</button>
          <button type="button" onClick={goToday} className={todayBtn}>Today</button>
          <button type="button" onClick={goNext}  className={navBtn} aria-label="Next month">›</button>
        </div>
      </div>

      {/* day labels */}
      <div className="grid grid-cols-7 border-b border-slate-200 shrink-0">
        {DAY_LABELS.map((d) => (
          <div key={d} className="px-2 py-1.5 text-xs font-medium text-slate-500 text-center border-r last:border-r-0 border-slate-100">
            {d}
          </div>
        ))}
      </div>

      {/* grid 6 weeks */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-0">
        {grid.map((d, idx) => {
          const inMonth = d.getMonth() === month.getMonth()
          const iso = isoDate(d)
          const dayEvents = eventsByDate.get(iso) || []
          const isToday = isSameDay(d, new Date())
          const isSelected = selectedDate === iso
          return (
            <div
              key={idx}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDay?.(iso, dayEvents)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectDay?.(iso, dayEvents)
                }
              }}
              className={`min-h-0 min-w-0 border-r border-b p-1 flex flex-col gap-0.5 overflow-hidden cursor-pointer transition ${
                isSelected
                  ? 'bg-brand-50 border-brand-300 ring-1 ring-brand-300'
                  : `${inMonth ? 'bg-white' : 'bg-slate-50/60'} border-slate-100 hover:bg-slate-50`
              }`}
            >
              <div className="flex items-center justify-end px-1">
                <span className={`text-xs ${
                  isToday
                    ? 'bg-brand-700 text-white font-medium w-6 h-6 rounded-full flex items-center justify-center'
                    : inMonth ? 'text-slate-700 font-light' : 'text-slate-400 font-light'
                }`}>
                  {d.getDate()}
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                {dayEvents.slice(0, 4).map((ev, i) => {
                  const style = TYPE_STYLES[ev.type] || TYPE_STYLES.tour
                  return (
                    <button
                      key={i}
                      type="button"
                      onMouseEnter={() => onHoverEvent?.(ev)}
                      onMouseLeave={() => onHoverEvent?.(null)}
                      onClick={(e) => {
                        e.stopPropagation()
                        onClickEvent?.(ev)
                      }}
                      className={`text-[11px] leading-tight truncate text-left px-1.5 py-0.5 rounded border ${style.bar} hover:brightness-95 transition`}
                      title={ev.title}
                    >
                      {ev.title}
                    </button>
                  )
                })}
                {dayEvents.length > 4 && (
                  <div className="text-[10px] text-slate-400 px-1.5">+{dayEvents.length - 4} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// -------- helpers --------

/** สร้าง grid 42 วัน (6 สัปดาห์) ครอบเดือน — เริ่มจากวันอาทิตย์ก่อนวันที่ 1 ของเดือน */
function buildGrid(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const startDow = first.getDay()  // 0 (Sun) - 6 (Sat)
  const start = new Date(first)
  start.setDate(first.getDate() - startDow)

  const days = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push(d)
  }
  return days
}

function groupByDate(events) {
  const m = new Map()
  for (const ev of events || []) {
    if (!m.has(ev.date)) m.set(ev.date, [])
    m.get(ev.date).push(ev)
  }
  return m
}

function isoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate()
}

function addMonth(d, delta) {
  const nd = new Date(d)
  nd.setDate(1)
  nd.setMonth(nd.getMonth() + delta)
  return nd
}

const navBtn = "w-8 h-8 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 text-lg"
const todayBtn = "px-3 h-8 rounded text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800"
