// Script to import data from Supabase to Neon
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

// The new user ID from registration
const NEW_USER_ID = '458e7bc1-fe0f-43fd-ac8d-41ddc668f1b9';

async function main() {
    try {
        console.log('Starting data import...\n');

        // ========================================
        // STEP 1: INSERT RENTERS
        // ========================================
        console.log('Importing renters...');

        await sql`
      INSERT INTO renters (id, user_id, name, email, phone, property_address, monthly_rent, move_in_date, is_active, created_at)
      OVERRIDING SYSTEM VALUE
      VALUES 
        (2, ${NEW_USER_ID}, 'jkh', NULL, NULL, NULL, '999.00', '2025-09-27', false, '2025-09-27 20:39:52.687454+00'),
        (7, ${NEW_USER_ID}, 'nitya papa', NULL, NULL, NULL, '9000.00', '2025-09-28', true, '2025-09-28 11:10:34.032812+00'),
        (10, ${NEW_USER_ID}, 'simran', NULL, NULL, NULL, '300.00', '2025-09-29', true, '2025-09-29 12:55:41.73533+00'),
        (12, ${NEW_USER_ID}, 'raahul', NULL, NULL, NULL, '4000.00', '2025-09-30', true, '2025-09-29 19:28:46.411654+00'),
        (15, ${NEW_USER_ID}, 'Papa', NULL, NULL, NULL, '5000.00', '2025-10-02', true, '2025-10-01 18:42:29.774364+00'),
        (16, ${NEW_USER_ID}, 'gyanneasdh', NULL, NULL, NULL, '5000.00', '2025-10-02', false, '2025-10-02 09:03:19.45215+00'),
        (17, ${NEW_USER_ID}, 'Amit Soni', NULL, NULL, NULL, '2500.00', '2019-10-02', true, '2025-10-02 09:12:51.098684+00'),
        (21, ${NEW_USER_ID}, 'nitya papa', NULL, NULL, NULL, '9000.00', '2022-01-01', true, '2025-10-13 10:43:47.936273+00'),
        (22, ${NEW_USER_ID}, 'ram', NULL, NULL, NULL, '600.00', '2025-10-30', false, '2025-10-30 18:00:14.048442+00'),
        (23, ${NEW_USER_ID}, 'mahaeh', NULL, NULL, NULL, '5000.00', '2025-11-16', true, '2025-11-16 17:58:56.06402+00'),
        (24, ${NEW_USER_ID}, 'Ram bhaiya', NULL, NULL, NULL, '6000.00', '2025-05-06', true, '2025-11-17 15:21:37.559524+00')
      ON CONFLICT (id) DO NOTHING
    `;

        // Reset the sequence
        await sql`SELECT setval(pg_get_serial_sequence('renters', 'id'), COALESCE((SELECT MAX(id) FROM renters), 1))`;

        console.log('✅ Renters imported');

        // ========================================
        // STEP 2: INSERT MONTHLY BILLS
        // ========================================
        console.log('Importing monthly bills...');

        const bills = [
            { id: '10ee9323-3572-492e-a794-18114de07c2c', renter_id: 7, month: 8, year: 2025, rent_amount: '90000.00', electricity_enabled: true, electricity_initial_reading: 6983, electricity_final_reading: 7277, electricity_multiplier: '9.00', electricity_reading_date: '2025-09-28', electricity_amount: '2646.00', motor_enabled: true, motor_initial_reading: 1134, motor_final_reading: 1161, motor_multiplier: '9.00', motor_number_of_people: 2, motor_reading_date: '2025-09-28', motor_amount: '121.50', water_enabled: true, water_amount: '200.00', maintenance_enabled: false, maintenance_amount: '0.00', total_amount: '92967.50', total_payments: '7833.00', pending_amount: '85134.50', created_at: '2025-09-28 11:14:20.93176+00', updated_at: '2025-11-16 16:32:06.862688+00' },
            { id: '3fb880db-cea7-4b2f-a829-adca87ebf955', renter_id: 7, month: 9, year: 2025, rent_amount: '9000.00', electricity_enabled: false, electricity_initial_reading: 7277, electricity_final_reading: 7277, electricity_multiplier: '9.00', electricity_reading_date: '2025-09-28', electricity_amount: '0.00', motor_enabled: false, motor_initial_reading: 1161, motor_final_reading: 1161, motor_multiplier: '9.00', motor_number_of_people: 2, motor_reading_date: '2025-09-28', motor_amount: '0.00', water_enabled: false, water_amount: '0.00', maintenance_enabled: false, maintenance_amount: '0.00', total_amount: '9000.00', total_payments: '7966.00', pending_amount: '1034.00', created_at: '2025-09-28 17:18:33.839223+00', updated_at: '2025-09-30 08:18:56.073761+00' },
            { id: '5b3f8748-0cf4-4039-a3c4-289d0e8c4410', renter_id: 7, month: 11, year: 2025, rent_amount: '9000.00', electricity_enabled: true, electricity_initial_reading: 7766, electricity_final_reading: 7879, electricity_multiplier: '9.00', electricity_reading_date: '2025-11-16', electricity_amount: '1017.00', motor_enabled: true, motor_initial_reading: 1216, motor_final_reading: 1236, motor_multiplier: '9.00', motor_number_of_people: 2, motor_reading_date: '2025-11-16', motor_amount: '90.00', water_enabled: true, water_amount: '125.00', maintenance_enabled: false, maintenance_amount: '0.00', total_amount: '11513.00', total_payments: '10000.00', pending_amount: '1513.00', created_at: '2025-11-16 18:36:20.496478+00', updated_at: '2025-12-01 13:59:16.189941+00' },
            { id: '18fc2041-5dcf-47a2-927f-470d7c594ee9', renter_id: 7, month: 12, year: 2025, rent_amount: '9000.00', electricity_enabled: true, electricity_initial_reading: 7879, electricity_final_reading: 7981, electricity_multiplier: '9.00', electricity_reading_date: '2025-12-01', electricity_amount: '918.00', motor_enabled: true, motor_initial_reading: 1236, motor_final_reading: 1255, motor_multiplier: '9.00', motor_number_of_people: 2, motor_reading_date: '2025-12-01', motor_amount: '85.50', water_enabled: false, water_amount: '0.00', maintenance_enabled: false, maintenance_amount: '0.00', total_amount: '11506.50', total_payments: '10000.00', pending_amount: '1506.50', created_at: '2025-12-01 14:07:38.296235+00', updated_at: '2025-12-11 06:22:31.081728+00' },
            { id: '92aff657-c5e2-44b9-87fd-2b849749dc2c', renter_id: 12, month: 9, year: 2025, rent_amount: '4000.00', electricity_enabled: true, electricity_initial_reading: 578, electricity_final_reading: 985, electricity_multiplier: '9.00', electricity_reading_date: '2025-09-29', electricity_amount: '3663.00', motor_enabled: true, motor_initial_reading: 2202, motor_final_reading: 3394, motor_multiplier: '9.00', motor_number_of_people: 2, motor_reading_date: '2025-09-29', motor_amount: '5364.00', water_enabled: true, water_amount: '300.00', maintenance_enabled: false, maintenance_amount: '0.00', total_amount: '13327.00', total_payments: '4545.00', pending_amount: '8782.00', created_at: '2025-09-29 19:32:18.800062+00', updated_at: '2025-09-30 09:18:12.705002+00' },
            { id: '44751a4b-661f-4047-8f82-a569a228254a', renter_id: 16, month: 10, year: 2025, rent_amount: '5000.00', electricity_enabled: true, electricity_initial_reading: 345, electricity_final_reading: 567, electricity_multiplier: '9.00', electricity_reading_date: '2025-10-02', electricity_amount: '1998.00', motor_enabled: true, motor_initial_reading: 34, motor_final_reading: 56, motor_multiplier: '9.00', motor_number_of_people: 2, motor_reading_date: '2025-10-02', motor_amount: '99.00', water_enabled: true, water_amount: '300.00', maintenance_enabled: false, maintenance_amount: '0.00', total_amount: '7397.00', total_payments: '7000.00', pending_amount: '397.00', created_at: '2025-10-02 09:04:34.433975+00', updated_at: '2025-10-02 09:04:34.433975+00' },
            { id: 'cc90ca55-38c7-4191-a279-b94da99e43f2', renter_id: 17, month: 10, year: 2025, rent_amount: '2500.00', electricity_enabled: true, electricity_initial_reading: 0, electricity_final_reading: 0, electricity_multiplier: '9.00', electricity_reading_date: '2025-10-02', electricity_amount: '0.00', motor_enabled: false, motor_initial_reading: 0, motor_final_reading: 0, motor_multiplier: '9.00', motor_number_of_people: 2, motor_reading_date: '2025-10-02', motor_amount: '0.00', water_enabled: false, water_amount: '0.00', maintenance_enabled: false, maintenance_amount: '0.00', total_amount: '2500.00', total_payments: '566.00', pending_amount: '1934.00', created_at: '2025-10-02 09:15:54.75285+00', updated_at: '2025-10-02 09:16:13.585534+00' },
            { id: '03324937-5c7d-4681-a4df-e9360c9e29e5', renter_id: 21, month: 10, year: 2025, rent_amount: '9000.00', electricity_enabled: true, electricity_initial_reading: 44, electricity_final_reading: 67, electricity_multiplier: '9.00', electricity_reading_date: '2025-10-13', electricity_amount: '207.00', motor_enabled: false, motor_initial_reading: 0, motor_final_reading: 0, motor_multiplier: '9.00', motor_number_of_people: 2, motor_reading_date: '2025-10-13', motor_amount: '0.00', water_enabled: false, water_amount: '0.00', maintenance_enabled: false, maintenance_amount: '0.00', total_amount: '9207.00', total_payments: '0.00', pending_amount: '9207.00', created_at: '2025-10-13 10:53:09.267881+00', updated_at: '2025-10-13 10:53:09.267881+00' },
            { id: 'bccc78d9-d169-4206-b405-b688ef65183a', renter_id: 23, month: 8, year: 2025, rent_amount: '5000.00', electricity_enabled: true, electricity_initial_reading: 444, electricity_final_reading: 656, electricity_multiplier: '9.00', electricity_reading_date: '2025-11-16', electricity_amount: '1908.00', motor_enabled: false, motor_initial_reading: 0, motor_final_reading: 0, motor_multiplier: '9.00', motor_number_of_people: 2, motor_reading_date: '2025-11-16', motor_amount: '0.00', water_enabled: false, water_amount: '0.00', maintenance_enabled: true, maintenance_amount: '777.00', total_amount: '7751.00', total_payments: '0.00', pending_amount: '7751.00', created_at: '2025-11-16 20:38:49.021998+00', updated_at: '2025-11-16 20:41:20.889317+00' },
            { id: 'c588ce32-3bb7-4e65-88bd-8cd243697c0b', renter_id: 23, month: 10, year: 2025, rent_amount: '5000.00', electricity_enabled: true, electricity_initial_reading: 44, electricity_final_reading: 55, electricity_multiplier: '9.00', electricity_reading_date: '2025-11-16', electricity_amount: '99.00', motor_enabled: false, motor_initial_reading: 0, motor_final_reading: 0, motor_multiplier: '9.00', motor_number_of_people: 2, motor_reading_date: '2025-11-16', motor_amount: '0.00', water_enabled: false, water_amount: '0.00', maintenance_enabled: false, maintenance_amount: '0.00', total_amount: '5099.00', total_payments: '0.00', pending_amount: '5099.00', created_at: '2025-11-16 18:35:18.912931+00', updated_at: '2025-11-16 18:35:38.830563+00' },
            { id: 'ee156a23-12e1-48e3-80f3-7f220eb73f8b', renter_id: 23, month: 11, year: 2025, rent_amount: '5000.00', electricity_enabled: true, electricity_initial_reading: 55, electricity_final_reading: 559, electricity_multiplier: '9.00', electricity_reading_date: '2025-11-16', electricity_amount: '4536.00', motor_enabled: false, motor_initial_reading: 0, motor_final_reading: 0, motor_multiplier: '9.00', motor_number_of_people: 2, motor_reading_date: '2025-11-16', motor_amount: '0.00', water_enabled: false, water_amount: '0.00', maintenance_enabled: false, maintenance_amount: '0.00', total_amount: '9536.00', total_payments: '0.00', pending_amount: '9536.00', created_at: '2025-11-16 18:53:41.044423+00', updated_at: '2025-11-16 20:24:12.717155+00' },
            { id: 'a3fdd258-2567-4cc2-a529-d89c0e582f16', renter_id: 24, month: 8, year: 2025, rent_amount: '6000.00', electricity_enabled: true, electricity_initial_reading: 574, electricity_final_reading: 802, electricity_multiplier: '10.00', electricity_reading_date: '2025-11-17', electricity_amount: '2280.00', motor_enabled: false, motor_initial_reading: 0, motor_final_reading: 0, motor_multiplier: '9.00', motor_number_of_people: 2, motor_reading_date: '2025-11-17', motor_amount: '0.00', water_enabled: true, water_amount: '270.00', maintenance_enabled: false, maintenance_amount: '0.00', total_amount: '8550.00', total_payments: '8000.00', pending_amount: '550.00', created_at: '2025-11-17 15:27:31.412635+00', updated_at: '2025-11-17 15:27:31.412635+00' },
            { id: '59b12d77-5161-4d0f-bcfd-4e07fab5dd2c', renter_id: 24, month: 9, year: 2025, rent_amount: '6000.00', electricity_enabled: true, electricity_initial_reading: 802, electricity_final_reading: 919, electricity_multiplier: '10.00', electricity_reading_date: '2025-11-17', electricity_amount: '1170.00', motor_enabled: false, motor_initial_reading: 0, motor_final_reading: 0, motor_multiplier: '9.00', motor_number_of_people: 2, motor_reading_date: '2025-11-17', motor_amount: '0.00', water_enabled: false, water_amount: '0.00', maintenance_enabled: false, maintenance_amount: '0.00', total_amount: '7720.00', total_payments: '7500.00', pending_amount: '220.00', created_at: '2025-11-17 15:29:22.491648+00', updated_at: '2025-11-17 15:29:22.491648+00' },
            { id: '8ff13149-5fd9-4f14-b8b1-3ef5bf9a4c31', renter_id: 24, month: 10, year: 2025, rent_amount: '6000.00', electricity_enabled: true, electricity_initial_reading: 919, electricity_final_reading: 1071, electricity_multiplier: '10.00', electricity_reading_date: '2025-11-17', electricity_amount: '1520.00', motor_enabled: false, motor_initial_reading: 0, motor_final_reading: 0, motor_multiplier: '9.00', motor_number_of_people: 2, motor_reading_date: '2025-11-17', motor_amount: '0.00', water_enabled: false, water_amount: '0.00', maintenance_enabled: false, maintenance_amount: '0.00', total_amount: '7740.00', total_payments: '6000.00', pending_amount: '1740.00', created_at: '2025-11-17 15:30:03.637532+00', updated_at: '2025-11-17 15:32:39.848126+00' },
            { id: '6639cb90-6796-4663-9d86-7c6cb7894cd6', renter_id: 24, month: 11, year: 2025, rent_amount: '6000.00', electricity_enabled: true, electricity_initial_reading: 1071, electricity_final_reading: 1106, electricity_multiplier: '10.00', electricity_reading_date: '2025-11-17', electricity_amount: '350.00', motor_enabled: false, motor_initial_reading: 0, motor_final_reading: 0, motor_multiplier: '9.00', motor_number_of_people: 2, motor_reading_date: '2025-11-17', motor_amount: '0.00', water_enabled: true, water_amount: '220.00', maintenance_enabled: false, maintenance_amount: '0.00', total_amount: '8310.00', total_payments: '9000.00', pending_amount: '-690.00', created_at: '2025-11-17 15:33:56.144241+00', updated_at: '2025-11-17 15:35:55.527005+00' },
            { id: '2c7481c8-73b3-41fe-b7e9-a573a65840ef', renter_id: 24, month: 12, year: 2025, rent_amount: '6000.00', electricity_enabled: true, electricity_initial_reading: 1106, electricity_final_reading: 1141, electricity_multiplier: '9.00', electricity_reading_date: '2025-12-10', electricity_amount: '315.00', motor_enabled: false, motor_initial_reading: 0, motor_final_reading: 0, motor_multiplier: '9.00', motor_number_of_people: 2, motor_reading_date: '2025-12-10', motor_amount: '0.00', water_enabled: true, water_amount: '200.00', maintenance_enabled: false, maintenance_amount: '0.00', total_amount: '6515.00', total_payments: '690.00', pending_amount: '5825.00', created_at: '2025-12-10 19:24:09.928386+00', updated_at: '2025-12-10 19:24:09.928386+00' }
        ];

        for (const b of bills) {
            await sql`
        INSERT INTO monthly_bills (id, user_id, renter_id, month, year, rent_amount, 
          electricity_enabled, electricity_initial_reading, electricity_final_reading, 
          electricity_multiplier, electricity_reading_date, electricity_amount,
          motor_enabled, motor_initial_reading, motor_final_reading,
          motor_multiplier, motor_number_of_people, motor_reading_date, motor_amount,
          water_enabled, water_amount, maintenance_enabled, maintenance_amount,
          total_amount, total_payments, pending_amount, created_at, updated_at)
        VALUES (${b.id}, ${NEW_USER_ID}, ${b.renter_id}, ${b.month}, ${b.year}, ${b.rent_amount},
          ${b.electricity_enabled}, ${b.electricity_initial_reading}, ${b.electricity_final_reading},
          ${b.electricity_multiplier}, ${b.electricity_reading_date}, ${b.electricity_amount},
          ${b.motor_enabled}, ${b.motor_initial_reading}, ${b.motor_final_reading},
          ${b.motor_multiplier}, ${b.motor_number_of_people}, ${b.motor_reading_date}, ${b.motor_amount},
          ${b.water_enabled}, ${b.water_amount}, ${b.maintenance_enabled}, ${b.maintenance_amount},
          ${b.total_amount}, ${b.total_payments}, ${b.pending_amount}, ${b.created_at}, ${b.updated_at})
        ON CONFLICT (id) DO NOTHING
      `;
        }

        console.log('✅ Monthly bills imported');

        // ========================================
        // STEP 3: INSERT ADDITIONAL EXPENSES
        // ========================================
        console.log('Importing additional expenses...');

        const expenses = [
            { id: '9303d232-da00-4e96-9acb-6c5f94ba241a', monthly_bill_id: 'bccc78d9-d169-4206-b405-b688ef65183a', description: 'ss', amount: '66.00', date: '2025-11-16', created_at: '2025-11-16 20:41:20.889317+00' },
            { id: 'c3e8caf8-e795-4b30-b7ce-434dab70a96c', monthly_bill_id: '59b12d77-5161-4d0f-bcfd-4e07fab5dd2c', description: 'Pending of previous month', amount: '550.00', date: '2025-11-17', created_at: '2025-11-17 15:29:22.491648+00' },
            { id: 'fc9282a0-237e-4c7c-bc23-aba281964f23', monthly_bill_id: '8ff13149-5fd9-4f14-b8b1-3ef5bf9a4c31', description: 'Previous month', amount: '220.00', date: '2025-11-17', created_at: '2025-11-17 15:32:39.848126+00' },
            { id: '10e0d4c1-57b6-41e1-9887-f9d8dace4ffe', monthly_bill_id: '6639cb90-6796-4663-9d86-7c6cb7894cd6', description: 'Previous month pending', amount: '1740.00', date: '2025-11-17', created_at: '2025-11-17 15:34:46.391922+00' },
            { id: '92279a6b-3254-47fa-8134-a9e304d0c6e4', monthly_bill_id: '5b3f8748-0cf4-4039-a3c4-289d0e8c4410', description: 'october pending', amount: '75.00', date: '2025-12-01', created_at: '2025-12-01 13:59:16.189941+00' },
            { id: 'f5391fa4-3400-412f-84ea-6d6f72a2c1a3', monthly_bill_id: '5b3f8748-0cf4-4039-a3c4-289d0e8c4410', description: 'cylinder in october', amount: '857.00', date: '2025-12-01', created_at: '2025-12-01 13:59:16.189941+00' },
            { id: '7952c930-08cc-45d7-b383-7fa23a0a609f', monthly_bill_id: '5b3f8748-0cf4-4039-a3c4-289d0e8c4410', description: 'aunti recharge', amount: '349.00', date: '2025-12-01', created_at: '2025-12-01 13:59:16.189941+00' },
            { id: '8e1bc59a-25e1-410c-9242-b6c9a4f32bfd', monthly_bill_id: '18fc2041-5dcf-47a2-927f-470d7c594ee9', description: 'Nov left', amount: '1503.00', date: '2025-12-11', created_at: '2025-12-11 06:20:57.836309+00' }
        ];

        for (const e of expenses) {
            await sql`
        INSERT INTO additional_expenses (id, monthly_bill_id, description, amount, date, created_at)
        VALUES (${e.id}, ${e.monthly_bill_id}, ${e.description}, ${e.amount}, ${e.date}, ${e.created_at})
        ON CONFLICT (id) DO NOTHING
      `;
        }

        console.log('✅ Additional expenses imported');

        // ========================================
        // STEP 4: INSERT BILL PAYMENTS
        // ========================================
        console.log('Importing bill payments...');

        const payments = [
            { id: '3b73c20b-b3e1-402a-af5c-207c94447d8f', monthly_bill_id: '3fb880db-cea7-4b2f-a829-adca87ebf955', amount: '77.00', payment_date: '2025-09-30', payment_type: 'cash', note: 'hh', created_at: '2025-09-30 08:12:36.507889+00' },
            { id: '133c563d-3cf2-4558-8cbb-7aa2fd2cb764', monthly_bill_id: '3fb880db-cea7-4b2f-a829-adca87ebf955', amount: '7889.00', payment_date: '2025-09-30', payment_type: 'cash', note: 'fdsf', created_at: '2025-09-30 08:18:56.319694+00' },
            { id: 'c2fdf77c-54e5-4746-acdf-0683a51343b7', monthly_bill_id: '92aff657-c5e2-44b9-87fd-2b849749dc2c', amount: '4545.00', payment_date: '2025-09-30', payment_type: 'cash', note: 'rgr', created_at: '2025-09-30 09:18:13.004054+00' },
            { id: '7e6f9dc9-8c20-46a4-84a1-aef146d51eb4', monthly_bill_id: '44751a4b-661f-4047-8f82-a569a228254a', amount: '7000.00', payment_date: '2025-10-02', payment_type: 'online', note: 'phonepe', created_at: '2025-10-02 09:04:34.616078+00' },
            { id: '9e2a6770-9d32-46be-95c8-7f36e584da79', monthly_bill_id: 'cc90ca55-38c7-4191-a279-b94da99e43f2', amount: '566.00', payment_date: '2025-10-02', payment_type: 'online', note: null, created_at: '2025-10-02 09:16:13.751259+00' },
            { id: '2e23192e-cc86-45bc-bc0d-14791ee7338a', monthly_bill_id: '10ee9323-3572-492e-a794-18114de07c2c', amount: '7833.00', payment_date: '2025-09-30', payment_type: 'cash', note: 'fjds', created_at: '2025-09-30 09:21:36.166772+00' },
            { id: '4d34412a-32ee-44ae-836b-047da42322b7', monthly_bill_id: 'a3fdd258-2567-4cc2-a529-d89c0e582f16', amount: '8000.00', payment_date: '2025-11-17', payment_type: 'online', note: null, created_at: '2025-11-17 15:27:31.412635+00' },
            { id: 'ba7b7146-7ee0-4f48-a0dd-407ada6d16ba', monthly_bill_id: '59b12d77-5161-4d0f-bcfd-4e07fab5dd2c', amount: '7500.00', payment_date: '2025-11-17', payment_type: 'online', note: null, created_at: '2025-11-17 15:29:22.491648+00' },
            { id: '6c148f8e-2e1c-4010-acbc-ab2c90fd781e', monthly_bill_id: '8ff13149-5fd9-4f14-b8b1-3ef5bf9a4c31', amount: '6000.00', payment_date: '2025-11-17', payment_type: 'online', note: null, created_at: '2025-11-17 15:32:39.848126+00' },
            { id: 'adcd0657-7c6e-4963-84b2-d4429112e831', monthly_bill_id: '6639cb90-6796-4663-9d86-7c6cb7894cd6', amount: '9000.00', payment_date: '2025-11-17', payment_type: 'online', note: null, created_at: '2025-11-17 15:35:55.527005+00' },
            { id: '37cf17cf-b24b-43eb-b766-4194cbf369f9', monthly_bill_id: '5b3f8748-0cf4-4039-a3c4-289d0e8c4410', amount: '10000.00', payment_date: '2025-12-01', payment_type: 'online', note: null, created_at: '2025-12-01 13:59:16.189941+00' },
            { id: 'ec34236c-e636-49b8-a39b-26a94277535c', monthly_bill_id: '2c7481c8-73b3-41fe-b7e9-a573a65840ef', amount: '690.00', payment_date: '2025-12-10', payment_type: 'cash', note: 'extra muje dene the', created_at: '2025-12-10 19:24:09.928386+00' },
            { id: '7e623499-470a-4b79-8612-3a9fa058a0f2', monthly_bill_id: '18fc2041-5dcf-47a2-927f-470d7c594ee9', amount: '10000.00', payment_date: '2025-12-11', payment_type: 'online', note: null, created_at: '2025-12-11 06:20:57.836309+00' }
        ];

        for (const p of payments) {
            await sql`
        INSERT INTO bill_payments (id, monthly_bill_id, amount, payment_date, payment_type, note, created_at)
        VALUES (${p.id}, ${p.monthly_bill_id}, ${p.amount}, ${p.payment_date}, ${p.payment_type}, ${p.note}, ${p.created_at})
        ON CONFLICT (id) DO NOTHING
      `;
        }

        console.log('✅ Bill payments imported');

        // ========================================
        // VERIFY
        // ========================================
        const counts = await sql`
      SELECT 
        (SELECT COUNT(*) FROM renters) as renter_count,
        (SELECT COUNT(*) FROM monthly_bills) as bill_count,
        (SELECT COUNT(*) FROM additional_expenses) as expense_count,
        (SELECT COUNT(*) FROM bill_payments) as payment_count
    `;

        console.log('\n========================================');
        console.log('✅ IMPORT COMPLETE!');
        console.log('========================================');
        console.log('Final counts:', counts[0]);
        console.log('\nExpected: 11 renters, 16 bills, 8 expenses, 13 payments');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }
}

main();
