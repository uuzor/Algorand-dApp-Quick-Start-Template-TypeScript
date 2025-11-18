/**
 * CreateTaskModal - Form modal for creating new automated tasks
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
  AiOutlineClose,
  AiOutlineClockCircle,
  AiOutlineReload,
  AiOutlineTrophy,
  AiOutlineCheckCircle,
} from 'react-icons/ai'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (taskData: any) => Promise<void>
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  // Form state
  const [formData, setFormData] = useState({
    // Basic settings
    expiration: '',
    expirationDays: 7,
    maxExecutions: 0,
    recurringInterval: 0,
    rewardAmount: '',

    // Advanced settings
    adapterType: 'tinyman-limit',
    actionParams: {},
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Calculate expiration timestamp
      const expirationTimestamp =
        Math.floor(Date.now() / 1000) + formData.expirationDays * 86400

      // Prepare task data
      const taskData = {
        expiration: expirationTimestamp,
        maxExecutions: formData.maxExecutions,
        recurringInterval: formData.recurringInterval,
        rewardAmount: parseFloat(formData.rewardAmount) * 1_000_000, // Convert to micro-ALGO
        rewardAssetId: 0,
        adapterAppId: getAdapterAppId(formData.adapterType),
        actionParams: encodeActionParams(
          formData.adapterType,
          formData.actionParams
        ),
      }

      await onSubmit(taskData)

      // Reset form
      setFormData({
        expiration: '',
        expirationDays: 7,
        maxExecutions: 0,
        recurringInterval: 0,
        rewardAmount: '',
        adapterType: 'tinyman-limit',
        actionParams: {},
      })
      setStep(1)
      onClose()
    } catch (error) {
      console.error('Failed to create task:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper functions
  const getAdapterAppId = (type: string): number => {
    const adapters: Record<string, number> = {
      'tinyman-limit': 888001,
      'time-transfer': 888002,
      'governance-vote': 888003,
    }
    return adapters[type] || 888001
  }

  const encodeActionParams = (type: string, params: any): Uint8Array => {
    // Simplified encoding - in production, use proper ABI encoding
    return new Uint8Array(Buffer.from(JSON.stringify(params)))
  }

  const adapterTypes = [
    {
      value: 'tinyman-limit',
      label: 'Tinyman Limit Order',
      description: 'Execute swap when price target is reached',
      icon: '🔄',
    },
    {
      value: 'time-transfer',
      label: 'Time-based Transfer',
      description: 'Send tokens at a specific time',
      icon: '⏰',
    },
    {
      value: 'governance-vote',
      label: 'Governance Vote',
      description: 'Automated governance participation',
      icon: '🗳️',
    },
  ]

  const intervalOptions = [
    { value: 0, label: 'One-time' },
    { value: 300, label: 'Every 5 minutes' },
    { value: 1800, label: 'Every 30 minutes' },
    { value: 3600, label: 'Every hour' },
    { value: 7200, label: 'Every 2 hours' },
    { value: 86400, label: 'Daily' },
    { value: 604800, label: 'Weekly' },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="bg-gradient-to-br from-zinc-900 to-neutral-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-br from-zinc-900 to-neutral-900 border-b border-white/10 p-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                    Create New Task
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Step {step} of 2 • Configure your automated task
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <AiOutlineClose className="text-xl text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {step === 1 && (
                  <>
                    {/* Adapter Type Selection */}
                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-3 block">
                        Task Type
                      </label>
                      <div className="grid grid-cols-1 gap-3">
                        {adapterTypes.map((adapter) => (
                          <button
                            key={adapter.value}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, adapterType: adapter.value })
                            }
                            className={`p-4 rounded-xl text-left transition-all ${
                              formData.adapterType === adapter.value
                                ? 'bg-white/10 border-2 border-yellow-400'
                                : 'bg-black/30 border border-white/10 hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{adapter.icon}</span>
                              <div className="flex-1">
                                <h4 className="font-semibold text-white">
                                  {adapter.label}
                                </h4>
                                <p className="text-sm text-gray-400">
                                  {adapter.description}
                                </p>
                              </div>
                              {formData.adapterType === adapter.value && (
                                <AiOutlineCheckCircle className="text-yellow-400 text-xl" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Expiration */}
                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                        <AiOutlineClockCircle />
                        Task Expiration
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.expirationDays}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expirationDays: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                        placeholder="Days until expiration"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Expires on{' '}
                        {new Date(
                          Date.now() + formData.expirationDays * 86400000
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Max Executions */}
                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-3 block">
                        Maximum Executions (0 = unlimited)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.maxExecutions}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxExecutions: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                        placeholder="0"
                      />
                    </div>

                    {/* Recurring Interval */}
                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                        <AiOutlineReload />
                        Execution Frequency
                      </label>
                      <select
                        value={formData.recurringInterval}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recurringInterval: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                      >
                        {intervalOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Reward Amount */}
                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                        <AiOutlineTrophy />
                        Reward per Execution (ALGO)
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.rewardAmount}
                        onChange={(e) =>
                          setFormData({ ...formData, rewardAmount: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                        placeholder="0.10"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Executors will earn this amount for each successful execution
                      </p>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    {/* Review Summary */}
                    <div className="bg-black/30 rounded-xl p-6 border border-white/10">
                      <h3 className="font-semibold text-white mb-4">
                        Task Summary
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Type:</span>
                          <span className="text-white font-medium">
                            {adapterTypes.find((a) => a.value === formData.adapterType)?.label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Expiration:</span>
                          <span className="text-white font-medium">
                            {formData.expirationDays} days
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Frequency:</span>
                          <span className="text-white font-medium">
                            {intervalOptions.find((i) => i.value === formData.recurringInterval)?.label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Max Executions:</span>
                          <span className="text-white font-medium">
                            {formData.maxExecutions || 'Unlimited'}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-3">
                          <span className="text-gray-400">Reward:</span>
                          <span className="text-yellow-400 font-bold">
                            {formData.rewardAmount} ALGO
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                      <p className="text-yellow-400 text-sm">
                        ⚠️ Make sure to fund the task vault after creation to enable execution.
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  {step === 2 && (
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 transition-all"
                    >
                      Back
                    </button>
                  )}

                  {step === 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!formData.rewardAmount}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-pink-400 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-yellow-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next: Review
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-pink-400 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-yellow-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating...' : 'Create Task'}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
