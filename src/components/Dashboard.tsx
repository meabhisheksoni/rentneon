'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar, Home, Users, IndianRupee, Receipt, Plus, Database, Menu, LogOut, User } from 'lucide-react'
import { SupabaseService } from '@/services/supabaseService'
import { Renter } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { formatIndianCurrency, formatIndianUnits } from '@/utils/formatters'
import AddRenterModal from './AddRenterModal'
import RenterCard from './RenterCard'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [testDate, setTestDate] = useState(new Date())
  const [renters, setRenters] = useState<Renter[]>([])
  const [totalRenters, setTotalRenters] = useState(0)
  const [totalMonthlyRent, setTotalMonthlyRent] = useState(0)
  const [pendingAmount, setPendingAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [testDate])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const [rentersData, totalRent, pending] = await Promise.all([
        SupabaseService.getActiveRenters(),
        SupabaseService.getTotalMonthlyRent(),
        SupabaseService.getOutstandingAmount(testDate)
      ])

      setRenters(rentersData)
      setTotalRenters(rentersData.length)
      setTotalMonthlyRent(totalRent)
      setPendingAmount(pending)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      await SupabaseService.testConnection()
      alert('Database connection successful!')
    } catch (error) {
      alert(`Connection failed: ${error}`)
    }
  }

  const handleAddSampleData = async () => {
    try {
      await SupabaseService.addSampleData()
      await loadDashboardData()
      alert('Sample data added successfully!')
    } catch (error) {
      alert(`Error adding sample data: ${error}`)
    }
  }

  const handleRenterAdded = () => {
    setShowAddModal(false)
    loadDashboardData()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
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
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="hidden sm:block text-sm font-medium text-gray-700">Account</span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                      <p className="text-xs text-gray-500">Rental Manager</p>
                    </div>
                    <button
                      onClick={signOut}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
              
              <Menu className="h-6 w-6 text-gray-600 sm:hidden" />
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        {/* Mobile-Optimized Dashboard Header */}
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

        {/* Compact Horizontal Metrics Tiles */}
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

        {/* Your Renters Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900 font-poppins">Your Renters</h3>
            <p className="text-gray-600 font-medium">Manage tenant information and bills</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              <span>Add Renter</span>
            </button>
            <button
              onClick={handleTestConnection}
              className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
            >
              <Database className="h-5 w-5" />
              <span className="hidden sm:inline">Test DB</span>
              <span className="sm:hidden">Test</span>
            </button>
          </div>
        </div>

        {/* Renters List */}
        {renters.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center shadow-lg">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 font-poppins">No renters added yet</h3>
            <p className="text-gray-600 font-medium mb-6 max-w-md mx-auto">
              Start managing your rental properties by adding your first tenant
            </p>
            <button
              onClick={handleAddSampleData}
              className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-4 transition-colors"
            >
              Add sample data for testing
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {renters.map((renter) => (
              <RenterCard key={renter.id} renter={renter} />
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