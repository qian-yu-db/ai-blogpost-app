import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from '@/contexts/ThemeContext'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const { theme } = useTheme()

  return (
    <article className={className ?? 'prose max-w-none dark:prose-invert'}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            return <>{children}</>
          },
          code({ className: codeClassName, children, node, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || '')
            const isBlock =
              node?.position?.start?.line !== node?.position?.end?.line ||
              String(children).includes('\n')

            if (match || isBlock) {
              return (
                <SyntaxHighlighter
                  style={theme === 'dark' ? oneDark : oneLight}
                  language={match?.[1] || 'text'}
                  PreTag="div"
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              )
            }
            return (
              <code className={codeClassName} {...props}>
                {children}
              </code>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  )
}
