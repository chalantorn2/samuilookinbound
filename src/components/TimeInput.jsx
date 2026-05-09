import { useState } from 'react'

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export default function TimeInput({ value, onChange, className = '', placeholder = '12:30', ...rest }) {
  const [touched, setTouched] = useState(false)
  const v = value || ''
  const invalid = touched && v !== '' && !TIME_RE.test(v)

  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
    const formatted = digits.length >= 3
      ? digits.slice(0, 2) + ':' + digits.slice(2)
      : digits
    onChange(formatted)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={v}
      onChange={handleChange}
      onBlur={() => setTouched(true)}
      maxLength={5}
      placeholder={placeholder}
      title={invalid ? 'รูปแบบที่ถูกต้อง: HH:MM (เช่น 12:30)' : undefined}
      className={`${className} placeholder:text-slate-300 placeholder:font-light ${invalid ? '!border-red-400 !ring-1 !ring-red-400' : ''}`}
      {...rest}
    />
  )
}
