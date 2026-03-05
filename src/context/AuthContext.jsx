import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (identifier, password) => {
    let email = identifier
    if (!identifier.includes('@')) {
      const { data, error } = await supabase.rpc('get_email_by_username', { p_username: identifier })
      if (error || !data) return { error: error || new Error('Username not found') }
      email = data
    }
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ session, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
