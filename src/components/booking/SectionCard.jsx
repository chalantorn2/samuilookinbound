/** กล่อง section พร้อม header สีฟ้า (ตาม mockup หน้า 3) */
export default function SectionCard({ title, action, children, footer }) {
  return (
    <section className="bg-white border border-slate-200 rounded">
      <header className="px-4 py-2 bg-brand-700 border-b border-brand-800 rounded-t flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
      {footer && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-sm">
          {footer}
        </div>
      )}
    </section>
  );
}
