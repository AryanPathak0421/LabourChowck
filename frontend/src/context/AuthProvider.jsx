import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMe } from '../api/authApi.js'
import { clearSession, setLoading, setUser } from '../store/slices/authSlice.js'

export function AuthProvider({ children }) {
  const dispatch = useDispatch()
  const token = useSelector((s) => s.auth.token)
  const hasCachedUser = useSelector((s) => Boolean(s.auth.user))

  useEffect(() => {
    let cancelled = false

    if (!token) {
      queueMicrotask(() => {
        if (!cancelled) {
          dispatch(setUser(null))
          dispatch(setLoading(false))
        }
      })
      return () => {
        cancelled = true
      }
    }

    // Only show the blocking loader when there is no cached user to render yet.
    // With a cached user we stay signed in optimistically and validate in the
    // background, so a returning tab never flashes the login screen.
    if (!hasCachedUser) {
      queueMicrotask(() => {
        if (!cancelled) dispatch(setLoading(true))
      })
    }

    fetchMe()
      .then((res) => {
        if (!cancelled) dispatch(setUser(res.data?.user ?? null))
      })
      .catch((err) => {
        if (cancelled) return
        // Only sign out when the token is actually rejected. Network / transient
        // errors must NOT drop a valid session (that caused logout-on-reopen).
        const status = err?.status
        if (status === 401 || status === 403) {
          dispatch(clearSession())
        }
      })
      .finally(() => {
        if (!cancelled) dispatch(setLoading(false))
      })

    return () => {
      cancelled = true
    }
  }, [token, hasCachedUser, dispatch])

  return children
}
