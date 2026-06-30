import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import API from '../../api/axios'
import useAuthStore from '../../store/authStore'
import './LoginPage.css'
import './RegisterPage.css'
import { nigerianStates, nigerianCities } from '../../utils/nigerianLocations'

const YEAR_OPTIONS = ['100L', '200L', '300L', '400L', '500L', '600L']
const CYCLE_YEARS = Array.from({ length: 11 }, (_, i) => `${2025 + i}/${2026 + i}`)

const roles = [
  {
    key: 'student',
    label: 'Student',
    desc: 'I am an IT student filling my SIWES logbook',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>),
  },
  {
    key: 'supervisor',
    label: 'School Supervisor',
    desc: 'I am an academic staff supervising IT students',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
  },
  {
    key: 'school',
    label: 'School / IT Unit',
    desc: 'I want to register my university on SIWESlog',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>),
  },
]

const passwordRules = Yup.string()
  .min(8, 'Minimum 8 characters')
  .matches(/[A-Z]/, 'Must include an uppercase letter')
  .matches(/[a-z]/, 'Must include a lowercase letter')
  .matches(/[0-9]/, 'Must include a number')
  .matches(/[@$!%*?&#^]/, 'Must include a special character')
  .required('Password is required')

const studentSchema = Yup.object({
  registrationCode: Yup.string().required('Registration code is required'),
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  phone: Yup.string().required('Phone number is required'),
  matricNumber: Yup.string().required('Matric number is required'),
  department: Yup.string().required('Department is required'),
  faculty: Yup.string().required('Faculty is required'),
  yearOfStudy: Yup.string().required('Year of study is required'),
  siwesCycleYear: Yup.string().required('SIWES cycle year is required'),
  siwesDurationWeeks: Yup.number()
    .typeError('Enter a number')
    .integer('Enter a whole number')
    .min(1, 'Must be at least 1 week')
    .max(52, 'That seems too long — check the number of weeks')
    .required('SIWES duration is required'),
  password: passwordRules,
  confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords do not match').required('Please confirm your password'),
})

const supervisorSchema = Yup.object({
  registrationCode: Yup.string().required('Registration code is required'),
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  phone: Yup.string().required('Phone number is required'),
  password: passwordRules,
  confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords do not match').required('Please confirm your password'),
})

const schoolSchema = Yup.object({
  schoolName: Yup.string().required('School name is required'),
  schoolSlug: Yup.string()
    .lowercase()
    .matches(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens')
    .required('School short code is required'),
  schoolEmail: Yup.string().email('Enter a valid email').required('School email is required'),
  schoolState: Yup.string().required('State is required'),
  schoolCity: Yup.string().required('City is required'),
  adminFirstName: Yup.string().required('First name is required'),
  adminLastName: Yup.string().required('Last name is required'),
  adminEmail: Yup.string().email('Enter a valid email').required('Admin email is required'),
  adminPhone: Yup.string().required('Phone number is required'),
  adminPassword: passwordRules,
  adminConfirmPassword: Yup.string()
    .oneOf([Yup.ref('adminPassword')], 'Passwords do not match')
    .required('Please confirm your password'),
})

const Field = ({ label, name, type = 'text', placeholder, formik, hint, extra }) => {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const hasError = formik.touched[name] && formik.errors[name]
  const icons = {
    email: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>),
    password: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>),
    default: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="14" y2="18"/></svg>),
  }
  return (
    <div className="field-group">
      <div className="field-label"><span>{label}</span>{extra}</div>
      <div className="field-input-wrap">
        <div className="field-icon">{icons[type] || icons.default}</div>
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          name={name}
          placeholder={placeholder}
          className={`field-input ${hasError ? 'error' : ''}`}
          value={formik.values[name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        {isPassword && (
          <button type="button" className="field-toggle" onClick={() => setShow(s => !s)}>
            {show ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        )}
      </div>
      {hint && <div className="field-hint">{hint}</div>}
      {hasError && <div className="field-error">{formik.errors[name]}</div>}
    </div>
  )
}

const SelectField = ({ label, name, options, placeholder, formik, hint }) => {
  const hasError = formik.touched[name] && formik.errors[name]
  return (
    <div className="field-group">
      <div className="field-label"><span>{label}</span></div>
      <div className="field-input-wrap">
        <div className="field-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <select
          name={name}
          className={`field-input field-select ${hasError ? 'error' : ''} ${!formik.values[name] ? 'placeholder' : ''}`}
          value={formik.values[name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        >
          <option value="">{placeholder}</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
      {hint && <div className="field-hint">{hint}</div>}
      {hasError && <div className="field-error">{formik.errors[name]}</div>}
    </div>
  )
}

const ErrorAlert = ({ message }) => (
  <div className="auth-alert">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    {message}
  </div>
)

const SubmitBtn = ({ loading, label }) => (
  <button type="submit" className="auth-submit" disabled={loading}>
    {loading ? <div className="spinner" /> : (<>{label}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>)}
  </button>
)

const StudentForm = ({ onSuccess }) => {
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const formik = useFormik({
    initialValues: { registrationCode: '', firstName: '', lastName: '', email: '', phone: '', matricNumber: '', department: '', faculty: '', yearOfStudy: '', siwesCycleYear: '', siwesDurationWeeks: '', password: '', confirmPassword: '' },
    validationSchema: studentSchema,
    onSubmit: async (values) => {
      setLoading(true)
      setServerError('')
      try {
        const { confirmPassword, ...payload } = values
        const res = await API.post('/auth/register-student', payload)
        setAuth(res.data.user, res.data.accessToken)
        onSuccess('/student/placement')
      } catch (err) {
        setServerError(err.response?.data?.message || 'Registration failed. Please try again.')
      } finally { setLoading(false) }
    },
  })
  return (
    <form onSubmit={formik.handleSubmit} noValidate>
      {serverError && <ErrorAlert message={serverError} />}
      <Field label="School Registration Code" name="registrationCode" placeholder="e.g. RUN-2025-IT" formik={formik} hint="Get this code from your IT unit" />
      <div className="reg-two-col">
        <Field label="First Name" name="firstName" placeholder="e.g. John" formik={formik} />
        <Field label="Last Name" name="lastName" placeholder="e.g. Doe" formik={formik} />
      </div>
      <Field label="Email Address" name="email" type="email" placeholder="you@example.com" formik={formik} />
      <Field label="Phone Number" name="phone" placeholder="08012345678" formik={formik} />
      <Field label="Matric Number" name="matricNumber" placeholder="e.g. RUN/CPE/22/00000" formik={formik} />
      <div className="reg-two-col">
        <Field label="Department" name="department" placeholder="e.g. Computer Engineering" formik={formik} />
        <Field label="Faculty" name="faculty" placeholder="e.g. Engineering" formik={formik} />
      </div>
      <div className="reg-two-col">
        <SelectField label="Year of Study" name="yearOfStudy" options={YEAR_OPTIONS} placeholder="Select level..." formik={formik} />
        <SelectField label="SIWES Cycle Year" name="siwesCycleYear" options={CYCLE_YEARS} placeholder="Select year..." formik={formik} hint="The academic year you are doing SIWES" />
      </div>
      <Field label="SIWES Duration (in weeks)" name="siwesDurationWeeks" type="number" placeholder="e.g. 24" formik={formik} hint="Check with your IT unit — common durations are 12 or 24 weeks" />
      <Field label="Password" name="password" type="password" placeholder="Create a strong password" formik={formik} hint="Min 8 chars · uppercase · lowercase · number · special character" />
      <Field label="Confirm Password" name="confirmPassword" type="password" placeholder="Repeat your password" formik={formik} />
      <SubmitBtn loading={loading} label="Create Account" />
    </form>
  )
}

const SupervisorForm = ({ onSuccess }) => {
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const formik = useFormik({
    initialValues: { registrationCode: '', firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' },
    validationSchema: supervisorSchema,
    onSubmit: async (values) => {
      setLoading(true)
      setServerError('')
      try {
        const { confirmPassword, ...payload } = values
        await API.post('/auth/register-supervisor', payload)
        onSuccess(null, 'Your account has been submitted for IT admin approval. You will be notified once approved.')
      } catch (err) {
        setServerError(err.response?.data?.message || 'Registration failed. Please try again.')
      } finally { setLoading(false) }
    },
  })
  return (
    <form onSubmit={formik.handleSubmit} noValidate>
      {serverError && <ErrorAlert message={serverError} />}
      <Field label="School Registration Code" name="registrationCode" placeholder="e.g. RUN-2025-IT" formik={formik} hint="Get this code from your IT unit" />
      <div className="reg-two-col">
        <Field label="First Name" name="firstName" placeholder="e.g. Dr. Okonkwo" formik={formik} />
        <Field label="Last Name" name="lastName" placeholder="e.g. Chukwuemeka" formik={formik} />
      </div>
      <Field label="Email Address" name="email" type="email" placeholder="you@university.edu.ng" formik={formik} />
      <Field label="Phone Number" name="phone" placeholder="08012345678" formik={formik} />
      <Field label="Password" name="password" type="password" placeholder="Create a strong password" formik={formik} hint="Min 8 chars · uppercase · lowercase · number · special character" />
      <Field label="Confirm Password" name="confirmPassword" type="password" placeholder="Repeat your password" formik={formik} />
      <SubmitBtn loading={loading} label="Submit Registration" />
    </form>
  )
}

const SchoolForm = ({ onSuccess }) => {
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const formik = useFormik({
    initialValues: {
      schoolName: '', schoolSlug: '', schoolEmail: '',
      schoolState: '', schoolCity: '',
      adminFirstName: '', adminLastName: '', adminEmail: '',
      adminPhone: '', adminPassword: '', adminConfirmPassword: '',
    },
    validationSchema: schoolSchema,
    onSubmit: async (values) => {
      setLoading(true)
      setServerError('')
      try {
        const { adminConfirmPassword, schoolState, schoolCity, ...rest } = values
        const payload = {
          ...rest,
          schoolAddress: `${schoolCity}, ${schoolState}`
        }
        await API.post('/auth/register-school', payload)
        onSuccess(null, 'School registration submitted successfully. Our team will review and approve your school shortly.')
      } catch (err) {
        setServerError(err.response?.data?.message || 'Registration failed. Please try again.')
      } finally {
        setLoading(false)
      }
    },
  })

  const availableCities = formik.values.schoolState
    ? nigerianCities[formik.values.schoolState] || []
    : []

  return (
    <form onSubmit={formik.handleSubmit} noValidate>
      {serverError && <ErrorAlert message={serverError} />}
      <div className="reg-section-label">School Information</div>
      <Field label="University / Institution Name" name="schoolName" placeholder="e.g. Redeemer's University" formik={formik} />
      <Field label="School Short Code" name="schoolSlug" placeholder="e.g. run" formik={formik} hint="Lowercase only, no spaces. Used in your school's URL." />
      <Field label="Official Email" name="schoolEmail" type="email" placeholder="it@university.edu.ng" formik={formik} />
      <div className="reg-two-col">
        <SelectField
          label="State"
          name="schoolState"
          options={nigerianStates}
          placeholder="Select state..."
          formik={formik}
        />
        <div className="field-group">
          <div className="field-label"><span>City / Town</span></div>
          <div className="field-input-wrap">
            <div className="field-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <select
              name="schoolCity"
              className={`field-input field-select ${formik.touched.schoolCity && formik.errors.schoolCity ? 'error' : ''} ${!formik.values.schoolCity ? 'placeholder' : ''}`}
              value={formik.values.schoolCity}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={!formik.values.schoolState}
            >
              <option value="">{formik.values.schoolState ? 'Select city...' : 'Select state first'}</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          {formik.touched.schoolCity && formik.errors.schoolCity && (
            <div className="field-error">{formik.errors.schoolCity}</div>
          )}
        </div>
      </div>
      <div className="reg-section-label" style={{ marginTop: '8px' }}>IT Admin Account</div>
      <div className="reg-two-col">
        <Field label="First Name" name="adminFirstName" placeholder="e.g. John" formik={formik} />
        <Field label="Last Name" name="adminLastName" placeholder="e.g. Okafor" formik={formik} />
      </div>
      <div className="reg-two-col">
        <Field label="Admin Email" name="adminEmail" type="email" placeholder="admin@university.edu.ng" formik={formik} />
        <Field label="Phone Number" name="adminPhone" placeholder="08012345678" formik={formik} />
      </div>
      <Field label="Password" name="adminPassword" type="password" placeholder="Create a strong password" formik={formik} hint="Min 8 chars · uppercase · lowercase · number · special character" />
      <Field label="Confirm Password" name="adminConfirmPassword" type="password" placeholder="Repeat your password" formik={formik} />
      <SubmitBtn loading={loading} label="Register School" />
    </form>
  )
}

const SuccessScreen = ({ message, navigate }) => (
  <div className="reg-success">
    <div className="reg-success-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
    <h2 className="reg-success-title">All done!</h2>
    <p className="reg-success-msg">{message}</p>
    <button className="auth-submit" style={{ maxWidth: '240px', margin: '0 auto' }} onClick={() => navigate('/login')}>Go to Sign In</button>
  </div>
)

const RegisterPage = () => {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  const handleSuccess = (redirectTo, message) => {
    if (redirectTo) navigate(redirectTo)
    else setSuccessMessage(message)
  }

  const leftContent = {
    student: { heading: <>Start your SIWES<br /><em>journey.</em></>, sub: 'Register with your school code to access your digital logbook and start logging your industrial training.' },
    supervisor: { heading: <>Monitor your<br /><em>students.</em></>, sub: 'Create your supervisor account to track student progress, comment on logs and sign off on logbooks.' },
    school: { heading: <>Take your school<br /><em>paperless.</em></>, sub: 'Register your institution on SIWESlog and give your IT unit a powerful platform to manage SIWES.' },
  }
  const current = selectedRole ? leftContent[selectedRole] : { heading: <>Create your<br /><em>account.</em></>, sub: 'Choose your role below to get started on SIWESlog.' }
  const titleMap = { student: 'Student Registration', supervisor: 'Supervisor Registration', school: 'Register Your School' }
  const subtitleMap = { student: "Fill in your details to access your school's SIWES platform", supervisor: 'Your account will be reviewed by your IT admin before activation', school: 'Your school will be reviewed and approved by the SIWESlog team' }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-logo" onClick={() => navigate('/')}>
          <div className="auth-logo-dot" />
          SIWES<span>log</span>
        </div>
        <div className="auth-left-body">
          <div className="auth-left-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          </div>
          <h2 className="auth-left-heading">{current.heading}</h2>
          <p className="auth-left-sub">{current.sub}</p>
          <div className="auth-stat-cards">
            {[{ value: '100%', label: 'Paperless' }, { value: '24/7', label: 'Access' }, { value: 'Free', label: 'To Join' }].map((s, i) => (
              <div key={i} className="auth-stat-card">
                <div className="auth-stat-value">{s.value}</div>
                <div className="auth-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="auth-quote"><p>"Digitizing industrial training, one university at a time."</p></div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-right-top">
          <p className="auth-switch">Already have an account?{' '}<a onClick={() => navigate('/login')}>Sign in</a></p>
          <button className="auth-back-link" onClick={() => selectedRole ? setSelectedRole(null) : navigate('/')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            {selectedRole ? 'Change role' : 'Back to home'}
          </button>
        </div>
        <div className="auth-form-body" style={{ maxWidth: selectedRole === 'student' || selectedRole === 'school' ? '560px' : '420px' }}>
          {successMessage ? (
            <SuccessScreen message={successMessage} navigate={navigate} />
          ) : !selectedRole ? (
            <>
              <h1 className="auth-form-title">Create Account</h1>
              <p className="auth-form-subtitle">Who are you registering as?</p>
              <div className="role-selector">
                {roles.map((r) => (
                  <button key={r.key} className="role-option" onClick={() => setSelectedRole(r.key)}>
                    <div className="role-option-icon">{r.icon}</div>
                    <div className="role-option-body">
                      <div className="role-option-label">{r.label}</div>
                      <div className="role-option-desc">{r.desc}</div>
                    </div>
                    <svg className="role-option-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <h1 className="auth-form-title">{titleMap[selectedRole]}</h1>
              <p className="auth-form-subtitle">{subtitleMap[selectedRole]}</p>
              {selectedRole === 'student' && <StudentForm onSuccess={handleSuccess} />}
              {selectedRole === 'supervisor' && <SupervisorForm onSuccess={handleSuccess} />}
              {selectedRole === 'school' && <SchoolForm onSuccess={handleSuccess} />}
            </>
          )}
        </div>
        <div className="auth-right-footer">© {new Date().getFullYear()} SIWESlog. All rights reserved.</div>
      </div>
    </div>
  )
}

export default RegisterPage
