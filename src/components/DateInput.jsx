import { useState } from 'react'

const DATE_RE = /^\d{2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2}$/

export default function DateInput({ value, onChange, className = '', placeholder = '16MAY26', ...rest }) {
  const [touched, setTouched] = useState(false)
  const v = value || ''
  const invalid = touched && v !== '' && !DATE_RE.test(v)

  const handleChange = (e) => {
    const raw = e.target.value
    const filtered = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 7)
    onChange(filtered)
  }

  return (
    <input
      type="text"
      value={v}
      onChange={handleChange}
      onBlur={() => setTouched(true)}
      maxLength={7}
      placeholder={placeholder}
      title={invalid ? 'รูปแบบที่ถูกต้อง: 16MAY26 (วัน 2 หลัก + เดือน 3 ตัวอักษร + ปี 2 หลัก)' : undefined}
      className={`${className} placeholder:text-slate-300 placeholder:font-light ${invalid ? '!border-red-400 !ring-1 !ring-red-400' : ''}`}
      {...rest}
    />
  )
}
