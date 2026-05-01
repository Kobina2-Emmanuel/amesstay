'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, User } from 'lucide-react'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
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
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 48, 135, ${p.opacity})`
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
            ctx.strokeStyle = `rgba(200, 16, 46, ${0.1 * (1 - dist / 100)})`
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

   const devEmails =['seshieemmanuel84@gmail.com', 'eseshie57@gmail.com']
   const isDevEmail= devEmails.includes(email)
if (!isDevEmail && !email.endsWith('@st.uew.edu.gh') && !email.endsWith('@uew.edu.gh')) {
  setError('Please use your UEW institutional email address.')
  setLoading(false)
  return
}

    if (fullName.trim().length < 3) {
      setError('Please enter your full name.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: crypto.randomUUID(),
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/reset-password`,
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setError('This email is already registered. Please log in instead.')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', data.user.id)
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
      <div style={{
        position: 'absolute', top: '20%', right: '10%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,48,135,0.08) 0%, transparent 70%)', zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', left: '10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(200,16,46,0.06) 0%, transparent 70%)', zIndex: 0,
      }} />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 440, margin: '0 16px',
          background: 'rgba(15, 22, 35, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: '48px 40px',
          boxShadow: '0 0 60px rgba(0,48,135,0.08), 0 32px 64px rgba(0,0,0,0.4)',
        }}
      >
        {/* Back to login */}
        <div
          onClick={() => router.push('/login')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--muted)', fontSize: 13,
            fontFamily: 'DM Sans, sans-serif',
            cursor: 'pointer', marginBottom: 32, width: 'fit-content',
          }}
        >
          <ArrowLeft size={14} />
          Back to login
        </div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 32 }}
        >
          <div style={{
            width: 72, height: 72, margin: '0 auto 20px',
            borderRadius: '50%', padding: 3,
            background: 'linear-gradient(135deg, var(--blue) 0%, var(--red) 100%)',
            boxShadow: '0 0 30px rgba(0,48,135,0.3)',
          }}>
            <img
              src="https://amesgh.com/assets/images/logo.png"
              alt="AMES Logo"
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', background: 'white' }}
            />
          </div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800,
            color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 6,
          }}>
            Create Account
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
            Register with your UEW institutional email
          </p>
        </motion.div>

        {/* Success state */}
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(16,185,129,0.15)',
              border: '2px solid rgba(16,185,129,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Mail size={32} color="#10b981" />
            </div>
            <h3 style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: 20, color: '#10b981', marginBottom: 12,
            }}>
              Check Your Email!
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6, marginBottom: 8 }}>
              We sent a link to
            </p>
            <p style={{ color: 'var(--text)', fontSize: 14, fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 16 }}>
              {email}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6, marginBottom: 32 }}>
              Click the link in the email to set your password and activate your account.
            </p>
            <div
              onClick={() => router.push('/login')}
              style={{
                background: 'linear-gradient(135deg, #003087, #0048c8)',
                color: 'white', borderRadius: 10, padding: '14px',
                cursor: 'pointer', fontFamily: 'Syne, sans-serif',
                fontWeight: 700, fontSize: 15, textAlign: 'center',
                userSelect: 'none', boxShadow: '0 0 20px rgba(0,48,135,0.3)',
              }}
            >
              Go to Login
            </div>
          </motion.div>
        ) : (
          <motion.form
            onSubmit={handleSignup}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* Full name */}
            <div>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 500,
                color: 'var(--muted)', marginBottom: 8,
                fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--muted)" style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)', pointerEvents: 'none',
                }} />
                <input
                  className="input-dark"
                  type="text"
                  placeholder="Emmanuel Seshie"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 500,
                color: 'var(--muted)', marginBottom: 8,
                fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}>
                UEW Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--muted)" style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)', pointerEvents: 'none',
                }} />
                <input
                  className="input-dark"
                  type="email"
                  placeholder="5240110009@st.uew.edu.gh"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: 40 }}
                />
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', marginTop: 6 }}>
                You will receive an email to set your password
              </p>
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
                  ? 'rgba(0,48,135,0.5)'
                  : 'linear-gradient(135deg, #003087 0%, #0048c8 100%)',
                color: 'white', border: 'none', borderRadius: 10,
                padding: '14px', fontSize: 15, fontWeight: 700,
                fontFamily: 'Syne, sans-serif', letterSpacing: '0.3px',
                transition: 'all 0.3s ease',
                boxShadow: loading ? 'none' : '0 0 24px rgba(0,48,135,0.3)',
              }}
            >
              {loading ? 'Sending email...' : 'Create Account'}
            </motion.button>

            <p style={{
              textAlign: 'center', fontSize: 13,
              color: 'var(--muted)', marginTop: 4,
              fontFamily: 'DM Sans, sans-serif',
            }}>
              Already have an account?{' '}
              <span
                onClick={() => router.push('/login')}
                style={{ color: 'var(--red)', cursor: 'pointer', fontWeight: 600 }}
              >
                Sign in
              </span>
            </p>
          </motion.form>
        )}

        <p style={{
          textAlign: 'center', marginTop: 32,
          fontSize: 12, color: 'var(--muted)',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          University of Education, Winneba<br />
          <span style={{ color: 'rgba(200,16,46,0.6)', fontSize: 11 }}>Education for Service</span>
        </p>
      </motion.div>
    </div>
  )
}