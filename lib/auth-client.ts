import { createClient } from "@/lib/supabase/client"

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  is_admin: boolean
}

export interface SignUpData {
  name: string
  email: string
  password: string
  phone?: string
}

export interface SignInData {
  email: string
  password: string
}

// Client-side authentication functions
export async function signUp(data: SignUpData) {
  const supabase = createClient()

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
      data: {
        name: data.name,
        phone: data.phone || null,
      },
    },
  })

  return { data: authData, error }
}

export async function signIn(data: SignInData) {
  const supabase = createClient()

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  return { data: authData, error }
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient()

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    return null
  }

  // Get user profile from our users table
  const { data: profile, error: profileError } = await supabase.from("users").select("*").eq("id", authUser.id).single()

  if (profileError || !profile) {
    return null
  }

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    is_admin: profile.is_admin,
  }
}

// Admin authentication with hardcoded password
export async function authenticateAdmin(password: string): Promise<boolean> {
  return password === "enrique112233"
}
