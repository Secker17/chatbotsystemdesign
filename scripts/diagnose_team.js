import pg from 'pg';

const client = new pg.Client({ connectionString: process.env.POSTGRES_URL });

async function run() {
  await client.connect();
  
  // Check if tables exist
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('team_invitations', 'team_members')
    ORDER BY table_name;
  `);
  console.log('Tables found:', tables.rows.map(r => r.table_name));
  
  if (tables.rows.length > 0) {
    // Check columns for each table
    for (const row of tables.rows) {
      const cols = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [row.table_name]);
      console.log(`\nColumns for ${row.table_name}:`);
      cols.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable}, default: ${c.column_default})`));
    }
    
    // Check RLS policies
    const policies = await client.query(`
      SELECT tablename, policyname, permissive, roles, cmd, qual
      FROM pg_policies
      WHERE tablename IN ('team_invitations', 'team_members')
      ORDER BY tablename, policyname;
    `);
    console.log('\nRLS Policies:');
    policies.rows.forEach(p => console.log(`  ${p.tablename}.${p.policyname}: ${p.cmd} (${p.permissive})`));
    
    // Check if RLS is enabled
    const rls = await client.query(`
      SELECT relname, relrowsecurity
      FROM pg_class
      WHERE relname IN ('team_invitations', 'team_members');
    `);
    console.log('\nRLS enabled:');
    rls.rows.forEach(r => console.log(`  ${r.relname}: ${r.relrowsecurity}`));
  } else {
    console.log('NO TEAM TABLES FOUND - need to run migration');
  }
  
  await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
