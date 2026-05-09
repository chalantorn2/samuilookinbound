import { useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import CrudTable from '../components/CrudTable.jsx'

const TABS = [
  { id: 'customers', label: 'Customers' },
  { id: 'places',    label: 'Places' },
  { id: 'flights',   label: 'Flights' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'tours',     label: 'Tours' },
]

const PLACE_TYPES = [
  { value: 'hotel',   label: 'Hotel' },
  { value: 'airport', label: 'Airport' },
  { value: 'pier',    label: 'Pier' },
  { value: 'place',   label: 'Place' },
  { value: 'other',   label: 'Other' },
]

const SUPPLIER_TYPES = [
  { value: 'transfer', label: 'Transfer' },
  { value: 'boat',     label: 'Boat' },
  { value: 'tour',     label: 'Tour' },
  { value: 'hotel',    label: 'Hotel' },
  { value: 'agent',    label: 'Agent' },
  { value: 'other',    label: 'Other' },
]

const SCHEMAS = {
  customers: {
    endpoint: '/customers.php',
    searchKeys: ['code', 'name'],
    searchPlaceholder: 'ค้นหา code / ชื่อลูกค้า',
    columns: [
      { key: 'code',  label: 'Code', width: '12%' },
      { key: 'name',  label: 'ชื่อลูกค้า' },
      { key: 'email', label: 'อีเมล', width: '25%' },
      { key: 'phone', label: 'เบอร์โทร', width: '15%' },
    ],
    fields: [
      { key: 'code',  label: 'Code', required: true, placeholder: 'CCOVE', maxLength: 5, minLength: 5, uppercase: true, colSpan: 4 },
      { key: 'name',  label: 'ชื่อลูกค้า', required: true, placeholder: 'CHAWENG COVE RESOTEL CO.,LTD.', colSpan: 10 },
      { key: 'email', label: 'อีเมล', type: 'email', placeholder: 'contact@example.com' },
      { key: 'phone', label: 'เบอร์โทร', type: 'tel', placeholder: '077-123-456' },
    ],
    emptyForm: { code: '', name: '', email: '', phone: '' },
    labels: {
      addBtn: 'เพิ่มลูกค้า',
      modalCreate: 'เพิ่มลูกค้าใหม่',
      modalEdit: 'แก้ไขลูกค้า',
      deleteConfirm: (r) => `ลบลูกค้า "${r.name}" ?`,
    },
  },

  places: {
    endpoint: '/places.php',
    searchKeys: ['name', 'location'],
    searchPlaceholder: 'ค้นหาชื่อสถานที่ / ตำแหน่ง',
    columns: [
      { key: 'name', label: 'ชื่อสถานที่' },
      { key: 'type', label: 'Type', width: '15%', render: (r) => <TypeBadge value={r.type} /> },
      { key: 'phone', label: 'Phone', width: '15%' },
      { key: 'location', label: 'Map', width: '8%', render: (r) => <MapLink url={r.location} /> },
    ],
    fields: [
      { key: 'name',     label: 'ชื่อสถานที่', required: true, placeholder: 'CHAWENG NOI POOL VILLA', colSpan: 10 },
      { key: 'type',     label: 'Type', type: 'select', required: true, options: PLACE_TYPES, colSpan: 4 },
      { key: 'phone',    label: 'Phone', type: 'tel', placeholder: '077-123-456' },
      { key: 'location', label: 'Location (Google Maps URL)', type: 'url', placeholder: 'https://maps.app.goo.gl/...' },
    ],
    emptyForm: { name: '', type: 'place', phone: '', location: '' },
    labels: {
      addBtn: 'เพิ่มสถานที่',
      modalCreate: 'เพิ่มสถานที่ใหม่',
      modalEdit: 'แก้ไขสถานที่',
      deleteConfirm: (r) => `ลบสถานที่ "${r.name}" ?`,
    },
  },

  flights: {
    endpoint: '/flights.php',
    searchKeys: ['flight_no', 'origin', 'destination', 'airline'],
    searchPlaceholder: 'ค้นหา flight no / route / สายการบิน',
    columns: [
      { key: 'flight_no', label: 'Flight No', width: '15%' },
      { key: 'route',     label: 'Route', width: '15%', render: (r) => `${r.origin || '-'} → ${r.destination || '-'}` },
      { key: 'dep_time',  label: 'Dep', width: '10%', render: (r) => r.dep_time?.slice(0, 5) || '-' },
      { key: 'arr_time',  label: 'Arr', width: '10%', render: (r) => r.arr_time?.slice(0, 5) || '-' },
      { key: 'airline',   label: 'Airline' },
    ],
    fields: [
      { key: 'flight_no',   label: 'Flight No',   required: true, placeholder: 'SQ8340', uppercase: true, colSpan: 4 },
      { key: 'origin',      label: 'ต้นทาง',      required: true, placeholder: 'SIN', uppercase: true, maxLength: 10, colSpan: 5 },
      { key: 'destination', label: 'ปลายทาง',    required: true, placeholder: 'USM', uppercase: true, maxLength: 10, colSpan: 5 },
      { key: 'airline',     label: 'Airline',     placeholder: 'Singapore Airlines', colSpan: 6 },
      { key: 'dep_time',    label: 'Departure',   type: 'time', colSpan: 4 },
      { key: 'arr_time',    label: 'Arrival',     type: 'time', colSpan: 4 },
    ],
    emptyForm: { flight_no: '', origin: '', destination: '', dep_time: '', arr_time: '', airline: '' },
    labels: {
      addBtn: 'เพิ่ม Flight',
      modalCreate: 'เพิ่ม Flight ใหม่',
      modalEdit: 'แก้ไข Flight',
      deleteConfirm: (r) => `ลบ flight "${r.flight_no}" ?`,
    },
  },

  suppliers: {
    endpoint: '/suppliers.php',
    searchKeys: ['code', 'name'],
    searchPlaceholder: 'ค้นหา code / ชื่อ supplier',
    columns: [
      { key: 'code', label: 'Code', width: '12%' },
      { key: 'name', label: 'ชื่อ Supplier' },
      { key: 'type', label: 'Type', width: '15%', render: (r) => <TypeBadge value={r.type} /> },
    ],
    fields: [
      { key: 'code', label: 'Code', required: true, placeholder: 'SUNTR', maxLength: 5, minLength: 5, uppercase: true, colSpan: 3 },
      { key: 'name', label: 'ชื่อ Supplier', required: true, placeholder: 'Sun Transfer', colSpan: 7 },
      { key: 'type', label: 'Type', type: 'select', required: true, options: SUPPLIER_TYPES, colSpan: 4 },
    ],
    emptyForm: { code: '', name: '', type: 'other' },
    labels: {
      addBtn: 'เพิ่ม Supplier',
      modalCreate: 'เพิ่ม Supplier ใหม่',
      modalEdit: 'แก้ไข Supplier',
      deleteConfirm: (r) => `ลบ supplier "${r.code}" ?`,
    },
  },

  tours: {
    endpoint: '/tours.php',
    searchKeys: ['name', 'description'],
    searchPlaceholder: 'ค้นหาชื่อทัวร์ / คำอธิบาย',
    columns: [
      { key: 'name', label: 'ชื่อทัวร์', width: '30%' },
      { key: 'description', label: 'คำอธิบาย' },
    ],
    fields: [
      { key: 'name', label: 'ชื่อทัวร์', required: true, colSpan: 'full', placeholder: 'Safari Tour' },
      { key: 'description', label: 'คำอธิบาย', type: 'textarea', colSpan: 'full', rows: 3 },
    ],
    emptyForm: { name: '', description: '' },
    labels: {
      addBtn: 'เพิ่มทัวร์',
      modalCreate: 'เพิ่มทัวร์ใหม่',
      modalEdit: 'แก้ไขทัวร์',
      deleteConfirm: (r) => `ลบทัวร์ "${r.name}" ?`,
    },
  },
}

export default function Information() {
  const [active, setActive] = useState('customers')
  const schema = SCHEMAS[active]

  return (
    <div>
      <PageHeader title="INFORMATION" subtitle="ข้อมูลตั้งต้นที่ใช้ซ้ำในระบบ" />

      <div className="px-6 pt-4">
        <div className="bg-white border border-slate-200 rounded-t border-b-0">
          <nav className="flex gap-1 px-2 pt-2" aria-label="Information tabs">
            {TABS.map(tab => {
              const isActive = tab.id === active
              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  className={`px-4 py-2 text-sm rounded-t border border-b-0 -mb-px transition ${
                    isActive
                      ? 'bg-white border-slate-200 text-brand-700 font-medium'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 font-light'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="px-6 pb-6">
        <CrudTable key={active} {...schema} />
      </div>
    </div>
  )
}

function TypeBadge({ value }) {
  if (!value) return <span className="text-slate-400">-</span>
  return (
    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
      {value}
    </span>
  )
}

function MapLink({ url }) {
  if (!url) return <span className="text-slate-400">-</span>
  const isUrl = /^https?:\/\//i.test(url)
  if (!isUrl) {
    return <span className="text-slate-600 text-xs truncate block max-w-[160px]" title={url}>{url}</span>
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="เปิดแผนที่"
      className="inline-flex items-center justify-center w-7 h-7 rounded text-brand-700 hover:bg-brand-50 hover:text-brand-900"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    </a>
  )
}
