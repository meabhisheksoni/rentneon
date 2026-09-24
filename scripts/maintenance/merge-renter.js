const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function main() {
    try {
        console.log('Merging Renter ID 21 (Duplicate) into Renter ID 7 (Main)...');

        // 1. Move Monthly Bills
        const billsResult = await sql`
      UPDATE monthly_bills 
      SET renter_id = 7 
      WHERE renter_id = 21
      RETURNING id
    `;
        console.log(`✅ Moved ${billsResult.length} bills from ID 21 to ID 7.`);

        // 2. Move Legacy Payments (if any)
        const legacyPayments = await sql`
      UPDATE payments 
      SET renter_id = 7 
      WHERE renter_id = 21
      RETURNING id
    `;
        console.log(`✅ Moved ${legacyPayments.length} legacy payments from ID 21 to ID 7.`);

        // 3. Delete the duplicate renter
        await sql`DELETE FROM renters WHERE id = 21`;
        console.log('✅ Deleted duplicate Renter ID 21.');

        console.log('\nMerge Complete! Please refresh the application.');

    } catch (error) {
        console.error('❌ Error during merge:', error);
    }
}

main();
