const USER_KEY = 'pb-auth-user'
const SESSION_KEY = 'pb-auth-session'
const REMEMBER_KEY = 'pb-remembered-user'

const safeParse = (value) => {
  try {
    return value ? JSON.parse(value) : null
  } catch (error) {
    console.warn('Failed to parse stored value', error)
    return null
  }
}

export const getStoredUser = () => {
  if (typeof localStorage === 'undefined') return null
  return safeParse(localStorage.getItem(USER_KEY))
}

export const saveUser = (user) => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const saveSession = (session) => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ ...session, signedAt: new Date().toISOString() }),
  )
}

export const getSession = () => {
  if (typeof localStorage === 'undefined') return null
  return safeParse(localStorage.getItem(SESSION_KEY))
}

export const clearSession = () => {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
}

export const clearUser = () => {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(USER_KEY)
}

export const isAuthenticated = () => Boolean(getSession())

export const rememberUser = (credentials) => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(
    REMEMBER_KEY,
    JSON.stringify({ ...credentials, rememberAt: new Date().toISOString() }),
  )
}

export const getRememberedUser = () => {
  if (typeof localStorage === 'undefined') return null
  return safeParse(localStorage.getItem(REMEMBER_KEY))
}

export const clearRememberedUser = () => {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(REMEMBER_KEY)
}

export const disableAutoLogin = () => {
  if (typeof localStorage === 'undefined') return
  const remembered = getRememberedUser()
  if (remembered) {
    rememberUser({ ...remembered, autoLogin: false })
  }
}

export const clearAuthState = () => {
  if (typeof localStorage === 'undefined') return
  clearSession()
  disableAutoLogin()
}
