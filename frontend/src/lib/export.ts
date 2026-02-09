export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m)
  if (match) {
    return match[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)
  }
  return 'blog-post'
}
