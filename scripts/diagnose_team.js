import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('SUPABASE_URL set:', !!supabaseUrl);
console.log('SERVICE_ROLE_KEY set:', !!serviceKey);
console.log('ANON_KEY set:', !!anonKey);
console.log('RESEND_API_KEY set:', !!process.env.RESEND_API_KEY);
if (process.env.RESEND_API_KEY) {
  console.log('RESEND_API_KEY prefix:', process.env.RESEND_API_KEY.slice(0, 6) + '...');
}

const key = serviceKey || anonKey;
if (!supabaseUrl || !key) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, key);

async function run() {
  // Test team_invitations table
  console.log('\n--- team_invitations ---');
  const { data: inv, error: invErr } = await supabase.from('team_invitations').select('id').limit(1);
  if (invErr) {
    console.error('ERROR:', invErr.message, '| code:', invErr.code, '| details:', invErr.details, '| hint:', invErr.hint);
  } else {
    console.log('OK - accessible, rows returned:', inv.length);
  }

  // Test team_members table
  console.log('\n--- team_members ---');
  const { data: mem, error: memErr } = await supabase.from('team_members').select('id').limit(1);
  if (memErr) {
    console.error('ERROR:', memErr.message, '| code:', memErr.code, '| details:', memErr.details, '| hint:', memErr.hint);
  } else {
    console.log('OK - accessible, rows returned:', mem.length);
  }

  // Check exact columns in team_invitations
  console.log('\n--- Check schema via select * ---');
  const { data: allCols, error: colErr } = await supabase.from('team_invitations').select('*').limit(0);
  if (colErr) {
    console.error('Schema check error:', colErr.message);
  } else {
    console.log('team_invitations columns query OK (empty result gives column info)');
  }

  // Test insert matching what the API route does
  console.log('\n--- Test insert (matching API route) ---');
  const testToken = 'diag-test-' + Date.now();
  const { data: insertData, error: insertErr } = await supabase.from('team_invitations').insert({
    admin_id: '00000000-0000-0000-0000-000000000000',
    email: 'test-diagnostic@example.com',
    role: 'member',
    token: testToken,
    status: 'pending',
  }).select().single();
  if (insertErr) {
    console.error('INSERT ERROR:', insertErr.message, '| code:', insertErr.code, '| details:', insertErr.details);
  } else {
    console.log('INSERT OK, id:', insertData?.id);
    // Clean up
    await supabase.from('team_invitations').delete().eq('token', testToken);
    console.log('Cleaned up test row');
  }

  // Test Resend
  console.log('\n--- Test Resend ---');
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: 'Vintra <onboarding@resend.dev>',
      to: 'test-diagnostic@example.com',
      subject: 'Diagnostic test',
      html: '<p>Test</p>',
    });
    if (error) {
      console.error('RESEND ERROR:', JSON.stringify(error));
    } else {
      console.log('RESEND OK, id:', data?.id);
    }
  } catch (err) {
    console.error('RESEND THREW:', err.message);
  }
}

run().catch(e => { console.error('Unhandled:', e); process.exit(1); });
