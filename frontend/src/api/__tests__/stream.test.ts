import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { streamSSE } from '../stream'

function makeSSE(events: Array<{ event: string; data: string }>): string {
  return events.map((e) => `event: ${e.event}\ndata: ${e.data}\n\n`).join('')
}

function createMockResponse(sseText: string): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sseText))
      controller.close()
    },
  })
  return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
}

describe('streamSSE', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('parses text events', async () => {
    const sse = makeSSE([
      { event: 'text', data: JSON.stringify({ content: 'Hello' }) },
      { event: 'done', data: '{}' },
    ])
    vi.mocked(fetch).mockResolvedValue(createMockResponse(sse))

    const events = []
    for await (const event of streamSSE('/api/test', {})) {
      events.push(event)
    }
    expect(events).toHaveLength(2)
    expect(events[0]).toEqual({ type: 'text', content: 'Hello' })
    expect(events[1]).toEqual({ type: 'done' })
  })

  it('parses tool_use events', async () => {
    const sse = makeSSE([
      { event: 'tool_use', data: JSON.stringify({ tool: 'fetch_url', input: { url: 'https://x.com' } }) },
      { event: 'done', data: '{}' },
    ])
    vi.mocked(fetch).mockResolvedValue(createMockResponse(sse))

    const events = []
    for await (const event of streamSSE('/api/test', {})) {
      events.push(event)
    }
    expect(events[0]).toEqual({ type: 'tool_use', tool: 'fetch_url', input: { url: 'https://x.com' } })
  })

  it('parses tool_result events', async () => {
    const sse = makeSSE([
      { event: 'tool_result', data: JSON.stringify({ tool: 'fetch_url', result: 'page content' }) },
      { event: 'done', data: '{}' },
    ])
    vi.mocked(fetch).mockResolvedValue(createMockResponse(sse))

    const events = []
    for await (const event of streamSSE('/api/test', {})) {
      events.push(event)
    }
    expect(events[0]).toEqual({ type: 'tool_result', tool: 'fetch_url', result: 'page content' })
  })

  it('parses phase_change events', async () => {
    const sse = makeSSE([
      { event: 'phase_change', data: JSON.stringify({ phase: 'drafting' }) },
      { event: 'done', data: '{}' },
    ])
    vi.mocked(fetch).mockResolvedValue(createMockResponse(sse))

    const events = []
    for await (const event of streamSSE('/api/test', {})) {
      events.push(event)
    }
    expect(events[0]).toEqual({ type: 'phase_change', phase: 'drafting' })
  })

  it('parses outline events', async () => {
    const sse = makeSSE([
      { event: 'outline', data: JSON.stringify({ content: '# Outline' }) },
      { event: 'done', data: '{}' },
    ])
    vi.mocked(fetch).mockResolvedValue(createMockResponse(sse))

    const events = []
    for await (const event of streamSSE('/api/test', {})) {
      events.push(event)
    }
    expect(events[0]).toEqual({ type: 'outline', content: '# Outline' })
  })

  it('parses draft_chunk events', async () => {
    const sse = makeSSE([
      { event: 'draft_chunk', data: JSON.stringify({ content: 'paragraph' }) },
      { event: 'done', data: '{}' },
    ])
    vi.mocked(fetch).mockResolvedValue(createMockResponse(sse))

    const events = []
    for await (const event of streamSSE('/api/test', {})) {
      events.push(event)
    }
    expect(events[0]).toEqual({ type: 'draft_chunk', content: 'paragraph' })
  })

  it('parses review events', async () => {
    const suggestions = [{ type: 'grammar', message: 'Fix typo' }]
    const sse = makeSSE([
      { event: 'review', data: JSON.stringify({ suggestions }) },
      { event: 'done', data: '{}' },
    ])
    vi.mocked(fetch).mockResolvedValue(createMockResponse(sse))

    const events = []
    for await (const event of streamSSE('/api/test', {})) {
      events.push(event)
    }
    expect(events[0]).toEqual({ type: 'review', suggestions })
  })

  it('throws on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }))

    await expect(async () => {
      for await (const _ of streamSSE('/api/test', {})) {
        // consume
      }
    }).rejects.toThrow('Stream request failed: 500')
  })

  it('stops on done event', async () => {
    const sse = makeSSE([
      { event: 'text', data: JSON.stringify({ content: 'A' }) },
      { event: 'done', data: '{}' },
      { event: 'text', data: JSON.stringify({ content: 'B' }) },
    ])
    vi.mocked(fetch).mockResolvedValue(createMockResponse(sse))

    const events = []
    for await (const event of streamSSE('/api/test', {})) {
      events.push(event)
    }
    // Should stop after done, never see 'B'
    expect(events).toHaveLength(2)
    expect(events[1]).toEqual({ type: 'done' })
  })
})
