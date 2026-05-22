import { useState } from 'react'
import { sampleRuling } from '../utils/sampleRuling'

interface InputPanelProps {
  onGenerate: (text: string) => void
  isLoading: boolean
}

export default function InputPanel({ onGenerate, isLoading }: InputPanelProps) {
  const [text, setText] = useState('')

  function handleGenerate() {
    if (text.trim().length === 0) return
    onGenerate(text)
  }

  function loadSample() {
    setText(sampleRuling)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-serif font-semibold text-[#5c2d0a]">
          Paste Court Ruling
        </h2>
        <button
          onClick={loadSample}
          disabled={isLoading}
          className="text-sm text-[#5c2d0a] border border-[#5c2d0a]/30 rounded-lg px-3 py-1.5 hover:bg-[#5c2d0a]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Load sample ruling
        </button>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={isLoading}
        placeholder="Paste the full court ruling text here…"
        className="w-full min-h-45 resize-y rounded-lg border border-gray-200 p-3 font-mono text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5c2d0a]/30 focus:border-[#5c2d0a]/50 transition bg-gray-50/40 disabled:opacity-60"
      />

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-400 font-mono">
          {text.length.toLocaleString()} characters
        </span>

        <button
          onClick={handleGenerate}
          disabled={isLoading || text.trim().length === 0}
          className="flex items-center gap-2 bg-[#5c2d0a] text-white text-sm font-medium rounded-lg px-5 py-2.5 hover:bg-[#4a2208] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Extracting case information…
            </>
          ) : (
            <>
              Generate Brief
              <span className="text-base">→</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
