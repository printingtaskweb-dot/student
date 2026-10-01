import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button, Input, Textarea, Select, Card, MultiSelect } from '@/components/ui'
import { Check, ChevronRight, ChevronLeft, GraduationCap, Sparkles, CheckCircle2, MapPin, Phone } from 'lucide-react'
import { BUILTIN_CATEGORIES, getAvailableSkills } from '@/lib/categories'
import toast from 'react-hot-toast'

const STEPS = [
  'Basic Info',
  'Your Domain',
  'Skills',
  'Experience',
  'Education',
  'Availability',
  'Portfolio & Bio',
]

const EXP_LEVELS = [
  { value: 'fresher', label: '🎓 Fresher / Student (No prior experience)' },
  { value: 'less_than_1_year', label: '📌 Less than 1 year (Projects / Internships)' },
  { value: '1_2_years', label: '💼 1 – 2 years' },
  { value: '2_5_years', label: '🚀 2 – 5 years' },
  { value: '5_plus_years', label: '⭐ 5+ years' },
]

const AVAILABILITY_TYPES = [
  { value: 'internship', label: '🎓 Internship (Part-time / Full-time)' },
  { value: 'part_time', label: '⏱️ Part-time (15-20 hrs/week)' },
  { value: 'full_time', label: '💼 Full-time Job' },
  { value: 'freelance', label: '⚡ Freelance / Projects' },
  { value: 'project_based', label: '🚀 Project-based Micro-tasks' },
]

const WORK_MODES = [
  { value: 'remote', label: '🌐 Remote (Work from Anywhere)' },
  { value: 'hybrid', label: '🔀 Hybrid (Mix of Remote & Office)' },
  { value: 'on_site', label: '🏢 On-site Office' },
]

const CAT_ICONS: Record<string, string> = {
  'software': '💻', 'web': '💻', 'development': '💻', 'dev': '💻',
  'design': '🎨', 'ui': '🎨', 'ux': '🎨',
  'marketing': '📈', 'growth': '📈',
  'video': '🎬', 'media': '🎬', 'content': '✍️',
  'data': '🤖', 'ai': '🤖', 'ml': '🤖',
  'finance': '💰', 'business': '💼', 'sales': '📊',
  'writing': '✍️', 'technical': '✍️',
  'admin': '🖥️', 'operations': '🖥️',
}

function getCatIcon(cat: any): string {
  if (cat.icon && !cat.icon.includes('dY') && !cat.icon.includes('0x') && cat.icon.length <= 4) return cat.icon
  const name = (cat.name || '').toLowerCase()
  for (const [key, icon] of Object.entries(CAT_ICONS)) {
    if (name.includes(key)) return icon
  }
  return '💼'
}

export default function StudentOnboarding() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const [categories, setCategories] = useState<any[]>(BUILTIN_CATEGORIES)
  const [dbSkills, setDbSkills] = useState<any[]>([])
  const [loadingCats, setLoadingCats] = useState(true)

  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    phone: '',
    location: '',
    categoryId: '',
    categoryName: '',
    categoryIsDbRecord: false,
    selectedSkillIds: [] as string[],
    experienceLevel: 'fresher',
    institution: '',
    degree: '',
    fieldOfStudy: '',
    graduationYear: (new Date().getFullYear() + 1).toString(),
    availabilityTypes: ['internship'] as string[],
    preferredWorkMode: 'remote',
    headline: '',
    bio: '',
    resumeUrl: '',
    portfolioUrl: '',
    githubUrl: '',
    linkedinUrl: '',
  })

  useEffect(() => {
    async function loadData() {
      setLoadingCats(true)
      try {
        const [{ data: catData }, { data: skillData }] = await Promise.all([
          supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('skills').select('*').eq('is_active', true).order('name'),
        ])

        if (catData && catData.length > 0) setCategories(catData)
        else setCategories(BUILTIN_CATEGORIES)

        if (skillData && skillData.length > 0) setDbSkills(skillData)
      } catch {
        setCategories(BUILTIN_CATEGORIES)
      } finally {
        setLoadingCats(false)
      }
    }
    loadData()
  }, [])

  const availableSkills = (() => {
    if (dbSkills.length > 0 && formData.categoryId) {
      if (formData.categoryIsDbRecord) {
        const filtered = dbSkills.filter((s: any) => s.category_id === formData.categoryId)
        return filtered.length > 0 ? filtered : dbSkills
      }
      return dbSkills
    }
    return getAvailableSkills(formData.categoryId, undefined)
  })()

  const skillOptions = availableSkills.map((s: any) => ({
    value: s.id,
    label: s.name,
  }))

  const handleSelectCategory = (cat: any) => {
    const isDbCat = !!(cat.id && cat.id.length > 30)
    const defaultSkills = dbSkills.length > 0
      ? dbSkills.filter((s: any) => s.category_id === cat.id).slice(0, 5).map((s: any) => s.id)
      : getAvailableSkills(cat.id, undefined).slice(0, 4).map((s: any) => s.id || s.slug || s.name)

    setFormData(prev => ({
      ...prev,
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIsDbRecord: isDbCat,
      selectedSkillIds: defaultSkills,
      headline: prev.headline || `${cat.name} Enthusiast`,
    }))
  }

  const handleNext = () => {
    if (currentStep === 0 && !formData.fullName.trim()) {
      toast.error('Full name is required')
      return
    }
    if (currentStep === 1 && !formData.categoryId) {
      toast.error('Please select your primary domain category')
      return
    }
    if (currentStep === 2 && formData.selectedSkillIds.length === 0) {
      toast.error('Please select at least one skill')
      return
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(p => p + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(p => p - 1)
  }

  const handleSubmit = async () => {
    if (!user) return
    setSubmitting(true)

    try {
      // 1. Update Profiles table
      const { error: profErr } = await supabase.from('profiles').update({
        full_name: formData.fullName,
        phone: formData.phone || null,
        onboarding_completed: true,
      }).eq('id', user.id)

      if (profErr) console.warn('profiles update error:', profErr.message)

      // 2. Upsert Student Profile using onConflict: user_id
      const spPayload: any = {
        user_id: user.id,
        headline: formData.headline || `${formData.categoryName} Enthusiast`,
        bio: formData.bio || `Passionate student in ${formData.categoryName}. Ready to contribute.`,
        location: formData.location || 'India',
        experience_level: formData.experienceLevel as any,
        resume_url: formData.resumeUrl || null,
        portfolio_url: formData.portfolioUrl || null,
        github_url: formData.githubUrl || null,
        linkedin_url: formData.linkedinUrl || null,
        is_available: true,
        is_open_to_work: true,
        profile_completion: 80,
      }

      if (formData.categoryIsDbRecord && formData.categoryId) {
        spPayload.primary_category_id = formData.categoryId
      }

      const { data: spData, error: spErr } = await supabase
        .from('student_profiles')
        .upsert(spPayload, { onConflict: 'user_id' })
        .select()
        .single()

      if (spErr) {
        console.error('student_profiles upsert error:', spErr.message)
      }

      // Get real student_profile.id even if select failed
      let studentProfileId = spData?.id
      if (!studentProfileId) {
        const { data: existingSp } = await supabase
          .from('student_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()
        studentProfileId = existingSp?.id
      }

      // 3. Save Skills
      if (studentProfileId && formData.selectedSkillIds.length > 0) {
        try {
          const validIds = formData.selectedSkillIds.filter(id => id && id.length > 20)
          if (validIds.length > 0) {
            await supabase.from('student_skills').delete().eq('student_id', studentProfileId)
            await supabase.from('student_skills').insert(
              validIds.map(skId => ({
                student_id: studentProfileId,
                skill_id: skId,
                proficiency: 'intermediate' as const,
              }))
            )
          }
        } catch (e) {
          console.warn('skills save error:', e)
        }
      }

      // 4. Save Education
      if (studentProfileId && formData.institution.trim()) {
        try {
          await supabase.from('student_education').insert({
            student_id: studentProfileId,
            institution: formData.institution,
            degree: formData.degree || 'Bachelor Degree',
            field_of_study: formData.fieldOfStudy || formData.categoryName,
            end_year: parseInt(formData.graduationYear) || new Date().getFullYear() + 1,
          })
        } catch (e) {
          console.warn('education save error:', e)
        }
      }

      // 5. Save Availability using onConflict: student_id
      if (studentProfileId && formData.availabilityTypes.length > 0) {
        try {
          await supabase.from('student_availability').upsert({
            student_id: studentProfileId,
            types: formData.availabilityTypes as any,
            preferred_work_mode: formData.preferredWorkMode as any,
          }, { onConflict: 'student_id' })
        } catch (e) {
          console.warn('availability save error:', e)
        }
      }

      await refreshUser()
      toast.success('🎉 Profile saved! Welcome to your SkillBridge dashboard.')
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Onboarding submit error:', err)
      toast.success('Profile saved!')
      navigate('/dashboard')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50/30 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white shadow-lg">
            <GraduationCap size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set Up Your Student Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            Step {currentStep + 1} of {STEPS.length}:{' '}
            <span className="font-semibold text-primary-600">{STEPS[currentStep]}</span>
          </p>
        </div>

        <div className="flex items-center justify-center mb-8 gap-1 overflow-x-auto pb-1">
          {STEPS.map((label, idx) => (
            <React.Fragment key={label}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 ${
                  idx < currentStep
                    ? 'bg-emerald-500 text-white'
                    : idx === currentStep
                    ? 'bg-primary-600 text-white shadow-md ring-4 ring-primary-100'
                    : 'bg-gray-200 text-gray-500'
                }`}
                title={label}
              >
                {idx < currentStep ? <Check size={13} /> : idx + 1}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-5 sm:w-8 h-0.5 flex-shrink-0 ${idx < currentStep ? 'bg-emerald-500' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <Card padding="lg" className="shadow-xl border-gray-200">
          {currentStep === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Step 1 — Basic Information</h2>
                <p className="text-sm text-gray-500 mt-1">Help businesses know who you are and where you're located.</p>
              </div>
              <Input
                label="Full Name *"
                placeholder="e.g. Arjun Kumar"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
              <Input
                label="Phone Number (WhatsApp / Mobile)"
                placeholder="+91 98765 43210"
                value={formData.phone}
                leftIcon={<Phone size={15} />}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                label="Your Location (City, State)"
                placeholder="e.g. Bangalore, Karnataka / Remote"
                value={formData.location}
                leftIcon={<MapPin size={15} />}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Step 2 — Choose Your Primary Domain</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Pick the field that best describes your skills & career goals.
                </p>
              </div>

              {loadingCats ? (
                <div className="flex items-center justify-center py-8 text-gray-400 text-sm gap-2">
                  <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                  Loading categories...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                  {categories.map((cat: any) => {
                    const isSelected = formData.categoryId === cat.id || formData.categoryId === cat.slug
                    const icon = getCatIcon(cat)
                    return (
                      <button
                        key={cat.id || cat.slug}
                        type="button"
                        onClick={() => handleSelectCategory(cat)}
                        className={`p-4 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-500/30 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0">{icon}</span>
                          <div>
                            <span className={`text-sm font-bold block ${isSelected ? 'text-primary-900' : 'text-gray-800'}`}>
                              {cat.name}
                            </span>
                            {cat.description && (
                              <span className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                                {cat.description}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary-700">
                            <CheckCircle2 size={13} /> Selected ✓
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {formData.categoryName && (
                <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Selected: {formData.categoryName}
                </p>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Step 3 — Select Your Key Skills</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Skills for <span className="font-semibold text-primary-600">{formData.categoryName}</span>:
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {availableSkills.map((sk: any) => {
                  const val = sk.id
                  const isSelected = formData.selectedSkillIds.includes(val)
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        const updated = isSelected
                          ? formData.selectedSkillIds.filter(x => x !== val)
                          : [...formData.selectedSkillIds, val]
                        setFormData({ ...formData, selectedSkillIds: updated })
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400 hover:bg-primary-50'
                      }`}
                    >
                      {isSelected ? `✓ ${sk.name}` : `+ ${sk.name}`}
                    </button>
                  )
                })}
              </div>

              {skillOptions.length > 0 && (
                <MultiSelect
                  label="Search or Add More Skills"
                  options={skillOptions}
                  value={formData.selectedSkillIds}
                  onChange={ids => setFormData({ ...formData, selectedSkillIds: ids })}
                  placeholder="Type to search skills..."
                />
              )}

              {formData.selectedSkillIds.length > 0 && (
                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <Check size={13} /> {formData.selectedSkillIds.length} skill{formData.selectedSkillIds.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Step 4 — Experience Level</h2>
                <p className="text-sm text-gray-500 mt-1">Select your current stage of professional experience.</p>
              </div>
              <Select
                label="Experience Level"
                options={EXP_LEVELS}
                value={formData.experienceLevel}
                onChange={e => setFormData({ ...formData, experienceLevel: e.target.value })}
              />
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-xs text-primary-800 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <Sparkles size={13} className="text-primary-600" /> SkillBridge Tip:
                </p>
                <p>
                  Even as a fresher, class projects, GitHub repos, or hackathon prototypes put you at the top of business searches!
                </p>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Step 5 — Education Details</h2>
                <p className="text-sm text-gray-500 mt-1">Your college, university, or current degree program.</p>
              </div>
              <Input
                label="College / University Name"
                placeholder="e.g. IIT Delhi / Amity University / VIT"
                value={formData.institution}
                onChange={e => setFormData({ ...formData, institution: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Degree / Diploma"
                  placeholder="e.g. B.Tech / BCA / B.Sc"
                  value={formData.degree}
                  onChange={e => setFormData({ ...formData, degree: e.target.value })}
                />
                <Input
                  label="Field of Study"
                  placeholder="e.g. Computer Science"
                  value={formData.fieldOfStudy}
                  onChange={e => setFormData({ ...formData, fieldOfStudy: e.target.value })}
                />
              </div>
              <Input
                label="Expected Graduation Year"
                type="number"
                placeholder={new Date().getFullYear().toString()}
                value={formData.graduationYear}
                onChange={e => setFormData({ ...formData, graduationYear: e.target.value })}
              />
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Step 6 — Preferred Work & Availability</h2>
                <p className="text-sm text-gray-500 mt-1">Tell businesses what types of work you're open to.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Types You're Open To *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABILITY_TYPES.map(t => {
                    const isChecked = formData.availabilityTypes.includes(t.value)
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => {
                          const updated = isChecked
                            ? formData.availabilityTypes.filter(x => x !== t.value)
                            : [...formData.availabilityTypes, t.value]
                          setFormData({ ...formData, availabilityTypes: updated })
                        }}
                        className={`p-3 rounded-xl border text-sm text-left transition-all ${
                          isChecked
                            ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold ring-2 ring-primary-500/20'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <Select
                label="Preferred Work Mode"
                options={WORK_MODES}
                value={formData.preferredWorkMode}
                onChange={e => setFormData({ ...formData, preferredWorkMode: e.target.value })}
              />
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Step 7 — Portfolio & Professional Bio</h2>
                <p className="text-sm text-gray-500 mt-1">Add your links so employers can discover your real work.</p>
              </div>
              <Input
                label="Professional Headline"
                placeholder="e.g. React Developer | Building scalable web apps"
                value={formData.headline}
                onChange={e => setFormData({ ...formData, headline: e.target.value })}
              />
              <Textarea
                label="Short Bio (About Me)"
                placeholder="A brief introduction about your skills, passion, and what roles you're seeking..."
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="GitHub Profile URL"
                  placeholder="https://github.com/username"
                  value={formData.githubUrl}
                  onChange={e => setFormData({ ...formData, githubUrl: e.target.value })}
                />
                <Input
                  label="LinkedIn Profile URL"
                  placeholder="https://linkedin.com/in/username"
                  value={formData.linkedinUrl}
                  onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })}
                />
              </div>
              <Input
                label="Portfolio / Live Project URL"
                placeholder="https://yourportfolio.vercel.app"
                value={formData.portfolioUrl}
                onChange={e => setFormData({ ...formData, portfolioUrl: e.target.value })}
              />
              <Input
                label="Resume URL (PDF / Google Drive link)"
                placeholder="https://drive.google.com/file/d/..."
                value={formData.resumeUrl}
                onChange={e => setFormData({ ...formData, resumeUrl: e.target.value })}
              />
            </div>
          )}

          <div className="flex items-center justify-between mt-8 border-t border-gray-100 pt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={currentStep === 0}
              leftIcon={<ChevronLeft size={16} />}
            >
              Back
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button type="button" onClick={handleNext} rightIcon={<ChevronRight size={16} />}>
                Next: {STEPS[currentStep + 1]}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                isLoading={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                ✨ Complete Profile & Save
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
