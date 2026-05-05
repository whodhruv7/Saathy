const USERS_KEY = 'saathy_users'
const SESSION_KEY = 'saathy_session'

export interface MockUser {
  name: string
  email: string
  password: string
  createdAt: number
}

export interface Session {
  user: MockUser
  loginAt: number
}

export function getUsers(): MockUser[] {
  const raw = localStorage.getItem(USERS_KEY)
  return raw ? JSON.parse(raw) : []
}

export function saveUser(user: MockUser) {
  const users = getUsers()
  users.push(user)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function signUp(name: string, email: string, password: string): 
{ success: boolean, error?: string } {
  const users = getUsers()
  if (users.find(u => u.email === email)) {
    return { success: false, error: 'Email already registered.' }
  }
  const user: MockUser = { name, email, password, createdAt: Date.now() }
  saveUser(user)
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, loginAt: Date.now() }))
  return { success: true }
}

export function signIn(email: string, password: string): 
{ success: boolean, error?: string, user?: MockUser } {
  const users = getUsers()
  const user = users.find(u => u.email === email && u.password === password)
  if (!user) return { success: false, error: 'Invalid email or password.' }
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, loginAt: Date.now() }))
  return { success: true, user }
}

export function getSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY)
  return raw ? JSON.parse(raw) : null
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY)
}
