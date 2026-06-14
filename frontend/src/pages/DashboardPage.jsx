import { CalendarClock, FileWarning, Handshake, TimerReset } from 'lucide-react'

import { EmptyState } from '../components/EmptyState.jsx'
import { MetricCard } from '../components/MetricCard.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

export function DashboardPage({ stats, loading }) {
  const upcoming = stats?.upcoming_expiries || []

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>证照风险工作台</h1>
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard label="证照总数" value={stats?.total_licenses} />
        <MetricCard label="即将到期" value={stats?.expiring_licenses} tone="warning" />
        <MetricCard label="已到期" value={stats?.expired_licenses} tone="danger" />
        <MetricCard label="逾期未还" value={stats?.overdue_returns} tone="danger" />
      </div>

      <div className="content-grid two-col">
        <div className="panel">
          <div className="panel-title">
            <CalendarClock size={18} />
            <h2>近期到期提醒</h2>
          </div>
          {loading ? (
            <div className="skeleton-list" />
          ) : upcoming.length ? (
            <div className="record-list">
              {upcoming.map((item) => (
                <div className="record-row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.issuing_authority}</span>
                  </div>
                  <div className="row-right">
                    <StatusBadge status={item.computed_status} />
                    <span>{item.days_until_expiry} 天</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="暂无到期提醒" description="当前证照没有进入提醒窗口。" />
          )}
        </div>

        <div className="panel checklist">
          <div className="panel-title">
            <TimerReset size={18} />
            <h2>日常管理重点</h2>
          </div>
          <div className="task-line">
            <FileWarning size={18} />
            <span>核对即将到期证照并准备续期材料</span>
          </div>
          <div className="task-line">
            <Handshake size={18} />
            <span>跟进借出中证照的预计归还时间</span>
          </div>
          <div className="task-line">
            <CalendarClock size={18} />
            <span>按部门维护保管人和发证机关信息</span>
          </div>
        </div>
      </div>
    </section>
  )
}
