import { useState } from 'react'
import Header from './components/Header'
import InputPanel from './components/InputPanel'
import BriefOutput from './components/BriefOutput'
import { generateBrief } from './utils/extractor'
import type { CaseBrief } from './types/brief'

export default function App() {
  const [brief, setBrief] = useState<CaseBrief | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate(text: string) {
    setIsLoading(true)
    setError(null)
    try {
      const result = await generateBrief(text)
      setBrief(result)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not reach the NLP server. Make sure the Python backend is running on port 8000.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  function handleStartOver() {
    setBrief(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2] flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {!brief && (
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-serif font-bold text-[#5c2d0a] mb-1">
              Generate a structured case brief in seconds
            </h2>
            <p className="text-sm text-gray-500">
              Paste any Kenyan court ruling below. NLP runs on a local Python server.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!brief ? (
          <InputPanel onGenerate={handleGenerate} isLoading={isLoading} />
        ) : (
          <BriefOutput brief={brief} onStartOver={handleStartOver} />
        )}
      </main>

      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200 bg-white/60">
        KesiAI · Built by IgniteDev · BIT4133 Natural Language Processing
      </footer>
    </div>
  )
}
