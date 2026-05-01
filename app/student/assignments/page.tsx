'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { FileText, Clock, CheckCircle, Upload, X, AlertCircle } from 'lucide-react'

type Assignment = {
  id: string
  title: string
  instructions: string
  due_date: string
  total_marks: number
  created_at: string
  courses: { code: string; name: string }
  submissions: { id: string; grade: number; feedback: string; submitted_at: string }[]
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Assignment | null>(null)
  const [submitText, setSubmitText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('All')
  const supabase = createClient()

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', user.id)

    const courseIds = enrollments?.map((e: any) => e.course_id) || []
    if (courseIds.length === 0) { setLoading(false); return }

    const { data } = await supabase
      .from('assignments')
      .select('*, courses(code, name), submissions(id, grade, feedback, submitted_at)')
      .in('course_id', courseIds)
      .order('due_date', { ascending: true })

    if (data) setAssignments(data as any)
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!submitText.trim() || !selected) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('submissions').upsert({
      assignment_id: selected.id,
      student_id: user.id,
      text_content: submitText,
      submitted_at: new Date().toISOString(),
    })

    setSubmitText('')
    setSelected(null)
    fetchAssignments()
    setSubmitting(false)
  }

  const isSubmitted = (a: Assignment) => a.submissions && a.submissions.length > 0
  const isOverdue = (a: Assignment) => new Date(a.due_date) < new Date() && !isSubmitted(a)

  const getDaysLeft = (due: string) => {
    const diff = new Date(due).getTime() - new Date().getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const filtered = assignments.filter(a => {
    if (filter === 'Pending') return !isSubmitted(a) && !isOverdue(a)
    if (filter === 'Submitted') return isSubmitted(a)
    if (filter === 'Overdue') return isOverdue(a)
    return true
  })

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileText size={20} color="#F0A500" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: 'var(--text)' }}>
              Assignments
            </h1>
            <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
              View and submit your assignments
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['All', 'Pending', 'Submitted', 'Overdue'].map(f => (
          <div
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 16px', borderRadius: 999, cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', fontSize: 13,
              fontWeight: filter === f ? 600 : 400,
              background: filter === f ? '#F0A500' : 'rgba(255,255,255,0.05)',
              border: filter === f ? '1px solid #F0A500' : '1px solid rgba(255,255,255,0.06)',
              color: filter === f ? '#080C14' : 'var(--muted)',
              transition: 'all 0.2s ease', userSelect: 'none',
            }}
          >
            {f}
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '3px solid rgba(240,165,0,0.2)',
              borderTop: '3px solid #F0A500', margin: '0 auto',
            }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: 48, textAlign: 'center',
        }}>
          <FileText size={40} color="#6B7A99" style={{ margin: '0 auto 16px', display: 'block' }} />
          <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
            No assignments found.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((a, i) => {
            const submitted = isSubmitted(a)
            const overdue = isOverdue(a)
            const daysLeft = getDaysLeft(a.due_date)
            const submission = a.submissions?.[0]

            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderLeft: submitted ? '4px solid #10b981' : overdue ? '4px solid #C8102E' : '4px solid #F0A500',
                  borderRadius: 14, padding: '20px 24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 999,
                        background: 'rgba(0,48,135,0.15)', border: '1px solid rgba(0,48,135,0.3)',
                        color: '#6b9fff', fontFamily: 'DM Sans, sans-serif',
                      }}>
                        {a.courses?.code}
                      </span>
                      {submitted && (
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 999,
                          background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                          color: '#10b981', fontFamily: 'DM Sans, sans-serif',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <CheckCircle size={10} /> Submitted
                        </span>
                      )}
                      {overdue && (
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 999,
                          background: 'rgba(200,16,46,0.15)', border: '1px solid rgba(200,16,46,0.3)',
                          color: '#C8102E', fontFamily: 'DM Sans, sans-serif',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <AlertCircle size={10} /> Overdue
                        </span>
                      )}
                    </div>
                    <h3 style={{
                      fontFamily: 'Syne, sans-serif', fontWeight: 700,
                      fontSize: 15, color: 'var(--text)', marginBottom: 6,
                    }}>
                      {a.title}
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
                      Due: {formatDate(a.due_date)} · {a.total_marks} marks
                    </p>
                    {submitted && submission?.grade !== null && submission?.grade !== undefined && (
                      <p style={{ fontSize: 13, color: '#10b981', fontFamily: 'Syne, sans-serif', fontWeight: 700, marginTop: 6 }}>
                        Grade: {submission.grade}/{a.total_marks}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    {!submitted && !overdue && (
                      <span style={{
                        fontSize: 12, padding: '4px 12px', borderRadius: 999, flexShrink: 0,
                        background: daysLeft <= 2 ? 'rgba(200,16,46,0.15)' : 'rgba(240,165,0,0.15)',
                        border: `1px solid ${daysLeft <= 2 ? 'rgba(200,16,46,0.3)' : 'rgba(240,165,0,0.3)'}`,
                        color: daysLeft <= 2 ? '#C8102E' : '#F0A500',
                        fontFamily: 'Syne, sans-serif', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <Clock size={11} /> {daysLeft}d left
                      </span>
                    )}
                    {!submitted && (
                      <div
                        onClick={() => setSelected(a)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                          background: 'linear-gradient(135deg, #C8102E, #a50d24)',
                          color: 'white', fontFamily: 'Syne, sans-serif',
                          fontWeight: 700, fontSize: 13, userSelect: 'none',
                        }}
                      >
                        <Upload size={13} /> Submit
                      </div>
                    )}
                    {submitted && submission?.feedback && (
                      <div
                        onClick={() => setSelected(a)}
                        style={{
                          padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                          color: '#10b981', fontFamily: 'DM Sans, sans-serif',
                          fontSize: 13, userSelect: 'none',
                        }}
                      >
                        View Feedback
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Submit modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{
                background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20, padding: 40, width: '100%', maxWidth: 520,
                maxHeight: '85vh', overflowY: 'auto', position: 'relative',
              }}
            >
              <div
                onClick={() => setSelected(null)}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'rgba(255,255,255,0.06)', borderRadius: 8,
                  width: 32, height: 32, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={16} color="var(--muted)" />
              </div>

              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text)', marginBottom: 8 }}>
                {selected.title}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', marginBottom: 20 }}>
                {selected.courses?.code} · Due {formatDate(selected.due_date)} · {selected.total_marks} marks
              </p>

              {selected.instructions && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10, padding: 16, marginBottom: 20,
                }}>
                  <p style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>
                    {selected.instructions}
                  </p>
                </div>
              )}

              {selected.submissions?.[0]?.feedback ? (
                <div>
                  <p style={{ fontSize: 12, color: '#10b981', fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 8 }}>
                    Lecturer Feedback:
                  </p>
                  <div style={{
                    background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)',
                    borderRadius: 10, padding: 16,
                  }}>
                    <p style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>
                      {selected.submissions[0].feedback}
                    </p>
                  </div>
                </div>
              ) : !isSubmitted(selected) ? (
                <div>
                  <label style={{
                    display: 'block', fontSize: 12, fontWeight: 500,
                    color: 'var(--muted)', marginBottom: 8,
                    fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase',
                  }}>
                    Your Answer
                  </label>
                  <textarea
                    className="input-dark"
                    placeholder="Type your submission here..."
                    value={submitText}
                    onChange={e => setSubmitText(e.target.value)}
                    rows={6}
                    style={{ resize: 'vertical', lineHeight: 1.6, marginBottom: 16 }}
                  />
                  <div
                    onClick={handleSubmit}
                    style={{
                      background: submitting ? 'rgba(200,16,46,0.5)' : 'linear-gradient(135deg, #C8102E, #a50d24)',
                      color: 'white', borderRadius: 10, padding: '14px', cursor: 'pointer',
                      fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15,
                      textAlign: 'center', userSelect: 'none',
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Assignment'}
                  </div>
                </div>
              ) : (
                <p style={{ color: '#10b981', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
                  Assignment submitted. Awaiting feedback from lecturer.
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}