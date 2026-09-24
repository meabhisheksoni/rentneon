/**
 * API Client Service
 * Replaces SupabaseService for frontend components.
 * Calls the Next.js API routes which use DbService on the server.
 */

import { RenterData, DashboardSummary, BillWithDetails, MonthlyBillData, AdditionalExpenseData, BillPaymentData, SaveBillResult } from './dbService';

// Re-export types for compatibility
export type { RenterData as Renter };
export type { MonthlyBillData as MonthlyBill };
export type { AdditionalExpenseData as AdditionalExpense };
export type { BillPaymentData as BillPayment };
export type { BillWithDetails };
export type { SaveBillResult };
export type { DashboardSummary };

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
}

export class ApiService {
    // Dashboard
    static async getDashboardSummary(): Promise<DashboardSummary> {
        const response = await fetch('/api/dashboard');
        return handleResponse<DashboardSummary>(response);
    }

    // Renters
    static async getActiveRenters(): Promise<RenterData[]> {
        const response = await fetch('/api/renters');
        return handleResponse<RenterData[]>(response);
    }

    static async insertRenter(renter: Partial<RenterData>): Promise<number> {
        const response = await fetch('/api/renters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(renter),
        });
        const data = await handleResponse<{ id: number }>(response);
        return data.id;
    }

    static async setRenterActive(renterId: string, isActive: boolean): Promise<void> {
        const response = await fetch(`/api/renters/${renterId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: isActive }),
        });
        await handleResponse(response);
    }

    static async updateRenter(
        renterId: string | number,
        updates: Partial<RenterData>
    ): Promise<RenterData> {
        const response = await fetch(`/api/renters/${renterId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        const data = await handleResponse<{ success: boolean; renter: RenterData }>(response);
        return data.renter;
    }

    static async deleteRenter(renterId: string): Promise<void> {
        const response = await fetch(`/api/renters/${renterId}`, {
            method: 'DELETE',
        });
        await handleResponse(response);
    }

    // Bills
    static async getBillWithDetails(
        renterId: number,
        month: number,
        year: number
    ): Promise<BillWithDetails> {
        const response = await fetch(
            `/api/bills?renterId=${renterId}&month=${month}&year=${year}`
        );
        return handleResponse<BillWithDetails>(response);
    }

    static async getAllBills(renterId: number): Promise<BillWithDetails[]> {
        const response = await fetch(`/api/renters/${renterId}/bills`);
        return handleResponse<BillWithDetails[]>(response);
    }

    static async saveBillComplete(
        bill: MonthlyBillData,
        expenses: AdditionalExpenseData[],
        payments: BillPaymentData[]
    ): Promise<SaveBillResult> {
        const response = await fetch('/api/bills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bill, expenses, payments }),
        });
        return handleResponse<SaveBillResult>(response);
    }

    // Compatibility methods (maintaining SupabaseService interface)
    static async getMonthlyBill(
        renterId: number,
        month: number,
        year: number
    ): Promise<MonthlyBillData | null> {
        const data = await this.getBillWithDetails(renterId, month, year);
        return data.bill;
    }

    static async saveMonthlyBill(bill: MonthlyBillData): Promise<string> {
        const result = await this.saveBillComplete(bill, [], []);
        return result.bill_id;
    }

    static async getAdditionalExpenses(
        monthlyBillId: string
    ): Promise<AdditionalExpenseData[]> {
        // This is fetched as part of getBillWithDetails
        // For standalone calls, we'd need a separate endpoint
        console.warn('getAdditionalExpenses should use getBillWithDetails instead');
        return [];
    }

    static async getBillPayments(
        monthlyBillId: string
    ): Promise<BillPaymentData[]> {
        // This is fetched as part of getBillWithDetails
        console.warn('getBillPayments should use getBillWithDetails instead');
        return [];
    }

    // Test connection (no-op for API client)
    static async testConnection(): Promise<void> {
        console.log('✅ API client initialized');
    }
}

// Export as SupabaseService for backward compatibility during migration
export { ApiService as SupabaseService };
