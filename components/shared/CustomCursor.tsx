'use client'

import { useEffect, useState } from 'react'

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [trail, setTrail] = useState({ x: 0, y: 0 })
  const [clicking, setClicking] = useState(false)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  useEffect(() => {
    let animFrame: number
    const follow = () => {
      setTrail(prev => ({
        x: prev.x + (pos.x - prev.x) * 0.12,
        y: prev.y + (pos.y - prev.y) * 0.12,
      }))
      animFrame = requestAnimationFrame(follow)
    }
    animFrame = requestAnimationFrame(follow)
    return () => cancelAnimationFrame(animFrame)
  }, [pos])

  useEffect(() => {
    const down = () => setClicking(true)
    const up = () => setClicking(false)
    window.addEventListener('mousedown', down)
    window.addEventListener('mouseup', up)

    const checkHover = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      setHovering(
        el.tagName === 'BUTTON' ||
        el.tagName === 'A' ||
        el.tagName === 'INPUT' ||
        el.closest('button') !== null ||
        el.closest('a') !== null
      )
    }
    window.addEventListener('mouseover', checkHover)

    return () => {
      window.removeEventListener('mousedown', down)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('mouseover', checkHover)
    }
  }, [])

  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: trail.x,
          top: trail.y,
          width: hovering ? 48 : 36,
          height: hovering ? 48 : 36,
          borderRadius: '50%',
          border: `2px solid rgba(200, 16, 46, ${hovering ? 0.8 : 0.4})`,
          background: hovering ? 'rgba(200, 16, 46, 0.1)' : 'transparent',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 99999,
          transition: 'width 0.2s ease, height 0.2s ease, border-color 0.2s ease, background 0.2s ease',
          boxShadow: hovering ? '0 0 20px rgba(200, 16, 46, 0.4)' : '0 0 10px rgba(200, 16, 46, 0.2)',
        }}
      />
      <div
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          width: clicking ? 6 : hovering ? 0 : 8,
          height: clicking ? 6 : hovering ? 0 : 8,
          borderRadius: '50%',
          background: '#C8102E',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 99999,
          transition: 'width 0.15s ease, height 0.15s ease',
          boxShadow: '0 0 10px rgba(200, 16, 46, 0.8)',
        }}
      />
    </>
  )
}