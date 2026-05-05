'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'sent'>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = []
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
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 16, 46, ${p.opacity})`
        ctx.fill()
      })
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
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const isDevEmail = process.env.NODE_ENV === 'development' &&
      email === 'seshieemmanuel84@gmail.com'

    if (!isDevEmail && !email.endsWith('@st.uew.edu.gh') && !email.endsWith('@uew.edu.gh')) {
      setError('Please use your UEW institutional email address.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setStep('sent')
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
      <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,16,46,0.08) 0%, transparent 70%)', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,48,135,0.1) 0%, transparent 70%)', zIndex: 0 }} />

      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}
        style={{
          position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, margin: '0 16px',
          background: 'rgba(15, 22, 35, 0.85)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '48px 40px',
          boxShadow: '0 0 60px rgba(200,16,46,0.08), 0 32px 64px rgba(0,0,0,0.4)',
        }}
      >
        {/* Back */}
        <div onClick={() => router.push('/login')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', marginBottom: 32, width: 'fit-content' }}>
          <ArrowLeft size={14} /> Back to login
        </div>

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, margin: '0 auto 20px', borderRadius: '50%', padding: 3, background: 'linear-gradient(135deg, var(--red) 0%, var(--blue) 100%)', boxShadow: '0 0 30px rgba(200,16,46,0.3)' }}>
            <img src="https://amesgh.com/assets/images/logo.png" alt="AMES Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', background: 'white' }} />
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 6 }}>
            {step === 'email' ? 'Forgot Password' : 'Check Your Email'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
            {step === 'email' ? 'Enter your UEW email to receive a reset link' : `We sent a reset link to ${email}`}
          </p>
        </motion.div>

        {/* Email step */}
        {step === 'email' && (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 8, fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>UEW Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input className="input-dark" type="email" placeholder="5240110009@st.uew.edu.gh" value={email} onChange={e => setEmail(e.target.value)} required style={{ paddingLeft: 40 }} />
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ color: '#ff4d6d', fontSize: 13, background: 'rgba(200,16,46,0.08)', border: '1px solid rgba(200,16,46,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                {error}
              </motion.p>
            )}

            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ marginTop: 8, background: loading ? 'rgba(200,16,46,0.5)' : 'linear-gradient(135deg, #C8102E 0%, #a50d24 100%)', color: 'white', border: 'none', borderRadius: 10, padding: '14px', fontSize: 15, fontWeight: 700, fontFamily: 'Syne, sans-serif', transition: 'all 0.3s ease', boxShadow: loading ? 'none' : '0 0 24px rgba(200,16,46,0.3)' }}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </motion.button>
          </motion.form>
        )}

        {/* Sent step */}
        {step === 'sent' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
            <motion.div
              animate={{ boxShadow: ['0 0 0px rgba(16,185,129,0)', '0 0 40px rgba(16,185,129,0.4)', '0 0 0px rgba(16,185,129,0)'] }}
              transition={{ duration: 1.5, repeat: 2 }}
              style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}
            >
              <CheckCircle size={40} color="#10b981" />
            </motion.div>
            <p style={{ color: 'var(--muted)', fontSize: 14, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6, marginBottom: 32 }}>
              Check your email inbox and click the link to reset your password. The link expires in 1 hour.
            </p>
            <div onClick={() => router.push('/login')} style={{ background: 'linear-gradient(135deg, #C8102E, #a50d24)', color: 'white', borderRadius: 10, padding: '14px', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, textAlign: 'center', userSelect: 'none', boxShadow: '0 0 20px rgba(200,16,46,0.3)' }}>
              Back to Login
            </div>
            <p style={{ marginTop: 16, fontSize: 13, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
              Didn't receive it?{' '}
              <span onClick={() => setStep('email')} style={{ color: 'var(--red)', cursor: 'pointer', fontWeight: 600 }}>Try again</span>
            </p>
          </motion.div>
        )}

        <p style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
          University of Education, Winneba<br />
          <span style={{ color: 'rgba(200,16,46,0.6)', fontSize: 11 }}>Education for Service</span>
        </p>
      </motion.div>
    </div>
  )
}