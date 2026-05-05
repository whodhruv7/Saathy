import { useState, useEffect } from 'react'
import { X, Key, ExternalLink } from 'lucide-react'

interface SettingsPageProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPage({ isOpen, onClose }: SettingsPageProps) {
  const [keys, setKeys] = useState({
    groq: '',
    openrouter: '',
    gemini: '',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setKeys({
        groq: localStorage.getItem('groq_key') || '',
        openrouter: localStorage.getItem('openrouter_key') || '',
        gemini: localStorage.getItem('gemini_key') || '',
      })
      setSaved(false)
    }
  }, [isOpen])

  const saveKeys = () => {
    if (keys.groq) localStorage.setItem('groq_key', keys.groq)
    if (keys.openrouter) localStorage.setItem('openrouter_key', keys.openrouter)
    if (keys.gemini) localStorage.setItem('gemini_key', keys.gemini)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl max-w-md w-full shadow-2xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[hsl(var(--brand-forest))]" />
            <h2 className="font-serif text-lg font-semibold">API Keys</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-muted-foreground">
            Keys are stored only in your browser. Never sent anywhere except to the APIs.
          </p>

          {/* Groq */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              Groq API Key
              <span className="text-xs text-[hsl(var(--brand-forest))] bg-[hsl(var(--brand-forest))]/10 px-2 py-0.5 rounded">Recommended</span>
            </label>
            <input
              type="password"
              placeholder="gsk_..."
              value={keys.groq}
              onChange={(e) => setKeys({ ...keys, groq: e.target.value })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-forest))]"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Get free at:{" "}
              <a 
                href="https://console.groq.com" 
                target="_blank" 
                rel="noreferrer"
                className="text-[hsl(var(--brand-forest))] hover:underline flex items-center gap-0.5"
              >
                console.groq.com <ExternalLink className="w-3 h-3" />
              </a>
              <span className="ml-2 text-[hsl(var(--tier-2))]">14,400 req/day</span>
            </p>
          </div>

          {/* OpenRouter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">OpenRouter API Key</label>
            <input
              type="password"
              placeholder="sk-or-..."
              value={keys.openrouter}
              onChange={(e) => setKeys({ ...keys, openrouter: e.target.value })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-forest))]"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Get free at:{" "}
              <a 
                href="https://openrouter.ai" 
                target="_blank" 
                rel="noreferrer"
                className="text-[hsl(var(--brand-forest))] hover:underline flex items-center gap-0.5"
              >
                openrouter.ai <ExternalLink className="w-3 h-3" />
              </a>
              <span className="ml-2 text-[hsl(var(--tier-2))]">200 req/day per model</span>
            </p>
          </div>

          {/* Gemini */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Google Gemini API Key</label>
            <input
              type="password"
              placeholder="AIza..."
              value={keys.gemini}
              onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-forest))]"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Get free at:{" "}
              <a 
                href="https://ai.google.dev" 
                target="_blank" 
                rel="noreferrer"
                className="text-[hsl(var(--brand-forest))] hover:underline flex items-center gap-0.5"
              >
                ai.google.dev <ExternalLink className="w-3 h-3" />
              </a>
              <span className="ml-2 text-[hsl(var(--tier-2))]">1,500 req/day</span>
            </p>
          </div>

          {saved && (
            <div className="text-sm text-[hsl(var(--brand-forest))] bg-[hsl(var(--brand-forest))]/10 px-3 py-2 rounded-lg">
              Keys saved successfully! Refresh the page to use them.
            </div>
          )}

          <button
            onClick={saveKeys}
            className="w-full py-3 bg-[hsl(var(--brand-forest))] hover:bg-[hsl(var(--brand-forest))]/90 text-white font-medium rounded-lg transition-colors"
          >
            Save Keys
          </button>
        </div>
      </div>
    </div>
  )
}
