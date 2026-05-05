import { supabase } from '@/integrations/supabase/client'
import type { Session as SupabaseSession } from '@supabase/supabase-js'

export { supabase }

const db = supabase as any
const REMOTE_CHATS_ENABLED = import.meta.env.VITE_ENABLE_REMOTE_CHATS === 'true'

export interface User {
  id: string
  name: string
  email: string
  created_at: string
}

export interface Session {
  user: User
  loginAt: number
}

const SESSION_KEY = 'saathy_session'

function chatsKey(userEmail: string) {
  return `saathy_chats_${userEmail.trim().toLowerCase()}`
}

function loadLocalChats(userEmail: string) {
  try {
    return JSON.parse(localStorage.getItem(chatsKey(userEmail)) || '[]')
  } catch {
    return []
  }
}

function saveLocalChat(userEmail: string, universeName: string, universeData: any) {
  const existing = loadLocalChats(userEmail).filter((chat: any) => chat.universe_name !== universeName)
  existing.push({
    user_email: userEmail,
    universe_name: universeName,
    universe_data: universeData,
    updated_at: new Date().toISOString(),
  })
  localStorage.setItem(chatsKey(userEmail), JSON.stringify(existing))
}

function makeUser(authUser: any, fallbackName?: string): User {
  return {
    id: authUser.id,
    name: authUser.user_metadata?.name || fallbackName || authUser.email?.split('@')[0] || 'Delegate',
    email: authUser.email || '',
    created_at: authUser.created_at || new Date().toISOString(),
  }
}

function saveSession(user: User) {
  const session: Session = { user, loginAt: Date.now() }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function persistSupabaseSession(authSession: SupabaseSession | null): Session | null {
  if (!authSession?.user) {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
  return saveSession(makeUser(authSession.user))
}

export async function getSupabaseSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return persistSupabaseSession(data.session) || getSession()
}

// Sign up new user
export async function signUp(name: string, email: string, password: string) {
  try {
    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanName) return { success: false, error: 'Please enter your name.' }
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { name: cleanName },
      },
    })

    if (error) {
      const message = error.message.toLowerCase().includes('already')
        ? 'Email already registered. Please sign in instead.'
        : error.message
      return { success: false, error: message }
    }

    if (!data.user) return { success: false, error: 'Sign up did not return a user.' }

    const user = makeUser(data.user, cleanName)
    saveSession(user)
    return { success: true, user }
  } catch (err: any) {
    return { success: false, error: err.message || 'Sign up failed.' }
  }
}

// Sign in user
export async function signIn(email: string, password: string) {
  try {
    const cleanEmail = email.trim().toLowerCase()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    if (error || !data.user) {
      return { success: false, error: error?.message || 'Invalid email or password.' }
    }

    const user = makeUser(data.user)
    saveSession(user)
    return { success: true, user }
  } catch (err: any) {
    return { success: false, error: err.message || 'Sign in failed.' }
  }
}

export async function signInWithGoogle() {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Google sign in failed.' }
  }
}

// Get current session
export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

// Sign out
export function signOut() {
  localStorage.removeItem(SESSION_KEY)
  supabase.auth.signOut()
}

// Save chat to Supabase
export async function saveChat(
  userEmail: string,
  universeName: string,
  universeData: any
) {
  saveLocalChat(userEmail, universeName, universeData)
  if (!REMOTE_CHATS_ENABLED) return { success: true }

  try {
    // Simple insert - ignore if exists (update separately)
    const { error } = await db
      .from('chats')
      .insert({
        user_email: userEmail,
        universe_name: universeName,
        universe_data: universeData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    // If insert failed due to unique constraint, try update
    if (error && error.code === '23505') {
      const { error: updateError } = await db
        .from('chats')
        .update({
          universe_data: universeData,
          updated_at: new Date().toISOString()
        })
        .eq('user_email', userEmail)
        .eq('universe_name', universeName)
      
      if (updateError) return { success: false, error: updateError.message }
    } else if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (err: any) {
    return { success: true, error: err.message }
  }
}

// Load chats from Supabase
export async function loadChats(userEmail: string) {
  const localChats = loadLocalChats(userEmail)
  if (!REMOTE_CHATS_ENABLED) return { success: true, data: localChats }

  try {
    const { data, error } = await db
      .from('chats')
      .select('*')
      .eq('user_email', userEmail)

    if (error) return { success: true, data: localChats, error: error.message }
    return { success: true, data: data?.length ? data : localChats }
  } catch (err: any) {
    return { success: true, data: localChats, error: err.message }
  }
}
