interface BriefSectionProps {
  title: string
  content: string
  icon: string
}

export default function BriefSection({ title, content, icon }: BriefSectionProps) {
  const isEmpty = !content || content.trim().length === 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-[#5c2d0a] font-sans">
          {title}
        </h3>
      </div>
      <div className="border-l-[3px] border-[#5c2d0a] ml-4 my-3 mr-4 pl-3">
        {isEmpty ? (
          <p className="text-sm text-gray-400 italic">
            Could not extract — please fill in manually.
          </p>
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
        )}
      </div>
    </div>
  )
}
