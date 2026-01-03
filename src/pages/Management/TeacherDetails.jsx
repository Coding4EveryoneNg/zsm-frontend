import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import api from '../../services/api'
import Loading from '../../components/Common/Loading'
import { ArrowLeft } from 'lucide-react'

const TeacherDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useQuery(['teacher', id], () => api.get(`/teachers/${id}`))

  if (isLoading) return <Loading />

  const teacher = data?.data?.teacher

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={18} />
        Back
      </button>
      <div className="card">
        <h2 className="card-title">Teacher Details</h2>
        <p>{teacher?.firstName} {teacher?.lastName}</p>
      </div>
    </div>
  )
}

export default TeacherDetails

