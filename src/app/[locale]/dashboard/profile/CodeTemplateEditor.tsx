'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Editor from '@monaco-editor/react'
import { useTheme } from '@/components/shared/ThemeProvider'
import { ChevronDown, Code2, RotateCcw } from 'lucide-react'

const DEFAULT_TEMPLATES: Record<string, string> = {
  cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

void solve() {
    
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int t = 1;
    // cin >> t;
    while (t--) {
        solve();
    }
    return 0;
}`,
  python: `import sys

def solve():
    pass

if __name__ == "__main__":
    solve()`,
  java: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Your code here
    }
}`,
  rust: `use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).expect("Failed to read line");
}`,
  go: `package main

import "fmt"

func main() {
    // Your code here
}`,
  javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf8');
    // Your code here
}

solve();`
}

const LANGUAGES = [
  { label: 'C++', value: 'cpp' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'Rust', value: 'rust' },
  { label: 'Go', value: 'go' },
  { label: 'JavaScript', value: 'javascript' },
]

export function CodeTemplateEditor({ 
  initialTemplate, 
  initialLanguage = 'cpp' 
}: { 
  initialTemplate: string;
  initialLanguage?: string;
}) {
  const t = useTranslations('Settings')
  const { resolvedTheme } = useTheme()
  const defaultForLang = DEFAULT_TEMPLATES[initialLanguage] || DEFAULT_TEMPLATES['cpp']
  const [template, setTemplate] = useState(() => {
    return initialTemplate && initialTemplate.trim().length > 0 ? initialTemplate : defaultForLang
  })
  const [language, setLanguage] = useState(initialLanguage)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const supabase = createClient()

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    setTemplate(DEFAULT_TEMPLATES[newLang] || '')
  }

  const handleReset = () => {
    setTemplate(DEFAULT_TEMPLATES[language] || DEFAULT_TEMPLATES['cpp'])
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({ code_template: template, preferred_language: language } as never)
        .eq('id', user.id)

      if (error) throw error
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      console.error('Error saving template:', err)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Code2 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground font-mono uppercase tracking-widest text-muted-foreground">
              {t('boilerplate')}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {t('boilerplateDesc')}
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative group w-full sm:w-44">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full bg-background/40 backdrop-blur-md border border-border text-sm text-foreground px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer appearance-none pr-10 font-mono"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value} className="bg-background text-foreground">
                  {lang.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none transition-transform group-hover:text-foreground" />
          </div>

          <button
            type="button"
            onClick={handleReset}
            title="Reset template to default"
            className="px-3 py-2.5 rounded-xl font-mono text-xs border border-border bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-mono text-sm border transition-all duration-300 ${
              saveStatus === 'success' 
                ? 'bg-green-500/10 border-green-500/50 text-green-500' 
                : saveStatus === 'error'
                ? 'bg-red-500/10 border-red-500/50 text-red-500'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 border-primary shadow-sm'
            }`}
          >
            {isSaving ? t('saving') : saveStatus === 'success' ? t('saved') : saveStatus === 'error' ? t('saveError') : t('save')}
          </button>
        </div>
      </div>

      <div className="h-[450px] rounded-2xl border border-border overflow-hidden bg-[#1e1e1e] shadow-2xl relative group">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <Editor
          height="100%"
          language={language}
          value={template}
          onChange={(value) => setTemplate(value || '')}
          theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 20, bottom: 20 },
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            bracketPairColorization: { enabled: true },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
          }}
        />
      </div>
    </div>
  )
}

