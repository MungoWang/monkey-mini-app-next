
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { cn } from '@mohou/ui/lib/utils'

/**
 * Render a markdown string. The component owns the reading styles.
 * `className` overrides. A normal document does not add its own.
 * @when Model output, README-ish bodies. Children must be a string.
 * @example
 * <Markdown>{text}</Markdown>
 * @family Rich text
 */
export function Markdown({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div data-testid="markdown" className={cn(markdownClass, className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}

const markdownClass = [
  'max-w-full overflow-x-auto text-sm leading-relaxed',
  '[&_h1]:mt-5 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:tracking-tight',
  '[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold',
  '[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-sm [&_h3]:font-semibold',
  '[&_h4]:mt-3 [&_h4]:mb-1 [&_h4]:text-sm [&_h4]:font-medium',
  '[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
  '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5',
  '[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5',
  '[&_li]:my-1 [&_li]:pl-0.5',
  '[&_a]:underline [&_a]:underline-offset-2',
  '[&_strong]:font-semibold',
  '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]',
  '[&_pre]:my-3 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:bg-muted/40 [&_pre]:p-3',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
  '[&_hr]:my-4 [&_hr]:border-border',
  '[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left',
  '[&_th]:border [&_th]:border-border [&_th]:bg-muted/70 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-medium [&_th]:align-top',
  '[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5 [&_td]:align-top',
  '[&_img]:max-w-full',
].join(' ')
