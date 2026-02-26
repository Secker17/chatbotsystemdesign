import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const EMAIL_TO_DELETE = 'vintrastudio@gmail.com'

async function deleteUser() {
  console.log(`Looking for user with email: ${EMAIL_TO_DELETE}`)
  
  // Find the user by email
  const { data: users, error: listError } = await supabase.auth.admin.listUsers()
  
  if (listError) {
    console.error('Error listing users:', listError)
    process.exit(1)
  }

  const user = users.users.find(u => u.email === EMAIL_TO_DELETE)
  
  if (!user) {
    console.log(`User ${EMAIL_TO_DELETE} not found in Supabase Auth`)
    return
  }

  console.log(`Found user: ${user.id} (${user.email})`)
  
  // Delete the user from Supabase Auth
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
  
  if (deleteError) {
    console.error('Error deleting user:', deleteError)
    process.exit(1)
  }

  console.log(`Successfully deleted user ${EMAIL_TO_DELETE} from Supabase Auth`)
}

deleteUser()
