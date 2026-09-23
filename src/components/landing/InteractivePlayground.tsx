'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, Bot, Terminal, CheckCircle2, ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/utils'

type Lang = 'cpp' | 'python' | 'rust'

const SNIPPETS: Record<Lang, { filename: string; code: string; highlightLang: string }> = {
  cpp: {
    filename: 'solution.cpp',
    highlightLang: 'C++20',
    code: `#include <bits/stdc++.h>
using namespace std;

// Compute prefix sums for O(1) range sum queries
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, q;
    if (!(cin >> n >> q)) return 0;

    vector<long long> pref(n + 1, 0);
    for (int i = 1; i <= n; ++i) {
        long long x; cin >> x;
        pref[i] = pref[i - 1] + x;
    }

    while (q--) {
        int l, r; cin >> l >> r;
        cout << (pref[r] - pref[l - 1]) << "\\n";
    }
    return 0;
}`,
  },
  python: {
    filename: 'solution.py',
    highlightLang: 'Python 3',
    code: `import sys

def main():
    input = sys.stdin.read
    data = input().split()
    if not data: return

    n = int(data[0])
    q = int(data[1])
    
    # Build prefix sum array
    pref = [0] * (n + 1)
    for i in range(1, n + 1):
        pref[i] = pref[i - 1] + int(data[1 + i])

    idx = 2 + n
    out = []
    for _ in range(q):
        l, r = int(data[idx]), int(data[idx + 1])
        idx += 2
        out.append(str(pref[r] - pref[l - 1]))

    sys.stdout.write("\\n".join(out) + "\\n")

if __name__ == '__main__':
    main()`,
  },
  rust: {
    filename: 'solution.rs',
    highlightLang: 'Rust 2021',
    code: `use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let mut iter = input.split_whitespace();

    if let (Some(n_str), Some(q_str)) = (iter.next(), iter.next()) {
        let n: usize = n_str.parse().unwrap();
        let q: usize = q_str.parse().unwrap();

        let mut pref = vec![0i64; n + 1];
        for i in 1..=n {
            let x: i64 = iter.next().unwrap().parse().unwrap();
            pref[i] = pref[i - 1] + x;
        }

        for _ in 0..q {
            let l: usize = iter.next().unwrap().parse().unwrap();
            let r: usize = iter.next().unwrap().parse().unwrap();
            println!("{}", pref[r] - pref[l - 1]);
        }
    }
}`,
  },
}

export function InteractivePlayground() {
  const [lang, setLang] = useState<Lang>('cpp')
  const [activeTab, setActiveTab] = useState<'code' | 'input'>('code')
  const [isRunning, setIsRunning] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [mentorStep, setMentorStep] = useState(0)

  const mentorHints = [
    {
      title: 'Step 1: Understand the Constraints',
      text: 'Notice that N, Q <= 200,000. A naive range sum takes O(N) per query, leading to O(N * Q) = 4 * 10^10 operations — Time Limit Exceeded.',
    },
    {
      title: 'Step 2: Prefix Invariant',
      text: 'By precomputing pref[i] = pref[i-1] + a[i] in O(N), every range query sum(L, R) is answered in O(1) via pref[R] - pref[L-1].',
    },
    {
      title: 'Step 3: Verification',
      text: 'Total complexity: O(N + Q) time and O(N) auxiliary space. This comfortably passes well within the 1.0s time limit!',
    },
  ]

  const handleRun = () => {
    setIsRunning(true)
    setHasRun(false)
    setTimeout(() => {
      setIsRunning(false)
      setHasRun(true)
    }, 600)
  }

  const handleReset = () => {
    setHasRun(false)
    setMentorStep(0)
  }

  const handleNextMentorHint = () => {
    setMentorStep((prev) => (prev + 1) % mentorHints.length)
  }

  return (
    <div className="relative rounded-2xl border border-white/15 bg-[#0b0b0f] shadow-[0_30px_120px_-30px_rgba(0,0,0,0.9)] overflow-hidden">
      {/* Window Chrome */}
      <div className="h-12 bg-[#121217] border-b border-white/10 flex items-center justify-between px-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          {/* Language Switcher */}
          <div className="flex bg-black/40 rounded-lg border border-white/10 p-0.5 text-xs font-mono">
            {(['cpp', 'python', 'rust'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  'px-2.5 py-1 rounded transition-colors',
                  lang === l
                    ? 'bg-amber-400 text-black font-bold'
                    : 'text-white/60 hover:text-white'
                )}
              >
                {SNIPPETS[l].highlightLang}
              </button>
            ))}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2">
          <div className="flex bg-black/40 rounded-lg border border-white/10 p-0.5 text-[11px] font-mono">
            <button
              onClick={() => setActiveTab('code')}
              className={cn(
                'px-2.5 py-1 rounded transition-colors',
                activeTab === 'code' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
              )}
            >
              {SNIPPETS[lang].filename}
            </button>
            <button
              onClick={() => setActiveTab('input')}
              className={cn(
                'px-2.5 py-1 rounded transition-colors',
                activeTab === 'input' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
              )}
            >
              input.txt (Sample)
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleNextMentorHint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 text-xs font-medium transition-all"
            title="Socratic hint"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pólya Hint</span>
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'Running…' : 'Run Code'}</span>
          </button>
          {hasRun && (
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Editor Area */}
        <div className="flex-1 p-5 sm:p-6 font-mono text-[12.5px] leading-relaxed bg-[#0b0b0f] border-b lg:border-b-0 lg:border-r border-white/10 max-h-[380px] overflow-y-auto">
          {activeTab === 'code' ? (
            <pre className="text-[#d4d4d4] overflow-x-auto whitespace-pre font-mono">
              <code>{SNIPPETS[lang].code}</code>
            </pre>
          ) : (
            <div className="space-y-2 text-white/80 font-mono text-xs">
              <div className="text-white/40">{`// Sample input: N=5 elements, Q=3 queries`}</div>
              <div className="text-amber-200">5 3</div>
              <div className="text-emerald-300">2 3 -1 8 4</div>
              <div className="text-sky-300">1 3</div>
              <div className="text-sky-300">2 5</div>
              <div className="text-sky-300">1 5</div>
            </div>
          )}
        </div>

        {/* Terminal & Mentor Split */}
        <div className="w-full lg:w-[380px] flex flex-col bg-[#08080b] divide-y divide-white/10">
          {/* Terminal Console */}
          <div className="p-4 flex flex-col flex-1">
            <div className="flex items-center justify-between text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
              <span className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                Live Execution Console
              </span>
              <span className="text-[10px] text-white/30 font-mono">Wandbox Judge</span>
            </div>

            <div className="font-mono text-xs space-y-2 flex-1 min-h-[140px]">
              <div className="text-white/40">
                $ {lang === 'cpp' ? 'g++ -O3 -std=c++20 solution.cpp' : lang === 'python' ? 'python3 -O solution.py' : 'rustc --edition 2021 -O solution.rs'}
              </div>
              <div className="text-white/40">$ ./solution &lt; sample.in</div>

              {isRunning && (
                <div className="flex items-center gap-2 text-amber-300 animate-pulse pt-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Compiling & Evaluating test cases…
                </div>
              )}

              {hasRun && !isRunning && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2 pt-2"
                >
                  <div className="text-white/70">
                    Stdout:<br />
                    <span className="text-amber-200 font-bold">4</span><br />
                    <span className="text-amber-200 font-bold">14</span><br />
                    <span className="text-amber-200 font-bold">16</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Test 1/1: Correct Answer (9 ms)</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-emerald-300 font-bold text-xs mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Accepted (AC)
                  </div>
                </motion.div>
              )}

              {!hasRun && !isRunning && (
                <div className="text-white/30 pt-3 text-[11px] leading-relaxed">
                  Click <span className="text-amber-300 font-bold">Run Code</span> to compile and execute this algorithm on the remote sandboxed judge in real time.
                </div>
              )}
            </div>
          </div>

          {/* Socratic Mentor Bubble */}
          <div className="p-4 bg-violet-950/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-violet-300">
                <Bot className="w-4 h-4 text-violet-400" />
                <span>Pólya Socratic Mentor</span>
              </div>
              <span className="text-[10px] text-violet-300/60 font-mono">
                Hint {mentorStep + 1}/{mentorHints.length}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={mentorStep}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 text-xs"
              >
                <div className="font-semibold text-violet-200 mb-1">
                  {mentorHints[mentorStep].title}
                </div>
                <p className="text-white/70 leading-relaxed">
                  {mentorHints[mentorStep].text}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-2.5 flex items-center justify-between">
              <button
                onClick={handleNextMentorHint}
                className="text-[11px] text-violet-300/80 hover:text-violet-200 font-medium flex items-center gap-1 transition-colors"
              >
                <span>Next Socratic observation</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <Link
                href="/dashboard/problems"
                className="text-[11px] text-amber-300 hover:text-amber-200 font-bold transition-colors"
              >
                Open in Full IDE &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
