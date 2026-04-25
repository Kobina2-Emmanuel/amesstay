'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  CheckSquare, QrCode, KeyRound, MapPin,
  CheckCircle, XCircle, Clock, AlertCircle, X
} from 'lucide-react'

type Course = {
  id: string
  code: string
  name: string
}

type AttendanceSummary = {
  course_id: string
  total: number
  attended: number
  percent: number
}

type CheckInStep = 'idle' | 'qr' | 'pin' | 'gps' | 'success' | 'error'

export default function StudentAttendancePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [summary, setSummary] = useState<AttendanceSummary[]>([])
  const [activeSession, setActiveSession] = useState<any>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [step, setStep] = useState<CheckInStep>('idle')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [qrData, setQrData] = useState('')
  const [scanned, setScanned] = useState(false)
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: enrollments } = await supabase
  .from('enrollments')
  .select(`
    course_id,
    courses (
      id,
      code,
      name
    )
  `)
  .eq('student_id', user.id)

console.log('enrollments:', enrollments)

    if (enrollments) {
      const courseList = enrollments.map((e: any) => e.courses).filter(Boolean)
      setCourses(courseList)

      // Fetch attendance summary per course
      const summaries: AttendanceSummary[] = []
      for (const course of courseList) {
        const { data: sessions } = await supabase
          .from('sessions')
          .select('id')
          .eq('course_id', course.id)
          .eq('status', 'closed')

        const sessionIds = sessions?.map((s: any) => s.id) || []
        const total = sessionIds.length

        if (total > 0) {
          const { data: attended } = await supabase
            .from('attendance')
            .select('id')
            .eq('student_id', user.id)
            .in('session_id', sessionIds)
            .in('status', ['present', 'late'])

          const attendedCount = attended?.length || 0
          summaries.push({
            course_id: course.id,
            total,
            attended: attendedCount,
            percent: Math.round((attendedCount / total) * 100),
          })
        } else {
          summaries.push({ course_id: course.id, total: 0, attended: 0, percent: 0 })
        }
      }
      setSummary(summaries)
    }
  }

  const getCourseSummary = (courseId: string) => {
    return summary.find(s => s.course_id === courseId)
  }

  const handleCheckIn = async (course: Course) => {
    setSelectedCourse(course)
    setStep('qr')
    setError('')
    setPin('')
    setScanned(false)
    setQrData('')

    // Check if there's an active session for this course
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('course_id', course.id)
      .eq('status', 'active')
      .single()

    if (!session) {
      setError('No active session found for this course. Wait for your lecturer to start attendance.')
      setStep('error')
      return
    }

    setActiveSession(session)
  }

  const handleQRScanned = (data: string) => {
    if (data === activeSession?.qr_token) {
      setScanned(true)
      setQrData(data)
      setTimeout(() => setStep('pin'), 800)
    } else {
      setError('Invalid or expired QR code. Please try again.')
      setStep('error')
    }
  }

  const handlePinSubmit = async () => {
    if (pin.length !== 6) {
      setError('Please enter the 6-digit PIN.')
      return
    }

    setLoading(true)

    // Check PIN
    if (pin !== activeSession?.pin) {
      setError('Wrong or expired PIN. Please check the board and try again.')
      setStep('error')
      setLoading(false)
      return
    }

    // Check PIN expiry
    const pinExpiry = new Date(activeSession?.pin_expires_at)
    if (new Date() > pinExpiry) {
      setError('PIN has expired. Ask your lecturer to regenerate it.')
      setStep('error')
      setLoading(false)
      return
    }

    setStep('gps')
    setLoading(false)
    checkGPS()
  }

  const checkGPS = () => {
    if (!navigator.geolocation) {
      setError('GPS is not available on your device. Ask your lecturer for manual override.')
      setStep('error')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setGpsCoords({ lat: latitude, lng: longitude })

        // Calculate distance from classroom
        const distance = haversineDistance(
          latitude, longitude,
          activeSession.latitude, activeSession.longitude
        )

        const radius = activeSession.radius_meters || 100

        if (distance > radius + 50) {
          setError(`You appear to be outside the classroom (${Math.round(distance)}m away). You must be within ${radius}m.`)
          setStep('error')
          return
        }

        // All checks passed — mark present
        await markPresent(latitude, longitude)
      },
      (err) => {
        setError('Could not get your location. Please enable GPS and try again.')
        setStep('error')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const markPresent = async (lat: number, lng: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('attendance')
      .upsert({
        session_id: activeSession.id,
        student_id: user.id,
        status: 'present',
        checked_in_at: new Date().toISOString(),
        gps_matched: true,
      })

    if (error) {
      setError('Failed to record attendance. Please try again.')
      setStep('error')
      return
    }

    setStep('success')
    fetchCourses()
  }

  const resetFlow = () => {
    setStep('idle')
    setSelectedCourse(null)
    setActiveSession(null)
    setPin('')
    setError('')
    setScanned(false)
  }

  const getPercentColor = (percent: number) => {
    if (percent >= 75) return '#10b981'
    if (percent >= 60) return '#F0A500'
    return '#C8102E'
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 32 }}
      >
        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: 28, color: 'var(--text)', marginBottom: 6,
        }}>
          Attendance
        </h1>
        <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
          Check in to your classes and track your attendance record
        </p>
      </motion.div>

      {/* Course attendance list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: 'var(--bg2)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: 40,
              textAlign: 'center',
            }}
          >
            <CheckSquare size={40} color="#6B7A99" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
              You are not enrolled in any courses yet.
            </p>
          </motion.div>
        ) : (
          courses.map((course, i) => {
            const s = getCourseSummary(course.id)
            const percent = s?.percent || 0
            const color = getPercentColor(percent)

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16, padding: 24,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 999,
                      background: 'rgba(0,48,135,0.15)',
                      border: '1px solid rgba(0,48,135,0.3)',
                      color: '#6b9fff', fontFamily: 'DM Sans, sans-serif',
                    }}>
                      {course.code}
                    </span>
                    {percent < 75 && percent > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={12} color="#C8102E" />
                        <span style={{ fontSize: 11, color: '#C8102E', fontFamily: 'DM Sans, sans-serif' }}>
                          At risk
                        </span>
                      </div>
                    )}
                  </div>
                  <p style={{
                    fontFamily: 'Syne, sans-serif', fontWeight: 700,
                    fontSize: 15, color: 'var(--text)', marginBottom: 12,
                  }}>
                    {course.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                        style={{
                          height: '100%', borderRadius: 999,
                          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                        }}
                      />
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: 700, color,
                      fontFamily: 'Syne, sans-serif', minWidth: 40,
                    }}>
                      {percent}%
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', marginTop: 6 }}>
                    {s?.attended || 0} of {s?.total || 0} sessions attended
                  </p>
                </div>

                <motion.button
                  onClick={() => handleCheckIn(course)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    background: 'linear-gradient(135deg, #C8102E, #a50d24)',
                    color: 'white', border: 'none', borderRadius: 10,
                    padding: '12px 24px', cursor: 'none',
                    fontFamily: 'Syne, sans-serif', fontWeight: 700,
                    fontSize: 13, whiteSpace: 'nowrap',
                    boxShadow: '0 0 20px rgba(200,16,46,0.25)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <QrCode size={16} />
                  Check In
                </motion.button>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Check-in modal */}
      <AnimatePresence>
        {step !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: 'var(--bg2)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20, padding: 40,
                width: '100%', maxWidth: 420,
                position: 'relative',
                boxShadow: '0 0 60px rgba(200,16,46,0.1)',
              }}
            >
              {/* Close button */}
              <button
                onClick={resetFlow}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none', borderRadius: 8,
                  width: 32, height: 32, cursor: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--muted)',
                }}
              >
                <X size={16} />
              </button>

              {/* Step indicators */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
                {['qr', 'pin', 'gps'].map((s, i) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: step === s
                        ? 'var(--red)'
                        : ['success'].includes(step) || (step === 'pin' && s === 'qr') || (step === 'gps' && ['qr', 'pin'].includes(s))
                        ? 'rgba(16,185,129,0.3)'
                        : 'rgba(255,255,255,0.06)',
                      border: step === s ? '2px solid var(--red)' : '2px solid transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: step === s ? '0 0 16px rgba(200,16,46,0.4)' : 'none',
                      transition: 'all 0.3s ease',
                    }}>
                      {s === 'qr' && <QrCode size={14} color="white" />}
                      {s === 'pin' && <KeyRound size={14} color="white" />}
                      {s === 'gps' && <MapPin size={14} color="white" />}
                    </div>
                    {i < 2 && (
                      <div style={{
                        width: 24, height: 2, borderRadius: 999,
                        background: (step === 'pin' && s === 'qr') || (step === 'gps' && s !== 'gps') || step === 'success'
                          ? 'rgba(16,185,129,0.5)'
                          : 'rgba(255,255,255,0.06)',
                        transition: 'all 0.3s ease',
                      }} />
                    )}
                  </div>
                ))}
              </div>

              {/* QR Step */}
              {step === 'qr' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ textAlign: 'center' }}
                >
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'rgba(200,16,46,0.1)',
                    border: '2px solid rgba(200,16,46,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 0 30px rgba(200,16,46,0.2)',
                  }}>
                    <QrCode size={28} color="#C8102E" />
                  </div>
                  <h3 style={{
                    fontFamily: 'Syne, sans-serif', fontWeight: 800,
                    fontSize: 20, color: 'var(--text)', marginBottom: 8,
                  }}>
                    Scan QR Code
                  </h3>
                  <p style={{
                    color: 'var(--muted)', fontSize: 13,
                    fontFamily: 'DM Sans, sans-serif', marginBottom: 24,
                  }}>
                    Point your camera at the QR code on the board
                  </p>

                  {/* QR scanner placeholder — real scanner needs html5-qrcode */}
                  <div style={{
                    width: 200, height: 200, margin: '0 auto 24px',
                    border: '2px solid rgba(200,16,46,0.3)',
                    borderRadius: 16, background: 'rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {/* Scanning animation */}
                    <motion.div
                      animate={{ y: [-80, 80, -80] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      style={{
                        position: 'absolute', left: 0, right: 0,
                        height: 2, background: 'linear-gradient(90deg, transparent, #C8102E, transparent)',
                        boxShadow: '0 0 8px rgba(200,16,46,0.8)',
                      }}
                    />
                    <QrCode size={60} color="rgba(200,16,46,0.3)" />
                  </div>

                  {/* Dev bypass button */}
                  <motion.button
                    onClick={() => handleQRScanned(activeSession?.qr_token)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      background: 'rgba(200,16,46,0.1)',
                      border: '1px solid rgba(200,16,46,0.3)',
                      color: 'var(--red)', borderRadius: 10,
                      padding: '10px 20px', cursor: 'none', width: '100%',
                      fontFamily: 'DM Sans, sans-serif', fontSize: 13,
                    }}
                  >
                    Dev: Simulate QR Scan
                  </motion.button>
                </motion.div>
              )}

              {/* PIN Step */}
              {step === 'pin' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ textAlign: 'center' }}
                >
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'rgba(200,16,46,0.1)',
                    border: '2px solid rgba(200,16,46,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 0 30px rgba(200,16,46,0.2)',
                  }}>
                    <KeyRound size={28} color="#C8102E" />
                  </div>
                  <h3 style={{
                    fontFamily: 'Syne, sans-serif', fontWeight: 800,
                    fontSize: 20, color: 'var(--text)', marginBottom: 8,
                  }}>
                    Enter PIN
                  </h3>
                  <p style={{
                    color: 'var(--muted)', fontSize: 13,
                    fontFamily: 'DM Sans, sans-serif', marginBottom: 24,
                  }}>
                    Enter the 6-digit PIN shown on the board
                  </p>

                  <input
                    type="number"
                    maxLength={6}
                    value={pin}
                    onChange={e => setPin(e.target.value.slice(0, 6))}
                    placeholder="000000"
                    className="input-dark"
                    style={{
                      textAlign: 'center', fontSize: 28,
                      fontFamily: 'Syne, sans-serif', fontWeight: 800,
                      letterSpacing: 12, marginBottom: 20,
                    }}
                  />

                  <motion.button
                    onClick={handlePinSubmit}
                    disabled={loading || pin.length !== 6}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      background: pin.length === 6
                        ? 'linear-gradient(135deg, #C8102E, #a50d24)'
                        : 'rgba(200,16,46,0.3)',
                      color: 'white', border: 'none', borderRadius: 10,
                      padding: '14px', cursor: 'none', width: '100%',
                      fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15,
                      boxShadow: pin.length === 6 ? '0 0 20px rgba(200,16,46,0.3)' : 'none',
                    }}
                  >
                    {loading ? 'Verifying...' : 'Confirm PIN'}
                  </motion.button>
                </motion.div>
              )}

              {/* GPS Step */}
              {step === 'gps' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ textAlign: 'center' }}
                >
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'rgba(200,16,46,0.1)',
                    border: '2px solid rgba(200,16,46,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px', position: 'relative',
                  }}>
                    <MapPin size={28} color="#C8102E" />
                    <motion.div
                      animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{
                        position: 'absolute', inset: -8,
                        borderRadius: '50%',
                        border: '2px solid rgba(200,16,46,0.4)',
                      }}
                    />
                  </div>
                  <h3 style={{
                    fontFamily: 'Syne, sans-serif', fontWeight: 800,
                    fontSize: 20, color: 'var(--text)', marginBottom: 8,
                  }}>
                    Verifying Location
                  </h3>
                  <p style={{
                    color: 'var(--muted)', fontSize: 13,
                    fontFamily: 'DM Sans, sans-serif',
                  }}>
                    Checking that you are inside the classroom...
                  </p>
                </motion.div>
              )}

              {/* Success */}
              {step === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ textAlign: 'center' }}
                >
                  <motion.div
                    animate={{ boxShadow: ['0 0 0px rgba(16,185,129,0)', '0 0 40px rgba(16,185,129,0.4)', '0 0 0px rgba(16,185,129,0)'] }}
                    transition={{ duration: 1.5, repeat: 2 }}
                    style={{
                      width: 80, height: 80, borderRadius: '50%',
                      background: 'rgba(16,185,129,0.15)',
                      border: '2px solid rgba(16,185,129,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 20px',
                    }}
                  >
                    <CheckCircle size={40} color="#10b981" />
                  </motion.div>
                  <h3 style={{
                    fontFamily: 'Syne, sans-serif', fontWeight: 800,
                    fontSize: 24, color: '#10b981', marginBottom: 8,
                  }}>
                    Present!
                  </h3>
                  <p style={{
                    color: 'var(--muted)', fontSize: 14,
                    fontFamily: 'DM Sans, sans-serif', marginBottom: 8,
                  }}>
                    Your attendance has been recorded for
                  </p>
                  <p style={{
                    color: 'var(--text)', fontSize: 15,
                    fontFamily: 'Syne, sans-serif', fontWeight: 700,
                    marginBottom: 32,
                  }}>
                    {selectedCourse?.code} — {selectedCourse?.name}
                  </p>
                  <motion.button
                    onClick={resetFlow}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      background: 'rgba(16,185,129,0.15)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      color: '#10b981', borderRadius: 10,
                      padding: '12px 24px', cursor: 'none', width: '100%',
                      fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14,
                    }}
                  >
                    Done
                  </motion.button>
                </motion.div>
              )}

              {/* Error */}
              {step === 'error' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ textAlign: 'center' }}
                >
                  <motion.div
                    animate={{ x: [-8, 8, -8, 8, 0] }}
                    transition={{ duration: 0.4 }}
                    style={{
                      width: 80, height: 80, borderRadius: '50%',
                      background: 'rgba(200,16,46,0.15)',
                      border: '2px solid rgba(200,16,46,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 20px',
                    }}
                  >
                    <XCircle size={40} color="#C8102E" />
                  </motion.div>
                  <h3 style={{
                    fontFamily: 'Syne, sans-serif', fontWeight: 800,
                    fontSize: 22, color: 'var(--red)', marginBottom: 12,
                  }}>
                    Check-in Failed
                  </h3>
                  <p style={{
                    color: 'var(--muted)', fontSize: 13,
                    fontFamily: 'DM Sans, sans-serif', marginBottom: 32,
                    lineHeight: 1.6,
                  }}>
                    {error}
                  </p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <motion.button
                      onClick={resetFlow}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--muted)', borderRadius: 10,
                        padding: '12px', cursor: 'none', flex: 1,
                        fontFamily: 'DM Sans, sans-serif', fontSize: 14,
                      }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={() => selectedCourse && handleCheckIn(selectedCourse)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        background: 'linear-gradient(135deg, #C8102E, #a50d24)',
                        border: 'none', color: 'white', borderRadius: 10,
                        padding: '12px', cursor: 'none', flex: 1,
                        fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14,
                      }}
                    >
                      Try Again
                    </motion.button>
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