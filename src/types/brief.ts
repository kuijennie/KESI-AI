export interface CaseBrief {
  caseName: string
  caseNumber: string
  court: string
  date: string
  judge: string
  plaintiff: string
  defendant: string
  facts: string
  issue: string
  holding: string
  reasoning: string
  damages: string[]
  totalAward: string
  outcome: 'plaintiff' | 'defendant' | 'unclear'
}
