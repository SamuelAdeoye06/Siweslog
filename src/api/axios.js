import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true
})

// Attach access token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If access token expires, refresh it automatically
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // Rate limited (429) — never retry automatically. Retrying would just
    // send another request into the same limiter window and make the
    // lockout worse, or even loop indefinitely if combined with other
    // retry logic. Just surface the error as-is so the UI can show the
    // server's friendly "please wait" message and stop there.
    if (error.response?.status === 429) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !original._retry) {
      // FormData bodies (file uploads) can't be safely re-sent after being
      // consumed once by the browser/XHR layer. Retrying with the same
      // FormData instance can silently send an empty body, which made
      // photo uploads "fail" on the first click and only work on the second
      // (where a brand new FormData was created). For these requests we
      // refresh the token first, then surface the error so the calling code
      // can re-trigger the upload with a fresh FormData instead of an
      // automatic blind retry.
      const isFormData = typeof FormData !== 'undefined' && original.data instanceof FormData

      original._retry = true
      try {
        const res = await axios.post(
          'http://localhost:5000/api/auth/refresh',
          {},
          { withCredentials: true }
        )
        const newToken = res.data.accessToken
        localStorage.setItem('accessToken', newToken)

        if (isFormData) {
          // Token is now fresh for the NEXT attempt, but don't retry this
          // exact request — reject so the UI can prompt a clean re-submit.
          return Promise.reject(error)
        }

        original.headers.Authorization = `Bearer ${newToken}`
        return API(original)
      } catch (err) {
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default API
