export default function Header() {
  return (
    <header className="bg-[#5c2d0a] text-white px-6 py-4 shadow-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-lg font-bold font-serif">
            K
          </div>
          <div>
            <h1 className="text-xl font-serif font-semibold tracking-tight leading-none">
              KesiAI
            </h1>
            <p className="text-xs text-blue-200 mt-0.5">Case Brief Generator</p>
          </div>
        </div>
        <div className="text-xs text-blue-300 hidden sm:block">
          Powered by client-side NLP, no data leaves your browser
        </div>
      </div>
    </header>
  )
}
