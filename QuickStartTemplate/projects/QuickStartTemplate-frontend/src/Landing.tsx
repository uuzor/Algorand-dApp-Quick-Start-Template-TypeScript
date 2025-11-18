import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Hero from './components/landing/Hero'
import Features from './components/landing/Features'
import Timeline from './components/landing/Timeline'
import Founder from './components/landing/Founder'
import Footer from './components/landing/Footer'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-neutral-900">
      {/* Navigation Header */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/">
              <motion.div
                className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent"
                whileHover={{ scale: 1.05 }}
              >
                TaskerOnChain
              </motion.div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-gray-300 hover:text-white transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Features
              </a>
              <a
                href="#timeline"
                className="text-gray-300 hover:text-white transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('timeline')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Roadmap
              </a>
              <a
                href="#founder"
                className="text-gray-300 hover:text-white transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('founder')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Team
              </a>
              <a
                href="https://docs.taskeronchain.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Docs
              </a>
            </div>

            {/* Open App Button */}
            <Link to="/app">
              <motion.button
                className="px-6 py-3 bg-yellow-400 text-black rounded-full font-semibold shadow-lg hover:bg-yellow-300 hover:shadow-xl transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Open App
              </motion.button>
            </Link>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-white p-2">
              <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <Features />

      {/* Timeline Section */}
      <Timeline />

      {/* Founder Section */}
      <Founder />

      {/* Footer */}
      <Footer />
    </div>
  )
}
