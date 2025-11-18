import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const timelineEvents = [
  {
    quarter: 'Q4 2024',
    title: 'Foundation',
    status: 'completed',
    items: [
      'Core contract architecture design',
      'TaskFactory, ExecutorHub, TaskVault implementation',
      'Base adapter interface with getTokenRequirements()',
      'Comprehensive testing framework',
    ],
  },
  {
    quarter: 'Q1 2025',
    title: 'Launch',
    status: 'in-progress',
    items: [
      'TestNet deployment',
      'Basic adapters (Tinyman limit orders, DCA)',
      'Web UI for task creation',
      'Executor dashboard and monitoring',
    ],
  },
  {
    quarter: 'Q2 2025',
    title: 'Expansion',
    status: 'upcoming',
    items: [
      'MainNet deployment',
      'Folks Finance & AlgoFi adapters',
      'Multi-adapter task execution',
      'Advanced reputation system',
    ],
  },
  {
    quarter: 'Q3 2025',
    title: 'Ecosystem',
    status: 'upcoming',
    items: [
      'NFT marketplace automation',
      'Governance voting adapters',
      'Executor bot marketplace',
      'Protocol governance launch',
    ],
  },
  {
    quarter: 'Q4 2025',
    title: 'Scale',
    status: 'upcoming',
    items: [
      'Cross-chain bridge support',
      'Advanced analytics dashboard',
      'Institutional executor program',
      'Mobile app release',
    ],
  },
]

function TimelineItem({ event, index, isLast }: { event: typeof timelineEvents[0]; index: number; isLast: boolean }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const statusColors = {
    completed: 'from-green-400 to-emerald-500',
    'in-progress': 'from-blue-400 to-cyan-500',
    upcoming: 'from-purple-400 to-pink-500',
  }

  const statusBgColors = {
    completed: 'bg-green-500/20 border-green-500/30',
    'in-progress': 'bg-blue-500/20 border-blue-500/30',
    upcoming: 'bg-purple-500/20 border-purple-500/30',
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative"
    >
      <div className="flex items-center gap-8">
        {/* Timeline line */}
        {!isLast && (
          <div className="absolute left-1/2 top-20 w-1 h-full bg-gradient-to-b from-white/20 to-transparent -translate-x-1/2 hidden md:block" />
        )}

        {/* Content */}
        <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:order-2'}`}>
          <motion.div
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300"
            whileHover={{ scale: 1.02 }}
          >
            <div className={`inline-block px-4 py-1 ${statusBgColors[event.status]} rounded-full text-sm font-semibold mb-4 border`}>
              {event.quarter}
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">{event.title}</h3>
            <ul className="space-y-2">
              {event.items.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 + i * 0.1 }}
                  className="text-gray-300 flex items-start gap-2"
                >
                  <span className="text-purple-400 mt-1">•</span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Center dot */}
        <div className="hidden md:block relative z-10">
          <motion.div
            className={`w-6 h-6 rounded-full bg-gradient-to-r ${statusColors[event.status]} shadow-lg`}
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : { scale: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/50 to-transparent animate-pulse" />
          </motion.div>
        </div>

        {/* Spacer for alternating layout */}
        <div className={`flex-1 ${index % 2 === 0 ? 'md:order-2' : ''}`} />
      </div>
    </motion.div>
  )
}

export default function Timeline() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <section id="timeline" className="relative py-32 bg-gradient-to-b from-purple-950 to-indigo-950">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            className="inline-block px-4 py-2 bg-blue-500/20 rounded-full text-blue-300 text-sm font-semibold mb-4 border border-blue-500/30"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            Roadmap
          </motion.div>

          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Our Journey
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Building the future of decentralized automation on Algorand, one milestone at a time.
          </p>
        </motion.div>

        <div className="space-y-12 md:space-y-24">
          {timelineEvents.map((event, index) => (
            <TimelineItem
              key={index}
              event={event}
              index={index}
              isLast={index === timelineEvents.length - 1}
            />
          ))}
        </div>

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 text-center"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold">Overall Progress</span>
              <span className="text-purple-400 font-bold">25%</span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={isInView ? { width: '25%' } : { width: 0 }}
                transition={{ duration: 1.5, delay: 0.6, ease: 'easeOut' }}
              />
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Foundation complete, launch phase in progress
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
