import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { dashboardService } from '../services/apiServices'
import { useAuth } from './AuthContext'
import { getUserRole } from '../utils/safeUtils'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../utils/errorHandler'

const SCHOOL_SELECTION_KEY = 'zsm_selected_school_id'

const SchoolContext = createContext(null)

const ROLES_WITH_SCHOOL_SWITCHING = ['admin', 'principal', 'teacher', 'superadmin']

export const useSchool = () => {
  const context = useContext(SchoolContext)
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider')
  }
  return context
}

/** Hook for switching school (Admin/SuperAdmin). Invalidates cache on success. */
export const useSwitchSchool = () => {
  const queryClient = useQueryClient()

  return useMutation(
    (schoolId) => dashboardService.switchSchool(schoolId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['dashboard', 'school-switching'])
        toast.success('School switched successfully')
      },
      onError: (err) => toast.error(getErrorMessage(err) || 'Failed to switch school'),
    }
  )
}

export const SchoolProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const roleLower = getUserRole(user).toLowerCase()
  const canUseSchoolSwitching = ROLES_WITH_SCHOOL_SWITCHING.includes(roleLower)

  const [selectedSchoolId, setSelectedSchoolIdState] = useState(() => {
    try {
      return sessionStorage.getItem(SCHOOL_SELECTION_KEY) || ''
    } catch {
      return ''
    }
  })

  const setSelectedSchoolId = useCallback((id) => {
    const value = id ?? ''
    setSelectedSchoolIdState(value)
    try {
      if (value) sessionStorage.setItem(SCHOOL_SELECTION_KEY, value)
      else sessionStorage.removeItem(SCHOOL_SELECTION_KEY)
    } catch (_) {}
  }, [])

  const { data: schoolSwitchingData } = useQuery(
    ['dashboard', 'school-switching'],
    () => dashboardService.getSchoolSwitchingData(),
    {
      enabled: isAuthenticated && canUseSchoolSwitching,
      refetchOnError: false,
      retry: 1,
    }
  )

  const currentSchoolIdFromApi = schoolSwitchingData?.data?.currentSchoolId
    ?? schoolSwitchingData?.data?.CurrentSchoolId
    ?? schoolSwitchingData?.currentSchoolId
    ?? schoolSwitchingData?.CurrentSchoolId

  const availableSchools = schoolSwitchingData?.data?.availableSchools
    ?? schoolSwitchingData?.data?.AvailableSchools
    ?? schoolSwitchingData?.availableSchools
    ?? []
  const canSwitchSchools = schoolSwitchingData?.data?.canSwitchSchools ?? schoolSwitchingData?.data?.CanSwitchSchools ?? false
  const defaultSchoolId = availableSchools?.[0]?.id ?? availableSchools?.[0]?.Id ?? ''
  const userSchoolId = user?.schoolId ?? user?.SchoolId ?? ''

  const effectiveSchoolId = useMemo(() => {
    if (!canUseSchoolSwitching) return userSchoolId || null
    if (roleLower === 'admin' || roleLower === 'superadmin') {
      return selectedSchoolId || currentSchoolIdFromApi || defaultSchoolId || userSchoolId || ''
    }
    return currentSchoolIdFromApi || userSchoolId || ''
  }, [canUseSchoolSwitching, roleLower, selectedSchoolId, currentSchoolIdFromApi, defaultSchoolId, userSchoolId])

  useEffect(() => {
    if (canUseSchoolSwitching && !selectedSchoolId && (currentSchoolIdFromApi || defaultSchoolId)) {
      setSelectedSchoolId(currentSchoolIdFromApi || defaultSchoolId)
    }
  }, [canUseSchoolSwitching, selectedSchoolId, currentSchoolIdFromApi, defaultSchoolId, setSelectedSchoolId])

  const value = useMemo(() => ({
    schoolSwitchingData,
    currentSchoolId: currentSchoolIdFromApi,
    selectedSchoolId,
    setSelectedSchoolId,
    effectiveSchoolId,
    availableSchools,
    defaultSchoolId,
    canUseSchoolSwitching,
    canSwitchSchools,
  }), [
    schoolSwitchingData,
    currentSchoolIdFromApi,
    selectedSchoolId,
    setSelectedSchoolId,
    effectiveSchoolId,
    availableSchools,
    defaultSchoolId,
    canUseSchoolSwitching,
    canSwitchSchools,
  ])

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>
}
