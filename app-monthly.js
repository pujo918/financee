// ========== APP STATE ==========
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let budgets = JSON.parse(localStorage.getItem('budgets')) || {
    food: 500000, transport: 300000, bills: 500000, study: 400000,
    entertainment: 200000, shopping: 300000, health: 200000, other: 200000
};
let recognition;
let isListening = false;
let voiceTransaction = null;
let currentLang = localStorage.getItem('voiceLang') || 'en-US';

// NEW: Month/Year selection state
let currentView = 'monthly'; // 'monthly' or 'alltime'
let selectedMonth = new Date().getMonth();
let selectedYear = new Date().getFullYear();

function sendToSheet(data) {
    fetch("https://script.google.com/macros/s/AKfycbyqnT0jfZwiKwQzM4NLM-zOUEIzL_9ZlsDg4_Bg8tLk9334A_eMIfAHgHG8IHUPSwzbRA/exec", {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data),
        keepalive: true
    })
    .then(() => {
        console.log("Data sent to spreadsheet");
    })
    .catch(err => {
        console.error("Failed to send:", err);
    });
}

function buildSheetPayload(txn) {
    const date = txn?.date || '';
    return {
        action: 'add',
        id: txn?.id || '',
        date,
        month: typeof date === 'string' ? date.slice(0, 7) : '',
        type: txn?.type || '',
        category: txn?.category || '',
        description: txn?.description || '',
        amount: Number(txn?.amount) || 0,
        source: txn?.method || ''
    };
}

function buildSheetDeletePayload(id) {
    return {
        action: 'delete',
        id
    };
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', function() {
    loadTheme();
    setTodayDate();
    populateMonthYearSelectors();
    updateDashboards();
    renderTransactions();
    initVoiceRecognition();
    renderBudgetForm();
    showDailyQuote();
    initEventListeners();
    updateLangButton();
    updateVoiceSuggestions();
});

function initEventListeners() {
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('langToggle').addEventListener('click', toggleLanguage);
    document.getElementById('voiceButton').addEventListener('click', toggleVoiceInput);
    
    document.querySelectorAll('.voice-suggestion').forEach(btn => {
        btn.addEventListener('click', function() {
            simulateVoice(this.getAttribute('data-text'));
        });
    });
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.getAttribute('data-tab'), this);
        });
    });
    
    document.getElementById('confirmSaveBtn').addEventListener('click', saveVoiceTransaction);
    document.getElementById('confirmCancelBtn').addEventListener('click', closeConfirmModal);
    document.getElementById('transactionForm').addEventListener('submit', handleFormSubmit);
    
    // Month/Year change listeners
    document.getElementById('monthSelect').addEventListener('change', function() {
        selectedMonth = parseInt(this.value);
        updateDashboards();
        renderTransactions();
        updatePeriodLabels();
    });
    
    document.getElementById('yearSelect').addEventListener('change', function() {
        selectedYear = parseInt(this.value);
        updateDashboards();
        renderTransactions();
        updatePeriodLabels();
    });

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
    if (!Number.isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
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
}

// ========== DASHBOARDS UPDATE ==========
function updateDashboards() {
    if (currentView === 'monthly') {
        updateMonthlyDashboard();
    } else {
        updateAlltimeDashboard();
    }
}

function updateMonthlyDashboard() {
    const monthlyTxns = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const income = monthlyTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthlyTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const net = income - expense;

    document.getElementById('monthlyIncome').textContent = `Rp ${income.toLocaleString('id-ID')}`;
    document.getElementById('monthlyExpense').textContent = `Rp ${expense.toLocaleString('id-ID')}`;
    document.getElementById('monthlyNet').textContent = `Rp ${net.toLocaleString('id-ID')}`;

    const indicator = document.getElementById('monthlyHealthIndicator');
    if (net >= 0) {
        indicator.className = 'health-indicator health-safe';
        indicator.innerHTML = '<span>🟢</span> <span>Positive flow!</span>';
    } else {
        indicator.className = 'health-indicator health-critical';
        indicator.innerHTML = '<span>🔴</span> <span>Spending exceeds income</span>';
    }
    
    // Update badge
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

    document.getElementById('alltimeIncome').textContent = `Rp ${allIncome.toLocaleString('id-ID')}`;
    document.getElementById('alltimeExpense').textContent = `Rp ${allExpense.toLocaleString('id-ID')}`;
    document.getElementById('alltimeBalance').textContent = `Rp ${balance.toLocaleString('id-ID')}`;

    const indicator = document.getElementById('alltimeHealthIndicator');
    if (balance >= 0) {
        indicator.className = 'health-indicator health-safe';
        indicator.innerHTML = '<span>🟢</span> <span>You\'re doing well!</span>';
    } else {
        indicator.className = 'health-indicator health-critical';
        indicator.innerHTML = '<span>🔴</span> <span>Overall deficit</span>';
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
        const d = new Date(t.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
}

function renderTransactions() {
    const container = document.getElementById('transactionsList');
    const filtered = getFilteredTransactions();
    
    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 40px;"><div style="font-size: 3rem;">📝</div><p>No transactions in this period</p></div>';
        return;
    }

    container.innerHTML = filtered.map(t => `
        <div class="transaction-item">
            <div class="transaction-info">
                <span class="transaction-category">${getCategoryEmoji(t.category)} ${t.category}</span>
                <div class="transaction-description">${t.description || 'No description'}</div>
                <div class="transaction-date">${formatDate(t.date)} ${t.method === 'voice' ? '🎤' : '⌨️'}</div>
            </div>
            <div class="transaction-amount ${t.type === 'income' ? 'amount-income' : 'amount-expense'}">
                ${t.type === 'income' ? '+' : '-'}Rp ${t.amount.toLocaleString('id-ID')}
            </div>
            <div class="transaction-actions">
                <button class="btn-icon" onclick="deleteTransaction(${t.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function setTodayDate() {
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const transaction = {
        id: Date.now(),
        type: document.getElementById('type').value,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        date: document.getElementById('date').value,
        description: document.getElementById('description').value,
        method: 'manual'
    };

    transactions.unshift(transaction);
    saveTransactions();
    updateDashboards();
    renderTransactions();

    sendToSheet(buildSheetPayload(transaction));
    
    this.reset();
    setTodayDate();
    alert('✓ Added!');
}

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function deleteTransaction(id) {
    if (confirm('Delete?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        updateDashboards();
        renderTransactions();

        sendToSheet(buildSheetDeletePayload(id));
    }
}

// ========== LANGUAGE TOGGLE ==========
function toggleLanguage() {
    currentLang = currentLang === 'en-US' ? 'id-ID' : 'en-US';
    localStorage.setItem('voiceLang', currentLang);
    if (recognition) recognition.lang = currentLang;
    updateLangButton();
    updateVoiceSuggestions();
}

function updateLangButton() {
    const btn = document.getElementById('langToggle');
    btn.textContent = currentLang === 'en-US' ? '🇬🇧 EN' : '🇮🇩 ID';
    btn.classList.add('active');
}

function updateVoiceSuggestions() {
    const container = document.getElementById('voiceSuggestions');
    if (currentLang === 'en-US') {
        container.innerHTML = `
            <span class="voice-suggestion" data-text="I buy coffee twenty thousand">💡 "I buy coffee 20k"</span>
            <span class="voice-suggestion" data-text="Lunch at restaurant fifty thousand">💡 "Lunch 50k"</span>
            <span class="voice-suggestion" data-text="Got three hundred k from freelance">💡 "Got 300k"</span>
        `;
    } else {
        container.innerHTML = `
            <span class="voice-suggestion" data-text="Saya beli kopi dua puluh ribu">💡 "Beli kopi 20rb"</span>
            <span class="voice-suggestion" data-text="Makan siang lima puluh ribu">💡 "Makan 50rb"</span>
            <span class="voice-suggestion" data-text="Terima tiga ratus ribu dari freelance">💡 "Terima 300rb"</span>
        `;
    }
    document.querySelectorAll('.voice-suggestion').forEach(btn => {
        btn.addEventListener('click', function() {
            simulateVoice(this.getAttribute('data-text'));
        });
    });
}

// ========== THEME ==========
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    document.getElementById('themeToggle').textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

function loadTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('themeToggle').textContent = saved === 'dark' ? '☀️' : '🌙';
}

// ========== TABS ==========
function switchTab(tabName, clickedTab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    clickedTab.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
    if (tabName === 'analytics') renderAnalytics();
}

// ========== VOICE (Same as before) ==========
function initVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        document.getElementById('voiceStatus').textContent = '❌ Voice not supported';
        document.getElementById('voiceButton').disabled = true;
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;
    recognition.lang = currentLang;

    recognition.onstart = () => {
        document.getElementById('voiceStatus').textContent = '🎤 Listening...';
        document.getElementById('voiceResult').innerHTML = '<div style="opacity: 0.7;">Processing...</div>';
    };

    recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];
            const best = res && res[0] ? res[0].transcript : '';
            if (res.isFinal) {
                finalTranscript += best + ' ';
            } else {
                interimTranscript += best + ' ';
            }
        }

        const transcript = (finalTranscript + interimTranscript).trim();
        if (!transcript) return;

        document.getElementById('voiceResult').innerHTML = `
            <div style="margin-bottom: 8px;"><strong>Heard:</strong> "${transcript}"</div>
            <div style="font-size: 0.85rem; opacity: 0.8;">${finalTranscript.trim() ? 'Parsing...' : 'Listening...'}</div>
        `;

        if (finalTranscript.trim()) {
            setTimeout(() => parseVoiceInput(finalTranscript.trim()), 150);
        }
    };

    recognition.onerror = (event) => {
        let msg = 'Could not understand. Try again.';
        if (event.error === 'no-speech') msg = 'No speech detected.';
        document.getElementById('voiceStatus').textContent = msg;
        document.getElementById('voiceResult').innerHTML = `<div style="color: var(--warning);">${msg}</div>`;
        stopVoiceInput();
    };

    recognition.onend = () => {
        stopVoiceInput();
    };
}

function toggleVoiceInput() {
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
        isListening = true;
        document.getElementById('voiceButton').classList.add('listening');
    }
}

function stopVoiceInput() {
    isListening = false;
    document.getElementById('voiceButton').classList.remove('listening');
    document.getElementById('voiceStatus').textContent = 'Tap to start';
}

function simulateVoice(text) {
    document.getElementById('voiceResult').innerHTML = `
        <div style="margin-bottom: 8px;"><strong>Testing:</strong> "${text}"</div>
        <div style="font-size: 0.85rem; opacity: 0.8;">Parsing...</div>
    `;
    setTimeout(() => parseVoiceInput(text), 300);
}

function parseVoiceInput(text) {
    const parsed = parser.parse(text);
    document.getElementById('voiceResult').innerHTML = `
        <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; line-height: 1.8;">
            <strong>Parsed:</strong><br>
            💰 Rp ${parsed.amount.toLocaleString('id-ID')}<br>
            📊 ${parsed.type === 'income' ? '✅ Income' : '❌ Expense'}<br>
            📁 ${getCategoryEmoji(parsed.category)} ${parsed.category}<br>
            📅 ${formatDate(parsed.date)}<br>
            📝 ${parsed.description}
        </div>
    `;

    if (parsed.amount === 0) {
        document.getElementById('voiceResult').innerHTML += `
            <div style="background: rgba(237, 137, 54, 0.3); margin-top: 10px; padding: 12px; border-radius: 8px; color: white;">
                ⚠️ No amount detected!<br>
                <small>Try: "25k" or "dua puluh ribu"</small>
            </div>
        `;
        return;
    }

    voiceTransaction = {
        type: parsed.type,
        amount: parsed.amount,
        category: parsed.category,
        date: parsed.date,
        description: parsed.description,
        method: 'voice'
    };

    showConfirmModal();
}

// ========== MODAL ==========
function showConfirmModal() {
    document.getElementById('confirmType').innerHTML = 
        voiceTransaction.type === 'income' 
            ? '<span style="color: var(--success);">✅ Income</span>' 
            : '<span style="color: var(--danger);">❌ Expense</span>';
    document.getElementById('confirmAmount').textContent = `Rp ${voiceTransaction.amount.toLocaleString('id-ID')}`;
    document.getElementById('confirmCategory').innerHTML = `${getCategoryEmoji(voiceTransaction.category)} ${voiceTransaction.category}`;
    document.getElementById('confirmDate').textContent = formatDate(voiceTransaction.date);
    document.getElementById('confirmDescription').textContent = voiceTransaction.description;
    document.getElementById('confirmModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
    voiceTransaction = null;
}

function saveVoiceTransaction() {
    if (voiceTransaction && voiceTransaction.amount > 0) {
        const txn = { id: Date.now(), ...voiceTransaction };
        transactions.unshift(txn);
        saveTransactions();
        updateDashboards();
        renderTransactions();

        sendToSheet(buildSheetPayload(txn));
        closeConfirmModal();
        document.getElementById('voiceResult').innerHTML = `
            <div style="background: rgba(72, 187, 120, 0.3); padding: 15px; border-radius: 8px; color: white;">
                <strong>✓ Saved!</strong>
            </div>
        `;
        setTimeout(() => { document.getElementById('voiceResult').innerHTML = ''; }, 3000);
    }
}

// ========== ANALYTICS ==========
function renderAnalytics() {
    renderCategoryBreakdown();
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

    container.innerHTML = Object.entries(catTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => {
            const pct = (amt / total * 100).toFixed(1);
            return `
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>${getCategoryEmoji(cat)} ${cat}</span>
                        <span><strong>Rp ${amt.toLocaleString('id-ID')}</strong> (${pct}%)</span>
                    </div>
                    <div style="background: var(--bg-primary); height: 12px; border-radius: 6px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); height: 100%; width: ${pct}%; transition: width 0.5s;"></div>
                    </div>
                </div>
            `;
        }).join('');
}

// ========== BUDGET ==========
function renderBudgetForm() {
    const container = document.getElementById('budgetForm');
    const cats = ['food', 'transport', 'bills', 'study', 'entertainment', 'shopping', 'health', 'other'];

    container.innerHTML = cats.map(cat => `
        <div class="form-group">
            <label>${getCategoryEmoji(cat)} ${cat.charAt(0).toUpperCase() + cat.slice(1)}</label>
            <input type="number" value="${budgets[cat]}" onchange="updateBudget('${cat}', this.value)">
            <div id="budget-${cat}-status" style="margin-top: 8px; font-size: 0.9rem;"></div>
        </div>
    `).join('');

    updateBudgetStatus();
}

function updateBudget(category, value) {
    budgets[category] = parseInt(value) || 0;
    localStorage.setItem('budgets', JSON.stringify(budgets));
    updateBudgetStatus();
}

function updateBudgetStatus() {
    const monthlyTxns = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    Object.keys(budgets).forEach(cat => {
        const spent = monthlyTxns.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0);
        const budget = budgets[cat];
        const pct = budget > 0 ? (spent / budget * 100).toFixed(1) : 0;
        const el = document.getElementById(`budget-${cat}-status`);

        if (el) {
            let color = 'var(--success)';
            let msg = `${pct}% used`;
            if (pct >= 100) {
                color = 'var(--danger)';
                msg = `⚠️ Over budget!`;
            } else if (pct >= 80) {
                color = 'var(--warning)';
                msg = `⚡ ${pct}%`;
            }
            el.style.color = color;
            el.textContent = msg;
        }
    });
}

// ========== HELPERS ==========
function showDailyQuote() {
    const quotes = [
        "Track smart, spend wise!",
        "Monthly reflection helps growth!",
        "Financial awareness = Freedom!",
        "You're doing great!",
        "Small steps, big savings!"
    ];
    document.getElementById('dailyQuote').textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
}

function getCategoryEmoji(cat) {
    const emojis = {
        food: '🍔', transport: '🚗', bills: '💡', study: '📚',
        entertainment: '🎮', shopping: '🛍️', health: '🏥', other: '📦'
    };
    return emojis[cat] || '📦';
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
