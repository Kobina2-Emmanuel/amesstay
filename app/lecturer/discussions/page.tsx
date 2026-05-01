'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Pin, X, Send, Lock } from 'lucide-react'

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

export default function LecturerDiscussionsPage() {
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Discussion | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => { fetchDiscussions() }, [])

  const fetchDiscussions = async () => {
    const { data } = await supabase
      .from('discussions')
      .select('*, courses(code, name), profiles(full_name), replies(id)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (data) setDiscussions(data as any)
    setLoading(false)
  }

  const fetchReplies = async (id: string) => {
    const { data } = await supabase
      .from('replies').select('*, profiles(full_name)')
      .eq('discussion_id', id).order('created_at', { ascending: true })
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
    await supabase.from('replies').insert({ discussion_id: selected.id, author_id: user.id, body: replyText })
    setReplyText('')
    await fetchReplies(selected.id)
    setSubmitting(false)
  }

  const togglePin = async (d: Discussion) => {
    await supabase.from('discussions').update({ is_pinned: !d.is_pinned }).eq('id', d.id)
    fetchDiscussions()
  }

  const toggleClose = async (d: Discussion) => {
    await supabase.from('discussions').update({ is_closed: !d.is_closed }).eq('id', d.id)
    if (selected?.id === d.id) setSelected({ ...selected, is_closed: !d.is_closed })
    fetchDiscussions()
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={20} color="#10b981" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: 'var(--text)' }}>Discussions</h1>
            <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>Moderate and respond to student discussions</p>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(16,185,129,0.2)', borderTop: '3px solid #10b981', margin: '0 auto' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {discussions.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{
                background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.06)',
                borderLeft: d.is_pinned ? '4px solid #F0A500' : '4px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              }}
            >
              <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openDiscussion(d)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  {d.is_pinned && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Pin size={11} color="#F0A500" /><span style={{ fontSize: 11, color: '#F0A500', fontFamily: 'DM Sans, sans-serif' }}>Pinned</span></div>}
                  {d.is_closed && <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>Closed</span>}
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(0,48,135,0.15)', border: '1px solid rgba(0,48,135,0.3)', color: '#6b9fff', fontFamily: 'DM Sans, sans-serif' }}>{d.courses?.code}</span>
                </div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{d.title}</h3>
                <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>{d.profiles?.full_name} · {formatDate(d.created_at)} · {d.replies?.length || 0} replies</p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <div onClick={() => togglePin(d)} style={{ width: 32, height: 32, borderRadius: 8, cursor: 'pointer', background: d.is_pinned ? 'rgba(240,165,0,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${d.is_pinned ? 'rgba(240,165,0,0.4)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pin size={13} color={d.is_pinned ? '#F0A500' : 'var(--muted)'} />
                </div>
                <div onClick={() => toggleClose(d)} style={{ width: 32, height: 32, borderRadius: 8, cursor: 'pointer', background: d.is_closed ? 'rgba(200,16,46,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${d.is_closed ? 'rgba(200,16,46,0.4)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={13} color={d.is_closed ? '#C8102E' : 'var(--muted)'} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 560, maxHeight: '85vh', display: 'flex', flexDirection: 'column', position: 'relative' }}
            >
              <div onClick={() => setSelected(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.06)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="var(--muted)" />
              </div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--text)', marginBottom: 6, paddingRight: 40 }}>{selected.title}</h2>
              <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', marginBottom: 16 }}>{selected.profiles?.full_name} · {formatDate(selected.created_at)} · {selected.courses?.code}</p>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>{selected.body}</p>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
                {replies.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13, textAlign: 'center', padding: 20 }}>No replies yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {replies.map(r => (
                      <div key={r.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 16px' }}>
                        <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', marginBottom: 6 }}>{r.profiles?.full_name} · {formatDate(r.created_at)}</p>
                        <p style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>{r.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {!selected.is_closed && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <input className="input-dark" type="text" placeholder="Write a reply..." value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReply()} style={{ flex: 1 }} />
                  <div onClick={handleReply} style={{ width: 44, height: 44, borderRadius: 10, cursor: 'pointer', flexShrink: 0, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Send size={16} color="#10b981" />
                  </div>
                </div>
              )}
              {selected.is_closed && (
                <p style={{ textAlign: 'center', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>This discussion is closed.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}