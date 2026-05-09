import { emptyTraveler } from './helpers'
import DateInput from '../DateInput'

const TRAVELER_TYPES = [
  { value: 'adult',  label: 'ADT' },
  { value: 'child',  label: 'CHD' },
  { value: 'infant', label: 'INF' },
]

export default function TravelersTable({ rows, onChange }) {
  const update = (i, patch) => {
    const next = [...rows]
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  const add    = () => onChange([...rows, emptyTraveler()])
  const remove = (i) => onChange(rows.filter((_, idx) => idx !== i))

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap table-fixed">
          <colgroup>
            <col className="w-[4.5%]"  />
            <col className="w-[36.4%]" />
            <col className="w-[9.1%]"  />
            <col className="w-[9.1%]"  />
            <col className="w-[18.2%]" />
            <col className="w-[18.2%]" />
            <col className="w-[4.5%]"  />
          </colgroup>
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-600 font-medium">
              <th className="px-2 py-2"></th>
              <th className="px-2 py-2">Name (First/Last)</th>
              <th className="px-2 py-2">Title</th>
              <th className="px-2 py-2">Age</th>
              <th className="px-2 py-2">Passport No.</th>
              <th className="px-2 py-2">Expiry Date</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr><td colSpan="7" className="px-4 py-6 text-center font-normal text-slate-400">ยังไม่มีผู้เดินทาง — กด + Add</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-0 py-1 text-center font-normal text-slate-500">{i + 1}</td>
                <td className="px-2 py-1">
                  <input type="text" value={r.name || ''} onChange={(e) => update(i, { name: e.target.value })} className={cellInput} />
                </td>
                <td className="px-2 py-1">
                  <input type="text" value={r.title || ''} onChange={(e) => update(i, { title: e.target.value })} className={cellInput} />
                </td>
                <td className="px-2 py-1">
                  <select value={r.traveler_type || 'adult'} onChange={(e) => update(i, { traveler_type: e.target.value })} className={cellSelect}>
                    {TRAVELER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <input type="text" value={r.passport_no || ''} onChange={(e) => update(i, { passport_no: e.target.value })} className={cellInput} />
                </td>
                <td className="px-2 py-1">
                  <DateInput value={r.passport_expiry} onChange={(v) => update(i, { passport_expiry: v })} className={cellInput} />
                </td>
                <td className="px-0 py-1 text-center">
                  <button type="button" onClick={() => remove(i)} className={removeBtn} aria-label="ลบ">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3">
        <button type="button" onClick={add} className={addBtn}>+ Add</button>
      </div>
    </div>
  )
}

const cellInput  = "w-full px-2 py-1 border border-slate-300 rounded text-base font-normal focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
const cellSelect = cellInput + " bg-white"
const addBtn = "bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-1.5 rounded transition"
const removeBtn = "inline-flex items-center justify-center w-7 h-7 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 text-xl leading-none transition"
