/**
 * MyTasksList - Display and manage user's created tasks
 */

import { motion } from 'framer-motion'
import { TaskWithId } from '../marketplace/TaskMarketplace'
import { TaskStatus } from '../../contracts/tasker/types'
import {
  AiOutlineClockCircle,
  AiOutlineReload,
  AiOutlineTrophy,
  AiOutlineCheckCircle,
  AiOutlineStop,
  AiOutlineEye,
} from 'react-icons/ai'

interface MyTasksListProps {
  tasks: TaskWithId[]
  onCancelTask: (taskId: number) => Promise<void>
  onRefresh: () => void
  loading: boolean
}

export default function MyTasksList({
  tasks,
  onCancelTask,
  onRefresh,
  loading,
}: MyTasksListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-gray-400">Loading your tasks...</p>
        </div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <motion.div
        className="bg-gradient-to-br from-zinc-900 to-neutral-900 border border-white/10 rounded-2xl p-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
          <AiOutlineCheckCircle className="text-5xl text-gray-500" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">No Tasks Yet</h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          Create your first automated task to get started. Tasks will execute
          automatically based on your conditions.
        </p>
        <motion.button
          className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-pink-400 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-yellow-400/20 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {}}
        >
          Create Your First Task
        </motion.button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">
          Your Tasks ({tasks.length})
        </h3>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
        >
          <AiOutlineReload />
          Refresh
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task, index) => (
          <TaskRow
            key={task.taskId}
            task={task}
            index={index}
            onCancel={onCancelTask}
          />
        ))}
      </div>
    </div>
  )
}

// Individual task row component
function TaskRow({
  task,
  index,
  onCancel,
}: {
  task: TaskWithId
  index: number
  onCancel: (taskId: number) => Promise<void>
}) {
  const [canceling, setCanceling] = React.useState(false)

  const statusConfig = {
    [TaskStatus.Active]: {
      label: 'Active',
      color: 'green',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400',
    },
    [TaskStatus.Executing]: {
      label: 'Executing',
      color: 'yellow',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-400',
    },
    [TaskStatus.Completed]: {
      label: 'Completed',
      color: 'blue',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400',
    },
    [TaskStatus.Cancelled]: {
      label: 'Cancelled',
      color: 'red',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400',
    },
  }

  const status = statusConfig[task.status]
  const rewardInAlgo = Number(task.rewardAmount) / 1_000_000
  const expirationDate = new Date(Number(task.expiration) * 1000)
  const isExpired = expirationDate < new Date()
  const isRecurring = Number(task.recurringInterval) > 0

  const handleCancel = async () => {
    if (
      !confirm(
        `Are you sure you want to cancel Task #${task.taskId}? This action cannot be undone.`
      )
    ) {
      return
    }

    setCanceling(true)
    try {
      await onCancel(task.taskId)
    } catch (error) {
      console.error('Failed to cancel task:', error)
    } finally {
      setCanceling(false)
    }
  }

  return (
    <motion.div
      className="bg-gradient-to-br from-zinc-900 to-neutral-900 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Task Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-pink-400 flex items-center justify-center text-black font-bold">
              #{task.taskId}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white">Task #{task.taskId}</h4>
              <p className="text-gray-400 text-xs">
                {isRecurring ? 'Recurring Task' : 'One-time Task'}
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full ${status.bgColor} border ${status.borderColor}`}
            >
              <span className={`text-xs font-medium ${status.textColor}`}>
                {status.label}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-black/30 rounded-lg p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <AiOutlineTrophy className="text-yellow-400 text-sm" />
                <span className="text-gray-400 text-xs">Reward</span>
              </div>
              <p className="text-lg font-bold text-yellow-400">
                {rewardInAlgo.toFixed(3)} Ⱥ
              </p>
            </div>

            <div className="bg-black/30 rounded-lg p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <AiOutlineCheckCircle className="text-pink-400 text-sm" />
                <span className="text-gray-400 text-xs">Executions</span>
              </div>
              <p className="text-lg font-bold text-white">
                {task.executionCount.toString()}/
                {Number(task.maxExecutions) > 0
                  ? task.maxExecutions.toString()
                  : '∞'}
              </p>
            </div>

            <div className="bg-black/30 rounded-lg p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <AiOutlineClockCircle
                  className={`text-sm ${isExpired ? 'text-red-400' : 'text-gray-400'}`}
                />
                <span className="text-gray-400 text-xs">Expires</span>
              </div>
              <p
                className={`text-sm font-semibold ${isExpired ? 'text-red-400' : 'text-white'}`}
              >
                {expirationDate.toLocaleDateString()}
              </p>
            </div>

            <div className="bg-black/30 rounded-lg p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <AiOutlineReload className="text-purple-400 text-sm" />
                <span className="text-gray-400 text-xs">Interval</span>
              </div>
              <p className="text-sm font-semibold text-white">
                {isRecurring
                  ? `${Number(task.recurringInterval) / 3600}h`
                  : 'Once'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col gap-2">
          <motion.button
            className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AiOutlineEye />
            <span className="text-sm">View</span>
          </motion.button>

          {task.status === TaskStatus.Active && (
            <motion.button
              onClick={handleCancel}
              disabled={canceling}
              className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: canceling ? 1 : 1.05 }}
              whileTap={{ scale: canceling ? 1 : 0.95 }}
            >
              <AiOutlineStop />
              <span className="text-sm">
                {canceling ? 'Canceling...' : 'Cancel'}
              </span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
