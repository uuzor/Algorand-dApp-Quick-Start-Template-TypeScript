/**
 * ExecutorProfile - Display executor reputation and performance stats
 */

import { motion } from 'framer-motion'
import { ExecutorProfile as ExecutorProfileType } from '../../contracts/tasker/types'
import {
  AiOutlineTrophy,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
  AiOutlineDollar,
  AiOutlineLineChart,
  AiOutlineStar,
} from 'react-icons/ai'

interface ExecutorProfileProps {
  profile?: ExecutorProfileType
  isExecutor: boolean
  userAddress: string
}

export default function ExecutorProfile({
  profile,
  isExecutor,
  userAddress,
}: ExecutorProfileProps) {
  if (!isExecutor || !profile) {
    return (
      <motion.div
        className="bg-gradient-to-br from-zinc-900 to-neutral-900 border border-white/10 rounded-2xl p-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
          <AiOutlineTrophy className="text-5xl text-gray-500" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">
          Not Registered as Executor
        </h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          Register as an executor to earn rewards by executing tasks. Stake ALGO
          to get started and build your reputation.
        </p>
        <motion.button
          className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-pink-400 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-yellow-400/20 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Register as Executor
        </motion.button>
      </motion.div>
    )
  }

  // Calculate stats
  const totalExecutions =
    Number(profile.successfulExecutions) + Number(profile.failedExecutions)
  const successRate =
    totalExecutions > 0
      ? (Number(profile.successfulExecutions) / totalExecutions) * 100
      : 100
  const stakeInAlgo = Number(profile.stakeAmount) / 1_000_000
  const rewardsInAlgo = Number(profile.totalRewardsEarned) / 1_000_000
  const reputation = Number(profile.reputationScore)

  // Reputation tier
  const getReputationTier = (score: number) => {
    if (score >= 90) return { label: 'Elite', color: 'yellow-400', glow: 'yellow' }
    if (score >= 75) return { label: 'Expert', color: 'pink-400', glow: 'pink' }
    if (score >= 60) return { label: 'Advanced', color: 'purple-400', glow: 'purple' }
    if (score >= 40) return { label: 'Intermediate', color: 'blue-400', glow: 'blue' }
    return { label: 'Novice', color: 'gray-400', glow: 'gray' }
  }

  const tier = getReputationTier(reputation)

  return (
    <div className="space-y-6">
      {/* Reputation Card */}
      <motion.div
        className="relative bg-gradient-to-br from-zinc-900 to-neutral-900 border border-white/10 rounded-2xl p-8 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Glow effect */}
        <div className={`absolute inset-0 bg-${tier.glow}-400/5 blur-3xl`} />

        <div className="relative">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Executor Reputation
              </h3>
              <p className="text-gray-400 text-sm">
                Your performance and trustworthiness score
              </p>
            </div>

            {/* Tier Badge */}
            <div
              className={`px-4 py-2 rounded-full bg-${tier.color}/20 border border-${tier.color}/30`}
            >
              <span className={`text-${tier.color} font-semibold text-sm`}>
                {tier.label}
              </span>
            </div>
          </div>

          {/* Reputation Score */}
          <div className="flex items-center gap-8 mb-8">
            <div className="relative">
              {/* Circular progress */}
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-white/10"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(reputation / 100) * 439.6} 439.6`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#facc15" />
                    <stop offset="100%" stopColor="#f472b6" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Score */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                  {reputation}
                </p>
                <p className="text-gray-400 text-sm">/ 100</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <AiOutlineCheckCircle className="text-green-400" />
                  <span className="text-gray-400 text-sm">Success Rate</span>
                </div>
                <p className="text-2xl font-bold text-green-400">
                  {successRate.toFixed(1)}%
                </p>
              </div>

              <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <AiOutlineLineChart className="text-blue-400" />
                  <span className="text-gray-400 text-sm">Total Executions</span>
                </div>
                <p className="text-2xl font-bold text-blue-400">
                  {totalExecutions}
                </p>
              </div>

              <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <AiOutlineStar className="text-yellow-400" />
                  <span className="text-gray-400 text-sm">Successful</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {profile.successfulExecutions.toString()}
                </p>
              </div>

              <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <AiOutlineCloseCircle className="text-red-400" />
                  <span className="text-gray-400 text-sm">Failed</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {profile.failedExecutions.toString()}
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar to next tier */}
          {reputation < 100 && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                <span>Progress to {reputation >= 90 ? 'Max' : getReputationTier(reputation + 15).label}</span>
                <span>{Math.min(reputation + 10, 100)} reputation needed</span>
              </div>
              <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(reputation % 15) / 15 * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stake Card */}
        <motion.div
          className="bg-gradient-to-br from-zinc-900 to-neutral-900 border border-white/10 rounded-2xl p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center">
              <AiOutlineDollar className="text-2xl text-black" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Current Stake</h4>
              <p className="text-gray-400 text-xs">Locked collateral</p>
            </div>
          </div>

          <p className="text-4xl font-bold text-white mb-2">
            {stakeInAlgo.toFixed(2)} Ⱥ
          </p>

          <div className="flex items-center gap-2">
            <div
              className={`px-2 py-1 rounded-md ${
                profile.isSlashed
                  ? 'bg-red-500/20 border border-red-500/30'
                  : 'bg-green-500/20 border border-green-500/30'
              }`}
            >
              <span
                className={`text-xs font-medium ${
                  profile.isSlashed ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {profile.isSlashed ? 'Slashed' : 'Active'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Earnings Card */}
        <motion.div
          className="bg-gradient-to-br from-zinc-900 to-neutral-900 border border-white/10 rounded-2xl p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-pink-400 flex items-center justify-center">
              <AiOutlineTrophy className="text-2xl text-black" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Total Earned</h4>
              <p className="text-gray-400 text-xs">Lifetime rewards</p>
            </div>
          </div>

          <p className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent mb-2">
            {rewardsInAlgo.toFixed(3)} Ⱥ
          </p>

          <p className="text-gray-400 text-sm">
            Avg: {totalExecutions > 0 ? (rewardsInAlgo / totalExecutions).toFixed(4) : '0.0000'} Ⱥ per execution
          </p>
        </motion.div>
      </div>

      {/* Registration Info */}
      <motion.div
        className="bg-gradient-to-br from-zinc-900 to-neutral-900 border border-white/10 rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-white mb-1">
              Executor Since
            </h4>
            <p className="text-gray-400 text-sm">
              {new Date(
                Number(profile.registrationTime) * 1000
              ).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="flex gap-3">
            <motion.button
              className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Add Stake
            </motion.button>
            <motion.button
              className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Withdraw
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
