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

async function run() {
  const results = [];

  // Step 1: Add new columns via raw SQL using rpc or direct approach
  // Since we can't run raw SQL, we'll use the REST API approach:
  // First, try to select the new columns to see if they exist
  const { error: colCheck } = await supabase
    .from("chatbot_configs")
    .select("is_landing_widget")
    .limit(1);

  if (colCheck) {
    console.log("Column is_landing_widget does not exist yet. We need to add it via the migration endpoint.");
    // We'll add columns by calling the migrate endpoint approach
    // But first, let's try a different approach - use the Supabase SQL endpoint
    
    // Use the management API to run SQL
    const sqlStatements = [
      `ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS is_landing_widget BOOLEAN DEFAULT false`,
      `ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS landing_widget_enabled BOOLEAN DEFAULT true`,
      `ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS quick_replies TEXT[] DEFAULT ARRAY['What features do you offer?', 'Tell me about pricing', 'How does the AI work?', 'Can I see a demo?']`,
      `ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS greeting_message TEXT DEFAULT 'Hi there!'`,
      `ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS greeting_subtext TEXT DEFAULT 'How can I help you today?'`,
    ];

    for (const sql of sqlStatements) {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ sql }),
      });

      if (!res.ok) {
        // exec_sql RPC might not exist, try using postgres connection string
        console.log(`RPC approach failed for: ${sql.substring(0, 60)}... - will try alternative`);
      } else {
        console.log(`OK: ${sql.substring(0, 60)}...`);
      }
    }
  } else {
    console.log("Column is_landing_widget already exists.");
  }

  // Step 2: Check if columns exist now
  const { data: testData, error: testErr } = await supabase
    .from("chatbot_configs")
    .select("is_landing_widget, landing_widget_enabled, quick_replies, greeting_message, greeting_subtext")
    .limit(1);

  if (testErr) {
    console.log("Columns still missing after migration attempt. Error:", testErr.message);
    console.log("\n=== MANUAL SQL REQUIRED ===");
    console.log("Please run this SQL in your Supabase Dashboard > SQL Editor:\n");
    console.log(`ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS is_landing_widget BOOLEAN DEFAULT false;`);
    console.log(`ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS landing_widget_enabled BOOLEAN DEFAULT true;`);
    console.log(`ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS quick_replies TEXT[] DEFAULT ARRAY['What features do you offer?', 'Tell me about pricing', 'How does the AI work?', 'Can I see a demo?'];`);
    console.log(`ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS greeting_message TEXT DEFAULT 'Hi there!';`);
    console.log(`ALTER TABLE public.chatbot_configs ADD COLUMN IF NOT EXISTS greeting_subtext TEXT DEFAULT 'How can I help you today?';`);
    console.log("\nThen re-run this script to flag Vintra's config.");
    results.push({ step: "add_columns", status: "MANUAL_REQUIRED" });
  } else {
    console.log("All columns exist. Proceeding to flag Vintra's config...");
    results.push({ step: "add_columns", status: "OK" });
  }

  // Step 3: Find vintrastudio@gmail.com user and flag their chatbot config
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const vintraUser = authUsers?.users?.find(
    (u) => u.email === "vintrastudio@gmail.com"
  );

  if (!vintraUser) {
    console.log("User vintrastudio@gmail.com not found in auth.users");
    results.push({ step: "find_vintra", status: "NOT_FOUND" });
  } else {
    console.log(`Found Vintra user: ${vintraUser.id}`);
    results.push({ step: "find_vintra", status: "OK", userId: vintraUser.id });

    // First reset all is_landing_widget flags (ensure only one)
    const { error: resetErr } = await supabase
      .from("chatbot_configs")
      .update({ is_landing_widget: false })
      .neq("admin_id", vintraUser.id);

    if (resetErr) {
      console.log("Note: Could not reset other configs (column may not exist yet):", resetErr.message);
    }

    // Flag Vintra's chatbot config
    const { data: updated, error: updateErr } = await supabase
      .from("chatbot_configs")
      .update({
        is_landing_widget: true,
        landing_widget_enabled: true,
      })
      .eq("admin_id", vintraUser.id)
      .select();

    if (updateErr) {
      console.log("Error flagging Vintra config:", updateErr.message);
      results.push({ step: "flag_vintra", status: "ERROR", error: updateErr.message });
    } else if (!updated || updated.length === 0) {
      console.log("No chatbot config found for Vintra. Creating one...");
      
      const { data: created, error: createErr } = await supabase
        .from("chatbot_configs")
        .insert({
          admin_id: vintraUser.id,
          name: "Vintra Landing Widget",
          welcome_message: "Hello! How can I help you today?",
          is_landing_widget: true,
          landing_widget_enabled: true,
          is_active: true,
        })
        .select();

      if (createErr) {
        console.log("Error creating config:", createErr.message);
        results.push({ step: "create_vintra_config", status: "ERROR", error: createErr.message });
      } else {
        console.log("Created Vintra config:", created);
        results.push({ step: "create_vintra_config", status: "OK" });
      }
    } else {
      console.log("Flagged Vintra config as landing widget:", updated);
      results.push({ step: "flag_vintra", status: "OK", configs: updated.length });
    }
  }

  // Also add the RLS policy for public read of landing widget config
  console.log("\n=== ADDITIONAL RLS POLICY (run in SQL editor if not already present) ===");
  console.log(`DROP POLICY IF EXISTS "chatbot_configs_landing_read" ON public.chatbot_configs;`);
  console.log(`CREATE POLICY "chatbot_configs_landing_read" ON public.chatbot_configs FOR SELECT USING (is_landing_widget = true AND landing_widget_enabled = true);`);

  console.log("\n=== RESULTS ===");
  console.log(JSON.stringify(results, null, 2));
}

run().catch(console.error);
