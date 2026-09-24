'use client'

import React from 'react'
import { Search, Users, Archive, ListFilter } from 'lucide-react'

export type DashboardViewMode = 'active' | 'archived' | 'all'

interface DashboardFiltersProps {
  viewMode: DashboardViewMode
  onViewModeChange: (mode: DashboardViewMode) => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  activeCount: number
  archivedCount: number
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchQueryChange,
  activeCount,
  archivedCount,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
      {/* View Mode Tabs */}
      <div className="flex items-center p-1 bg-gray-100/80 rounded-xl w-full sm:w-auto">
        <button
          onClick={() => onViewModeChange('active')}
          className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            viewMode === 'active'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Active ({activeCount})
        </button>

        <button
          onClick={() => onViewModeChange('archived')}
          className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            viewMode === 'archived'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Archived ({archivedCount})
        </button>

        <button
          onClick={() => onViewModeChange('all')}
          className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            viewMode === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          All ({activeCount + archivedCount})
        </button>
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-72">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Search by name or address..."
          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>
    </div>
  )
}
