export type InstallmentFrequency = 'weekly' | 'monthly';

export interface InstallmentPlan {
  id: string;
  label: string;
  totalAmount: number;
  installmentCount: number;
  frequency: InstallmentFrequency;
  startDate: string;
  accountId: string;
  categoryId: string | null;
  createdAt: string;
}

export interface InstallmentOccurrence {
  id: string;
  planId: string;
  dueDate: string;
  amount: number;
  transactionId: string | null;
}

export type NewInstallmentPlan = Omit<InstallmentPlan, 'id' | 'createdAt'>;
