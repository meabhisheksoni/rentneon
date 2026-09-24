'use client'

import React from 'react'
import { Search, X } from 'lucide-react'

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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
      {/* View Mode Tabs */}
      <div className="flex items-center p-1 bg-gray-200/60 rounded-2xl w-full sm:w-auto">
        <button
          onClick={() => onViewModeChange('active')}
          className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
            viewMode === 'active'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Active <span className="ml-1 opacity-75 font-normal">({activeCount})</span>
        </button>

        <button
          onClick={() => onViewModeChange('archived')}
          className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
            viewMode === 'archived'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Archived <span className="ml-1 opacity-75 font-normal">({archivedCount})</span>
        </button>

        <button
          onClick={() => onViewModeChange('all')}
          className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
            viewMode === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All <span className="ml-1 opacity-75 font-normal">({activeCount + archivedCount})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Search by name, address, or phone..."
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:border-blue-500 focus:ring-3 focus:ring-blue-100 shadow-xs transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchQueryChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded-full"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
