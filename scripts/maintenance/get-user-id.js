// Script to get user ID and import data
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function main() {
    try {
        // Get user ID
        const users = await sql`SELECT id, email FROM users`;
        console.log('\n=== USERS IN DATABASE ===');
        console.log(JSON.stringify(users, null, 2));

        if (users.length === 0) {
            console.log('No users found. Please register first.');
            return;
        }

        const userId = users[0].id;
        console.log(`\nUsing user ID: ${userId}\n`);

        // Check current data
        const counts = await sql`
      SELECT 
        (SELECT COUNT(*) FROM renters) as renter_count,
        (SELECT COUNT(*) FROM monthly_bills) as bill_count,
        (SELECT COUNT(*) FROM additional_expenses) as expense_count,
        (SELECT COUNT(*) FROM bill_payments) as payment_count
    `;
        console.log('Current data counts:', counts[0]);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();
