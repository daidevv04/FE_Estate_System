import { useState } from 'react'
import type { CSSProperties, UIEvent } from 'react'

/**
 * Bọc HTML email vào iframe CÓ SANDBOX.
 *
 * ponytail: không cài DOMPurify. `sandbox="allow-same-origin"` (cố ý KHÔNG có allow-scripts)
 * nghĩa là mọi script/sự kiện on* trong body đều không chạy → không thể XSS. Link trong email
 * bị `pointer-events: none` nên click vô hiệu, đúng như chỉ xem giao diện; cũng tránh focus
 * rơi vào iframe khiến ESC không về tới modal.
 * Nâng cấp nếu sau này cần link mở được: bỏ pointer-events + thêm allow-popups.
 */
export const emailSrcdoc = (html: string) => `<!doctype html>
<html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  html { -webkit-text-size-adjust: 100%; }
  body {
    margin: 0; padding: 34px 40px; background: #fff; color: #1F2937;
    font: 400 14px/1.7 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
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
  /** true (mặc định) = cao đúng bằng email, dùng cho modal. false = cao cố định + cuộn trong khung. */
  autoHeight?: boolean
  height?: number
  style?: CSSProperties
}

/** Render HTML email trong iframe sandbox. Dùng chung cho modal xem trước và rail preview của editor. */
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
