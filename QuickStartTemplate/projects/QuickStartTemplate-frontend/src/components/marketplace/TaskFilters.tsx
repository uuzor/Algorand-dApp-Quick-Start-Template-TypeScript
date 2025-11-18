/**
 * TaskFilters - Sidebar with filtering and sorting options
 */

import { motion } from 'framer-motion'
import { MarketplaceFilters, SortOption } from './TaskMarketplace'
import { TaskStatus } from '../../contracts/tasker/types'
import {
  AiOutlineFilter,
  AiOutlineSortAscending,
  AiOutlineSortDescending,
  AiOutlineReload,
} from 'react-icons/ai'

interface TaskFiltersProps {
  filters: MarketplaceFilters
  onFiltersChange: (filters: MarketplaceFilters) => void
  sortOption: SortOption
  onSortChange: (sort: SortOption) => void
  showMyTasksOption: boolean
}

export default function TaskFilters({
  filters,
  onFiltersChange,
  sortOption,
  onSortChange,
  showMyTasksOption,
}: TaskFiltersProps) {
  const statusOptions = [
    { value: 'all', label: 'All Tasks', color: 'white' },
    { value: TaskStatus.Active, label: 'Active', color: 'green-400' },
    { value: TaskStatus.Executing, label: 'Executing', color: 'yellow-400' },
    { value: TaskStatus.Completed, label: 'Completed', color: 'blue-400' },
    { value: TaskStatus.Cancelled, label: 'Cancelled', color: 'red-400' },
  ]

  const sortOptions = [
    { field: 'reward' as const, label: 'Reward Amount' },
    { field: 'expiration' as const, label: 'Expiration' },
    { field: 'executions' as const, label: 'Executions' },
    { field: 'created' as const, label: 'Recently Created' },
  ]

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <motion.div
        className="bg-gradient-to-br from-zinc-900 to-neutral-900 border border-white/10 rounded-2xl p-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <AiOutlineFilter className="text-yellow-400 text-xl" />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-400 mb-3 block">
            Task Status
          </label>
          <div className="space-y-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  onFiltersChange({ ...filters, status: option.value })
                }
                className={`w-full px-4 py-2.5 rounded-lg flex items-center justify-between transition-all ${
                  filters.status === option.value
                    ? 'bg-white/10 border-2 border-yellow-400'
                    : 'bg-black/30 border border-white/10 hover:bg-white/5'
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    filters.status === option.value
                      ? 'text-white'
                      : 'text-gray-400'
                  }`}
                >
                  {option.label}
                </span>
                {filters.status === option.value && (
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Reward Range */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-400 mb-3 block">
            Min Reward (ALGO)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={filters.minReward / 1_000_000}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                minReward: parseFloat(e.target.value) * 1_000_000,
              })
            }
            className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400"
            placeholder="0.0"
          />
        </div>

        <div className="mb-6">
          <label className="text-sm font-medium text-gray-400 mb-3 block">
            Max Reward (ALGO)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={
              filters.maxReward === 1000000000
                ? ''
                : filters.maxReward / 1_000_000
            }
            onChange={(e) => {
              const value = e.target.value
              onFiltersChange({
                ...filters,
                maxReward: value ? parseFloat(value) * 1_000_000 : 1000000000,
              })
            }}
            className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400"
            placeholder="No limit"
          />
        </div>

        {/* Task Type */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-400 mb-3 block">
            Task Type
          </label>
          <div className="space-y-2">
            <button
              onClick={() =>
                onFiltersChange({ ...filters, isRecurring: 'all' })
              }
              className={`w-full px-4 py-2.5 rounded-lg flex items-center justify-between transition-all ${
                filters.isRecurring === 'all'
                  ? 'bg-white/10 border-2 border-pink-400'
                  : 'bg-black/30 border border-white/10 hover:bg-white/5'
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  filters.isRecurring === 'all' ? 'text-white' : 'text-gray-400'
                }`}
              >
                All Types
              </span>
            </button>

            <button
              onClick={() =>
                onFiltersChange({ ...filters, isRecurring: true })
              }
              className={`w-full px-4 py-2.5 rounded-lg flex items-center justify-between transition-all ${
                filters.isRecurring === true
                  ? 'bg-white/10 border-2 border-pink-400'
                  : 'bg-black/30 border border-white/10 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <AiOutlineReload className="text-pink-400" />
                <span
                  className={`text-sm font-medium ${
                    filters.isRecurring === true
                      ? 'text-white'
                      : 'text-gray-400'
                  }`}
                >
                  Recurring Only
                </span>
              </div>
            </button>

            <button
              onClick={() =>
                onFiltersChange({ ...filters, isRecurring: false })
              }
              className={`w-full px-4 py-2.5 rounded-lg flex items-center justify-between transition-all ${
                filters.isRecurring === false
                  ? 'bg-white/10 border-2 border-pink-400'
                  : 'bg-black/30 border border-white/10 hover:bg-white/5'
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  filters.isRecurring === false
                    ? 'text-white'
                    : 'text-gray-400'
                }`}
              >
                One-time Only
              </span>
            </button>
          </div>
        </div>

        {/* My Tasks Toggle */}
        {showMyTasksOption && (
          <div className="mb-6">
            <button
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  showMyTasks: !filters.showMyTasks,
                })
              }
              className={`w-full px-4 py-3 rounded-lg flex items-center justify-between transition-all ${
                filters.showMyTasks
                  ? 'bg-blue-500/20 border-2 border-blue-400'
                  : 'bg-black/30 border border-white/10 hover:bg-white/5'
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  filters.showMyTasks ? 'text-blue-300' : 'text-gray-400'
                }`}
              >
                Show My Tasks Only
              </span>
              {filters.showMyTasks && (
                <div className="w-2 h-2 rounded-full bg-blue-400" />
              )}
            </button>
          </div>
        )}

        {/* Reset Button */}
        <button
          onClick={() =>
            onFiltersChange({
              status: 'all',
              minReward: 0,
              maxReward: 1000000000,
              searchQuery: '',
              showMyTasks: false,
              isRecurring: 'all',
            })
          }
          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-gray-400 font-medium rounded-lg hover:bg-white/10 hover:text-white transition-all"
        >
          Reset Filters
        </button>
      </motion.div>

      {/* Sorting Card */}
      <motion.div
        className="bg-gradient-to-br from-zinc-900 to-neutral-900 border border-white/10 rounded-2xl p-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          {sortOption.direction === 'asc' ? (
            <AiOutlineSortAscending className="text-pink-400 text-xl" />
          ) : (
            <AiOutlineSortDescending className="text-pink-400 text-xl" />
          )}
          <h3 className="text-lg font-semibold text-white">Sort By</h3>
        </div>

        {/* Sort Field */}
        <div className="mb-4 space-y-2">
          {sortOptions.map((option) => (
            <button
              key={option.field}
              onClick={() =>
                onSortChange({ ...sortOption, field: option.field })
              }
              className={`w-full px-4 py-2.5 rounded-lg flex items-center justify-between transition-all ${
                sortOption.field === option.field
                  ? 'bg-white/10 border-2 border-pink-400'
                  : 'bg-black/30 border border-white/10 hover:bg-white/5'
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  sortOption.field === option.field
                    ? 'text-white'
                    : 'text-gray-400'
                }`}
              >
                {option.label}
              </span>
              {sortOption.field === option.field && (
                <div className="w-2 h-2 rounded-full bg-pink-400" />
              )}
            </button>
          ))}
        </div>

        {/* Sort Direction */}
        <div className="flex gap-2">
          <button
            onClick={() => onSortChange({ ...sortOption, direction: 'asc' })}
            className={`flex-1 px-4 py-2.5 rounded-lg transition-all ${
              sortOption.direction === 'asc'
                ? 'bg-pink-400 text-black font-semibold'
                : 'bg-black/30 border border-white/10 text-gray-400 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <AiOutlineSortAscending />
              <span className="text-sm">Asc</span>
            </div>
          </button>

          <button
            onClick={() => onSortChange({ ...sortOption, direction: 'desc' })}
            className={`flex-1 px-4 py-2.5 rounded-lg transition-all ${
              sortOption.direction === 'desc'
                ? 'bg-pink-400 text-black font-semibold'
                : 'bg-black/30 border border-white/10 text-gray-400 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <AiOutlineSortDescending />
              <span className="text-sm">Desc</span>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  )
}
