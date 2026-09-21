import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { authError } from '../services/auth'

const AuthContext = createContext<{ session: Session | null; loading: boolean; error: string }>({
  session: null,
  loading: true,
  error: '',
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({
    session: null as Session | null,
    loading: !!supabase,
    error: '',
  })
  useEffect(() => {
    if (!supabase) return
    let active = true
    let receivedEvent = false
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      receivedEvent = true
      if (active) setState({ session, loading: false, error: '' })
    })
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active && !receivedEvent)
          setState({ session: data.session, loading: false, error: error ? authError(error) : '' })
      })
      .catch((error) => {
        if (active) setState({ session: null, loading: false, error: authError(error) })
      })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
