import { useRef, useLayoutEffect } from 'react'

function formatWithCommas(v) {
  if (v === null || v === undefined || v === '') return ''
  const str = String(v)
  const [intPart, decPart] = str.split('.')
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decPart !== undefined ? `${formatted}.${decPart}` : formatted
}

export default function MoneyInput({ value, onChange, className = '', placeholder = '0.00', ...rest }) {
  const ref = useRef(null)
  const cursorRef = useRef(null)

  const handleChange = (e) => {
    const input = e.target
    const newDisplay = input.value
    const newRaw = newDisplay.replace(/,/g, '')

    if (newRaw !== '' && !/^\d*\.?\d*$/.test(newRaw)) return

    const cursorPos = input.selectionStart
    const charsBefore = newDisplay.slice(0, cursorPos).replace(/,/g, '').length

    cursorRef.current = charsBefore
    onChange(newRaw)
  }

  useLayoutEffect(() => {
    if (cursorRef.current === null || !ref.current) return
    const display = ref.current.value
    let count = 0
    let pos = 0
    while (pos < display.length && count < cursorRef.current) {
      if (display[pos] !== ',') count++
      pos++
    }
    ref.current.setSelectionRange(pos, pos)
    cursorRef.current = null
  })

  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      value={formatWithCommas(value)}
      onChange={handleChange}
      placeholder={placeholder}
      className={`${className} placeholder:text-slate-300 placeholder:font-light`}
      {...rest}
    />
  )
}
