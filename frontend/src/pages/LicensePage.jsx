import { Plus, RefreshCw, Save } from 'lucide-react'
import { useMemo, useState } from 'react'

import { api } from '../api/client.js'
import { licenseStatuses, licenseTypes } from '../api/options.js'
import { EmptyState } from '../components/EmptyState.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

const initialForm = {
  name: '',
  license_no: '',
  license_type: 'business',
  issuing_authority: '',
  owner_department: '',
  keeper: '',
  issue_date: '',
  expiry_date: '',
  reminder_days: 30,
  status: 'active',
  notes: '',
}

export function LicensePage({ licenses, reload, notify }) {
  const [form, setForm] = useState(initialForm)
  const [filters, setFilters] = useState({ search: '', status: '' })
  const [saving, setSaving] = useState(false)

  const filteredLicenses = useMemo(
    () =>
      licenses.filter((item) => {
        const keyword = filters.search.trim().toLowerCase()
        const matchKeyword =
          !keyword ||
          [item.name, item.license_no, item.issuing_authority, item.owner_department]
            .join(' ')
            .toLowerCase()
            .includes(keyword)
        const matchStatus = !filters.status || item.computed_status === filters.status || item.status === filters.status
        return matchKeyword && matchStatus
      }),
    [licenses, filters],
  )

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await api.createLicense(form)
      setForm(initialForm)
      await reload()
      notify('证照已录入')
    } catch (error) {
      notify(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">License Registry</p>
          <h1>证照录入与台账</h1>
        </div>
        <button className="icon-button" type="button" onClick={reload} title="刷新">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="content-grid form-and-table">
        <form className="panel form-panel" onSubmit={submit}>
          <div className="panel-title">
            <Plus size={18} />
            <h2>新增证照</h2>
          </div>
          <div className="form-grid">
            <Field label="证照名称" value={form.name} onChange={(value) => setField('name', value)} required />
            <Field label="证照编号" value={form.license_no} onChange={(value) => setField('license_no', value)} required />
            <SelectField label="证照类型" value={form.license_type} options={licenseTypes} onChange={(value) => setField('license_type', value)} />
            <Field label="发证机关" value={form.issuing_authority} onChange={(value) => setField('issuing_authority', value)} required />
            <Field label="归属部门" value={form.owner_department} onChange={(value) => setField('owner_department', value)} required />
            <Field label="保管人" value={form.keeper} onChange={(value) => setField('keeper', value)} />
            <Field label="发证日期" type="date" value={form.issue_date} onChange={(value) => setField('issue_date', value)} required />
            <Field label="到期日期" type="date" value={form.expiry_date} onChange={(value) => setField('expiry_date', value)} required />
            <Field label="提醒天数" type="number" value={form.reminder_days} onChange={(value) => setField('reminder_days', Number(value))} required />
            <SelectField label="状态" value={form.status} options={licenseStatuses} onChange={(value) => setField('status', value)} />
          </div>
          <label className="field full">
            <span>备注</span>
            <textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} />
          </label>
          <button className="primary-button" disabled={saving} type="submit">
            <Save size={17} />
            <span>{saving ? '保存中' : '保存证照'}</span>
          </button>
        </form>

        <div className="panel table-panel">
          <div className="table-toolbar">
            <input placeholder="搜索名称、编号、机关、部门" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">全部状态</option>
              {licenseStatuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          {filteredLicenses.length ? (
            <div className="data-table">
              <div className="table-head license-row">
                <span>证照</span>
                <span>部门</span>
                <span>到期</span>
                <span>状态</span>
              </div>
              {filteredLicenses.map((item) => (
                <div className="table-row license-row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.license_no}</span>
                  </div>
                  <span>{item.owner_department}</span>
                  <span>{item.expiry_date}</span>
                  <StatusBadge status={item.computed_status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="暂无证照" description="请先录入企业证照信息。" />
          )}
        </div>
      </div>
    </section>
  )
}

function Field({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  )
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  )
}
