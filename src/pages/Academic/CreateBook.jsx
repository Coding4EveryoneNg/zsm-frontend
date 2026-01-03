import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { booksService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const CreateBook = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const schoolId = user?.schoolId || user?.SchoolId

  const onSubmit = async (data) => {
    if (!schoolId) {
      toast.error('School ID is required. Please ensure you are associated with a school.')
      return
    }

    setLoading(true)
    try {
      const requestData = {
        title: data.title,
        author: data.author || null,
        isbn: data.isbn || null,
        publicationYear: data.publicationYear ? parseInt(data.publicationYear) : null,
        description: data.description || null,
        totalCopies: data.totalCopies ? parseInt(data.totalCopies) : 1,
      }

      const response = await booksService.createBook(requestData)

      if (response && response.success !== false) {
        toast.success('Book created successfully!')
        navigate('/books')
      } else {
        const errorMessage = response?.message || 
                           (response?.errors && response.errors.length > 0 ? response.errors[0] : null) ||
                           'Failed to create book'
        toast.error(errorMessage)
      }
    } catch (error) {
      let errorMessage = 'Failed to create book. Please try again.'
      
      if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0]
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      console.error('Create book error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!schoolId) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/books')}
            style={{ padding: '0.5rem' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Add New Book
          </h1>
        </div>
        <div className="card">
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Unable to load book creation form. Please ensure you are associated with a school.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/books')}
            >
              Back to Books
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/books')}
          style={{ padding: '0.5rem' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Add New Book
        </h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">
                Book Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                {...register('title', { required: 'Book title is required' })}
                className="form-input"
                placeholder="Enter book title"
              />
              {errors.title && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.title.message}
                </span>
              )}
            </div>

            <div>
              <label className="form-label">Author</label>
              <input
                {...register('author')}
                className="form-input"
                placeholder="Enter author name"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">ISBN</label>
              <input
                {...register('isbn')}
                className="form-input"
                placeholder="Enter ISBN number"
              />
            </div>

            <div>
              <label className="form-label">Publication Year</label>
              <input
                type="number"
                {...register('publicationYear', {
                  min: { value: 1000, message: 'Invalid year' },
                  max: { value: new Date().getFullYear() + 1, message: 'Year cannot be in the future' }
                })}
                className="form-input"
                placeholder="e.g., 2020"
                min="1000"
                max={new Date().getFullYear() + 1}
              />
              {errors.publicationYear && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.publicationYear.message}
                </span>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Total Copies</label>
            <input
              type="number"
              {...register('totalCopies', { 
                min: { value: 1, message: 'Total copies must be at least 1' }
              })}
              className="form-input"
              placeholder="Number of copies"
              min="1"
              defaultValue="1"
            />
            {errors.totalCopies && (
              <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.totalCopies.message}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Description</label>
            <textarea
              {...register('description')}
              className="form-input"
              rows={4}
              placeholder="Enter book description (optional)"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/books')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                'Creating...'
              ) : (
                <>
                  <Save size={18} style={{ marginRight: '0.5rem' }} />
                  Add Book
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateBook

