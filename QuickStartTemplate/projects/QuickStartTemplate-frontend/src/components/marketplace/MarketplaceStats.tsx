/**
 * MarketplaceStats - Dashboard statistics for the marketplace
 */

import { motion } from 'framer-motion'
import {
  AiOutlineCheckCircle,
  AiOutlineTrophy,
  AiOutlineLineChart,
  AiOutlineFile,
} from 'react-icons/ai'

interface MarketplaceStatsProps {
  stats: {
    total: number
    active: number
    totalRewards: number
    avgReward: number
  }
  loading: boolean
}

export default function MarketplaceStats({
  stats,
  loading,
}: MarketplaceStatsProps) {
  const statCards = [
    {
      label: 'Total Tasks',
      value: stats.total,
      icon: <AiOutlineFile className="text-2xl" />,
      color: 'yellow',
      gradient: 'from-yellow-400 to-orange-400',
      bgGlow: 'yellow-400/10',
    },
    {
      label: 'Active Tasks',
      value: stats.active,
      icon: <AiOutlineCheckCircle className="text-2xl" />,
      color: 'green',
      gradient: 'from-green-400 to-emerald-400',
      bgGlow: 'green-400/10',
    },
    {
      label: 'Total Rewards',
      value: `${stats.totalRewards.toFixed(2)} Ⱥ`,
      icon: <AiOutlineTrophy className="text-2xl" />,
      color: 'pink',
      gradient: 'from-pink-400 to-rose-400',
      bgGlow: 'pink-400/10',
    },
    {
      label: 'Avg Reward',
      value: `${stats.avgReward.toFixed(3)} Ⱥ`,
      icon: <AiOutlineLineChart className="text-2xl" />,
      color: 'purple',
      gradient: 'from-purple-400 to-indigo-400',
      bgGlow: 'purple-400/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          className="relative group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          {/* Glow effect */}
          <div
            className={`absolute inset-0 bg-${stat.bgGlow} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
          />

          <div className="relative bg-gradient-to-br from-zinc-900 to-neutral-900 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
            {/* Icon with gradient background */}
            <div
              className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.gradient} mb-4`}
            >
              <div className="text-black">{stat.icon}</div>
            </div>

            {/* Label */}
            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>

            {/* Value */}
            {loading ? (
              <div className="h-8 w-24 bg-white/5 rounded-lg animate-pulse" />
            ) : (
              <motion.p
                className="text-3xl font-bold text-white"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {stat.value}
              </motion.p>
            )}

            {/* Trend indicator (placeholder) */}
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-green-400">↑ Active</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
