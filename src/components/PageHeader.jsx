export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
      <div className="leading-tight">
        <h1 className="text-base font-medium text-slate-800">{title}</h1>
        {subtitle && <p className="text-xs font-light text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
