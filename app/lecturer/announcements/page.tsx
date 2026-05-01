'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Bell, AlertCircle, BookOpen, Users, Calendar, Plus, X, ChevronRight } from 'lucide-react'

type Announcement = {
  id: string
  title: string
  body: string
  tag: string
  is_urgent: boolean
  created_at: string
  course_id: string | null
  profiles: { full_name: string }
  courses: { code: string; name: string } | null
}

type Course = { id: string; code: string; name: string }

const TAG_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  General: { bg: 'rgba(107,122,153,0.15)', border: 'rgba(107,122,153,0.3)', text: '#6B7A99' },
  Exam: { bg: 'rgba(200,16,46,0.15)', border: 'rgba(200,16,46,0.3)', text: '#C8102E' },
  Meeting: { bg: 'rgba(240,165,0,0.15)', border: 'rgba(240,165,0,0.3)', text: '#F0A500' },
  Deadline: { bg: 'rgba(200,16,46,0.15)', border: 'rgba(200,16,46,0.3)', text: '#C8102E' },
  Resource: { bg: 'rgba(0,48,135,0.15)', border: 'rgba(0,48,135,0.3)', text: '#6b9fff' },
}

const TAG_ICONS: Record<string, any> = {
  General: Bell, Exam: AlertCircle, Meeting: Users,
  Deadline: Calendar, Resource: BookOpen,
}

// TODO: Replace with your UEW campus image URL
const UEW_CAMPUS_BG = `url("YOUR_UEW_CAMPUS_IMAGE_URL_HERE")`

export default function LecturerAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState<Announcement | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tag, setTag] = useState('General')
  const [isUrgent, setIsUrgent] = useState(false)
  const [courseId, setCourseId] = useState('')

  const supabase = createClient()
  const FILTERS = ['All', 'Urgent', 'Exam', 'Meeting', 'Deadline', 'Resource', 'General']
  const TAGS = ['General', 'Exam', 'Meeting', 'Deadline', 'Resource']

  useEffect(() => {
    fetchAnnouncements()
    fetchCourses()
  }, [])

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*, profiles(full_name), courses(code, name)')
      .order('created_at', { ascending: false })
    if (data) setAnnouncements(data as any)
    setLoading(false)
  }

  const fetchCourses = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('courses')
      .select('id, code, name')
      .eq('lecturer_id', user.id)
    if (data) setCourses(data)
  }

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) return
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('announcements')
      .insert({
        title: title.trim(),
        body: body.trim(),
        tag,
        is_urgent: isUrgent,
        course_id: courseId || null,
        author_id: user.id,
      })

    if (!error) {
      setTitle('')
      setBody('')
      setTag('General')
      setIsUrgent(false)
      setCourseId('')
      setShowForm(false)
      fetchAnnouncements()
    }

    setSubmitting(false)
  }

  const filtered = announcements.filter(a => {
    if (filter === 'All') return true
    if (filter === 'Urgent') return a.is_urgent
    return a.tag === filter
  })

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>

      {/* UEW Campus faded background */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: UEW_CAMPUS_BG,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        opacity: 0.04, zIndex: 0,
        pointerEvents: 'none',
        filter: 'blur(2px)',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(0,48,135,0.1)',
              border: '1px solid rgba(0,48,135,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bell size={20} color="#003087" />
            </div>
            <div>
              <h1 style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 800,
                fontSize: 28, color: 'var(--text)',
              }}>
                Announcements
              </h1>
              <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
                Post and manage department announcements
              </p>
            </div>
          </div>

          {/* Post button */}
          <div
            onClick={() => setShowForm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
              background: 'linear-gradient(135deg, #003087, #0048c8)',
              color: 'white', fontFamily: 'Syne, sans-serif',
              fontWeight: 700, fontSize: 14,
              boxShadow: '0 0 20px rgba(0,48,135,0.3)',
              userSelect: 'none',
            }}
          >
            <Plus size={16} />
            Post Announcement
          </div>
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}
        >
          {FILTERS.map(f => (
            <div
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 16px', borderRadius: 999, cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', fontSize: 13,
                fontWeight: filter === f ? 600 : 400,
                background: filter === f ? '#003087' : 'rgba(255,255,255,0.05)',
                border: filter === f ? '1px solid #003087' : '1px solid rgba(255,255,255,0.06)',
                color: filter === f ? 'white' : 'var(--muted)',
                transition: 'all 0.2s ease', userSelect: 'none',
              }}
            >
              {f}
            </div>
          ))}
        </motion.div>

        {/* Announcements list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '3px solid rgba(0,48,135,0.2)',
                borderTop: '3px solid #003087',
                margin: '0 auto',
              }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: 'var(--bg2)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: 48, textAlign: 'center',
            }}
          >
            <Bell size={40} color="#6B7A99" style={{ margin: '0 auto 16px', display: 'block' }} />
            <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
              No announcements yet. Post the first one!
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((a, i) => {
              const tagStyle = TAG_COLORS[a.tag] || TAG_COLORS.General
              const Icon = TAG_ICONS[a.tag] || Bell
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelected(a)}
                  whileHover={{ x: 4 }}
                  style={{
                    background: 'rgba(15,22,35,0.85)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderLeft: a.is_urgent ? '4px solid #C8102E' : `4px solid ${tagStyle.text}`,
                    borderRadius: 14, padding: '20px 24px',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'flex-start',
                    justifyContent: 'space-between', gap: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 999,
                        background: tagStyle.bg, border: `1px solid ${tagStyle.border}`,
                      }}>
                        <Icon size={11} color={tagStyle.text} />
                        <span style={{ fontSize: 11, color: tagStyle.text, fontFamily: 'DM Sans, sans-serif' }}>
                          {a.tag}
                        </span>
                      </div>
                      {a.is_urgent && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '3px 10px', borderRadius: 999,
                          background: 'rgba(200,16,46,0.15)',
                          border: '1px solid rgba(200,16,46,0.3)',
                        }}>
                          <AlertCircle size={11} color="#C8102E" />
                          <span style={{ fontSize: 11, color: '#C8102E', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
                            Urgent
                          </span>
                        </div>
                      )}
                      {a.courses && (
                        <span style={{
                          fontSize: 11, padding: '3px 10px', borderRadius: 999,
                          background: 'rgba(0,48,135,0.15)',
                          border: '1px solid rgba(0,48,135,0.3)',
                          color: '#6b9fff', fontFamily: 'DM Sans, sans-serif',
                        }}>
                          {a.courses.code}
                        </span>
                      )}
                    </div>
                    <h3 style={{
                      fontFamily: 'Syne, sans-serif', fontWeight: 700,
                      fontSize: 15, color: 'var(--text)', marginBottom: 6, lineHeight: 1.4,
                    }}>
                      {a.title}
                    </h3>
                    <p style={{
                      fontSize: 13, color: 'var(--muted)',
                      fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {a.body}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', marginTop: 8 }}>
                      {a.profiles?.full_name || 'Lecturer'} · {formatDate(a.created_at)}
                    </p>
                  </div>
                  <ChevronRight size={18} color="var(--muted)" style={{ flexShrink: 0, marginTop: 4 }} />
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Post announcement modal */}
      <AnimatePresence>
        {showForm && (
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
                width: '100%', maxWidth: 520,
                maxHeight: '85vh', overflowY: 'auto',
                boxShadow: '0 0 60px rgba(0,0,0,0.5)',
                position: 'relative',
              }}
            >
              {/* Close */}
              <div
                onClick={() => setShowForm(false)}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={16} color="var(--muted)" />
              </div>

              <h2 style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 800,
                fontSize: 20, color: 'var(--text)', marginBottom: 24,
              }}>
                Post Announcement
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Title */}
                <div>
                  <label style={{
                    display: 'block', fontSize: 12, fontWeight: 500,
                    color: 'var(--muted)', marginBottom: 8,
                    fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}>
                    Title
                  </label>
                  <input
                    className="input-dark"
                    type="text"
                    placeholder="Announcement title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>

                {/* Body */}
                <div>
                  <label style={{
                    display: 'block', fontSize: 12, fontWeight: 500,
                    color: 'var(--muted)', marginBottom: 8,
                    fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}>
                    Message
                  </label>
                  <textarea
                    className="input-dark"
                    placeholder="Write your announcement..."
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={4}
                    style={{ resize: 'vertical', lineHeight: 1.6 }}
                  />
                </div>

                {/* Tag + Course row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{
                      display: 'block', fontSize: 12, fontWeight: 500,
                      color: 'var(--muted)', marginBottom: 8,
                      fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                    }}>
                      Tag
                    </label>
                    <select
                      className="input-dark"
                      value={tag}
                      onChange={e => setTag(e.target.value)}
                      style={{ appearance: 'none' }}
                    >
                      {TAGS.map(t => (
                        <option key={t} value={t} style={{ background: '#0F1623' }}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: 'block', fontSize: 12, fontWeight: 500,
                      color: 'var(--muted)', marginBottom: 8,
                      fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                    }}>
                      Course (optional)
                    </label>
                    <select
                      className="input-dark"
                      value={courseId}
                      onChange={e => setCourseId(e.target.value)}
                      style={{ appearance: 'none' }}
                    >
                      <option value="" style={{ background: '#0F1623' }}>Department-wide</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id} style={{ background: '#0F1623' }}>
                          {c.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Urgent toggle */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div>
                    <p style={{
                      fontFamily: 'Syne, sans-serif', fontWeight: 600,
                      fontSize: 13, color: 'var(--text)', marginBottom: 2,
                    }}>
                      Mark as Urgent
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
                      Highlights the announcement in red
                    </p>
                  </div>
                  <div
                    onClick={() => setIsUrgent(prev => !prev)}
                    style={{
                      width: 44, height: 24, borderRadius: 999,
                      background: isUrgent ? '#C8102E' : 'rgba(255,255,255,0.1)',
                      position: 'relative', cursor: 'pointer',
                      transition: 'background 0.3s ease', flexShrink: 0,
                    }}
                  >
                    <motion.div
                      animate={{ x: isUrgent ? 22 : 2 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                      style={{
                        position: 'absolute', top: 2,
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'white',
                      }}
                    />
                  </div>
                </div>

                {/* Submit */}
                <div
                  onClick={handleSubmit}
                  style={{
                    background: submitting
                      ? 'rgba(0,48,135,0.5)'
                      : 'linear-gradient(135deg, #003087, #0048c8)',
                    color: 'white', borderRadius: 10,
                    padding: '14px', cursor: 'pointer',
                    fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15,
                    textAlign: 'center', userSelect: 'none',
                    boxShadow: submitting ? 'none' : '0 0 20px rgba(0,48,135,0.3)',
                  }}
                >
                  {submitting ? 'Posting...' : 'Post Announcement'}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
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
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg2)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20, padding: 40,
                width: '100%', maxWidth: 540,
                maxHeight: '80vh', overflowY: 'auto',
                boxShadow: '0 0 60px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {(() => {
                  const tagStyle = TAG_COLORS[selected.tag] || TAG_COLORS.General
                  const Icon = TAG_ICONS[selected.tag] || Bell
                  return (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 12px', borderRadius: 999,
                      background: tagStyle.bg, border: `1px solid ${tagStyle.border}`,
                    }}>
                      <Icon size={12} color={tagStyle.text} />
                      <span style={{ fontSize: 12, color: tagStyle.text, fontFamily: 'DM Sans, sans-serif' }}>
                        {selected.tag}
                      </span>
                    </div>
                  )
                })()}
                {selected.is_urgent && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 12px', borderRadius: 999,
                    background: 'rgba(200,16,46,0.15)',
                    border: '1px solid rgba(200,16,46,0.3)',
                  }}>
                    <AlertCircle size={12} color="#C8102E" />
                    <span style={{ fontSize: 12, color: '#C8102E', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
                      Urgent
                    </span>
                  </div>
                )}
              </div>

              <h2 style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 800,
                fontSize: 20, color: 'var(--text)', marginBottom: 12, lineHeight: 1.4,
              }}>
                {selected.title}
              </h2>

              <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', marginBottom: 20 }}>
                Posted by {selected.profiles?.full_name || 'Lecturer'} · {formatDate(selected.created_at)}
                {selected.courses && ` · ${selected.courses.code} — ${selected.courses.name}`}
              </p>

              <div style={{
                fontSize: 14, color: 'var(--text)',
                fontFamily: 'DM Sans, sans-serif', lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
              }}>
                {selected.body}
              </div>

              <div
                onClick={() => setSelected(null)}
                style={{
                  marginTop: 32, padding: '12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--muted)', cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 14,
                  textAlign: 'center', userSelect: 'none',
                }}
              >
                Close
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}