import type { CaseBrief } from '../types/brief'

const API_URL = '/api/generate-brief'

export async function generateBrief(text: string): Promise<CaseBrief> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? `Server error ${res.status}`)
  }

  return res.json() as Promise<CaseBrief>
}
