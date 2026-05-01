'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Users, BookOpen, CheckSquare, AlertCircle, TrendingUp } from 'lucide-react'

function StatCard({ label, value, sub, color, icon: Icon, delay }: any) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const timer = setInterval(() => {
      start += Math.ceil(value / 30)
      if (start >= value) { setCount(value); clearInterval(timer) }
      else setCount(start)
    }, 30)
    return () => clearInterval(timer)
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4 }}
      style={{ background: 'var(--bg2)', border: `1px solid ${color}20`, borderTop: `3px solid ${color}`, borderRadius: 16, padding: 24, flex: 1, minWidth: 160 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} strokeWidth={2} />
        </div>
      </div>
      <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, color, lineHeight: 1, marginBottom: 6 }}>{count}</p>
      <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>{sub}</p>
    </motion.div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, lecturers: 0, courses: 0, sessions: 0 })
  const [atRisk, setAtRisk] = useState<any[]>([])
  const [greeting, setGreeting] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const hour = new Date().getHours()
    setGreeting(hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening')
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: p } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
      if (p) setProfile(p)
    }

    const [{ count: students }, { count: lecturers }, { count: courses }, { count: sessions }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'lecturer'),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('*', { count: 'exact', head: true }),
    ])

    setStats({
      students: students || 0,
      lecturers: lecturers || 0,
      courses: courses || 0,
      sessions: sessions || 0,
    })

    // Get students with attendance issues
    const { data: allStudents } = await supabase
      .from('profiles').select('id, full_name, level, programme').eq('role', 'student').limit(20)

    if (allStudents) {
      const atRiskList = []
      for (const student of allStudents) {
        const { data: totalSessions } = await supabase.from('sessions').select('id').eq('status', 'closed')
        const total = totalSessions?.length || 0
        if (total === 0) continue
        const { data: attended } = await supabase
          .from('attendance').select('id').eq('student_id', student.id).in('status', ['present', 'late'])
        const percent = Math.round(((attended?.length || 0) / total) * 100)
        if (percent < 75) atRiskList.push({ ...student, percent })
      }
      setAtRisk(atRiskList)
    }
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: 'var(--text)', marginBottom: 6 }}>
          {greeting}, <span style={{ color: 'var(--red)' }}>{profile?.full_name?.split(' ')[0] || 'Admin'}</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
          Department overview — Mathematics Education, UEW
        </p>
      </motion.div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <StatCard label="Students" value={stats.students} sub="Registered students" color="#C8102E" icon={Users} delay={0.1} />
        <StatCard label="Lecturers" value={stats.lecturers} sub="Active lecturers" color="#003087" icon={TrendingUp} delay={0.2} />
        <StatCard label="Courses" value={stats.courses} sub="This semester" color="#F0A500" icon={BookOpen} delay={0.3} />
        <StatCard label="Sessions" value={stats.sessions} sub="Attendance sessions" color="#10b981" icon={CheckSquare} delay={0.4} />
      </div>

      {/* At risk students */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        style={{ background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <AlertCircle size={18} color="#C8102E" />
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
            Students Below 75% Attendance
          </h3>
          {atRisk.length > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 12, padding: '2px 10px', borderRadius: 999, background: 'rgba(200,16,46,0.15)', border: '1px solid rgba(200,16,46,0.3)', color: '#C8102E', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
              {atRisk.length} flagged
            </span>
          )}
        </div>

        {atRisk.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 14, textAlign: 'center', padding: 24 }}>
            No students below attendance threshold. 🎉
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {atRisk.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.05 }}
                style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(200,16,46,0.05)', border: '1px solid rgba(200,16,46,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(200,16,46,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: '#C8102E', flexShrink: 0 }}>
                    {s.full_name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{s.full_name}</p>
                    <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
                      Level {s.level} · {s.programme === 'mated' ? 'Math Ed' : 'Math & Econ'}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: '#C8102E' }}>{s.percent}%</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>attendance</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}