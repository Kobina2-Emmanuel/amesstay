'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'

type TimetableEntry = {
  id: string
  day: string
  start_time: string
  end_time: string
  venue: string
  level: string
  programme: string
  courses: { code: string; name: string }
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_COLORS: Record<string, string> = {
  Monday: '#C8102E', Tuesday: '#003087', Wednesday: '#F0A500',
  Thursday: '#10b981', Friday: '#8b5cf6'
}

export default function LecturerTimetablePage() {
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState(DAYS[new Date().getDay() - 1] || 'Monday')
  const supabase = createClient()

  useEffect(() => {
    fetchTimetable()
  }, [])

  const fetchTimetable = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get lecturer's courses
    const { data: myCourses } = await supabase
      .from('courses').select('id').eq('lecturer_id', user.id)
    const courseIds = myCourses?.map((c: any) => c.id) || []

    if (courseIds.length > 0) {
      const { data } = await supabase
        .from('timetable')
        .select('*, courses(code, name)')
        .in('course_id', courseIds)
        .order('start_time')
      if (data) setEntries(data as any)
    }
    setLoading(false)
  }

  const formatTime = (t: string) => {
    if (!t) return ''
    const [h, m] = t.split(':')
    const hour = parseInt(h)
    return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
  }

  const isToday = (day: string) => {
    const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return dayIndex[new Date().getDay()] === day
  }

  const todayEntries = entries.filter(e => e.day === activeDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(0,48,135,0.2)', borderTop: '3px solid #003087' }} />
    </div>
  )

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,48,135,0.1)', border: '1px solid rgba(0,48,135,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={20} color="#003087" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: 'var(--text)' }}>My Schedule</h1>
            <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>Your weekly teaching schedule</p>
          </div>
        </div>
      </motion.div>

      {/* Day selector */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ display: 'flex', gap: 8, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}
      >
        {DAYS.map(d => {
          const color = DAY_COLORS[d]
          const today = isToday(d)
          const active = activeDay === d
          const count = entries.filter(e => e.day === d).length
          return (
            <div key={d} onClick={() => setActiveDay(d)}
              style={{
                padding: '8px 18px', borderRadius: 999, cursor: 'pointer', flexShrink: 0,
                fontFamily: active ? 'Syne, sans-serif' : 'DM Sans, sans-serif',
                fontWeight: active ? 700 : 400, fontSize: 13,
                background: active ? '#003087' : 'rgba(255,255,255,0.05)',
                border: active ? '1px solid #003087' : today ? `1px solid ${color}60` : '1px solid rgba(255,255,255,0.06)',
                color: active ? 'white' : today ? color : 'var(--muted)',
                userSelect: 'none', transition: 'all 0.2s ease', position: 'relative',
              }}
            >
              {d} {count > 0 && <span style={{ fontSize: 11, marginLeft: 4, opacity: 0.8 }}>({count})</span>}
              {today && !active && <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: color }} />}
            </div>
          )
        })}
      </motion.div>

      {/* Classes */}
      {todayEntries.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 48, textAlign: 'center' }}
        >
          <Calendar size={40} color="#6B7A99" style={{ margin: '0 auto 16px', display: 'block' }} />
          <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>No teaching on {activeDay}.</p>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {todayEntries.map((entry, i) => {
            const color = DAY_COLORS[entry.day]
            return (
              <motion.div key={entry.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                style={{ background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '4px solid #003087', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80, flexShrink: 0 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,48,135,0.15)', border: '1px solid rgba(0,48,135,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                    <Clock size={20} color="#003087" />
                  </div>
                  <p style={{ fontSize: 11, color: '#003087', fontFamily: 'Syne, sans-serif', fontWeight: 700, textAlign: 'center' }}>{formatTime(entry.start_time)}</p>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>{formatTime(entry.end_time)}</p>
                </div>

                <div style={{ width: 1, height: 60, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(0,48,135,0.15)', border: '1px solid rgba(0,48,135,0.3)', color: '#6b9fff', fontFamily: 'DM Sans, sans-serif' }}>
                      {entry.courses?.code}
                    </span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={10} /> Level {entry.level} · {entry.programme === 'mated' ? 'Math Ed' : 'Math & Econ'}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>
                    {entry.courses?.name}
                  </h3>
                  {entry.venue && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={12} color="var(--muted)" />
                      <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>{entry.venue}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Weekly summary */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{ marginTop: 32, background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}
      >
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 16 }}>Weekly Teaching Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {DAYS.map(d => {
            const count = entries.filter(e => e.day === d).length
            const color = DAY_COLORS[d]
            return (
              <div key={d} onClick={() => setActiveDay(d)} style={{ textAlign: 'center', cursor: 'pointer', padding: '12px 8px', borderRadius: 10, background: activeDay === d ? 'rgba(0,48,135,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeDay === d ? 'rgba(0,48,135,0.4)' : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.2s ease' }}>
                <p style={{ fontSize: 11, color: isToday(d) ? color : 'var(--muted)', fontFamily: 'DM Sans, sans-serif', marginBottom: 6 }}>{d.slice(0, 3)}</p>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: count > 0 ? '#003087' : 'var(--muted)' }}>{count}</p>
                <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>{count === 1 ? 'class' : 'classes'}</p>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}