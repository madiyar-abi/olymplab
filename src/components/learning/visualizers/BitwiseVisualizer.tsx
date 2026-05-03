'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BitwiseVisualizerProps {
  initialA?: number
  initialB?: number
}

export default function BitwiseVisualizer({ initialA = 12, initialB = 25 }: BitwiseVisualizerProps) {
  const [a, setA] = useState(initialA)
  const [b, setB] = useState(initialB)
  const [op, setOp] = useState<'AND' | 'OR' | 'XOR' | 'NOT' | 'LSHIFT' | 'RSHIFT'>('AND')

  const toBinary = (n: number) => {
    // Handle negative numbers for NOT if necessary, but keep 8-bit for simplicity
    const val = (n & 0xFF)
    return val.toString(2).padStart(8, '0').split('')
  }
  
  const compute = () => {
    switch(op) {
      case 'AND': return a & b
      case 'OR':  return a | b
      case 'XOR': return a ^ b
      case 'NOT': return ~a & 0xFF
      case 'LSHIFT': return (a << 1) & 0xFF
      case 'RSHIFT': return (a >> 1) & 0xFF
      default: return 0
    }
  }

  const result = compute()
  const binA = toBinary(a)
  const binB = toBinary(b)
  const binRes = toBinary(result)

  const isUnary = op === 'NOT' || op === 'LSHIFT' || op === 'RSHIFT'

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Песочница побитовых операций
          </h4>
          <p className="text-xs text-muted-foreground mt-1">Интерактивная работа с 8-битными числами</p>
        </div>
        
        <div className="flex flex-wrap bg-muted p-1 rounded-lg gap-1">
          {(['AND', 'OR', 'XOR', 'NOT', 'LSHIFT', 'RSHIFT'] as const).map(o => (
            <button
              key={o}
              onClick={() => setOp(o)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-tighter",
                op === o ? "bg-primary text-primary-foreground shadow-md scale-105" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8 font-mono">
        {/* Input A */}
        <div className="relative group">
          <div className="flex items-center justify-between mb-2">
             <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Operand A</span>
             <input 
              type="number" 
              value={a} 
              onChange={e => setA(Math.max(0, Math.min(255, parseInt(e.target.value) || 0)))}
              className="w-20 bg-secondary/50 border border-border rounded-lg px-2 py-1 text-sm font-bold text-sky-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex justify-center gap-1.5">
            {binA.map((bit, i) => (
              <motion.div 
                key={`a-${i}`}
                animate={{
                  backgroundColor: bit === '1' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(39, 39, 42, 0.5)',
                  borderColor: bit === '1' ? 'rgba(56, 189, 248, 0.5)' : 'rgba(63, 63, 70, 0.5)',
                  color: bit === '1' ? '#38bdf8' : '#71717a'
                }}
                className="w-10 h-12 flex flex-col items-center justify-center rounded-lg border-2 text-base font-bold shadow-sm"
              >
                {bit}
                <span className="text-[7px] opacity-40 mt-1">{Math.pow(2, 7-i)}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Input B (Hidden if unary) */}
        <AnimatePresence mode="wait">
          {!isUnary && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                 <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Operand B</span>
                 <input 
                  type="number" 
                  value={b} 
                  onChange={e => setB(Math.max(0, Math.min(255, parseInt(e.target.value) || 0)))}
                  className="w-20 bg-secondary/50 border border-border rounded-lg px-2 py-1 text-sm font-bold text-purple-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex justify-center gap-1.5">
                {binB.map((bit, i) => (
                  <div key={`b-${i}`} className={cn("w-10 h-12 flex flex-col items-center justify-center rounded-lg border-2 text-base font-bold transition-all shadow-sm", bit === '1' ? "bg-purple-500/10 border-purple-500/40 text-purple-400" : "bg-muted/50 border-border/50 text-muted-foreground")}>
                    {bit}
                    <span className="text-[7px] opacity-40 mt-1">{Math.pow(2, 7-i)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <div className="border-t border-border pt-8 mt-4 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-card px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Result</div>
          
          <div className="flex items-center justify-between mb-4">
             <div className="flex flex-col">
               <span className="text-[10px] text-primary font-bold uppercase tracking-widest">{op}</span>
               <span className="text-2xl font-black text-foreground">{result}</span>
             </div>
             <div className="text-right">
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Hex</span>
                <span className="text-sm font-bold text-foreground">0x{result.toString(16).toUpperCase().padStart(2, '0')}</span>
             </div>
          </div>

          <div className="flex justify-center gap-1.5">
            {binRes.map((bit, i) => {
              // Highlight the bit if it changed from A (or A/B)
              const aBit = binA[i]
              const bBit = binB[i]
              const changed = isUnary ? bit !== aBit : (bit === '1')

              return (
                <motion.div 
                  key={`${op}-${i}-${bit}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    "w-10 h-12 flex flex-col items-center justify-center rounded-lg border-2 text-base font-bold shadow-lg transition-all", 
                    bit === '1' ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-emerald-500/10" : "bg-muted/30 border-border text-muted-foreground"
                  )}
                >
                  {bit}
                  <span className="text-[7px] opacity-40 mt-1">{Math.pow(2, 7-i)}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Visual Logic Explanation */}
      <div className="mt-8 p-4 bg-primary/5 border border-primary/10 rounded-xl">
        <p className="text-[11px] text-muted-foreground leading-relaxed italic">
          {op === 'AND' && "Результат 1 только если оба бита равны 1. Используется для маскирования."}
          {op === 'OR' && "Результат 1 если хотя бы один из бит равен 1. Используется для установки бит."}
          {op === 'XOR' && "Результат 1 если биты различны. Используется для инверсии или обмена значений."}
          {op === 'NOT' && "Инвертирует каждый бит. 0 становится 1, 1 становится 0."}
          {op === 'LSHIFT' && "Сдвигает все биты влево на 1 позицию. Эквивалентно умножению на 2."}
          {op === 'RSHIFT' && "Сдвигает все биты вправо на 1 позицию. Эквивалентно делению на 2."}
        </p>
      </div>
    </div>
  )
}
