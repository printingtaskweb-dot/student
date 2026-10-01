import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, SearchBar, Select, Badge, LoadingSpinner, EmptyState } from '@/components/ui'
import { Building2, MapPin, Briefcase, ArrowRight, Globe, Users, CheckCircle2, Star } from 'lucide-react'

const INDUSTRY_OPTIONS = [
  { value: '', label: 'All Industries' },
  { value: 'technology', label: '💻 Technology' },
  { value: 'design', label: '🎨 Design & Creative' },
  { value: 'marketing', label: '📢 Marketing' },
  { value: 'finance', label: '💰 Finance' },
  { value: 'healthcare', label: '🏥 Healthcare' },
  { value: 'education', label: '📚 Education' },
  { value: 'ecommerce', label: '🛒 E-Commerce' },
  { value: 'media', label: '🎬 Media & Content' },
  { value: 'consulting', label: '🤝 Consulting' },
  { value: 'other', label: '🏢 Other' },
]

const SIZE_OPTIONS = [
  { value: '', label: 'Any Size' },
  { value: '1-10', label: '1-10 (Startup)' },
  { value: '11-50', label: '11-50 (Small)' },
  { value: '51-200', label: '51-200 (Mid-size)' },
  { value: '201-1000', label: '201-1000 (Large)' },
  { value: '1000+', label: '1000+ (Enterprise)' },
]

const VERIFICATION_BADGE: Record<string, { label: string; variant: 'green' | 'blue' | 'gray' }> = {
  verified: { label: '✓ Verified', variant: 'green' },
  pending: { label: '⏳ Pending', variant: 'gray' },
  unverified: { label: 'Unverified', variant: 'gray' },
  rejected: { label: 'Rejected', variant: 'gray' },
}

export default function BusinessesPage() {
  const [loading, setLoading] = useState(true)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [jobCounts, setJobCounts] = useState<Record<string, number>>({})
  const [totalCount, setTotalCount] = useState(0)

  const [search, setSearch] = useState('')
  const [industry, setIndustry] = useState('')
  const [companySize, setCompanySize] = useState('')

  const loadBusinesses = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('business_profiles')
        .select('*', { count: 'exact' })
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

      if (industry) query = query.ilike('industry', `%${industry}%`)
      if (companySize) query = query.eq('company_size', companySize)

      const { data, count } = await query.limit(60)
      let filtered = data || []

      if (search) {
        const q = search.toLowerCase()
        filtered = filtered.filter(
          (b: any) =>
            b.business_name?.toLowerCase().includes(q) ||
            b.industry?.toLowerCase().includes(q) ||
            b.description?.toLowerCase().includes(q) ||
            b.location?.toLowerCase().includes(q)
        )
      }

      setBusinesses(filtered)
      setTotalCount(count || 0)

      // Load active job counts per business
      if (filtered.length > 0) {
        const ids = filtered.map((b: any) => b.id)
        const { data: jobs } = await supabase
          .from('jobs')
          .select('business_id')
          .in('business_id', ids)
          .eq('status', 'active')

        const counts: Record<string, number> = {}
        jobs?.forEach((j: any) => {
          counts[j.business_id] = (counts[j.business_id] || 0) + 1
        })
        setJobCounts(counts)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, industry, companySize])

  useEffect(() => {
    const timer = setTimeout(loadBusinesses, 350)
    return () => clearTimeout(timer)
  }, [loadBusinesses])

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Partner Businesses & Employers</h1>
        <p className="text-sm text-gray-500 mt-1">
          {loading ? 'Loading...' : `${totalCount} verified companies hiring student talent`}
        </p>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by company name, industry, or location..."
            className="flex-1"
          />
          <div className="flex gap-2 flex-wrap">
            <Select options={INDUSTRY_OPTIONS} value={industry} onChange={e => setIndustry(e.target.value)} />
            <Select options={SIZE_OPTIONS} value={companySize} onChange={e => setCompanySize(e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Business Grid */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading businesses..." />
      ) : businesses.length === 0 ? (
        <EmptyState
          title="No businesses found"
          description="Try adjusting your search or filters."
          icon={<Building2 size={40} className="text-gray-300" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map(b => {
            const vBadge = VERIFICATION_BADGE[b.verification_status] || VERIFICATION_BADGE.unverified
            const activeJobs = jobCounts[b.id] || 0
            const lookingFor: string[] = b.looking_for || []

            return (
              <Card key={b.id} hover className="flex flex-col justify-between">
                <div>
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    {b.logo_url ? (
                      <img src={b.logo_url} alt={b.business_name} className="w-12 h-12 rounded-xl object-contain border border-gray-100 bg-white flex-shrink-0 p-1" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                        <Building2 size={22} className="text-gray-500" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-sm truncate">{b.business_name}</h3>
                        {b.is_featured && <Star size={13} className="text-amber-500 fill-amber-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{b.industry || 'Business'}</p>
                    </div>
                    <Badge variant={vBadge.variant} className="ml-auto flex-shrink-0 text-xs">
                      {vBadge.label}
                    </Badge>
                  </div>

                  {/* Description */}
                  {b.short_description || b.description ? (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                      {b.short_description || b.description}
                    </p>
                  ) : null}

                  {/* Looking for tags */}
                  {lookingFor.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 mb-1">Looking for:</p>
                      <div className="flex flex-wrap gap-1">
                        {lookingFor.slice(0, 4).map((tag: string, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs border border-blue-100">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                    {b.location && (
                      <span className="flex items-center gap-1"><MapPin size={11} /> {b.location}</span>
                    )}
                    {b.company_size && (
                      <span className="flex items-center gap-1"><Users size={11} /> {b.company_size} employees</span>
                    )}
                    {b.website_url && (
                      <a href={b.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary-600">
                        <Globe size={11} /> Website
                      </a>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 text-xs">
                  <div className="flex items-center gap-1.5">
                    {activeJobs > 0 ? (
                      <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <Briefcase size={11} /> {activeJobs} open job{activeJobs !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-gray-400">No open roles</span>
                    )}
                  </div>
                  <Link
                    to={`/businesses/${b.slug || b.id}`}
                    className="font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    View Profile <ArrowRight size={13} />
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
