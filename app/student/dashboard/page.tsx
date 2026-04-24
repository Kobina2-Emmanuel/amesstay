'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, BookOpen, FileText, Download, AlertCircle, Clock } from 'lucide-react'

function StatCard({ label, value, sub, color, icon: Icon, delay }: {
  label: string; value: string | number; sub: string
  color: string; icon: any; delay: number
}) {
  const [count, setCount] = useState(0)
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0

  useEffect(() => {
    let start = 0
    const duration = 1500
    const increment = numValue / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= numValue) { setCount(numValue); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [numValue])

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4 }}
      style={{
        background: 'var(--bg2)',
        border: `1px solid ${color}20`,
        borderTop: `3px solid ${color}`,
        borderRadius: 16, padding: '24px',
        flex: 1, minWidth: 160,
        transition: 'box-shadow 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <p style={{
          fontSize: 12, color: 'var(--muted)',
          fontFamily: 'DM Sans, sans-serif',
          textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          {label}
        </p>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color} strokeWidth={2} />
        </div>
      </div>
      <p style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 800,
        fontSize: 36, color,
        lineHeight: 1, marginBottom: 6,
      }}>
        {count}{typeof value === 'string' && value.includes('%') ? '%' : ''}
      </p>
      <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
        {sub}
      </p>
    </motion.div>
  )
}

export default function StudentDashboard() {
  const [profile, setProfile] = useState<{ full_name: string; level: string } | null>(null)
  const [greeting, setGreeting] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')

    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('full_name, level')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data)
    }
    getProfile()
  }, [])

  const announcements = [
    { id: 1, title: 'End of Semester Examination Timetable Released', tag: 'Exam', urgent: true, date: 'Apr 18, 2026', author: 'Dept. Admin' },
    { id: 2, title: 'MATD 351 Supplementary Notes Available', tag: 'Resource', urgent: false, date: 'Apr 15, 2026', author: 'Dr. Asante' },
    { id: 3, title: 'Department Meeting — All Level 300 Students', tag: 'Meeting', urgent: false, date: 'Apr 12, 2026', author: 'HOD' },
  ]

  const deadlines = [
    { id: 1, title: 'Research Methods Assignment 2', course: 'MATD 351', due: 'Apr 26, 2026', daysLeft: 2 },
    { id: 2, title: 'ODE Problem Set 4', course: 'MATD 302', due: 'Apr 28, 2026', daysLeft: 4 },
    { id: 3, title: 'Measurement & Eval Quiz', course: 'MATD 303', due: 'May 2, 2026', daysLeft: 8 },
  ]

  const tagColors: Record<string, string> = {
    Exam: '#C8102E', Resource: '#003087', Meeting: '#F0A500',
  }

  const attendanceCourses = [
    { course: 'MATD 351 — Research Methods', percent: 83 },
    { course: 'MATD 302 — ODE', percent: 70 },
    { course: 'MATD 303 — Measurement & Eval', percent: 100 },
    { course: 'MATD 304 — Intro Analysis', percent: 75 },
  ]

  return (
    <div>
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 32 }}
      >
        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: 28, color: 'var(--text)', marginBottom: 6,
        }}>
          {greeting},{' '}
          <span style={{ color: 'var(--red)' }}>
            {profile?.full_name?.split(' ')[0] || 'Student'}
          </span>
        </h1>
        <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
          Welcome to AmesStay — Level {profile?.level || '---'} · Mathematics Education
        </p>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <StatCard label="Attendance" value="83%" sub="Across all courses" color="#C8102E" icon={TrendingUp} delay={0.1} />
        <StatCard label="Courses" value={4} sub="This semester" color="#003087" icon={BookOpen} delay={0.2} />
        <StatCard label="Assignments" value={3} sub="Pending submission" color="#F0A500" icon={FileText} delay={0.3} />
        <StatCard label="Resources" value={12} sub="Available to download" color="#10b981" icon={Download} delay={0.4} />
      </div>

      {/* Attendance bars */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          background: 'var(--bg2)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: 24, marginBottom: 32,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <TrendingUp size={18} color="#C8102E" />
          <h3 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 700,
            fontSize: 15, color: 'var(--text)',
          }}>
            Attendance Overview
          </h3>
        </div>
        {attendanceCourses.map((item, i) => (
          <div key={i} style={{ marginBottom: i < attendanceCourses.length - 1 ? 20 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }}>
                {item.course}
              </span>
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: item.percent < 75 ? '#C8102E' : item.percent === 100 ? '#10b981' : '#F0A500',
                fontFamily: 'Syne, sans-serif',
              }}>
                {item.percent}%
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.percent}%` }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                style={{
                  height: '100%', borderRadius: 999,
                  background: item.percent < 75
                    ? 'linear-gradient(90deg, #C8102E, #ff4d6d)'
                    : item.percent === 100
                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                    : 'linear-gradient(90deg, #F0A500, #fbbf24)',
                }}
              />
            </div>
            {item.percent < 75 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <AlertCircle size={11} color="#C8102E" />
                <span style={{ fontSize: 11, color: '#C8102E', fontFamily: 'DM Sans, sans-serif' }}>
                  Below minimum attendance threshold
                </span>
              </div>
            )}
          </div>
        ))}
      </motion.div>

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>

        {/* Announcements */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            background: 'var(--bg2)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <AlertCircle size={18} color="#C8102E" />
            <h3 style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: 15, color: 'var(--text)',
            }}>
              Recent Announcements
            </h3>
          </div>
          {announcements.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              whileHover={{ x: 4 }}
              style={{
                padding: '12px 0',
                borderBottom: i < announcements.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                cursor: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 999,
                  background: `${tagColors[a.tag]}20`,
                  border: `1px solid ${tagColors[a.tag]}40`,
                  color: tagColors[a.tag],
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  {a.tag}
                </span>
                {a.urgent && (
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 999,
                    background: 'rgba(200,16,46,0.15)',
                    color: 'var(--red)', fontFamily: 'DM Sans, sans-serif',
                  }}>
                    Urgent
                  </span>
                )}
              </div>
              <p style={{
                fontSize: 13, color: 'var(--text)',
                fontFamily: 'DM Sans, sans-serif', marginBottom: 4, lineHeight: 1.4,
              }}>
                {a.title}
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
                {a.author} · {a.date}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Deadlines */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            background: 'var(--bg2)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Clock size={18} color="#F0A500" />
            <h3 style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: 15, color: 'var(--text)',
            }}>
              Upcoming Deadlines
            </h3>
          </div>
          {deadlines.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              whileHover={{ x: -4 }}
              style={{
                padding: '12px 0',
                borderBottom: i < deadlines.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                cursor: 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{
                    fontSize: 13, color: 'var(--text)',
                    fontFamily: 'DM Sans, sans-serif', marginBottom: 4,
                  }}>
                    {d.title}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
                    {d.course} · Due {d.due}
                  </p>
                </div>
                <span style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 999, flexShrink: 0,
                  background: d.daysLeft <= 2 ? 'rgba(200,16,46,0.15)' : 'rgba(240,165,0,0.15)',
                  border: `1px solid ${d.daysLeft <= 2 ? 'rgba(200,16,46,0.3)' : 'rgba(240,165,0,0.3)'}`,
                  color: d.daysLeft <= 2 ? 'var(--red)' : 'var(--gold)',
                  fontFamily: 'Syne, sans-serif', fontWeight: 700,
                }}>
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