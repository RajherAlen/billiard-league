import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
	const missingVars = []

	if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL')
	if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY')

	throw new Error(
		`Missing Supabase environment variables: ${missingVars.join(', ')}. ` +
			'Create a .env file in the project root (see .env.example) and restart the Vite dev server.'
	)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
