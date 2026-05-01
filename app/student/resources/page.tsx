'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Download, FileText, Search } from 'lucide-react'

type Resource = {
  id: string
  title: string
  description: string
  file_url: string
  file_type: string
  created_at: string
  courses: { code: string; name: string }
  profiles: { full_name: string }
}

export default function StudentResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', user.id)

    const courseIds = enrollments?.map((e: any) => e.course_id) || []
    if (courseIds.length === 0) { setLoading(false); return }

    const { data } = await supabase
      .from('resources')
      .select('*, courses(code, name), profiles(full_name)')
      .in('course_id', courseIds)
      .order('created_at', { ascending: false })

    if (data) setResources(data as any)
    setLoading(false)
  }

  const filtered = resources.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.courses?.code.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  const getFileIcon = (type: string) => {
    if (type?.includes('pdf')) return '📄'
    if (type?.includes('word') || type?.includes('doc')) return '📝'
    if (type?.includes('sheet') || type?.includes('excel')) return '📊'
    if (type?.includes('image')) return '🖼️'
    return '📁'
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
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
              Course materials and lecture notes
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ position: 'relative', marginBottom: 24 }}
      >
        <Search size={16} color="var(--muted)" style={{
          position: 'absolute', left: 14, top: '50%',
          transform: 'translateY(-50%)', pointerEvents: 'none',
        }} />
        <input
          className="input-dark"
          type="text"
          placeholder="Search by title or course code..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 40 }}
        />
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
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: 48, textAlign: 'center',
        }}>
          <BookOpen size={40} color="#6B7A99" style={{ margin: '0 auto 16px', display: 'block' }} />
          <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
            {search ? 'No resources match your search.' : 'No resources available yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              style={{
                background: 'var(--bg2)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderTop: '3px solid #003087',
                borderRadius: 14, padding: 24,
                transition: 'box-shadow 0.3s ease',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{getFileIcon(r.file_type)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 999,
                  background: 'rgba(0,48,135,0.15)', border: '1px solid rgba(0,48,135,0.3)',
                  color: '#6b9fff', fontFamily: 'DM Sans, sans-serif',
                }}>
                  {r.courses?.code}
                </span>
              </div>
              <h3 style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 700,
                fontSize: 14, color: 'var(--text)', marginBottom: 6, lineHeight: 1.4,
              }}>
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
                {r.profiles?.full_name} · {formatDate(r.created_at)}
              </p>
              <a
                href={r.file_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px', borderRadius: 8, textDecoration: 'none',
                  background: 'rgba(0,48,135,0.1)', border: '1px solid rgba(0,48,135,0.2)',
                  color: '#6b9fff', fontFamily: 'DM Sans, sans-serif', fontSize: 13,
                }}
              >
                <Download size={14} />
                Download
              </a>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}