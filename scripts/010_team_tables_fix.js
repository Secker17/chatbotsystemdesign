import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const projectRef = supabaseUrl.replace("https://", "").split(".")[0];

async function executeSql(sql, stepName) {
  console.log(`\nRunning: ${stepName}...`);

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
  console.log(`  exec_sql status: ${response.status} - ${errText.substring(0, 300)}`);

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
  console.log(`  pg/query status: ${response2.status} - ${errText2.substring(0, 300)}`);
  return false;
}

async function run() {
  console.log("=== Team tables migration (fix) ===\n");

  // 1. Create tables
  await executeSql(`
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
  `, "Create team_invitations");

  await executeSql(`
    CREATE TABLE IF NOT EXISTS public.team_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(admin_id, user_id)
    );
  `, "Create team_members");

  // 2. Enable RLS
  await executeSql(`ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;`, "RLS on team_invitations");
  await executeSql(`ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;`, "RLS on team_members");

  // 3. Drop and recreate policies for team_invitations (safe re-run)
  await executeSql(`DROP POLICY IF EXISTS "team_invitations_select" ON public.team_invitations;`, "Drop inv select");
  await executeSql(`CREATE POLICY "team_invitations_select" ON public.team_invitations FOR SELECT USING (true);`, "Create inv select");

  await executeSql(`DROP POLICY IF EXISTS "team_invitations_insert" ON public.team_invitations;`, "Drop inv insert");
  await executeSql(`CREATE POLICY "team_invitations_insert" ON public.team_invitations FOR INSERT WITH CHECK (auth.uid() = admin_id);`, "Create inv insert");

  await executeSql(`DROP POLICY IF EXISTS "team_invitations_update" ON public.team_invitations;`, "Drop inv update");
  await executeSql(`CREATE POLICY "team_invitations_update" ON public.team_invitations FOR UPDATE USING (true);`, "Create inv update");

  await executeSql(`DROP POLICY IF EXISTS "team_invitations_delete" ON public.team_invitations;`, "Drop inv delete");
  await executeSql(`CREATE POLICY "team_invitations_delete" ON public.team_invitations FOR DELETE USING (auth.uid() = admin_id);`, "Create inv delete");

  // 4. Drop and recreate policies for team_members
  await executeSql(`DROP POLICY IF EXISTS "team_members_select" ON public.team_members;`, "Drop mem select");
  await executeSql(`CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (auth.uid() = admin_id OR auth.uid() = user_id);`, "Create mem select");

  await executeSql(`DROP POLICY IF EXISTS "team_members_insert" ON public.team_members;`, "Drop mem insert");
  await executeSql(`CREATE POLICY "team_members_insert" ON public.team_members FOR INSERT WITH CHECK (true);`, "Create mem insert");

  await executeSql(`DROP POLICY IF EXISTS "team_members_update" ON public.team_members;`, "Drop mem update");
  await executeSql(`CREATE POLICY "team_members_update" ON public.team_members FOR UPDATE USING (auth.uid() = admin_id);`, "Create mem update");

  await executeSql(`DROP POLICY IF EXISTS "team_members_delete" ON public.team_members;`, "Drop mem delete");
  await executeSql(`CREATE POLICY "team_members_delete" ON public.team_members FOR DELETE USING (auth.uid() = admin_id);`, "Create mem delete");

  // 5. Indexes
  await executeSql(`CREATE INDEX IF NOT EXISTS idx_team_invitations_admin_id ON public.team_invitations(admin_id);`, "Idx inv admin");
  await executeSql(`CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);`, "Idx inv email");
  await executeSql(`CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);`, "Idx inv token");
  await executeSql(`CREATE INDEX IF NOT EXISTS idx_team_members_admin_id ON public.team_members(admin_id);`, "Idx mem admin");
  await executeSql(`CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);`, "Idx mem user");

  // 6. Verify
  console.log("\n=== Verifying ===");
  const { error: invErr } = await supabase.from("team_invitations").select("id").limit(1);
  console.log("team_invitations:", invErr ? `ERROR - ${invErr.message}` : "OK");

  const { error: memErr } = await supabase.from("team_members").select("id").limit(1);
  console.log("team_members:", memErr ? `ERROR - ${memErr.message}` : "OK");

  console.log("\n=== Done ===");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
