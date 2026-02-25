import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("dzdxmhzmyfxiqbnwhzst")
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : "https://dzdxmhzmyfxiqbnwhzst.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

console.log("Supabase URL:", supabaseUrl);
console.log("Service key present:", supabaseServiceKey ? "Yes" : "No");

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const projectRef = supabaseUrl.replace("https://", "").split(".")[0];

async function executeSql(sql, stepName) {
  console.log(`\nRunning: ${stepName}...`);

  // Try exec_sql RPC first
  const response = await fetch(
    `https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (response.ok) {
    console.log(`  SUCCESS`);
    return true;
  }

  const errText = await response.text();
  console.log(`  exec_sql status: ${response.status} - ${errText.substring(0, 200)}`);

  // Try pg/query endpoint
  const response2 = await fetch(
    `https://${projectRef}.supabase.co/pg/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Supabase-Key": supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (response2.ok) {
    console.log(`  SUCCESS via pg/query`);
    return true;
  }

  const errText2 = await response2.text();
  console.log(`  pg/query status: ${response2.status} - ${errText2.substring(0, 200)}`);
  return false;
}

async function run() {
  console.log("\n=== Creating team tables ===");

  // Step 1: Create team_invitations table
  const step1 = `
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
  `;

  // Step 2: Create team_members table
  const step2 = `
    CREATE TABLE IF NOT EXISTS public.team_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(admin_id, user_id)
    );
  `;

  // Step 3: Enable RLS
  const step3 = `
    ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
  `;

  // Step 4: RLS policies for team_invitations
  const step4 = `
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
  `;

  // Step 5: RLS policies for team_members
  const step5 = `
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
  `;

  // Step 6: Indexes
  const step6 = `
    CREATE INDEX IF NOT EXISTS idx_team_invitations_admin_id ON public.team_invitations(admin_id);
    CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
    CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
    CREATE INDEX IF NOT EXISTS idx_team_members_admin_id ON public.team_members(admin_id);
    CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
  `;

  const steps = [
    { name: "Step 1: Create team_invitations table", sql: step1 },
    { name: "Step 2: Create team_members table", sql: step2 },
    { name: "Step 3: Enable RLS", sql: step3 },
    { name: "Step 4: RLS policies for team_invitations", sql: step4 },
    { name: "Step 5: RLS policies for team_members", sql: step5 },
    { name: "Step 6: Indexes", sql: step6 },
  ];

  let allSuccess = true;
  for (const step of steps) {
    const ok = await executeSql(step.sql, step.name);
    if (!ok) allSuccess = false;
  }

  // Verify tables were created
  console.log("\n=== Verifying tables ===");
  const { data: inv, error: invErr } = await supabase.from("team_invitations").select("id").limit(1);
  console.log("team_invitations:", invErr ? `ERROR - ${invErr.message}` : "EXISTS");

  const { data: mem, error: memErr } = await supabase.from("team_members").select("id").limit(1);
  console.log("team_members:", memErr ? `ERROR - ${memErr.message}` : "EXISTS");

  if (allSuccess) {
    console.log("\n=== Migration completed successfully! ===");
  } else {
    console.log("\n=== Some steps failed. Run the SQL in scripts/009_team_tables.sql manually in Supabase SQL Editor ===");
  }
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
