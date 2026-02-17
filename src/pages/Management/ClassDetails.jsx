import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import Loading from '../../components/Common/Loading'
import { ArrowLeft, School, Users, Save } from 'lucide-react'
import { classesService, commonService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const ClassDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [classTeacherId, setClassTeacherId] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const canEdit = ['admin', 'principal'].includes((user?.role ?? user?.Role ?? '').toString().toLowerCase())

  const { data, isLoading } = useQuery(['class', id], () => classesService.getClass(id))

  if (isLoading) return <Loading />

  const classResponse = data?.data
  const cls =
    classResponse?.class ||
    classResponse?.data ||
    classResponse ||
    null

  const schoolId = cls?.schoolId ?? cls?.SchoolId
  useEffect(() => {
    if (cls && !isEditing) setClassTeacherId(cls.classTeacherId ?? cls.ClassTeacherId ?? '')
  }, [cls, isEditing])
  const { data: teachersData } = useQuery(
    ['teachers-dropdown', schoolId],
    () => commonService.getTeachersDropdown({ schoolId }),
    { enabled: canEdit && !!schoolId }
  )
  const teachers = teachersData?.data ?? teachersData?.Data ?? []

  const updateMutation = useMutation(
    (payload) => classesService.updateClass(id, payload),
    {
      onSuccess: () => {
        toast.success('Class updated.')
        queryClient.invalidateQueries(['class', id])
        setIsEditing(false)
      },
      onError: (err) => toast.error(err?.response?.data?.message || err?.message || 'Failed to update')
    }
  )

  const handleSaveClassTeacher = () => {
    updateMutation.mutate({
      name: cls.name ?? cls.Name,
      section: cls.section ?? cls.Section ?? null,
      capacity: cls.capacity ?? cls.Capacity ?? null,
      classTeacherId: classTeacherId || null
    })
  }

  if (!cls) {
    return (
      <div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
          style={{ marginBottom: '1.5rem' }}
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="card">
          <h2 className="card-title">Class Details</h2>
          <p>Class not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        className="btn btn-secondary"
        onClick={() => navigate(-1)}
        style={{ marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Class Details</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div>
            <label className="form-label">Class Name</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>
              <School size={16} style={{ marginRight: '0.5rem' }} />
              {cls.name || cls.Name}
            </p>
          </div>
          <div>
            <label className="form-label">Section</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>
              {cls.section || cls.Section || 'N/A'}
            </p>
          </div>
          <div>
            <label className="form-label">Capacity</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>
              {cls.capacity || cls.Capacity || 'N/A'}
            </p>
          </div>
          <div>
            <label className="form-label">Current Students</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Users size={14} />
              <span>{cls.currentStudentCount ?? cls.CurrentStudentCount ?? cls.studentCount ?? cls.StudentCount ?? 0}</span>
            </p>
          </div>
          <div>
            <label className="form-label">Status</label>
            <p>
              <span className={`badge ${(cls.isActive !== false) ? 'badge-success' : 'badge-danger'}`}>
                {(cls.isActive !== false) ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
          {canEdit && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Class Teacher (takes attendance)</label>
              {isEditing ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    className="form-select"
                    style={{ minWidth: '200px' }}
                    value={classTeacherId}
                    onChange={(e) => setClassTeacherId(e.target.value)}
                  >
                    <option value="">No class teacher (remove)</option>
                    {teachers.map((t) => (
                      <option key={t.id ?? t.Id} value={t.id ?? t.Id}>
                        {t.name ?? t.Name ?? `${t.firstName ?? t.FirstName ?? ''} ${t.lastName ?? t.LastName ?? ''}`.trim()}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveClassTeacher} disabled={updateMutation.isLoading}>
                    <Save size={14} /> Save
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setIsEditing(false); setClassTeacherId(cls.classTeacherId ?? cls.ClassTeacherId ?? '') }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <p style={{ color: 'var(--text-primary)', margin: 0 }}>
                    {(() => {
                      const tid = cls.classTeacherId ?? cls.ClassTeacherId
                      if (!tid) return 'Not set'
                      const t = teachers.find((x) => (x.id ?? x.Id) === tid)
                      return t ? (t.name ?? t.Name ?? `${t.firstName ?? t.FirstName ?? ''} ${t.lastName ?? t.LastName ?? ''}`.trim()) : 'Unknown'
                    })()}
                  </p>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsEditing(true)}>
                    Edit
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClassDetails

