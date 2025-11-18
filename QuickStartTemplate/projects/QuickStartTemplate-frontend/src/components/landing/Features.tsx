import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const features = [
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description: '3.3 second block finality means your automated tasks execute almost instantly when conditions are met.',
    gradient: 'from-yellow-400 to-orange-500',
  },
  {
    icon: '💰',
    title: 'Ultra Low Cost',
    description: '500-5000x cheaper than Ethereum. Create tasks for pennies, not dollars. Make micro-automation economically viable.',
    gradient: 'from-green-400 to-emerald-500',
  },
  {
    icon: '🔒',
    title: 'Fully Decentralized',
    description: 'No centralized oracles. Conditions embedded directly in smart contracts. Trustless execution every time.',
    gradient: 'from-purple-400 to-pink-500',
  },
  {
    icon: '🎯',
    title: 'Limit Orders',
    description: 'Buy or sell tokens when price reaches your target. Set it and forget it - no manual monitoring required.',
    gradient: 'from-blue-400 to-cyan-500',
  },
  {
    icon: '📈',
    title: 'DCA Strategies',
    description: 'Dollar-cost average into assets automatically. Weekly, daily, or any custom interval you choose.',
    gradient: 'from-indigo-400 to-purple-500',
  },
  {
    icon: '🌾',
    title: 'Yield Harvesting',
    description: 'Auto-claim and compound your DeFi yields. Maximize returns while you sleep.',
    gradient: 'from-teal-400 to-green-500',
  },
  {
    icon: '🛡️',
    title: 'Stop Losses',
    description: 'Protect your positions with automatic sells when price drops. Limit your downside risk.',
    gradient: 'from-red-400 to-pink-500',
  },
  {
    icon: '⚖️',
    title: 'Portfolio Rebalancing',
    description: 'Maintain target allocations automatically. Keep your portfolio balanced without manual intervention.',
    gradient: 'from-violet-400 to-purple-500',
  },
  {
    icon: '🔄',
    title: 'Non-Custodial',
    description: 'You maintain full control of your funds. TaskVaults keep your assets safe until execution.',
    gradient: 'from-orange-400 to-red-500',
  },
]

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative"
    >
      <div className="h-full bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
        <motion.div
          className={`inline-block text-6xl mb-4 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {feature.icon}
        </motion.div>
        <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
        <p className="text-gray-300 leading-relaxed">{feature.description}</p>

        {/* Hover glow effect */}
        <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300 pointer-events-none`} />
      </div>
    </motion.div>
  )
}

export default function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <section id="features" className="relative py-32 bg-gradient-to-b from-indigo-950 to-purple-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            className="inline-block px-4 py-2 bg-purple-500/20 rounded-full text-purple-300 text-sm font-semibold mb-4 border border-purple-500/30"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            Features
          </motion.div>

          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Automate Everything
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            From simple limit orders to complex DeFi strategies, TaskerOnChain handles it all with trustless, on-chain automation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 text-center"
        >
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-3xl p-12 border border-white/10">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Automate Your DeFi?
            </h3>
            <p className="text-lg text-gray-300 mb-8">
              Join the decentralized automation revolution on Algorand
            </p>
            <motion.button
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-lg font-semibold shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                window.location.href = '/app'
              }}
            >
              Get Started Now
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
