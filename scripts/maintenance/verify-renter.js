const { neon } = require('@neondatabase/serverless');

// Use the connection string from .env.local (which should be set in the environment when running this)
const sql = neon(process.env.DATABASE_URL);

async function main() {
    try {
        console.log('Verifying data for renter: nitya papa (ID: 7)');

        // 1. Check if renter exists
        const renter = await sql`SELECT * FROM renters WHERE id = 7`;
        console.log('\nRenter Details:');
        console.log(JSON.stringify(renter, null, 2));

        if (renter.length === 0) {
            console.log('❌ Renter ID 7 not found!');
            return;
        }

        // 2. Fetch all bills for this renter
        const bills = await sql`
      SELECT id, month, year, total_amount, created_at 
      FROM monthly_bills 
      WHERE renter_id = 7 
      ORDER BY year, month
    `;

        console.log(`\nFound ${bills.length} bills for renter 7:`);
        console.table(bills);

        // 3. Compare with expected months (from user's previous export)
        const expectedMonths = [8, 9, 11, 12]; // Aug, Sep, Nov, Dec 2025
        const foundMonths = bills.map(b => b.month);

        console.log('\nExpected Months (2025):', expectedMonths.join(', '));
        console.log('Found Months:', foundMonths.join(', '));

        const missing = expectedMonths.filter(m => !foundMonths.includes(m));
        if (missing.length > 0) {
            console.log(`❌ Missing months: ${missing.join(', ')}`);
        } else {
            console.log('✅ All expected months found in database.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
