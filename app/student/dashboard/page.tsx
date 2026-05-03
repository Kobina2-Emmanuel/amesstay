'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, BookOpen, FileText, Download, AlertCircle, Clock } from 'lucide-react'

function StatCard({ label, value, sub, color, icon: Icon, delay, suffix = '' }: {
  label: string; value: number; sub: string; color: string; icon: any; delay: number; suffix?: string
}) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const duration = 1500
    const increment = value / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= value) { setCount(value); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }} whileHover={{ y: -4 }}
      style={{ background: 'var(--bg2)', border: `1px solid ${color}20`, borderTop: `3px solid ${color}`, borderRadius: 16, padding: '24px', flex: 1, minWidth: 160 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} strokeWidth={2} />
        </div>
      </div>
      <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, color, lineHeight: 1, marginBottom: 6 }}>
        {count}{suffix}
      </p>
      <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>{sub}</p>
    </motion.div>
  )
}

export default function StudentDashboard() {
  const [profile, setProfile] = useState<{ full_name: string; level: string; programme: string } | null>(null)
  const [greeting, setGreeting] = useState('')
  const [stats, setStats] = useState({ attendancePercent: 0, courses: 0, pendingAssignments: 0, resources: 0 })
  const [attendanceCourses, setAttendanceCourses] = useState<{ course: string; percent: number }[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [deadlines, setDeadlines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Profile
      const { data: profileData } = await supabase
        .from('profiles').select('full_name, level, programme').eq('id', user.id).maybeSingle()
      if (profileData) setProfile(profileData)

      // Enrollments
      const { data: enrollments } = await supabase
        .from('enrollments').select('course_id, courses(id, code, name)').eq('student_id', user.id)

      const courseList = enrollments?.map((e: any) => e.courses).filter(Boolean) || []
      const courseIds = courseList.map((c: any) => c.id)

      // Courses count
      const coursesCount = courseList.length

      // Attendance per course
      let totalAttended = 0
      let totalSessions = 0
      const courseAttendance = []

      for (const course of courseList) {
        const { data: sessions } = await supabase
          .from('sessions').select('id').eq('course_id', course.id).eq('status', 'closed')
        const sessionIds = sessions?.map((s: any) => s.id) || []
        const total = sessionIds.length

        if (total > 0) {
          const { data: attended } = await supabase
            .from('attendance').select('id').eq('student_id', user.id)
            .in('session_id', sessionIds).in('status', ['present', 'late'])
          const attendedCount = attended?.length || 0
          totalAttended += attendedCount
          totalSessions += total
          courseAttendance.push({
            course: `${course.code} — ${course.name}`,
            percent: Math.round((attendedCount / total) * 100)
          })
        } else {
          courseAttendance.push({ course: `${course.code} — ${course.name}`, percent: 0 })
        }
      }

      const overallAttendance = totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 0
      setAttendanceCourses(courseAttendance)

      // Pending assignments
      let pendingCount = 0
      if (courseIds.length > 0) {
        const { data: assignments } = await supabase
          .from('assignments').select('id, submissions(student_id)').in('course_id', courseIds)
        pendingCount = assignments?.filter(a =>
          !a.submissions?.some((s: any) => s.student_id === user.id)
        ).length || 0
      }

      // Resources count
      let resourcesCount = 0
      if (courseIds.length > 0) {
        const { count } = await supabase
          .from('resources').select('*', { count: 'exact', head: true }).in('course_id', courseIds)
        resourcesCount = count || 0
      }

      // Recent announcements
      const { data: announcementsData } = await supabase
        .from('announcements').select('*, profiles(full_name), courses(code)')
        .order('created_at', { ascending: false }).limit(3)
      if (announcementsData) setAnnouncements(announcementsData)

      // Upcoming deadlines
      if (courseIds.length > 0) {
        const { data: assignmentsData } = await supabase
          .from('assignments').select('id, title, due_date, courses(code), submissions(student_id)')
          .in('course_id', courseIds).gte('due_date', new Date().toISOString())
          .order('due_date', { ascending: true }).limit(3)

        const pending = assignmentsData?.filter(a =>
          !a.submissions?.some((s: any) => s.student_id === user.id)
        ) || []

        setDeadlines(pending.map(a => ({
          id: a.id, title: a.title,
          course: (a.courses as any)?.code || '',
          due: new Date(a.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          daysLeft: Math.ceil((new Date(a.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        })))
      }

      setStats({ attendancePercent: overallAttendance, courses: coursesCount, pendingAssignments: pendingCount, resources: resourcesCount })
    } catch (err) {
      console.error('Dashboard error:', err)
    }
    setLoading(false)
  }

  const tagColors: Record<string, string> = { Exam: '#C8102E', Resource: '#003087', Meeting: '#F0A500', General: '#6B7A99', Deadline: '#C8102E' }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(200,16,46,0.2)', borderTop: '3px solid #C8102E' }} />
    </div>
  )

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: 'var(--text)', marginBottom: 6 }}>
          {greeting}, <span style={{ color: 'var(--red)' }}>{profile?.full_name?.split(' ')[0] || 'Student'}</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
          Welcome to AmesStay — Level {profile?.level || '---'} · {profile?.programme === 'mated' ? 'Mathematics Education' : 'Mathematics & Economics'}
        </p>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <StatCard label="Attendance" value={stats.attendancePercent} sub="Overall average" color="#C8102E" icon={TrendingUp} delay={0.1} suffix="%" />
        <StatCard label="Courses" value={stats.courses} sub="This semester" color="#003087" icon={BookOpen} delay={0.2} />
        <StatCard label="Assignments" value={stats.pendingAssignments} sub="Pending submission" color="#F0A500" icon={FileText} delay={0.3} />
        <StatCard label="Resources" value={stats.resources} sub="Available to download" color="#10b981" icon={Download} delay={0.4} />
      </div>

      {/* Attendance bars */}
      {attendanceCourses.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{ background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24, marginBottom: 32 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <TrendingUp size={18} color="#C8102E" />
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Attendance Overview</h3>
          </div>
          {attendanceCourses.map((item, i) => (
            <div key={i} style={{ marginBottom: i < attendanceCourses.length - 1 ? 20 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }}>{item.course}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: item.percent < 75 ? '#C8102E' : item.percent === 100 ? '#10b981' : '#F0A500', fontFamily: 'Syne, sans-serif' }}>{item.percent}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${item.percent}%` }} transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: 999, background: item.percent < 75 ? 'linear-gradient(90deg, #C8102E, #ff4d6d)' : item.percent === 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #F0A500, #fbbf24)' }} />
              </div>
              {item.percent < 75 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <AlertCircle size={11} color="#C8102E" />
                  <span style={{ fontSize: 11, color: '#C8102E', fontFamily: 'DM Sans, sans-serif' }}>Below minimum attendance threshold</span>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>

        {/* Announcements */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
          style={{ background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <AlertCircle size={18} color="#C8102E" />
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Recent Announcements</h3>
          </div>
          {announcements.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13, textAlign: 'center', padding: 16 }}>No announcements yet.</p>
          ) : announcements.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.1 }}
              style={{ padding: '12px 0', borderBottom: i < announcements.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: `${tagColors[a.tag] || '#6B7A99'}20`, border: `1px solid ${tagColors[a.tag] || '#6B7A99'}40`, color: tagColors[a.tag] || '#6B7A99', fontFamily: 'DM Sans, sans-serif' }}>{a.tag}</span>
                {a.is_urgent && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(200,16,46,0.15)', color: 'var(--red)', fontFamily: 'DM Sans, sans-serif' }}>Urgent</span>}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', marginBottom: 4, lineHeight: 1.4 }}>{a.title}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
                {a.profiles?.full_name} · {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Deadlines */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
          style={{ background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Clock size={18} color="#F0A500" />
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Upcoming Deadlines</h3>
          </div>
          {deadlines.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 13, textAlign: 'center', padding: 16 }}>No upcoming deadlines. 🎉</p>
          ) : deadlines.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.1 }}
              style={{ padding: '12px 0', borderBottom: i < deadlines.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', marginBottom: 4 }}>{d.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>{d.course} · Due {d.due}</p>
                </div>
                <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, flexShrink: 0, background: d.daysLeft <= 2 ? 'rgba(200,16,46,0.15)' : 'rgba(240,165,0,0.15)', border: `1px solid ${d.daysLeft <= 2 ? 'rgba(200,16,46,0.3)' : 'rgba(240,165,0,0.3)'}`, color: d.daysLeft <= 2 ? 'var(--red)' : 'var(--gold)', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
                  {d.daysLeft}d left
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}