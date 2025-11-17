'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar, Home, Users, IndianRupee, Receipt, Plus, Menu, LogOut, User, Archive } from 'lucide-react'
import { SupabaseService } from '@/services/supabaseService'
import { Renter } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { formatIndianCurrency } from '@/utils/formatters'
import AddRenterModal from './AddRenterModal'
import RenterCard from './RenterCard'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [testDate, setTestDate] = useState(new Date())
  const [renters, setRenters] = useState<Renter[]>([])
  const [totalRenters, setTotalRenters] = useState(0)
  const [totalMonthlyRent, setTotalMonthlyRent] = useState(0)
  const [pendingAmount, setPendingAmount] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [archivedRenters, setArchivedRenters] = useState<Renter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false)
  const [viewMode, setViewMode] = useState<'active' | 'archived' | 'all'>('active')
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [testDate])

  const loadDashboardData = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      // Use single getDashboardSummary call instead of multiple queries
      const summary = await SupabaseService.getDashboardSummary(testDate)

      console.log('Loaded dashboard summary:', summary)

      // Update all state from the single response
      setRenters(summary.active_renters)
      setArchivedRenters(summary.archived_renters)
      setTotalRenters(summary.metrics.total_renters)
      setTotalMonthlyRent(summary.metrics.total_monthly_rent)
      setPendingAmount(summary.metrics.pending_amount)

      console.log('Set metrics from server - renters:', summary.metrics.total_renters, 'total rent:', summary.metrics.total_monthly_rent)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setLoadError(error instanceof Error ? error.message : 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRenterAdded = () => {
    setShowAddModal(false)
    loadDashboardData() // Reload all data to get updated metrics
  }

  const handleArchiveRenter = async (renterId: string) => {
    try {
      console.log('Dashboard: Archiving renter with ID:', renterId)

      await SupabaseService.setRenterActive(renterId, false)
      console.log('Dashboard: Successfully archived renter')
      
      await loadDashboardData() // Reload all data to reflect the change
      console.log('Dashboard: Reloaded data after archiving')

      alert('Renter archived successfully!')
    } catch (error) {
      console.error('Dashboard: Error archiving renter:', error)
      alert('Failed to archive renter. Please try again.')
    }
  }

  const handleUnarchiveRenter = async (renterId: string) => {
    try {
      console.log('Dashboard: Unarchiving renter with ID:', renterId)

      await SupabaseService.setRenterActive(renterId, true)
      console.log('Dashboard: Successfully unarchived renter')
      
      await loadDashboardData() // Reload all data to reflect the change
      console.log('Dashboard: Reloaded data after unarchiving')

      alert('Renter unarchived successfully!')
    } catch (error) {
      console.error('Dashboard: Error unarchiving renter:', error)
      alert('Failed to unarchive renter. Please try again.')
    }
  }

  const handleDeleteRenter = async (renterId: string) => {
    if (window.confirm('Are you sure you want to delete this renter? This action cannot be undone.')) {
      try {
        console.log('Dashboard: Starting deletion for renter ID:', renterId)

        // Delete from database using SupabaseService
        await SupabaseService.deleteRenter(renterId)
        console.log('Dashboard: Successfully deleted renter from database')

        // Reload all data to reflect the change
        await loadDashboardData()
        console.log('Dashboard: Reloaded dashboard data after deletion')

        alert('Renter deleted successfully!')
      } catch (error) {
        console.error('Dashboard: Error deleting renter:', error)
        alert(`Failed to delete renter: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  // Get the current list of renters based on view mode
  const getCurrentRenters = () => {
    switch (viewMode) {
      case 'active':
        return renters
      case 'archived':
        return archivedRenters
      case 'all':
        return [...renters, ...archivedRenters]
      default:
        return renters
    }
  }

  const currentRenters = getCurrentRenters()

  // Retry handler for failed loads
  const handleRetry = () => {
    loadDashboardData()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-lg border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-xl">
                  <Home className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 font-poppins">Rent Manager</h1>
                  <p className="text-xs text-gray-500 font-medium">Property Management</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          {/* Skeleton for metrics */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="w-10 h-10 bg-gray-200 rounded-lg mb-3 animate-pulse"></div>
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          
          {/* Skeleton for renters */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state UI
  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-lg border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-xl">
                  <Home className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 font-poppins">Rent Manager</h1>
                  <p className="text-xs text-gray-500 font-medium">Property Management</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border border-red-200 p-8 sm:p-12 text-center shadow-lg">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Receipt className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 font-poppins">
              Failed to Load Dashboard
            </h3>
            <p className="text-gray-600 font-medium mb-6 max-w-md mx-auto">
              {loadError}
            </p>
            <button
              onClick={handleRetry}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Mobile-First Header */}
      <header className="bg-white shadow-lg border-b border-gray-100">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              {/* Hamburger Menu */}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <Menu className="h-6 w-6 text-gray-600" />
              </button>

              <div className="p-2 bg-blue-600 rounded-xl">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 font-poppins">Rent Manager</h1>
                <p className="text-xs text-gray-500 font-medium">Property Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium">Welcome, <span className="font-semibold text-gray-800">{user?.email}</span></span>
              </div>

              {/* Sign Out Icon */}
              <button
                onClick={async () => {
                  try {
                    console.log('Dashboard: Starting signout from header icon...')
                    console.log('Dashboard: Current user:', user?.email)
                    await signOut()
                    console.log('Dashboard: Signout completed from header icon')

                    // Force redirect to login by clearing localStorage and reloading
                    localStorage.clear()
                    window.location.href = '/'

                  } catch (error) {
                    console.error('Dashboard: Signout failed from header icon:', error)
                    alert('Signout failed. Please try again.')
                  }
                }}
                className="p-2 bg-red-100 hover:bg-red-200 rounded-xl transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Menu */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowSidebar(false)}
          />

          {/* Sidebar */}
          <div className="relative bg-white w-80 shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Menu</h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Menu className="h-5 w-5 text-gray-500 rotate-90" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-2">
              {/* View Mode Options */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setViewMode('active')
                    setShowSidebar(false)
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                    viewMode === 'active' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span className="font-medium">Active Renters</span>
                </button>

                <button
                  onClick={() => {
                    setViewMode('archived')
                    setShowSidebar(false)
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                    viewMode === 'archived' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Archive className="h-5 w-5" />
                  <span className="font-medium">Archived Renters</span>
                </button>

                <button
                  onClick={() => {
                    setViewMode('all')
                    setShowSidebar(false)
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                    viewMode === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">All Profiles</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        {/* Mobile-Optimized Dashboard Header */}
        {viewMode !== 'archived' && (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 font-poppins">Dashboard</h2>
              <p className="text-gray-600 font-medium mt-1">Manage your rental properties</p>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Test Date:</span>
              <input
                type="date"
                value={format(testDate, 'yyyy-MM-dd')}
                onChange={(e) => setTestDate(new Date(e.target.value))}
                className="text-sm font-semibold text-gray-900 bg-transparent border-none outline-none"
              />
            </div>
          </div>
        )}

        {/* Compact Horizontal Metrics Tiles */}
        {viewMode !== 'archived' && (
          <div className="grid grid-cols-3 gap-3 mb-8">
          <MetricTile
            title="Total Renters"
            value={totalRenters.toString()}
            icon={<Users className="h-4 w-4 text-blue-600" />}
            bgColor="bg-blue-50"
            textColor="text-blue-700"
          />
          <MetricTile
            title="Monthly Rent"
            value={formatIndianCurrency(totalMonthlyRent)}
            icon={<IndianRupee className="h-4 w-4 text-green-600" />}
            bgColor="bg-green-50"
            textColor="text-green-700"
          />
          <MetricTile
            title="Pending Amount"
            value={formatIndianCurrency(pendingAmount)}
            icon={<Receipt className="h-4 w-4 text-orange-600" />}
            bgColor="bg-orange-50"
            textColor="text-orange-700"
          />
          </div>
        )}

        {/* Your Renters Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900 font-poppins">
              {viewMode === 'active' && 'Your Renters'}
              {viewMode === 'archived' && 'Archived Renters'}
              {viewMode === 'all' && 'All Renter Profiles'}
            </h3>
            <p className="text-gray-600 font-medium">
              {viewMode === 'active' && 'Manage tenant information and bills'}
              {viewMode === 'archived' && 'Previously archived tenants'}
              {viewMode === 'all' && 'View all renter profiles'}
            </p>
          </div>
          {viewMode !== 'archived' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              <span>Add Renter</span>
            </button>
          )}
        </div>

        {/* Renters List */}
        {currentRenters.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center shadow-lg">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 font-poppins">
              {viewMode === 'active' && 'No renters added yet'}
              {viewMode === 'archived' && 'No archived renters'}
              {viewMode === 'all' && 'No renter profiles found'}
            </h3>
            <p className="text-gray-600 font-medium mb-6 max-w-md mx-auto">
              {viewMode === 'active' && 'Start managing your rental properties by adding your first tenant'}
              {viewMode === 'archived' && 'No tenants have been archived yet'}
              {viewMode === 'all' && 'No renter profiles are available'}
            </p>
            {viewMode === 'active' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                <span>Add Your First Renter</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentRenters.map((renter) => (
              <RenterCard
                key={renter.id}
                renter={renter}
                onArchive={handleArchiveRenter}
                onUnarchive={handleUnarchiveRenter}
                onDelete={handleDeleteRenter}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Renter Modal */}
      {showAddModal && (
        <AddRenterModal
          onClose={() => setShowAddModal(false)}
          onRenterAdded={handleRenterAdded}
        />
      )}
    </div>
  )
}

interface MetricTileProps {
  title: string
  value: string
  icon: React.ReactNode
  bgColor: string
  textColor: string
}

function MetricTile({ title, value, icon, bgColor, textColor }: MetricTileProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`inline-flex items-center justify-center p-2 ${bgColor} rounded-lg mb-3`}>
        {icon}
      </div>
      <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{title}</h3>
      <p className={`text-lg font-bold ${textColor} font-poppins`}>{value}</p>
    </div>
  )
}