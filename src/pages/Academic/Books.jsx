import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { booksService, commonService, dashboardService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Common/Loading'
import { BookOpen, User, Calendar, Plus, BookMarked, X } from 'lucide-react'
import toast from 'react-hot-toast'

const Books = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const [assignModal, setAssignModal] = useState({ open: false, book: null })
  const [assignClassId, setAssignClassId] = useState('')
  const pageSize = 20

  const isAdmin = user?.role === 'Admin'

  const { data: schoolsData } = useQuery(
    'schools-dropdown',
    () => commonService.getSchoolsDropdown(),
    { enabled: isAdmin }
  )
  const { data: schoolSwitchingData } = useQuery(
    ['dashboard', 'school-switching'],
    () => dashboardService.getSchoolSwitchingData(),
    { enabled: isAdmin || user?.role === 'Principal' }
  )
  const principalOrAdminSchoolId = schoolSwitchingData?.data?.currentSchoolId ?? schoolSwitchingData?.data?.CurrentSchoolId ?? schoolSwitchingData?.currentSchoolId ?? schoolSwitchingData?.CurrentSchoolId
  const schoolsList = schoolsData?.data ?? schoolsData?.Data ?? []
  const defaultSchoolId = schoolsList?.[0]?.id ?? schoolsList?.[0]?.Id ?? ''

  useEffect(() => {
    if (isAdmin && schoolsList?.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(principalOrAdminSchoolId || defaultSchoolId || '')
    }
  }, [isAdmin, schoolsList, principalOrAdminSchoolId, defaultSchoolId, selectedSchoolId])

  const effectiveSchoolId = isAdmin ? (selectedSchoolId || principalOrAdminSchoolId || defaultSchoolId) : (user?.role === 'Principal' ? principalOrAdminSchoolId : null)

  // Get studentId from URL params for parent view
  const urlParams = new URLSearchParams(window.location.search)
  const studentId = urlParams.get('studentId')

  const { data, isLoading, error } = useQuery(
    ['books', page, searchTerm, user?.role, studentId, effectiveSchoolId],
    () => {
      const params = { page, pageSize, search: searchTerm }
      if (user?.role === 'Student') {
        return booksService.getStudentBooks(params)
      }
      if (user?.role === 'Parent') {
        if (studentId) params.studentId = studentId
        return booksService.getParentBooks(params)
      }
      if (isAdmin && effectiveSchoolId) params.schoolId = effectiveSchoolId
      return booksService.getBooks(params)
    },
    { keepPreviousData: true, enabled: !isAdmin || !!effectiveSchoolId }
  )

  const { data: classesData } = useQuery(
    ['classes-dropdown', effectiveSchoolId],
    () => commonService.getClassesDropdown({ schoolId: effectiveSchoolId }),
    { enabled: (user?.role === 'Admin' || user?.role === 'Principal') && assignModal.open && !!effectiveSchoolId }
  )

  const bookIdForClasses = assignModal.book?.id || assignModal.book?.Id
  const { data: bookClassesData } = useQuery(
    ['book-classes', bookIdForClasses],
    () => booksService.getBookClasses(bookIdForClasses),
    { enabled: (user?.role === 'Admin' || user?.role === 'Principal') && !!bookIdForClasses }
  )

  const assignBookMutation = useMutation(
    (payload) => booksService.assignBookToClass(payload),
    {
      onSuccess: () => {
        toast.success('Book assigned to class. Students have been notified.')
        setAssignClassId('')
        queryClient.invalidateQueries('books')
        queryClient.invalidateQueries(['book-classes', bookIdForClasses])
      },
      onError: (err) => {
        toast.error(err?.response?.data?.errors?.[0] || err?.message || 'Failed to assign book to class')
      }
    }
  )

  const removeBookMutation = useMutation(
    ({ bookId, classId }) => booksService.removeBookFromClass(bookId, classId),
    {
      onSuccess: () => {
        toast.success('Book removed from class.')
        queryClient.invalidateQueries('books')
        queryClient.invalidateQueries(['book-classes', bookIdForClasses])
      },
      onError: (err) => {
        toast.error(err?.response?.data?.errors?.[0] || err?.message || 'Failed to remove book from class')
      }
    }
  )

  const classes = Array.isArray(classesData?.data) ? classesData.data : (classesData?.data?.data || [])
  const handleAssignSubmit = () => {
    if (!assignModal.book?.id && !assignModal.book?.Id) return
    if (!assignClassId) {
      toast.error('Please select a class')
      return
    }
    assignBookMutation.mutate({
      bookId: assignModal.book.id || assignModal.book.Id,
      classId: assignClassId,
      isRequired: true
    })
  }

  if (isLoading) return <Loading />

  if (error) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Error loading books</p>
            <p className="empty-state-subtext">{error?.message || 'Please try again later'}</p>
          </div>
        </div>
      </div>
    )
  }

  // Handle both paginated and non-paginated responses
  // API returns: { success: true, data: BooksListResponse }
  // BooksListResponse has: { Books: [], TotalCount, CurrentPage, PageSize, TotalPages }
  const paginatedData = data?.data || data
  const books = paginatedData?.books || paginatedData?.Books || []
  const totalCount = paginatedData?.totalCount || paginatedData?.TotalCount || books.length
  const totalPages = paginatedData?.totalPages || paginatedData?.TotalPages || Math.ceil(totalCount / pageSize)

  const filteredBooks = searchTerm
    ? books.filter(book => {
        const title = (book.title || book.Title || '').toLowerCase()
        const author = (book.author || book.Author || '').toLowerCase()
        const isbn = (book.isbn || book.ISBN || '').toLowerCase()
        const search = searchTerm.toLowerCase()
        return title.includes(search) || author.includes(search) || isbn.includes(search)
      })
    : books

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Books
          </h1>
          {user?.role === 'Parent' && studentId && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Viewing books for selected child
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isAdmin && schoolsList?.length > 0 && (
            <div style={{ minWidth: '200px' }}>
              <label className="form-label" style={{ marginBottom: '0.25rem', display: 'block', fontSize: '0.875rem' }}>School</label>
              <select
                className="form-input"
                value={selectedSchoolId || effectiveSchoolId || ''}
                onChange={(e) => { setSelectedSchoolId(e.target.value); setPage(1) }}
              >
                <option value="">Select school</option>
                {schoolsList.map((s) => (
                  <option key={s.id || s.Id} value={s.id || s.Id}>{s.name || s.Name}</option>
                ))}
              </select>
            </div>
          )}
          {(user?.role === 'Admin' || user?.role === 'Principal') && (
            <button className="btn btn-primary" onClick={() => navigate('/books/create')}>
              <Plus size={18} />
              Add Book
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ maxWidth: '500px', marginBottom: '1.5rem' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search books by title, author, or ISBN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      {filteredBooks.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredBooks.map((book, idx) => (
            <div
              key={book.id || book.Id || idx}
              className="card"
              style={{
                borderTop: `4px solid var(--primary)`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ 
                  width: '80px', 
                  height: '100px', 
                  backgroundColor: 'var(--border-color)', 
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <BookOpen size={40} color="var(--text-muted)" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {book.title || book.Title || 'Untitled Book'}
                  </h3>
                  
                  {(book.author || book.Author) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <User size={14} />
                      <span>{book.author || book.Author}</span>
                    </div>
                  )}

                  {(book.isbn || book.ISBN) && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      ISBN: {book.isbn || book.ISBN}
                    </div>
                  )}

                  {(book.publicationYear || book.PublicationYear) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      <Calendar size={14} />
                      <span>{book.publicationYear || book.PublicationYear}</span>
                    </div>
                  )}

                  {(user?.role === 'Admin' || user?.role === 'Principal') && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => setAssignModal({ open: true, book })}
                      >
                        <BookMarked size={14} style={{ marginRight: '0.25rem' }} />
                        Assign to class
                      </button>
                    </div>
                  )}

                  {book.availableCopies !== undefined && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                      <span style={{ 
                        color: book.availableCopies > 0 ? 'var(--success)' : 'var(--danger)',
                        fontWeight: 'bold'
                      }}>
                        {book.availableCopies > 0 
                          ? `${book.availableCopies} available` 
                          : 'Not available'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <BookOpen size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <p className="empty-state-text">No books found</p>
            <p className="empty-state-subtext">
              {searchTerm 
                ? 'No books match your search criteria' 
                : 'No books available at this time'}
            </p>
          </div>
        </div>
      )}

      {/* Assign book to class modal */}
      {assignModal.open && assignModal.book && (
        <div
          className="card"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            minWidth: '320px',
            maxWidth: '90vw',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Assign book to class</h3>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => { setAssignModal({ open: false, book: null }); setAssignClassId('') }}
            >
              ×
            </button>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            A book can be assigned to multiple classes or to none. Assigning notifies all students in that class.
          </p>
          {(() => {
            const res = bookClassesData?.data || bookClassesData
            const list = res?.data?.classes ?? res?.classes ?? []
            const assignedClasses = Array.isArray(list) ? list : []
            return assignedClasses.length > 0 ? (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Already assigned to</label>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {assignedClasses.map((ac) => (
                    <li key={ac.classId || ac.ClassId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span>{ac.className || ac.ClassName}</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem' }}
                        onClick={() => removeBookMutation.mutate({
                          bookId: assignModal.book?.id || assignModal.book?.Id,
                          classId: ac.classId || ac.ClassId
                        })}
                        disabled={removeBookMutation.isLoading}
                      >
                        <X size={12} /> Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Not assigned to any class yet.</p>
            )
          })()}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Add to class</label>
            <select
              className="form-control"
              value={assignClassId}
              onChange={(e) => setAssignClassId(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Select a class (optional)</option>
              {classes.map((c) => (
                <option key={c.id || c.Id} value={c.id || c.Id}>
                  {c.name || c.Name || c.label || c.Label || `Class ${c.id || c.Id}`}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => { setAssignModal({ open: false, book: null }); setAssignClassId('') }}
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAssignSubmit}
              disabled={!assignClassId || assignBookMutation.isLoading}
            >
              {assignBookMutation.isLoading ? 'Assigning…' : 'Assign to class'}
            </button>
          </div>
        </div>
      )}
      {assignModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 999
          }}
          onClick={() => { setAssignModal({ open: false, book: null }); setAssignClassId('') }}
          aria-hidden="true"
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          <button
            className="btn btn-outline"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem' }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-outline"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default Books
