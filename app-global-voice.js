// app-global-voice.js – Global voice handler for all pages
let recognition;
let isListening = false;
let voiceTransaction = null;
let currentLang = localStorage.getItem('voiceLang') || 'id-ID';

// ========== STORAGE HELPERS ==========
function getSavingsGeneral() {
    try {
        const raw = localStorage.getItem('savings_general');
        if (!raw) return { total: 0, history: [] };
        const parsed = JSON.parse(raw);
        // Migrate old format (plain number)
        if (typeof parsed === 'number') return { total: parsed, history: [] };
        return { total: parsed.total || 0, history: parsed.history || [] };
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
    return new Date().toISOString().split('T')[0];
}

// ========== VOICE INIT ==========
document.addEventListener('DOMContentLoaded', function () {
    initVoiceRecognition();

    const voiceBtn = document.getElementById('voiceButton');
    if (voiceBtn) voiceBtn.addEventListener('click', toggleVoiceInput);

    const confirmSaveBtn = document.getElementById('confirmSaveBtn');
    if (confirmSaveBtn) confirmSaveBtn.addEventListener('click', saveVoiceTransaction);

    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', closeConfirmModal);

    // Theme / lang init
    syncThemeDisplay();
    initLang();
    updateVoiceSuggestions();
});

function syncThemeDisplay() {
    const btn = document.getElementById('themeToggle');
    const saved = localStorage.getItem('colorTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    document.body.setAttribute('data-theme', saved);
    if (btn) {
        btn.textContent = saved === 'dark' ? '☀️' : '🌙';
    }
}

function initLang() {
    const btn = document.getElementById('langToggle');
    const saved = localStorage.getItem('voiceLang') || 'id-ID';
    currentLang = saved;
    if (btn) {
        btn.textContent = saved === 'en-US' ? '🇬🇧 EN' : '🇮🇩 ID';
        btn.addEventListener('click', () => {
            currentLang = currentLang === 'en-US' ? 'id-ID' : 'en-US';
            localStorage.setItem('voiceLang', currentLang);
            btn.textContent = currentLang === 'en-US' ? '🇬🇧 EN' : '🇮🇩 ID';
            if (recognition) recognition.lang = currentLang;
            updateVoiceSuggestions();
        });
    }
}

function initVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        const status = document.getElementById('voiceStatus');
        const btn = document.getElementById('voiceButton');
        if (status) status.textContent = '❌ Voice tidak didukung';
        if (btn) btn.disabled = true;
        return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;
    recognition.lang = currentLang;

    recognition.onstart = () => {
        const s = document.getElementById('voiceStatus');
        const r = document.getElementById('voiceResult');
        if (s) s.textContent = '🎤 Mendengarkan...';
        if (r) r.innerHTML = '<div style="opacity:0.7;">Memproses...</div>';
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

        const resEl = document.getElementById('voiceResult');
        if (resEl) {
            resEl.innerHTML = `
                <div style="margin-bottom:8px;"><strong>Terdengar:</strong> "${transcript}"</div>
                <div style="font-size:0.85rem;opacity:0.8;">${final.trim() ? 'Parsing...' : 'Mendengarkan...'}</div>
            `;
        }
        if (final.trim()) setTimeout(() => parseVoiceInput(final.trim()), 150);
    };

    recognition.onerror = (event) => {
        const msg = event.error === 'no-speech' ? 'Tidak terdengar suara.' : 'Tidak dapat memahami. Coba lagi.';
        const s = document.getElementById('voiceStatus');
        const r = document.getElementById('voiceResult');
        if (s) s.textContent = msg;
        if (r) r.innerHTML = `<div style="color:var(--warning);">${msg}</div>`;
        stopVoiceInput();
    };

    recognition.onend = () => stopVoiceInput();
}

function toggleVoiceInput() {
    if (!recognition) return;
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
        isListening = true;
        const btn = document.getElementById('voiceButton');
        if (btn) btn.classList.add('listening');
    }
}

function stopVoiceInput() {
    isListening = false;
    const btn = document.getElementById('voiceButton');
    const status = document.getElementById('voiceStatus');
    if (btn) btn.classList.remove('listening');
    if (status) status.textContent = 'Tap untuk mulai';
}

function simulateVoice(text) {
    const r = document.getElementById('voiceResult');
    if (r) r.innerHTML = `<div style="margin-bottom:8px;"><strong>Testing:</strong> "${text}"</div><div style="font-size:0.85rem;opacity:0.8;">Parsing...</div>`;
    setTimeout(() => parseVoiceInput(text), 300);
}

// ========== CORE PARSING ==========
function parseVoiceInput(text) {
    const goals = getSavingsGoals();
    const parsed = parser.parse(text, goals);
    const resEl = document.getElementById('voiceResult');
    if (!resEl) return;

    if (parsed.intent === 'saving') {
        resEl.innerHTML = `
            <div style="background:rgba(255,255,255,0.2);padding:12px;border-radius:8px;line-height:1.8;">
                <strong>Parsed Saving:</strong><br>
                💰 Rp ${parsed.amount.toLocaleString('id-ID')}<br>
                📉 ${parsed.action === 'deposit' ? '✅ Simpan' : '🔴 Tarik'}<br>
                🎯 Tujuan: <strong>${parsed.goalName || 'Umum'}</strong>
            </div>
        `;

        if (parsed.amount === 0) {
            resEl.innerHTML += `<div style="background:rgba(237,137,54,0.3);margin-top:10px;padding:12px;border-radius:8px;color:white;">⚠️ Nominal tidak terdeteksi!<br><small>Coba: "nabung 50 ribu"</small></div>`;
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
        resEl.innerHTML = `
            <div style="background:rgba(255,255,255,0.2);padding:12px;border-radius:8px;line-height:1.8;">
                <strong>Parsed Transaksi:</strong><br>
                💰 Rp ${parsed.amount.toLocaleString('id-ID')}<br>
                📊 ${parsed.type === 'income' ? '✅ Pemasukan' : '❌ Pengeluaran'}<br>
                📁 ${parsed.category || 'other'}<br>
                📝 ${parsed.description || ''}
            </div>
        `;

        if (parsed.amount === 0) {
            resEl.innerHTML += `<div style="background:rgba(237,137,54,0.3);margin-top:10px;padding:12px;border-radius:8px;color:white;">⚠️ Nominal tidak terdeteksi!<br><small>Coba: "beli makan 25 ribu"</small></div>`;
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

    if (voiceTransaction.intent === 'saving') {
        dc.innerHTML = `
            <div class="confirm-item"><span class="confirm-label">Jenis</span><span class="confirm-value" style="color:var(--accent-secondary);">💾 Tabungan</span></div>
            <div class="confirm-item"><span class="confirm-label">Aksi</span><span class="confirm-value">${voiceTransaction.action === 'deposit' ? '✅ Simpan' : '🔴 Tarik'}</span></div>
            <div class="confirm-item"><span class="confirm-label">Nominal</span><span class="confirm-value">Rp ${voiceTransaction.amount.toLocaleString('id-ID')}</span></div>
            <div class="confirm-item"><span class="confirm-label">Tujuan</span><span class="confirm-value">${voiceTransaction.goalName || 'Umum'}</span></div>
        `;
    } else {
        dc.innerHTML = `
            <div class="confirm-item"><span class="confirm-label">Jenis</span><span class="confirm-value">${voiceTransaction.type === 'income' ? '<span style="color:var(--success);">✅ Pemasukan</span>' : '<span style="color:var(--danger);">❌ Pengeluaran</span>'}</span></div>
            <div class="confirm-item"><span class="confirm-label">Nominal</span><span class="confirm-value">Rp ${voiceTransaction.amount.toLocaleString('id-ID')}</span></div>
            <div class="confirm-item"><span class="confirm-label">Kategori</span><span class="confirm-value">${voiceTransaction.category}</span></div>
            <div class="confirm-item"><span class="confirm-label">Tanggal</span><span class="confirm-value">${voiceTransaction.date}</span></div>
            <div class="confirm-item"><span class="confirm-label">Keterangan</span><span class="confirm-value">${voiceTransaction.description || '-'}</span></div>
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

    if (voiceTransaction.intent === 'saving') {
        _executeSavingTransaction(voiceTransaction);
    } else {
        _executeNormalTransaction(voiceTransaction);
    }
}

function _executeSavingTransaction(txn) {
    const historyEntry = { amount: txn.amount, type: txn.action === 'deposit' ? 'add' : 'withdraw', date: todayStr() };

    if (!txn.goalName) {
        // General saving
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
        // Goal saving
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

    closeConfirmModal();
    showVoiceSuccess('Tabungan berhasil ' + (txn.action === 'deposit' ? 'ditambahkan' : 'ditarik') + '!');
    if (window.renderSavingsUI) window.renderSavingsUI();
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
    showVoiceSuccess('Transaksi berhasil disimpan!');

    if (window.updateDashboards) {
        window.transactions = txns;
        window.updateDashboards();
        if (window.renderTransactions) window.renderTransactions();
        if (window.updateBudgetStatus) window.updateBudgetStatus();
    }
    if (window.sendToSheet && window.buildSheetPayload) {
        window.sendToSheet(window.buildSheetPayload(finalTxn));
    }
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

    container.innerHTML = `
        <span class="voice-suggestion" data-text="Beli makan 25 ribu">💡 "Beli makan 25rb"</span>
        <span class="voice-suggestion" data-text="Terima gaji 3 juta">💡 "Terima gaji 3jt"</span>
        <span class="voice-suggestion" data-text="Nabung 50 ribu ke jepang">💡 "Nabung ke Jepang"</span>
        <span class="voice-suggestion" data-text="Nabung 20 ribu">💡 "Nabung 20rb umum"</span>
        <span class="voice-suggestion" data-text="Ambil tabunganku 10 ribu">💡 "Ambil tabunganku"</span>
    `;

    container.querySelectorAll('.voice-suggestion').forEach(btn => {
        btn.addEventListener('click', function () {
            simulateVoice(this.getAttribute('data-text'));
        });
    });
}
