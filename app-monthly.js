// ========== APP STATE ==========
var transactions = JSON.parse(localStorage.getItem('transactions')) || [];
var budgets = JSON.parse(localStorage.getItem('budgets')) || {
    food: 500000, transport: 300000, bills: 500000, study: 400000,
    entertainment: 200000, shopping: 300000, health: 200000, other: 200000
};

const EXPENSE_CATEGORIES = ['food', 'transport', 'bills', 'study', 'entertainment', 'shopping', 'health', 'other'];
const INCOME_CATEGORIES  = ['salary', 'freelance', 'bonus', 'investment', 'gift', 'other'];
const ALL_KNOWN_CATEGORIES = ['food', 'transport', 'bills', 'study', 'entertainment', 'shopping', 'health', 'salary', 'freelance', 'bonus', 'investment', 'gift', 'other'];

let expenseCategoryChart;
let monthlyExpenseChart;
let incomeExpenseChart;
let savingRateChart;

// Month/Year selection state
let currentView = 'monthly'; // 'monthly' or 'alltime'
let selectedMonth = new Date().getMonth();
let selectedYear = new Date().getFullYear();

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', function() {
    setTodayDate();
    renderCategoryPicker();
    populateCategoryFilterDropdown();
    populateMonthYearSelectors();
    updateDashboards();
    renderTransactions();
    renderBudgetForm();
    showDailyQuote();
    initEventListeners();
    updatePeriodLabels();
});

function formatCategoryName(cat) {
    const s = String(cat || 'other');
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function getCategoryBadge(cat) {
    if (typeof window.getCategoryBadgeHtml === 'function') {
        return window.getCategoryBadgeHtml(cat);
    }
    return '';
}

function renderCategoryPicker() {
    const grid = document.getElementById('categoryPickerGrid');
    const hiddenInput = document.getElementById('category');
    const typeSelect = document.getElementById('type');
    const labelEl = document.getElementById('categoryPickerLabel');
    if (!grid || !hiddenInput) return;

    const currentType = typeSelect ? typeSelect.value : 'expense';
    const categories = currentType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    if (labelEl) {
        labelEl.textContent = currentType === 'income' ? 'Category (Income)' : 'Category (Expense)';
    }

    if (!categories.includes(hiddenInput.value)) {
        hiddenInput.value = categories[0];
    }

    const currentVal = hiddenInput.value;
    grid.innerHTML = categories.map(cat => `
        <div class="category-pill ${cat === currentVal ? 'active' : ''}" data-cat="${cat}">
            ${getCategoryBadge(cat)}
            <span>${formatCategoryName(cat)}</span>
        </div>
    `).join('');

    grid.querySelectorAll('.category-pill').forEach(pill => {
        pill.addEventListener('click', function() {
            const selected = this.getAttribute('data-cat');
            hiddenInput.value = selected;
            grid.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function populateCategoryFilterDropdown() {
    const filterEl = document.getElementById('txnCategoryFilter');
    if (!filterEl) return;
    filterEl.innerHTML = '<option value="all">All Categories</option>' +
        ALL_KNOWN_CATEGORIES.map(c => `<option value="${c}">${formatCategoryName(c)}</option>`).join('');
}

function initEventListeners() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.getAttribute('data-tab'), this);
        });
    });

    const typeSelect = document.getElementById('type');
    if (typeSelect) {
        typeSelect.addEventListener('change', renderCategoryPicker);
    }

    document.getElementById('transactionForm').addEventListener('submit', handleFormSubmit);

    // Month/Year change listeners
    document.getElementById('monthSelect').addEventListener('change', function() {
        selectedMonth = parseInt(this.value, 10);
        updateDashboards();
        renderTransactions();
        updatePeriodLabels();
        updateBudgetStatus();
        if (document.getElementById('analyticsTab')?.classList.contains('active')) renderAnalytics();
    });

    document.getElementById('yearSelect').addEventListener('change', function() {
        selectedYear = parseInt(this.value, 10);
        updateDashboards();
        renderTransactions();
        updatePeriodLabels();
        updateBudgetStatus();
        if (document.getElementById('analyticsTab')?.classList.contains('active')) renderAnalytics();
    });

    // Search & filter listeners
    const searchInput = document.getElementById('txnSearchInput');
    const typeFilter = document.getElementById('txnTypeFilter');
    const catFilter = document.getElementById('txnCategoryFilter');
    const resetFilterBtn = document.getElementById('txnResetFilterBtn');

    if (searchInput) searchInput.addEventListener('input', renderTransactions);
    if (typeFilter) typeFilter.addEventListener('change', renderTransactions);
    if (catFilter) catFilter.addEventListener('change', renderTransactions);
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (typeFilter) typeFilter.value = 'all';
            if (catFilter) catFilter.value = 'all';
            renderTransactions();
        });
    }

    // Export CSV & Full Backup/Restore JSON
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const backupJsonBtn = document.getElementById('backupJsonBtn');
    const restoreJsonInput = document.getElementById('restoreJsonInput');

    if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportTransactionsCsv);
    if (backupJsonBtn) backupJsonBtn.addEventListener('click', exportFullBackupJson);
    if (restoreJsonInput) restoreJsonInput.addEventListener('change', handleRestoreJsonFile);

    // Edit Modal listeners
    const editTypeSelect = document.getElementById('editType');
    if (editTypeSelect) {
        editTypeSelect.addEventListener('change', () => populateEditCategoryOptions(editTypeSelect.value));
    }
    const editForm = document.getElementById('editTransactionForm');
    if (editForm) {
        editForm.addEventListener('submit', saveEditedTransaction);
    }

    const importMergeBtn = document.getElementById('importMergeBtn');
    const importReplaceBtn = document.getElementById('importReplaceBtn');
    const importClearBtn = document.getElementById('importClearBtn');
    if (importMergeBtn && importReplaceBtn && importClearBtn) {
        importMergeBtn.addEventListener('click', () => importTransactionsFromText(false));
        importReplaceBtn.addEventListener('click', () => importTransactionsFromText(true));
        importClearBtn.addEventListener('click', () => {
            const box = document.getElementById('importData');
            const status = document.getElementById('importStatus');
            if (box) box.value = '';
            if (status) status.textContent = '';
        });
    }
}

function setImportStatus(msg, isError = false) {
    const el = document.getElementById('importStatus');
    if (!el) return;
    el.style.color = isError ? 'var(--danger)' : 'var(--text-secondary)';
    el.textContent = msg;
}

function parseAmountFlexible(raw) {
    if (raw === null || raw === undefined) return 0;
    let s = String(raw).trim();
    if (!s) return 0;
    s = s.replace(/\s+/g, '');
    s = s.replace(/rp/gi, '');
    if (!s) return 0;

    const hasComma = s.includes(',');
    const hasDot = s.includes('.');
    if (hasComma && hasDot) {
        s = s.replace(/\./g, '').replace(/,/g, '.');
    } else if (hasComma && !hasDot) {
        const lastComma = s.lastIndexOf(',');
        const decimals = s.length - lastComma - 1;
        if (decimals === 0) {
            s = s.replace(/,/g, '');
        } else if (decimals <= 2) {
            s = s.replace(/,/g, '.');
        } else {
            s = s.replace(/,/g, '');
        }
    } else {
        s = s.replace(/\./g, '');
    }

    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n) : 0;
}

function parseDateFlexible(raw) {
    if (!raw) return '';
    const s = String(raw).trim();
    if (!s) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
        const mm = String(parseInt(m[1], 10)).padStart(2, '0');
        const dd = String(parseInt(m[2], 10)).padStart(2, '0');
        const yyyy = m[3];
        return `${yyyy}-${mm}-${dd}`;
    }

    const dt = new Date(s);
    if (!Number.isNaN(dt.getTime())) {
        return typeof window.getLocalTodayStr === 'function'
            ? window.getLocalTodayStr(dt)
            : dt.toISOString().split('T')[0];
    }
    return '';
}

function normalizeHeader(h) {
    return String(h || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '')
        .replace(/[^a-z]/g, '');
}

function splitRow(line) {
    const t = String(line || '').trim();
    if (!t) return [];
    if (t.includes('\t')) return t.split('\t');
    if (t.includes(',')) return t.split(',');
    return t.split(/\s{2,}/);
}

function importTransactionsFromText(replaceAll) {
    const box = document.getElementById('importData');
    if (!box) return;
    const raw = String(box.value || '').trim();
    if (!raw) {
        setImportStatus('Paste data first.', true);
        return;
    }

    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
        setImportStatus('Need header + at least 1 row.', true);
        return;
    }

    const headers = splitRow(lines[0]).map(h => normalizeHeader(h));
    if (headers.length === 0) {
        setImportStatus('Header not detected.', true);
        return;
    }

    const idx = {
        id: headers.indexOf('id'),
        date: headers.indexOf('date'),
        type: headers.indexOf('type'),
        category: headers.indexOf('category'),
        description: headers.indexOf('description'),
        amount: headers.indexOf('amount'),
        source: headers.indexOf('source')
    };

    const required = ['date', 'type', 'category', 'amount'];
    for (const k of required) {
        if (idx[k] === -1) {
            setImportStatus(`Missing column: ${k}`, true);
            return;
        }
    }

    const parsed = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = splitRow(lines[i]);
        if (cols.length === 0) continue;

        const idRaw = idx.id >= 0 ? cols[idx.id] : '';
        const dateRaw = cols[idx.date];
        const typeRaw = cols[idx.type];
        const catRaw = cols[idx.category];
        const descRaw = idx.description >= 0 ? cols[idx.description] : '';
        const amtRaw = cols[idx.amount];
        const srcRaw = idx.source >= 0 ? cols[idx.source] : '';

        const date = parseDateFlexible(dateRaw);
        const amount = parseAmountFlexible(amtRaw);
        const type = String(typeRaw || '').toLowerCase().trim();
        const category = String(catRaw || '').toLowerCase().trim();
        const description = String(descRaw || '').trim();
        const method = String(srcRaw || '').toLowerCase().trim() === 'voice' ? 'voice' : 'manual';

        if (!date || !type || !category || !amount) continue;
        if (type !== 'income' && type !== 'expense') continue;

        let id = Number(idRaw);
        if (!Number.isFinite(id) || id <= 0) id = Date.now() + i;

        parsed.push({ id, date, type, category, description, amount, method });
    }

    if (parsed.length === 0) {
        setImportStatus('No valid rows parsed. Check column order and formats.', true);
        return;
    }

    if (replaceAll) {
        if (!confirm('Replace ALL transactions with imported data?')) return;
        transactions = parsed.sort((a, b) => b.id - a.id);
    } else {
        const map = new Map(transactions.map(t => [String(t.id), t]));
        for (const t of parsed) map.set(String(t.id), t);
        transactions = Array.from(map.values()).sort((a, b) => b.id - a.id);
    }

    saveTransactions();
    updateDashboards();
    renderTransactions();
    updateBudgetStatus();
    setImportStatus(`Imported ${parsed.length} transactions (${replaceAll ? 'replaced' : 'merged'}).`);
}

// ========== MONTH/YEAR SELECTORS ==========
function populateMonthYearSelectors() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');

    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];

    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = month;
        if (index === selectedMonth) option.selected = true;
        monthSelect.appendChild(option);
    });

    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 5; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === selectedYear) option.selected = true;
        yearSelect.appendChild(option);
    }
}

// ========== VIEW SWITCHING ==========
function switchView(view) {
    currentView = view;

    if (view === 'monthly') {
        document.getElementById('monthlyViewBtn').classList.add('active');
        document.getElementById('alltimeViewBtn').classList.remove('active');
        document.getElementById('monthlyDashboard').classList.remove('hidden');
        document.getElementById('alltimeDashboard').classList.add('hidden');
        document.getElementById('monthSelect').disabled = false;
        document.getElementById('yearSelect').disabled = false;
    } else {
        document.getElementById('monthlyViewBtn').classList.remove('active');
        document.getElementById('alltimeViewBtn').classList.add('active');
        document.getElementById('monthlyDashboard').classList.add('hidden');
        document.getElementById('alltimeDashboard').classList.remove('hidden');
        document.getElementById('monthSelect').disabled = true;
        document.getElementById('yearSelect').disabled = true;
    }

    updateDashboards();
    renderTransactions();
    updatePeriodLabels();
    if (document.getElementById('analyticsTab')?.classList.contains('active')) renderAnalytics();
}

// ========== DASHBOARDS UPDATE ==========
function updateDashboards() {
    if (currentView === 'monthly') {
        updateMonthlyDashboard();
    } else {
        updateAlltimeDashboard();
    }
    updateFreeCashSummary();
}

function getTotalAllocatedSavings() {
    let genTotal = 0;
    let goalsTotal = 0;
    try {
        const rawGen = localStorage.getItem('savings_general');
        if (rawGen) {
            const parsed = JSON.parse(rawGen);
            genTotal = typeof parsed === 'number' ? parsed : (Number(parsed.total) || 0);
        }
    } catch {}
    try {
        const rawGoals = localStorage.getItem('savings_goals');
        if (rawGoals) {
            const arr = JSON.parse(rawGoals);
            if (Array.isArray(arr)) {
                goalsTotal = arr.reduce((s, g) => s + (Number(g.current) || 0), 0);
            }
        }
    } catch {}
    return genTotal + goalsTotal;
}

function updateFreeCashSummary() {
    const allIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const allExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const overallBalance = allIncome - allExpense;
    const totalSavings = getTotalAllocatedSavings();
    const freeCash = overallBalance - totalSavings;

    const allocEl = document.getElementById('dashboardAllocatedSavings');
    const freeEl = document.getElementById('dashboardFreeCash');
    if (allocEl) allocEl.textContent = `Rp ${totalSavings.toLocaleString('id-ID')}`;
    if (freeEl) {
        freeEl.textContent = `Rp ${freeCash.toLocaleString('id-ID')}`;
        freeEl.style.color = freeCash >= 0 ? 'var(--success)' : 'var(--danger)';
    }
}

function parseTxnDate(dateStr) {
    return typeof window.parseLocalDate === 'function'
        ? window.parseLocalDate(dateStr)
        : new Date(dateStr);
}

function updateMonthlyDashboard() {
    const monthlyTxns = transactions.filter(t => {
        const d = parseTxnDate(t.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const income = monthlyTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthlyTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const net = income - expense;
    const savingRate = income > 0 ? (net / income) * 100 : 0;

    document.getElementById('monthlyIncome').textContent = `Rp ${income.toLocaleString('id-ID')}`;
    document.getElementById('monthlyExpense').textContent = `Rp ${expense.toLocaleString('id-ID')}`;
    document.getElementById('monthlyNet').textContent = `Rp ${net.toLocaleString('id-ID')}`;
    const monthlySavingRateEl = document.getElementById('monthlySavingRate');
    if (monthlySavingRateEl) monthlySavingRateEl.textContent = `${savingRate.toFixed(1)}%`;

    // Sync with Android Home Screen Widget if running inside APK
    if (window.AndroidWidget && typeof window.AndroidWidget.updateWidget === 'function') {
        const balStr = (net >= 0 ? 'Rp ' : '-Rp ') + Math.abs(net).toLocaleString('id-ID');
        const incStr = '+Rp ' + income.toLocaleString('id-ID');
        const expStr = '-Rp ' + expense.toLocaleString('id-ID');
        window.AndroidWidget.updateWidget(balStr, incStr, expStr);
    }

    const indicator = document.getElementById('monthlyHealthIndicator');
    if (net >= 0) {
        indicator.className = 'health-indicator health-safe';
        indicator.innerHTML = '<span>●</span> <span>Positive flow</span>';
    } else {
        indicator.className = 'health-indicator health-critical';
        indicator.innerHTML = '<span>▲</span> <span>Spending exceeds income</span>';
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    if (selectedMonth === now.getMonth() && selectedYear === now.getFullYear()) {
        document.getElementById('currentMonthBadge').textContent = 'Current Month';
    } else {
        document.getElementById('currentMonthBadge').textContent = `${months[selectedMonth]} ${selectedYear}`;
    }
}

function updateAlltimeDashboard() {
    const allIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const allExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = allIncome - allExpense;
    const savingRate = allIncome > 0 ? (balance / allIncome) * 100 : 0;

    document.getElementById('alltimeIncome').textContent = `Rp ${allIncome.toLocaleString('id-ID')}`;
    document.getElementById('alltimeExpense').textContent = `Rp ${allExpense.toLocaleString('id-ID')}`;
    document.getElementById('alltimeBalance').textContent = `Rp ${balance.toLocaleString('id-ID')}`;
    const alltimeSavingRateEl = document.getElementById('alltimeSavingRate');
    if (alltimeSavingRateEl) alltimeSavingRateEl.textContent = `${savingRate.toFixed(1)}%`;

    const indicator = document.getElementById('alltimeHealthIndicator');
    if (balance >= 0) {
        indicator.className = 'health-indicator health-safe';
        indicator.innerHTML = '<span>●</span> <span>Positive balance</span>';
    } else {
        indicator.className = 'health-indicator health-critical';
        indicator.innerHTML = '<span>▲</span> <span>Overall deficit</span>';
    }
}

function updatePeriodLabels() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (currentView === 'monthly') {
        const periodText = `(${months[selectedMonth]} ${selectedYear})`;
        document.getElementById('transactionsPeriod').textContent = periodText;
        document.getElementById('analyticsPeriod').textContent = periodText;
    } else {
        document.getElementById('transactionsPeriod').textContent = '(All Time)';
        document.getElementById('analyticsPeriod').textContent = '(All Time)';
    }
}

// ========== TRANSACTIONS ==========
function getFilteredTransactions() {
    if (currentView === 'alltime') {
        return transactions;
    }

    return transactions.filter(t => {
        const d = parseTxnDate(t.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
}

function getSearchAndFilteredTransactions() {
    let list = getFilteredTransactions();

    const searchQ = (document.getElementById('txnSearchInput')?.value || '').toLowerCase().trim();
    const typeFilter = document.getElementById('txnTypeFilter')?.value || 'all';
    const catFilter = document.getElementById('txnCategoryFilter')?.value || 'all';

    if (typeFilter !== 'all') {
        list = list.filter(t => t.type === typeFilter);
    }
    if (catFilter !== 'all') {
        list = list.filter(t => t.category === catFilter);
    }
    if (searchQ) {
        list = list.filter(t => {
            const desc = String(t.description || '').toLowerCase();
            const cat = String(t.category || '').toLowerCase();
            const amt = String(t.amount || '');
            return desc.includes(searchQ) || cat.includes(searchQ) || amt.includes(searchQ);
        });
    }
    return list;
}

function renderTransactions() {
    const container = document.getElementById('transactionsList');
    const filtered = getSearchAndFilteredTransactions();

    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 40px;"><div style="font-size: 1.5rem; opacity: 0.5; margin-bottom: 8px;">[ — ]</div><p>No matching transactions in this period</p></div>';
        return;
    }

    const esc = window.escapeHtml || (s => s);
    const trashIcon = typeof window.getIconSvg === 'function' ? window.getIconSvg('trash') : '✕';
    const editIcon = typeof window.getIconSvg === 'function' ? window.getIconSvg('edit') : '✎';
    const micIcon = typeof window.getIconSvg === 'function' ? window.getIconSvg('mic') : '';
    const kbIcon = typeof window.getIconSvg === 'function' ? window.getIconSvg('keyboard') : '';

    container.innerHTML = filtered.map(t => `
        <div class="transaction-item">
            <div class="transaction-info">
                <span class="transaction-category" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px 4px 6px;">
                    ${getCategoryBadge(t.category)}
                    <span>${esc(formatCategoryName(t.category))}</span>
                </span>
                <div class="transaction-description">${esc(t.description || 'No description')}</div>
                <div class="transaction-date" style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                    <span>${formatDate(t.date)}</span>
                    <span style="opacity:0.75;font-size:0.78rem;display:inline-flex;align-items:center;gap:3px;">
                        ${t.method === 'voice' ? micIcon + ' Voice' : kbIcon + ' Manual'}
                    </span>
                </div>
            </div>
            <div class="transaction-amount ${t.type === 'income' ? 'amount-income' : 'amount-expense'}">
                ${t.type === 'income' ? '+' : '−'}Rp ${t.amount.toLocaleString('id-ID')}
            </div>
            <div class="transaction-actions">
                <button class="btn-icon" title="Edit" onclick="openEditModal(${t.id})">${editIcon}</button>
                <button class="btn-icon" title="Delete" onclick="deleteTransaction(${t.id})">${trashIcon}</button>
            </div>
        </div>
    `).join('');
}

// ========== EDIT TRANSACTION MODAL ==========
function populateEditCategoryOptions(type, selectedCat) {
    const sel = document.getElementById('editCategory');
    if (!sel) return;
    const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const list = selectedCat && !cats.includes(selectedCat) ? [...cats, selectedCat] : cats;
    sel.innerHTML = list.map(c => `<option value="${c}">${formatCategoryName(c)}</option>`).join('');
    if (selectedCat) sel.value = selectedCat;
}

function openEditModal(id) {
    const txn = transactions.find(t => t.id === id);
    if (!txn) return;

    document.getElementById('editTxnId').value = txn.id;
    document.getElementById('editType').value = txn.type;
    document.getElementById('editAmount').value = Number(txn.amount || 0).toLocaleString('id-ID');
    populateEditCategoryOptions(txn.type, txn.category);
    if (typeof window.setDatePickerValue === 'function') {
        window.setDatePickerValue('editDate', txn.date, false);
    } else {
        document.getElementById('editDate').value = txn.date;
    }
    document.getElementById('editDescription').value = txn.description || '';

    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    if (typeof window.closeMiniCalendar === 'function') {
        window.closeMiniCalendar();
    }
    const modal = document.getElementById('editModal');
    if (modal) modal.classList.remove('active');
}

function saveEditedTransaction(e) {
    e.preventDefault();
    const id = Number(document.getElementById('editTxnId').value);
    const idx = transactions.findIndex(t => t.id === id);
    if (idx === -1) return;

    const amountVal = window.getUnformattedValue('editAmount');
    if (!amountVal || amountVal <= 0) {
        alert('Please enter a valid amount.');
        return;
    }

    transactions[idx] = {
        ...transactions[idx],
        type: document.getElementById('editType').value,
        amount: amountVal,
        category: document.getElementById('editCategory').value,
        date: document.getElementById('editDate').value,
        description: document.getElementById('editDescription').value.trim()
    };

    saveTransactions();
    closeEditModal();
    updateDashboards();
    renderTransactions();
    updateBudgetStatus();
    if (document.getElementById('analyticsTab')?.classList.contains('active')) renderAnalytics();

    if (typeof window.sendToSheet === 'function' && typeof window.buildSheetPayload === 'function') {
        window.sendToSheet(window.buildSheetPayload(transactions[idx]));
    }
}

// ========== EXPORT CSV & FULL BACKUP JSON ==========
function exportTransactionsCsv() {
    const list = getSearchAndFilteredTransactions();
    if (!list.length) {
        alert('No transactions to export.');
        return;
    }
    const headers = ['Id', 'Date', 'Type', 'Category', 'Description', 'Amount', 'Source'];
    const escapeCsv = (val) => {
        const s = String(val ?? '');
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };
    const rows = list.map(t => [
        t.id,
        t.date,
        t.type,
        t.category,
        t.description || '',
        t.amount,
        t.method || 'manual'
    ].map(escapeCsv).join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-transactions-${window.getLocalTodayStr ? window.getLocalTodayStr() : 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportFullBackupJson() {
    const backup = {
        version: 4,
        exportedAt: new Date().toISOString(),
        transactions: JSON.parse(localStorage.getItem('transactions') || '[]'),
        budgets: JSON.parse(localStorage.getItem('budgets') || '{}'),
        active_budget_categories: JSON.parse(localStorage.getItem('active_budget_categories') || '["food","transport","health"]'),
        budget_inputs_meta: JSON.parse(localStorage.getItem('budget_inputs_meta') || '{}'),
        budget_line_items: JSON.parse(localStorage.getItem('budget_line_items') || '[]'),
        savings_general: JSON.parse(localStorage.getItem('savings_general') || '{"total":0,"history":[]}'),
        savings_goals: JSON.parse(localStorage.getItem('savings_goals') || '[]'),
        planner_state: JSON.parse(localStorage.getItem('planner_state') || '{}')
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-full-backup-${window.getLocalTodayStr ? window.getLocalTodayStr() : 'backup'}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function handleRestoreJsonFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const data = JSON.parse(evt.target.result);
            if (!data || typeof data !== 'object') throw new Error('Invalid JSON');
            if (!confirm('Restore seluruh data (Transaksi, Tabungan, Budget, & Planner) dari file backup ini?')) {
                e.target.value = '';
                return;
            }
            if (Array.isArray(data.transactions)) {
                transactions = data.transactions;
                localStorage.setItem('transactions', JSON.stringify(transactions));
            }
            if (data.budgets && typeof data.budgets === 'object') {
                budgets = data.budgets;
                localStorage.setItem('budgets', JSON.stringify(budgets));
            }
            if (Array.isArray(data.active_budget_categories)) {
                localStorage.setItem('active_budget_categories', JSON.stringify(data.active_budget_categories));
            }
            if (data.budget_inputs_meta && typeof data.budget_inputs_meta === 'object') {
                localStorage.setItem('budget_inputs_meta', JSON.stringify(data.budget_inputs_meta));
            }
            if (Array.isArray(data.budget_line_items)) {
                localStorage.setItem('budget_line_items', JSON.stringify(data.budget_line_items));
            }
            if (data.savings_general) {
                localStorage.setItem('savings_general', JSON.stringify(data.savings_general));
            }
            if (Array.isArray(data.savings_goals)) {
                localStorage.setItem('savings_goals', JSON.stringify(data.savings_goals));
            }
            if (data.planner_state) {
                localStorage.setItem('planner_state', JSON.stringify(data.planner_state));
            }
            updateDashboards();
            renderTransactions();
            renderBudgetForm();
            if (document.getElementById('analyticsTab')?.classList.contains('active')) renderAnalytics();
            alert('✓ Seluruh data berhasil di-restore!');
        } catch (err) {
            alert('File JSON tidak valid.');
        } finally {
            e.target.value = '';
        }
    };
    reader.readAsText(file);
}

function setTodayDate() {
    const todayIso = typeof window.getLocalTodayStr === 'function'
        ? window.getLocalTodayStr()
        : new Date().toISOString().split('T')[0];
    if (typeof window.setDatePickerValue === 'function') {
        window.setDatePickerValue('date', todayIso, false);
    } else {
        const el = document.getElementById('date');
        if (el) el.value = todayIso;
    }
}

function handleFormSubmit(e) {
    e.preventDefault();

    const amountVal = window.getUnformattedValue('amount');
    if (!amountVal || amountVal <= 0) {
        alert('Please enter a valid amount.');
        return;
    }

    const transaction = {
        id: Date.now(),
        type: document.getElementById('type').value,
        amount: amountVal,
        category: document.getElementById('category').value || 'food',
        date: document.getElementById('date').value,
        description: document.getElementById('description').value.trim(),
        method: 'manual'
    };

    transactions.unshift(transaction);
    saveTransactions();
    updateDashboards();
    renderTransactions();
    updateBudgetStatus();
    if (document.getElementById('analyticsTab')?.classList.contains('active')) renderAnalytics();

    if (typeof window.sendToSheet === 'function' && typeof window.buildSheetPayload === 'function') {
        window.sendToSheet(window.buildSheetPayload(transaction));
    }

    this.reset();
    document.getElementById('category').value = 'food';
    renderCategoryPicker();
    setTodayDate();
    alert('✓ Transaction added.');
}

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function deleteTransaction(id) {
    if (confirm('Delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        updateDashboards();
        renderTransactions();
        updateBudgetStatus();
        if (document.getElementById('analyticsTab')?.classList.contains('active')) renderAnalytics();

        if (typeof window.sendToSheet === 'function' && typeof window.buildSheetDeletePayload === 'function') {
            window.sendToSheet(window.buildSheetDeletePayload(id));
        }
    }
}

// ========== TABS ==========
function switchTab(tabName, clickedTab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    clickedTab.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
    if (tabName === 'transactions') {
        updatePeriodLabels();
        renderTransactions();
    }
    if (tabName === 'analytics') renderAnalytics();
    if (tabName === 'budget') {
        budgets = JSON.parse(localStorage.getItem('budgets')) || budgets;
        renderBudgetForm();
    }
}

// ========== ANALYTICS & SMART INSIGHTS ==========
function renderAnalytics() {
    renderSmartInsights();
    renderCategoryBreakdown();
    renderCharts();
}

function renderSmartInsights() {
    const panel = document.getElementById('smartInsightsPanel');
    if (!panel) return;

    const filtered = getFilteredTransactions();
    const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const net = income - expense;
    const savingRate = income > 0 ? (net / income) * 100 : 0;

    // 1. Month-over-Month Expense Trend
    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth < 0) {
        prevMonth = 11;
        prevYear--;
    }
    const prevMonthExpense = transactions
        .filter(t => {
            const d = parseTxnDate(t.date);
            return t.type === 'expense' && d.getMonth() === prevMonth && d.getFullYear() === prevYear;
        })
        .reduce((s, t) => s + t.amount, 0);

    let momValueHtml = 'Stabil';
    let momDescHtml = 'Belum ada data pembanding bulan sebelumnya.';
    let momColor = 'var(--accent-primary)';

    if (currentView === 'monthly') {
        if (prevMonthExpense > 0) {
            const diffPct = ((expense - prevMonthExpense) / prevMonthExpense) * 100;
            if (diffPct > 0) {
                momValueHtml = `▲ +${diffPct.toFixed(1)}%`;
                momDescHtml = `Pengeluaran naik dibanding bulan lalu (Rp ${prevMonthExpense.toLocaleString('id-ID')}).`;
                momColor = 'var(--danger)';
            } else if (diffPct < 0) {
                momValueHtml = `▼ ${diffPct.toFixed(1)}%`;
                momDescHtml = `Lebih hemat dibanding bulan lalu (Rp ${prevMonthExpense.toLocaleString('id-ID')})!`;
                momColor = 'var(--success)';
            } else {
                momValueHtml = '0.0% (Sama)';
                momDescHtml = `Pengeluaran sama persis dengan bulan lalu.`;
            }
        } else if (expense > 0) {
            momValueHtml = `Rp ${expense.toLocaleString('id-ID')}`;
            momDescHtml = 'Bulan pertama dengan catatan pengeluaran pada periode ini.';
        }
    } else {
        momValueHtml = `${transactions.filter(t => t.type === 'expense').length} Transaksi`;
        momDescHtml = `Total akumulasi seluruh pengeluaran sepanjang waktu.`;
    }

    // 2. Top Category
    const catTotals = {};
    filtered.filter(t => t.type === 'expense').forEach(t => {
        catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    });
    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    let topCatValueHtml = 'Belum Ada';
    let topCatDescHtml = 'Belum ada pengeluaran tercatat.';
    if (sortedCats.length > 0 && expense > 0) {
        const [topCat, topAmt] = sortedCats[0];
        const topPct = ((topAmt / expense) * 100).toFixed(1);
        topCatValueHtml = `${getCategoryBadge(topCat)} ${formatCategoryName(topCat)}`;
        topCatDescHtml = `Rp ${topAmt.toLocaleString('id-ID')} (${topPct}% dari total pengeluaran).`;
    }

    // 3. Average Daily Spend
    const now = new Date();
    let daysCount = 30;
    if (currentView === 'monthly') {
        const daysInSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        if (selectedYear === now.getFullYear() && selectedMonth === now.getMonth()) {
            daysCount = Math.max(1, now.getDate());
        } else {
            daysCount = daysInSelectedMonth;
        }
    } else {
        const dates = filtered.map(t => parseTxnDate(t.date).getTime()).filter(n => !isNaN(n));
        if (dates.length > 1) {
            const spanDays = Math.ceil((Math.max(...dates) - Math.min(...dates)) / 86400000) + 1;
            daysCount = Math.max(1, spanDays);
        }
    }
    const avgDaily = Math.round(expense / daysCount);

    // 4. Saving Rate & Budget Health
    let healthVal = `${savingRate.toFixed(1)}% Saving Rate`;
    let healthDesc = 'Pertahankan rasio tabungan minimal 20% dari pemasukan.';
    let healthBorder = 'var(--accent-primary)';
    if (income === 0 && expense === 0) {
        healthVal = 'Belum Ada Data';
        healthDesc = 'Tambahkan transaksi untuk melihat analisis kesehatan finansial.';
    } else if (net < 0) {
        healthVal = '[!] Defisit Cashflow';
        healthDesc = `Pengeluaran melebihi pemasukan sebesar Rp ${Math.abs(net).toLocaleString('id-ID')}.`;
        healthBorder = 'var(--danger)';
    } else if (savingRate >= 20) {
        healthVal = `✓ Sehat (${savingRate.toFixed(1)}%)`;
        healthDesc = `Surplus Rp ${net.toLocaleString('id-ID')} — melampaui target ideal 20%!`;
        healthBorder = 'var(--success)';
    } else {
        healthVal = `▲ Wajar (${savingRate.toFixed(1)}%)`;
        healthDesc = `Surplus Rp ${net.toLocaleString('id-ID')}, tingkatkan ke 20% agar lebih aman.`;
        healthBorder = 'var(--warning)';
    }

    panel.innerHTML = `
        <div class="insight-card" style="border-left-color:${momColor};">
            <div class="insight-card-title">Tren Pengeluaran (MoM)</div>
            <div class="insight-card-value" style="color:${momColor};">${momValueHtml}</div>
            <div class="insight-card-desc">${momDescHtml}</div>
        </div>
        <div class="insight-card">
            <div class="insight-card-title">Pos Pengeluaran Terbesar</div>
            <div class="insight-card-value" style="display:flex;align-items:center;gap:4px;">${topCatValueHtml}</div>
            <div class="insight-card-desc">${topCatDescHtml}</div>
        </div>
        <div class="insight-card">
            <div class="insight-card-title">Rata-rata Harian</div>
            <div class="insight-card-value">Rp ${avgDaily.toLocaleString('id-ID')} / hari</div>
            <div class="insight-card-desc">Dihitung dari ${daysCount} hari aktif pada periode ini.</div>
        </div>
        <div class="insight-card" style="border-left-color:${healthBorder};">
            <div class="insight-card-title">Kesehatan Finansial</div>
            <div class="insight-card-value" style="color:${healthBorder};">${healthVal}</div>
            <div class="insight-card-desc">${healthDesc}</div>
        </div>
    `;
}

function getCssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function getChartPalette() {
    const accent1 = getCssVar('--accent-primary') || '#667eea';
    const accent2 = getCssVar('--accent-secondary') || '#764ba2';
    const danger = getCssVar('--danger') || '#f56565';
    const success = getCssVar('--success') || '#48bb78';
    const warning = getCssVar('--warning') || '#ed8936';
    const text = getCssVar('--text-primary') || '#2d3748';
    const grid = getCssVar('--border') || '#e2e8f0';

    return {
        accent1,
        accent2,
        danger,
        success,
        warning,
        text,
        grid,
        categoryColors: [
            '#fb923c',
            '#38bdf8',
            '#facc15',
            '#c084fc',
            '#f472b6',
            '#2dd4bf',
            '#fb7185',
            '#94a3b8'
        ]
    };
}

function destroyChart(chart) {
    if (chart && typeof chart.destroy === 'function') chart.destroy();
}

function monthKey(dateStr) {
    if (!dateStr) return '';
    return String(dateStr).slice(0, 7);
}

function formatMonthLabel(yyyyMm) {
    const [y, m] = String(yyyyMm).split('-').map(v => parseInt(v, 10));
    if (!y || !m) return yyyyMm;
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function getMonthlyBucketsForSelectedYear() {
    const months = Array.from({ length: 12 }, (_, i) => `${selectedYear}-${String(i + 1).padStart(2, '0')}`);
    const totals = months.reduce((acc, k) => (acc[k] = { income: 0, expense: 0 }, acc), {});
    transactions.forEach(t => {
        const k = monthKey(t.date);
        if (!totals[k]) return;
        if (t.type === 'income') totals[k].income += t.amount;
        if (t.type === 'expense') totals[k].expense += t.amount;
    });
    return { keys: months, totals };
}

function getMonthlyBucketsLast12() {
    const dates = transactions.map(t => parseTxnDate(t.date)).filter(d => !isNaN(d.getTime()));
    const anchor = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();
    anchor.setDate(1);

    const keys = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
        keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const totals = keys.reduce((acc, k) => (acc[k] = { income: 0, expense: 0 }, acc), {});
    transactions.forEach(t => {
        const k = monthKey(t.date);
        if (!totals[k]) return;
        if (t.type === 'income') totals[k].income += t.amount;
        if (t.type === 'expense') totals[k].expense += t.amount;
    });

    return { keys, totals };
}

function renderCharts() {
    if (typeof Chart === 'undefined') return;

    const palette = getChartPalette();
    const expensesFiltered = getFilteredTransactions().filter(t => t.type === 'expense');
    const categoryTotals = {};
    expensesFiltered.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const categoryLabels = Object.keys(categoryTotals).sort((a, b) => (categoryTotals[b] || 0) - (categoryTotals[a] || 0));
    const categoryValues = categoryLabels.map(k => categoryTotals[k]);
    const categoryLabelPretty = categoryLabels.map(k => formatCategoryName(k));

    const donutEl = document.getElementById('expenseCategoryChart');
    if (donutEl) {
        destroyChart(expenseCategoryChart);
        expenseCategoryChart = new Chart(donutEl, {
            type: 'doughnut',
            data: {
                labels: categoryLabelPretty,
                datasets: [{
                    data: categoryValues.length ? categoryValues : [1],
                    backgroundColor: categoryValues.length ? palette.categoryColors.slice(0, categoryValues.length) : [palette.grid],
                    borderColor: palette.grid,
                    borderWidth: 2,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: palette.text }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const val = Number(ctx.raw) || 0;
                                return `${ctx.label}: Rp ${val.toLocaleString('id-ID')}`;
                            }
                        }
                    }
                }
            }
        });
    }

    const bucket = currentView === 'monthly' ? getMonthlyBucketsForSelectedYear() : getMonthlyBucketsLast12();
    const monthLabels = bucket.keys.map(formatMonthLabel);
    const expenses = bucket.keys.map(k => bucket.totals[k]?.expense || 0);
    const incomes = bucket.keys.map(k => bucket.totals[k]?.income || 0);
    const savingRates = bucket.keys.map(k => {
        const inc = bucket.totals[k]?.income || 0;
        const exp = bucket.totals[k]?.expense || 0;
        const net = inc - exp;
        return inc > 0 ? (net / inc) * 100 : 0;
    });

    const expenseEl = document.getElementById('monthlyExpenseChart');
    if (expenseEl) {
        destroyChart(monthlyExpenseChart);
        monthlyExpenseChart = new Chart(expenseEl, {
            type: 'bar',
            data: {
                labels: monthLabels,
                datasets: [{
                    label: 'Expense',
                    data: expenses,
                    backgroundColor: palette.danger,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: palette.text } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `Rp ${(Number(ctx.raw) || 0).toLocaleString('id-ID')}`
                        }
                    }
                },
                scales: {
                    x: { ticks: { color: palette.text }, grid: { color: palette.grid } },
                    y: { ticks: { color: palette.text }, grid: { color: palette.grid } }
                }
            }
        });
    }

    const incExpEl = document.getElementById('incomeExpenseChart');
    if (incExpEl) {
        destroyChart(incomeExpenseChart);
        incomeExpenseChart = new Chart(incExpEl, {
            type: 'bar',
            data: {
                labels: monthLabels,
                datasets: [
                    {
                        label: 'Income',
                        data: incomes,
                        backgroundColor: palette.success,
                        borderRadius: 8
                    },
                    {
                        label: 'Expense',
                        data: expenses,
                        backgroundColor: palette.danger,
                        borderRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: palette.text } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `Rp ${(Number(ctx.raw) || 0).toLocaleString('id-ID')}`
                        }
                    }
                },
                scales: {
                    x: { stacked: false, ticks: { color: palette.text }, grid: { color: palette.grid } },
                    y: { stacked: false, ticks: { color: palette.text }, grid: { color: palette.grid } }
                }
            }
        });
    }

    const rateEl = document.getElementById('savingRateChart');
    if (rateEl) {
        destroyChart(savingRateChart);
        savingRateChart = new Chart(rateEl, {
            type: 'line',
            data: {
                labels: monthLabels,
                datasets: [{
                    label: 'Saving Rate (%)',
                    data: savingRates,
                    borderColor: palette.accent1,
                    backgroundColor: palette.accent1,
                    pointRadius: 3,
                    tension: 0.25
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: palette.text } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${(Number(ctx.raw) || 0).toFixed(1)}%`
                        }
                    }
                },
                scales: {
                    x: { ticks: { color: palette.text }, grid: { color: palette.grid } },
                    y: {
                        suggestedMin: 0,
                        suggestedMax: 100,
                        ticks: {
                            color: palette.text,
                            callback: (v) => `${v}%`
                        },
                        grid: { color: palette.grid }
                    }
                }
            }
        });
    }
}

function renderCategoryBreakdown() {
    const container = document.getElementById('categoryBreakdown');
    const filtered = getFilteredTransactions().filter(t => t.type === 'expense');

    const catTotals = {};
    filtered.forEach(t => {
        catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    });

    const total = Object.values(catTotals).reduce((a, b) => a + b, 0);

    if (total === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No expenses in this period</p>';
        return;
    }

    const esc = window.escapeHtml || (s => s);

    container.innerHTML = Object.entries(catTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => {
            const pct = (amt / total * 100).toFixed(1);
            return `
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="display:inline-flex;align-items:center;font-weight:600;">${getCategoryBadge(cat)} ${esc(formatCategoryName(cat))}</span>
                        <span><strong>Rp ${amt.toLocaleString('id-ID')}</strong> (${pct}%)</span>
                    </div>
                    <div style="background: var(--bg-primary); height: 12px; border-radius: 6px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); height: 100%; width: ${pct}%; transition: width 0.5s;"></div>
                    </div>
                </div>
            `;
        }).join('');
}

// ========== FLEXIBLE LINE-ITEM & PRIORITY BUDGET ENGINE ==========
const ACTIVE_BUDGET_CATS_KEY = 'active_budget_categories';
const BUDGET_INPUTS_META_KEY = 'budget_inputs_meta';
const BUDGET_LINE_ITEMS_KEY = 'budget_line_items';

const DEFAULT_CATEGORY_ITEM_NAMES = {
    food: 'Makan & Minum Harian',
    transport: 'Bensin & Transportasi',
    bills: 'Tagihan Listrik & Internet',
    study: 'Langganan AI / Edukasi',
    entertainment: 'Hiburan & Streaming',
    shopping: 'Belanja Bulanan',
    health: 'Kesehatan & Suplemen',
    other: 'Kebutuhan Lainnya'
};

function calcMonthlyItemAmount(item) {
    const raw = Number(item.rawAmount) || 0;
    const cycle = item.cycle || 'monthly';
    if (cycle === 'daily') return raw * 30;
    if (cycle === 'weekly') return raw * 4;
    if (cycle === 'yearly') return Math.round(raw / 12);
    return raw;
}

function getCycleMult(cycle) {
    if (cycle === 'daily') return 30;
    if (cycle === 'weekly') return 4;
    if (cycle === 'yearly') return 1 / 12;
    return 1;
}

function getBudgetLineItems() {
    try {
        const raw = localStorage.getItem(BUDGET_LINE_ITEMS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed.filter(it => it && EXPENSE_CATEGORIES.includes(it.category));
            }
        }
    } catch (e) {}

    // Migrate from existing active_budget_categories / budgets on first load
    let initialCats = ['food', 'transport', 'health'];
    try {
        const rawCats = JSON.parse(localStorage.getItem(ACTIVE_BUDGET_CATS_KEY) || 'null');
        if (Array.isArray(rawCats) && rawCats.length > 0) {
            initialCats = rawCats.filter(c => EXPENSE_CATEGORIES.includes(c));
        }
    } catch (e) {}

    let meta = {};
    try {
        meta = JSON.parse(localStorage.getItem(BUDGET_INPUTS_META_KEY) || '{}') || {};
    } catch (e) {}

    const migrated = initialCats.map((cat, idx) => {
        const m = meta[cat] || {};
        const cycle = ['daily', 'weekly', 'monthly', 'yearly'].includes(m.cycle) ? m.cycle : (cat === 'food' ? 'daily' : 'monthly');
        const monthlyFallback = Number(budgets[cat]) || (cat === 'food' ? 900000 : 250000);
        const rawAmount = Number(m.rawAmount) > 0
            ? Number(m.rawAmount)
            : (cycle === 'daily' ? Math.round(monthlyFallback / 30) : (cycle === 'weekly' ? Math.round(monthlyFallback / 4) : monthlyFallback));

        return {
            id: Date.now() + idx,
            name: DEFAULT_CATEGORY_ITEM_NAMES[cat] || formatCategoryName(cat),
            category: cat,
            tier: cat === 'entertainment' || cat === 'shopping' ? 3 : (cat === 'health' || cat === 'study' ? 2 : 1),
            type: cat === 'bills' || cat === 'study' ? 'subscription' : 'quota',
            rawAmount,
            cycle,
            paidMonths: {}
        };
    });

    localStorage.setItem(BUDGET_LINE_ITEMS_KEY, JSON.stringify(migrated));
    syncBudgetsFromLineItems(migrated);
    return migrated;
}

function syncBudgetsFromLineItems(items) {
    const list = Array.isArray(items) ? items : [];
    localStorage.setItem(BUDGET_LINE_ITEMS_KEY, JSON.stringify(list));

    const newBudgets = {};
    EXPENSE_CATEGORIES.forEach(c => { newBudgets[c] = 0; });

    const catSet = new Set();
    list.forEach(item => {
        if (!EXPENSE_CATEGORIES.includes(item.category)) return;
        catSet.add(item.category);
        newBudgets[item.category] = (newBudgets[item.category] || 0) + calcMonthlyItemAmount(item);
    });

    const orderedActive = EXPENSE_CATEGORIES.filter(c => catSet.has(c));
    budgets = { ...budgets, ...newBudgets };
    localStorage.setItem('budgets', JSON.stringify(budgets));
    localStorage.setItem(ACTIVE_BUDGET_CATS_KEY, JSON.stringify(orderedActive));
}

function getActiveBudgetCategories() {
    const items = getBudgetLineItems();
    const catSet = new Set(items.map(i => i.category));
    return EXPENSE_CATEGORIES.filter(c => catSet.has(c));
}

function addCategoryToBudget(cat) {
    if (!EXPENSE_CATEGORIES.includes(cat)) return;
    const items = getBudgetLineItems();
    const defaultTier = (cat === 'entertainment' || cat === 'shopping') ? 3 : ((cat === 'health' || cat === 'study') ? 2 : 1);
    const defaultType = (cat === 'bills' || cat === 'study') ? 'subscription' : 'quota';
    const defaultCycle = cat === 'food' ? 'daily' : 'monthly';
    const defaultRaw = cat === 'food' ? 35000 : 200000;

    items.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: DEFAULT_CATEGORY_ITEM_NAMES[cat] || `Kebutuhan ${formatCategoryName(cat)}`,
        category: cat,
        tier: defaultTier,
        type: defaultType,
        rawAmount: defaultRaw,
        cycle: defaultCycle,
        paidMonths: {}
    });
    syncBudgetsFromLineItems(items);
    renderBudgetForm();
}

function removeCategoryFromBudget(cat) {
    const items = getBudgetLineItems().filter(i => i.category !== cat);
    syncBudgetsFromLineItems(items);
    renderBudgetForm();
}

function quickAddBudgetPreset(name, category, tier, type, rawAmount, cycle) {
    const items = getBudgetLineItems();
    items.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        name,
        category,
        tier: Number(tier) || 1,
        type: type || 'quota',
        rawAmount: Number(rawAmount) || 0,
        cycle: cycle || 'monthly',
        paidMonths: {}
    });
    syncBudgetsFromLineItems(items);
    renderBudgetForm();
}

function handleAddCustomBudgetItem() {
    const editIdEl = document.getElementById('editingBudgetItemId');
    const nameEl = document.getElementById('newBudgetItemName');
    const catEl = document.getElementById('newBudgetItemCat');
    const tierEl = document.getElementById('newBudgetItemTier');
    const typeEl = document.getElementById('newBudgetItemType');
    const amtEl = document.getElementById('newBudgetItemAmount');
    const cycleEl = document.getElementById('newBudgetItemCycle');

    const cat = catEl ? catEl.value : 'food';
    const name = (nameEl ? nameEl.value.trim() : '') || DEFAULT_CATEGORY_ITEM_NAMES[cat] || formatCategoryName(cat);
    const tier = parseInt(tierEl?.value || '1', 10) || 1;
    const type = typeEl?.value || 'quota';
    const rawAmount = window.getUnformattedValue('newBudgetItemAmount');
    const cycle = cycleEl?.value || 'monthly';

    if (!rawAmount || rawAmount <= 0) {
        alert('Masukkan nominal (Rp) terlebih dahulu untuk item budget ini.');
        return;
    }

    const items = getBudgetLineItems();
    const editingId = editIdEl && editIdEl.value ? Number(editIdEl.value) : null;

    if (editingId) {
        const idx = items.findIndex(i => i.id === editingId);
        if (idx !== -1) {
            items[idx] = {
                ...items[idx],
                name,
                category: cat,
                tier,
                type,
                rawAmount,
                cycle
            };
        }
        cancelEditBudgetItem();
    } else {
        items.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            name,
            category: cat,
            tier,
            type,
            rawAmount,
            cycle,
            paidMonths: {}
        });
        if (nameEl) nameEl.value = '';
        if (amtEl) amtEl.value = '';
    }

    syncBudgetsFromLineItems(items);
    renderBudgetForm();
    toggleBudgetBuilder(false);
}

function toggleBudgetBuilder(forceExpand) {
    const card = document.getElementById('budgetBuilderCard');
    const toggleBtn = document.getElementById('budgetBuilderToggleBtn');
    if (!card) return;

    const isCollapsed = card.classList.contains('collapsed');
    const shouldExpand = forceExpand !== undefined ? forceExpand : isCollapsed;

    if (shouldExpand) {
        card.classList.remove('collapsed');
        if (toggleBtn) {
            const textSpan = toggleBtn.querySelector('.toggle-text');
            if (textSpan) textSpan.textContent = '− Tutup Form';
        }
    } else {
        card.classList.add('collapsed');
        if (toggleBtn) {
            const textSpan = toggleBtn.querySelector('.toggle-text');
            if (textSpan) textSpan.textContent = '+ Buka Form';
        }
    }
}

function editBudgetItemInForm(itemId) {
    const items = getBudgetLineItems();
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    toggleBudgetBuilder(true);

    const editIdEl = document.getElementById('editingBudgetItemId');
    const nameEl = document.getElementById('newBudgetItemName');
    const catEl = document.getElementById('newBudgetItemCat');
    const tierEl = document.getElementById('newBudgetItemTier');
    const typeEl = document.getElementById('newBudgetItemType');
    const amtEl = document.getElementById('newBudgetItemAmount');
    const cycleEl = document.getElementById('newBudgetItemCycle');
    const submitBtn = document.getElementById('budgetSubmitItemBtn');
    const cancelBtn = document.getElementById('budgetCancelEditBtn');
    const titleEl = document.getElementById('budgetBuilderFormTitle');

    if (editIdEl) editIdEl.value = String(item.id);
    if (nameEl) nameEl.value = item.name;
    if (catEl) catEl.value = item.category;
    if (tierEl) tierEl.value = String(item.tier || 1);
    if (typeEl) typeEl.value = item.type || 'quota';
    if (amtEl) amtEl.value = Number(item.rawAmount || 0).toLocaleString('id-ID');
    if (cycleEl) cycleEl.value = item.cycle || 'monthly';
    if (submitBtn) submitBtn.textContent = '✓ Simpan Perubahan';
    if (cancelBtn) cancelBtn.style.display = 'inline-flex';
    if (titleEl) titleEl.innerHTML = `<span style="color:var(--accent-primary);">✎ Mengedit Item: ${window.escapeHtml ? window.escapeHtml(item.name) : item.name}</span>`;

    nameEl?.focus();
    nameEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelEditBudgetItem() {
    const editIdEl = document.getElementById('editingBudgetItemId');
    const nameEl = document.getElementById('newBudgetItemName');
    const amtEl = document.getElementById('newBudgetItemAmount');
    const submitBtn = document.getElementById('budgetSubmitItemBtn');
    const cancelBtn = document.getElementById('budgetCancelEditBtn');
    const titleEl = document.getElementById('budgetBuilderFormTitle');

    if (editIdEl) editIdEl.value = '';
    if (nameEl) nameEl.value = '';
    if (amtEl) amtEl.value = '';
    if (submitBtn) submitBtn.textContent = '+ Tambah Item';
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (titleEl) {
        titleEl.innerHTML = `
            <span class="cat-icon-badge cat-icon-badge--bills" style="width:24px;height:24px;">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </span>
            <span>Tambah Item Kebutuhan / Langganan</span>
        `;
    }
    toggleBudgetBuilder(false);
}

function cycleBudgetItemTier(itemId) {
    const items = getBudgetLineItems();
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    item.tier = item.tier === 1 ? 2 : (item.tier === 2 ? 3 : 1);
    syncBudgetsFromLineItems(items);
    renderBudgetForm();
}

function addBlankItemToCategory(cat) {
    const catEl = document.getElementById('newBudgetItemCat');
    const nameEl = document.getElementById('newBudgetItemName');
    if (catEl) catEl.value = cat;
    if (nameEl) {
        nameEl.focus();
        nameEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function updateBudgetLineItemField(itemId, field, value) {
    const items = getBudgetLineItems();
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (field === 'rawAmount') {
        item.rawAmount = parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0;
    } else if (field === 'tier') {
        item.tier = parseInt(value, 10) || 1;
    } else if (field === 'name') {
        item.name = String(value);
    } else if (field === 'cycle') {
        item.cycle = value;
    } else if (field === 'type') {
        item.type = value;
    }

    syncBudgetsFromLineItems(items);
    renderBudgetForm();
}

function toggleSubscriptionPaid(itemId) {
    const items = getBudgetLineItems();
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const periodKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    item.paidMonths = item.paidMonths || {};
    const nextState = !item.paidMonths[periodKey];
    item.paidMonths[periodKey] = nextState;

    syncBudgetsFromLineItems(items);
    renderBudgetForm();
}

function removeBudgetLineItem(itemId) {
    const items = getBudgetLineItems().filter(i => i.id !== itemId);
    syncBudgetsFromLineItems(items);
    renderBudgetForm();
}

function formatCycleDesc(item) {
    const raw = Number(item.rawAmount || 0).toLocaleString('id-ID');
    if (item.cycle === 'daily') return `Rp ${raw} / hari (×30)`;
    if (item.cycle === 'weekly') return `Rp ${raw} / minggu (×4)`;
    if (item.cycle === 'yearly') return `Rp ${raw} / tahun (÷12)`;
    return item.type === 'subscription' ? 'Tagihan / Langganan Bulanan' : 'Kuota Bulanan (×1)';
}

function getTierBadgeLabel(tier) {
    if (tier === 1) return 'T1 · Wajib';
    if (tier === 2) return 'T2 · Penting';
    return 'T3 · Keinginan';
}

function renderBudgetForm() {
    const container = document.getElementById('budgetForm');
    if (!container) return;

    const items = getBudgetLineItems();
    syncBudgetsFromLineItems(items);
    const activeCats = getActiveBudgetCategories();
    const esc = window.escapeHtml || (s => s);
    const periodKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

    if (activeCats.length === 0) {
        container.innerHTML = `
            <div style="grid-column:1 / -1;text-align:center;padding:34px 20px;border:1.5px dashed var(--border);border-radius:14px;color:var(--text-secondary);">
                <div style="font-weight:700;font-size:0.96rem;color:var(--text-primary);margin-bottom:4px;">Belum ada item kebutuhan atau langganan</div>
                <div style="font-size:0.84rem;">Isi form di atas atau klik tombol <strong>Tambah cepat</strong> (misal: <em>+ Langganan Gemini</em> atau <em>+ Makan Harian</em>) untuk mulai menyusun budgetmu.</div>
            </div>
        `;
        updateBudgetStatus();
        return;
    }

    container.innerHTML = activeCats.map(cat => {
        const catItems = items.filter(i => i.category === cat);
        const monthlyAmt = Number(budgets[cat] || 0);

        const rowsHtml = catItems.map(item => {
            const itemMonthly = calcMonthlyItemAmount(item);
            const isSub = item.type === 'subscription';
            const isPaid = Boolean(item.paidMonths && item.paidMonths[periodKey]);

            const statusBtn = isSub
                ? `<button type="button" class="sub-check-btn ${isPaid ? 'paid' : ''}" onclick="toggleSubscriptionPaid(${item.id})" title="Klik untuk tandai status bayar bulan ini">
                    ${isPaid ? '✓ Lunas' : '○ Belum'}
                   </button>`
                : '';

            return `
                <div class="budget-clean-item ${isSub && isPaid ? 'sub-paid' : ''}">
                    <div class="budget-clean-item-left">
                        ${statusBtn}
                        <div class="budget-clean-item-info">
                            <div class="budget-clean-item-title-row">
                                <span class="budget-clean-item-name">${esc(item.name)}</span>
                                <span class="tier-pill tier-pill--${item.tier}" onclick="cycleBudgetItemTier(${item.id})" title="Klik untuk ubah skala prioritas (T1 → T2 → T3)">
                                    ${getTierBadgeLabel(item.tier)}
                                </span>
                            </div>
                            <div class="budget-clean-item-meta">${formatCycleDesc(item)}</div>
                        </div>
                    </div>
                    <div class="budget-clean-item-right">
                        <div class="budget-clean-item-amount">
                            Rp ${itemMonthly.toLocaleString('id-ID')}<span style="font-size:0.7rem;font-weight:600;color:var(--text-secondary);">/bln</span>
                        </div>
                        <div class="budget-clean-item-actions">
                            <button type="button" class="item-action-btn" onclick="editBudgetItemInForm(${item.id})" title="Edit item ini">✎</button>
                            <button type="button" class="item-action-btn del" onclick="removeBudgetLineItem(${item.id})" title="Hapus item ini">✕</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `
        <div class="budget-category-card">
            <div>
                <div class="budget-cat-header">
                    <div class="budget-cat-title-wrap">
                        <span class="budget-cat-title-badge">
                            ${getCategoryBadge(cat)} <span>${formatCategoryName(cat)}</span>
                        </span>
                        <span class="budget-cat-count-pill">
                            ${catItems.length} item
                        </span>
                    </div>
                    <div class="budget-cat-amount-wrap">
                        <span id="budget-${cat}-monthly-eq" class="budget-cat-monthly-val">
                            Rp ${monthlyAmt.toLocaleString('id-ID')}<span class="budget-cat-monthly-sub">/bln</span>
                        </span>
                        <button type="button" class="item-action-btn del" onclick="removeCategoryFromBudget('${cat}')" title="Hapus seluruh pos ${formatCategoryName(cat)}">✕</button>
                    </div>
                </div>
                <div id="budget-${cat}-status" style="margin-bottom: 6px;"></div>
                <div class="budget-items-list">
                    ${rowsHtml}
                </div>
            </div>
        </div>
        `;
    }).join('');

    updateBudgetStatus();
}

function updateBudgetWithCycle(category) {
    updateBudgetStatus();
}

function updateBudget(category, value) {
    budgets[category] = parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0;
    localStorage.setItem('budgets', JSON.stringify(budgets));
    updateBudgetStatus();
}

function updateBudgetStatus() {
    const monthlyTxns = transactions.filter(t => {
        const d = parseTxnDate(t.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const items = getBudgetLineItems();
    const activeCats = getActiveBudgetCategories();
    let totalBudgetLimit = 0;
    let totalBudgetSpent = 0;

    let tier1Total = 0;
    let tier2Total = 0;
    let tier3Total = 0;
    let subTotalCount = 0;
    let subPaidCount = 0;
    const periodKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

    items.forEach(item => {
        const m = calcMonthlyItemAmount(item);
        if (item.tier === 1) tier1Total += m;
        else if (item.tier === 2) tier2Total += m;
        else tier3Total += m;

        if (item.type === 'subscription') {
            subTotalCount++;
            if (item.paidMonths && item.paidMonths[periodKey]) subPaidCount++;
        }
    });

    activeCats.forEach(cat => {
        const spent = monthlyTxns.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0);
        const budget = Number(budgets[cat]) || 0;
        totalBudgetLimit += budget;
        totalBudgetSpent += spent;

        const rawPct = budget > 0 ? (spent / budget * 100) : 0;
        const pctStr = rawPct.toFixed(1);
        const barWidth = Math.min(rawPct, 100).toFixed(1);
        const remaining = budget - spent;
        const el = document.getElementById(`budget-${cat}-status`);

        if (el) {
            let color = 'var(--success)';
            let statusIcon = '●';
            let remText = `Sisa Rp ${Math.max(0, remaining).toLocaleString('id-ID')}`;
            if (rawPct >= 100 && budget > 0) {
                color = 'var(--danger)';
                statusIcon = '[!]';
                remText = `Over Rp ${Math.abs(remaining).toLocaleString('id-ID')}`;
            } else if (rawPct >= 80 && budget > 0) {
                color = 'var(--warning)';
                statusIcon = '▲';
            }
            el.innerHTML = `
                <div class="budget-cat-status-row">
                    <div class="budget-status-spent-col">
                        <span class="budget-status-dot" style="color:${color};">${statusIcon}</span>
                        <span>Terpakai: <strong style="color:var(--text-primary);">${pctStr}%</strong> <span style="opacity:0.85;font-size:0.78rem;">(Rp ${spent.toLocaleString('id-ID')})</span></span>
                    </div>
                    <div class="budget-status-rem-col" style="color:${color};">
                        ${remText}
                    </div>
                </div>
                <div class="budget-progress-track">
                    <div class="budget-progress-fill" style="width:${barWidth}%;background:${color};"></div>
                </div>
            `;
        }
    });

    const summaryEl = document.getElementById('budgetSummaryCard');
    if (summaryEl) {
        const totalDaily = Math.round(totalBudgetLimit / 30);
        const totalWeekly = Math.round(totalBudgetLimit / 4);
        const totalPct = totalBudgetLimit > 0 ? (totalBudgetSpent / totalBudgetLimit * 100) : 0;
        const totalBarW = Math.min(totalPct, 100).toFixed(1);
        const totalRem = totalBudgetLimit - totalBudgetSpent;
        const totalColor = totalPct >= 100 ? 'var(--danger)' : (totalPct >= 80 ? 'var(--warning)' : 'var(--success)');

        const monthlyIncome = monthlyTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        let incomeCompareHtml = '';
        if (monthlyIncome > 0) {
            const unassigned = monthlyIncome - totalBudgetLimit;
            incomeCompareHtml = unassigned >= 0
                ? `<div style="margin-top:10px;padding:8px 12px;border-radius:8px;background:rgba(72,187,120,0.1);border:1px solid rgba(72,187,120,0.3);font-size:0.82rem;color:var(--success);font-weight:600;">
                    ✓ Zero-Based Check: Pendapatan bulan ini (Rp ${monthlyIncome.toLocaleString('id-ID')}) mencukupi seluruh rencana budgetmu dengan sisa <strong>+Rp ${unassigned.toLocaleString('id-ID')}</strong> untuk Tabungan/Investasi.
                   </div>`
                : `<div style="margin-top:10px;padding:8px 12px;border-radius:8px;background:rgba(245,101,101,0.1);border:1px solid rgba(245,101,101,0.3);font-size:0.82rem;color:var(--danger);font-weight:600;">
                    [!] Reality Check: Total rencana budgetmu melebihi pendapatan bulan ini sebesar <strong>Rp ${Math.abs(unassigned).toLocaleString('id-ID')}</strong>. Kamu bisa memangkas item <strong>Tier 3 (Keinginan: Rp ${tier3Total.toLocaleString('id-ID')})</strong> terlebih dahulu.
                   </div>`;
        }

        summaryEl.innerHTML = `
            <div class="budget-kpi-grid">
                <div class="budget-kpi-card">
                    <div>
                        <div class="budget-kpi-label">Total Kebutuhan Ideal (${items.length} Item · ${activeCats.length} Pos)</div>
                        <div class="budget-kpi-val" style="color:var(--accent-primary);">
                            Rp ${totalBudgetLimit.toLocaleString('id-ID')} <span style="font-size:0.78rem;font-weight:600;color:var(--text-secondary);">/bln</span>
                        </div>
                    </div>
                    <div class="budget-kpi-sub">
                        ≈ Rp ${totalDaily.toLocaleString('id-ID')}/hari · Rp ${totalWeekly.toLocaleString('id-ID')}/mgg
                    </div>
                </div>
                <div class="budget-kpi-card">
                    <div>
                        <div class="budget-kpi-label">Minimal Hidup & Kerja (Prioritas 1)</div>
                        <div class="budget-kpi-val" style="color:#ef4444;">
                            Rp ${tier1Total.toLocaleString('id-ID')} <span style="font-size:0.78rem;font-weight:600;color:var(--text-secondary);">/bln</span>
                        </div>
                    </div>
                    <div class="budget-kpi-sub">
                        T2 Penting: Rp ${tier2Total.toLocaleString('id-ID')} · T3 Keinginan: Rp ${tier3Total.toLocaleString('id-ID')}
                    </div>
                </div>
                <div class="budget-kpi-card">
                    <div>
                        <div class="budget-kpi-label">Realisasi & Sisa Kuota Bulan Ini</div>
                        <div class="budget-kpi-val" style="color:${totalColor};">
                            Rp ${totalBudgetSpent.toLocaleString('id-ID')} <span style="font-size:0.82rem;">(${totalPct.toFixed(1)}%)</span>
                        </div>
                    </div>
                    <div>
                        <div class="budget-progress-track" style="height:8px;margin-top:6px;">
                            <div class="budget-progress-fill" style="width:${totalBarW}%;background:${totalColor};"></div>
                        </div>
                        <div class="budget-kpi-sub" style="color:${totalRem >= 0 ? 'var(--success)' : 'var(--danger)'};font-weight:600;margin-top:4px;">
                            ${totalRem >= 0 ? 'Sisa Rp ' + totalRem.toLocaleString('id-ID') : 'Over Rp ' + Math.abs(totalRem).toLocaleString('id-ID')}
                            ${subTotalCount > 0 ? ` · Tagihan Lunas: ${subPaidCount}/${subTotalCount}` : ''}
                        </div>
                    </div>
                </div>
            </div>
            ${incomeCompareHtml ? `<div style="margin-bottom:20px;">${incomeCompareHtml}</div>` : ''}
        `;
    }
}

// ========== HELPERS ==========
function showDailyQuote() {
    const imageTheme = localStorage.getItem('theme') || 'naruto';
    let quotes;
    if (imageTheme === 'original') {
        quotes = [
            "Disiplin finansial hari ini adalah kemerdekaan finansial di masa depan.",
            "Ukur setiap pengeluaran, bangun masa depan dengan rencana nyata.",
            "Bukan seberapa banyak yang kamu hasilkan, tapi seberapa bijak kamu mengelolanya.",
            "Tabungan kecil yang konsisten akan menciptakan fondasi hidup yang kokoh.",
            "Kebebasan finansial dimulai dari kendali penuh atas kebutuhanmu."
        ];
    } else if (imageTheme === 'onepiece') {
        quotes = [
            "Set sail, track every berry!",
            "Build your treasure, one step at a time!",
            "Navigate your budget like a captain!",
            "Keep your crew budget battle-ready!",
            "Grand goals start from daily discipline!"
        ];
    } else {
        quotes = [
            "Track smart, spend wise!",
            "Monthly reflection helps growth!",
            "Financial awareness = Freedom!",
            "You're doing great!",
            "Small steps, big savings!"
        ];
    }
    document.getElementById('dailyQuote').textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
}

function formatDate(dateStr) {
    const d = parseTxnDate(dateStr);
    if (isNaN(d.getTime())) return dateStr || '-';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

window.updateDashboards = updateDashboards;
window.renderTransactions = renderTransactions;
window.updateBudgetStatus = updateBudgetStatus;
window.renderAnalytics = renderAnalytics;
window.renderBudgetForm = renderBudgetForm;
window.switchView = switchView;
window.deleteTransaction = deleteTransaction;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.updateBudget = updateBudget;
window.updateBudgetWithCycle = updateBudgetWithCycle;
window.addCategoryToBudget = addCategoryToBudget;
window.removeCategoryFromBudget = removeCategoryFromBudget;
window.quickAddBudgetPreset = quickAddBudgetPreset;
window.handleAddCustomBudgetItem = handleAddCustomBudgetItem;
window.editBudgetItemInForm = editBudgetItemInForm;
window.cancelEditBudgetItem = cancelEditBudgetItem;
window.cycleBudgetItemTier = cycleBudgetItemTier;
window.addBlankItemToCategory = addBlankItemToCategory;
window.updateBudgetLineItemField = updateBudgetLineItemField;
window.toggleSubscriptionPaid = toggleSubscriptionPaid;
window.removeBudgetLineItem = removeBudgetLineItem;
window.toggleBudgetBuilder = toggleBudgetBuilder;
