import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const features = [
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description: '3.3 second block finality means your automated tasks execute almost instantly when conditions are met.',
    accentColor: 'yellow',
  },
  {
    icon: '💰',
    title: 'Ultra Low Cost',
    description: '500-5000x cheaper than Ethereum. Create tasks for pennies, not dollars. Make micro-automation economically viable.',
    accentColor: 'pink',
  },
  {
    icon: '🔒',
    title: 'Fully Decentralized',
    description: 'No centralized oracles. Conditions embedded directly in smart contracts. Trustless execution every time.',
    accentColor: 'yellow',
  },
  {
    icon: '🎯',
    title: 'Limit Orders',
    description: 'Buy or sell tokens when price reaches your target. Set it and forget it - no manual monitoring required.',
    accentColor: 'pink',
  },
  {
    icon: '📈',
    title: 'DCA Strategies',
    description: 'Dollar-cost average into assets automatically. Weekly, daily, or any custom interval you choose.',
    accentColor: 'yellow',
  },
  {
    icon: '🌾',
    title: 'Yield Harvesting',
    description: 'Auto-claim and compound your DeFi yields. Maximize returns while you sleep.',
    accentColor: 'pink',
  },
  {
    icon: '🛡️',
    title: 'Stop Losses',
    description: 'Protect your positions with automatic sells when price drops. Limit your downside risk.',
    accentColor: 'yellow',
  },
  {
    icon: '⚖️',
    title: 'Portfolio Rebalancing',
    description: 'Maintain target allocations automatically. Keep your portfolio balanced without manual intervention.',
    accentColor: 'pink',
  },
  {
    icon: '🔄',
    title: 'Non-Custodial',
    description: 'You maintain full control of your funds. TaskVaults keep your assets safe until execution.',
    accentColor: 'yellow',
  },
]

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const accentClass = feature.accentColor === 'yellow' ? 'yellow-400' : 'pink-400'

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative"
    >
      <div className={`h-full bg-zinc-900/30 backdrop-blur-sm rounded-2xl p-8 border border-zinc-800 hover:border-${accentClass}/40 transition-all duration-300 hover:shadow-xl`}>
        <motion.div
          className="inline-block text-6xl mb-4"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {feature.icon}
        </motion.div>
        <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
        <p className="text-gray-400 leading-relaxed">{feature.description}</p>

        {/* Hover glow effect */}
        <div className={`absolute inset-0 bg-${accentClass}/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300 pointer-events-none`} />
      </div>
    </motion.div>
  )
}

export default function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <section id="features" className="relative py-32 bg-gradient-to-b from-neutral-900 to-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            className="inline-block px-4 py-2 bg-yellow-400/10 rounded-full text-yellow-400 text-sm font-semibold mb-4 border border-yellow-400/20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            Features
          </motion.div>

          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Automate Everything
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
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
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-3xl p-12 border border-zinc-800">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Automate Your DeFi?
            </h3>
            <p className="text-lg text-gray-400 mb-8">
              Join the decentralized automation revolution on Algorand
            </p>
            <motion.button
              className="px-8 py-4 bg-pink-400 text-black rounded-full text-lg font-semibold shadow-lg hover:bg-pink-300 transition-colors"
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
