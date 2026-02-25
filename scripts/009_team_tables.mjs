import pg from 'pg'

const connectionString = process.env.POSTGRES_URL

if (!connectionString) {
  console.error('POSTGRES_URL is not set')
  process.exit(1)
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })

async function run() {
  await client.connect()
  console.log('Connected to database')

  const sql = `
    CREATE TABLE IF NOT EXISTS public.team_invitations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      status TEXT NOT NULL DEFAULT 'pending',
      token TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
    );

    CREATE TABLE IF NOT EXISTS public.team_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(admin_id, user_id)
    );

    ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_invitations_select') THEN
        CREATE POLICY "team_invitations_select" ON public.team_invitations FOR SELECT USING (true);
      END IF;
    END $$;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_invitations_insert') THEN
        CREATE POLICY "team_invitations_insert" ON public.team_invitations FOR INSERT WITH CHECK (auth.uid() = admin_id);
      END IF;
    END $$;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_invitations_update') THEN
        CREATE POLICY "team_invitations_update" ON public.team_invitations FOR UPDATE USING (auth.uid() = admin_id);
      END IF;
    END $$;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_invitations_delete') THEN
        CREATE POLICY "team_invitations_delete" ON public.team_invitations FOR DELETE USING (auth.uid() = admin_id);
      END IF;
    END $$;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_members_select') THEN
        CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (auth.uid() = admin_id OR auth.uid() = user_id);
      END IF;
    END $$;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_members_insert') THEN
        CREATE POLICY "team_members_insert" ON public.team_members FOR INSERT WITH CHECK (auth.uid() = admin_id);
      END IF;
    END $$;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_members_update') THEN
        CREATE POLICY "team_members_update" ON public.team_members FOR UPDATE USING (auth.uid() = admin_id);
      END IF;
    END $$;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'team_members_delete') THEN
        CREATE POLICY "team_members_delete" ON public.team_members FOR DELETE USING (auth.uid() = admin_id);
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS idx_team_invitations_admin_id ON public.team_invitations(admin_id);
    CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
    CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
    CREATE INDEX IF NOT EXISTS idx_team_members_admin_id ON public.team_members(admin_id);
    CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
  `

  await client.query(sql)
  console.log('Migration completed successfully!')
  await client.end()
}

run().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
