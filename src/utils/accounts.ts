export interface StoredAccount {
  passwordHash: string;
}

const KEY = "ephemeris-accounts";

export function getAccounts(): Record<string, StoredAccount> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function saveAccounts(accounts: Record<string, StoredAccount>) {
  localStorage.setItem(KEY, JSON.stringify(accounts));
}
