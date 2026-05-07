import { useEffect, useState, useMemo } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext.jsx'

const EMPTY_FORM = { username: '', full_name: '', role: 'user', password: '' }

export default function UsersManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await api.get('/users.php')
      setUsers(res.users || [])
    } catch (err) {
      setError(err.message || 'โหลดข้อมูลไม่สำเร็จ')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(u =>
      u.username.toLowerCase().includes(q) ||
      (u.full_name || '').toLowerCase().includes(q)
    )
  }, [users, search])

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(''); setShowModal(true) }
  const openEdit = (u) => {
    setEditing(u)
    setForm({ username: u.username, full_name: u.full_name, role: u.role, password: '' })
    setFormError('')
    setShowModal(true)
  }
  const closeModal = () => { if (!saving) setShowModal(false) }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true); setFormError('')
    try {
      if (editing) {
        const payload = { ...form }
        if (!payload.password) delete payload.password
        await api.put(`/users.php?id=${editing.id}`, payload)
      } else {
        await api.post('/users.php', form)
      }
      setShowModal(false)
      await load()
    } catch (err) {
      setFormError(err.message || 'บันทึกไม่สำเร็จ')
    } finally { setSaving(false) }
  }

  const remove = async (u) => {
    if (u.id === currentUser?.id) return alert('ไม่สามารถลบบัญชีของตนเองได้')
    if (!confirm(`ลบผู้ใช้ "${u.username}" ?`)) return
    try {
      await api.del(`/users.php?id=${u.id}`)
      await load()
    } catch (err) {
      alert(err.message || 'ลบไม่สำเร็จ')
    }
  }

  return (
    <div>
      <PageHeader
        title="USERS MANAGEMENT"
        subtitle="จัดการผู้ใช้งานระบบ"
        action={
          <button
            onClick={openCreate}
            className="bg-brand-700 hover:bg-brand-800 text-white text-sm font-medium px-3 py-1.5 rounded transition"
          >
            + เพิ่มผู้ใช้
          </button>
        }
      />

      <div className="p-6 space-y-4">
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
              placeholder="ค้นหา username / ชื่อ"
              className="w-full max-w-sm px-3 py-1.5 border border-slate-300 rounded text-sm font-light focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
            <div className="text-xs font-light text-slate-500 shrink-0">
              {loading ? 'กำลังโหลด...' : `${filtered.length} / ${users.length} รายการ`}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-600 font-medium">
                  <th className="px-4 py-2 w-12">#</th>
                  <th className="px-4 py-2">Username</th>
                  <th className="px-4 py-2">ชื่อ-สกุล</th>
                  <th className="px-4 py-2 w-24">Role</th>
                  <th className="px-4 py-2 w-32 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="5" className="px-4 py-8 text-center font-light text-slate-400">กำลังโหลด...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="5" className="px-4 py-8 text-center font-light text-slate-400">ไม่มีข้อมูล</td></tr>
                ) : filtered.map((u, i) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-light text-slate-500">{i + 1}</td>
                    <td className="px-4 py-2 font-medium text-slate-800">
                      {u.username}
                      {u.id === currentUser?.id && <span className="ml-2 text-xs font-light text-slate-400">(คุณ)</span>}
                    </td>
                    <td className="px-4 py-2 font-light text-slate-700">{u.full_name}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(u)} className="text-brand-700 hover:text-brand-900 font-medium text-sm mr-3">แก้ไข</button>
                      <button
                        onClick={() => remove(u)}
                        disabled={u.id === currentUser?.id}
                        className="text-red-600 hover:text-red-800 font-medium text-sm disabled:text-slate-300 disabled:cursor-not-allowed"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center px-4 z-50" onClick={closeModal}>
          <div className="bg-white rounded border border-slate-200 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3 border-b border-slate-200">
              <h3 className="text-base font-medium text-slate-800">{editing ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</h3>
            </div>
            <form onSubmit={submit} className="p-5 space-y-3">
              <Field label="Username" required>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  required
                  disabled={!!editing}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 font-light disabled:bg-slate-100 disabled:text-slate-500"
                />
              </Field>
              <Field label="ชื่อ-สกุล" required>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  required
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 font-light"
                />
              </Field>
              <Field label="Role" required>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 font-light bg-white"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </Field>
              <Field
                label={editing ? 'รหัสผ่านใหม่' : 'รหัสผ่าน'}
                required={!editing}
                hint={editing ? 'เว้นว่างถ้าไม่เปลี่ยน' : null}
              >
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required={!editing}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 font-light"
                />
              </Field>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm font-light">{formError}</div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 -mx-5 px-5 -mb-5 pb-4 mt-4">
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
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
        {hint && <span className="ml-2 text-xs font-light text-slate-400">{hint}</span>}
      </label>
      {children}
    </div>
  )
}
