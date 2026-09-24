import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

export interface ExecutionResult {
  stdout: string
  stderr: string
  code: number
  durationMs?: number
  isLocal?: boolean
}

/**
 * Executes user code locally when local compilers / interpreters are available.
 * Much faster than remote API roundtrips (30ms-700ms vs 4000ms-15000ms).
 */
export function executeLocally(
  code: string,
  stdin: string = '',
  language: string = 'cpp',
  timeoutMs: number = 6000
): ExecutionResult | null {
  const langLower = language.toLowerCase()
  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const tmpBase = os.tmpdir()
  const runDir = path.join(tmpBase, 'olymplab_sandbox', runId)

  const startTime = Date.now()

  try {
    fs.mkdirSync(runDir, { recursive: true })

    // ─── C++ ───
    if (langLower === 'cpp' || langLower === 'c++' || langLower.includes('c++')) {
      const srcPath = path.join(runDir, 'solution.cpp')
      const binPath = path.join(runDir, 'solution.out')
      fs.writeFileSync(srcPath, code, 'utf8')

      // Find compiler: prefer clang++ then g++
      const compiler = fs.existsSync('/usr/bin/clang++')
        ? '/usr/bin/clang++'
        : fs.existsSync('/usr/bin/g++')
        ? '/usr/bin/g++'
        : 'clang++'

      const comp = spawnSync(compiler, ['-std=c++17', '-O0', srcPath, '-o', binPath], {
        timeout: 10000,
        maxBuffer: 2 * 1024 * 1024,
      })

      if (comp.error || comp.status !== 0) {
        return {
          stdout: '',
          stderr: comp.stderr?.toString('utf8') || comp.error?.message || 'Compilation failed',
          code: comp.status ?? 1,
          durationMs: Date.now() - startTime,
          isLocal: true,
        }
      }

      const exec = spawnSync(binPath, [], {
        input: stdin || '',
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
      })

      if (exec.error && (exec.error as NodeJS.ErrnoException).code === 'ETIMEDOUT') {
        return {
          stdout: exec.stdout?.toString('utf8') || '',
          stderr: `Time Limit Exceeded (${timeoutMs}ms)`,
          code: 124,
          durationMs: Date.now() - startTime,
          isLocal: true,
        }
      }

      return {
        stdout: exec.stdout?.toString('utf8') || '',
        stderr: exec.stderr?.toString('utf8') || '',
        code: exec.status ?? (exec.signal ? 1 : 0),
        durationMs: Date.now() - startTime,
        isLocal: true,
      }
    }

    // ─── C ───
    if (langLower === 'c') {
      const srcPath = path.join(runDir, 'solution.c')
      const binPath = path.join(runDir, 'solution.out')
      fs.writeFileSync(srcPath, code, 'utf8')

      const compiler = fs.existsSync('/usr/bin/clang') ? '/usr/bin/clang' : 'gcc'
      const comp = spawnSync(compiler, ['-O0', srcPath, '-o', binPath], {
        timeout: 8000,
        maxBuffer: 2 * 1024 * 1024,
      })

      if (comp.error || comp.status !== 0) {
        return {
          stdout: '',
          stderr: comp.stderr?.toString('utf8') || comp.error?.message || 'Compilation failed',
          code: comp.status ?? 1,
          durationMs: Date.now() - startTime,
          isLocal: true,
        }
      }

      const exec = spawnSync(binPath, [], {
        input: stdin || '',
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
      })

      return {
        stdout: exec.stdout?.toString('utf8') || '',
        stderr: exec.stderr?.toString('utf8') || '',
        code: exec.status ?? (exec.signal ? 1 : 0),
        durationMs: Date.now() - startTime,
        isLocal: true,
      }
    }

    // ─── Python ───
    if (langLower.includes('python') || langLower === 'py') {
      const srcPath = path.join(runDir, 'solution.py')
      fs.writeFileSync(srcPath, code, 'utf8')

      const pythonBin = fs.existsSync('/opt/anaconda3/bin/python3')
        ? '/opt/anaconda3/bin/python3'
        : fs.existsSync('/usr/local/bin/python3')
        ? '/usr/local/bin/python3'
        : fs.existsSync('/usr/bin/python3')
        ? '/usr/bin/python3'
        : 'python3'

      const exec = spawnSync(pythonBin, [srcPath], {
        input: stdin || '',
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
      })

      if (exec.error && (exec.error as NodeJS.ErrnoException).code === 'ETIMEDOUT') {
        return {
          stdout: exec.stdout?.toString('utf8') || '',
          stderr: `Time Limit Exceeded (${timeoutMs}ms)`,
          code: 124,
          durationMs: Date.now() - startTime,
          isLocal: true,
        }
      }

      return {
        stdout: exec.stdout?.toString('utf8') || '',
        stderr: exec.stderr?.toString('utf8') || '',
        code: exec.status ?? (exec.signal ? 1 : 0),
        durationMs: Date.now() - startTime,
        isLocal: true,
      }
    }

    // ─── JavaScript / Node.js ───
    if (langLower.includes('node') || langLower.includes('js') || langLower.includes('javascript')) {
      const srcPath = path.join(runDir, 'solution.js')
      fs.writeFileSync(srcPath, code, 'utf8')

      const exec = spawnSync('node', [srcPath], {
        input: stdin || '',
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
      })

      return {
        stdout: exec.stdout?.toString('utf8') || '',
        stderr: exec.stderr?.toString('utf8') || '',
        code: exec.status ?? 0,
        durationMs: Date.now() - startTime,
        isLocal: true,
      }
    }

    // ─── Java ───
    if (langLower.includes('java')) {
      let className = 'Solution'
      const match = code.match(/public\s+class\s+([A-Za-z0-9_]+)/)
      if (match) {
        className = match[1]
      }
      const srcPath = path.join(runDir, `${className}.java`)
      fs.writeFileSync(srcPath, code, 'utf8')

      const javacBin = fs.existsSync('/usr/bin/javac') ? '/usr/bin/javac' : 'javac'
      const comp = spawnSync(javacBin, [srcPath], {
        cwd: runDir,
        timeout: 10000,
        maxBuffer: 2 * 1024 * 1024,
      })

      if (comp.error || comp.status !== 0) {
        return {
          stdout: '',
          stderr: comp.stderr?.toString('utf8') || comp.error?.message || 'Compilation failed',
          code: comp.status ?? 1,
          durationMs: Date.now() - startTime,
          isLocal: true,
        }
      }

      const javaBin = fs.existsSync('/usr/bin/java') ? '/usr/bin/java' : 'java'
      const exec = spawnSync(javaBin, ['-cp', runDir, className], {
        cwd: runDir,
        input: stdin || '',
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
      })

      if (exec.error && (exec.error as NodeJS.ErrnoException).code === 'ETIMEDOUT') {
        return {
          stdout: exec.stdout?.toString('utf8') || '',
          stderr: `Time Limit Exceeded (${timeoutMs}ms)`,
          code: 124,
          durationMs: Date.now() - startTime,
          isLocal: true,
        }
      }

      return {
        stdout: exec.stdout?.toString('utf8') || '',
        stderr: exec.stderr?.toString('utf8') || '',
        code: exec.status ?? 0,
        durationMs: Date.now() - startTime,
        isLocal: true,
      }
    }

    return null
  } catch (err) {
    console.warn('[LocalRunner] Local execution failed or unsupported, falling back:', err)
    return null
  } finally {
    try {
      fs.rmSync(runDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup error
    }
  }
}
