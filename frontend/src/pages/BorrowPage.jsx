import { CheckCircle2, Handshake, Save } from 'lucide-react'
import { useState } from 'react'

import { api } from '../api/client.js'
import { borrowStatuses } from '../api/options.js'
import { EmptyState } from '../components/EmptyState.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

const initialForm = {
  license: '',
  borrower: '',
  borrower_department: '',
  purpose: '',
  borrow_date: '',
  expected_return_date: '',
  actual_return_date: '',
  status: 'borrowed',
  notes: '',
}

export function BorrowPage({ licenses, borrowRecords, reload, notify }) {
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, license: Number(form.license) }
      if (!payload.actual_return_date) {
        payload.actual_return_date = null
      }
      await api.createBorrowRecord(payload)
      setForm(initialForm)
      await reload()
      notify('借出记录已保存')
    } catch (error) {
      notify(error.message)
    } finally {
      setSaving(false)
    }
  }

  const markReturned = async (record) => {
    const today = new Date().toISOString().slice(0, 10)
    try {
      await api.updateBorrowRecord(record.id, {
        license: record.license,
        borrower: record.borrower,
        borrower_department: record.borrower_department,
        purpose: record.purpose,
        borrow_date: record.borrow_date,
        expected_return_date: record.expected_return_date,
        actual_return_date: today,
        status: 'returned',
        notes: record.notes,
      })
      await reload()
      notify('已登记归还')
    } catch (error) {
      notify(error.message)
    }
  }

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Borrowing</p>
          <h1>证照借出归还记录</h1>
        </div>
      </div>

      <div className="content-grid form-and-table">
        <form className="panel form-panel" onSubmit={submit}>
          <div className="panel-title">
            <Handshake size={18} />
            <h2>登记借出</h2>
          </div>
          <div className="form-grid">
            <label className="field full">
              <span>证照</span>
              <select value={form.license} onChange={(event) => setField('license', event.target.value)} required>
                <option value="">选择证照</option>
                {licenses.map((license) => (
                  <option key={license.id} value={license.id}>
                    {license.name} / {license.license_no}
                  </option>
                ))}
              </select>
            </label>
            <Field label="借用人" value={form.borrower} onChange={(value) => setField('borrower', value)} required />
            <Field label="借用部门" value={form.borrower_department} onChange={(value) => setField('borrower_department', value)} required />
            <Field label="借出日期" type="date" value={form.borrow_date} onChange={(value) => setField('borrow_date', value)} required />
            <Field label="预计归还" type="date" value={form.expected_return_date} onChange={(value) => setField('expected_return_date', value)} required />
            <label className="field">
              <span>状态</span>
              <select value={form.status} onChange={(event) => setField('status', event.target.value)}>
                {borrowStatuses.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <Field label="用途" value={form.purpose} onChange={(value) => setField('purpose', value)} required />
            <Field label="实际归还" type="date" value={form.actual_return_date} onChange={(value) => setField('actual_return_date', value)} />
          </div>
          <label className="field full">
            <span>备注</span>
            <textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} />
          </label>
          <button className="primary-button" disabled={saving} type="submit">
            <Save size={17} />
            <span>{saving ? '保存中' : '保存记录'}</span>
          </button>
        </form>

        <div className="panel table-panel">
          {borrowRecords.length ? (
            <div className="data-table">
              <div className="table-head borrow-row">
                <span>证照</span>
                <span>借用人</span>
                <span>预计归还</span>
                <span>状态</span>
                <span>操作</span>
              </div>
              {borrowRecords.map((record) => (
                <div className="table-row borrow-row" key={record.id}>
                  <div>
                    <strong>{record.license_name}</strong>
                    <span>{record.purpose}</span>
                  </div>
                  <span>{record.borrower}</span>
                  <span>{record.expected_return_date}</span>
                  <StatusBadge status={record.computed_status} />
                  {record.computed_status === 'returned' ? (
                    <span className="muted">{record.actual_return_date}</span>
                  ) : (
                    <button className="ghost-button" type="button" onClick={() => markReturned(record)} title="登记归还">
                      <CheckCircle2 size={16} />
                      <span>归还</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="暂无借还记录" description="借出证照后会在这里跟踪归还状态。" />
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
