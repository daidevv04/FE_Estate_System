import { useState } from 'react'
import type { CSSProperties, UIEvent } from 'react'

export const emailSrcdoc = (html: string) => `<!doctype html>
<html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  html { -webkit-text-size-adjust: 100%; }
  body {
    margin: 0; padding: 34px 40px; background: #fff; color: #1F2937;
    font: 400 14px/1.7 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    word-break: break-word; overflow-wrap: anywhere;
  }
  h1, h2, h3 { line-height: 1.3; }
  img { max-width: 100%; height: auto; }
  table { max-width: 100%; }
  a { pointer-events: none; cursor: default; }
</style></head><body>${html}</body></html>`

interface Props {
  html: string
  title: string
  autoHeight?: boolean
  height?: number
  style?: CSSProperties
}

export function EmailPreviewFrame({ html, title, autoHeight = true, height = 240, style }: Props) {
  const [measured, setMeasured] = useState(0)
  const onLoad = (e: UIEvent<HTMLIFrameElement>) => {
    const doc = e.currentTarget.contentDocument
    if (doc?.body) setMeasured(doc.body.scrollHeight + 1)
  }
  const boxStyle: CSSProperties = autoHeight
    ? { ...style, ...(measured ? { height: measured } : {}) }
    : { ...style, height }
  return (
    <iframe
      title={title}
      className="etp-frame"
      style={boxStyle}
      sandbox="allow-same-origin"
      onLoad={onLoad}
      srcDoc={emailSrcdoc(html)}
    />
  )
}
