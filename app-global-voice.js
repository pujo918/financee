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
        const s = document.getElementById('voiceStatus');
        const r = document.getElementById('voiceResult');
        if (s) s.textContent = '● Mendengarkan...';
        if (r) r.innerHTML = '<div style="opacity:0.7;">Memproses suara...</div>';
    };

    recognition.onresult = (event) => {
        let final = '', interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) final += t + ' ';
            else interim += t + ' ';
        }
        const transcript = (final + interim).trim();
        if (!transcript) return;

        const safeTranscript = window.escapeHtml ? window.escapeHtml(transcript) : transcript;
        const resEl = document.getElementById('voiceResult');
        if (resEl) {
            resEl.innerHTML = `
                <div style="margin-bottom:8px;"><strong>Terdengar:</strong> "${safeTranscript}"</div>
                <div style="font-size:0.85rem;opacity:0.8;">${final.trim() ? 'Menganalisis...' : 'Mendengarkan...'}</div>
            `;
        }
        if (final.trim()) setTimeout(() => parseVoiceInput(final.trim()), 150);
    };

    recognition.onerror = (event) => {
        const msg = event.error === 'no-speech' ? 'Tidak terdengar suara.' : 'Tidak dapat memahami suara. Coba lagi.';
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

    if (parsedList.length > 1) {
        const totalAmt = parsedList.reduce((s, it) => s + (Number(it.amount) || 0), 0);
        const rowsHtml = parsedList.map((it, idx) => {
            if (it.intent === 'saving') {
                return `<div style="margin-bottom:4px;">${idx + 1}. <strong>◈ Tabungan (${esc(it.goalName || 'Umum')})</strong>: ${it.action === 'deposit' ? '+' : '−'}Rp ${it.amount.toLocaleString('id-ID')}</div>`;
            }
            const badge = typeof window.getCategoryBadgeHtml === 'function' ? window.getCategoryBadgeHtml(it.category || 'other') : '';
            return `<div style="margin-bottom:4px;display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
                <span>${idx + 1}.</span> ${badge} <strong>${esc(it.category || 'other')}</strong>
                <span>(${esc(it.description || '-')})</span>:
                <strong>Rp ${it.amount.toLocaleString('id-ID')}</strong>
            </div>`;
        }).join('');

        resEl.innerHTML = `
            <div style="background:rgba(255,255,255,0.16);padding:12px;border-radius:8px;line-height:1.7;text-align:left;max-width:460px;margin:0 auto;">
                <strong>✓ Terdeteksi ${parsedList.length} Transaksi Sekaligus</strong><br>
                ${rowsHtml}
                <div style="border-top:1px solid rgba(255,255,255,0.25);margin-top:6px;padding-top:6px;">
                    Total: <strong>Rp ${totalAmt.toLocaleString('id-ID')}</strong>
                </div>
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
        resEl.innerHTML = `
            <div style="background:rgba(255,255,255,0.16);padding:12px;border-radius:8px;line-height:1.8;text-align:left;max-width:420px;margin:0 auto;">
                <strong>◈ Ringkasan Tabungan</strong><br>
                ▸ Nominal: Rp ${parsed.amount.toLocaleString('id-ID')}<br>
                ▸ Aksi: ${parsed.action === 'deposit' ? '+ Simpan' : '− Tarik'}<br>
                ▸ Tujuan: <strong>${esc(parsed.goalName || 'Umum')}</strong>
            </div>
        `;

        if (parsed.amount === 0) {
            resEl.innerHTML += `<div style="background:rgba(237,137,54,0.3);margin-top:10px;padding:12px;border-radius:8px;color:white;">[!] Nominal tidak terdeteksi.<br><small>Contoh: "nabung 50 ribu"</small></div>`;
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
        resEl.innerHTML = `
            <div style="background:rgba(255,255,255,0.16);padding:12px;border-radius:8px;line-height:1.8;text-align:left;max-width:420px;margin:0 auto;">
                <strong>Ringkasan Transaksi</strong><br>
                ▸ Nominal: Rp ${parsed.amount.toLocaleString('id-ID')}<br>
                ▸ Tipe: ${parsed.type === 'income' ? '+ Pemasukan' : '− Pengeluaran'}<br>
                ▸ Kategori: ${catBadge} <strong>${esc(parsed.category || 'other')}</strong><br>
                ▸ Catatan: ${esc(parsed.description || '-')}
            </div>
        `;

        if (parsed.amount === 0) {
            resEl.innerHTML += `<div style="background:rgba(237,137,54,0.3);margin-top:10px;padding:12px;border-radius:8px;color:white;">[!] Nominal tidak terdeteksi.<br><small>Contoh: "beli makan 25 ribu"</small></div>`;
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

    if (voiceTransaction.intent === 'batch') {
        const totalAmt = voiceTransaction.items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
        dc.innerHTML = `
            <div class="confirm-item">
                <span class="confirm-label">Jumlah Item</span>
                <span class="confirm-value">${voiceTransaction.items.length} Transaksi Sekaligus</span>
            </div>
            ${voiceTransaction.items.map((it, idx) => {
                if (it.intent === 'saving') {
                    return `<div class="confirm-item">
                        <span class="confirm-label">#${idx + 1} Tabungan (${esc(it.goalName || 'Umum')})</span>
                        <span class="confirm-value">${it.action === 'deposit' ? '+' : '−'}Rp ${it.amount.toLocaleString('id-ID')}</span>
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
            <div class="confirm-item">
                <span class="confirm-label">Total Nominal</span>
                <span class="confirm-value" style="color:var(--accent-primary);">Rp ${totalAmt.toLocaleString('id-ID')}</span>
            </div>
        `;
    } else if (voiceTransaction.intent === 'saving') {
        dc.innerHTML = `
            <div class="confirm-item"><span class="confirm-label">Jenis</span><span class="confirm-value" style="color:var(--accent-secondary);">◈ Tabungan</span></div>
            <div class="confirm-item"><span class="confirm-label">Aksi</span><span class="confirm-value">${voiceTransaction.action === 'deposit' ? '+ Simpan' : '− Tarik'}</span></div>
            <div class="confirm-item"><span class="confirm-label">Nominal</span><span class="confirm-value">Rp ${voiceTransaction.amount.toLocaleString('id-ID')}</span></div>
            <div class="confirm-item"><span class="confirm-label">Tujuan</span><span class="confirm-value">${esc(voiceTransaction.goalName || 'Umum')}</span></div>
        `;
    } else {
        const catBadge = typeof window.getCategoryBadgeHtml === 'function' ? window.getCategoryBadgeHtml(voiceTransaction.category) : '';
        dc.innerHTML = `
            <div class="confirm-item"><span class="confirm-label">Jenis</span><span class="confirm-value">${voiceTransaction.type === 'income' ? '<span style="color:var(--success);">+ Pemasukan</span>' : '<span style="color:var(--danger);">− Pengeluaran</span>'}</span></div>
            <div class="confirm-item"><span class="confirm-label">Nominal</span><span class="confirm-value">Rp ${voiceTransaction.amount.toLocaleString('id-ID')}</span></div>
            <div class="confirm-item"><span class="confirm-label">Kategori</span><span class="confirm-value" style="display:inline-flex;align-items:center;">${catBadge} ${esc(voiceTransaction.category)}</span></div>
            <div class="confirm-item"><span class="confirm-label">Tanggal</span><span class="confirm-value">${esc(voiceTransaction.date)}</span></div>
            <div class="confirm-item"><span class="confirm-label">Keterangan</span><span class="confirm-value">${esc(voiceTransaction.description || '-')}</span></div>
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
        closeConfirmModal();
        showVoiceSuccess(`${savedCount} transaksi berhasil disimpan sekaligus!`);

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
        closeConfirmModal();
        showVoiceSuccess('Tabungan berhasil ' + (txn.action === 'deposit' ? 'ditambahkan' : 'ditarik') + '.');
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

    closeConfirmModal();
    showVoiceSuccess('Transaksi berhasil disimpan.');

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

// ========== SUGGESTIONS ==========
function updateVoiceSuggestions() {
    const container = document.getElementById('voiceSuggestions');
    if (!container) return;

    const lang = localStorage.getItem('voiceLang') || window.currentLang || 'id-ID';
    const status = document.getElementById('voiceStatus');
    if (status && !isListening) {
        status.textContent = lang === 'en-US' ? 'Tap to start' : 'Tap untuk mulai';
    }

    if (lang === 'en-US') {
        container.innerHTML = `
            <span class="voice-suggestion" data-text="I buy coffee twenty thousand">▸ "Buy coffee 20k"</span>
            <span class="voice-suggestion" data-text="Buy coffee 20k then lunch 45k">▸ "Coffee 20k then lunch 45k"</span>
            <span class="voice-suggestion" data-text="Got three hundred k freelance">▸ "Got 300k freelance"</span>
            <span class="voice-suggestion" data-text="Nabung 50 ribu">▸ "Nabung 50k"</span>
        `;
    } else {
        container.innerHTML = `
            <span class="voice-suggestion" data-text="Beli makan 25 ribu">▸ "Beli makan 25rb"</span>
            <span class="voice-suggestion" data-text="Beli kopi 20 ribu terus naik ojol 15 ribu">▸ "Kopi 20rb terus ojol 15rb"</span>
            <span class="voice-suggestion" data-text="Terima gaji 3 juta">▸ "Terima gaji 3jt"</span>
            <span class="voice-suggestion" data-text="Nabung 50 ribu ke jepang">▸ "Nabung ke Jepang"</span>
            <span class="voice-suggestion" data-text="Nabung 20 ribu">▸ "Nabung 20rb umum"</span>
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
