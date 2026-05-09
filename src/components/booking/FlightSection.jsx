import Autocomplete from '../Autocomplete'
import DateInput from '../DateInput'

/**
 * Flight section: arrival + departure
 * - User กรอกแค่ Date + Flight No (autocomplete)
 * - Route + Time auto-link จาก Information master
 *
 * rows: [{ direction, flight_date, flight_no, route, time, flight_id }, ...]
 */
const emptyFlightRow = (direction) => ({
  direction, flight_date: '', flight_no: '', route: '', time: '', flight_id: null,
})

export default function FlightSection({ rows, onChange }) {
  const updateRow = (direction, patch) => {
    const exists = rows.some(r => r.direction === direction)
    if (!exists) {
      onChange([...rows, { ...emptyFlightRow(direction), ...patch }])
      return
    }
    onChange(rows.map(r => r.direction === direction ? { ...r, ...patch } : r))
  }

  const arrival   = rows.find(r => r.direction === 'arrival')   || emptyFlightRow('arrival')
  const departure = rows.find(r => r.direction === 'departure') || emptyFlightRow('departure')

  return (
    <div className="space-y-3">
      <FlightRow direction="arrival"   label="Arrival"   timeKey="arr_time"
                 row={arrival}   onChange={(p) => updateRow('arrival',   p)} />
      <FlightRow direction="departure" label="Departure" timeKey="dep_time"
                 row={departure} onChange={(p) => updateRow('departure', p)} />
      <p className="text-[11px] font-normal text-slate-400 leading-snug">
        ใส่วันที่กับ Flight No → Route และเวลาจะดึงจาก Information อัตโนมัติ
      </p>
    </div>
  )
}

function FlightRow({ label, timeKey, row, onChange }) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-600 mb-1 uppercase tracking-wide">{label}</div>
      <div className="grid grid-cols-[1.3fr_1fr_1.2fr_0.9fr] gap-2 items-center">
        <DateInput
          value={row.flight_date}
          onChange={(v) => onChange({ flight_date: v })}
          className={input}
        />
        <Autocomplete
          endpoint="/flights.php"
          value={row.flight_no || ''}
          displayKey="flight_no"
          onChange={(v) => onChange({ flight_no: v, flight_id: null, route: '', time: '' })}
          onSelect={(it) => onChange({
            flight_id: it.id,
            flight_no: it.flight_no,
            route: it.origin && it.destination ? `${it.origin}-${it.destination}` : '',
            time: (it[timeKey] || '').slice(0, 5),
          })}
          inputClassName={input}
        />
        <input
          type="text"
          value={row.route || ''}
          readOnly
          tabIndex={-1}
          placeholder="Routing"
          className={inputReadOnly}
        />
        <input
          type="text"
          value={row.time || ''}
          readOnly
          tabIndex={-1}
          placeholder="Time"
          className={inputReadOnly}
        />
      </div>
    </div>
  )
}

const input = "w-full px-2 py-1 border border-slate-300 rounded text-base font-normal bg-white focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
const inputReadOnly = "w-full px-2 py-1 border border-slate-200 rounded text-base font-normal bg-slate-50 text-slate-600 cursor-default focus:outline-none truncate"
