'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'
import {
  CheckSquare, Play, Square, RefreshCw,
  Users, Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react'

type Course = { id: string; code: string; name: string; level: string }
type Session = {
  id: string; qr_token: string; pin: string;
  pin_expires_at: string; latitude: number | null;
  longitude: number | null; status: string
}
type CheckIn = {
  id: string; student_id: string; status: string;
  checked_in_at: string;
  profiles: { full_name: string; index_number: string }
}

export default function LecturerAttendancePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(false)
  const [pinTimeLeft, setPinTimeLeft] = useState(120)
  const [qrTimeLeft, setQrTimeLeft] = useState(60)
  const [useLocation, setUseLocation] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const pinTimerRef = useRef<any>(null)
  const qrTimerRef = useRef<any>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (!activeSession) return

    // Real-time checkins subscription
    const channel = supabase
      .channel('attendance_checkins')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'attendance',
        filter: `session_id=eq.${activeSession.id}`,
      }, () => {
        fetchCheckins(activeSession.id)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeSession])

  useEffect(() => {
    if (!activeSession) return

    // PIN countdown
    pinTimerRef.current = setInterval(() => {
      setPinTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(pinTimerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // QR countdown
    qrTimerRef.current = setInterval(() => {
      setQrTimeLeft(prev => {
        if (prev <= 1) {
          regenerateQR()
          return 60
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(pinTimerRef.current)
      clearInterval(qrTimerRef.current)
    }
  }, [activeSession])

  const fetchCourses = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('courses')
      .select('id, code, name, level')
      .eq('lecturer_id', user.id)
    if (data) setCourses(data)
  }

  const fetchCheckins = async (sessionId: string) => {
    const { data } = await supabase
      .from('attendance')
      .select('id, student_id, status, checked_in_at, profiles(full_name, index_number)')
      .eq('session_id', sessionId)
      .order('checked_in_at', { ascending: false })
    if (data) setCheckins(data as any)
  }

  const generatePIN = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  const generateToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  const getLocation = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

 const startSession = async () => {
  alert('startSession called')
  if (!selectedCourse) return
  setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let location = null
    if (useLocation) {
      location = await getLocation()
      setCoords(location)
    }

    const pin = generatePIN()
    const qrToken = generateToken()
    const pinExpiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString()

   const { data: session, error } = await supabase
  .from('sessions')
  .insert({
    course_id: selectedCourse.id,
    lecturer_id: user.id,
    date: new Date().toISOString().split('T')[0],
    qr_token: qrToken,
    pin,
    pin_expires_at: pinExpiresAt,
    latitude: location?.lat || null,
    longitude: location?.lng || null,
    radius_meters: 100,
    status: 'active',
  })
  .select()
  .single()

console.log('session:', session)
console.log('error:', error)

if (error) { 
  console.error('Full error:', JSON.stringify(error))
  setLoading(false)
  return 
}

    setActiveSession(session)
    setPinTimeLeft(120)
    setQrTimeLeft(60)
    setCheckins([])
    setLoading(false)
  }

  const regenerateQR = async () => {
    if (!activeSession) return
    const newToken = generateToken()
    const { data } = await supabase
      .from('sessions')
      .update({ qr_token: newToken })
      .eq('id', activeSession.id)
      .select()
      .single()
    if (data) setActiveSession(data)
  }

  const regeneratePIN = async () => {
    if (!activeSession) return
    const newPin = generatePIN()
    const pinExpiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('sessions')
      .update({ pin: newPin, pin_expires_at: pinExpiresAt })
      .eq('id', activeSession.id)
      .select()
      .single()
    if (data) {
      setActiveSession(data)
      setPinTimeLeft(120)
      clearInterval(pinTimerRef.current)
      pinTimerRef.current = setInterval(() => {
        setPinTimeLeft(prev => {
          if (prev <= 1) { clearInterval(pinTimerRef.current); return 0 }
          return prev - 1
        })
      }, 1000)
    }
  }

  const closeSession = async () => {
    if (!activeSession) return
    await supabase
      .from('sessions')
      .update({ status: 'closed', end_time: new Date().toISOString() })
      .eq('id', activeSession.id)

    clearInterval(pinTimerRef.current)
    clearInterval(qrTimerRef.current)
    setActiveSession(null)
    setCheckins([])
    setSelectedCourse(null)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 32 }}
      >
        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: 28, color: 'var(--text)', marginBottom: 6,
        }}>
          Take Attendance
        </h1>
        <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
          Start a session and let students check in with QR + PIN + GPS
        </p>
      </motion.div>

      {/* No active session — course selector */}
      {!activeSession && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{
            background: 'var(--bg2)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: 32,
            maxWidth: 500,
          }}>
            <h3 style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: 16, color: 'var(--text)', marginBottom: 20,
            }}>
              Select Course
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {courses.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
                  No courses assigned. Contact admin.
                </p>
              ) : (
                courses.map(course => (
                  <motion.button
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '16px', borderRadius: 12, border: 'none',
                      background: selectedCourse?.id === course.id
                        ? 'rgba(0,48,135,0.15)'
                        : 'rgba(255,255,255,0.03)',
                      borderLeft: selectedCourse?.id === course.id
                        ? '3px solid #003087'
                        : '3px solid transparent',
                      cursor: 'none', textAlign: 'left',
                      outline: selectedCourse?.id === course.id
                        ? '1px solid rgba(0,48,135,0.3)'
                        : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 999,
                        background: 'rgba(0,48,135,0.15)',
                        border: '1px solid rgba(0,48,135,0.3)',
                        color: '#6b9fff', fontFamily: 'DM Sans, sans-serif',
                      }}>
                        {course.code}
                      </span>
                      <span style={{
                        fontSize: 11, color: 'var(--muted)',
                        fontFamily: 'DM Sans, sans-serif',
                      }}>
                        Level {course.level}
                      </span>
                    </div>
                    <p style={{
                      fontFamily: 'Syne, sans-serif', fontWeight: 700,
                      fontSize: 14, color: 'var(--text)',
                    }}>
                      {course.name}
                    </p>
                  </motion.button>
                ))
              )}
            </div>

            {/* Location toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: 24,
            }}>
              <div>
                <p style={{
                  fontFamily: 'Syne, sans-serif', fontWeight: 600,
                  fontSize: 13, color: 'var(--text)', marginBottom: 2,
                }}>
                  Enable GPS fence
                </p>
                <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
                  Students must be within 100m of your location
                </p>
              </div>
              <motion.button
                onClick={() => setUseLocation(prev => !prev)}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: 44, height: 24, borderRadius: 999,
                  background: useLocation ? '#003087' : 'rgba(255,255,255,0.1)',
                  border: 'none', cursor: 'none', position: 'relative',
                  transition: 'background 0.3s ease',
                }}
              >
                <motion.div
                  animate={{ x: useLocation ? 20 : 2 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  style={{
                    position: 'absolute', top: 2,
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'white',
                  }}
                />
              </motion.button>
            </div>

            <motion.button
              onClick={startSession}
              disabled={!selectedCourse || loading}
              whileHover={{ scale: selectedCourse ? 1.02 : 1 }}
              whileTap={{ scale: selectedCourse ? 0.98 : 1 }}
              style={{
                background: selectedCourse
                  ? 'linear-gradient(135deg, #003087, #0048c8)'
                  : 'rgba(0,48,135,0.3)',
                color: 'white', border: 'none', borderRadius: 10,
                padding: '14px', cursor: 'none', width: '100%',
                fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: selectedCourse ? '0 0 20px rgba(0,48,135,0.3)' : 'none',
              }}
            >
              <Play size={18} />
              {loading ? 'Starting...' : 'Start Attendance Session'}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Active session */}
      {activeSession && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}
        >
          {/* QR + PIN panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Session info */}
            <div style={{
              background: 'rgba(0,48,135,0.1)',
              border: '1px solid rgba(0,48,135,0.2)',
              borderRadius: 12, padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{
                  fontFamily: 'Syne, sans-serif', fontWeight: 700,
                  fontSize: 13, color: 'var(--text)',
                }}>
                  {selectedCourse?.code} — {selectedCourse?.name}
                </p>
                <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
                  Session active · {checkins.length} checked in
                </p>
              </div>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px rgba(16,185,129,0.6)',
              }} />
            </div>

            {/* QR Code */}
            <div style={{
              background: 'var(--bg2)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: 24,
              textAlign: 'center',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 16,
              }}>
                <h3 style={{
                  fontFamily: 'Syne, sans-serif', fontWeight: 700,
                  fontSize: 14, color: 'var(--text)',
                }}>
                  QR Code
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={14} color="#F0A500" />
                  <span style={{
                    fontSize: 13, color: '#F0A500',
                    fontFamily: 'Syne, sans-serif', fontWeight: 700,
                  }}>
                    {qrTimeLeft}s
                  </span>
                </div>
              </div>

              {/* QR code with pulsing ring */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                <motion.div
                  animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    position: 'absolute', inset: -8,
                    borderRadius: 16,
                    border: '2px solid rgba(200,16,46,0.4)',
                  }}
                />
                <div style={{
                  background: 'white', padding: 12, borderRadius: 12,
                  display: 'inline-block',
                }}>
                  <QRCodeSVG
                    value={activeSession.qr_token}
                    size={180}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>

              <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
                Refreshes automatically every 60 seconds
              </p>
            </div>

            {/* PIN */}
            <div style={{
              background: 'var(--bg2)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: 24,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 16,
              }}>
                <h3 style={{
                  fontFamily: 'Syne, sans-serif', fontWeight: 700,
                  fontSize: 14, color: 'var(--text)',
                }}>
                  Session PIN
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={14} color={pinTimeLeft < 30 ? '#C8102E' : '#F0A500'} />
                  <span style={{
                    fontSize: 13,
                    color: pinTimeLeft < 30 ? '#C8102E' : '#F0A500',
                    fontFamily: 'Syne, sans-serif', fontWeight: 700,
                  }}>
                    {formatTime(pinTimeLeft)}
                  </span>
                </div>
              </div>

              <div style={{
                fontSize: 48, fontWeight: 800, letterSpacing: 12,
                fontFamily: 'Syne, sans-serif', color: 'var(--text)',
                textAlign: 'center', marginBottom: 16,
                textShadow: '0 0 20px rgba(255,255,255,0.1)',
              }}>
                {activeSession.pin}
              </div>

              {pinTimeLeft === 0 && (
                <p style={{
                  textAlign: 'center', fontSize: 12,
                  color: '#C8102E', fontFamily: 'DM Sans, sans-serif',
                  marginBottom: 12,
                }}>
                  PIN expired — regenerate to allow more check-ins
                </p>
              )}

              <motion.button
                onClick={regeneratePIN}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '10px', borderRadius: 10,
                  background: 'rgba(0,48,135,0.1)',
                  border: '1px solid rgba(0,48,135,0.2)',
                  color: '#6b9fff', cursor: 'none',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 13,
                }}
              >
                <RefreshCw size={14} />
                Regenerate PIN
              </motion.button>
            </div>

            {/* Close session */}
            <motion.button
              onClick={closeSession}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '14px', borderRadius: 10,
                background: 'rgba(200,16,46,0.1)',
                border: '1px solid rgba(200,16,46,0.2)',
                color: '#C8102E', cursor: 'none',
                fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14,
              }}
            >
              <Square size={16} />
              Close Session
            </motion.button>
          </div>

          {/* Live check-in list */}
          <div style={{
            background: 'var(--bg2)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Users size={18} color="#10b981" />
              <h3 style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 700,
                fontSize: 15, color: 'var(--text)',
              }}>
                Live Check-ins
              </h3>
              <span style={{
                marginLeft: 'auto', fontSize: 12, padding: '2px 10px',
                borderRadius: 999, background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#10b981', fontFamily: 'Syne, sans-serif', fontWeight: 700,
              }}>
                {checkins.length} present
              </span>
            </div>

            {checkins.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Users size={40} color="#6B7A99" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
                  Waiting for students to check in...
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <AnimatePresence>
                  {checkins.map((checkin, i) => (
                    <motion.div
                      key={checkin.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{
                        padding: '12px 14px', borderRadius: 10,
                        background: 'rgba(16,185,129,0.05)',
                        border: '1px solid rgba(16,185,129,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'rgba(16,185,129,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700,
                          fontFamily: 'Syne, sans-serif', color: '#10b981',
                        }}>
                          {checkin.profiles?.full_name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p style={{
                            fontFamily: 'Syne, sans-serif', fontWeight: 600,
                            fontSize: 13, color: 'var(--text)',
                          }}>
                            {checkin.profiles?.full_name || 'Student'}
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
                            {checkin.profiles?.index_number || ''}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle size={14} color="#10b981" />
                        <span style={{
                          fontSize: 11, color: '#10b981',
                          fontFamily: 'DM Sans, sans-serif',
                        }}>
                          {checkin.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}