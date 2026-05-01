'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { FileText, Plus, X, Clock, CheckCircle, Star } from 'lucide-react'

type Assignment = {
  id: string
  title: string
  instructions: string
  due_date: string
  total_marks: number
  created_at: string
  courses: { code: string; name: string }
  submissions: { id: string; student_id: string; text_content: string; submitted_at: string; grade: number; feedback: string; profiles: { full_name: string; index_number: string } }[]
}

export default function LecturerAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Assignment | null>(null)
  const [gradingId, setGradingId] = useState<string | null>(null)
  const [grade, setGrade] = useState('')
  const [feedback, setFeedback] = useState('')
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [totalMarks, setTotalMarks] = useState('100')
  const [courseId, setCourseId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchAssignments()
    fetchCourses()
  }, [])

  const fetchAssignments = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: myCourses } = await supabase.from('courses').select('id').eq('lecturer_id', user.id)
    const courseIds = myCourses?.map((c: any) => c.id) || []
    if (courseIds.length === 0) { setLoading(false); return }
    const { data } = await supabase
      .from('assignments')
      .select('*, courses(code, name), submissions(id, student_id, text_content, submitted_at, grade, feedback, profiles(full_name, index_number))')
      .in('course_id', courseIds)
      .order('created_at', { ascending: false })
    if (data) setAssignments(data as any)
    setLoading(false)
  }

  const fetchCourses = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('courses').select('id, code, name').eq('lecturer_id', user.id)
    if (data) setCourses(data)
  }

  const handleCreate = async () => {
    if (!title.trim() || !dueDate || !courseId) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('assignments').insert({
      title, instructions, due_date: dueDate,
      total_marks: parseInt(totalMarks),
      course_id: courseId, created_by: user.id,
    })
    setTitle(''); setInstructions(''); setDueDate(''); setTotalMarks('100'); setCourseId('')
    setShowForm(false)
    fetchAssignments()
    setSubmitting(false)
  }

  const handleGrade = async (submissionId: string) => {
    await supabase.from('submissions').update({
      grade: parseInt(grade),
      feedback,
      graded_at: new Date().toISOString(),
    }).eq('id', submissionId)
    setGradingId(null)
    setGrade(''); setFeedback('')
    fetchAssignments()
    if (selected) {
      const updated = assignments.find(a => a.id === selected.id)
      if (updated) setSelected(updated)
    }
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileText size={20} color="#F0A500" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: 'var(--text)' }}>Assignments</h1>
            <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>Create and grade assignments</p>
          </div>
        </div>
        <div
          onClick={() => setShowForm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
            background: 'linear-gradient(135deg, #F0A500, #d4920a)',
            color: '#080C14', fontFamily: 'Syne, sans-serif',
            fontWeight: 700, fontSize: 14, userSelect: 'none',
          }}
        >
          <Plus size={16} /> Create Assignment
        </div>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(240,165,0,0.2)', borderTop: '3px solid #F0A500', margin: '0 auto' }} />
        </div>
      ) : assignments.length === 0 ? (
        <div style={{ background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
          <FileText size={40} color="#6B7A99" style={{ margin: '0 auto 16px', display: 'block' }} />
          <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>No assignments created yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {assignments.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{
                background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.06)',
                borderLeft: '4px solid #F0A500', borderRadius: 14, padding: '20px 24px',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(0,48,135,0.15)', border: '1px solid rgba(0,48,135,0.3)', color: '#6b9fff', fontFamily: 'DM Sans, sans-serif' }}>
                    {a.courses?.code}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
                    {a.submissions?.length || 0} submissions
                  </span>
                </div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>{a.title}</h3>
                <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={11} /> Due: {formatDate(a.due_date)} · {a.total_marks} marks
                </p>
              </div>
              <div
                onClick={() => setSelected(a)}
                style={{
                  padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                  background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.2)',
                  color: '#F0A500', fontFamily: 'DM Sans, sans-serif', fontSize: 13, userSelect: 'none',
                }}
              >
                View Submissions
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Submissions modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}
            >
              <div onClick={() => setSelected(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.06)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="var(--muted)" />
              </div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--text)', marginBottom: 4 }}>{selected.title}</h2>
              <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', marginBottom: 24 }}>
                {selected.courses?.code} · {selected.submissions?.length || 0} submissions · {selected.total_marks} marks
              </p>

              {!selected.submissions || selected.submissions.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', textAlign: 'center', padding: 24 }}>No submissions yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selected.submissions.map(sub => (
                    <div key={sub.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>{sub.profiles?.full_name}</p>
                          <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>{sub.profiles?.index_number} · {formatDate(sub.submitted_at)}</p>
                        </div>
                        {sub.grade !== null && sub.grade !== undefined ? (
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#10b981', fontFamily: 'Syne, sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Star size={14} /> {sub.grade}/{selected.total_marks}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(240,165,0,0.15)', border: '1px solid rgba(240,165,0,0.3)', color: '#F0A500', fontFamily: 'DM Sans, sans-serif' }}>
                            Not graded
                          </span>
                        )}
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                        <p style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>{sub.text_content}</p>
                      </div>
                      {sub.feedback && (
                        <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                          <p style={{ fontSize: 11, color: '#10b981', fontFamily: 'DM Sans, sans-serif', marginBottom: 4 }}>Your feedback:</p>
                          <p style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }}>{sub.feedback}</p>
                        </div>
                      )}
                      {gradingId === sub.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <input className="input-dark" type="number" placeholder={`Grade out of ${selected.total_marks}`} value={grade} onChange={e => setGrade(e.target.value)} />
                          <textarea className="input-dark" placeholder="Feedback for student..." value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <div onClick={() => handleGrade(sub.id)} style={{ flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, textAlign: 'center', userSelect: 'none' }}>
                              Save Grade
                            </div>
                            <div onClick={() => setGradingId(null)} style={{ padding: '10px 16px', borderRadius: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13, userSelect: 'none' }}>
                              Cancel
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div onClick={() => { setGradingId(sub.id); setGrade(sub.grade?.toString() || ''); setFeedback(sub.feedback || '') }}
                          style={{ padding: '8px 16px', borderRadius: 8, cursor: 'pointer', background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.2)', color: '#F0A500', fontFamily: 'DM Sans, sans-serif', fontSize: 13, textAlign: 'center', userSelect: 'none' }}>
                          {sub.grade !== null && sub.grade !== undefined ? 'Edit Grade' : 'Grade'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 40, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}
            >
              <div onClick={() => setShowForm(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.06)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="var(--muted)" />
              </div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text)', marginBottom: 24 }}>Create Assignment</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Course</label>
                  <select className="input-dark" value={courseId} onChange={e => setCourseId(e.target.value)} style={{ appearance: 'none' }}>
                    <option value="" style={{ background: '#0F1623' }}>Select course</option>
                    {courses.map(c => <option key={c.id} value={c.id} style={{ background: '#0F1623' }}>{c.code} — {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Title</label>
                  <input className="input-dark" type="text" placeholder="Assignment title" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Instructions</label>
                  <textarea className="input-dark" placeholder="Assignment instructions..." value={instructions} onChange={e => setInstructions(e.target.value)} rows={4} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Due Date</label>
                    <input className="input-dark" type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Total Marks</label>
                    <input className="input-dark" type="number" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} />
                  </div>
                </div>
                <div
                  onClick={handleCreate}
                  style={{ background: submitting ? 'rgba(240,165,0,0.3)' : 'linear-gradient(135deg, #F0A500, #d4920a)', color: '#080C14', borderRadius: 10, padding: '14px', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, textAlign: 'center', userSelect: 'none' }}
                >
                  {submitting ? 'Creating...' : 'Create Assignment'}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}