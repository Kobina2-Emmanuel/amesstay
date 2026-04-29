'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getSupabaseClient } from '@/lib/supabase/client-instance'
import { Users, CheckSquare, FileText, BookOpen } from 'lucide-react'

function StatCard({ label, value, sub, color, icon: Icon, delay }: {
  label: string; value: number; sub: string
  color: string; icon: any; delay: number
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
        fontSize: 36, color, lineHeight: 1, marginBottom: 6,
      }}>
        {count}
      </p>
      <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
        {sub}
      </p>
    </motion.div>
  )
}

export default function LecturerDashboard() {
  const [profile, setProfile] = useState<{ full_name: string } | null>(null)
  const [greeting, setGreeting] = useState('')
  const [courses, setCourses] = useState<any[]>([])
  const supabase = getSupabaseClient()

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')

    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle()
      if (profile) setProfile(profile)

      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('lecturer_id', user.id)
      if (courses) setCourses(courses)
    }
    getData()
  }, [])

  return (
    <div>
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
          <span style={{ color: '#003087' }}>
            {profile?.full_name?.split(' ')[0] || 'Lecturer'}
          </span>
        </h1>
        <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
          Manage your courses, attendance and assignments
        </p>
      </motion.div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <StatCard label="My Courses" value={courses.length} sub="This semester" color="#003087" icon={BookOpen} delay={0.1} />
        <StatCard label="Total Students" value={0} sub="Across all courses" color="#C8102E" icon={Users} delay={0.2} />
        <StatCard label="Sessions" value={0} sub="Taken this semester" color="#F0A500" icon={CheckSquare} delay={0.3} />
        <StatCard label="Assignments" value={0} sub="Active assignments" color="#10b981" icon={FileText} delay={0.4} />
      </div>

      {/* My courses */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          background: 'var(--bg2)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <BookOpen size={18} color="#003087" />
          <h3 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 700,
            fontSize: 15, color: 'var(--text)',
          }}>
            My Courses
          </h3>
        </div>

        {courses.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
            No courses assigned yet. Contact admin to assign courses.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {courses.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 999,
                      background: 'rgba(0,48,135,0.15)',
                      border: '1px solid rgba(0,48,135,0.3)',
                      color: '#6b9fff', fontFamily: 'DM Sans, sans-serif',
                    }}>
                      {course.code}
                    </span>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 999,
                      background: 'rgba(255,255,255,0.05)',
                      color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif',
                    }}>
                      Level {course.level}
                    </span>
                  </div>
                  <p style={{
                    fontFamily: 'Syne, sans-serif', fontWeight: 700,
                    fontSize: 14, color: 'var(--text)',
                  }}>
                    {course.name}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}