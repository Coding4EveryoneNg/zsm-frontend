import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery } from 'react-query'
import { schoolApplicationsService, subscriptionService } from '../../services/apiServices'
import toast from 'react-hot-toast'
import { useTheme } from '../../contexts/ThemeContext'
import { Rocket, GraduationCap, BookOpen, BarChart3, ArrowLeft, Check } from 'lucide-react'
import logo from '../../assets/logo2.jpg'

const SchoolOnboarding = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const { data: plansResponse } = useQuery(
    'subscription-plans',
    () => subscriptionService.getPlans(),
    { staleTime: 5 * 60 * 1000 }
  )
  const plans = plansResponse?.data ?? plansResponse?.Data ?? []

  // Safely get theme with fallback
  let theme, isDark
  try {
    const themeContext = useTheme()
    theme = themeContext.theme
    isDark = themeContext.isDark
  } catch (error) {
    console.warn('ThemeContext not available, using default theme', error)
    theme = 'light'
    isDark = false
  }

  useEffect(() => {
    document.body.classList.remove('authenticated')
    if (isDark) {
      document.body.style.backgroundColor = '#0b0e11'
      document.body.style.color = '#ffffff'
    } else {
      document.body.style.backgroundColor = '#ffffff'
      document.body.style.color = '#0b0e11'
    }
  }, [isDark])

  const onSubmit = async (data) => {
    if (plans.length > 0 && !selectedPlanId) {
      toast.error('Please select a subscription plan')
      return
    }
    setLoading(true)
    try {
      // Transform form data to match API request structure
      const requestData = {
        schoolName: data.schoolName,
        contactPersonName: data.contactPersonName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || null,
        schoolAddress: data.schoolAddress,
        city: data.city || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
        country: data.country || null,
        subdomain: data.subdomain || null,
        customDomain: data.customDomain || null,
        schoolDescription: data.schoolDescription || null,
        schoolType: data.schoolType || null,
        curriculum: data.curriculum || null,
        subscriptionPlanId: selectedPlanId || undefined
      }

      const response = await schoolApplicationsService.createApplication(requestData)
      
      // Handle API response structure: { success, data, message, errors }
      if (response && response.success) {
        const successMessage = response.message || 'School application created successfully! You can now submit it for review.'
        toast.success(successMessage)
        
        // Extract application ID from response data
        const applicationId = response.data?.applicationId || response.data?.ApplicationId
        
        // Navigate to home after showing success message
        setTimeout(() => {
          navigate('/')
        }, 2000)
      } else {
        // Handle error response
        const errorMessage = response?.message || 
                           (response?.errors && response.errors.length > 0 ? response.errors[0] : null) ||
                           'Failed to create application. Please try again.'
        toast.error(errorMessage)
      }
    } catch (error) {
      // Handle network/API errors
      let errorMessage = 'Failed to create application. Please try again.'
      
      if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0]
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      console.error('School onboarding error:', error)
    } finally {
      setLoading(false)
    }
  }

  const pageBg = isDark 
    ? 'linear-gradient(to bottom right, #0b0e11, #181a20, #1e2026)' 
    : 'linear-gradient(to bottom right, #ffffff, #f5f5f5, #fafafa)'
  const textColor = isDark ? '#ffffff' : '#0b0e11'
  const textSecondary = isDark ? '#b7bdc6' : '#474d57'
  const cardBg = isDark ? '#181a20' : '#ffffff'
  const borderColor = isDark ? '#2b3139' : '#e5e7eb'

  return (
    <div style={{ minHeight: '100vh', background: pageBg, transition: 'background 0.3s ease', color: textColor }}>
      {/* Navigation */}
      <nav style={{ 
        background: isDark ? 'rgba(24, 26, 32, 0.8)' : 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(12px)', 
        borderBottom: `1px solid ${borderColor}`, 
        position: 'sticky', 
        top: 0, 
        zIndex: 50 
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '4rem' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
              <img 
                src={logo} 
                alt="Zentrium Logo" 
                style={{ height: '36px', width: 'auto', objectFit: 'contain' }} 
              />
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f0b90b' }}>Zentrium</span>
            </Link>
            <Link
              to="/"
              style={{ 
                color: textSecondary, 
                padding: '0.5rem 1rem', 
                borderRadius: '0.5rem', 
                textDecoration: 'none', 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s' 
              }}
              onMouseEnter={(e) => { e.target.style.color = '#f0b90b'; e.target.style.backgroundColor = isDark ? '#1e2026' : '#f5f5f5' }}
              onMouseLeave={(e) => { e.target.style.color = textSecondary; e.target.style.backgroundColor = 'transparent' }}
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 4rem)' }}>
        {/* Left Side - Branding */}
        <div style={{ 
          flex: '0 0 50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'linear-gradient(135deg, #f0b90b 0%, #f5c842 100%)',
          padding: '3rem',
          color: '#0b0e11'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Welcome to Zentrium</h1>
            <p style={{ fontSize: '1.25rem', marginBottom: '3rem', opacity: 0.9 }}>
              Transform your school management with our comprehensive platform
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', textAlign: 'center' }}>
              <div>
                <div style={{ 
                  display: 'inline-flex', 
                  padding: '1rem', 
                  borderRadius: '1rem', 
                  background: 'rgba(11, 14, 17, 0.1)',
                  marginBottom: '1rem'
                }}>
                  <GraduationCap size={32} />
                </div>
                <h5 style={{ fontWeight: 600 }}>Student Management</h5>
              </div>
              <div>
                <div style={{ 
                  display: 'inline-flex', 
                  padding: '1rem', 
                  borderRadius: '1rem', 
                  background: 'rgba(11, 14, 17, 0.1)',
                  marginBottom: '1rem'
                }}>
                  <BookOpen size={32} />
                </div>
                <h5 style={{ fontWeight: 600 }}>Teacher Tools</h5>
              </div>
              <div>
                <div style={{ 
                  display: 'inline-flex', 
                  padding: '1rem', 
                  borderRadius: '1rem', 
                  background: 'rgba(11, 14, 17, 0.1)',
                  marginBottom: '1rem'
                }}>
                  <BarChart3 size={32} />
                </div>
                <h5 style={{ fontWeight: 600 }}>Analytics & Reports</h5>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Application Form */}
        <div style={{ 
          flex: '0 0 50%', 
          display: 'flex', 
          alignItems: 'center', 
          padding: '3rem',
          overflowY: 'auto'
        }}>
          <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: textColor }}>
                Start Your School's Journey
              </h2>
              <p style={{ color: textSecondary }}>
                Fill out the form below to begin the onboarding process
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ 
              background: cardBg, 
              padding: '2rem', 
              borderRadius: '1rem', 
              border: `1px solid ${borderColor}`,
              boxShadow: isDark ? '0 10px 25px rgba(0, 0, 0, 0.3)' : '0 10px 25px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: textColor }}>
                    School Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    {...register('schoolName', { required: 'School name is required' })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${errors.schoolName ? '#ef4444' : borderColor}`,
                      background: isDark ? '#1e2026' : '#ffffff',
                      color: textColor,
                      fontSize: '1rem'
                    }}
                    placeholder="Enter school name"
                  />
                  {errors.schoolName && (
                    <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                      {errors.schoolName.message}
                    </span>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: textColor }}>
                    Contact Person Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    {...register('contactPersonName', { required: 'Contact person name is required' })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${errors.contactPersonName ? '#ef4444' : borderColor}`,
                      background: isDark ? '#1e2026' : '#ffffff',
                      color: textColor,
                      fontSize: '1rem'
                    }}
                    placeholder="Enter contact person name"
                  />
                  {errors.contactPersonName && (
                    <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                      {errors.contactPersonName.message}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: textColor }}>
                    Contact Email <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    {...register('contactEmail', { 
                      required: 'Contact email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${errors.contactEmail ? '#ef4444' : borderColor}`,
                      background: isDark ? '#1e2026' : '#ffffff',
                      color: textColor,
                      fontSize: '1rem'
                    }}
                    placeholder="contact@school.com"
                  />
                  {errors.contactEmail && (
                    <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                      {errors.contactEmail.message}
                    </span>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: textColor }}>
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    {...register('contactPhone')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${borderColor}`,
                      background: isDark ? '#1e2026' : '#ffffff',
                      color: textColor,
                      fontSize: '1rem'
                    }}
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: textColor }}>
                  School Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  {...register('schoolAddress', { required: 'School address is required' })}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${errors.schoolAddress ? '#ef4444' : borderColor}`,
                    background: isDark ? '#1e2026' : '#ffffff',
                    color: textColor,
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                  placeholder="Enter school address"
                />
                {errors.schoolAddress && (
                  <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                    {errors.schoolAddress.message}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: textColor }}>
                    City
                  </label>
                  <input
                    {...register('city')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${borderColor}`,
                      background: isDark ? '#1e2026' : '#ffffff',
                      color: textColor,
                      fontSize: '1rem'
                    }}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: textColor }}>
                    State
                  </label>
                  <input
                    {...register('state')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${borderColor}`,
                      background: isDark ? '#1e2026' : '#ffffff',
                      color: textColor,
                      fontSize: '1rem'
                    }}
                    placeholder="State"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: textColor }}>
                    Postal Code
                  </label>
                  <input
                    {...register('postalCode')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${borderColor}`,
                      background: isDark ? '#1e2026' : '#ffffff',
                      color: textColor,
                      fontSize: '1rem'
                    }}
                    placeholder="Postal Code"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: textColor }}>
                  Country
                </label>
                <input
                  {...register('country')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${borderColor}`,
                    background: isDark ? '#1e2026' : '#ffffff',
                    color: textColor,
                    fontSize: '1rem'
                  }}
                  placeholder="Country"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: textColor }}>
                    Preferred Subdomain
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      {...register('subdomain')}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: '0.5rem 0 0 0.5rem',
                        border: `1px solid ${borderColor}`,
                        borderRight: 'none',
                        background: isDark ? '#1e2026' : '#ffffff',
                        color: textColor,
                        fontSize: '1rem'
                      }}
                      placeholder="yourschool"
                    />
                    <span style={{
                      padding: '0.75rem',
                      borderRadius: '0 0.5rem 0.5rem 0',
                      border: `1px solid ${borderColor}`,
                      borderLeft: 'none',
                      background: isDark ? '#1e2026' : '#f5f5f5',
                      color: textSecondary,
                      fontSize: '0.875rem'
                    }}>
                      .zentrium.com
                    </span>
                  </div>
                  <small style={{ color: textSecondary, fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    Leave empty for auto-generation
                  </small>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: textColor }}>
                    Custom Domain (Optional)
                  </label>
                  <input
                    {...register('customDomain')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${borderColor}`,
                      background: isDark ? '#1e2026' : '#ffffff',
                      color: textColor,
                      fontSize: '1rem'
                    }}
                    placeholder="yourschool.com"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: textColor }}>
                  School Description
                </label>
                <textarea
                  {...register('schoolDescription')}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${borderColor}`,
                    background: isDark ? '#1e2026' : '#ffffff',
                    color: textColor,
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                  placeholder="Tell us about your school..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: textColor }}>
                    School Type
                  </label>
                  <select
                    {...register('schoolType')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${borderColor}`,
                      background: isDark ? '#1e2026' : '#ffffff',
                      color: textColor,
                      fontSize: '1rem'
                    }}
                  >
                    <option value="">Select Type</option>
                    <option value="Primary">Primary School</option>
                    <option value="Secondary">Secondary School</option>
                    <option value="Combined">Combined School</option>
                    <option value="International">International School</option>
                    <option value="Private">Private School</option>
                    <option value="Public">Public School</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: textColor }}>
                    Curriculum
                  </label>
                  <select
                    {...register('curriculum')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${borderColor}`,
                      background: isDark ? '#1e2026' : '#ffffff',
                      color: textColor,
                      fontSize: '1rem'
                    }}
                  >
                    <option value="">Select Curriculum</option>
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="State Board">State Board</option>
                    <option value="IB">International Baccalaureate</option>
                    <option value="Cambridge">Cambridge</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {plans.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 500, color: textColor }}>
                    Subscription Plan <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <p style={{ color: textSecondary, fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                    Choose a plan for your school. You can change or upgrade later.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
                    {plans.map((plan) => {
                      const id = plan.id ?? plan.Id
                      const name = plan.name ?? plan.Name ?? plan.code ?? plan.Code
                      const selected = selectedPlanId === id
                      const pricePerUser = plan.pricePerUser ?? plan.PricePerUser
                      const maxUsers = plan.maxUsers ?? plan.MaxUsers
                      const minPerTerm = plan.minimumAmountPerTerm ?? plan.MinimumAmountPerTerm
                      const fixedPerTerm = plan.fixedAmountPerTerm ?? plan.FixedAmountPerTerm
                      const isUnlimited = plan.isUnlimitedUsers ?? plan.IsUnlimitedUsers
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setSelectedPlanId(id)}
                          style={{
                            padding: '1rem',
                            borderRadius: '0.75rem',
                            border: `2px solid ${selected ? '#f0b90b' : borderColor}`,
                            background: selected ? (isDark ? 'rgba(240, 185, 11, 0.15)' : 'rgba(240, 185, 11, 0.1)') : (isDark ? '#1e2026' : '#f9fafb'),
                            color: textColor,
                            textAlign: 'left',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.2s'
                          }}
                        >
                          {selected && (
                            <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: '#f0b90b' }}>
                              <Check size={18} />
                            </span>
                          )}
                          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{name}</div>
                          {fixedPerTerm != null && (
                            <div style={{ fontSize: '0.8rem', color: textSecondary }}>
                              {isUnlimited ? `${Number(fixedPerTerm).toLocaleString()} / term` : `${Number(fixedPerTerm).toLocaleString()} / term`}
                            </div>
                          )}
                          {pricePerUser != null && !isUnlimited && (
                            <div style={{ fontSize: '0.8rem', color: textSecondary }}>
                              {Number(pricePerUser).toLocaleString()} / user
                              {maxUsers != null && ` · max ${maxUsers} users`}
                            </div>
                          )}
                          {minPerTerm != null && pricePerUser != null && (
                            <div style={{ fontSize: '0.75rem', color: textSecondary }}>Min {Number(minPerTerm).toLocaleString()} / term</div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {errors.subscriptionPlan && (
                    <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                      {errors.subscriptionPlan.message}
                    </span>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  background: loading ? '#6b7280' : '#f0b90b',
                  color: '#0b0e11',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  marginTop: '1.5rem'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.background = '#f5c842'
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 10px 15px -3px rgba(240, 185, 11, 0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.background = '#f0b90b'
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'none'
                  }
                }}
              >
                {loading ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Rocket size={20} />
                    Start Application
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <small style={{ color: textSecondary, fontSize: '0.75rem' }}>
                  By submitting this form, you agree to our Terms of Service and Privacy Policy.
                </small>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SchoolOnboarding

