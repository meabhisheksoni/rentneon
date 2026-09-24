const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function main() {
    try {
        console.log('Verifying specific expenses...');

        const expenseIds = [
            '92279a6b-3254-47fa-8134-a9e304d0c6e4',
            'f5391fa4-3400-412f-84ea-6d6f72a2c1a3',
            '7952c930-08cc-45d7-b383-7fa23a0a609f',
            '8e1bc59a-25e1-410c-9242-b6c9a4f32bfd'
        ];

        // Check if these expenses exist
        const expenses = await sql`
      SELECT id, description, amount, monthly_bill_id 
      FROM additional_expenses 
      WHERE id = ANY(${expenseIds})
    `;

        console.log(`Found ${expenses.length} out of ${expenseIds.length} expenses.`);
        console.table(expenses);

        if (expenses.length > 0) {
            // Check the bills they belong to and the renter
            const billIds = [...new Set(expenses.map(e => e.monthly_bill_id))];

            const bills = await sql`
        SELECT b.id, b.month, b.year, b.renter_id, r.name as renter_name 
        FROM monthly_bills b
        JOIN renters r ON b.renter_id = r.id
        WHERE b.id = ANY(${billIds})
      `;

            console.log('\nRelated Bills:');
            console.table(bills);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
