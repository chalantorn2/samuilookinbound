import Autocomplete from '../Autocomplete'
import DateInput from '../DateInput'
import TimeInput from '../TimeInput'
import MoneyInput from '../MoneyInput'
import { emptyBoat, formatNumber } from './helpers'

export default function BoatsTable({ rows, onChange }) {
  const update = (i, patch) => {
    const next = [...rows]
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  const add    = () => onChange([...rows, emptyBoat()])
  const remove = (i) => onChange(rows.filter((_, idx) => idx !== i))

  const totalNet  = rows.reduce((s, r) => s + (Number(r.net_adult)  || 0) + (Number(r.net_child)  || 0), 0)
  const totalSale = rows.reduce((s, r) => s + (Number(r.sale_adult) || 0) + (Number(r.sale_child) || 0), 0)

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-600 font-medium">
              <th className="px-2 py-2 w-10"></th>
              <th className="px-2 py-2 w-32">วันที่</th>
              <th className="px-2 py-2 w-32">บริการ (Service)</th>
              <th className="px-2 py-2 w-20">จำนวน</th>
              <th className="px-2 py-2 min-w-[140px]">From</th>
              <th className="px-2 py-2 min-w-[140px]">To</th>
              <th className="px-2 py-2 w-32">เวลาเรือ</th>
              <th className="px-2 py-2 w-28">จัดโดย</th>
              <th className="px-2 py-2 w-24">N/Adult</th>
              <th className="px-2 py-2 w-24">N/Child</th>
              <th className="px-2 py-2 w-24">S/Adult</th>
              <th className="px-2 py-2 w-24">S/Child</th>
              <th className="px-2 py-2 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr><td colSpan="13" className="px-4 py-6 text-center font-normal text-slate-400">ยังไม่มีรายการตั๋วเรือ</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-0 py-1 text-center font-normal text-slate-500">{i + 1}</td>
                <td className="px-2 py-1">
                  <DateInput value={r.service_date} onChange={(v) => update(i, { service_date: v })} className={cellInput} />
                </td>
                <td className="px-2 py-1">
                  <input type="text" value={r.service_type || ''} onChange={(e) => update(i, { service_type: e.target.value })} className={cellInput} />
                </td>
                <td className="px-2 py-1">
                  <input type="text" value={r.pax_text || ''} onChange={(e) => update(i, { pax_text: e.target.value })} className={cellInput + ' text-center'} />
                </td>
                <td className="px-2 py-1">
                  <Autocomplete
                    endpoint="/places.php"
                    value={r.from_text || ''}
                    displayKey="name"
                    onChange={(v) => update(i, { from_text: v })}
                    onSelect={(it) => update(i, { from_place_id: it.id, from_text: it.name })}
                    inputClassName={cellInput}
                  />
                </td>
                <td className="px-2 py-1">
                  <Autocomplete
                    endpoint="/places.php"
                    value={r.to_text || ''}
                    displayKey="name"
                    onChange={(v) => update(i, { to_text: v })}
                    onSelect={(it) => update(i, { to_place_id: it.id, to_text: it.name })}
                    inputClassName={cellInput}
                  />
                </td>
                <td className="px-2 py-1">
                  <TimeInput value={r.boat_time} onChange={(v) => update(i, { boat_time: v })} className={cellInput} />
                </td>
                <td className="px-2 py-1">
                  <Autocomplete
                    endpoint="/suppliers.php"
                    queryParams={{ type: 'boat' }}
                    value={r.supplier_code || ''}
                    displayKey="code"
                    onChange={(v) => update(i, { supplier_code: v })}
                    onSelect={(it) => update(i, { supplier_id: it.id, supplier_code: it.code })}
                    inputClassName={cellInput}
                  />
                </td>
                <td className="px-2 py-1"><MoneyInput value={r.net_adult}  onChange={(v) => update(i, { net_adult:  v })} className={cellInput + ' text-right'} /></td>
                <td className="px-2 py-1"><MoneyInput value={r.net_child}  onChange={(v) => update(i, { net_child:  v })} className={cellInput + ' text-right'} /></td>
                <td className="px-2 py-1"><MoneyInput value={r.sale_adult} onChange={(v) => update(i, { sale_adult: v })} className={cellInput + ' text-right'} /></td>
                <td className="px-2 py-1"><MoneyInput value={r.sale_child} onChange={(v) => update(i, { sale_child: v })} className={cellInput + ' text-right'} /></td>
                <td className="px-2 py-1 text-right">
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

const cellInput = "w-full px-2 py-1 border border-slate-300 rounded text-base font-normal focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
const addBtn = "bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-1.5 rounded transition"
const removeBtn = "inline-flex items-center justify-center w-7 h-7 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 text-xl leading-none transition"
