'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { Building2, Menu, LogOut, User, RefreshCw, AlertTriangle, Plus, X } from 'lucide-react'
import { ApiService } from '@/services/apiService'
import { Renter, DashboardSummary } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { billCache } from '@/utils/billCache'

import { MetricsHeader } from './dashboard/MetricsHeader'
import { DashboardFilters, DashboardViewMode } from './dashboard/DashboardFilters'
import AddRenterModal from './AddRenterModal'
import RenterCard from './RenterCard'
import RenterProfile from './RenterProfile'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [testDate] = useState<Date>(new Date())
  const [renters, setRenters] = useState<Renter[]>([])
  const [archivedRenters, setArchivedRenters] = useState<Renter[]>([])
  const [metrics, setMetrics] = useState({
    totalRenters: 0,
    totalMonthlyRent: 0,
    pendingAmount: 0,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [viewMode, setViewMode] = useState<DashboardViewMode>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRenter, setSelectedRenter] = useState<Renter | null>(null)

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const summary = await ApiService.getDashboardSummary()

      setRenters(summary.active_renters || [])
      setArchivedRenters(summary.archived_renters || [])
      setMetrics({
        totalRenters: summary.metrics.total_renters || 0,
        totalMonthlyRent: summary.metrics.total_monthly_rent || 0,
        pendingAmount: summary.metrics.pending_amount || 0,
      })

      // Background preload bills for active renters
      ;(summary.active_renters || []).forEach(async (renter) => {
        try {
          const bills = await ApiService.getAllBills(renter.id)
          billCache.populateFromBulk(renter.id, bills)
        } catch {
          // Ignore background cache preload errors
        }
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setLoadError(error instanceof Error ? error.message : 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Tenant lifecycle operations
  const handleArchiveRenter = async (renterId: string) => {
    try {
      await ApiService.setRenterActive(renterId, false)
      await loadDashboardData()
      if (selectedRenter?.id === Number(renterId)) {
        setSelectedRenter(null)
      }
    } catch (error) {
      console.error('Error archiving renter:', error)
      alert('Failed to archive renter.')
    }
  }

  const handleUnarchiveRenter = async (renterId: string) => {
    try {
      await ApiService.setRenterActive(renterId, true)
      await loadDashboardData()
      if (selectedRenter?.id === Number(renterId)) {
        setSelectedRenter(null)
      }
    } catch (error) {
      console.error('Error unarchiving renter:', error)
      alert('Failed to unarchive renter.')
    }
  }

  const handleDeleteRenter = async (renterId: string) => {
    try {
      await ApiService.deleteRenter(renterId)
      await loadDashboardData()
      if (selectedRenter?.id === Number(renterId)) {
        setSelectedRenter(null)
      }
    } catch (error) {
      console.error('Error deleting renter:', error)
      alert('Failed to delete renter.')
    }
  }

  // Filtered Renter List
  const displayedRenters = useMemo(() => {
    let list: Renter[] = []
    if (viewMode === 'active') list = renters
    else if (viewMode === 'archived') list = archivedRenters
    else list = [...renters, ...archivedRenters]

    if (!searchQuery.trim()) return list

    const q = searchQuery.toLowerCase()
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.property_address && r.property_address.toLowerCase().includes(q)) ||
        (r.phone && r.phone.includes(q))
    )
  }, [viewMode, renters, archivedRenters, searchQuery])

  // If a renter profile is selected, render full profile view
  if (selectedRenter) {
    return (
      <RenterProfile
        renter={selectedRenter}
        onClose={() => setSelectedRenter(null)}
        onArchive={handleArchiveRenter}
        onUnarchive={handleUnarchiveRenter}
        onDelete={handleDeleteRenter}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 -ml-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                  RentNeon
                </h1>
                <span className="text-[10px] text-gray-500 font-medium">Rental Management</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-7 h-7 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              <span className="text-xs font-semibold text-gray-700 max-w-[120px] truncate">
                {user?.name || user?.email || 'Owner'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Error Retry Banner */}
        {loadError && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-red-800 text-sm">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{loadError}</span>
            </div>
            <button
              onClick={loadDashboardData}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Analytics & Metrics Header */}
        <MetricsHeader
          totalRenters={metrics.totalRenters}
          totalMonthlyRent={metrics.totalMonthlyRent}
          pendingAmount={metrics.pendingAmount}
          selectedDate={testDate}
          onAddRenter={() => setShowAddModal(true)}
        />

        {/* Search & Active/Archived Tabs */}
        <DashboardFilters
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          activeCount={renters.length}
          archivedCount={archivedRenters.length}
        />

        {/* Tenant Cards Grid */}
        {isLoading && renters.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse space-y-4"
              >
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-8 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : displayedRenters.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No tenants found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No tenants match "${searchQuery}". Try clearing the search bar.`
                : 'Get started by adding your first property tenant to track rent & utility bills.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Tenant Now
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedRenters.map((renter) => (
              <RenterCard
                key={renter.id}
                renter={renter}
                onClick={() => setSelectedRenter(renter)}
                onArchive={handleArchiveRenter}
                onUnarchive={handleUnarchiveRenter}
                onDelete={handleDeleteRenter}
              />
            ))}
          </div>
        )}
      </main>

      {/* Slide-over Sidebar */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setShowSidebar(false)}
          />
          <div className="relative w-72 max-w-xs bg-white h-full shadow-2xl p-6 flex flex-col justify-between z-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-blue-600" />
                  <span className="font-bold text-gray-900 text-lg">RentNeon</span>
                </div>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Signed In As</p>
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'Property Landlord'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Renter Modal */}
      {showAddModal && (
        <AddRenterModal
          onClose={() => setShowAddModal(false)}
          onRenterAdded={() => {
            setShowAddModal(false)
            loadDashboardData()
          }}
        />
      )}
    </div>
  )
}