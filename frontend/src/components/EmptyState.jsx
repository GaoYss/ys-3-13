import { Inbox } from 'lucide-react'

export function EmptyState({ title = '暂无数据', description = '录入后将在这里显示。' }) {
  return (
    <div className="empty-state">
      <Inbox size={28} />
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  )
}
