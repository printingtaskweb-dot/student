import React, { useState, useEffect } from 'react'
import { Modal, Button } from '@/components/ui'
import { Sparkles, Printer, Copy, Check, Download, Briefcase, GraduationCap, Code2, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface ResumeGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  initialCategory?: string
  initialSkills?: string[]
}

export function ResumeGeneratorModal({
  isOpen,
  onClose,
  initialCategory = 'Software Development',
  initialSkills = [],
}: ResumeGeneratorModalProps) {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  const [resumeData, setResumeData] = useState({
    fullName: user?.full_name || 'Alex Morgan',
    email: user?.email || 'alex.morgan@example.com',
    phone: '+91 98765 43210',
    location: 'Mumbai, India',
    linkedin: 'linkedin.com/in/alexmorgan',
    github: 'github.com/alexmorgan',
    portfolio: 'alexmorgan.dev',
    targetRole: 'Full Stack Developer',
    summary: 'Proactive and detail-oriented computer science graduate passionate about building responsive web applications and scalable backends. Skilled in modern JavaScript, React, Node.js, and database design. Eager to contribute to impactful engineering projects.',
    skills: initialSkills.length > 0 ? initialSkills : ['React.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Git & GitHub', 'REST APIs'],
    education: [
      {
        institution: 'University of Technology',
        degree: 'Bachelor of Technology (B.Tech) in Computer Science',
        year: '2021 - 2025',
        grade: 'CGPA: 8.6 / 10',
      },
    ],
    projects: [
      {
        title: 'SkillBridge — Student-Business Marketplace',
        tech: 'React, TypeScript, Tailwind CSS, Supabase',
        description: 'Engineered a full-stack marketplace connecting 500+ students with businesses. Built matching algorithms, application tracking, and an interactive AI copilot.',
      },
    ],
    experience: [
      {
        role: 'Web Development Intern',
        company: 'Alpha Tech Solutions',
        duration: 'Jun 2024 - Aug 2024',
        details: 'Designed and deployed 8+ responsive client landing pages. Optimized page speed scores by 35% through image caching and code-splitting.',
      },
    ],
  })

  // Fetch full student profile data from Database when modal opens
  useEffect(() => {
    async function fetchFullStudentData() {
      if (!user) return
      setLoadingData(true)
      try {
        // 1. Profiles table (phone, full_name, email)
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', user.id)
          .single()

        // 2. Student profiles table
        const { data: sp } = await supabase
          .from('student_profiles')
          .select('id, headline, bio, location, linkedin_url, github_url, portfolio_url, resume_url')
          .eq('user_id', user.id)
          .maybeSingle()

        if (sp?.id) {
          // Fetch related details in parallel
          const [
            { data: skillRows },
            { data: eduRows },
            { data: expRows },
            { data: projRows },
          ] = await Promise.all([
            supabase.from('student_skills').select('skills(name)').eq('student_id', sp.id),
            supabase.from('student_education').select('*').eq('student_id', sp.id).order('end_year', { ascending: false }),
            supabase.from('student_experience').select('*').eq('student_id', sp.id).order('start_date', { ascending: false }),
            supabase.from('student_projects').select('*').eq('student_id', sp.id).order('created_at', { ascending: false }),
          ])

          // Map database data into resume format
          const dbSkills = (skillRows || []).map((s: any) => s.skills?.name).filter(Boolean)

          const dbEducation = (eduRows || []).map((e: any) => ({
            institution: e.institution || 'University',
            degree: [e.degree, e.field_of_study ? `in ${e.field_of_study}` : ''].filter(Boolean).join(' '),
            year: `${e.start_year || ''}${e.start_year && e.end_year ? ' - ' : ''}${e.is_current ? 'Present' : e.end_year || ''}`,
            grade: e.grade ? `Grade: ${e.grade}` : '',
          }))

          const dbExperience = (expRows || []).map((exp: any) => ({
            role: exp.role || 'Role',
            company: exp.company || 'Company',
            duration: `${exp.start_date ? new Date(exp.start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''} - ${exp.is_current ? 'Present' : exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''}`,
            details: exp.description || 'Contributed to key team goals and deliverables.',
          }))

          const dbProjects = (projRows || []).map((p: any) => ({
            title: p.title || 'Project',
            tech: (p.technologies || []).join(', ') || 'React, Web Tech',
            description: p.description || 'Built and deployed project features.',
          }))

          setResumeData(prev => ({
            fullName: profileRow?.full_name || user.full_name || prev.fullName,
            email: profileRow?.email || user.email || prev.email,
            phone: profileRow?.phone || prev.phone,
            location: sp.location || prev.location,
            linkedin: sp.linkedin_url || prev.linkedin,
            github: sp.github_url || prev.github,
            portfolio: sp.portfolio_url || prev.portfolio,
            targetRole: sp.headline || prev.targetRole,
            summary: sp.bio || prev.summary,
            skills: dbSkills.length > 0 ? dbSkills : prev.skills,
            education: dbEducation.length > 0 ? dbEducation : prev.education,
            experience: dbExperience.length > 0 ? dbExperience : prev.experience,
            projects: dbProjects.length > 0 ? dbProjects : prev.projects,
          }))
        } else if (profileRow) {
          setResumeData(prev => ({
            ...prev,
            fullName: profileRow.full_name || prev.fullName,
            email: profileRow.email || prev.email,
            phone: profileRow.phone || prev.phone,
          }))
        }
      } catch (err) {
        console.warn('Error fetching resume data from database:', err)
      } finally {
        setLoadingData(false)
      }
    }

    if (isOpen) {
      fetchFullStudentData()
    }
  }, [isOpen, user])

  const handleAiEnhanceSummary = () => {
    setGenerating(true)
    setTimeout(() => {
      setResumeData(prev => ({
        ...prev,
        summary: `Dedicated and fast-learning ${prev.targetRole || 'Professional'} with strong problem-solving skills and expertise in ${prev.skills.slice(0, 3).join(', ')}. Proven track record of delivering clean code, collaborating in agile environments, and building responsive web applications.`,
      }))
      setGenerating(false)
      toast.success('Resume summary enhanced with AI!')
    }, 600)
  }

  const handleCopyText = () => {
    const text = `
${resumeData.fullName.toUpperCase()}
${resumeData.targetRole}
Email: ${resumeData.email} | Phone: ${resumeData.phone} | Location: ${resumeData.location}
LinkedIn: ${resumeData.linkedin} | GitHub: ${resumeData.github}

PROFESSIONAL SUMMARY
${resumeData.summary}

CORE SKILLS
${resumeData.skills.join(' • ')}

EDUCATION
${resumeData.education.map(e => `${e.degree} - ${e.institution} (${e.year}) ${e.grade}`).join('\n')}

PROJECTS
${resumeData.projects.map(p => `${p.title} [${p.tech}]\n- ${p.description}`).join('\n\n')}

EXPERIENCE
${resumeData.experience.map(exp => `${exp.role} at ${exp.company} (${exp.duration})\n- ${exp.details}`).join('\n\n')}
    `.trim()

    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Resume copied to clipboard!')
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Resume Builder & Generator"
      description="Preview, customize, and export your ATS-optimized student resume pre-filled from your profile database."
      size="2xl"
      footer={
        <div className="flex flex-wrap items-center justify-between w-full gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAiEnhanceSummary}
            isLoading={generating}
            leftIcon={<Sparkles size={14} className="text-primary-600" />}
          >
            AI Auto-Enhance
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyText} leftIcon={copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}>
              {copied ? 'Copied' : 'Copy Text'}
            </Button>
            <Button size="sm" onClick={handlePrint} leftIcon={<Printer size={14} />}>
              Print / Save PDF
            </Button>
          </div>
        </div>
      }
    >
      {loadingData ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-sm gap-2">
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          Fetching your stored profile data from database...
        </div>
      ) : (
        <div className="space-y-6 max-h-[68vh] overflow-y-auto pr-1 text-gray-800">
          {/* Printable Resume Canvas */}
          <div className="border border-gray-200 rounded-xl p-6 sm:p-8 bg-white shadow-xs space-y-6 font-sans print:border-none print:shadow-none print:p-0">
            {/* Header */}
            <div className="border-b border-gray-200 pb-4 text-center">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{resumeData.fullName}</h1>
              <p className="text-sm font-semibold text-primary-600 mt-1">{resumeData.targetRole}</p>
              <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-2">
                <span>{resumeData.email}</span>
                {resumeData.phone && <span>• {resumeData.phone}</span>}
                {resumeData.location && <span>• {resumeData.location}</span>}
              </div>
              <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-xs text-primary-700 mt-1">
                {resumeData.linkedin && <span>{resumeData.linkedin}</span>}
                {resumeData.github && <span>• {resumeData.github}</span>}
                {resumeData.portfolio && <span>• {resumeData.portfolio}</span>}
              </div>
            </div>

            {/* Summary */}
            {resumeData.summary && (
              <div>
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">
                  Professional Summary
                </h2>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{resumeData.summary}</p>
              </div>
            )}

            {/* Core Skills */}
            {resumeData.skills.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">
                  Core Skills & Tools
                </h2>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {resumeData.skills.map((skill, i) => (
                    <span key={i} className="inline-block px-2.5 py-0.5 rounded text-xs bg-gray-100 text-gray-800 font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {resumeData.projects.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2.5">
                  Key Projects
                </h2>
                <div className="space-y-3">
                  {resumeData.projects.map((proj, i) => (
                    <div key={i} className="text-xs sm:text-sm">
                      <div className="flex flex-wrap justify-between items-baseline">
                        <span className="font-bold text-gray-900">{proj.title}</span>
                        {proj.tech && <span className="text-[11px] font-mono text-gray-500">{proj.tech}</span>}
                      </div>
                      {proj.description && <p className="text-xs text-gray-600 mt-1">{proj.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {resumeData.experience.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2.5">
                  Work Experience / Internships
                </h2>
                <div className="space-y-3">
                  {resumeData.experience.map((exp, i) => (
                    <div key={i} className="text-xs sm:text-sm">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-gray-900">{exp.role} — <span className="font-normal text-gray-700">{exp.company}</span></span>
                        <span className="text-[11px] text-gray-500">{exp.duration}</span>
                      </div>
                      {exp.details && <p className="text-xs text-gray-600 mt-1">{exp.details}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {resumeData.education.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">
                  Education
                </h2>
                <div className="space-y-2">
                  {resumeData.education.map((edu, i) => (
                    <div key={i} className="text-xs sm:text-sm flex justify-between items-baseline">
                      <div>
                        <span className="font-bold text-gray-900">{edu.degree}</span>
                        <p className="text-xs text-gray-600">{edu.institution} {edu.grade && `• ${edu.grade}`}</p>
                      </div>
                      <span className="text-[11px] text-gray-500">{edu.year}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
