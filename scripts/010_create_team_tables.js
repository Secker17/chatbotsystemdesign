import pg from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('POSTGRES_URL / DATABASE_URL is not set');
  process.exit(1);
}

console.log('Using connection string:', connectionString.replace(/:[^@]+@/, ':***@'));

const client = new pg.Client({ connectionString });

async function run() {
  await client.connect();
  console.log('Connected to database');

  // 1. Create team_invitations table
  await exec(`
    CREATE TABLE IF NOT EXISTS public.team_invitations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
      token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
      created_at TIMESTAMPTZ DEFAULT now(),
      expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
      accepted_at TIMESTAMPTZ
    )
  `);

  // 2. Create team_members table
  await exec(`
    CREATE TABLE IF NOT EXISTS public.team_members (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
      joined_at TIMESTAMPTZ DEFAULT now(),
      invitation_id UUID REFERENCES public.team_invitations(id),
      UNIQUE(admin_id, user_id)
    )
  `);

  // 3. Enable RLS
  await exec(`ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY`);
  await exec(`ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY`);

  // 4. Drop existing policies (safe if they don't exist)
  const policies = [
    'team_invitations_select', 'team_invitations_insert', 'team_invitations_update', 'team_invitations_delete',
    'team_members_select', 'team_members_insert', 'team_members_update', 'team_members_delete'
  ];
  for (const p of policies) {
    const table = p.startsWith('team_invitations') ? 'team_invitations' : 'team_members';
    await exec(`DROP POLICY IF EXISTS "${p}" ON public.${table}`);
  }

  // 5. Create RLS policies for team_invitations
  await exec(`CREATE POLICY "team_invitations_select" ON public.team_invitations FOR SELECT USING (admin_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))`);
  await exec(`CREATE POLICY "team_invitations_insert" ON public.team_invitations FOR INSERT WITH CHECK (admin_id = auth.uid())`);
  await exec(`CREATE POLICY "team_invitations_update" ON public.team_invitations FOR UPDATE USING (admin_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))`);
  await exec(`CREATE POLICY "team_invitations_delete" ON public.team_invitations FOR DELETE USING (admin_id = auth.uid())`);

  // 6. Create RLS policies for team_members
  await exec(`CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (admin_id = auth.uid() OR user_id = auth.uid())`);
  await exec(`CREATE POLICY "team_members_insert" ON public.team_members FOR INSERT WITH CHECK (true)`);
  await exec(`CREATE POLICY "team_members_update" ON public.team_members FOR UPDATE USING (admin_id = auth.uid())`);
  await exec(`CREATE POLICY "team_members_delete" ON public.team_members FOR DELETE USING (admin_id = auth.uid())`);

  // 7. Create indexes
  await exec(`CREATE INDEX IF NOT EXISTS idx_team_invitations_admin ON public.team_invitations(admin_id)`);
  await exec(`CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email)`);
  await exec(`CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token)`);
  await exec(`CREATE INDEX IF NOT EXISTS idx_team_members_admin ON public.team_members(admin_id)`);
  await exec(`CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id)`);

  // 8. Verify
  const { rows: tables } = await client.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name IN ('team_invitations', 'team_members')
  `);
  console.log('Tables found:', tables.map(t => t.table_name));

  await client.end();
  console.log('Migration complete!');
}

async function exec(sql) {
  try {
    await client.query(sql);
    console.log('OK:', sql.trim().slice(0, 80));
  } catch (err) {
    console.error('Error:', err.message, '| SQL:', sql.trim().slice(0, 80));
  }
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
