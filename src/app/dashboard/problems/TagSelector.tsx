"use client"

import { useState, useRef, useEffect } from 'react'
import { X, Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagSelectorProps {
  allTags: string[]
  selectedTags: string[]
  onChange: (tags: string[]) => void
}

export function TagSelector({ allTags, selectedTags, onChange }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredTags = allTags.filter(tag => 
    tag.toLowerCase().includes(search.toLowerCase()) && !selectedTags.includes(tag)
  )

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag))
    } else {
      onChange([...selectedTags, tag])
    }
    setSearch('')
  }

  const removeTag = (tag: string) => {
    onChange(selectedTags.filter(t => t !== tag))
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative w-full max-w-2xl" ref={containerRef}>
      <div 
        className={cn(
          "min-h-[48px] p-2 flex flex-wrap gap-2 items-center bg-card border border-border rounded-xl cursor-text transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40",
          isOpen && "border-primary/40 ring-2 ring-primary/20"
        )}
        onClick={() => setIsOpen(true)}
      >
        {selectedTags.length === 0 && !search && (
          <span className="text-muted-foreground ml-2 text-sm font-mono">Filter by tags (dp, math, greedy...)</span>
        )}
        
        {selectedTags.map(tag => (
          <span 
            key={tag}
            className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg text-xs font-semibold animate-in fade-in zoom-in duration-200"
          >
            {tag}
            <button 
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
              className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <input
          type="text"
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm font-mono text-foreground placeholder:text-muted-foreground/50 p-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedTags.length > 0 ? "" : "Type to search..."}
        />
        
        <div className="flex items-center pr-1 text-muted-foreground">
          {selectedTags.length > 0 && (
            <button 
              onClick={(e) => {
                e.stopPropagation()
                onChange([])
              }}
              className="p-1 hover:text-foreground transition-colors mr-1"
              title="Clear all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronsUpDown className="w-4 h-4 opacity-50" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
            {filteredTags.length > 0 ? (
              filteredTags.map(tag => (
                <button
                  key={tag}
                  className="w-full text-left px-3 py-2 text-sm font-mono rounded-lg hover:bg-secondary transition-colors flex items-center justify-between group"
                  onClick={() => toggleTag(tag)}
                >
                  <span className="text-foreground group-hover:text-primary transition-colors">{tag}</span>
                  <Check className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground font-mono">
                {search ? "No tags found" : "No more tags to select"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
