'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Particle effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number;
    }[] = []

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
      })
    }

    let animId: number
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 16, 46, ${p.opacity})`
        ctx.fill()
      })

      // Draw connecting lines
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(0, 48, 135, ${0.15 * (1 - dist / 100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })

      animId = requestAnimationFrame(draw)
    }
    draw()

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const detectRole = (email: string) => {
    if (email.endsWith('@st.uew.edu.gh')) {
      const index = email.split('@')[0]
      const prefix = index.substring(0, 6)
      const levelMap: Record<string, string> = {
        '526011': 'level100_mated',
        '525011': 'level200_mated',
        '524011': 'level300_mated',
        '523011': 'level400_mated',
        '526042': 'level100_maec',
        '525042': 'level200_maec',
        '524042': 'level300_maec',
        '523042': 'level400_maec',
      }
      return levelMap[prefix] || 'student'
    }
    return 'staff'
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate UEW email
    if (!email.endsWith('@st.uew.edu.gh') && !email.endsWith('@uew.edu.gh')) {
      setError('Please use your UEW institutional email address.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    const role = detectRole(email)
    if (role.includes('student') || role.includes('level')) {
      router.push('/student/dashboard')
    } else {
      router.push('/staff/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{
        position: 'absolute', inset: 0, zIndex: 0,
      }} />

      {/* Background glows */}
      <div style={{
        position: 'absolute', top: '20%', left: '10%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(200,16,46,0.08) 0%, transparent 70%)',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,48,135,0.1) 0%, transparent 70%)',
        zIndex: 0,
      }} />

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 440,
          margin: '0 16px',
          background: 'rgba(15, 22, 35, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20,
          padding: '48px 40px',
          boxShadow: '0 0 60px rgba(200,16,46,0.08), 0 32px 64px rgba(0,0,0,0.4)',
        }}
      >
        {/* Logo area */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 40 }}
        >
          {/* UEW crest placeholder */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--red) 0%, var(--blue) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 0 30px rgba(200,16,46,0.3)',
            fontSize: 28, fontWeight: 800,
            fontFamily: 'Syne, sans-serif',
            color: 'white',
          }}>
            A
          </div>

          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 28, fontWeight: 800,
            color: 'var(--text)',
            letterSpacing: '-0.5px',
            marginBottom: 6,
          }}>
            Ames<span style={{ color: 'var(--red)' }}>Stay</span>
          </h1>
          <p style={{
            color: 'var(--muted)', fontSize: 13,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            Mathematics Education Portal · UEW
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleLogin}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 500,
              color: 'var(--muted)', marginBottom: 8,
              fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              UEW Email
            </label>
            <input
              className="input-dark"
              type="email"
              placeholder="5240110009@st.uew.edu.gh"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 500,
              color: 'var(--muted)', marginBottom: 8,
              fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              Password
            </label>
            <input
              className="input-dark"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                color: '#ff4d6d', fontSize: 13,
                background: 'rgba(200,16,46,0.08)',
                border: '1px solid rgba(200,16,46,0.2)',
                borderRadius: 8, padding: '10px 14px',
              }}
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              marginTop: 8,
              background: loading
                ? 'rgba(200,16,46,0.5)'
                : 'linear-gradient(135deg, #C8102E 0%, #a50d24 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              padding: '14px',
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'Syne, sans-serif',
              letterSpacing: '0.3px',
              transition: 'all 0.3s ease',
              boxShadow: loading ? 'none' : '0 0 24px rgba(200,16,46,0.3)',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </motion.button>
        </motion.form>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{
            textAlign: 'center', marginTop: 32,
            fontSize: 12, color: 'var(--muted)',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          University of Education, Winneba<br />
          <span style={{ color: 'rgba(200,16,46,0.6)', fontSize: 11 }}>
            Education for Service
          </span>
        </motion.p>
      </motion.div>
    </div>
  )
}