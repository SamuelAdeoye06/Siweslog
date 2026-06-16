import { create } from 'zustand'

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  accessToken: localStorage.getItem('accessToken') || null,

  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('accessToken', token)
    set({ user, accessToken: token })
  },

  // Patch specific fields into the stored user (e.g. profilePhoto after upload)
  updateUser: (updates) => {
    const current = get().user || {}
    const merged = { ...current, ...updates }
    localStorage.setItem('user', JSON.stringify(merged))
    set({ user: merged })
  },

  clearAuth: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')
    set({ user: null, accessToken: null })
  }
}))

export default useAuthStore