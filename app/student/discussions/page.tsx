'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Plus, X, Send, Pin } from 'lucide-react'

type Discussion = {
  id: string
  title: string
  body: string
  is_pinned: boolean
  is_closed: boolean
  created_at: string
  courses: { code: string; name: string }
  profiles: { full_name: string }
  replies: { id: string }[]
}

type Reply = {
  id: string
  body: string
  created_at: string
  profiles: { full_name: string }
}

export default function StudentDiscussionsPage() {
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Discussion | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [replyText, setReplyText] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [newCourseId, setNewCourseId] = useState('')
  const [courses, setCourses] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchDiscussions()
    fetchCourses()
  }, [])

  const fetchDiscussions = async () => {
    const { data } = await supabase
      .from('discussions')
      .select('*, courses(code, name), profiles(full_name), replies(id)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (data) setDiscussions(data as any)
    setLoading(false)
  }

  const fetchCourses = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: enrollments } = await supabase
      .from('enrollments').select('course_id, courses(id, code, name)').eq('student_id', user.id)
    if (enrollments) setCourses(enrollments.map((e: any) => e.courses).filter(Boolean))
  }

  const fetchReplies = async (discussionId: string) => {
    const { data } = await supabase
      .from('replies')
      .select('*, profiles(full_name)')
      .eq('discussion_id', discussionId)
      .order('created_at', { ascending: true })
    if (data) setReplies(data as any)
  }

  const openDiscussion = async (d: Discussion) => {
    setSelected(d)
    await fetchReplies(d.id)
  }

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('replies').insert({
      discussion_id: selected.id,
      author_id: user.id,
      body: replyText,
    })
    setReplyText('')
    await fetchReplies(selected.id)
    setSubmitting(false)
  }

  const handleNewThread = async () => {
    if (!newTitle.trim() || !newBody.trim() || !newCourseId) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('discussions').insert({
      course_id: newCourseId,
      author_id: user.id,
      title: newTitle,
      body: newBody,
    })
    setNewTitle(''); setNewBody(''); setNewCourseId('')
    setShowNew(false)
    fetchDiscussions()
    setSubmitting(false)
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
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MessageSquare size={20} color="#10b981" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: 'var(--text)' }}>
              Discussions
            </h1>
            <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
              Ask questions and discuss with peers
            </p>
          </div>
        </div>
        <div
          onClick={() => setShowNew(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            color: '#10b981', fontFamily: 'Syne, sans-serif',
            fontWeight: 700, fontSize: 14, userSelect: 'none',
          }}
        >
          <Plus size={16} /> New Thread
        </div>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '3px solid rgba(16,185,129,0.2)',
              borderTop: '3px solid #10b981', margin: '0 auto',
            }}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {discussions.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => openDiscussion(d)}
              whileHover={{ x: 4 }}
              style={{
                background: 'var(--bg2)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderLeft: d.is_pinned ? '4px solid #F0A500' : '4px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: '16px 20px',
                cursor: 'pointer', transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  {d.is_pinned && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Pin size={11} color="#F0A500" />
                      <span style={{ fontSize: 11, color: '#F0A500', fontFamily: 'DM Sans, sans-serif' }}>Pinned</span>
                    </div>
                  )}
                  {d.is_closed && (
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>Closed</span>
                  )}
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 999,
                    background: 'rgba(0,48,135,0.15)', border: '1px solid rgba(0,48,135,0.3)',
                    color: '#6b9fff', fontFamily: 'DM Sans, sans-serif',
                  }}>
                    {d.courses?.code}
                  </span>
                </div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                  {d.title}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
                  {d.profiles?.full_name} · {formatDate(d.created_at)}
                </p>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 999,
              }}>
                <MessageSquare size={12} color="var(--muted)" />
                <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
                  {d.replies?.length || 0}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Thread view modal */}
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
                borderRadius: 20, padding: 32, width: '100%', maxWidth: 560,
                maxHeight: '85vh', display: 'flex', flexDirection: 'column',
                position: 'relative',
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

              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--text)', marginBottom: 6, paddingRight: 40 }}>
                {selected.title}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', marginBottom: 16 }}>
                {selected.profiles?.full_name} · {formatDate(selected.created_at)} · {selected.courses?.code}
              </p>

              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: 16, marginBottom: 20,
              }}>
                <p style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>
                  {selected.body}
                </p>
              </div>

              {/* Replies */}
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
                {replies.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13, textAlign: 'center', padding: 20 }}>
                    No replies yet. Be the first to respond!
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {replies.map(r => (
                      <div key={r.id} style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 10, padding: '12px 16px',
                      }}>
                        <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', marginBottom: 6 }}>
                          {r.profiles?.full_name} · {formatDate(r.created_at)}
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>
                          {r.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reply input */}
              {!selected.is_closed && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    className="input-dark"
                    type="text"
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleReply()}
                    style={{ flex: 1 }}
                  />
                  <div
                    onClick={handleReply}
                    style={{
                      width: 44, height: 44, borderRadius: 10, cursor: 'pointer', flexShrink: 0,
                      background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Send size={16} color="#10b981" />
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New thread modal */}
      <AnimatePresence>
        {showNew && (
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
                borderRadius: 20, padding: 40, width: '100%', maxWidth: 480,
                position: 'relative',
              }}
            >
              <div
                onClick={() => setShowNew(false)}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'rgba(255,255,255,0.06)', borderRadius: 8,
                  width: 32, height: 32, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={16} color="var(--muted)" />
              </div>

              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text)', marginBottom: 24 }}>
                Start a Discussion
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{
                    display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8,
                    fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase',
                  }}>
                    Course
                  </label>
                  <select
                    className="input-dark"
                    value={newCourseId}
                    onChange={e => setNewCourseId(e.target.value)}
                    style={{ appearance: 'none' }}
                  >
                    <option value="" style={{ background: '#0F1623' }}>Select course</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id} style={{ background: '#0F1623' }}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{
                    display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8,
                    fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase',
                  }}>
                    Title
                  </label>
                  <input className="input-dark" type="text" placeholder="Discussion title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                </div>
                <div>
                  <label style={{
                    display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8,
                    fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase',
                  }}>
                    Your Question
                  </label>
                  <textarea
                    className="input-dark" placeholder="Describe your question..."
                    value={newBody} onChange={e => setNewBody(e.target.value)}
                    rows={4} style={{ resize: 'vertical', lineHeight: 1.6 }}
                  />
                </div>
                <div
                  onClick={handleNewThread}
                  style={{
                    background: submitting ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.15)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#10b981', borderRadius: 10, padding: '14px', cursor: 'pointer',
                    fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15,
                    textAlign: 'center', userSelect: 'none',
                  }}
                >
                  {submitting ? 'Posting...' : 'Post Discussion'}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}