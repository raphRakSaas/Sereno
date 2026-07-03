import { Account, NewAccount } from '../models/account.model';

export interface AccountRepository {
  list(): Promise<Account[]>;
  getById(id: string): Promise<Account | null>;
  create(input: NewAccount): Promise<Account>;
  update(id: string, patch: Partial<NewAccount>): Promise<Account>;
  remove(id: string): Promise<void>;
}
