import { BarChart3, ClipboardList, FileBadge2, Handshake, LayoutDashboard } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { api } from './api/client.js'
import { AppShell } from './components/AppShell.jsx'
import { Toast } from './components/Toast.jsx'
import { BorrowPage } from './pages/BorrowPage.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { LicenseDetailPage } from './pages/LicenseDetailPage.jsx'
import { LicensePage } from './pages/LicensePage.jsx'
import { StatsPage } from './pages/StatsPage.jsx'

const navItems = [
  { key: 'dashboard', label: '工作台', icon: LayoutDashboard },
  { key: 'licenses', label: '证照录入', icon: FileBadge2 },
  { key: 'borrows', label: '借出归还', icon: Handshake },
  { key: 'stats', label: '到期统计', icon: BarChart3 },
]

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [selectedLicenseId, setSelectedLicenseId] = useState(null)
  const [licenses, setLicenses] = useState([])
  const [borrowRecords, setBorrowRecords] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  const loadAll = async () => {
    setLoading(true)
    try {
      const [licenseData, borrowData, statsData] = await Promise.all([
        api.listLicenses(),
        api.listBorrowRecords(),
        api.stats(),
      ])
      setLicenses(licenseData.results || licenseData)
      setBorrowRecords(borrowData.results || borrowData)
      setStats(statsData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll().catch((error) => setToast(error.message))
  }, [])

  const openLicenseDetail = (id) => {
    setSelectedLicenseId(id)
  }

  const closeLicenseDetail = () => {
    setSelectedLicenseId(null)
  }

  const context = useMemo(
    () => ({
      licenses,
      borrowRecords,
      stats,
      loading,
      reload: loadAll,
      notify: setToast,
      openLicenseDetail,
    }),
    [licenses, borrowRecords, stats, loading],
  )

  let page
  if (selectedLicenseId) {
    page = (
      <LicenseDetailPage
        licenseId={selectedLicenseId}
        onBack={closeLicenseDetail}
        reloadAll={loadAll}
        notify={setToast}
      />
    )
  } else {
    page = {
      dashboard: <DashboardPage {...context} />,
      licenses: <LicensePage {...context} />,
      borrows: <BorrowPage {...context} />,
      stats: <StatsPage {...context} />,
    }[activePage]
  }

  return (
    <>
      <AppShell
        activePage={activePage}
        navItems={navItems}
        onNavigate={(key) => {
          setSelectedLicenseId(null)
          setActivePage(key)
        }}
        title="企业证照管理系统"
        subtitle="证照台账、到期提醒、借出归还与统计分析"
        headerIcon={ClipboardList}
      >
        {page}
      </AppShell>
      <Toast message={toast} onClose={() => setToast('')} />
    </>
  )
}
