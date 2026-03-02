/**
 * TaskCard - Individual task display card with animations
 */

import { motion } from 'framer-motion'
import { TaskWithId } from './TaskMarketplace'
import { TaskStatus } from '../../contracts/tasker/types'
import {
  AiOutlineClockCircle,
  AiOutlineReload,
  AiOutlineTrophy,
  AiOutlineCheckCircle,
  AiOutlinePlayCircle,
  AiOutlineWarning,
} from 'react-icons/ai'

interface TaskCardProps {
  task: TaskWithId
  index: number
  onExecute: (taskId: number) => void
  isOwner: boolean
  canExecute: boolean
}

export default function TaskCard({
  task,
  index,
  onExecute,
  isOwner,
  canExecute,
}: TaskCardProps) {
  // Status configuration
  const statusConfig = {
    [TaskStatus.Active]: {
      label: 'Active',
      color: 'green',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400',
      icon: <AiOutlineCheckCircle />,
    },
    [TaskStatus.Executing]: {
      label: 'Executing',
      color: 'yellow',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-400',
      icon: <AiOutlinePlayCircle />,
    },
    [TaskStatus.Completed]: {
      label: 'Completed',
      color: 'blue',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400',
      icon: <AiOutlineTrophy />,
    },
    [TaskStatus.Cancelled]: {
      label: 'Cancelled',
      color: 'red',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400',
      icon: <AiOutlineWarning />,
    },
  }

  const status = statusConfig[task.status]
  const isRecurring = Number(task.recurringInterval) > 0
  const rewardInAlgo = Number(task.rewardAmount) / 1_000_000
  const expirationDate = new Date(Number(task.expiration) * 1000)
  const isExpired = expirationDate < new Date()
  const maxExec = Number(task.maxExecutions)
  const currentExec = Number(task.executionCount)
  const progress = maxExec > 0 ? (currentExec / maxExec) * 100 : 0

  // Time until expiration
  const timeUntilExpiration = () => {
    const now = new Date()
    const diff = expirationDate.getTime() - now.getTime()

    if (diff < 0) return 'Expired'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}d ${hours}h left`
    if (hours > 0) return `${hours}h left`

    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${minutes}m left`
  }

  // Recurring interval display
  const recurringDisplay = () => {
    const interval = Number(task.recurringInterval)
    if (interval === 0) return 'One-time'

    const hours = interval / 3600
    if (hours < 1) return `Every ${interval / 60}m`
    if (hours < 24) return `Every ${hours}h`

    const days = hours / 24
    return `Every ${days}d`
  }

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      layout
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-pink-400/0 to-yellow-400/0 group-hover:from-yellow-400/10 group-hover:via-pink-400/10 group-hover:to-yellow-400/10 rounded-2xl blur-xl transition-all duration-500" />

      <div className="relative bg-gradient-to-br from-zinc-900 to-neutral-900 border border-white/10 rounded-2xl p-6 hover:border-yellow-400/30 transition-all duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-pink-400 flex items-center justify-center text-black font-bold text-lg">
              #{task.taskId}
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">
                Task {task.taskId}
              </h3>
              <p className="text-gray-500 text-xs">
                {task.creator.substring(0, 8)}...
                {task.creator.substring(task.creator.length - 6)}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={`px-3 py-1 rounded-full ${status.bgColor} border ${status.borderColor} flex items-center gap-1.5`}
          >
            <span className={status.textColor}>{status.icon}</span>
            <span className={`text-xs font-medium ${status.textColor}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Owner Badge */}
        {isOwner && (
          <div className="mb-4">
            <div className="inline-flex px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-md">
              <span className="text-blue-400 text-xs font-medium">
                ✦ Your Task
              </span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Reward */}
          <div className="bg-black/30 rounded-lg p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <AiOutlineTrophy className="text-yellow-400" />
              <span className="text-gray-400 text-xs">Reward</span>
            </div>
            <p className="text-xl font-bold text-yellow-400">
              {rewardInAlgo.toFixed(3)} Ⱥ
            </p>
          </div>

          {/* Type */}
          <div className="bg-black/30 rounded-lg p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <AiOutlineReload className="text-pink-400" />
              <span className="text-gray-400 text-xs">Type</span>
            </div>
            <p className="text-sm font-semibold text-pink-400">
              {recurringDisplay()}
            </p>
          </div>

          {/* Expiration */}
          <div className="bg-black/30 rounded-lg p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <AiOutlineClockCircle
                className={isExpired ? 'text-red-400' : 'text-gray-400'}
              />
              <span className="text-gray-400 text-xs">Expires</span>
            </div>
            <p
              className={`text-sm font-semibold ${
                isExpired ? 'text-red-400' : 'text-white'
              }`}
            >
              {timeUntilExpiration()}
            </p>
          </div>

          {/* Executions */}
          <div className="bg-black/30 rounded-lg p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <AiOutlineCheckCircle className="text-gray-400" />
              <span className="text-gray-400 text-xs">Executions</span>
            </div>
            <p className="text-sm font-semibold text-white">
              {currentExec} / {maxExec > 0 ? maxExec : '∞'}
            </p>
          </div>
        </div>

        {/* Progress Bar (if max executions set) */}
        {maxExec > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Progress</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-black/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Recurring Info */}
        {isRecurring && (
          <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AiOutlineReload className="text-purple-400" />
              <span className="text-xs text-purple-300">
                Recurring task • Last executed:{' '}
                {Number(task.lastExecution) > 0
                  ? new Date(Number(task.lastExecution) * 1000).toLocaleString()
                  : 'Never'}
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        {canExecute && task.status === TaskStatus.Active && !isExpired && (
          <motion.button
            onClick={() => onExecute(task.taskId)}
            className="w-full py-3 bg-gradient-to-r from-yellow-400 to-pink-400 text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-yellow-400/20 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Execute Task & Earn {rewardInAlgo.toFixed(3)} Ⱥ
          </motion.button>
        )}

        {/* Disabled state info */}
        {canExecute && (isExpired || task.status !== TaskStatus.Active) && (
          <div className="w-full py-3 bg-white/5 border border-white/10 text-gray-400 font-medium rounded-xl text-center text-sm">
            {isExpired ? 'Task Expired' : `Task ${status.label}`}
          </div>
        )}

        {/* Non-executor view */}
        {!canExecute && task.status === TaskStatus.Active && (
          <div className="w-full py-3 bg-white/5 border border-white/10 text-gray-400 font-medium rounded-xl text-center text-sm">
            Register as executor to earn rewards
          </div>
        )}
      </div>
    </motion.div>
  )
}
