import { ArrowLeft, CalendarDays, FileText, History, RefreshCw, ShieldAlert, Timer, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { api } from '../api/client.js'
import { EmptyState } from '../components/EmptyState.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

const categoryStyles = {
  info: { color: '#1d4ed8', bg: '#dbeafe', label: '创建' },
  status: { color: '#7c3aed', bg: '#ede9fe', label: '状态' },
  update: { color: '#0369a1', bg: '#e0f2fe', label: '修改' },
  borrow: { color: '#b45309', bg: '#fef3c7', label: '借出' },
  return: { color: '#166534', bg: '#dcfce7', label: '归还' },
  warning: { color: '#991b1b', bg: '#fee2e2', label: '逾期' },
}

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function LicenseDetailPage({ licenseId, onBack, reloadAll, notify }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('timeline')

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.getLicense(licenseId)
      setDetail(data)
    } catch (error) {
      notify(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [licenseId])

  const handleRefresh = async () => {
    await load()
    await reloadAll()
  }

  const expiryBadge = useMemo(() => {
    if (!detail?.expiry_status) return null
    const { level, label } = detail.expiry_status
    const style =
      level === 'expired'
        ? { color: '#991b1b', bg: '#fee2e2' }
        : level === 'expiring'
          ? { color: '#92400e', bg: '#fef3c7' }
          : { color: '#166534', bg: '#dcfce7' }
    return (
      <span className="expiry-badge" style={{ color: style.color, background: style.bg }}>
        {label}
      </span>
    )
  }, [detail])

  if (loading) {
    return (
      <section className="page-stack">
        <div className="page-header">
          <div>
            <button className="link-button" type="button" onClick={onBack}>
              <ArrowLeft size={16} />
              <span>返回证照列表</span>
            </button>
            <p className="eyebrow" style={{ marginTop: 10 }}>
              License Detail
            </p>
            <h1>证照详情</h1>
          </div>
        </div>
        <div className="panel skeleton-list" />
      </section>
    )
  }

  if (!detail) {
    return (
      <section className="page-stack">
        <div className="page-header">
          <div>
            <button className="link-button" type="button" onClick={onBack}>
              <ArrowLeft size={16} />
              <span>返回证照列表</span>
            </button>
          </div>
        </div>
        <EmptyState title="证照不存在" description="可能已被删除。" />
      </section>
    )
  }

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <button className="link-button" type="button" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>返回证照列表</span>
          </button>
          <p className="eyebrow" style={{ marginTop: 10 }}>
            License Detail
          </p>
          <div className="detail-title-row">
            <h1>{detail.name}</h1>
            <StatusBadge status={detail.computed_status || detail.status} />
            {expiryBadge}
          </div>
          <p className="muted" style={{ marginTop: 6 }}>
            编号 {detail.license_no} · {detail.license_type_display}
          </p>
        </div>
        <button className="icon-button" type="button" onClick={handleRefresh} title="刷新">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="detail-grid">
        <div className="panel info-panel">
          <div className="panel-title">
            <FileText size={18} />
            <h2>基本信息</h2>
          </div>
          <dl className="info-list">
            <InfoRow label="证照名称" value={detail.name} />
            <InfoRow label="证照编号" value={detail.license_no} />
            <InfoRow label="证照类型" value={detail.license_type_display} />
            <InfoRow label="发证机关" value={detail.issuing_authority} />
            <InfoRow label="归属部门" value={detail.owner_department} />
            <InfoRow label="保管人" value={detail.keeper || '—'} />
            <InfoRow label="发证日期" value={formatDate(detail.issue_date)} />
            <InfoRow label="到期日期" value={formatDate(detail.expiry_date)} />
            <InfoRow label="提前提醒" value={`${detail.reminder_days} 天`} />
            <InfoRow label="当前状态" value={<StatusBadge status={detail.computed_status || detail.status} />} />
            <InfoRow label="到期状态" value={expiryBadge || '—'} />
            {detail.notes ? <InfoRow label="备注" value={detail.notes} full /> : null}
          </dl>
        </div>

        <div className="panel expiry-panel">
          <div className="panel-title">
            <Timer size={18} />
            <h2>到期监控</h2>
          </div>
          <div className="expiry-metric">
            <div className={`expiry-count expiry-${detail.expiry_status?.level || 'normal'}`}>
              {detail.expiry_status?.days}
              <span>天</span>
            </div>
            <div className="muted">距离到期</div>
          </div>
          <div className="expiry-info">
            <div className="expiry-info-row">
              <CalendarDays size={15} />
              <span>到期日期：{formatDate(detail.expiry_date)}</span>
            </div>
            <div className="expiry-info-row">
              <ShieldAlert size={15} />
              <span>提醒阈值：提前 {detail.reminder_days} 天</span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel tabs-panel">
        <div className="tabs">
          <TabButton
            active={activeTab === 'timeline'}
            onClick={() => setActiveTab('timeline')}
            icon={History}
            label="时间线"
            count={detail.timeline?.length || 0}
          />
          <TabButton
            active={activeTab === 'borrows'}
            onClick={() => setActiveTab('borrows')}
            icon={UserRound}
            label="借还历史"
            count={detail.borrow_records?.length || 0}
          />
          <TabButton
            active={activeTab === 'changes'}
            onClick={() => setActiveTab('changes')}
            icon={FileText}
            label="变更记录"
            count={detail.changes?.length || 0}
          />
        </div>

        {activeTab === 'timeline' && <TimelineView events={detail.timeline || []} />}
        {activeTab === 'borrows' && <BorrowHistoryView records={detail.borrow_records || []} />}
        {activeTab === 'changes' && <ChangeLogView changes={detail.changes || []} />}
      </div>
    </section>
  )
}

function InfoRow({ label, value, full = false }) {
  return (
    <div className={`info-row ${full ? 'full' : ''}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      type="button"
      className={`tab-button ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      <Icon size={16} />
      <span>{label}</span>
      {count != null && <span className="tab-count">{count}</span>}
    </button>
  )
}

function TimelineView({ events }) {
  if (!events.length) {
    return <EmptyState title="暂无时间线记录" description="时间线会展示证照创建、修改、借还等所有操作。" />
  }
  return (
    <ol className="timeline">
      {events.map((event) => {
        const style = categoryStyles[event.category] || categoryStyles.info
        return (
          <li className="timeline-item" key={event.id}>
            <div className="timeline-dot" style={{ background: style.bg, borderColor: style.color }}>
              <span className="timeline-dot-inner" style={{ background: style.color }} />
            </div>
            <div className="timeline-content">
              <div className="timeline-head">
                <span className="timeline-tag" style={{ color: style.color, background: style.bg }}>
                  {event.type_display}
                </span>
                <span className="timeline-time">{formatDateTime(event.timestamp)}</span>
              </div>
              <div className="timeline-desc">{event.description}</div>
              {event.field_name && event.old_value !== undefined && (
                <div className="timeline-field">
                  <span className="timeline-old">{event.old_value || '（空）'}</span>
                  <span className="timeline-arrow">→</span>
                  <span className="timeline-new">{event.new_value || '（空）'}</span>
                </div>
              )}
              {event.operator && <div className="timeline-operator">操作人：{event.operator}</div>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function BorrowHistoryView({ records }) {
  if (!records.length) {
    return <EmptyState title="暂无借还记录" description="该证照尚未产生借还操作。" />
  }
  return (
    <div className="data-table">
      <div className="table-head borrow-row detail-borrow-row">
        <span>借用人 / 部门</span>
        <span>用途</span>
        <span>借出日期</span>
        <span>预计归还</span>
        <span>实际归还</span>
        <span>状态</span>
      </div>
      {records.map((record) => (
        <div className="table-row borrow-row detail-borrow-row" key={record.id}>
          <div>
            <strong>{record.borrower}</strong>
            <span>{record.borrower_department}</span>
          </div>
          <span>{record.purpose}</span>
          <span>{formatDate(record.borrow_date)}</span>
          <span>{formatDate(record.expected_return_date)}</span>
          <span>{formatDate(record.actual_return_date) || '—'}</span>
          <StatusBadge status={record.computed_status || record.status} />
        </div>
      ))}
    </div>
  )
}

function ChangeLogView({ changes }) {
  if (!changes.length) {
    return <EmptyState title="暂无变更记录" description="该证照尚未产生变更操作。" />
  }
  return (
    <div className="data-table">
      <div className="table-head change-row">
        <span>时间</span>
        <span>类型</span>
        <span>变更描述</span>
        <span>操作人</span>
      </div>
      {changes.map((change) => {
        const style = categoryStyles[{
          created: 'info',
          status_changed: 'status',
          field_changed: 'update',
          borrowed: 'borrow',
          returned: 'return',
        }[change.change_type] || 'info']
        return (
          <div className="table-row change-row" key={change.id}>
            <span>{formatDateTime(change.change_date)}</span>
            <span>
              <span className="change-tag" style={{ color: style.color, background: style.bg }}>
                {change.change_type_display}
              </span>
            </span>
            <div>
              <strong>{change.description}</strong>
              {change.field_name && (
                <span>
                  {change.old_value || '（空）'} → {change.new_value || '（空）'}
                </span>
              )}
            </div>
            <span>{change.operator || '系统'}</span>
          </div>
        )
      })}
    </div>
  )
}
