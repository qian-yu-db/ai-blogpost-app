import type { AgentSSEEvent } from '@/types'

export async function* streamSSE(url: string, body: unknown): AsyncGenerator<AgentSSEEvent> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Stream request failed: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() || ''

    for (const chunk of chunks) {
      if (!chunk.trim()) continue

      let eventType = 'text'
      let data = ''

      for (const line of chunk.split('\n')) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim()
        } else if (line.startsWith('data: ')) {
          data = line.slice(6)
        }
      }

      if (!data) continue

      const parsed = JSON.parse(data)

      switch (eventType) {
        case 'text':
          yield { type: 'text', content: parsed.content }
          break
        case 'tool_use':
          yield { type: 'tool_use', tool: parsed.tool, input: parsed.input }
          break
        case 'tool_result':
          yield { type: 'tool_result', tool: parsed.tool, result: parsed.result }
          break
        case 'phase_change':
          yield { type: 'phase_change', phase: parsed.phase, topic: parsed.topic }
          break
        case 'outline':
          yield { type: 'outline', content: parsed.content }
          break
        case 'draft_chunk':
          yield { type: 'draft_chunk', content: parsed.content }
          break
        case 'review':
          yield { type: 'review', suggestions: parsed.suggestions }
          break
        case 'done':
          yield { type: 'done' }
          return
      }
    }
  }
}
