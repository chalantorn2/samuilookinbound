import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={from} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(username.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm bg-white rounded border border-slate-200 shadow-sm">
        <div className="px-6 pt-6 pb-4 border-b border-slate-200 flex items-center gap-3">
          <img src="/logo.png" alt="SamuiLook Inbound" className="h-9 w-9 object-contain" />
          <div className="leading-tight">
            <div className="text-base font-medium text-slate-800">SamuiLook Inbound</div>
            <div className="text-xs font-light text-slate-500">ระบบจัดการภายใน</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm font-light">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้ใช้</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
              className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 font-light"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 font-light"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-700 hover:bg-brand-800 text-white font-medium py-2 rounded transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  )
}
