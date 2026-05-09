import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../lib/api'

/**
 * Autocomplete dropdown ที่ดึงข้อมูลจาก master endpoint
 *
 * Props:
 *   endpoint     string  — เช่น "/places.php"
 *   queryParams  object  — เช่น { type: 'hotel' } จะแนบเป็น ?type=hotel
 *   value        string  — ค่าปัจจุบัน (text ที่ user เห็น)
 *   onChange(value)      — เมื่อ user พิมพ์ (ไม่ได้เลือก option)
 *   onSelect(item)       — เมื่อ user คลิก option (ส่ง item เต็มก้อน)
 *   displayKey   string  — field ของ master ที่จะแสดง (default 'name')
 *   secondaryKey string  — field รอง (แสดงตัวจางๆ)
 *   placeholder  string
 *   required     boolean
 *   className    string
 */
export default function Autocomplete({
  endpoint,
  queryParams = {},
  value,
  onChange,
  onSelect,
  displayKey = 'name',
  secondaryKey = null,
  placeholder = '',
  required = false,
  className = '',
  inputClassName = '',
}) {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const [rect, setRect] = useState(null)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  const qs = new URLSearchParams(queryParams).toString()
  const url = qs ? `${endpoint}?${qs}` : endpoint

  // โหลดข้อมูลครั้งแรก (เพื่อให้ filter ฝั่ง client เร็ว)
  useEffect(() => {
    let cancelled = false
    api.get(url).then(
      (res) => { if (!cancelled) setItems(res.items || []) },
      () => { /* silent */ },
    )
    return () => { cancelled = true }
  }, [url])

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  // คำนวณตำแหน่ง dropdown ตอนเปิด + เมื่อ scroll/resize
  useLayoutEffect(() => {
    if (!open) return
    const updateRect = () => {
      if (inputRef.current) {
        const r = inputRef.current.getBoundingClientRect()
        setRect({ top: r.bottom, left: r.left, width: r.width })
      }
    }
    updateRect()
    window.addEventListener('scroll', updateRect, true)
    window.addEventListener('resize', updateRect)
    return () => {
      window.removeEventListener('scroll', updateRect, true)
      window.removeEventListener('resize', updateRect)
    }
  }, [open])

  const q = (value || '').trim().toLowerCase()
  const filtered = q
    ? items.filter(it =>
        String(it[displayKey] ?? '').toLowerCase().includes(q) ||
        (secondaryKey && String(it[secondaryKey] ?? '').toLowerCase().includes(q))
      )
    : items
  const visible = filtered.slice(0, 30)

  const choose = (item) => {
    onSelect?.(item)
    setOpen(false)
    setHighlight(-1)
  }

  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true); setHighlight(0); e.preventDefault()
      }
      return
    }
    if (e.key === 'ArrowDown') {
      setHighlight(h => Math.min(h + 1, visible.length - 1)); e.preventDefault()
    } else if (e.key === 'ArrowUp') {
      setHighlight(h => Math.max(h - 1, 0)); e.preventDefault()
    } else if (e.key === 'Enter' && highlight >= 0 && visible[highlight]) {
      choose(visible[highlight]); e.preventDefault()
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const dropdown = open && visible.length > 0 && rect && createPortal(
    <ul
      style={{ position: 'fixed', top: rect.top + 4, left: rect.left, width: rect.width, zIndex: 9999 }}
      className="max-h-56 overflow-auto bg-white border border-slate-200 rounded shadow-lg text-sm"
      onMouseDown={(e) => e.preventDefault()}
    >
      {visible.map((it, i) => {
        const isHi = i === highlight
        return (
          <li
            key={it.id}
            onMouseDown={(e) => { e.preventDefault(); choose(it) }}
            onMouseEnter={() => setHighlight(i)}
            className={`px-3 py-1.5 cursor-pointer flex items-baseline justify-between gap-2 ${
              isHi ? 'bg-brand-50 text-brand-800' : 'hover:bg-slate-50'
            }`}
          >
            <span className="font-normal text-slate-800">{it[displayKey]}</span>
            {secondaryKey && it[secondaryKey] && (
              <span className="text-xs font-normal text-slate-400">{it[secondaryKey]}</span>
            )}
          </li>
        )
      })}
    </ul>,
    document.body,
  )

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value || ''}
        onChange={(e) => { onChange?.(e.target.value); setOpen(true); setHighlight(-1) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        required={required}
        className={inputClassName || "w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 font-normal"}
      />
      {dropdown}
    </div>
  )
}
