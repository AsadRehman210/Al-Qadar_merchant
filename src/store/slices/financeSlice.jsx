import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { erpUrls } from "global/config";
import { erpGet, erpPost, erpPut, erpDelete, isEmptyListResponse, buildQuery } from "api/erpClient";

const initialState = {
  coaList: [],
  coaTotal: 0,
  coaLoading: false,

  journalList: [],
  journalTotal: 0,
  journalLoading: false,

  journalCurrent: null,
  journalCurrentLoading: false,

  ledgerList: [],
  ledgerTotal: 0,
  ledgerLoading: false,

  ledgerAccount: null,
  ledgerOpeningBalance: 0,
  ledgerAccountLines: [],
  ledgerClosingBalance: 0,
  ledgerAccountLoading: false,

  trialBalance: { rows: [], totalDebit: 0, totalCredit: 0 },
  trialBalanceLoading: false,

  profitAndLoss: { revenue: [], expenses: [], totalRevenue: 0, totalExpenses: 0, netProfit: 0 },
  profitAndLossLoading: false,

  balanceSheet: { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilities: 0, totalEquity: 0 },
  balanceSheetLoading: false,

  cashFlow: { openingBalance: 0, closingBalance: 0, totalIn: 0, totalOut: 0, netChange: 0, categories: [] },
  cashFlowLoading: false,

  budgetList: [],
  budgetLoading: false,

  budgetVsActual: { year: null, rows: [] },
  budgetVsActualLoading: false,

  bankAccountList: [],
  bankAccountTotal: 0,
  bankAccountLoading: false,
  bankAccountCurrent: null,

  vendorBillList: [],
  vendorBillTotal: 0,
  vendorBillLoading: false,
  vendorBillCurrent: null,
  vendorBillCurrentLoading: false,

  customerInvoiceList: [],
  customerInvoiceTotal: 0,
  customerInvoiceLoading: false,
  customerInvoiceCurrent: null,
  customerInvoiceCurrentLoading: false,

  paymentList: [],
  paymentTotal: 0,
  paymentLoading: false,

  incomeEntryList: [],
  incomeEntryTotal: 0,
  incomeEntryLoading: false,

  businessExpenseList: [],
  businessExpenseTotal: 0,
  businessExpenseLoading: false,

  vatSummary: { outputVat: 0, inputVat: 0, netVat: 0 },
  vatSummaryLoading: false,

  statementLineList: [],
  statementLineTotal: 0,
  statementLineLoading: false,

  reconciliationSessionList: [],
  reconciliationSessionTotal: 0,
  reconciliationSessionLoading: false,
};

// ─── Chart of Accounts ──────────────────────────────────────────────────────
export const fetchChartOfAccounts = createAsyncThunk(
  "finance/fetchChartOfAccounts",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 1000, ...params });
    const response = await erpGet(`${erpUrls.chartOfAccounts}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const createChartOfAccount = createAsyncThunk(
  "finance/createChartOfAccount",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.chartOfAccounts, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateChartOfAccount = createAsyncThunk(
  "finance/updateChartOfAccount",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.chartOfAccounts}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// ─── Journal Entries ────────────────────────────────────────────────────────
export const fetchJournalEntries = createAsyncThunk(
  "finance/fetchJournalEntries",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 50, ...params });
    const response = await erpGet(`${erpUrls.journalEntries}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchJournalEntryById = createAsyncThunk(
  "finance/fetchJournalEntryById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.journalEntries}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createJournalEntry = createAsyncThunk(
  "finance/createJournalEntry",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.journalEntries, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// ─── Ledger ─────────────────────────────────────────────────────────────────
export const fetchLedger = createAsyncThunk(
  "finance/fetchLedger",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 100, ...params });
    const response = await erpGet(`${erpUrls.ledger}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchLedgerByAccount = createAsyncThunk(
  "finance/fetchLedgerByAccount",
  async ({ accountId, ...params }, { rejectWithValue }) => {
    const query = buildQuery(params);
    const response = await erpGet(`${erpUrls.ledger}/account/${accountId}?${query}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// ─── Reports (Trial Balance / P&L / Balance Sheet) — all derived read-only
// views over the same ledger_line data every HR + Finance posting shares. ──
export const fetchTrialBalance = createAsyncThunk(
  "finance/fetchTrialBalance",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ ...params });
    const response = await erpGet(`${erpUrls.financeReports}/trial-balance?${query}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchProfitAndLoss = createAsyncThunk(
  "finance/fetchProfitAndLoss",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ ...params });
    const response = await erpGet(`${erpUrls.financeReports}/profit-and-loss?${query}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchBalanceSheet = createAsyncThunk(
  "finance/fetchBalanceSheet",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ ...params });
    const response = await erpGet(`${erpUrls.financeReports}/balance-sheet?${query}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchCashFlow = createAsyncThunk(
  "finance/fetchCashFlow",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ ...params });
    const response = await erpGet(`${erpUrls.financeReports}/cash-flow?${query}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// ─── Budgets — one row per account per month; getBudgetVsActual joins these
// against the same accounts' real ledger activity for the year, same
// derived-report pattern as every other Financial Reports tab. ────────────
export const fetchBudgets = createAsyncThunk(
  "finance/fetchBudgets",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ ...params });
    const response = await erpGet(`${erpUrls.budgets}?${query}`);
    if (isEmptyListResponse(response)) return [];
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result || [];
  },
);

export const upsertBudget = createAsyncThunk(
  "finance/upsertBudget",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.budgets, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const deleteBudget = createAsyncThunk(
  "finance/deleteBudget",
  async (id, { rejectWithValue }) => {
    const response = await erpDelete(`${erpUrls.budgets}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return id;
  },
);

export const fetchBudgetVsActual = createAsyncThunk(
  "finance/fetchBudgetVsActual",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ ...params });
    const response = await erpGet(`${erpUrls.budgets}/vs-actual?${query}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// ─── Bank & Cash — each account is backed 1:1 by its own Chart-of-Account
// entry; balances are always derived from ledger_line, never stored. ───────
export const fetchBankAccounts = createAsyncThunk(
  "finance/fetchBankAccounts",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 100, ...params });
    const response = await erpGet(`${erpUrls.bankAccounts}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchBankAccountById = createAsyncThunk(
  "finance/fetchBankAccountById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.bankAccounts}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createBankAccount = createAsyncThunk(
  "finance/createBankAccount",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.bankAccounts, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateBankAccount = createAsyncThunk(
  "finance/updateBankAccount",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.bankAccounts}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const postBankEntry = createAsyncThunk(
  "finance/postBankEntry",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.bankAccounts}/${id}/entry`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// ─── Payable — Vendor Bills. Approving is the only moment a bill touches
// the ledger (one multi-line journal entry); paidToDate only ever advances
// via Phase 5's shared Payment write path. ─────────────────────────────────
export const fetchVendorBills = createAsyncThunk(
  "finance/fetchVendorBills",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 50, ...params });
    const response = await erpGet(`${erpUrls.vendorBills}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchVendorBillById = createAsyncThunk(
  "finance/fetchVendorBillById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.vendorBills}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createVendorBill = createAsyncThunk(
  "finance/createVendorBill",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.vendorBills, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateVendorBill = createAsyncThunk(
  "finance/updateVendorBill",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.vendorBills}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const approveVendorBill = createAsyncThunk(
  "finance/approveVendorBill",
  async (id, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.vendorBills}/${id}/approve`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const cancelVendorBill = createAsyncThunk(
  "finance/cancelVendorBill",
  async (id, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.vendorBills}/${id}/cancel`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// ─── Receivable — Customer Invoices. Sending is the only moment an invoice
// touches the ledger (one multi-line journal entry); paidToDate only ever
// advances via Phase 5's shared Payment write path. ────────────────────────
export const fetchCustomerInvoices = createAsyncThunk(
  "finance/fetchCustomerInvoices",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 50, ...params });
    const response = await erpGet(`${erpUrls.customerInvoices}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const fetchCustomerInvoiceById = createAsyncThunk(
  "finance/fetchCustomerInvoiceById",
  async (id, { rejectWithValue }) => {
    const response = await erpGet(`${erpUrls.customerInvoices}/${id}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const createCustomerInvoice = createAsyncThunk(
  "finance/createCustomerInvoice",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.customerInvoices, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const updateCustomerInvoice = createAsyncThunk(
  "finance/updateCustomerInvoice",
  async ({ id, data }, { rejectWithValue }) => {
    const response = await erpPut(`${erpUrls.customerInvoices}/${id}`, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const sendCustomerInvoice = createAsyncThunk(
  "finance/sendCustomerInvoice",
  async (id, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.customerInvoices}/${id}/send`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const cancelCustomerInvoice = createAsyncThunk(
  "finance/cancelCustomerInvoice",
  async (id, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.customerInvoices}/${id}/cancel`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// ─── Payments — the one shared write path for every cash-in/cash-out event.
// Recording a Payment against an invoice/bill is what actually advances its
// paidToDate + status; a Payment is never edited once posted (same rule
// Journal Entries follow). ──────────────────────────────────────────────────
export const fetchPayments = createAsyncThunk(
  "finance/fetchPayments",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 50, ...params });
    const response = await erpGet(`${erpUrls.payments}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const createPayment = createAsyncThunk(
  "finance/createPayment",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.payments, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// ─── Income & Business Expense quick entries — both post immediately
// (Debit/Credit Bank vs a revenue/expense account) through the same
// journal-service engine; neither is ever edited once created. ───────────
export const fetchIncomeEntries = createAsyncThunk(
  "finance/fetchIncomeEntries",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 50, ...params });
    const response = await erpGet(`${erpUrls.incomeEntries}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const createIncomeEntry = createAsyncThunk(
  "finance/createIncomeEntry",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.incomeEntries, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchBusinessExpenses = createAsyncThunk(
  "finance/fetchBusinessExpenses",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 50, ...params });
    const response = await erpGet(`${erpUrls.businessExpenses}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const createBusinessExpense = createAsyncThunk(
  "finance/createBusinessExpense",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.businessExpenses, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// ─── VAT summary — collected-vs-paid report read directly off the VAT
// Payable/Receivable ledger accounts (same derived-report pattern as
// Financial Reports). ───────────────────────────────────────────────────────
export const fetchVatSummary = createAsyncThunk(
  "finance/fetchVatSummary",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ ...params });
    const response = await erpGet(`${erpUrls.financeReports}/vat-summary?${query}`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

// ─── Bank Reconciliation — statement lines matched by hand against that
// account's real Ledger lines; a session compares the bank's stated ending
// balance against the account's real ledger closing balance, never a
// separately-tracked number. ────────────────────────────────────────────────
export const fetchStatementLines = createAsyncThunk(
  "finance/fetchStatementLines",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 100, ...params });
    const response = await erpGet(`${erpUrls.bankStatementLines}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const createStatementLine = createAsyncThunk(
  "finance/createStatementLine",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.bankStatementLines, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const matchStatementLine = createAsyncThunk(
  "finance/matchStatementLine",
  async ({ id, ledgerLineId }, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.bankStatementLines}/${id}/match`, { ledgerLineId });
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const unmatchStatementLine = createAsyncThunk(
  "finance/unmatchStatementLine",
  async (id, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.bankStatementLines}/${id}/unmatch`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const fetchReconciliationSessions = createAsyncThunk(
  "finance/fetchReconciliationSessions",
  async (params, { rejectWithValue }) => {
    const query = buildQuery({ page: 1, limit: 20, ...params });
    const response = await erpGet(`${erpUrls.reconciliationSessions}?${query}`);
    if (isEmptyListResponse(response)) return { result: [], total_records: 0 };
    if (!response?.success) return rejectWithValue(response?.message);
    return response;
  },
);

export const createReconciliationSession = createAsyncThunk(
  "finance/createReconciliationSession",
  async (data, { rejectWithValue }) => {
    const response = await erpPost(erpUrls.reconciliationSessions, data);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

export const closeReconciliationSession = createAsyncThunk(
  "finance/closeReconciliationSession",
  async (id, { rejectWithValue }) => {
    const response = await erpPost(`${erpUrls.reconciliationSessions}/${id}/close`);
    if (!response?.success) return rejectWithValue(response?.message);
    return response.result;
  },
);

const financeSlice = createSlice({
  name: "finance",
  initialState,
  reducers: {
    clearLedgerByAccount: (state) => {
      state.ledgerAccount = null;
      state.ledgerOpeningBalance = 0;
      state.ledgerAccountLines = [];
      state.ledgerClosingBalance = 0;
    },
    clearCurrentVendorBill: (state) => {
      state.vendorBillCurrent = null;
      state.vendorBillCurrentLoading = false;
    },
    clearCurrentCustomerInvoice: (state) => {
      state.customerInvoiceCurrent = null;
      state.customerInvoiceCurrentLoading = false;
    },
    clearCurrentJournalEntry: (state) => {
      state.journalCurrent = null;
      state.journalCurrentLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChartOfAccounts.pending, (state) => {
        state.coaLoading = true;
      })
      .addCase(fetchChartOfAccounts.fulfilled, (state, action) => {
        state.coaLoading = false;
        state.coaList = action.payload.result || [];
        state.coaTotal = action.payload.total_records || 0;
      })
      .addCase(fetchChartOfAccounts.rejected, (state) => {
        state.coaLoading = false;
        state.coaList = [];
      })
      .addCase(createChartOfAccount.fulfilled, (state, action) => {
        if (action.payload) state.coaList.push(action.payload);
      })
      .addCase(updateChartOfAccount.fulfilled, (state, action) => {
        const idx = state.coaList.findIndex((a) => a.id === action.payload?.id);
        if (idx !== -1) state.coaList[idx] = action.payload;
      })

      .addCase(fetchJournalEntries.pending, (state) => {
        state.journalLoading = true;
      })
      .addCase(fetchJournalEntries.fulfilled, (state, action) => {
        state.journalLoading = false;
        state.journalList = action.payload.result || [];
        state.journalTotal = action.payload.total_records || 0;
      })
      .addCase(fetchJournalEntries.rejected, (state) => {
        state.journalLoading = false;
        state.journalList = [];
      })
      .addCase(createJournalEntry.fulfilled, (state, action) => {
        if (action.payload) state.journalList.unshift(action.payload);
      })

      .addCase(fetchJournalEntryById.pending, (state) => {
        state.journalCurrentLoading = true;
      })
      .addCase(fetchJournalEntryById.fulfilled, (state, action) => {
        state.journalCurrentLoading = false;
        state.journalCurrent = action.payload;
      })
      .addCase(fetchJournalEntryById.rejected, (state) => {
        state.journalCurrentLoading = false;
        state.journalCurrent = null;
      })

      .addCase(fetchLedger.pending, (state) => {
        state.ledgerLoading = true;
      })
      .addCase(fetchLedger.fulfilled, (state, action) => {
        state.ledgerLoading = false;
        state.ledgerList = action.payload.result || [];
        state.ledgerTotal = action.payload.total_records || 0;
      })
      .addCase(fetchLedger.rejected, (state) => {
        state.ledgerLoading = false;
        state.ledgerList = [];
      })

      .addCase(fetchLedgerByAccount.pending, (state) => {
        state.ledgerAccountLoading = true;
      })
      .addCase(fetchLedgerByAccount.fulfilled, (state, action) => {
        state.ledgerAccountLoading = false;
        state.ledgerAccount = action.payload.account;
        state.ledgerOpeningBalance = action.payload.openingBalance;
        state.ledgerAccountLines = action.payload.lines || [];
        state.ledgerClosingBalance = action.payload.closingBalance;
      })
      .addCase(fetchLedgerByAccount.rejected, (state) => {
        state.ledgerAccountLoading = false;
      })

      .addCase(fetchTrialBalance.pending, (state) => {
        state.trialBalanceLoading = true;
      })
      .addCase(fetchTrialBalance.fulfilled, (state, action) => {
        state.trialBalanceLoading = false;
        state.trialBalance = action.payload;
      })
      .addCase(fetchTrialBalance.rejected, (state) => {
        state.trialBalanceLoading = false;
      })

      .addCase(fetchProfitAndLoss.pending, (state) => {
        state.profitAndLossLoading = true;
      })
      .addCase(fetchProfitAndLoss.fulfilled, (state, action) => {
        state.profitAndLossLoading = false;
        state.profitAndLoss = action.payload;
      })
      .addCase(fetchProfitAndLoss.rejected, (state) => {
        state.profitAndLossLoading = false;
      })

      .addCase(fetchBalanceSheet.pending, (state) => {
        state.balanceSheetLoading = true;
      })
      .addCase(fetchBalanceSheet.fulfilled, (state, action) => {
        state.balanceSheetLoading = false;
        state.balanceSheet = action.payload;
      })
      .addCase(fetchBalanceSheet.rejected, (state) => {
        state.balanceSheetLoading = false;
      })

      .addCase(fetchCashFlow.pending, (state) => {
        state.cashFlowLoading = true;
      })
      .addCase(fetchCashFlow.fulfilled, (state, action) => {
        state.cashFlowLoading = false;
        state.cashFlow = action.payload;
      })
      .addCase(fetchCashFlow.rejected, (state) => {
        state.cashFlowLoading = false;
      })

      .addCase(fetchBudgets.pending, (state) => {
        state.budgetLoading = true;
      })
      .addCase(fetchBudgets.fulfilled, (state, action) => {
        state.budgetLoading = false;
        state.budgetList = action.payload || [];
      })
      .addCase(fetchBudgets.rejected, (state) => {
        state.budgetLoading = false;
        state.budgetList = [];
      })
      .addCase(upsertBudget.fulfilled, (state, action) => {
        if (!action.payload) return;
        const idx = state.budgetList.findIndex((b) => b.id === action.payload.id);
        if (idx !== -1) state.budgetList[idx] = action.payload;
        else state.budgetList.push(action.payload);
      })
      .addCase(deleteBudget.fulfilled, (state, action) => {
        state.budgetList = state.budgetList.filter((b) => b.id !== action.payload);
      })

      .addCase(fetchBudgetVsActual.pending, (state) => {
        state.budgetVsActualLoading = true;
      })
      .addCase(fetchBudgetVsActual.fulfilled, (state, action) => {
        state.budgetVsActualLoading = false;
        state.budgetVsActual = action.payload;
      })
      .addCase(fetchBudgetVsActual.rejected, (state) => {
        state.budgetVsActualLoading = false;
      })

      .addCase(fetchBankAccounts.pending, (state) => {
        state.bankAccountLoading = true;
      })
      .addCase(fetchBankAccounts.fulfilled, (state, action) => {
        state.bankAccountLoading = false;
        state.bankAccountList = action.payload.result || [];
        state.bankAccountTotal = action.payload.total_records || 0;
      })
      .addCase(fetchBankAccounts.rejected, (state) => {
        state.bankAccountLoading = false;
        state.bankAccountList = [];
      })
      .addCase(fetchBankAccountById.fulfilled, (state, action) => {
        state.bankAccountCurrent = action.payload;
      })
      .addCase(createBankAccount.fulfilled, (state, action) => {
        if (action.payload) state.bankAccountList.unshift(action.payload);
      })
      .addCase(updateBankAccount.fulfilled, (state, action) => {
        const idx = state.bankAccountList.findIndex((a) => a.id === action.payload?.id);
        if (idx !== -1) state.bankAccountList[idx] = action.payload;
        state.bankAccountCurrent = action.payload;
      })

      .addCase(fetchVendorBills.pending, (state) => {
        state.vendorBillLoading = true;
      })
      .addCase(fetchVendorBills.fulfilled, (state, action) => {
        state.vendorBillLoading = false;
        state.vendorBillList = action.payload.result || [];
        state.vendorBillTotal = action.payload.total_records || 0;
      })
      .addCase(fetchVendorBills.rejected, (state) => {
        state.vendorBillLoading = false;
        state.vendorBillList = [];
      })
      .addCase(fetchVendorBillById.pending, (state) => {
        state.vendorBillCurrentLoading = true;
      })
      .addCase(fetchVendorBillById.rejected, (state) => {
        state.vendorBillCurrentLoading = false;
      })
      .addCase(fetchVendorBillById.fulfilled, (state, action) => {
        state.vendorBillCurrentLoading = false;
        state.vendorBillCurrent = action.payload;
      })
      .addCase(createVendorBill.fulfilled, (state, action) => {
        if (action.payload) state.vendorBillList.unshift(action.payload);
      })
      .addCase(updateVendorBill.fulfilled, (state, action) => {
        const idx = state.vendorBillList.findIndex((b) => b.id === action.payload?.id);
        if (idx !== -1) state.vendorBillList[idx] = action.payload;
        state.vendorBillCurrent = action.payload;
      })
      .addCase(approveVendorBill.fulfilled, (state, action) => {
        const idx = state.vendorBillList.findIndex((b) => b.id === action.payload?.id);
        if (idx !== -1) state.vendorBillList[idx] = action.payload;
        state.vendorBillCurrent = action.payload;
      })
      .addCase(cancelVendorBill.fulfilled, (state, action) => {
        const idx = state.vendorBillList.findIndex((b) => b.id === action.payload?.id);
        if (idx !== -1) state.vendorBillList[idx] = action.payload;
        state.vendorBillCurrent = action.payload;
      })

      .addCase(fetchCustomerInvoices.pending, (state) => {
        state.customerInvoiceLoading = true;
      })
      .addCase(fetchCustomerInvoices.fulfilled, (state, action) => {
        state.customerInvoiceLoading = false;
        state.customerInvoiceList = action.payload.result || [];
        state.customerInvoiceTotal = action.payload.total_records || 0;
      })
      .addCase(fetchCustomerInvoices.rejected, (state) => {
        state.customerInvoiceLoading = false;
        state.customerInvoiceList = [];
      })
      .addCase(fetchCustomerInvoiceById.pending, (state) => {
        state.customerInvoiceCurrentLoading = true;
      })
      .addCase(fetchCustomerInvoiceById.rejected, (state) => {
        state.customerInvoiceCurrentLoading = false;
      })
      .addCase(fetchCustomerInvoiceById.fulfilled, (state, action) => {
        state.customerInvoiceCurrentLoading = false;
        state.customerInvoiceCurrent = action.payload;
      })
      .addCase(createCustomerInvoice.fulfilled, (state, action) => {
        if (action.payload) state.customerInvoiceList.unshift(action.payload);
      })
      .addCase(updateCustomerInvoice.fulfilled, (state, action) => {
        const idx = state.customerInvoiceList.findIndex((b) => b.id === action.payload?.id);
        if (idx !== -1) state.customerInvoiceList[idx] = action.payload;
        state.customerInvoiceCurrent = action.payload;
      })
      .addCase(sendCustomerInvoice.fulfilled, (state, action) => {
        const idx = state.customerInvoiceList.findIndex((b) => b.id === action.payload?.id);
        if (idx !== -1) state.customerInvoiceList[idx] = action.payload;
        state.customerInvoiceCurrent = action.payload;
      })
      .addCase(cancelCustomerInvoice.fulfilled, (state, action) => {
        const idx = state.customerInvoiceList.findIndex((b) => b.id === action.payload?.id);
        if (idx !== -1) state.customerInvoiceList[idx] = action.payload;
        state.customerInvoiceCurrent = action.payload;
      })

      .addCase(fetchPayments.pending, (state) => {
        state.paymentLoading = true;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.paymentList = action.payload.result || [];
        state.paymentTotal = action.payload.total_records || 0;
      })
      .addCase(fetchPayments.rejected, (state) => {
        state.paymentLoading = false;
        state.paymentList = [];
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        if (action.payload) state.paymentList.unshift(action.payload);
      })

      .addCase(fetchIncomeEntries.pending, (state) => {
        state.incomeEntryLoading = true;
      })
      .addCase(fetchIncomeEntries.fulfilled, (state, action) => {
        state.incomeEntryLoading = false;
        state.incomeEntryList = action.payload.result || [];
        state.incomeEntryTotal = action.payload.total_records || 0;
      })
      .addCase(fetchIncomeEntries.rejected, (state) => {
        state.incomeEntryLoading = false;
        state.incomeEntryList = [];
      })
      .addCase(createIncomeEntry.fulfilled, (state, action) => {
        if (action.payload) state.incomeEntryList.unshift(action.payload);
      })

      .addCase(fetchBusinessExpenses.pending, (state) => {
        state.businessExpenseLoading = true;
      })
      .addCase(fetchBusinessExpenses.fulfilled, (state, action) => {
        state.businessExpenseLoading = false;
        state.businessExpenseList = action.payload.result || [];
        state.businessExpenseTotal = action.payload.total_records || 0;
      })
      .addCase(fetchBusinessExpenses.rejected, (state) => {
        state.businessExpenseLoading = false;
        state.businessExpenseList = [];
      })
      .addCase(createBusinessExpense.fulfilled, (state, action) => {
        if (action.payload) state.businessExpenseList.unshift(action.payload);
      })

      .addCase(fetchVatSummary.pending, (state) => {
        state.vatSummaryLoading = true;
      })
      .addCase(fetchVatSummary.fulfilled, (state, action) => {
        state.vatSummaryLoading = false;
        state.vatSummary = action.payload;
      })
      .addCase(fetchVatSummary.rejected, (state) => {
        state.vatSummaryLoading = false;
      })

      .addCase(fetchStatementLines.pending, (state) => {
        state.statementLineLoading = true;
      })
      .addCase(fetchStatementLines.fulfilled, (state, action) => {
        state.statementLineLoading = false;
        state.statementLineList = action.payload.result || [];
        state.statementLineTotal = action.payload.total_records || 0;
      })
      .addCase(fetchStatementLines.rejected, (state) => {
        state.statementLineLoading = false;
        state.statementLineList = [];
      })
      .addCase(createStatementLine.fulfilled, (state, action) => {
        if (action.payload) state.statementLineList.unshift(action.payload);
      })
      .addCase(matchStatementLine.fulfilled, (state, action) => {
        const idx = state.statementLineList.findIndex((l) => l.id === action.payload?.id);
        if (idx !== -1) state.statementLineList[idx] = action.payload;
      })
      .addCase(unmatchStatementLine.fulfilled, (state, action) => {
        const idx = state.statementLineList.findIndex((l) => l.id === action.payload?.id);
        if (idx !== -1) state.statementLineList[idx] = action.payload;
      })

      .addCase(fetchReconciliationSessions.pending, (state) => {
        state.reconciliationSessionLoading = true;
      })
      .addCase(fetchReconciliationSessions.fulfilled, (state, action) => {
        state.reconciliationSessionLoading = false;
        state.reconciliationSessionList = action.payload.result || [];
        state.reconciliationSessionTotal = action.payload.total_records || 0;
      })
      .addCase(fetchReconciliationSessions.rejected, (state) => {
        state.reconciliationSessionLoading = false;
        state.reconciliationSessionList = [];
      })
      .addCase(createReconciliationSession.fulfilled, (state, action) => {
        if (action.payload) state.reconciliationSessionList.unshift(action.payload);
      })
      .addCase(closeReconciliationSession.fulfilled, (state, action) => {
        const idx = state.reconciliationSessionList.findIndex((s) => s.id === action.payload?.id);
        if (idx !== -1) state.reconciliationSessionList[idx] = action.payload;
      });
  },
});

export const {
  clearLedgerByAccount,
  clearCurrentVendorBill,
  clearCurrentCustomerInvoice,
  clearCurrentJournalEntry,
} = financeSlice.actions;

export const showChartOfAccounts = (state) => state.finance.coaList;
export const showChartOfAccountsTotal = (state) => state.finance.coaTotal;
export const showChartOfAccountsLoading = (state) => state.finance.coaLoading;

export const showJournalEntries = (state) => state.finance.journalList;
export const showJournalEntriesTotal = (state) => state.finance.journalTotal;
export const showJournalEntriesLoading = (state) => state.finance.journalLoading;
export const showCurrentJournalEntry = (state) => state.finance.journalCurrent;
export const showCurrentJournalEntryLoading = (state) => state.finance.journalCurrentLoading;

export const showLedger = (state) => state.finance.ledgerList;
export const showLedgerTotal = (state) => state.finance.ledgerTotal;
export const showLedgerLoading = (state) => state.finance.ledgerLoading;

export const showLedgerAccount = (state) => state.finance.ledgerAccount;
export const showLedgerOpeningBalance = (state) => state.finance.ledgerOpeningBalance;
export const showLedgerAccountLines = (state) => state.finance.ledgerAccountLines;
export const showLedgerClosingBalance = (state) => state.finance.ledgerClosingBalance;
export const showLedgerAccountLoading = (state) => state.finance.ledgerAccountLoading;

export const showTrialBalance = (state) => state.finance.trialBalance;
export const showTrialBalanceLoading = (state) => state.finance.trialBalanceLoading;
export const showProfitAndLoss = (state) => state.finance.profitAndLoss;
export const showProfitAndLossLoading = (state) => state.finance.profitAndLossLoading;
export const showBalanceSheet = (state) => state.finance.balanceSheet;
export const showBalanceSheetLoading = (state) => state.finance.balanceSheetLoading;
export const showCashFlow = (state) => state.finance.cashFlow;
export const showCashFlowLoading = (state) => state.finance.cashFlowLoading;

export const showBudgets = (state) => state.finance.budgetList;
export const showBudgetsLoading = (state) => state.finance.budgetLoading;

export const showBudgetVsActual = (state) => state.finance.budgetVsActual;
export const showBudgetVsActualLoading = (state) => state.finance.budgetVsActualLoading;

export const showBankAccounts = (state) => state.finance.bankAccountList;
export const showBankAccountsTotal = (state) => state.finance.bankAccountTotal;
export const showBankAccountsLoading = (state) => state.finance.bankAccountLoading;
export const showCurrentBankAccount = (state) => state.finance.bankAccountCurrent;

export const showVendorBills = (state) => state.finance.vendorBillList;
export const showVendorBillsTotal = (state) => state.finance.vendorBillTotal;
export const showVendorBillsLoading = (state) => state.finance.vendorBillLoading;
export const showCurrentVendorBill = (state) => state.finance.vendorBillCurrent;
export const showCurrentVendorBillLoading = (state) => state.finance.vendorBillCurrentLoading;

export const showCustomerInvoices = (state) => state.finance.customerInvoiceList;
export const showCustomerInvoicesTotal = (state) => state.finance.customerInvoiceTotal;
export const showCustomerInvoicesLoading = (state) => state.finance.customerInvoiceLoading;
export const showCurrentCustomerInvoice = (state) => state.finance.customerInvoiceCurrent;
export const showCurrentCustomerInvoiceLoading = (state) => state.finance.customerInvoiceCurrentLoading;

export const showPayments = (state) => state.finance.paymentList;
export const showPaymentsTotal = (state) => state.finance.paymentTotal;
export const showPaymentsLoading = (state) => state.finance.paymentLoading;

export const showIncomeEntries = (state) => state.finance.incomeEntryList;
export const showIncomeEntriesTotal = (state) => state.finance.incomeEntryTotal;
export const showIncomeEntriesLoading = (state) => state.finance.incomeEntryLoading;

export const showBusinessExpenses = (state) => state.finance.businessExpenseList;
export const showBusinessExpensesTotal = (state) => state.finance.businessExpenseTotal;
export const showBusinessExpensesLoading = (state) => state.finance.businessExpenseLoading;

export const showVatSummary = (state) => state.finance.vatSummary;
export const showVatSummaryLoading = (state) => state.finance.vatSummaryLoading;

export const showStatementLines = (state) => state.finance.statementLineList;
export const showStatementLinesTotal = (state) => state.finance.statementLineTotal;
export const showStatementLinesLoading = (state) => state.finance.statementLineLoading;

export const showReconciliationSessions = (state) => state.finance.reconciliationSessionList;
export const showReconciliationSessionsTotal = (state) => state.finance.reconciliationSessionTotal;
export const showReconciliationSessionsLoading = (state) => state.finance.reconciliationSessionLoading;

export default financeSlice.reducer;
