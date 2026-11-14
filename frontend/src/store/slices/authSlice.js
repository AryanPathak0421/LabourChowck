import { createSlice } from '@reduxjs/toolkit'

export const AUTH_STORAGE_KEY = 'lc_access_token'
export const USER_STORAGE_KEY = 'lc_user'

function readStoredToken() {
  if (typeof localStorage === 'undefined') return null
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY)
  } catch {
    return null
  }
}

function readStoredUser() {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persistUser(user) {
  if (typeof localStorage === 'undefined') return
  try {
    if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_STORAGE_KEY)
  } catch {
    /* storage may be unavailable (private mode) — ignore */
  }
}

function persistToken(token) {
  if (typeof localStorage === 'undefined') return
  try {
    if (token) localStorage.setItem(AUTH_STORAGE_KEY, token)
    else localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

const storedToken = readStoredToken()
const storedUser = readStoredUser()

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: storedToken,
    // Hydrate the user too so a returning session is authenticated instantly,
    // without waiting on (or being logged out by) the /auth/me round-trip.
    user: storedUser,
    // Only block the UI with a loader when we have a token but no cached user.
    loading: Boolean(storedToken) && !storedUser,
  },
  reducers: {
    setCredentials(state, action) {
      const { accessToken, user } = action.payload
      persistToken(accessToken ?? null)
      persistUser(user ?? null)
      state.token = accessToken ?? null
      state.user = user ?? null
    },
    setUser(state, action) {
      state.user = action.payload ?? null
      persistUser(action.payload ?? null)
    },
    setLoading(state, action) {
      state.loading = action.payload
    },
    clearSession(state) {
      persistToken(null)
      persistUser(null)
      state.token = null
      state.user = null
      state.loading = false
    },
  },
})

export const { setCredentials, setUser, setLoading, clearSession } = authSlice.actions
export const authReducer = authSlice.reducer
