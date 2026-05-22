import { useState } from 'react'
import type { CaseBrief } from '../types/brief'
import BriefSection from './BriefSection'

interface BriefOutputProps {
  brief: CaseBrief
  onStartOver: () => void
}

function formatClipboard(brief: CaseBrief): string {
  const sep = '━'.repeat(36)
  const damageLines = brief.damages.map(d => `  ${d}`).join('\n') || '  None detected'
  const totalLine = brief.totalAward ? `TOTAL: ${brief.totalAward}` : ''

  return [
    sep,
    `CASE BRIEF — ${brief.court || 'UNKNOWN COURT'}`,
    sep,
    `CASE NAME   : ${brief.caseName}`,
    `CASE NO.    : ${brief.caseNumber}`,
    `JUDGE       : ${brief.judge}`,
    `DATE        : ${brief.date}`,
    '',
    'FACTS',
    brief.facts || '(not extracted)',
    '',
    'LEGAL ISSUE',
    brief.issue || '(not extracted)',
    '',
    'HOLDING',
    brief.holding || '(not extracted)',
    '',
    'REASONING',
    brief.reasoning || '(not extracted)',
    '',
    'DAMAGES',
    damageLines,
    ...(totalLine ? [totalLine] : []),
    sep,
  ].join('\n')
}

function OutcomeBadge({ outcome }: { outcome: CaseBrief['outcome'] }) {
  if (outcome === 'plaintiff')
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        Plaintiff wins
      </span>
    )
  if (outcome === 'defendant')
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
        Defendant wins
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
      <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
      Unclear outcome
    </span>
  )
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 min-w-30 bg-[#5c2d0a]/5 rounded-lg px-3 py-2 border border-[#5c2d0a]/10">
      <div className="text-[10px] uppercase tracking-widest text-[#5c2d0a]/60 font-semibold mb-0.5">
        {label}
      </div>
      <div className="text-sm font-medium text-[#5c2d0a] truncate">
        {value || <span className="text-gray-400 italic font-normal">—</span>}
      </div>
    </div>
  )
}

export default function BriefOutput({ brief, onStartOver }: BriefOutputProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(formatClipboard(brief))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownloadPdf() {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const margin = 20
      const pageWidth = 210 - margin * 2
      let y = margin

      const addText = (text: string, size: number, bold = false, color = '#111111') => {
        doc.setFontSize(size)
        doc.setFont('helvetica', bold ? 'bold' : 'normal')
        doc.setTextColor(color)
        const lines = doc.splitTextToSize(text, pageWidth)
        lines.forEach((line: string) => {
          if (y > 270) { doc.addPage(); y = margin }
          doc.text(line, margin, y)
          y += size * 0.5
        })
        y += 2
      }

      addText('CASE BRIEF', 18, true, '#5c2d0a')
      addText(brief.caseName, 14, true)
      y += 4

      addText(`Case No.: ${brief.caseNumber}`, 10)
      addText(`Court: ${brief.court}`, 10)
      addText(`Judge: ${brief.judge}`, 10)
      addText(`Date: ${brief.date}`, 10)
      y += 6

      const section = (title: string, body: string) => {
        addText(title, 11, true, '#5c2d0a')
        addText(body || '(not extracted)', 10)
        y += 4
      }

      section('FACTS', brief.facts)
      section('LEGAL ISSUE', brief.issue)
      section('HOLDING', brief.holding)
      section('REASONING', brief.reasoning)

      addText('DAMAGES', 11, true, '#5c2d0a')
      brief.damages.forEach(d => addText(`• ${d}`, 10))
      if (brief.totalAward) addText(`Total Award: ${brief.totalAward}`, 10, true)

      doc.save(`${brief.caseName.replace(/[^a-z0-9]/gi, '_')}_brief.pdf`)
    })
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#5c2d0a] leading-tight">
              {brief.caseName}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{brief.caseNumber}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OutcomeBadge outcome={brief.outcome} />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-sm border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors text-gray-700"
            >
              {copied ? '✓ Copied' : '⎘ Copy brief'}
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 text-sm bg-[#5c2d0a] text-white rounded-lg px-3 py-1.5 hover:bg-[#4a2208] transition-colors"
            >
              ↓ Download PDF
            </button>
          </div>
        </div>

        {/* Stat chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          <StatChip label="Court" value={brief.court} />
          <StatChip label="Judge" value={brief.judge} />
          <StatChip label="Date" value={brief.date} />
          <StatChip label="Total Award" value={brief.totalAward} />
        </div>
      </div>

      {/* Sections */}
      <BriefSection title="Facts" content={brief.facts} icon="📋" />
      <BriefSection title="Legal Issue" content={brief.issue} icon="⚖️" />
      <BriefSection title="Holding" content={brief.holding} icon="🔨" />
      <BriefSection title="Reasoning" content={brief.reasoning} icon="💡" />

      {/* Damages table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-[#5c2d0a] font-sans">
            Damages &amp; Awards
          </h3>
        </div>
        {brief.damages.length === 0 ? (
          <p className="text-sm text-gray-400 italic px-4 py-3">
            Could not extract — please fill in manually.
          </p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {brief.damages.map((d, i) => {
                const [label, ...rest] = d.split(':')
                return (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-2.5 text-gray-600">{label.trim()}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-gray-800">
                      {rest.join(':').trim()}
                    </td>
                  </tr>
                )
              })}
              {brief.totalAward && (
                <tr className="bg-[#5c2d0a]/5">
                  <td className="px-4 py-2.5 font-semibold text-[#5c2d0a]">Total Award</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-[#5c2d0a]">
                    {brief.totalAward}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-center pt-2 pb-6">
        <button
          onClick={onStartOver}
          className="text-sm text-gray-500 border border-gray-300 rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
        >
          ← Start over
        </button>
      </div>
    </div>
  )
}
