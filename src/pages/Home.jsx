import PageHeader from '../components/PageHeader.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function Home() {
  const { user } = useAuth()

  const stats = [
    { label: 'BOOKING',  value: '—' },
    { label: 'VOUCHER',  value: '—' },
    { label: 'INVOICE',  value: '—' },
    { label: 'PAYMENT',  value: '—' },
  ]

  return (
    <div>
      <PageHeader title="HOME" subtitle={`ผู้ใช้: ${user?.full_name || user?.username}`} />

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded border border-slate-200 px-4 py-3">
              <div className="text-xs font-medium text-slate-500">{s.label}</div>
              <div className="text-2xl font-medium text-slate-800 mt-1">{s.value}</div>
              <div className="text-xs font-light text-slate-400 mt-0.5">กำลังพัฒนา</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded border border-slate-200 p-6">
          <div className="text-sm font-medium text-slate-700 mb-2">ภาพรวมระบบ</div>
          <p className="text-sm font-light text-slate-500 leading-relaxed">
            ระบบหลังบ้านสำหรับจัดการการจอง / Voucher / Invoice / Payment ของ SamuiLook Inbound
            ปัจจุบันเปิดใช้งาน Login และเมนู USERS MANAGEMENT แล้ว เมนูอื่นอยู่ระหว่างพัฒนา
          </p>
        </div>
      </div>
    </div>
  )
}
