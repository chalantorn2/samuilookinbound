import PageHeader from './PageHeader.jsx'

export default function UnderDevelopment({ title }) {
  return (
    <div>
      <PageHeader title={title} />
      <div className="p-6">
        <div className="bg-white rounded border border-slate-200 px-6 py-12 text-center">
          <div className="text-base font-medium text-slate-700">กำลังพัฒนา</div>
          <p className="text-sm font-light text-slate-500 mt-1">
            หน้านี้ยังไม่พร้อมให้ใช้งาน
          </p>
        </div>
      </div>
    </div>
  )
}
