"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
}

export function StaggerContainer({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "50px" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  )
}

export function StaggerTableBody({ children }: { children: ReactNode }) {
  return (
    <motion.tbody
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "50px" }}
    >
      {children}
    </motion.tbody>
  )
}

export function StaggerTableRow({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <motion.tr variants={itemVariants} className={className}>
      {children}
    </motion.tr>
  )
}
