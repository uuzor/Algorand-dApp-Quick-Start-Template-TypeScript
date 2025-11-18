/**
 * TaskMarketplace - Main marketplace for browsing and executing tasks
 * Features: Advanced filtering, sorting, real-time updates, Framer-style animations
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo } from 'react'
import { TaskMetadata, TaskStatus } from '../../contracts/tasker/types'
import TaskCard from './TaskCard'
import MarketplaceStats from './MarketplaceStats'
import TaskFilters from './TaskFilters'
import {
  AiOutlineReload,
  AiOutlineFilter,
  AiOutlineSearch,
  AiOutlineClose
} from 'react-icons/ai'

export interface TaskWithId extends TaskMetadata {
  taskId: number
}

export interface MarketplaceFilters {
  status: TaskStatus | 'all'
  minReward: number
  maxReward: number
  searchQuery: string
  showMyTasks: boolean
  isRecurring: boolean | 'all'
}

export interface SortOption {
  field: 'reward' | 'expiration' | 'executions' | 'created'
  direction: 'asc' | 'desc'
}

interface TaskMarketplaceProps {
  tasks: TaskWithId[]
  loading: boolean
  onRefresh: () => void
  onExecuteTask: (taskId: number) => void
  currentUserAddress?: string
  isExecutor?: boolean
}

export default function TaskMarketplace({
  tasks,
  loading,
  onRefresh,
  onExecuteTask,
  currentUserAddress,
  isExecutor = false,
}: TaskMarketplaceProps) {
  const [filters, setFilters] = useState<MarketplaceFilters>({
    status: 'all',
    minReward: 0,
    maxReward: 1000000000,
    searchQuery: '',
    showMyTasks: false,
    isRecurring: 'all',
  })

  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'reward',
    direction: 'desc',
  })

  const [showFilters, setShowFilters] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      onRefresh()
      setLastUpdate(new Date())
    }, 30000)

    return () => clearInterval(interval)
  }, [onRefresh])

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks]

    // Apply filters
    if (filters.status !== 'all') {
      result = result.filter((task) => task.status === filters.status)
    }

    if (filters.minReward > 0) {
      result = result.filter((task) => Number(task.rewardAmount) >= filters.minReward)
    }

    if (filters.maxReward < 1000000000) {
      result = result.filter((task) => Number(task.rewardAmount) <= filters.maxReward)
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      result = result.filter(
        (task) =>
          task.taskId.toString().includes(query) ||
          task.creator.toLowerCase().includes(query)
      )
    }

    if (filters.showMyTasks && currentUserAddress) {
      result = result.filter((task) => task.creator === currentUserAddress)
    }

    if (filters.isRecurring !== 'all') {
      result = result.filter((task) =>
        filters.isRecurring
          ? Number(task.recurringInterval) > 0
          : Number(task.recurringInterval) === 0
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0

      switch (sortOption.field) {
        case 'reward':
          comparison = Number(a.rewardAmount) - Number(b.rewardAmount)
          break
        case 'expiration':
          comparison = Number(a.expiration) - Number(b.expiration)
          break
        case 'executions':
          comparison = Number(a.executionCount) - Number(b.executionCount)
          break
        case 'created':
          comparison = a.taskId - b.taskId
          break
      }

      return sortOption.direction === 'asc' ? comparison : -comparison
    })

    return result
  }, [tasks, filters, sortOption, currentUserAddress])

  // Calculate stats
  const stats = useMemo(() => {
    const activeTasks = tasks.filter((t) => t.status === TaskStatus.Active)
    const totalRewards = tasks.reduce(
      (sum, t) => sum + Number(t.rewardAmount),
      0
    )
    const avgReward = tasks.length > 0 ? totalRewards / tasks.length : 0

    return {
      total: tasks.length,
      active: activeTasks.length,
      totalRewards: totalRewards / 1_000_000, // Convert to ALGO
      avgReward: avgReward / 1_000_000,
    }
  }, [tasks])

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-neutral-900 text-white">
      {/* Header */}
      <motion.div
        className="border-b border-white/10 bg-black/20 backdrop-blur-lg sticky top-0 z-40"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                Task Marketplace
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Browse and execute automated tasks • Updated{' '}
                {lastUpdate.toLocaleTimeString()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Filter Toggle */}
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  showFilters
                    ? 'bg-yellow-400 text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showFilters ? <AiOutlineClose /> : <AiOutlineFilter />}
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </motion.button>

              {/* Refresh Button */}
              <motion.button
                onClick={onRefresh}
                disabled={loading}
                className="px-4 py-2 bg-pink-400 text-black rounded-lg font-medium flex items-center gap-2 hover:bg-pink-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                whileHover={{ scale: loading ? 1 : 1.05 }}
                whileTap={{ scale: loading ? 1 : 0.95 }}
              >
                <motion.div
                  animate={loading ? { rotate: 360 } : {}}
                  transition={{
                    duration: 1,
                    repeat: loading ? Infinity : 0,
                    ease: 'linear',
                  }}
                >
                  <AiOutlineReload />
                </motion.div>
                Refresh
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Dashboard */}
        <MarketplaceStats stats={stats} loading={loading} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
          {/* Filters Sidebar */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                className="lg:col-span-1"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <TaskFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  sortOption={sortOption}
                  onSortChange={setSortOption}
                  showMyTasksOption={!!currentUserAddress}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Task Grid */}
          <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <AiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="text"
                  placeholder="Search by task ID or creator address..."
                  value={filters.searchQuery}
                  onChange={(e) =>
                    setFilters({ ...filters, searchQuery: e.target.value })
                  }
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all"
                />
              </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-sm">
                Showing {filteredAndSortedTasks.length} of {tasks.length} tasks
              </p>
              {isExecutor && (
                <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                  <span className="text-green-400 text-xs font-medium">
                    ✓ Executor Mode
                  </span>
                </div>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                  <p className="text-gray-400">Loading tasks...</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredAndSortedTasks.length === 0 && (
              <motion.div
                className="flex flex-col items-center justify-center py-20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <AiOutlineSearch className="text-4xl text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  No tasks found
                </h3>
                <p className="text-gray-500 text-center max-w-md">
                  Try adjusting your filters or check back later for new tasks.
                </p>
              </motion.div>
            )}

            {/* Task Grid */}
            <motion.div
              className="grid grid-cols-1 xl:grid-cols-2 gap-4"
              layout
            >
              <AnimatePresence mode="popLayout">
                {filteredAndSortedTasks.map((task, index) => (
                  <TaskCard
                    key={task.taskId}
                    task={task}
                    index={index}
                    onExecute={onExecuteTask}
                    isOwner={task.creator === currentUserAddress}
                    canExecute={isExecutor}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
