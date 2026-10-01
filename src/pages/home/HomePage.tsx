import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, Badge, Button } from '@/components/ui'
import {
  Search, Briefcase, GraduationCap, Building2, Trophy,
  ArrowRight, CheckCircle2, Sparkles, MapPin, Zap, ShieldCheck,
  Code2, Users, Star, ArrowUpRight
} from 'lucide-react'
import { formatWorkMode, formatSalary, timeAgo } from '@/lib/utils'

export default function HomePage() {
  const [stats, setStats] = useState({ total_students: 180, total_businesses: 42, active_jobs: 94, total_hires: 38 })
  const [jobs, setJobs] = useState<any[]>([])
  const [hackathons, setHackathons] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const [{ data: s }, { data: j }, { data: h }] = await Promise.all([
          supabase.from('platform_stats').select('*').single(),
          supabase.from('jobs').select('*, business_profiles(business_name, logo_url)').eq('status', 'active').limit(4),
          supabase.from('hackathons').select('*').neq('status', 'draft').limit(2),
        ])

        if (s) setStats(s as any)
        if (j && j.length > 0) setJobs(j)
        if (h && h.length > 0) setHackathons(h)
      } catch (err) {
        console.error(err)
      }
    }
    loadData()
  }, [])

  return (
    <div className="space-y-20 py-6 sm:py-10">
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-20">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-radial-glow pointer-events-none -z-10" />
        <div className="absolute inset-0 bg-dots-subtle opacity-40 pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-200/90 text-xs font-semibold text-gray-800 shadow-xs mb-8">
            <span className="w-2 h-2 rounded-full bg-[#2563eb] animate-pulse" />
            <span>Connecting Student Talent with Verified Businesses</span>
            <span className="text-[#2563eb] font-bold">→</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-gray-950 tracking-tight max-w-4xl mx-auto leading-[1.12]">
            Where ambitious students meet{' '}
            <span className="relative inline-block">
              <span className="text-[#2563eb]">forward-thinking</span>
            </span>{' '}
            companies.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Showcase verified projects, build ATS-ready resumes, compete in local hackathons, and land paid internships and entry-level positions.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/opportunities"
              className="px-6 py-3 text-sm font-semibold rounded-xl bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-md hover:shadow-[#2563eb]/25 transition-all duration-200 inline-flex items-center gap-2"
            >
              <Search size={16} /> Explore Opportunities
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 text-sm font-semibold rounded-xl bg-[#090d16] text-white hover:bg-black border border-gray-800 transition-all duration-200 inline-flex items-center gap-2"
            >
              <Building2 size={16} /> Hire Student Talent
            </Link>
          </div>

          {/* ── HERO INTERACTIVE GRAPHIC MOCKUP ── */}
          <div className="mt-14 max-w-5xl mx-auto relative">
            <div className="relative rounded-3xl p-2 sm:p-4 bg-gradient-to-b from-gray-100/90 via-gray-50/50 to-white border border-gray-200/80 shadow-xl backdrop-blur-sm">
              <div className="rounded-2xl bg-white border border-gray-100 p-6 sm:p-8 text-left relative overflow-hidden">
                {/* Decorative Top Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#2563eb] to-transparent" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Mock Card 1: Student Profile Showcase */}
                  <div className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/50 flex flex-col justify-between animate-float">
                    <div>
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="w-10 h-10 rounded-full bg-[#eff6ff] text-[#2563eb] font-bold flex items-center justify-center border border-[#bfdbfe]">
                          AK
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-950">Aarav Kumar</p>
                          <p className="text-[11px] text-gray-500">React & Node Specialist</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 my-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-gray-200 text-gray-700">TypeScript</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-gray-200 text-gray-700">Next.js</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb]">PostgreSQL</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-3 border-t border-gray-200/60 text-emerald-600 font-semibold">
                      <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Open to Work</span>
                      <span className="text-gray-400">92% Match</span>
                    </div>
                  </div>

                  {/* Mock Card 2: Live Job Opening */}
                  <div className="p-4 rounded-xl border border-[#2563eb]/30 bg-white shadow-xs flex flex-col justify-between relative ring-1 ring-[#2563eb]/10">
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2563eb] text-white">
                      🔥 Live Opening
                    </span>
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Fintech Labs</p>
                      <h4 className="text-sm font-bold text-gray-950 mt-0.5">Frontend Developer Intern</h4>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                        Collaborate with senior engineers building responsive merchant dashboards and transaction analytics.
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-3 border-t border-gray-100">
                      <span className="font-bold text-gray-900">₹25,000 / month</span>
                      <span className="text-[#2563eb] font-semibold flex items-center gap-0.5">Apply Now →</span>
                    </div>
                  </div>

                  {/* Mock Card 3: Hackathon Challenge */}
                  <div className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/50 flex flex-col justify-between animate-float-reverse">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          🏆 ₹1,50,000 Prize
                        </span>
                        <span className="text-[10px] text-gray-400">Registration Open</span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-950">AI Web Innovation Challenge</h4>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Build AI-augmented web workflows with your university squad.
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-3 border-t border-gray-200/60 text-gray-500">
                      <span>48 Hours Hack</span>
                      <span className="text-gray-900 font-semibold">4 Members</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Minimalist Stats Strip */}
          <div className="mt-14 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 p-6 rounded-2xl bg-white border border-gray-200/80 shadow-xs">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-950">{stats.total_students || 180}+</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Students Enrolled</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-950">{stats.total_businesses || 42}+</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Verified Companies</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#2563eb]">{stats.active_jobs || 94}+</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Live Opportunities</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-950">{stats.total_hires || 38}+</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Successful Hires</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3-STEP MINIMALIST WORKFLOW ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-[#2563eb] uppercase tracking-wider">How SkillBridge Works</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 mt-1 tracking-tight">
            Designed for career velocity.
          </h2>
          <p className="text-sm text-gray-500 mt-2 max-w-lg mx-auto">
            A seamless bridge from academic potential to real-world software engineering and digital business roles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-premium p-6 relative">
            <div className="w-10 h-10 rounded-xl bg-[#090d16] text-white flex items-center justify-center font-bold text-sm mb-4">
              01
            </div>
            <h3 className="text-base font-bold text-gray-950 mb-1.5">Build Your ATS Profile</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Highlight projects, repos, frameworks, and availability. Use the built-in AI Copilot to format an industry-standard resume.
            </p>
          </div>

          <div className="card-premium p-6 relative">
            <div className="w-10 h-10 rounded-xl bg-[#2563eb] text-white flex items-center justify-center font-bold text-sm mb-4 shadow-sm">
              02
            </div>
            <h3 className="text-base font-bold text-gray-950 mb-1.5">Get Discovered by Businesses</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Companies search our Talent Directory for real skill demonstrations rather than keyword-stuffed traditional CVs.
            </p>
          </div>

          <div className="card-premium p-6 relative">
            <div className="w-10 h-10 rounded-xl bg-[#090d16] text-white flex items-center justify-center font-bold text-sm mb-4">
              03
            </div>
            <h3 className="text-base font-bold text-gray-950 mb-1.5">Compete in Hackathons</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Find hackathons happening near your university coordinates. Team up, solve real problem statements, and win cash prizes.
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURED OPPORTUNITIES ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold text-[#2563eb] uppercase tracking-wider">Live Openings</p>
            <h2 className="text-2xl font-extrabold text-gray-950 mt-1">Recommended Roles</h2>
          </div>
          <Link
            to="/opportunities"
            className="text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8] flex items-center gap-1 group"
          >
            Browse All <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.length > 0 ? (
            jobs.map(job => (
              <Card key={job.id} hover className="flex flex-col justify-between p-5 border border-gray-200/80">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-gray-950 line-clamp-1">{job.title}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Building2 size={12} /> {job.business_profiles?.business_name || 'Verified Company'}
                      </p>
                    </div>
                    <Badge variant="blue">{job.job_type.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 my-2.5 leading-relaxed">{job.description}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                  <span className="font-semibold text-gray-900">{formatSalary(job.salary_min, job.salary_max)}</span>
                  <Link to={`/opportunities/${job.slug}`} className="font-bold text-[#2563eb] hover:underline flex items-center gap-0.5">
                    View Details →
                  </Link>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-2 p-8 text-center bg-gray-50 rounded-2xl border border-gray-200">
              <p className="text-sm text-gray-500">Connecting to live opportunities...</p>
            </div>
          )}
        </div>
      </section>

      {/* ── HIGH-CONTRAST CALL TO ACTION ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-8 sm:p-14 bg-[#090d16] text-white border border-gray-800 shadow-2xl overflow-hidden">
          {/* Subtle Ambient Blue Flare */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#2563eb]/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#2563eb]/20 text-[#60a5fa] border border-[#2563eb]/40 mb-4">
              <Sparkles size={12} /> Ready for your next chapter?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Create your profile in 3 minutes. Start applying today.
            </h2>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed">
              Join hundreds of motivated students connecting with verified tech startups, design studios, and businesses.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="px-6 py-3 text-xs font-bold rounded-xl bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-lg hover:shadow-[#2563eb]/30 transition-all duration-200"
              >
                Sign Up as Student
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-all duration-200"
              >
                Register as Business
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
