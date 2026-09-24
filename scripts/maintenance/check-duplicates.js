const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function main() {
    try {
        const renters = await sql`SELECT id, name, created_at, is_active FROM renters WHERE name ILIKE '%nitya%'`;
        console.log('Duplicate Renters Check:');
        console.table(renters);
    } catch (e) { console.error(e); }
}
main();
