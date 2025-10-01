import { createClient } from "@/lib/supabase/server"

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  is_admin: boolean
}

// Server-side authentication functions
export async function getServerUser(): Promise<User | null> {
  const supabase = await createClient()

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
