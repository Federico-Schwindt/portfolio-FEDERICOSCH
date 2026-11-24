// Imported only by the isolated integration test and its child processes.
// Rewrite SQL identifiers, never bind parameters (which may contain client text).
const schema = process.env.STUDIO_TEST_SCHEMA
if (!/^studio_test_[a-f0-9]{32}$/.test(schema ?? '')) throw new Error('Expected an isolated test schema')
const original = globalThis.fetch
const accepted = new Map()
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : input)
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return original(input, init)
  if (url.href === 'https://api.resend.com/emails') {
    const msg = JSON.parse(init.body)
    if (!/^[^@\s]+@example\.com$/.test(msg.to)) throw new Error('Expected test recipient')
    const key = new Headers(init.headers).get('Idempotency-Key')
    if (!key || !msg.text || !msg.subject || !msg.from) return new Response(null, {status:422})
    if (accepted.has(key) && accepted.get(key) !== init.body) return new Response(null, {status:409})
    const first = !accepted.has(key)
    accepted.set(key, init.body)
    // Exercise a lost acknowledgement after the provider accepted the message.
    if (first && msg.text.includes('retry-fixture')) throw new Error('Simulated timeout')
    return Response.json({id: key})
  }
  if (!new Headers(init?.headers).has('Neon-Connection-String')) throw new Error('Unexpected external request in test')
  const body = JSON.parse(init.body)
  for (const q of body.queries ?? [body]) q.query = q.query.replace(/\bstudio\./g, schema + '.')
  return original(input, {...init, body: JSON.stringify(body)})
}
