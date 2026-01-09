import { db } from '@/db';
import {
    renters,
    payments,
    monthlyBills,
    additionalExpenses,
    billPayments,
    Renter,
    NewRenter,
    MonthlyBill,
    NewMonthlyBill,
    AdditionalExpense,
    NewAdditionalExpense,
    BillPayment,
    NewBillPayment,
} from '@/db/schema';
import { eq, and, desc, sql, sum, inArray } from 'drizzle-orm';

// ============================================================================
// TYPES
// ============================================================================

export interface MonthlyBillData {
    id?: string;
    user_id?: string;
    renter_id: number;
    month: number;
    year: number;
    rent_amount: number;

    electricity_enabled: boolean;
    electricity_initial_reading: number;
    electricity_final_reading: number;
    electricity_multiplier: number;
    electricity_reading_date?: string;
    electricity_amount: number;

    motor_enabled: boolean;
    motor_initial_reading: number;
    motor_final_reading: number;
    motor_multiplier: number;
    motor_number_of_people: number;
    motor_reading_date?: string;
    motor_amount: number;

    water_enabled: boolean;
    water_amount: number;

    maintenance_enabled: boolean;
    maintenance_amount: number;

    total_amount: number;
    total_payments: number;
    pending_amount: number;

    created_at?: string;
    updated_at?: string;
}

export interface AdditionalExpenseData {
    id?: string;
    monthly_bill_id: string;
    description: string;
    amount: number;
    date: string;
    created_at?: string;
}

export interface BillPaymentData {
    id?: string;
    monthly_bill_id: string;
    amount: number;
    payment_date: string;
    payment_type: 'cash' | 'online';
    note?: string;
    created_at?: string;
}

export interface BillWithDetails {
    bill: MonthlyBillData | null;
    expenses: AdditionalExpenseData[];
    payments: BillPaymentData[];
    previous_readings: {
        electricity_final: number;
        motor_final: number;
        pending_amount: number;
    };
}

export interface SaveBillResult {
    bill_id: string;
    expense_ids: string[];
    payment_ids: string[];
    success: boolean;
}

export interface DashboardSummary {
    active_renters: RenterData[];
    archived_renters: RenterData[];
    metrics: {
        total_renters: number;
        total_monthly_rent: number;
        pending_amount: number;
    };
}

export interface RenterData {
    id: number;
    user_id: string;
    name: string;
    email: string | null;
    phone: string | null;
    property_address: string | null;
    monthly_rent: number;
    move_in_date: string | null;
    is_active: boolean;
    created_at: string | null;
    total_pending?: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function toRenterData(renter: Renter, totalPending: number = 0): RenterData {
    return {
        id: renter.id,
        user_id: renter.userId,
        name: renter.name,
        email: renter.email,
        phone: renter.phone,
        property_address: renter.propertyAddress,
        monthly_rent: parseFloat(renter.monthlyRent || '0'),
        move_in_date: renter.moveInDate,
        is_active: renter.isActive ?? true,
        created_at: renter.createdAt?.toISOString() ?? null,
        total_pending: totalPending,
    };
}

function toBillData(bill: MonthlyBill): MonthlyBillData {
    return {
        id: bill.id,
        user_id: bill.userId,
        renter_id: bill.renterId,
        month: bill.month,
        year: bill.year,
        rent_amount: parseFloat(bill.rentAmount || '0'),
        electricity_enabled: bill.electricityEnabled ?? false,
        electricity_initial_reading: bill.electricityInitialReading ?? 0,
        electricity_final_reading: bill.electricityFinalReading ?? 0,
        electricity_multiplier: parseFloat(bill.electricityMultiplier || '9'),
        electricity_reading_date: bill.electricityReadingDate ?? undefined,
        electricity_amount: parseFloat(bill.electricityAmount || '0'),
        motor_enabled: bill.motorEnabled ?? false,
        motor_initial_reading: bill.motorInitialReading ?? 0,
        motor_final_reading: bill.motorFinalReading ?? 0,
        motor_multiplier: parseFloat(bill.motorMultiplier || '9'),
        motor_number_of_people: bill.motorNumberOfPeople ?? 2,
        motor_reading_date: bill.motorReadingDate ?? undefined,
        motor_amount: parseFloat(bill.motorAmount || '0'),
        water_enabled: bill.waterEnabled ?? false,
        water_amount: parseFloat(bill.waterAmount || '0'),
        maintenance_enabled: bill.maintenanceEnabled ?? false,
        maintenance_amount: parseFloat(bill.maintenanceAmount || '0'),
        total_amount: parseFloat(bill.totalAmount || '0'),
        total_payments: parseFloat(bill.totalPayments || '0'),
        pending_amount: parseFloat(bill.pendingAmount || '0'),
        created_at: bill.createdAt?.toISOString(),
        updated_at: bill.updatedAt?.toISOString(),
    };
}

function toExpenseData(expense: AdditionalExpense): AdditionalExpenseData {
    return {
        id: expense.id,
        monthly_bill_id: expense.monthlyBillId,
        description: expense.description,
        amount: parseFloat(expense.amount),
        date: expense.date ?? new Date().toISOString().split('T')[0],
        created_at: expense.createdAt?.toISOString(),
    };
}

function toPaymentData(payment: BillPayment): BillPaymentData {
    return {
        id: payment.id,
        monthly_bill_id: payment.monthlyBillId,
        amount: parseFloat(payment.amount),
        payment_date: payment.paymentDate ?? new Date().toISOString().split('T')[0],
        payment_type: (payment.paymentType as 'cash' | 'online') ?? 'cash',
        note: payment.note ?? undefined,
        created_at: payment.createdAt?.toISOString(),
    };
}

// ============================================================================
// DATABASE SERVICE
// ============================================================================

export class DbService {
    // -------------------------------------------------------------------------
    // RENTER OPERATIONS
    // -------------------------------------------------------------------------

    static async insertRenter(
        renter: Omit<RenterData, 'id' | 'created_at'>,
        userId: string
    ): Promise<number> {
        try {
            const [newRenter] = await db
                .insert(renters)
                .values({
                    userId,
                    name: renter.name,
                    email: renter.email,
                    phone: renter.phone,
                    propertyAddress: renter.property_address,
                    monthlyRent: String(renter.monthly_rent),
                    moveInDate: renter.move_in_date,
                    isActive: renter.is_active,
                })
                .returning({ id: renters.id });

            return newRenter.id;
        } catch (error) {
            console.error('Error inserting renter:', error);
            throw new Error(`Failed to add renter: ${error}`);
        }
    }

    static async getAllRenters(userId: string): Promise<RenterData[]> {
        try {
            const result = await db
                .select({
                    renter: renters,
                    totalPending: sql<string>`coalesce(sum(${monthlyBills.pendingAmount}), 0)`,
                })
                .from(renters)
                .leftJoin(monthlyBills, eq(renters.id, monthlyBills.renterId))
                .where(eq(renters.userId, userId))
                .groupBy(renters.id)
                .orderBy(desc(renters.createdAt));

            return result.map(({ renter, totalPending }) =>
                toRenterData(renter, parseFloat(totalPending))
            );
        } catch (error) {
            console.error('Error fetching renters:', error);
            return [];
        }
    }

    static async getActiveRenters(userId: string): Promise<RenterData[]> {
        try {
            const result = await db
                .select({
                    renter: renters,
                    totalPending: sql<string>`coalesce(sum(${monthlyBills.pendingAmount}), 0)`,
                })
                .from(renters)
                .leftJoin(monthlyBills, eq(renters.id, monthlyBills.renterId))
                .where(and(eq(renters.userId, userId), eq(renters.isActive, true)))
                .groupBy(renters.id)
                .orderBy(
                    desc(sql`CAST(${renters.monthlyRent} AS DECIMAL)`),
                    desc(renters.createdAt)
                );

            return result.map(({ renter, totalPending }) =>
                toRenterData(renter, parseFloat(totalPending))
            );
        } catch (error) {
            console.error('Error fetching active renters:', error);
            return [];
        }
    }

    static async getArchivedRenters(userId: string): Promise<RenterData[]> {
        try {
            const result = await db
                .select({
                    renter: renters,
                    totalPending: sql<string>`coalesce(sum(${monthlyBills.pendingAmount}), 0)`,
                })
                .from(renters)
                .leftJoin(monthlyBills, eq(renters.id, monthlyBills.renterId))
                .where(and(eq(renters.userId, userId), eq(renters.isActive, false)))
                .groupBy(renters.id)
                .orderBy(desc(renters.createdAt));

            return result.map(({ renter, totalPending }) =>
                toRenterData(renter, parseFloat(totalPending))
            );
        } catch (error) {
            console.error('Error fetching archived renters:', error);
            return [];
        }
    }

    static async getRenterById(id: number): Promise<RenterData | null> {
        try {
            const [renter] = await db
                .select()
                .from(renters)
                .where(eq(renters.id, id))
                .limit(1);

            return renter ? toRenterData(renter) : null;
        } catch (error) {
            console.error('Error fetching renter:', error);
            return null;
        }
    }

    static async setRenterActive(
        renterId: string,
        isActive: boolean,
        userId: string
    ): Promise<void> {
        try {
            const numericId = parseInt(renterId, 10);
            if (isNaN(numericId)) {
                throw new Error('Invalid renter ID format');
            }

            await db
                .update(renters)
                .set({ isActive })
                .where(and(eq(renters.id, numericId), eq(renters.userId, userId)));
        } catch (error) {
            console.error(`Error setting renter active status to ${isActive}:`, error);
            throw new Error('Failed to update renter status.');
        }
    }

    static async deleteRenter(renterId: string, userId: string): Promise<void> {
        try {
            const numericId = parseInt(renterId, 10);
            if (isNaN(numericId)) {
                throw new Error('Invalid renter ID format');
            }

            await db
                .delete(renters)
                .where(and(eq(renters.id, numericId), eq(renters.userId, userId)));
        } catch (error) {
            console.error('Error deleting renter:', error);
            throw new Error(
                `Failed to delete renter: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    // -------------------------------------------------------------------------
    // DASHBOARD OPERATIONS
    // -------------------------------------------------------------------------

    static async getTotalMonthlyRent(userId: string): Promise<number> {
        try {
            const result = await db
                .select({ total: sum(renters.monthlyRent) })
                .from(renters)
                .where(and(eq(renters.userId, userId), eq(renters.isActive, true)));

            return parseFloat(result[0]?.total || '0');
        } catch (error) {
            console.error('Error calculating total monthly rent:', error);
            return 0;
        }
    }

    static async getDashboardSummary(userId: string): Promise<DashboardSummary> {
        try {
            // Fetch active and archived renters in parallel
            const [activeRenters, archivedRenters] = await Promise.all([
                this.getActiveRenters(userId),
                this.getArchivedRenters(userId),
            ]);

            // Calculate metrics
            const totalMonthlyRent = activeRenters.reduce(
                (sum, r) => sum + r.monthly_rent,
                0
            );

            // Get pending amount from all bills
            const pendingResult = await db
                .select({ total: sum(monthlyBills.pendingAmount) })
                .from(monthlyBills)
                .where(eq(monthlyBills.userId, userId));

            const pendingAmount = parseFloat(pendingResult[0]?.total || '0');

            return {
                active_renters: activeRenters,
                archived_renters: archivedRenters,
                metrics: {
                    total_renters: activeRenters.length,
                    total_monthly_rent: totalMonthlyRent,
                    pending_amount: pendingAmount,
                },
            };
        } catch (error) {
            console.error('Error fetching dashboard summary:', error);
            return {
                active_renters: [],
                archived_renters: [],
                metrics: {
                    total_renters: 0,
                    total_monthly_rent: 0,
                    pending_amount: 0,
                },
            };
        }
    }

    // -------------------------------------------------------------------------
    // MONTHLY BILL OPERATIONS
    // -------------------------------------------------------------------------

    static async getMonthlyBill(
        renterId: number,
        month: number,
        year: number,
        userId: string
    ): Promise<MonthlyBillData | null> {
        try {
            const [bill] = await db
                .select()
                .from(monthlyBills)
                .where(
                    and(
                        eq(monthlyBills.renterId, renterId),
                        eq(monthlyBills.month, month),
                        eq(monthlyBills.year, year),
                        eq(monthlyBills.userId, userId)
                    )
                )
                .limit(1);

            return bill ? toBillData(bill) : null;
        } catch (error) {
            console.error('Error fetching monthly bill:', error);
            return null;
        }
    }

    static async getPreviousMonthBill(
        renterId: number,
        month: number,
        year: number,
        userId: string
    ): Promise<MonthlyBillData | null> {
        let prevMonth = month - 1;
        let prevYear = year;

        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear = year - 1;
        }

        return this.getMonthlyBill(renterId, prevMonth, prevYear, userId);
    }

    static async saveMonthlyBill(
        bill: MonthlyBillData,
        userId: string
    ): Promise<string> {
        try {
            const [result] = await db
                .insert(monthlyBills)
                .values({
                    userId,
                    renterId: bill.renter_id,
                    month: bill.month,
                    year: bill.year,
                    rentAmount: String(bill.rent_amount),
                    electricityEnabled: bill.electricity_enabled,
                    electricityInitialReading: bill.electricity_initial_reading,
                    electricityFinalReading: bill.electricity_final_reading,
                    electricityMultiplier: String(bill.electricity_multiplier),
                    electricityReadingDate: bill.electricity_reading_date,
                    electricityAmount: String(bill.electricity_amount),
                    motorEnabled: bill.motor_enabled,
                    motorInitialReading: bill.motor_initial_reading,
                    motorFinalReading: bill.motor_final_reading,
                    motorMultiplier: String(bill.motor_multiplier),
                    motorNumberOfPeople: bill.motor_number_of_people,
                    motorReadingDate: bill.motor_reading_date,
                    motorAmount: String(bill.motor_amount),
                    waterEnabled: bill.water_enabled,
                    waterAmount: String(bill.water_amount),
                    maintenanceEnabled: bill.maintenance_enabled,
                    maintenanceAmount: String(bill.maintenance_amount),
                    totalAmount: String(bill.total_amount),
                    totalPayments: String(bill.total_payments),
                    pendingAmount: String(bill.pending_amount),
                })
                .onConflictDoUpdate({
                    target: [monthlyBills.renterId, monthlyBills.month, monthlyBills.year],
                    set: {
                        rentAmount: String(bill.rent_amount),
                        electricityEnabled: bill.electricity_enabled,
                        electricityInitialReading: bill.electricity_initial_reading,
                        electricityFinalReading: bill.electricity_final_reading,
                        electricityMultiplier: String(bill.electricity_multiplier),
                        electricityReadingDate: bill.electricity_reading_date,
                        electricityAmount: String(bill.electricity_amount),
                        motorEnabled: bill.motor_enabled,
                        motorInitialReading: bill.motor_initial_reading,
                        motorFinalReading: bill.motor_final_reading,
                        motorMultiplier: String(bill.motor_multiplier),
                        motorNumberOfPeople: bill.motor_number_of_people,
                        motorReadingDate: bill.motor_reading_date,
                        motorAmount: String(bill.motor_amount),
                        waterEnabled: bill.water_enabled,
                        waterAmount: String(bill.water_amount),
                        maintenanceEnabled: bill.maintenance_enabled,
                        maintenanceAmount: String(bill.maintenance_amount),
                        totalAmount: String(bill.total_amount),
                        totalPayments: String(bill.total_payments),
                        pendingAmount: String(bill.pending_amount),
                        updatedAt: new Date(),
                    },
                })
                .returning({ id: monthlyBills.id });

            return result.id;
        } catch (error) {
            console.error('Error saving monthly bill:', error);
            throw new Error(`Failed to save monthly bill: ${error}`);
        }
    }

    // -------------------------------------------------------------------------
    // ADDITIONAL EXPENSES
    // -------------------------------------------------------------------------

    static async getAdditionalExpenses(
        monthlyBillId: string
    ): Promise<AdditionalExpenseData[]> {
        try {
            const result = await db
                .select()
                .from(additionalExpenses)
                .where(eq(additionalExpenses.monthlyBillId, monthlyBillId))
                .orderBy(desc(additionalExpenses.createdAt));

            return result.map(toExpenseData);
        } catch (error) {
            console.error('Error fetching additional expenses:', error);
            return [];
        }
    }

    static async saveAdditionalExpense(
        expense: Omit<AdditionalExpenseData, 'id' | 'created_at'>
    ): Promise<string> {
        try {
            const [result] = await db
                .insert(additionalExpenses)
                .values({
                    monthlyBillId: expense.monthly_bill_id,
                    description: expense.description,
                    amount: String(expense.amount),
                    date: expense.date,
                })
                .returning({ id: additionalExpenses.id });

            return result.id;
        } catch (error) {
            console.error('Error saving additional expense:', error);
            throw new Error(`Failed to save additional expense: ${error}`);
        }
    }

    static async deleteExpensesByBillId(billId: string): Promise<void> {
        await db
            .delete(additionalExpenses)
            .where(eq(additionalExpenses.monthlyBillId, billId));
    }

    // -------------------------------------------------------------------------
    // BILL PAYMENTS
    // -------------------------------------------------------------------------

    static async getBillPayments(
        monthlyBillId: string
    ): Promise<BillPaymentData[]> {
        try {
            const result = await db
                .select()
                .from(billPayments)
                .where(eq(billPayments.monthlyBillId, monthlyBillId))
                .orderBy(desc(billPayments.createdAt));

            return result.map(toPaymentData);
        } catch (error) {
            console.error('Error fetching bill payments:', error);
            return [];
        }
    }

    static async saveBillPayment(
        payment: Omit<BillPaymentData, 'id' | 'created_at'>
    ): Promise<string> {
        try {
            const [result] = await db
                .insert(billPayments)
                .values({
                    monthlyBillId: payment.monthly_bill_id,
                    amount: String(payment.amount),
                    paymentDate: payment.payment_date,
                    paymentType: payment.payment_type,
                    note: payment.note,
                })
                .returning({ id: billPayments.id });

            return result.id;
        } catch (error) {
            console.error('Error saving bill payment:', error);
            throw new Error(`Failed to save bill payment: ${error}`);
        }
    }

    static async deletePaymentsByBillId(billId: string): Promise<void> {
        await db
            .delete(billPayments)
            .where(eq(billPayments.monthlyBillId, billId));
    }

    // -------------------------------------------------------------------------
    // OPTIMIZED COMPOUND OPERATIONS
    // -------------------------------------------------------------------------

    static async getBillWithDetails(
        renterId: number,
        month: number,
        year: number,
        userId: string
    ): Promise<BillWithDetails> {
        try {
            // Fetch bill and previous bill in parallel
            const [bill, previousBill] = await Promise.all([
                this.getMonthlyBill(renterId, month, year, userId),
                this.getPreviousMonthBill(renterId, month, year, userId),
            ]);

            if (!bill) {
                return {
                    bill: null,
                    expenses: [],
                    payments: [],
                    previous_readings: {
                        electricity_final: previousBill?.electricity_final_reading || 0,
                        motor_final: previousBill?.motor_final_reading || 0,
                        pending_amount: parseFloat(String(previousBill?.pending_amount || 0)),
                    },
                };
            }

            // Fetch expenses and payments in parallel
            const [expenses, payments] = await Promise.all([
                this.getAdditionalExpenses(bill.id!),
                this.getBillPayments(bill.id!),
            ]);

            return {
                bill,
                expenses,
                payments,
                previous_readings: {
                    electricity_final: previousBill?.electricity_final_reading || 0,
                    motor_final: previousBill?.motor_final_reading || 0,
                    pending_amount: parseFloat(String(previousBill?.pending_amount || 0)),
                },
            };
        } catch (error) {
            console.error('Error fetching bill with details:', error);
            throw new Error(
                `Failed to fetch bill details: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    static async getAllBillsWithDetails(
        renterId: number,
        userId: string
    ): Promise<BillWithDetails[]> {
        try {
            // 1. Fetch all bills
            const bills = await db
                .select()
                .from(monthlyBills)
                .where(and(eq(monthlyBills.renterId, renterId), eq(monthlyBills.userId, userId)))
                .orderBy(desc(monthlyBills.year), desc(monthlyBills.month));

            if (bills.length === 0) return [];

            const billIds = bills.map((b) => b.id);

            // 2. Fetch all expenses
            const allExpenses = await db
                .select()
                .from(additionalExpenses)
                .where(inArray(additionalExpenses.monthlyBillId, billIds));

            // 3. Fetch all payments
            const allPayments = await db
                .select()
                .from(billPayments)
                .where(inArray(billPayments.monthlyBillId, billIds));

            // 4. Map back
            return bills.map((bill) => {
                const myExpenses = allExpenses.filter(
                    (e) => e.monthlyBillId === bill.id
                );
                const myPayments = allPayments.filter(
                    (p) => p.monthlyBillId === bill.id
                );
                return {
                    bill: toBillData(bill),
                    expenses: myExpenses.map(toExpenseData),
                    payments: myPayments.map(toPaymentData),
                    // Not needed for cache display of existing bills
                    previous_readings: { electricity_final: 0, motor_final: 0, pending_amount: 0 },
                };
            });
        } catch (error) {
            console.error('Error fetching all bills with details:', error);
            // Don't crash, just return empty
            return [];
        }
    }

    static async saveBillComplete(
        billData: MonthlyBillData,
        expenses: AdditionalExpenseData[],
        paymentsData: BillPaymentData[],
        userId: string
    ): Promise<SaveBillResult> {
        try {
            // Save bill first to get bill ID
            const billId = await this.saveMonthlyBill(billData, userId);

            // Delete old expenses and payments, then insert new ones
            await Promise.all([
                this.deleteExpensesByBillId(billId),
                this.deletePaymentsByBillId(billId),
            ]);

            // Insert new expenses and payments
            const expenseIds: string[] = [];
            const paymentIds: string[] = [];

            for (const expense of expenses) {
                const id = await this.saveAdditionalExpense({
                    ...expense,
                    monthly_bill_id: billId,
                });
                expenseIds.push(id);
            }

            for (const payment of paymentsData) {
                const id = await this.saveBillPayment({
                    ...payment,
                    monthly_bill_id: billId,
                });
                paymentIds.push(id);
            }

            return {
                bill_id: billId,
                expense_ids: expenseIds,
                payment_ids: paymentIds,
                success: true,
            };
        } catch (error) {
            console.error('Error saving bill complete:', error);
            throw new Error(
                `Failed to save bill: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    // -------------------------------------------------------------------------
    // UTILITY OPERATIONS
    // -------------------------------------------------------------------------

    static async testConnection(): Promise<void> {
        try {
            const result = await db.select({ count: sql`1` }).from(renters).limit(1);
            console.log('✅ Neon connection successful!');
        } catch (error) {
            console.error('❌ Neon connection failed:', error);
            throw error;
        }
    }
}
