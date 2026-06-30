import { useEffect, useState, useCallback } from 'react'
import API from '../../../api/axios'
import { useDialog } from '../../../components/dialogContext'
import usePageTitle from '../../../hooks/usePageTitle'

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const AdminStudents = () => {
  usePageTitle('Students')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [selected, setSelected] = useState(null) // for assign supervisor modal

  const [supervisors, setSupervisors] = useState([])
  const [assignLoading, setAssignLoading] = useState(false)
  const [selectedSupervisor, setSelectedSupervisor] = useState('')
  const { showAlert } = useDialog()

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await API.get('/users?role=student')
      let data = res.data.users
      if (search) {
        const q = search.toLowerCase()
        data = data.filter(u =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        )
      }
      setStudents(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const loadStudents = async () => {
      await fetchStudents()
    }
    loadStudents()
  }, [fetchStudents])

  const fetchSupervisors = async () => {
    try {
      const res = await API.get('/users?role=school_supervisor')
      setSupervisors(res.data.users.filter(s => s.approvalStatus === 'approved'))
    } catch (err) { console.error(err) }
  }

  const handleToggleStatus = async (userId) => {
    setActionLoading(userId)
    try {
      const res = await API.patch(`/users/${userId}/toggle-status`)
      setStudents(prev => prev.map(u =>
        u._id === userId ? { ...u, isActive: res.data.isActive } : u
      ))
    } catch (err) {
      await showAlert(err.response?.data?.message || 'Action failed', {
        title: 'Unable to update student',
        variant: 'danger'
      })
    } finally {
      setActionLoading(null) }
  }

  const openAssign = async (student) => {
    setSelected(student)
    setSelectedSupervisor('')
    await fetchSupervisors()
  }

  const handleAssign = async () => {
    if (!selectedSupervisor) return
    setAssignLoading(true)
    try {
      await API.patch(`/users/${selected._id}/assign-supervisor`, { supervisorId: selectedSupervisor })
      await showAlert('Supervisor assigned successfully', {
        title: 'Assignment Complete',
        variant: 'primary'
      })
      setSelected(null)
      fetchStudents()
    } catch (err) {
      await showAlert(err.response?.data?.message || 'Assignment failed', {
        title: 'Assignment Failed',
        variant: 'danger'
      })
    } finally {
      setAssignLoading(false)
    }
  }

  const avatarInitials = (student) =>
    `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase() || '?'

  const userAvatar = (student, small = false) => (
    student.profilePhoto ? (
      <img
        src={student.profilePhoto}
        alt={`${student.firstName || 'Student'} ${student.lastName || ''}`.trim()}
        className={`dt-user-avatar ${small ? 'sm' : ''}`}
      />
    ) : (
      <div className={`dt-user-avatar ${small ? 'sm' : ''}`}>{avatarInitials(student)}</div>
    )
  )

  return (
    <div>
      <div className="dash-page-header">
        <div className="dash-page-title">Students</div>
        <div className="dash-page-sub">All registered students in your school</div>
      </div>

      <div className="dash-table-wrap">
        <div className="dash-table-header">
          <div className="dash-table-title">All Students</div>
          <div className="dash-table-actions">
            <form onSubmit={e => { e.preventDefault(); setSearch(searchInput.trim()) }} className="dash-search-form">
              <div className="dash-search-wrap">
                <span className="dash-search-icon"><SearchIcon /></span>
                <input
                  className="dash-search-input"
                  placeholder="Search by name or email..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                />
                {search && (
                  <button type="button" className="dash-search-clear" onClick={() => { setSearchInput(''); setSearch('') }}>×</button>
                )}
              </div>
              <button type="submit" className="dash-action-btn view">Search</button>
            </form>
          </div>
        </div>

        {loading ? (
          <div className="dash-loading"><div className="dash-spinner" /></div>
        ) : students.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            </div>
            <p>{search ? `No students found matching "${search}"` : 'No students registered yet'}</p>
          </div>
        ) : (
          <>
            <div className="dt-scroll">
              <table className="dt-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Matric No.</th>
                    <th>Department</th>
                    <th>Supervisor</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student._id}>
                      <td>
                        <div className="dt-user-cell">
                          {userAvatar(student)}
                          <div>
                            <div className="dt-cell-primary">{student.firstName} {student.lastName}</div>
                            <div className="dt-cell-sub">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="td-muted">{student.matricNumber || '—'}</span></td>
                      <td><span className="td-muted">{student.department || '—'}</span></td>
                      <td><span className="td-muted">{student.schoolSupervisor ? `${student.schoolSupervisor.firstName} ${student.schoolSupervisor.lastName}` : 'Unassigned'}</span></td>
                      <td>
                        <span className={`badge ${student.isActive ? 'badge-approved' : 'badge-suspended'}`}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="dt-actions">
                          <button className="dash-action-btn view" onClick={() => openAssign(student)}>
                            Assign Supervisor
                          </button>
                          <button
                            className={`dash-action-btn ${student.isActive ? 'suspend' : 'approve'}`}
                            onClick={() => handleToggleStatus(student._id)}
                            disabled={actionLoading === student._id}
                          >
                            {actionLoading === student._id ? '...' : student.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="dt-cards">
              {students.map(student => (
                <div key={student._id} className="dt-card">
                  <div className="dt-card-top">
                    <div className="dt-card-user-row">
                      {userAvatar(student, true)}
                      <div>
                        <div className="dt-card-name">{student.firstName} {student.lastName}</div>
                        <div className="dt-card-sub">{student.email}</div>
                      </div>
                    </div>
                    <span className={`badge ${student.isActive ? 'badge-approved' : 'badge-suspended'}`}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="dt-card-meta">
                    <span>{student.matricNumber || 'No matric no.'}</span>
                    <span>{student.department || 'No department'}</span>
                  </div>
                  <div className="dt-card-sub">
                    Supervisor: {student.schoolSupervisor ? `${student.schoolSupervisor.firstName} ${student.schoolSupervisor.lastName}` : 'Unassigned'}
                  </div>
                  <div className="dt-card-actions">
                    <button className="dash-action-btn view" onClick={() => openAssign(student)}>
                      Assign Supervisor
                    </button>
                    <button
                      className={`dash-action-btn ${student.isActive ? 'suspend' : 'approve'}`}
                      onClick={() => handleToggleStatus(student._id)}
                      disabled={actionLoading === student._id}
                    >
                      {actionLoading === student._id ? '...' : student.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Assign Supervisor Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '440px' }}>
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
              Assign School Supervisor
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748B', marginBottom: '20px' }}>
              Assigning a supervisor to <strong>{selected.firstName} {selected.lastName}</strong>
            </p>
            {supervisors.length === 0 ? (
              <p style={{ fontSize: '13.5px', color: '#DC2626' }}>No approved supervisors available. Approve supervisors first.</p>
            ) : (
              <select
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', outline: 'none', marginBottom: '20px' }}
                value={selectedSupervisor}
                onChange={e => setSelectedSupervisor(e.target.value)}
              >
                <option value="">Select a supervisor...</option>
                {supervisors.map(s => (
                  <option key={s._id} value={s._id}>{s.firstName} {s.lastName} — {s.email}</option>
                ))}
              </select>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="dash-action-btn view" onClick={() => setSelected(null)}>Cancel</button>
              <button
                className="dash-action-btn approve"
                onClick={handleAssign}
                disabled={!selectedSupervisor || assignLoading}
              >
                {assignLoading ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminStudents
