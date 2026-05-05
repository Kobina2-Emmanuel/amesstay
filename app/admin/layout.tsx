'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Users, BookOpen, CheckSquare, BarChart2, Bell, LogOut, Menu, X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { id: 'timetable', label: 'Timetable', icon: Calendar, path: '/admin/timetable' },  // ADDED
  { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
  { id: 'courses', label: 'Courses', icon: BookOpen, path: '/admin/courses' },
  { id: 'attendance', label: 'Attendance', icon: CheckSquare, path: '/admin/attendance' },
  { id: 'reports', label: 'Reports', icon: BarChart2, path: '/admin/reports' },
  { id: 'announcements', label: 'Announcements', icon: Bell, path: '/admin/announcements' },
]
function Tooltip({ label }: { label: string }) {
  return (
    <div style={{
      position: 'absolute', left: 76, top: '50%', transform: 'translateY(-50%)',
      background: 'rgba(15,22,35,0.98)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '6px 12px', fontSize: 13, color: 'var(--text)',
      fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap', zIndex: 100,
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)', pointerEvents: 'none',
    }}>
      {label}
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<{ full_name: string } | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const checkMobile = () => { const m = window.innerWidth < 768; setIsMobile(m); if (m) setCollapsed(false) }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle()
      if (data) setProfile(data)
    }
    getProfile()
  }, [])

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }
  const sidebarWidth = collapsed ? 72 : 260

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: collapsed && !mobile ? '24px 0' : '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: collapsed && !mobile ? 'center' : 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: collapsed && !mobile ? 0 : 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', padding: 2, flexShrink: 0, background: 'linear-gradient(135deg, var(--red), var(--blue))', boxShadow: '0 0 16px rgba(200,16,46,0.3)' }}>
            <img src="https://amesgh.com/assets/images/logo.png" alt="AMES" style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'white' }} />
          </div>
          {(!collapsed || mobile) && (
            <div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--text)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                Ames<span style={{ color: 'var(--red)' }}>Stay</span>
              </h2>
              <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>Admin Panel</p>
            </div>
          )}
        </div>
        {mobile && <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><X size={20} /></button>}
      </div>

      {(!collapsed || mobile) && (
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(200,16,46,0.3), rgba(0,48,135,0.3))', border: '2px solid rgba(200,16,46,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: 'var(--text)', marginBottom: 12 }}>
            {profile?.full_name?.charAt(0) || 'A'}
          </div>
          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>{profile?.full_name || 'Admin'}</p>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(200,16,46,0.15)', border: '1px solid rgba(200,16,46,0.3)', color: 'var(--red)', fontFamily: 'DM Sans, sans-serif' }}>Administrator</span>
        </div>
      )}

      <nav style={{ flex: 1, padding: collapsed && !mobile ? '16px 8px' : '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.path
          const Icon = item.icon
          return (
            <div key={item.id} style={{ position: 'relative' }} onMouseEnter={() => setHoveredItem(item.id)} onMouseLeave={() => setHoveredItem(null)}>
              <div
                onClick={() => { router.push(item.path); setMobileOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: collapsed && !mobile ? 0 : 12,
                  padding: collapsed && !mobile ? '11px 0' : '10px 14px', borderRadius: 8, width: '100%',
                  justifyContent: collapsed && !mobile ? 'center' : 'flex-start',
                  background: active ? 'rgba(200,16,46,0.1)' : 'transparent',
                  borderLeft: collapsed && !mobile ? 'none' : active ? '3px solid var(--red)' : '3px solid transparent',
                  cursor: 'pointer', transition: 'background 0.15s ease',
                }}
              >
                <Icon size={18} color={active ? '#C8102E' : '#6B7A99'} strokeWidth={active ? 2.5 : 1.8} />
                {(!collapsed || mobile) && (
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: active ? 600 : 400, color: active ? 'var(--text)' : 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                )}
                {active && (!collapsed || mobile) && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', boxShadow: '0 0 6px var(--red)' }} />}
              </div>
              {collapsed && !mobile && hoveredItem === item.id && <Tooltip label={item.label} />}
            </div>
          )
        })}
      </nav>

      <div style={{ padding: collapsed && !mobile ? '0 8px 16px' : '0 12px 16px' }}>
        <div style={{ position: 'relative' }} onMouseEnter={() => setHoveredItem('logout')} onMouseLeave={() => setHoveredItem(null)}>
          <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: collapsed && !mobile ? 0 : 12, padding: collapsed && !mobile ? '11px 0' : '10px 14px', borderRadius: 8, width: '100%', justifyContent: collapsed && !mobile ? 'center' : 'flex-start', cursor: 'pointer', transition: 'background 0.15s ease' }}>
            <LogOut size={18} color="#6B7A99" strokeWidth={1.8} />
            {(!collapsed || mobile) && <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'var(--muted)' }}>Sign Out</span>}
          </div>
          {collapsed && !mobile && hoveredItem === 'logout' && <Tooltip label="Sign Out" />}
        </div>
        {!mobile && (
          <div onClick={() => setCollapsed(prev => !prev)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', marginTop: 8, transition: 'background 0.15s ease' }}>
            {collapsed ? <ChevronRight size={16} color="#6B7A99" /> : <><ChevronLeft size={16} color="#6B7A99" /><span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>Collapse</span></>}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <AnimatePresence>
        {mobileOpen && isMobile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
        )}
      </AnimatePresence>

      {!isMobile && (
        <div style={{ width: sidebarWidth, minHeight: '100vh', background: 'rgba(9,13,24,0.95)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.06)', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, overflow: 'hidden', transition: 'width 0.2s ease' }}>
          <SidebarContent />
        </div>
      )}

      {isMobile && (
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{ width: 260, minHeight: '100vh', background: 'rgba(9,13,24,0.98)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.06)', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 }}>
              <SidebarContent mobile={true} />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <div style={{ marginLeft: isMobile ? 0 : sidebarWidth, flex: 1, minHeight: '100vh', transition: 'margin-left 0.2s ease' }}>
        <div style={{ height: 64, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,12,20,0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {isMobile && <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}><Menu size={22} /></button>}
            <div>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Department of Mathematics Education</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>University of Education, Winneba</p>
            </div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(200,16,46,0.3), rgba(0,48,135,0.3))', border: '2px solid rgba(200,16,46,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>
            {profile?.full_name?.charAt(0) || 'A'}
          </div>
        </div>
        <main style={{ padding: isMobile ? '20px 16px' : '32px' }}>{children}</main>
      </div>
    </div>
  )
}