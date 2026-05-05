'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Plus, X, Trash2 } from 'lucide-react'

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

type Course = { id: string; code: string; name: string; level: string; programme: string }

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const LEVELS = ['100', '200', '300', '400']
const PROGRAMMES = [
  { value: 'mated', label: 'Mathematics Education' },
  { value: 'maec', label: 'Mathematics & Economics' },
]

export default function AdminTimetablePage() {
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filterLevel, setFilterLevel] = useState('300')
  const [filterProg, setFilterProg] = useState('mated')

  // Form state
  const [courseId, setCourseId] = useState('')
  const [day, setDay] = useState('Monday')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [venue, setVenue] = useState('')
  const [level, setLevel] = useState('300')
  const [programme, setProgramme] = useState('mated')

  const supabase = createClient()

  useEffect(() => {
    fetchEntries()
    fetchCourses()
  }, [])

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('timetable')
      .select('*, courses(code, name)')
      .order('day').order('start_time')
    if (data) setEntries(data as any)
    setLoading(false)
  }

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('id, code, name, level, programme')
    if (data) setCourses(data)
  }

  const handleSubmit = async () => {
    if (!courseId || !day || !startTime || !endTime) return
    setSubmitting(true)
    await supabase.from('timetable').insert({
      course_id: courseId, day, start_time: startTime,
      end_time: endTime, venue, level, programme,
    })
    setCourseId(''); setDay('Monday'); setStartTime('')
    setEndTime(''); setVenue('')
    setShowForm(false)
    fetchEntries()
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('timetable').delete().eq('id', id)
    fetchEntries()
  }

  const filtered = entries.filter(e => e.level === filterLevel && e.programme === filterProg)

  const formatTime = (t: string) => {
    if (!t) return ''
    const [h, m] = t.split(':')
    const hour = parseInt(h)
    return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
  }

  const dayColors: Record<string, string> = {
    Monday: '#C8102E', Tuesday: '#003087', Wednesday: '#F0A500',
    Thursday: '#10b981', Friday: '#8b5cf6'
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(200,16,46,0.1)', border: '1px solid rgba(200,16,46,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={20} color="#C8102E" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: 'var(--text)' }}>Timetable</h1>
            <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>Manage weekly class schedules</p>
          </div>
        </div>
        <div onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, cursor: 'pointer', background: 'linear-gradient(135deg, #C8102E, #a50d24)', color: 'white', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, userSelect: 'none', boxShadow: '0 0 20px rgba(200,16,46,0.3)' }}>
          <Plus size={16} /> Add Class
        </div>
      </motion.div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', display: 'block', marginBottom: 6 }}>Level</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {LEVELS.map(l => (
              <div key={l} onClick={() => setFilterLevel(l)} style={{ padding: '6px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: filterLevel === l ? 600 : 400, background: filterLevel === l ? 'var(--red)' : 'rgba(255,255,255,0.05)', border: filterLevel === l ? '1px solid var(--red)' : '1px solid rgba(255,255,255,0.06)', color: filterLevel === l ? 'white' : 'var(--muted)', userSelect: 'none' }}>
                {l}
              </div>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', display: 'block', marginBottom: 6 }}>Programme</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {PROGRAMMES.map(p => (
              <div key={p.value} onClick={() => setFilterProg(p.value)} style={{ padding: '6px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: filterProg === p.value ? 600 : 400, background: filterProg === p.value ? '#003087' : 'rgba(255,255,255,0.05)', border: filterProg === p.value ? '1px solid #003087' : '1px solid rgba(255,255,255,0.06)', color: filterProg === p.value ? 'white' : 'var(--muted)', userSelect: 'none' }}>
                {p.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timetable grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(200,16,46,0.2)', borderTop: '3px solid #C8102E', margin: '0 auto' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {DAYS.map(d => {
            const dayEntries = filtered.filter(e => e.day === d)
            const color = dayColors[d]
            return (
              <motion.div key={d} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.06)', borderTop: `3px solid ${color}`, borderRadius: 14, padding: 16 }}
              >
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color, marginBottom: 12 }}>{d}</h3>
                {dayEntries.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>No classes</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {dayEntries.sort((a, b) => a.start_time.localeCompare(b.start_time)).map(entry => (
                      <div key={entry.id} style={{ background: `${color}10`, border: `1px solid ${color}25`, borderRadius: 10, padding: '10px 12px', position: 'relative' }}>
                        <div onClick={() => handleDelete(entry.id)} style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 4, background: 'rgba(200,16,46,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Trash2 size={10} color="#C8102E" />
                        </div>
                        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--text)', marginBottom: 4, paddingRight: 20 }}>{entry.courses?.code}</p>
                        <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', marginBottom: 2 }}>{formatTime(entry.start_time)} — {formatTime(entry.end_time)}</p>
                        {entry.venue && <p style={{ fontSize: 10, color, fontFamily: 'DM Sans, sans-serif' }}>{entry.venue}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add class modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 40, width: '100%', maxWidth: 500, maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}
            >
              <div onClick={() => setShowForm(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.06)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="var(--muted)" />
              </div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text)', marginBottom: 24 }}>Add Class to Timetable</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Level + Programme */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Level</label>
                    <select className="input-dark" value={level} onChange={e => setLevel(e.target.value)} style={{ appearance: 'none' }}>
                      {LEVELS.map(l => <option key={l} value={l} style={{ background: '#0F1623' }}>Level {l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Programme</label>
                    <select className="input-dark" value={programme} onChange={e => setProgramme(e.target.value)} style={{ appearance: 'none' }}>
                      {PROGRAMMES.map(p => <option key={p.value} value={p.value} style={{ background: '#0F1623' }}>{p.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Course */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Course</label>
                  <select className="input-dark" value={courseId} onChange={e => setCourseId(e.target.value)} style={{ appearance: 'none' }}>
                    <option value="" style={{ background: '#0F1623' }}>Select course</option>
                    {courses.map(c => <option key={c.id} value={c.id} style={{ background: '#0F1623' }}>{c.code} — {c.name}</option>)}
                  </select>
                </div>

                {/* Day */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Day</label>
                  <select className="input-dark" value={day} onChange={e => setDay(e.target.value)} style={{ appearance: 'none' }}>
                    {DAYS.map(d => <option key={d} value={d} style={{ background: '#0F1623' }}>{d}</option>)}
                  </select>
                </div>

                {/* Time */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Start Time</label>
                    <input className="input-dark" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>End Time</label>
                    <input className="input-dark" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                  </div>
                </div>

                {/* Venue */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Venue / Room</label>
                  <input className="input-dark" type="text" placeholder="e.g. Science Block Room 101" value={venue} onChange={e => setVenue(e.target.value)} />
                </div>

                <div onClick={handleSubmit} style={{ background: submitting ? 'rgba(200,16,46,0.5)' : 'linear-gradient(135deg, #C8102E, #a50d24)', color: 'white', borderRadius: 10, padding: '14px', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, textAlign: 'center', userSelect: 'none', marginTop: 8 }}>
                  {submitting ? 'Adding...' : 'Add to Timetable'}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}