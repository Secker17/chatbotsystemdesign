import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Test if icon_style column already exists by selecting it
const { error: testError } = await supabase
  .from('chatbot_configs')
  .select('icon_style')
  .limit(1)

if (testError && testError.message.includes('icon_style')) {
  console.log('icon_style column does not exist yet - needs manual migration')
} else {
  console.log('icon_style column already exists or accessible')
}

// Test if admin_is_typing column exists
const { error: testError2 } = await supabase
  .from('chat_sessions')
  .select('admin_is_typing')
  .limit(1)

if (testError2 && testError2.message.includes('admin_is_typing')) {
  console.log('admin_is_typing column does not exist yet - needs manual migration')
} else {
  console.log('admin_is_typing column already exists or accessible')
}

console.log('Done checking columns')
