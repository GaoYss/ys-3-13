import { BarChart3, PieChart } from 'lucide-react'

import { licenseTypes } from '../api/options.js'
import { EmptyState } from '../components/EmptyState.jsx'
import { MetricCard } from '../components/MetricCard.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

export function StatsPage({ stats }) {
  const byType = stats?.by_type || {}
  const maxTypeCount = Math.max(1, ...Object.values(byType))

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Statistics</p>
          <h1>证照到期统计</h1>
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard label="有效证照" value={stats?.active_licenses} />
        <MetricCard label="即将到期" value={stats?.expiring_licenses} tone="warning" />
        <MetricCard label="已到期" value={stats?.expired_licenses} tone="danger" />
        <MetricCard label="借出中" value={stats?.borrowed_records} />
      </div>

      <div className="content-grid two-col">
        <div className="panel">
          <div className="panel-title">
            <PieChart size={18} />
            <h2>按类型统计</h2>
          </div>
          <div className="bar-list">
            {licenseTypes.map((type) => {
              const value = byType[type.value] || 0
              return (
                <div className="bar-row" key={type.value}>
                  <div>
                    <span>{type.label}</span>
                    <strong>{value}</strong>
                  </div>
                  <div className="bar-track">
                    <span style={{ width: `${(value / maxTypeCount) * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <BarChart3 size={18} />
            <h2>已到期清单</h2>
          </div>
          {stats?.expired?.length ? (
            <div className="record-list">
              {stats.expired.map((item) => (
                <div className="record-row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.owner_department}</span>
                  </div>
                  <div className="row-right">
                    <StatusBadge status="expired" />
                    <span>{item.expiry_date}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="暂无已到期证照" description="当前没有超过到期日的证照。" />
          )}
        </div>
      </div>
    </section>
  )
}
