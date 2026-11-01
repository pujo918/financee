// app-global-voice.js – Global voice handler for all pages
var recognition = null;
var isListening = false;
var voiceTransaction = null;
var currentLang = localStorage.getItem('voiceLang') || 'id-ID';

const SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyqnT0jfZwiKwQzM4NLM-zOUEIzL_9ZlsDg4_Bg8tLk9334A_eMIfAHgHG8IHUPSwzbRA/exec";
const SHEET_QUEUE_KEY = "sheet_sync_queue";

function getSheetQueue() {
    try {
        return JSON.parse(localStorage.getItem(SHEET_QUEUE_KEY) || "[]");
    } catch {
        return [];
    }
}

function setSheetQueue(queue) {
    localStorage.setItem(SHEET_QUEUE_KEY, JSON.stringify(queue));
}

function enqueueSheetPayload(data) {
    const q = getSheetQueue();
    q.push({ payload: data, queuedAt: Date.now() });
    setSheetQueue(q);
}

function sendToSheet(data) {
    if (!navigator.onLine) {
        enqueueSheetPayload(data);
        console.log("Offline: queued payload for spreadsheet sync");
        return;
    }
    fetch(SHEET_WEBAPP_URL, {
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
        console.error("Failed to send, queuing for retry:", err);
        enqueueSheetPayload(data);
    });
}

async function flushSheetSyncQueue() {
    if (!navigator.onLine) return;
    const q = getSheetQueue();
    if (!q.length) return;

    const remaining = [];
    for (const item of q) {
        try {
            await fetch(SHEET_WEBAPP_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(item.payload),
                keepalive: true
            });
        } catch (err) {
            remaining.push(item);
        }
    }
    setSheetQueue(remaining);
}

window.addEventListener('online', flushSheetSyncQueue);
document.addEventListener('DOMContentLoaded', flushSheetSyncQueue);

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

window.sendToSheet = sendToSheet;
window.buildSheetPayload = buildSheetPayload;
window.buildSheetDeletePayload = buildSheetDeletePayload;

// ========== STORAGE HELPERS ==========
function getSavingsGeneral() {
    try {
        const raw = localStorage.getItem('savings_general');
        if (!raw) return { total: 0, history: [] };
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'number') return { total: parsed, history: [] };
        return { total: Number(parsed.total) || 0, history: parsed.history || [] };
    } catch { return { total: 0, history: [] }; }
}

function setSavingsGeneral(data) {
    localStorage.setItem('savings_general', JSON.stringify(data));
}

function getSavingsGoals() {
    try {
        const raw = localStorage.getItem('savings_goals');
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return arr.map(g => ({
            name: g.name || '',
            target: Number(g.target) || 0,
            deadline: g.deadline || '',
            current: Number(g.current) || 0,
            history: g.history || []
        }));
    } catch { return []; }
}

function setSavingsGoals(goals) {
    localStorage.setItem('savings_goals', JSON.stringify(goals));
}

function todayStr() {
    return typeof window.getLocalTodayStr === 'function'
        ? window.getLocalTodayStr()
        : new Date().toISOString().split('T')[0];
}

// ========== VOICE INIT ==========
document.addEventListener('DOMContentLoaded', function () {
    currentLang = localStorage.getItem('voiceLang') || 'id-ID';
    initVoiceRecognition();

    const voiceBtn = document.getElementById('voiceButton');
    if (voiceBtn) voiceBtn.onclick = toggleVoiceInput;

    const confirmSaveBtn = document.getElementById('confirmSaveBtn');
    if (confirmSaveBtn) confirmSaveBtn.onclick = saveVoiceTransaction;

    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    if (confirmCancelBtn) confirmCancelBtn.onclick = closeConfirmModal;

    updateVoiceSuggestions();
});

function selectBestAlternative(primaryText, alternativesList) {
    if (!alternativesList || alternativesList.length === 0) return primaryText;
    const goals = getSavingsGoals();

    const primaryParsed = parser.parseMultiple(primaryText, goals);
    if (primaryParsed.some(p => p.amount > 0)) {
        return primaryText;
    }

    for (const altText of alternativesList) {
        if (!altText || altText === primaryText) continue;
        const altParsed = parser.parseMultiple(altText, goals);
        if (altParsed.some(p => p.amount > 0)) {
            console.log("Voice Engine: used alternative ->", altText);
            return altText;
        }
    }
    return primaryText;
}

function initVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        const status = document.getElementById('voiceStatus');
        const btn = document.getElementById('voiceButton');
        if (status) status.textContent = '[!] Voice input tidak didukung di browser ini';
        if (btn) btn.disabled = true;
        return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;
    recognition.lang = currentLang;
    window.recognition = recognition;

    recognition.onstart = () => {
        const lang = localStorage.getItem('voiceLang') || currentLang || 'id-ID';
        const isEn = lang.startsWith('en');
        const s = document.getElementById('voiceStatus');
        const r = document.getElementById('voiceResult');
        if (s) s.textContent = isEn ? '● Listening...' : '● Mendengarkan...';
        if (r) r.innerHTML = `<div style="opacity:0.7;">${isEn ? 'Processing voice...' : 'Memproses suara...'}</div>`;
    };

    recognition.onresult = (event) => {
        let final = '', interim = '';
        const collectedAlternatives = [];
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];
            const t = res[0].transcript;
            if (res.isFinal) {
                final += t + ' ';
                for (let a = 0; a < res.length; a++) {
                    if (res[a] && res[a].transcript) {
                        collectedAlternatives.push(res[a].transcript.trim());
                    }
                }
            } else {
                interim += t + ' ';
            }
        }
        const transcript = (final + interim).trim();
        if (!transcript) return;

        const bestTranscript = final.trim()
            ? selectBestAlternative(final.trim(), collectedAlternatives)
            : transcript;

        const safeTranscript = window.escapeHtml ? window.escapeHtml(bestTranscript) : bestTranscript;
        const resEl = document.getElementById('voiceResult');
        const lang = localStorage.getItem('voiceLang') || currentLang || 'id-ID';
        const isEn = lang.startsWith('en');
        if (resEl) {
            resEl.innerHTML = `
                <div style="margin-bottom:8px;"><strong>${isEn ? 'Heard:' : 'Terdengar:'}</strong> "${safeTranscript}"</div>
                <div style="font-size:0.85rem;opacity:0.8;">${final.trim() ? (isEn ? 'Analyzing...' : 'Menganalisis...') : (isEn ? 'Listening...' : 'Mendengarkan...')}</div>
            `;
        }
        if (final.trim()) setTimeout(() => parseVoiceInput(bestTranscript), 150);
    };

    recognition.onerror = (event) => {
        const lang = localStorage.getItem('voiceLang') || currentLang || 'id-ID';
        const isEn = lang.startsWith('en');
        const msg = event.error === 'no-speech'
            ? (isEn ? 'No speech heard.' : 'Tidak terdengar suara.')
            : (isEn ? 'Could not understand voice. Please try again.' : 'Tidak dapat memahami suara. Coba lagi.');
        const s = document.getElementById('voiceStatus');
        const r = document.getElementById('voiceResult');
        if (s) s.textContent = msg;
        if (r) r.innerHTML = `<div style="color:var(--warning);">[!] ${msg}</div>`;
        stopVoiceInput();
    };

    recognition.onend = () => stopVoiceInput();
}

function toggleVoiceInput() {
    if (!recognition) return;
    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.lang = localStorage.getItem('voiceLang') || currentLang || 'id-ID';
            recognition.start();
            isListening = true;
            const btn = document.getElementById('voiceButton');
            if (btn) btn.classList.add('listening');
        } catch (err) {
            stopVoiceInput();
        }
    }
}

function stopVoiceInput() {
    isListening = false;
    const btn = document.getElementById('voiceButton');
    const status = document.getElementById('voiceStatus');
    if (btn) btn.classList.remove('listening');
    if (status) {
        const lang = localStorage.getItem('voiceLang') || currentLang || 'id-ID';
        status.textContent = lang === 'en-US' ? 'Tap to start' : 'Tap untuk mulai';
    }
}

function simulateVoice(text) {
    const safeText = window.escapeHtml ? window.escapeHtml(text) : text;
    const r = document.getElementById('voiceResult');
    if (r) r.innerHTML = `<div style="margin-bottom:8px;"><strong>Input:</strong> "${safeText}"</div><div style="font-size:0.85rem;opacity:0.8;">Menganalisis...</div>`;
    setTimeout(() => parseVoiceInput(text), 250);
}

// ========== CORE PARSING ==========
function parseVoiceInput(text) {
    const goals = getSavingsGoals();
    const parsedList = typeof parser.parseMultiple === 'function'
        ? parser.parseMultiple(text, goals)
        : [parser.parse(text, goals)];
    const resEl = document.getElementById('voiceResult');
    if (!resEl) return;

    const esc = window.escapeHtml || (s => s);
    const lang = localStorage.getItem('voiceLang') || currentLang || 'id-ID';
    const isEn = lang.startsWith('en');

    if (parsedList.length > 1) {
        let totalIncome = 0;
        let totalExpense = 0;
        let totalSaving = 0;

        const rowsHtml = parsedList.map((it, idx) => {
            if (it.intent === 'saving') {
                totalSaving += it.amount || 0;
                const actionText = it.action === 'deposit' ? (isEn ? 'Deposit' : 'Simpan') : (isEn ? 'Withdraw' : 'Tarik');
                return `<div style="margin-bottom:4px;">${idx + 1}. <strong>◈ ${isEn ? 'Savings' : 'Tabungan'} (${esc(it.goalName || (isEn ? 'General' : 'Umum'))})</strong>: ${it.action === 'deposit' ? '+' : '−'}Rp ${it.amount.toLocaleString('id-ID')} (${actionText})</div>`;
            }
            if (it.type === 'income') {
                totalIncome += it.amount || 0;
            } else {
                totalExpense += it.amount || 0;
            }
            const badge = typeof window.getCategoryBadgeHtml === 'function' ? window.getCategoryBadgeHtml(it.category || 'other') : '';
            const sign = it.type === 'income' ? '+' : '−';
            const col = it.type === 'income' ? 'var(--success)' : 'var(--danger)';
            return `<div style="margin-bottom:4px;display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
                <span>${idx + 1}.</span> ${badge} <strong>${esc(it.category || 'other')}</strong>
                <span>(${esc(it.description || '-')})</span>:
                <strong style="color:${col};">${sign}Rp ${it.amount.toLocaleString('id-ID')}</strong>
            </div>`;
        }).join('');

        let totalsSummary = '';
        if (totalIncome > 0 && totalExpense > 0) {
            totalsSummary = `
                <div style="border-top:1px solid rgba(255,255,255,0.25);margin-top:6px;padding-top:6px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;">
                    <span>${isEn ? 'Total Income' : 'Total Masuk'}: <strong style="color:var(--success);">+Rp ${totalIncome.toLocaleString('id-ID')}</strong></span>
                    <span>${isEn ? 'Total Expense' : 'Total Keluar'}: <strong style="color:var(--danger);">−Rp ${totalExpense.toLocaleString('id-ID')}</strong></span>
                </div>
            `;
        } else if (totalIncome > 0) {
            totalsSummary = `
                <div style="border-top:1px solid rgba(255,255,255,0.25);margin-top:6px;padding-top:6px;">
                    ${isEn ? 'Total Income' : 'Total Pemasukan'}: <strong style="color:var(--success);">+Rp ${totalIncome.toLocaleString('id-ID')}</strong>
                </div>
            `;
        } else if (totalExpense > 0) {
            totalsSummary = `
                <div style="border-top:1px solid rgba(255,255,255,0.25);margin-top:6px;padding-top:6px;">
                    Total: <strong>Rp ${totalExpense.toLocaleString('id-ID')}</strong>
                </div>
            `;
        }
        if (totalSaving > 0) {
            totalsSummary += `
                <div style="border-top:1px solid rgba(255,255,255,0.15);margin-top:4px;padding-top:4px;">
                    ${isEn ? 'Total Savings' : 'Total Tabungan'}: <strong style="color:var(--accent-secondary);">Rp ${totalSaving.toLocaleString('id-ID')}</strong>
                </div>
            `;
        }

        resEl.innerHTML = `
            <div style="background:rgba(255,255,255,0.16);padding:12px;border-radius:8px;line-height:1.7;text-align:left;max-width:460px;margin:0 auto;">
                <strong>✓ ${isEn ? `Detected ${parsedList.length} Transactions` : `Terdeteksi ${parsedList.length} Transaksi Sekaligus`}</strong><br>
                ${rowsHtml}
                ${totalsSummary}
            </div>
        `;

        voiceTransaction = {
            intent: 'batch',
            items: parsedList.map(p => ({ ...p, method: 'voice' }))
        };
        showConfirmModal();
        return;
    }

    const parsed = parsedList[0];

    if (parsed.intent === 'saving') {
        const actionLabel = parsed.action === 'deposit' 
            ? (isEn ? '+ Deposit' : '+ Simpan') 
            : (isEn ? '− Withdraw' : '− Tarik');
        const goalLabel = esc(parsed.goalName || (isEn ? 'General' : 'Umum'));

        resEl.innerHTML = `
            <div style="background:rgba(255,255,255,0.16);padding:12px;border-radius:8px;line-height:1.8;text-align:left;max-width:420px;margin:0 auto;">
                <strong>◈ ${isEn ? 'Savings Summary' : 'Ringkasan Tabungan'}</strong><br>
                ▸ ${isEn ? 'Amount' : 'Nominal'}: Rp ${parsed.amount.toLocaleString('id-ID')}<br>
                ▸ ${isEn ? 'Action' : 'Aksi'}: ${actionLabel}<br>
                ▸ ${isEn ? 'Goal' : 'Tujuan'}: <strong>${goalLabel}</strong>
            </div>
        `;

        if (parsed.amount === 0) {
            resEl.innerHTML += `<div style="background:rgba(237,137,54,0.3);margin-top:10px;padding:12px;border-radius:8px;color:white;">[!] ${isEn ? 'Amount not detected.<br><small>Example: "save 50 thousand for Japan"</small>' : 'Nominal tidak terdeteksi.<br><small>Contoh: "nabung 50 ribu ke Jepang"</small>'}</div>`;
            return;
        }

        voiceTransaction = {
            intent: 'saving',
            action: parsed.action,
            amount: parsed.amount,
            goalName: parsed.goalName,
            method: 'voice'
        };
        showConfirmModal();

    } else {
        const catBadge = typeof window.getCategoryBadgeHtml === 'function' ? window.getCategoryBadgeHtml(parsed.category || 'other') : '';
        const typeLabel = parsed.type === 'income'
            ? (isEn ? '+ Income' : '+ Pemasukan')
            : (isEn ? '− Expense' : '− Pengeluaran');

        resEl.innerHTML = `
            <div style="background:rgba(255,255,255,0.16);padding:12px;border-radius:8px;line-height:1.8;text-align:left;max-width:420px;margin:0 auto;">
                <strong>${isEn ? 'Transaction Summary' : 'Ringkasan Transaksi'}</strong><br>
                ▸ ${isEn ? 'Amount' : 'Nominal'}: Rp ${parsed.amount.toLocaleString('id-ID')}<br>
                ▸ ${isEn ? 'Type' : 'Tipe'}: ${typeLabel}<br>
                ▸ ${isEn ? 'Category' : 'Kategori'}: ${catBadge} <strong>${esc(parsed.category || 'other')}</strong><br>
                ▸ ${isEn ? 'Notes' : 'Catatan'}: ${esc(parsed.description || '-')}
            </div>
        `;

        if (parsed.amount === 0) {
            resEl.innerHTML += `<div style="background:rgba(237,137,54,0.3);margin-top:10px;padding:12px;border-radius:8px;color:white;">[!] ${isEn ? 'Amount not detected.<br><small>Example: "buy coffee 25 thousand"</small>' : 'Nominal tidak terdeteksi.<br><small>Contoh: "beli makan 25 ribu"</small>'}</div>`;
            return;
        }

        voiceTransaction = {
            intent: 'transaction',
            type: parsed.type,
            amount: parsed.amount,
            category: parsed.category || 'other',
            date: parsed.date,
            description: parsed.description,
            method: 'voice'
        };
        showConfirmModal();
    }
}

// ========== CONFIRM MODAL ==========
function showConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (!modal) return;
    const dc = modal.querySelector('.confirm-details');
    if (!dc) return;

    const esc = window.escapeHtml || (s => s);
    const lang = localStorage.getItem('voiceLang') || currentLang || 'id-ID';
    const isEn = lang.startsWith('en');

    if (voiceTransaction.intent === 'batch') {
        let totalIncome = 0;
        let totalExpense = 0;
        let totalSaving = 0;

        voiceTransaction.items.forEach(it => {
            if (it.intent === 'saving') {
                totalSaving += it.amount || 0;
            } else if (it.type === 'income') {
                totalIncome += it.amount || 0;
            } else {
                totalExpense += it.amount || 0;
            }
        });

        let summaryRows = '';
        if (totalIncome > 0 && totalExpense > 0) {
            summaryRows = `
                <div class="confirm-item">
                    <span class="confirm-label">${isEn ? 'Total Income' : 'Total Masuk'}</span>
                    <span class="confirm-value" style="color:var(--success);">+Rp ${totalIncome.toLocaleString('id-ID')}</span>
                </div>
                <div class="confirm-item">
                    <span class="confirm-label">${isEn ? 'Total Expense' : 'Total Keluar'}</span>
                    <span class="confirm-value" style="color:var(--danger);">−Rp ${totalExpense.toLocaleString('id-ID')}</span>
                </div>
                <div class="confirm-item">
                    <span class="confirm-label">${isEn ? 'Net Difference' : 'Selisih Bersih'}</span>
                    <span class="confirm-value" style="color:var(--accent-primary);">${totalIncome - totalExpense >= 0 ? '+' : '−'}Rp ${Math.abs(totalIncome - totalExpense).toLocaleString('id-ID')}</span>
                </div>
            `;
        } else if (totalIncome > 0) {
            summaryRows = `
                <div class="confirm-item">
                    <span class="confirm-label">${isEn ? 'Total Income' : 'Total Pemasukan'}</span>
                    <span class="confirm-value" style="color:var(--success);">+Rp ${totalIncome.toLocaleString('id-ID')}</span>
                </div>
            `;
        } else if (totalExpense > 0) {
            summaryRows = `
                <div class="confirm-item">
                    <span class="confirm-label">${isEn ? 'Total Expense' : 'Total Pengeluaran'}</span>
                    <span class="confirm-value" style="color:var(--accent-primary);">Rp ${totalExpense.toLocaleString('id-ID')}</span>
                </div>
            `;
        }
        if (totalSaving > 0) {
            summaryRows += `
                <div class="confirm-item">
                    <span class="confirm-label">${isEn ? 'Total Savings' : 'Total Tabungan'}</span>
                    <span class="confirm-value" style="color:var(--accent-secondary);">Rp ${totalSaving.toLocaleString('id-ID')}</span>
                </div>
            `;
        }

        dc.innerHTML = `
            <div class="confirm-item">
                <span class="confirm-label">${isEn ? 'Item Count' : 'Jumlah Item'}</span>
                <span class="confirm-value">${voiceTransaction.items.length} ${isEn ? 'Batch Items' : 'Transaksi Sekaligus'}</span>
            </div>
            ${voiceTransaction.items.map((it, idx) => {
                if (it.intent === 'saving') {
                    const actionSym = it.action === 'deposit' ? '+' : '−';
                    return `<div class="confirm-item">
                        <span class="confirm-label">#${idx + 1} ${isEn ? 'Savings' : 'Tabungan'} (${esc(it.goalName || (isEn ? 'General' : 'Umum'))})</span>
                        <span class="confirm-value" style="color:var(--accent-secondary);">${actionSym}Rp ${it.amount.toLocaleString('id-ID')}</span>
                    </div>`;
                }
                const badge = typeof window.getCategoryBadgeHtml === 'function' ? window.getCategoryBadgeHtml(it.category || 'other') : '';
                return `<div class="confirm-item">
                    <span class="confirm-label" style="display:inline-flex;align-items:center;">#${idx + 1} ${badge} ${esc(it.description || it.category)}</span>
                    <span class="confirm-value" style="color:${it.type === 'income' ? 'var(--success)' : 'var(--danger)'};">
                        ${it.type === 'income' ? '+' : '−'}Rp ${it.amount.toLocaleString('id-ID')}
                    </span>
                </div>`;
            }).join('')}
            ${summaryRows}
        `;
    } else if (voiceTransaction.intent === 'saving') {
        const actionText = voiceTransaction.action === 'deposit' 
            ? (isEn ? '+ Deposit' : '+ Simpan') 
            : (isEn ? '− Withdraw' : '− Tarik');
        dc.innerHTML = `
            <div class="confirm-item"><span class="confirm-label">${isEn ? 'Type' : 'Jenis'}</span><span class="confirm-value" style="color:var(--accent-secondary);">◈ ${isEn ? 'Savings' : 'Tabungan'}</span></div>
            <div class="confirm-item"><span class="confirm-label">${isEn ? 'Action' : 'Aksi'}</span><span class="confirm-value">${actionText}</span></div>
            <div class="confirm-item"><span class="confirm-label">${isEn ? 'Amount' : 'Nominal'}</span><span class="confirm-value">Rp ${voiceTransaction.amount.toLocaleString('id-ID')}</span></div>
            <div class="confirm-item"><span class="confirm-label">${isEn ? 'Goal' : 'Tujuan'}</span><span class="confirm-value">${esc(voiceTransaction.goalName || (isEn ? 'General' : 'Umum'))}</span></div>
        `;
    } else {
        const catBadge = typeof window.getCategoryBadgeHtml === 'function' ? window.getCategoryBadgeHtml(voiceTransaction.category) : '';
        const typeText = voiceTransaction.type === 'income' 
            ? `<span style="color:var(--success);">${isEn ? '+ Income' : '+ Pemasukan'}</span>` 
            : `<span style="color:var(--danger);">${isEn ? '− Expense' : '− Pengeluaran'}</span>`;
        dc.innerHTML = `
            <div class="confirm-item"><span class="confirm-label">${isEn ? 'Type' : 'Jenis'}</span><span class="confirm-value">${typeText}</span></div>
            <div class="confirm-item"><span class="confirm-label">${isEn ? 'Amount' : 'Nominal'}</span><span class="confirm-value">Rp ${voiceTransaction.amount.toLocaleString('id-ID')}</span></div>
            <div class="confirm-item"><span class="confirm-label">${isEn ? 'Category' : 'Kategori'}</span><span class="confirm-value" style="display:inline-flex;align-items:center;">${catBadge} ${esc(voiceTransaction.category)}</span></div>
            <div class="confirm-item"><span class="confirm-label">${isEn ? 'Date' : 'Tanggal'}</span><span class="confirm-value">${esc(voiceTransaction.date)}</span></div>
            <div class="confirm-item"><span class="confirm-label">${isEn ? 'Notes' : 'Keterangan'}</span><span class="confirm-value">${esc(voiceTransaction.description || '-')}</span></div>
        `;
    }
    modal.classList.add('active');
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.remove('active');
    voiceTransaction = null;
}

// ========== SAVE LOGIC ==========
function saveVoiceTransaction() {
    if (!voiceTransaction) return;

    if (voiceTransaction.intent === 'batch') {
        const items = voiceTransaction.items || [];
        let savedCount = 0;
        const txns = JSON.parse(localStorage.getItem('transactions') || '[]');
        const baseId = Date.now();

        items.forEach((item, idx) => {
            if (item.intent === 'saving') {
                _executeSavingTransaction(item, true);
                savedCount++;
            } else {
                const finalTxn = {
                    id: baseId + idx,
                    type: item.type,
                    amount: item.amount,
                    category: item.category || 'other',
                    date: item.date,
                    description: item.description,
                    method: 'voice'
                };
                txns.unshift(finalTxn);
                sendToSheet(buildSheetPayload(finalTxn));
                savedCount++;
            }
        });

        localStorage.setItem('transactions', JSON.stringify(txns));
        const lang = localStorage.getItem('voiceLang') || currentLang || 'id-ID';
        const isEn = lang.startsWith('en');
        closeConfirmModal();
        showVoiceSuccess(isEn ? `${savedCount} transactions saved successfully!` : `${savedCount} transaksi berhasil disimpan sekaligus!`);

        if (window.renderSavingsUI) window.renderSavingsUI();
        if (window.updateDashboards) {
            window.transactions = txns;
            window.updateDashboards();
            if (window.renderTransactions) window.renderTransactions();
            if (window.updateBudgetStatus) window.updateBudgetStatus();
            if (window.renderAnalytics && document.getElementById('analyticsTab')?.classList.contains('active')) {
                window.renderAnalytics();
            }
        }
        return;
    }

    if (voiceTransaction.intent === 'saving') {
        _executeSavingTransaction(voiceTransaction, false);
    } else {
        _executeNormalTransaction(voiceTransaction);
    }
}

function _executeSavingTransaction(txn, silent = false) {
    const historyEntry = { amount: txn.amount, type: txn.action === 'deposit' ? 'add' : 'withdraw', date: todayStr() };

    if (!txn.goalName) {
        const gen = getSavingsGeneral();
        if (txn.action === 'withdraw') {
            if (gen.total < txn.amount) {
                alert('Saldo tabungan umum tidak cukup!');
                return;
            }
            gen.total -= txn.amount;
            historyEntry.type = 'withdraw';
        } else {
            gen.total += txn.amount;
        }
        gen.history.unshift(historyEntry);
        setSavingsGeneral(gen);
    } else {
        const goals = getSavingsGoals();
        const idx = goals.findIndex(g => g.name.toLowerCase().trim() === txn.goalName.toLowerCase().trim());
        if (idx === -1) {
            alert('Tujuan tabungan belum ada. Silakan buat terlebih dahulu.');
            return;
        }
        if (txn.action === 'withdraw') {
            if (goals[idx].current < txn.amount) {
                alert(`Saldo tabungan "${goals[idx].name}" tidak cukup!`);
                return;
            }
            goals[idx].current -= txn.amount;
            historyEntry.type = 'withdraw';
        } else {
            goals[idx].current += txn.amount;
        }
        goals[idx].history = goals[idx].history || [];
        goals[idx].history.unshift(historyEntry);
        setSavingsGoals(goals);
    }

    if (!silent) {
        const lang = localStorage.getItem('voiceLang') || currentLang || 'id-ID';
        const isEn = lang.startsWith('en');
        closeConfirmModal();
        const successMsg = isEn 
            ? ('Savings ' + (txn.action === 'deposit' ? 'deposited' : 'withdrawn') + ' successfully.')
            : ('Tabungan berhasil ' + (txn.action === 'deposit' ? 'ditambahkan' : 'ditarik') + '.');
        showVoiceSuccess(successMsg);
        if (window.renderSavingsUI) window.renderSavingsUI();
        if (window.updateDashboards) window.updateDashboards();
    }
}

function _executeNormalTransaction(txn) {
    const finalTxn = {
        id: Date.now(),
        type: txn.type,
        amount: txn.amount,
        category: txn.category,
        date: txn.date,
        description: txn.description,
        method: 'voice'
    };

    const txns = JSON.parse(localStorage.getItem('transactions') || '[]');
    txns.unshift(finalTxn);
    localStorage.setItem('transactions', JSON.stringify(txns));

    const lang = localStorage.getItem('voiceLang') || currentLang || 'id-ID';
    const isEn = lang.startsWith('en');
    closeConfirmModal();
    showVoiceSuccess(isEn ? 'Transaction successfully saved.' : 'Transaksi berhasil disimpan.');

    if (window.updateDashboards) {
        window.transactions = txns;
        window.updateDashboards();
        if (window.renderTransactions) window.renderTransactions();
        if (window.updateBudgetStatus) window.updateBudgetStatus();
        if (window.renderAnalytics && document.getElementById('analyticsTab')?.classList.contains('active')) {
            window.renderAnalytics();
        }
    }
    sendToSheet(buildSheetPayload(finalTxn));
}

function showVoiceSuccess(msg) {
    const r = document.getElementById('voiceResult');
    if (r) {
        r.innerHTML = `<div style="background:rgba(72,187,120,0.3);padding:15px;border-radius:8px;color:white;"><strong>✓ ${msg}</strong></div>`;
        setTimeout(() => { r.innerHTML = ''; }, 3000);
    }
}

// ========== SUGGESTIONS & BADGE SYNC ==========
function updateVoiceSuggestions() {
    const lang = localStorage.getItem('voiceLang') || window.currentLang || 'id-ID';
    const isEn = lang.startsWith('en');

    // Keep recognition language synchronized
    if (window.recognition) {
        window.recognition.lang = lang;
    }

    // Sync UI badge display
    const badge = document.getElementById('voiceLangDisplay');
    if (badge) {
        badge.textContent = isEn ? 'Mode: English (US)' : 'Mode: Bahasa Indonesia';
    }

    const status = document.getElementById('voiceStatus');
    if (status && !isListening) {
        status.textContent = isEn ? 'Tap to start' : 'Tap untuk mulai';
    }

    const container = document.getElementById('voiceSuggestions');
    if (!container) return;

    if (isEn) {
        container.innerHTML = `
            <span class="voice-suggestion" data-text="Bought coffee 20k and burger 45k">▸ "Coffee 20k and burger 45k"</span>
            <span class="voice-suggestion" data-text="Bought gas 50k and got 300k freelance">▸ "Gas 50k and got 300k freelance"</span>
            <span class="voice-suggestion" data-text="Lunch 25k then save 50k for Japan">▸ "Lunch 25k then save 50k for Japan"</span>
            <span class="voice-suggestion" data-text="Dinner 30k discount 5k">▸ "Dinner 30k discount 5k"</span>
            <span class="voice-suggestion" data-text="Half a million salary">▸ "Half a million salary"</span>
            <span class="voice-suggestion" data-text="Withdraw 20k from emergency fund">▸ "Withdraw 20k from emergency fund"</span>
        `;
    } else {
        container.innerHTML = `
            <span class="voice-suggestion" data-text="aku habis beli kopi 20 ribu dan nasi goreng 25 ribu">▸ "Kopi 20rb dan nasi 25rb"</span>
            <span class="voice-suggestion" data-text="habis beli bensin 50 ribu terus dapat freelance 300 ribu">▸ "Bensin 50rb terus freelance 300rb"</span>
            <span class="voice-suggestion" data-text="makan siang 25 ribu terus nabung 50 ribu ke Jepang">▸ "Makan 25rb terus nabung 50rb"</span>
            <span class="voice-suggestion" data-text="terima gaji satu setengah juta">▸ "Terima gaji 1.5jt"</span>
            <span class="voice-suggestion" data-text="makan 30 ribu diskon 5 ribu">▸ "Makan 30rb diskon 5rb"</span>
            <span class="voice-suggestion" data-text="reimburse kantor 150 ribu">▸ "Reimburse kantor 150rb"</span>
        `;
    }

    container.querySelectorAll('.voice-suggestion').forEach(btn => {
        btn.onclick = function () {
            simulateVoice(this.getAttribute('data-text'));
        };
    });
}

window.updateVoiceSuggestions = updateVoiceSuggestions;
window.simulateVoice = simulateVoice;
window.toggleVoiceInput = toggleVoiceInput;
