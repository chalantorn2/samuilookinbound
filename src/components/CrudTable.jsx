import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import TimeInput from './TimeInput.jsx'

/**
 * Generic CRUD table + modal form
 *
 * Props:
 *   endpoint   string  — เช่น "/customers.php"
 *   columns    Array<{ key, label, width?, render?(row) }>
 *   fields     Array<{ key, label, type?, options?, required?, placeholder?, hint?, colSpan? }>
 *              type: 'text' | 'textarea' | 'select' | 'time'
 *   emptyForm  Object  — initial state ของ form
 *   labels     { addBtn, modalCreate, modalEdit, deleteConfirm(row) }
 *   searchPlaceholder string
 *   searchKeys Array<string> — ฟิลด์ที่ใช้ search ฝั่ง client
 */
export default function CrudTable({
  endpoint,
  columns,
  fields,
  emptyForm,
  labels,
  searchPlaceholder = 'ค้นหา...',
  searchKeys = [],
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true); setError('')
    api.get(endpoint).then(
      (res) => setItems(res.items || []),
      (err) => setError(err.message || 'โหลดข้อมูลไม่สำเร็จ'),
    ).finally(() => setLoading(false))
  }

  useEffect(() => {
    let cancelled = false
    api.get(endpoint).then(
      (res) => { if (!cancelled) { setItems(res.items || []); setLoading(false) } },
      (err) => { if (!cancelled) { setError(err.message || 'โหลดข้อมูลไม่สำเร็จ'); setLoading(false) } },
    )
    return () => { cancelled = true }
  }, [endpoint])
  // หมายเหตุ: state อื่นๆ (search, form, modal) ไม่ต้อง reset เพราะหน้า Information ใช้ key={active}
  // ทำให้ CrudTable re-mount ทุกครั้งที่เปลี่ยน tab

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    const keys = searchKeys.length > 0 ? searchKeys : columns.map(c => c.key)
    return items.filter(row =>
      keys.some(k => String(row[k] ?? '').toLowerCase().includes(q))
    )
  }, [items, search, searchKeys, columns])

  const openCreate = () => {
    setEditing(null); setForm(emptyForm); setFormError(''); setShowModal(true)
  }

  const openEdit = (row) => {
    const next = { ...emptyForm }
    for (const f of fields) {
      next[f.key] = row[f.key] ?? (emptyForm[f.key] ?? '')
    }
    setEditing(row); setForm(next); setFormError(''); setShowModal(true)
  }

  const closeModal = () => { if (!saving) setShowModal(false) }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true); setFormError('')
    try {
      if (editing) {
        await api.put(`${endpoint}?id=${editing.id}`, form)
      } else {
        await api.post(endpoint, form)
      }
      setShowModal(false)
      await load()
    } catch (err) {
      setFormError(err.message || 'บันทึกไม่สำเร็จ')
    } finally { setSaving(false) }
  }

  const removeFromModal = async () => {
    if (!editing) return
    const msg = labels?.deleteConfirm?.(editing) || `ลบรายการนี้ ?`
    if (!confirm(msg)) return
    setSaving(true); setFormError('')
    try {
      await api.del(`${endpoint}?id=${editing.id}`)
      setShowModal(false)
      await load()
    } catch (err) {
      setFormError(err.message || 'ลบไม่สำเร็จ')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm font-light">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-4">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full max-w-sm px-3 py-1.5 border border-slate-300 rounded text-sm font-light focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-xs font-light text-slate-500">
              {loading ? 'กำลังโหลด...' : `${filtered.length} / ${items.length} รายการ`}
            </div>
            <button
              onClick={openCreate}
              className="bg-brand-700 hover:bg-brand-800 text-white text-sm font-medium px-3 py-1.5 rounded transition"
            >
              + {labels?.addBtn || 'เพิ่ม'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-600 font-medium">
                <th className="px-4 py-2 w-12"></th>
                {columns.map(col => (
                  <th key={col.key} className="px-4 py-2" style={col.width ? { width: col.width } : undefined}>
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-2 w-24 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={columns.length + 2} className="px-4 py-8 text-center font-light text-slate-400">กำลังโหลด...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={columns.length + 2} className="px-4 py-8 text-center font-light text-slate-400">ไม่มีข้อมูล</td></tr>
              ) : filtered.map((row, i) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-light text-slate-500">{i + 1}</td>
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-2 font-light text-slate-700">
                      {col.render ? col.render(row) : (row[col.key] ?? '-')}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(row)} className="text-brand-700 hover:text-brand-900 font-medium text-sm">แก้ไข</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center px-4 z-50" onClick={closeModal}>
          <div className="bg-white rounded border border-slate-200 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3 border-b border-slate-200">
              <h3 className="text-base font-medium text-slate-800">
                {editing ? (labels?.modalEdit || 'แก้ไข') : (labels?.modalCreate || 'เพิ่มใหม่')}
              </h3>
            </div>
            <form onSubmit={submit} className="p-5">
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
                {fields.map(f => (
                  <Field
                    key={f.key}
                    label={f.label}
                    required={f.required}
                    hint={f.hint}
                    colSpan={f.colSpan}
                  >
                    <FieldInput field={f} value={form[f.key] ?? ''} onChange={v => setForm({ ...form, [f.key]: v })} />
                  </Field>
                ))}
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm font-light mt-3">{formError}</div>
              )}

              <div className="flex items-center pt-3 border-t border-slate-100 -mx-5 px-5 -mb-5 pb-4 mt-4">
                {editing && (
                  <button
                    type="button"
                    onClick={removeFromModal}
                    disabled={saving}
                    className="px-3 py-1.5 rounded text-red-600 hover:bg-red-50 font-medium text-sm disabled:opacity-60"
                  >
                    ลบ
                  </button>
                )}
                <div className="flex justify-end gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="px-3 py-1.5 rounded text-slate-700 hover:bg-slate-100 font-medium text-sm"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-3 py-1.5 rounded bg-brand-700 hover:bg-brand-800 text-white font-medium text-sm disabled:opacity-60"
                  >
                    {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, required, hint, colSpan, children }) {
  // grid base = 14 cols. 'full' = 14, default (omitted) = 7 (half), or pass number 1-14
  let n = 7
  if (colSpan === 'full') n = 14
  else if (typeof colSpan === 'number') n = colSpan
  return (
    <div style={{ gridColumn: `span ${n} / span ${n}` }}>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
        {hint && <span className="ml-2 text-xs font-light text-slate-400">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function FieldInput({ field, value, onChange }) {
  const cls = "w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 font-light"

  if (field.type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        required={field.required}
        placeholder={field.placeholder}
        rows={field.rows || 2}
        className={cls}
      />
    )
  }
  if (field.type === 'select') {
    return (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        required={field.required}
        className={cls + ' bg-white'}
      >
        {!field.required && <option value="">— เลือก —</option>}
        {field.options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }
  if (field.type === 'time') {
    return (
      <TimeInput
        value={value || ''}
        onChange={onChange}
        required={field.required}
        className={cls}
      />
    )
  }
  const inputType = field.type === 'email' ? 'email'
    : field.type === 'tel' ? 'tel'
    : field.type === 'url' ? 'url'
    : 'text'
  return (
    <input
      type={inputType}
      value={value}
      onChange={e => onChange(field.uppercase ? e.target.value.toUpperCase() : e.target.value)}
      required={field.required}
      placeholder={field.placeholder}
      maxLength={field.maxLength}
      minLength={field.minLength}
      pattern={field.pattern}
      className={cls}
    />
  )
}
