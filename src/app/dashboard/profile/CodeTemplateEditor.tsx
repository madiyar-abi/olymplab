'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Editor from '@monaco-editor/react'
import { useTheme } from '@/components/shared/ThemeProvider'

export function CodeTemplateEditor({ initialTemplate }: { initialTemplate: string }) {
  const { resolvedTheme } = useTheme()
  const [template, setTemplate] = useState(initialTemplate)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const supabase = createClient()

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await (supabase.from('profiles') as any)
        .update({ code_template: template })
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground font-mono uppercase tracking-widest text-muted-foreground">
            Code Boilerplate
          </h3>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            This code will be pre-filled in the IDE for every new problem.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-6 py-2 rounded font-mono text-sm border transition-all ${
            saveStatus === 'success' 
              ? 'bg-green-500/10 border-green-500/50 text-green-500' 
              : saveStatus === 'error'
              ? 'bg-red-500/10 border-red-500/50 text-red-500'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 border-primary shadow-sm'
          }`}
        >
          {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error!' : 'Save Template'}
        </button>
      </div>

      <div className="h-[400px] rounded-xl border border-border overflow-hidden bg-background">
        <Editor
          height="100%"
          defaultLanguage="cpp"
          value={template}
          onChange={(value) => setTemplate(value || '')}
          theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>
    </div>
  )
}
