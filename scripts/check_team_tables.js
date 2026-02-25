import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { error: invErr } = await supabase.from("team_invitations").select("id").limit(1);
console.log("team_invitations:", invErr ? `MISSING (${invErr.message})` : "EXISTS");

const { error: memErr } = await supabase.from("team_members").select("id").limit(1);
console.log("team_members:", memErr ? `MISSING (${memErr.message})` : "EXISTS");
