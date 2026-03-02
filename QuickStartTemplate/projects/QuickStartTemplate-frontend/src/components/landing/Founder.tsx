import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

export default function Founder() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <section id="founder" className="relative py-32 bg-gradient-to-b from-neutral-900 to-zinc-950">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-pink-400/5 rounded-full blur-3xl -translate-y-1/2" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            className="inline-block px-4 py-2 bg-yellow-400/10 rounded-full text-yellow-400 text-sm font-semibold mb-4 border border-yellow-400/20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            Team
          </motion.div>

          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Meet the Founder
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-zinc-900/30 backdrop-blur-sm rounded-3xl overflow-hidden border border-zinc-800"
        >
          <div className="grid md:grid-cols-2 gap-0">
            {/* Founder Image */}
            <div className="relative h-96 md:h-auto bg-zinc-950">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-pink-400/10" />
              <motion.div
                className="relative h-full flex items-center justify-center p-12"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {/* Placeholder for founder image */}
                <div className="w-64 h-64 rounded-full bg-gradient-to-br from-yellow-400 to-pink-400 flex items-center justify-center text-black text-8xl font-bold shadow-2xl">
                  TK
                </div>
              </motion.div>

              {/* Decorative elements */}
              <div className="absolute top-4 right-4 w-20 h-20 border-2 border-yellow-400/20 rounded-full" />
              <div className="absolute bottom-4 left-4 w-16 h-16 border-2 border-pink-400/20 rounded-full" />
            </div>

            {/* Founder Info */}
            <div className="p-12 flex flex-col justify-center bg-zinc-900/50">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <h3 className="text-4xl font-bold text-white mb-2">TaskerOnChain Team</h3>
                <p className="text-xl text-yellow-400 mb-6">Founder & Lead Developer</p>

                <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full mb-6" />

                <blockquote className="text-lg text-gray-400 leading-relaxed mb-6 italic border-l-4 border-yellow-400/30 pl-4">
                  "DeFi users shouldn't need to monitor their positions 24/7 or trust third parties to execute time-sensitive operations.
                  TaskerOnChain brings truly decentralized, trustless automation to Algorand - empowering everyone to automate their DeFi
                  strategies with confidence."
                </blockquote>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-400 text-2xl">•</span>
                    <div>
                      <p className="text-white font-semibold">Vision</p>
                      <p className="text-gray-500">Make DeFi automation accessible to everyone through decentralized, trustless infrastructure</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-pink-400 text-2xl">•</span>
                    <div>
                      <p className="text-white font-semibold">Mission</p>
                      <p className="text-gray-500">Build the most reliable and cost-effective automation protocol on Algorand</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-400 text-2xl">•</span>
                    <div>
                      <p className="text-white font-semibold">Values</p>
                      <p className="text-gray-500">Decentralization, security, transparency, and user empowerment</p>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex gap-4 mt-8">
                  <motion.a
                    href="https://twitter.com/taskeronchain"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-yellow-400/20 transition-colors border border-zinc-700 hover:border-yellow-400/30"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-5 h-5 text-gray-400 hover:text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </motion.a>

                  <motion.a
                    href="https://github.com/taskeronchain"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-pink-400/20 transition-colors border border-zinc-700 hover:border-pink-400/30"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-5 h-5 text-gray-400 hover:text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                    </svg>
                  </motion.a>

                  <motion.a
                    href="https://discord.gg/taskeronchain"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-yellow-400/20 transition-colors border border-zinc-700 hover:border-yellow-400/30"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-5 h-5 text-gray-400 hover:text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </motion.a>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Team Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="text-center bg-zinc-900/30 backdrop-blur-sm rounded-2xl p-8 border border-zinc-800 hover:border-yellow-400/30 transition-colors">
            <div className="text-5xl font-bold text-yellow-400 mb-2">2,000+</div>
            <div className="text-gray-400">Lines of Code</div>
          </div>
          <div className="text-center bg-zinc-900/30 backdrop-blur-sm rounded-2xl p-8 border border-zinc-800 hover:border-pink-400/30 transition-colors">
            <div className="text-5xl font-bold text-pink-400 mb-2">10</div>
            <div className="text-gray-400">Smart Contracts</div>
          </div>
          <div className="text-center bg-zinc-900/30 backdrop-blur-sm rounded-2xl p-8 border border-zinc-800 hover:border-yellow-400/30 transition-colors">
            <div className="text-5xl font-bold text-yellow-400 mb-2">100%</div>
            <div className="text-gray-400">Open Source</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
