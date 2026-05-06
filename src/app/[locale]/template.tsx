export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both flex-1 flex flex-col min-h-0">
      {children}
    </div>
  )
}
