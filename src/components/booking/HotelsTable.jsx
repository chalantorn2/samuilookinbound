import Autocomplete from '../Autocomplete'
import DateInput from '../DateInput'
import MoneyInput from '../MoneyInput'
import { HOTEL_BREAKFAST, HOTEL_MANAGED_BY, emptyHotel, formatNumber, nightsBetween } from './helpers'

export default function HotelsTable({ rows, onChange }) {
  const update = (i, patch) => {
    const next = [...rows]
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  const updateDate = (i, patch) => {
    const next = [...rows]
    next[i] = { ...next[i], ...patch }
    const n = nightsBetween(next[i].check_in, next[i].check_out)
    if (n !== null) next[i] = { ...next[i], night: String(n) }
    onChange(next)
  }
  const add    = () => onChange([...rows, emptyHotel()])
  const remove = (i) => onChange(rows.filter((_, idx) => idx !== i))

  const totalNet  = rows.reduce((s, r) => s + (Number(r.net_amount)  || 0), 0)
  const totalSale = rows.reduce((s, r) => s + (Number(r.sale_amount) || 0), 0)

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap table-fixed">
          <colgroup>
            <col className="w-[3%]"    />
            <col className="w-[21.8%]" />
            <col className="w-[7.1%]"  />
            <col className="w-[7.1%]"  />
            <col className="w-[3.6%]"  />
            <col className="w-[10.7%]" />
            <col className="w-[7.1%]"  />
            <col className="w-[3.6%]"  />
            <col className="w-[10.1%]" />
            <col className="w-[10.7%]" />
            <col className="w-[7.2%]"  />
            <col className="w-[7.2%]"  />
            <col className="w-[4%]"    />
          </colgroup>
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-600 font-medium">
              <th className="px-1 py-2"></th>
              <th className="px-1 py-2 leading-tight whitespace-normal">Hotel Name</th>
              <th className="px-1 py-2 leading-tight whitespace-normal">Check-in</th>
              <th className="px-1 py-2 leading-tight whitespace-normal">Check-out</th>
              <th className="px-1 py-2 leading-tight whitespace-normal">Night</th>
              <th className="px-1 py-2 leading-tight whitespace-normal">Room Type</th>
              <th className="px-1 py-2 leading-tight whitespace-normal">Bed Type</th>
              <th className="px-1 py-2 leading-tight whitespace-normal">Room</th>
              <th className="px-1 py-2 leading-tight whitespace-normal">Breakfast</th>
              <th className="px-1 py-2 leading-tight whitespace-normal">Managed By</th>
              <th className="px-1 py-2 leading-tight whitespace-normal">Net</th>
              <th className="px-1 py-2 leading-tight whitespace-normal">Sale</th>
              <th className="px-1 py-2 leading-tight whitespace-normal"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr><td colSpan="13" className="px-4 py-6 text-center font-normal text-slate-400">ยังไม่มีรายการที่พัก</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-0 py-1 text-center font-normal text-slate-500">{i + 1}</td>
                <td className="px-1 py-1">
                  <Autocomplete
                    endpoint="/places.php"
                    queryParams={{ type: 'hotel' }}
                    value={r.place_name || ''}
                    displayKey="name"
                    onChange={(v) => update(i, { place_name: v })}
                    onSelect={(it) => update(i, { place_id: it.id, place_name: it.name })}
                    inputClassName={cellInput}
                  />
                </td>
                <td className="px-1 py-1">
                  <DateInput value={r.check_in}  onChange={(v) => updateDate(i, { check_in:  v })} placeholder="15MAY26" className={cellInput} />
                </td>
                <td className="px-1 py-1">
                  <DateInput value={r.check_out} onChange={(v) => updateDate(i, { check_out: v })} placeholder="16MAY26" className={cellInput} />
                </td>
                <td className="px-1 py-1">
                  <input type="text" inputMode="numeric" value={r.night ?? ''} onChange={(e) => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) update(i, { night: v }) }} className={cellInput + ' text-center'} />
                </td>
                <td className="px-1 py-1">
                  <input type="text" value={r.room_type || ''} onChange={(e) => update(i, { room_type: e.target.value })} className={cellInput} />
                </td>
                <td className="px-1 py-1">
                  <input type="text" value={r.bed_type  || ''} onChange={(e) => update(i, { bed_type:  e.target.value })} className={cellInput} />
                </td>
                <td className="px-1 py-1">
                  <input type="text" inputMode="numeric" value={r.room_count ?? ''} onChange={(e) => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) update(i, { room_count: v }) }} className={cellInput + ' text-center'} />
                </td>
                <td className="px-1 py-1">
                  <select value={r.breakfast || 'none'} onChange={(e) => update(i, { breakfast: e.target.value })} className={cellSelect}>
                    {HOTEL_BREAKFAST.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1">
                  <select value={r.managed_by || 'Samui Look'} onChange={(e) => update(i, { managed_by: e.target.value })} className={cellSelect}>
                    {HOTEL_MANAGED_BY.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1">
                  <MoneyInput value={r.net_amount}  onChange={(v) => update(i, { net_amount:  v })} className={cellInput + ' text-right'} />
                </td>
                <td className="px-1 py-1">
                  <MoneyInput value={r.sale_amount} onChange={(v) => update(i, { sale_amount: v })} className={cellInput + ' text-right'} />
                </td>
                <td className="px-0 py-1 text-center">
                  <button type="button" onClick={() => remove(i)} className={removeBtn} aria-label="ลบ">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button type="button" onClick={add} className={addBtn}>+ Add</button>
        <div className="text-sm font-normal text-slate-700">
          ยอดรวมเป็นเงิน Net: <span className="font-medium text-slate-900">{formatNumber(totalNet)}</span>
          <span className="mx-3 text-slate-300">|</span>
          Sale: <span className="font-medium text-slate-900">{formatNumber(totalSale)}</span>
        </div>
      </div>
    </div>
  )
}

const cellInput  = "w-full px-2 py-1 border border-slate-300 rounded text-base font-normal focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
const cellSelect = cellInput + " bg-white"
const addBtn = "bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-1.5 rounded transition"
const removeBtn = "inline-flex items-center justify-center w-7 h-7 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 text-xl leading-none transition"
