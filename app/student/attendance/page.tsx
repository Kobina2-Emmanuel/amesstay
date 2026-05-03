'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { CheckSquare, QrCode, KeyRound, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

type Course = { id: string; code: string; name: string }
type AttendanceSummary = { course_id: string; total: number; attended: number; percent: number }
type CheckInStep = 'idle' | 'qr' | 'pin' | 'success' | 'error'

export default function StudentAttendancePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [summary, setSummary] = useState<AttendanceSummary[]>([])
  const [activeSession, setActiveSession] = useState<any>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [step, setStep] = useState<CheckInStep>('idle')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const scannerRef = useRef<any>(null)
  const scannerDivRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const timer = setTimeout(() => fetchCourses(), 600)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
  if (step === 'qr' && activeSession) {
    startScanner()
  } else {
    void stopScanner()
  }
  return () => {
    void stopScanner()
  }
}, [step, activeSession])

  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      if (scannerRef.current) {
        try { await scannerRef.current.stop() } catch {}
      }
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (decodedText: string) => handleQRScanned(decodedText),
        () => {}
      )
    } catch (err) {
      console.error('Scanner error:', err)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch {}
      scannerRef.current = null
    }
  }

  const fetchCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('course_id, courses(id, code, name)')
        .eq('student_id', user.id)

      if (enrollError) { console.error(enrollError); setPageLoading(false); return }

      if (enrollments && enrollments.length > 0) {
        const courseList = enrollments.map((e: any) => e.courses).filter(Boolean)
        setCourses(courseList)

        const summaries: AttendanceSummary[] = []
        for (const course of courseList) {
          const { data: sessions } = await supabase
            .from('sessions').select('id').eq('course_id', course.id).eq('status', 'closed')
          const sessionIds = sessions?.map((s: any) => s.id) || []
          const total = sessionIds.length
          if (total > 0) {
            const { data: attended } = await supabase
              .from('attendance').select('id').eq('student_id', user.id)
              .in('session_id', sessionIds).in('status', ['present', 'late'])
            const attendedCount = attended?.length || 0
            summaries.push({ course_id: course.id, total, attended: attendedCount, percent: Math.round((attendedCount / total) * 100) })
          } else {
            summaries.push({ course_id: course.id, total: 0, attended: 0, percent: 0 })
          }
        }
        setSummary(summaries)
      }
    } catch (err) {
      console.error('fetchCourses error:', err)
    }
    setPageLoading(false)
  }

  const getCourseSummary = (courseId: string) => summary.find(s => s.course_id === courseId)

  const handleCheckIn = async (course: Course) => {
    setSelectedCourse(course)
    setError('')
    setPin('')

    const { data: session } = await supabase
      .from('sessions').select('*').eq('course_id', course.id).eq('status', 'active').maybeSingle()

    if (!session) {
      setError('No active session for this course. Wait for your lecturer to start attendance.')
      setStep('error')
      return
    }

    // Check if already checked in
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: existing } = await supabase
        .from('attendance').select('id').eq('session_id', session.id).eq('student_id', user.id).maybeSingle()
      if (existing) {
        setError('You have already checked in for this session.')
        setStep('error')
        return
      }
    }

    setActiveSession(session)
    setStep('qr')
  }

  const handleQRScanned = (data: string) => {
    if (!activeSession) return
    if (data === activeSession.qr_token) {
      stopScanner()
      setTimeout(() => setStep('pin'), 500)
    } else {
      setError('Invalid or expired QR code. The code refreshes every 10 seconds — try scanning again.')
      setStep('error')
    }
  }

  const handlePinSubmit = async () => {
    if (pin.length !== 6) { setError('Please enter the 6-digit PIN.'); return }
    setLoading(true)

    if (pin !== activeSession?.pin) {
      setError('Wrong PIN. Check the board and try again.')
      setStep('error'); setLoading(false); return
    }

    const pinExpiry = new Date(activeSession?.pin_expires_at)
    if (new Date() > pinExpiry) {
      setError('PIN has expired. Ask your lecturer to regenerate it.')
      setStep('error'); setLoading(false); return
    }

    await markPresent()
    setLoading(false)
  }

  const markPresent = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('attendance').upsert({
      session_id: activeSession.id,
      student_id: user.id,
      status: 'present',
      checked_in_at: new Date().toISOString(),
      gps_matched: false,
    })

    if (error) { setError('Failed to record attendance. Please try again.'); setStep('error'); return }
    setStep('success')
    fetchCourses()
  }

  const resetFlow = () => {
    stopScanner()
    setStep('idle'); setSelectedCourse(null); setActiveSession(null); setPin(''); setError('')
  }

  const getPercentColor = (p: number) => p >= 75 ? '#10b981' : p >= 60 ? '#F0A500' : '#C8102E'

  if (pageLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(200,16,46,0.2)', borderTop: '3px solid #C8102E' }} />
    </div>
  )

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: 'var(--text)', marginBottom: 6 }}>Attendance</h1>
        <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>Check in to your classes</p>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {courses.length === 0 ? (
          <div style={{ background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
            <CheckSquare size={40} color="#6B7A99" style={{ margin: '0 auto 16px', display: 'block' }} />
            <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>You are not enrolled in any courses yet.</p>
          </div>
        ) : courses.map((course, i) => {
          const s = getCourseSummary(course.id)
          const percent = s?.percent || 0
          const color = getPercentColor(percent)
          return (
            <motion.div key={course.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              style={{ background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(0,48,135,0.15)', border: '1px solid rgba(0,48,135,0.3)', color: '#6b9fff', fontFamily: 'DM Sans, sans-serif' }}>{course.code}</span>
                  {percent < 75 && percent > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={12} color="#C8102E" />
                      <span style={{ fontSize: 11, color: '#C8102E', fontFamily: 'DM Sans, sans-serif' }}>At risk</span>
                    </div>
                  )}
                </div>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 12 }}>{course.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                      style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${color}, ${color}aa)` }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'Syne, sans-serif', minWidth: 40 }}>{percent}%</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', marginTop: 6 }}>{s?.attended || 0} of {s?.total || 0} sessions attended</p>
              </div>
              <div onClick={() => handleCheckIn(course)} style={{ background: 'linear-gradient(135deg, #C8102E, #a50d24)', color: 'white', borderRadius: 10, padding: '12px 24px', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', boxShadow: '0 0 20px rgba(200,16,46,0.25)', display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none' }}>
                <QrCode size={16} /> Check In
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Check-in modal */}
      <AnimatePresence>
        {step !== 'idle' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 40, width: '100%', maxWidth: 420, position: 'relative', boxShadow: '0 0 60px rgba(200,16,46,0.1)' }}
            >
              <div onClick={resetFlow} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.06)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="var(--muted)" />
              </div>

              {/* Step indicators */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
                {['qr', 'pin'].map((s, i) => {
                  const isActive = step === s
                  const isDone = s === 'qr' && ['pin', 'success'].includes(step)
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: isDone ? 'rgba(16,185,129,0.3)' : isActive ? 'var(--red)' : 'rgba(255,255,255,0.06)', border: isActive ? '2px solid var(--red)' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isActive ? '0 0 16px rgba(200,16,46,0.4)' : 'none', transition: 'all 0.3s ease' }}>
                        {s === 'qr' && <QrCode size={14} color="white" />}
                        {s === 'pin' && <KeyRound size={14} color="white" />}
                      </div>
                      {i < 1 && <div style={{ width: 24, height: 2, borderRadius: 999, background: isDone ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.06)', transition: 'all 0.3s ease' }} />}
                    </div>
                  )
                })}
              </div>

              {/* QR Step */}
              {step === 'qr' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(200,16,46,0.1)', border: '2px solid rgba(200,16,46,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 30px rgba(200,16,46,0.2)' }}>
                    <QrCode size={28} color="#C8102E" />
                  </div>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text)', marginBottom: 8 }}>Scan QR Code</h3>
                  <p style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', marginBottom: 20 }}>
                    Point your camera at the QR code on the board
                  </p>
                  <p style={{ color: '#F0A500', fontSize: 11, fontFamily: 'DM Sans, sans-serif', marginBottom: 16 }}>
                    ⚡ QR code refreshes every 10 seconds
                  </p>
                  {/* Real QR scanner */}
                  <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 8 }}>
                    <motion.div
                      animate={{ y: [-80, 80, -80] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #C8102E, transparent)', boxShadow: '0 0 8px rgba(200,16,46,0.8)', zIndex: 10 }}
                    />
                    <div id="qr-reader" ref={scannerDivRef} style={{ width: '100%', borderRadius: 16, border: '2px solid rgba(200,16,46,0.3)' }} />
                  </div>
                </motion.div>
              )}

              {/* PIN Step */}
              {step === 'pin' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(200,16,46,0.1)', border: '2px solid rgba(200,16,46,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 30px rgba(200,16,46,0.2)' }}>
                    <KeyRound size={28} color="#C8102E" />
                  </div>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text)', marginBottom: 8 }}>Enter PIN</h3>
                  <p style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', marginBottom: 24 }}>Enter the 6-digit PIN shown on the board</p>
                  <input type="number" value={pin} onChange={e => setPin(e.target.value.slice(0, 6))} placeholder="000000" className="input-dark"
                    style={{ textAlign: 'center', fontSize: 28, fontFamily: 'Syne, sans-serif', fontWeight: 800, letterSpacing: 12, marginBottom: 20 }} />
                  <div onClick={handlePinSubmit} style={{ background: pin.length === 6 ? 'linear-gradient(135deg, #C8102E, #a50d24)' : 'rgba(200,16,46,0.3)', color: 'white', borderRadius: 10, padding: '14px', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, textAlign: 'center', userSelect: 'none', boxShadow: pin.length === 6 ? '0 0 20px rgba(200,16,46,0.3)' : 'none' }}>
                    {loading ? 'Verifying...' : 'Confirm PIN'}
                  </div>
                </motion.div>
              )}

              {/* Success */}
              {step === 'success' && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
                  <motion.div animate={{ boxShadow: ['0 0 0px rgba(16,185,129,0)', '0 0 40px rgba(16,185,129,0.4)', '0 0 0px rgba(16,185,129,0)'] }} transition={{ duration: 1.5, repeat: 2 }}
                    style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <CheckCircle size={40} color="#10b981" />
                  </motion.div>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, color: '#10b981', marginBottom: 8 }}>Present!</h3>
                  <p style={{ color: 'var(--muted)', fontSize: 14, fontFamily: 'DM Sans, sans-serif', marginBottom: 8 }}>Attendance recorded for</p>
                  <p style={{ color: 'var(--text)', fontSize: 15, fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 32 }}>{selectedCourse?.code} — {selectedCourse?.name}</p>
                  <div onClick={resetFlow} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', borderRadius: 10, padding: '12px 24px', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, textAlign: 'center', userSelect: 'none' }}>Done</div>
                </motion.div>
              )}

              {/* Error */}
              {step === 'error' && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
                  <motion.div animate={{ x: [-8, 8, -8, 8, 0] }} transition={{ duration: 0.4 }}
                    style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(200,16,46,0.15)', border: '2px solid rgba(200,16,46,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <XCircle size={40} color="#C8102E" />
                  </motion.div>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--red)', marginBottom: 12 }}>Check-in Failed</h3>
                  <p style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', marginBottom: 32, lineHeight: 1.6 }}>{error}</p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div onClick={resetFlow} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--muted)', borderRadius: 10, padding: '12px', cursor: 'pointer', flex: 1, fontFamily: 'DM Sans, sans-serif', fontSize: 14, textAlign: 'center', userSelect: 'none' }}>Cancel</div>
                    <div onClick={() => selectedCourse && handleCheckIn(selectedCourse)} style={{ background: 'linear-gradient(135deg, #C8102E, #a50d24)', color: 'white', borderRadius: 10, padding: '12px', cursor: 'pointer', flex: 1, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, textAlign: 'center', userSelect: 'none' }}>Try Again</div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}