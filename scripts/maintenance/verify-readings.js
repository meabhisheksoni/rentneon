const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function main() {
    try {
        console.log('Verifying Meter Readings for Nitya Papa (ID: 7)...');

        const bills = await sql`
      SELECT 
        month, 
        year,
        electricity_enabled,
        electricity_initial_reading, 
        electricity_final_reading,
        electricity_amount,
        water_enabled,
        water_amount
      FROM monthly_bills 
      WHERE renter_id = 7 
      ORDER BY year, month
    `;

        console.table(bills);

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
