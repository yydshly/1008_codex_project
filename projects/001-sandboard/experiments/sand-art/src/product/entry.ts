export interface ProductEntry {
  mode: 'gesture' | 'reference'
  score?: string
  reference?: number
  view: 'process' | 'finished' | 'paused'
}

// Only select preserved works. A gallery link must never import or replace a draft.
export function readProductEntry(hash: string, scoreIds: readonly string[], referenceCount: number): ProductEntry | undefined {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const requestedView = params.get('view')
  const view = requestedView === 'finished' || requestedView === 'paused' ? requestedView : 'process'
  const score = params.get('score')
  if (score && scoreIds.includes(score)) return { mode: 'gesture', score, view }
  const reference = params.get('reference')
  if (reference !== null && /^\d+$/.test(reference) && Number(reference) < referenceCount)
    return { mode: 'reference', reference: Number(reference), view }
  return undefined
}
