import { useEffect, useRef, useState } from 'react'

const A4_WIDTH = 794

/**
 * Масштабирует A4-документ (794 px) под ширину контейнера:
 * на узких экранах — уменьшает через transform, без горизонтальной прокрутки.
 * На широких — обычный размер 1:1. При печати transform снимается (см. index.css).
 */
export function A4PreviewFrame({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const wrap = wrapRef.current
    const inner = innerRef.current
    if (!wrap || !inner) return
    const update = () => {
      const s = wrap.clientWidth >= A4_WIDTH ? 1 : wrap.clientWidth / A4_WIDTH
      setScale(s)
      setHeight(Math.ceil(inner.offsetHeight * s))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(wrap)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [])

  if (scale === 0) return <div ref={wrapRef} className="a4-frame-wrap relative w-full" />

  return (
    <div ref={wrapRef} className="a4-frame-wrap relative w-full" style={{ height }}>
      <div
        ref={innerRef}
        className="a4-frame-inner"
        style={{ width: A4_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        {children}
      </div>
    </div>
  )
}