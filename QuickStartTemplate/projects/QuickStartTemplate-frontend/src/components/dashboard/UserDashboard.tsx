/**
 * UserDashboard - Main dashboard for users to manage tasks and track reputation
 */

import { motion } from 'framer-motion'
import { useState } from 'react'
import { TaskWithId } from '../marketplace/TaskMarketplace'
import { ExecutorProfile as ExecutorProfileType } from '../../contracts/tasker/types'
import ExecutorProfile from './ExecutorProfile'
import CreateTaskModal from './CreateTaskModal'
import MyTasksList from './MyTasksList'
import {
  AiOutlinePlus,
  AiOutlineFileText,
  AiOutlineTrophy,
  AiOutlineUser,
} from 'react-icons/ai'

interface UserDashboardProps {
  userAddress: string
  myTasks: TaskWithId[]
  executorProfile?: ExecutorProfileType
  isExecutor: boolean
  onCreateTask: (taskData: any) => Promise<void>
  onCancelTask: (taskId: number) => Promise<void>
  onRefresh: () => void
  loading: boolean
}

export default function UserDashboard({
  userAddress,
  myTasks,
  executorProfile,
  isExecutor,
  onCreateTask,
  onCancelTask,
  onRefresh,
  loading,
}: UserDashboardProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'tasks' | 'profile'>('tasks')

  // Calculate task stats
  const activeTasks = myTasks.filter((t) => t.status === 0).length
  const totalRewards = myTasks.reduce(
    (sum, t) => sum + Number(t.rewardAmount),
    0
  )

  const tabs = [
    {
      id: 'tasks' as const,
      label: 'My Tasks',
      icon: <AiOutlineFileText />,
      count: myTasks.length,
    },
    {
      id: 'profile' as const,
      label: 'Executor Profile',
      icon: <AiOutlineTrophy />,
      count: isExecutor ? '✓' : '',
    },
  ]

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
                Dashboard
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Manage your tasks and track performance
              </p>
            </div>

            {/* Create Task Button */}
            <motion.button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-pink-400 text-black rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-yellow-400/20 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AiOutlinePlus className="text-xl" />
              Create Task
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <motion.div
          className="bg-gradient-to-br from-zinc-900 to-neutral-900 border border-white/10 rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-pink-400 flex items-center justify-center text-black text-2xl font-bold">
              <AiOutlineUser />
            </div>

            {/* User Details */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">
                Welcome back!
              </h2>
              <p className="text-gray-400 text-sm font-mono">
                {userAddress.substring(0, 12)}...
                {userAddress.substring(userAddress.length - 8)}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">
                  {myTasks.length}
                </p>
                <p className="text-xs text-gray-400">Total Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-pink-400">
                  {activeTasks}
                </p>
                <p className="text-xs text-gray-400">Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {(totalRewards / 1_000_000).toFixed(2)} Ⱥ
                </p>
                <p className="text-xs text-gray-400">Total Rewards</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-6 py-3 font-medium transition-all ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-yellow-400 text-black'
                        : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </div>

              {/* Active indicator */}
              {activeTab === tab.id && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400 to-pink-400"
                  layoutId="activeTab"
                  transition={{ duration: 0.3 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'tasks' && (
          <MyTasksList
            tasks={myTasks}
            onCancelTask={onCancelTask}
            onRefresh={onRefresh}
            loading={loading}
          />
        )}

        {activeTab === 'profile' && (
          <ExecutorProfile
            profile={executorProfile}
            isExecutor={isExecutor}
            userAddress={userAddress}
          />
        )}
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={onCreateTask}
      />
    </div>
  )
}
