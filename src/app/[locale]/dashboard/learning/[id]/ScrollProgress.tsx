'use client'

import { motion, useScroll, useSpring } from 'framer-motion'
import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export default function ScrollProgress() {
  const isMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const { scrollYProgress } = useScroll()
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  if (!isMounted) return null

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 z-50 origin-left"
      style={{ scaleX }}
    />
  )
}
