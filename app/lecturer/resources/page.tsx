'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Plus, X, Upload, Trash2, Download } from 'lucide-react'

type Resource = {
  id: string
  title: string
  description: string
  file_url: string
  file_type: string
  created_at: string
  courses: { code: string; name: string }
}

export default function LecturerResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [courseId, setCourseId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchResources()
    fetchCourses()
  }, [])

  const fetchResources = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('resources')
      .select('*, courses(code, name)')
      .eq('uploaded_by', user.id)
      .order('created_at', { ascending: false })
    if (data) setResources(data as any)
    setLoading(false)
  }

  const fetchCourses = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('courses').select('id, code, name').eq('lecturer_id', user.id)
    if (data) setCourses(data)
  }

  const handleSubmit = async () => {
    if (!title.trim() || !fileUrl.trim() || !courseId) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('resources').insert({
      title, description, file_url: fileUrl,
      course_id: courseId, uploaded_by: user.id,
    })
    setTitle(''); setDescription(''); setFileUrl(''); setCourseId('')
    setShowForm(false)
    fetchResources()
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('resources').delete().eq('id', id)
    fetchResources()
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
            background: 'rgba(0,48,135,0.1)', border: '1px solid rgba(0,48,135,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={20} color="#003087" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: 'var(--text)' }}>
              Resources
            </h1>
            <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
              Upload and manage course materials
            </p>
          </div>
        </div>
        <div
          onClick={() => setShowForm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
            background: 'linear-gradient(135deg, #003087, #0048c8)',
            color: 'white', fontFamily: 'Syne, sans-serif',
            fontWeight: 700, fontSize: 14, userSelect: 'none',
            boxShadow: '0 0 20px rgba(0,48,135,0.3)',
          }}
        >
          <Plus size={16} /> Upload Resource
        </div>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '3px solid rgba(0,48,135,0.2)',
              borderTop: '3px solid #003087', margin: '0 auto',
            }}
          />
        </div>
      ) : resources.length === 0 ? (
        <div style={{
          background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: 48, textAlign: 'center',
        }}>
          <BookOpen size={40} color="#6B7A99" style={{ margin: '0 auto 16px', display: 'block' }} />
          <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
            No resources uploaded yet.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {resources.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.06)',
                borderTop: '3px solid #003087', borderRadius: 14, padding: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 999,
                  background: 'rgba(0,48,135,0.15)', border: '1px solid rgba(0,48,135,0.3)',
                  color: '#6b9fff', fontFamily: 'DM Sans, sans-serif',
                }}>
                  {r.courses?.code}
                </span>
              </div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>
                {r.title}
              </h3>
              {r.description && (
                <p style={{
                  fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif',
                  lineHeight: 1.5, marginBottom: 12,
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {r.description}
                </p>
              )}
              <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', marginBottom: 16 }}>
                {formatDate(r.created_at)}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={r.file_url} target="_blank" rel="noopener noreferrer"
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px', borderRadius: 8, textDecoration: 'none',
                    background: 'rgba(0,48,135,0.1)', border: '1px solid rgba(0,48,135,0.2)',
                    color: '#6b9fff', fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                  }}
                >
                  <Download size={13} /> View
                </a>
                <div
                  onClick={() => handleDelete(r.id)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                    background: 'rgba(200,16,46,0.1)', border: '1px solid rgba(200,16,46,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Trash2 size={13} color="#C8102E" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      <AnimatePresence>
        {showForm && (
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
                onClick={() => setShowForm(false)}
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
                Upload Resource
              </h2>

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
                  <input className="input-dark" type="text" placeholder="Resource title" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Description (optional)</label>
                  <textarea className="input-dark" placeholder="Brief description..." value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>File URL</label>
                  <input className="input-dark" type="url" placeholder="https://..." value={fileUrl} onChange={e => setFileUrl(e.target.value)} />
                  <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', marginTop: 6 }}>
                    Upload to Google Drive or Dropbox and paste the link here
                  </p>
                </div>
                <div
                  onClick={handleSubmit}
                  style={{
                    background: submitting ? 'rgba(0,48,135,0.5)' : 'linear-gradient(135deg, #003087, #0048c8)',
                    color: 'white', borderRadius: 10, padding: '14px', cursor: 'pointer',
                    fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15,
                    textAlign: 'center', userSelect: 'none',
                  }}
                >
                  {submitting ? 'Uploading...' : 'Upload Resource'}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}