'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, CheckSquare, BookOpen,
  FileText, MessageSquare, Bell, LogOut, Menu, X,
  ChevronLeft, ChevronRight
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
  { id: 'attendance', label: 'Attendance', icon: CheckSquare, path: '/student/attendance' },
  { id: 'resources', label: 'Resources', icon: BookOpen, path: '/student/resources' },
  { id: 'assignments', label: 'Assignments', icon: FileText, path: '/student/assignments' },
  { id: 'discussions', label: 'Discussions', icon: MessageSquare, path: '/student/discussions' },
  { id: 'announcements', label: 'Announcements', icon: Bell, path: '/student/announcements' },
]

function Tooltip({ label, show }: { label: string; show: boolean }) {
  if (!show) return null
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        position: 'absolute', left: 80, top: '50%',
        transform: 'translateY(-50%)',
        background: 'rgba(15,22,35,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8, padding: '6px 12px',
        fontSize: 13, color: 'var(--text)',
        fontFamily: 'DM Sans, sans-serif',
        whiteSpace: 'nowrap', zIndex: 100,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        pointerEvents: 'none',
      }}
    >
      {label}
    </motion.div>
  )
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<{ full_name: string; level: string; programme: string } | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setCollapsed(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('profiles')
        .select('full_name, level, programme')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data)
    }
    getProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const sidebarWidth = collapsed ? 72 : 260
  const progLabel = profile?.programme === 'mated' ? 'Math Ed' : 'Math & Econ'

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Logo */}
      <div style={{
        padding: collapsed && !mobile ? '24px 0' : '24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed && !mobile ? 'center' : 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: collapsed && !mobile ? 0 : 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            padding: 2, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--red), var(--blue))',
            boxShadow: '0 0 16px rgba(200,16,46,0.3)',
          }}>
            <img
              src="https://amesgh.com/assets/images/logo.png"
              alt="AMES"
              style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'white' }}
            />
          </div>
          <AnimatePresence>
            {(!collapsed || mobile) && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <h2 style={{
                  fontFamily: 'Syne, sans-serif', fontWeight: 800,
                  fontSize: 16, color: 'var(--text)', lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}>
                  Ames<span style={{ color: 'var(--red)' }}>Stay</span>
                </h2>
                <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
                  UEW · Mathematics
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {mobile && (
          <button
            onClick={() => setMobileOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'none' }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Student info */}
      <AnimatePresence>
        {(!collapsed || mobile) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(200,16,46,0.3), rgba(0,48,135,0.3))',
              border: '2px solid rgba(200,16,46,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700,
              fontFamily: 'Syne, sans-serif',
              color: 'var(--text)', marginBottom: 12,
            }}>
              {profile?.full_name?.charAt(0) || 'S'}
            </div>
            <p style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: 14, color: 'var(--text)', marginBottom: 8,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {profile?.full_name || 'Student'}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 999,
                background: 'rgba(200,16,46,0.15)',
                border: '1px solid rgba(200,16,46,0.3)',
                color: 'var(--red)', fontFamily: 'DM Sans, sans-serif',
              }}>
                Level {profile?.level || '---'}
              </span>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 999,
                background: 'rgba(0,48,135,0.15)',
                border: '1px solid rgba(0,48,135,0.3)',
                color: '#6b9fff', fontFamily: 'DM Sans, sans-serif',
              }}>
                {progLabel}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav items */}
      <nav style={{
        flex: 1,
        padding: collapsed && !mobile ? '16px 8px' : '16px 12px',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.path
          const Icon = item.icon
          return (
            <div
              key={item.id}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <motion.button
                onClick={() => { router.push(item.path); setMobileOpen(false) }}
                whileHover={{ x: collapsed && !mobile ? 0 : 4 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: collapsed && !mobile ? 0 : 12,
                  padding: collapsed && !mobile ? '12px 0' : '11px 14px',
                  borderRadius: 10, border: 'none', width: '100%',
                  justifyContent: collapsed && !mobile ? 'center' : 'flex-start',
                  background: active ? 'rgba(200,16,46,0.12)' : 'transparent',
                  borderLeft: collapsed && !mobile ? 'none' : active ? '3px solid var(--red)' : '3px solid transparent',
                  boxShadow: active && collapsed && !mobile ? 'inset 0 0 0 1px rgba(200,16,46,0.3)' : 'none',
                  cursor: 'none', transition: 'all 0.2s ease',
                }}
              >
                <Icon
                  size={19}
                  color={active ? '#C8102E' : '#6B7A99'}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                <AnimatePresence>
                  {(!collapsed || mobile) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 14, fontWeight: active ? 600 : 400,
                        color: active ? 'var(--text)' : 'var(--muted)',
                        whiteSpace: 'nowrap', overflow: 'hidden',
                      }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && (!collapsed || mobile) && (
                  <motion.div
                    layoutId="activeIndicator"
                    style={{
                      marginLeft: 'auto', width: 6, height: 6,
                      borderRadius: '50%', background: 'var(--red)',
                      boxShadow: '0 0 8px var(--red)',
                    }}
                  />
                )}
              </motion.button>

              {/* Tooltip for collapsed state */}
              {collapsed && !mobile && hoveredItem === item.id && (
                <Tooltip label={item.label} show={true} />
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom — Logout + Collapse toggle */}
      <div style={{ padding: collapsed && !mobile ? '0 8px 16px' : '0 12px 16px' }}>

        {/* Logout */}
        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setHoveredItem('logout')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <motion.button
            onClick={handleLogout}
            whileHover={{ x: collapsed && !mobile ? 0 : 4 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center',
              gap: collapsed && !mobile ? 0 : 12,
              padding: collapsed && !mobile ? '12px 0' : '11px 14px',
              borderRadius: 10, border: 'none', width: '100%',
              justifyContent: collapsed && !mobile ? 'center' : 'flex-start',
              background: 'transparent', cursor: 'none',
            }}
          >
            <LogOut size={18} color="#6B7A99" strokeWidth={1.8} />
            <AnimatePresence>
              {(!collapsed || mobile) && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 14, color: 'var(--muted)',
                    whiteSpace: 'nowrap', overflow: 'hidden',
                  }}
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          {collapsed && !mobile && hoveredItem === 'logout' && (
            <Tooltip label="Sign Out" show={true} />
          )}
        </div>

        {/* Collapse toggle — desktop only */}
        {!mobile && (
          <motion.button
            onClick={() => setCollapsed(prev => !prev)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              gap: 8, width: '100%',
              padding: '10px 0', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.03)',
              cursor: 'none', marginTop: 8,
              transition: 'all 0.2s ease',
            }}
          >
            {collapsed
              ? <ChevronRight size={16} color="#6B7A99" />
              : <>
                  <ChevronLeft size={16} color="#6B7A99" />
                  <span style={{
                    fontSize: 12, color: 'var(--muted)',
                    fontFamily: 'DM Sans, sans-serif',
                  }}>
                    Collapse
                  </span>
                </>
            }
          </motion.button>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      {!isMobile && (
        <motion.aside
          animate={{ width: sidebarWidth }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            minHeight: '100vh',
            background: 'rgba(9,13,24,0.95)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
            overflow: 'hidden',
          }}
        >
          <SidebarContent />
        </motion.aside>
      )}

      {/* Mobile sidebar */}
      {isMobile && (
        <AnimatePresence>
          {mobileOpen && (
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                width: 260, minHeight: '100vh',
                background: 'rgba(9,13,24,0.98)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
              }}
            >
              <SidebarContent mobile={true} />
            </motion.aside>
          )}
        </AnimatePresence>
      )}

      {/* Main content */}
      <motion.div
        animate={{ marginLeft: isMobile ? 0 : sidebarWidth }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{ flex: 1, minHeight: '100vh' }}
      >
        {/* Top bar */}
        <div style={{
          height: 64, padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(8,12,20,0.8)',
          backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {isMobile && (
              <button
                onClick={() => setMobileOpen(true)}
                style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'none' }}
              >
                <Menu size={22} />
              </button>
            )}
            <div>
              <p style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 700,
                fontSize: 14, color: 'var(--text)',
              }}>
                Department of Mathematics Education
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
                University of Education, Winneba
              </p>
            </div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(200,16,46,0.3), rgba(0,48,135,0.3))',
            border: '2px solid rgba(200,16,46,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: 'var(--text)',
            fontFamily: 'Syne, sans-serif',
          }}>
            {profile?.full_name?.charAt(0) || 'S'}
          </div>
        </div>

        {/* Page content */}
        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ padding: isMobile ? '20px 16px' : '32px' }}
        >
          {children}
        </motion.main>
      </motion.div>
    </div>
  )
}