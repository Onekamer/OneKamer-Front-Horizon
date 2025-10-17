import { createClient } from '@supabase/supabase-js'

// 🔒 Paramètres sécurisés (production OneKamer)
const supabaseUrl = 'https://neswuuicqesslduqwzck.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lc3d1dWljcWVzc2xkdXF3emNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDk5NDAsImV4cCI6MjA3NTMyNTk0MH0.NNXBeZlryJcPpszrPk6K24GO1Wh70PgsGhZTC6iBurQ'

// ✅ Client Supabase avec gestion persistante de session et auto-refresh
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// ✅ Fonction utilitaire pour forcer la connexion avant l’accès
export async function requireAuth(navigate) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    navigate('/auth')
    throw new Error('Utilisateur non authentifié')
  }

  return session.user
}
