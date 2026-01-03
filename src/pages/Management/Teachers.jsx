import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import Loading from '../../components/Common/Loading'
import { Plus, Search, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const Teachers = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  const { data, isLoading } = useQuery(
    ['teachers', page, pageSize],
    () => api.get(`/teachers?page=${page}&pageSize=${pageSize}`)
  )

  if (isLoading) return <Loading />

  const teachers = data?.data?.teachers || []
  const pagination = data?.data?.pagination || {}

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Teachers</h1>
        <button className="btn btn-primary" onClick={() => navigate('/teachers/create')}>
          <Plus size={18} />
          Add Teacher
        </button>
      </div>

      <div className="card">
        <div className="table">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td>{teacher.employeeId}</td>
                  <td>{teacher.firstName} {teacher.lastName}</td>
                  <td>{teacher.email}</td>
                  <td>{teacher.department || 'N/A'}</td>
                  <td>
                    <span className={`badge ${teacher.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {teacher.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      onClick={() => navigate(`/teachers/${teacher.id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Teachers

