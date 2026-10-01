import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Bell, ChevronDown, LogOut, User, Settings, LayoutDashboard, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui'
import { cn } from '@/lib/utils'

const publicNav = [
  { label: 'Opportunities', href: '/opportunities' },
  { label: 'Talent', href: '/talent' },
  { label: 'Businesses', href: '/businesses' },
  { label: 'Hackathons', href: '/hackathons' },
  { label: 'Blog', href: '/blog' },
]

const studentNav = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Opportunities', href: '/opportunities' },
  { label: 'Applications', href: '/applications' },
  { label: 'Saved', href: '/saved' },
  { label: 'Hackathons', href: '/hackathons' },
]

const businessNav = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Post Job', href: '/post-job' },
  { label: 'Applicants', href: '/applicants' },
  { label: 'Find Talent', href: '/talent' },
  { label: 'Hiring', href: '/hiring' },
]

const adminNav = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Jobs', href: '/admin/jobs' },
  { label: 'Hackathons', href: '/admin/hackathons' },
  { label: 'Blog', href: '/admin/blog' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  const navLinks = user?.role === 'student' ? studentNav
    : user?.role === 'business_owner' ? businessNav
    : user?.role === 'admin' ? adminNav
    : publicNav

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin'
    return '/dashboard'
  }

  return (
    <header className={cn(
      'sticky top-0 z-40 bg-white/95 backdrop-blur-md transition-all duration-300',
      scrolled ? 'shadow-xs border-b border-gray-200/90 py-0.5' : 'border-b border-gray-100/90'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 bg-[#2563eb] rounded-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 7h4l2 5 2-8 2 3h4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold tracking-tight text-gray-950">SkillBridge</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-50/80 p-1 rounded-xl border border-gray-100">
            {navLinks.map(link => {
              const isActive = location.pathname === link.href || (link.href !== '/' && location.pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200',
                    isActive
                      ? 'text-[#2563eb] bg-white shadow-xs font-bold'
                      : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100/60'
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/notifications"
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <Bell size={17} />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#2563eb]" />
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 hover:bg-gray-100/80 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
                    <span className="hidden sm:block text-xs font-semibold text-gray-800 max-w-[110px] truncate">{user.full_name}</span>
                    <ChevronDown size={13} className={cn('text-gray-400 transition-transform duration-200', userMenuOpen && 'rotate-180')} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3.5 py-2.5 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-950 truncate">{user.full_name}</p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{user.email}</p>
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]/50">
                          {user.role === 'student' ? '🎓 Student' : user.role === 'business_owner' ? '🏢 Business' : '🛡️ Admin'}
                        </div>
                      </div>
                      <div className="py-1">
                        <Link
                          to={getDashboardLink()}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-[#2563eb] transition-colors"
                        >
                          <LayoutDashboard size={14} />
                          Dashboard
                        </Link>
                        <Link
                          to={user.role === 'student' ? '/profile' : user.role === 'business_owner' ? '/business-profile' : '/admin/settings'}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-[#2563eb] transition-colors"
                        >
                          <User size={14} />
                          Edit Profile
                        </Link>
                        {user.role === 'admin' && (
                          <Link
                            to="/admin/settings"
                            className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-[#2563eb] transition-colors"
                          >
                            <Settings size={14} />
                            Platform Settings
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50/60 transition-colors"
                        >
                          <LogOut size={14} />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-950 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold bg-[#2563eb] text-white rounded-xl hover:bg-[#1d4ed8] shadow-xs hover:shadow-[#2563eb]/25 hover:shadow-md transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {isOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/98 backdrop-blur-md px-4 py-3 space-y-2">
          <nav className="space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors',
                  location.pathname === link.href
                    ? 'text-[#2563eb] bg-[#eff6ff]'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {!user && (
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              <Link to="/login" className="btn-secondary btn btn-sm text-center">Sign in</Link>
              <Link to="/register" className="btn-primary btn btn-sm text-center">Get Started</Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
