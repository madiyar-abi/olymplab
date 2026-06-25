"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon, BookmarkMinus, ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: LucideIcon
  ctaText?: string
  ctaHref?: string
  onCtaClick?: () => void
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Flagged Problems Yet",
  description = "Problems you bookmark for later review will appear here. Start exploring the catalog to find your next challenge.",
  icon: Icon = BookmarkMinus,
  ctaText = "Browse Problem Catalog",
  ctaHref,
  onCtaClick,
  className
}) => {
  const renderCta = () => {
    const button = (
      <Button 
        size="lg" 
        variant="primary"
        onClick={onCtaClick}
        className="group px-8 py-6 h-auto rounded-2xl text-base font-semibold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/10"
      >
        {ctaText}
        <motion.span
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowRight className="ml-2 w-4 h-4" />
        </motion.span>
      </Button>
    )

    if (ctaHref) {
      return (
        <Link href={ctaHref}>
          {button}
        </Link>
      )
    }

    return button
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center min-h-[60vh]",
        className
      )}
    >
      {/* Visual / Illustration Area */}
      <div className="relative mb-8 group">
        {/* Radial Glow Background */}
        <div className="absolute inset-0 bg-blue-500/10 blur-[60px] rounded-full scale-150 group-hover:bg-blue-500/20 transition-colors duration-700" />
        
        {/* Central Icon with Floating Animation */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative z-10 w-24 h-24 bg-zinc-900/50 border border-white/5 rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-md"
        >
          <Icon className="w-10 h-10 text-neutral-400 group-hover:text-white transition-colors duration-500" strokeWidth={1.5} />
          
          {/* Subtle accent border effect */}
          <div className="absolute inset-0 rounded-3xl border border-white/10 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        </motion.div>
        
        {/* Floating elements for extra flair */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-4 -right-4 w-8 h-8 bg-blue-500/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-2 -left-2 w-12 h-12 bg-indigo-500/20 rounded-full blur-xl"
        />
      </div>

      {/* Typography */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-white mb-3 tracking-tight text-balance">
          {title}
        </h2>
        <p className="text-neutral-400 max-w-md mx-auto leading-relaxed mb-10 text-balance">
          {description}
        </p>
      </motion.div>

      {/* Call to Action */}
      {(ctaHref || onCtaClick) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {renderCta()}
        </motion.div>
      )}
    </motion.div>
  )
}
