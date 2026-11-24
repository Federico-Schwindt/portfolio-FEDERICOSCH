import { createHash } from 'node:crypto'

const digest = (value: string) => createHash('sha256').update(value).digest('base64url').slice(0, 22)

// Increment the format when the projection changes, including changes to computed fields.
export function revisionTag(viewer: string, revision: string, collections: string) {
  return digest(JSON.stringify([1, viewer, revision, collections]))
}

/** Compare the authorized projection, including computed fields and deletions. Keep no server-side session cache. */
export function stateResponse(state: Record<string, unknown>, viewer: string, previous: string | null, revision?: string) {
  const headers: Record<string, string> = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' }
  if (previous === null) return Response.json(state, { headers })

  const entries = Object.entries(state)
  const [scope, ...known] = previous.split('~')[0].split('.')
  const identity = digest(JSON.stringify([viewer, entries.map(([key]) => key)]))
  const tags = [identity]
  const changed: Record<string, unknown> = {}
  for (const [i, [key, value]] of entries.entries()) {
    const tag = digest(JSON.stringify(value))
    tags.push(tag)
    if (scope !== identity || tag !== known[i]) changed[key] = value
  }
  const collections = tags.join('.')
  headers['x-studio-version'] = revision ? collections + '~' + revisionTag(viewer, revision, collections) : collections
  if (!Object.keys(changed).length) return new Response(null, { status: 204, headers })
  // A different account or role must replace the previous snapshot in its entirety.
  if (scope === identity) headers['x-studio-delta'] = '1'
  return Response.json(changed, { headers })
}
