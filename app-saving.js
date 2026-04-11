// app-saving.js – Saving page logic

let activeGoalIndex = null; // which goal is open in modal

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    renderSavingsUI();

    const form = document.getElementById('goalForm');
    if (form) form.addEventListener('submit', handleAddGoal);
});

// ========== STORAGE HELPERS (mirrors app-global-voice.js) ==========
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
    return new Date().toISOString().split('T')[0];
}

function fmt(n) {
    return 'Rp ' + Number(n).toLocaleString('id-ID');
}

// ========== RENDER MAIN UI ==========
function renderSavingsUI() {
    // General balance
    const gen = getSavingsGeneral();
    const genEl = document.getElementById('generalBalance');
    if (genEl) genEl.textContent = fmt(gen.total);

    // Goals
    const goals = getSavingsGoals();
    const container = document.getElementById('goalsContainer');
    const noMsg = document.getElementById('noGoalsMsg');
    const badge = document.getElementById('goalCountBadge');

    if (badge) badge.textContent = `${goals.length}/5`;

    if (!container) return;

    if (goals.length === 0) {
        container.innerHTML = '';
        if (noMsg) noMsg.style.display = 'block';
        return;
    }
    if (noMsg) noMsg.style.display = 'none';

    container.innerHTML = goals.map((g, i) => {
        const pct = g.target > 0 ? Math.min((g.current / g.target) * 100, 100) : 0;
        const pctStr = pct.toFixed(1);
        const isComplete = g.current >= g.target;
        const deadlineLabel = g.deadline
            ? new Date(g.deadline + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            : '-';

        return `
        <div class="card goal-card" onclick="openGoalModal(${i})">
            <button class="goal-delete-btn" onclick="event.stopPropagation(); confirmDeleteGoal(${i})">✕</button>
            <div class="card-title" style="padding-right:32px;">${g.name}</div>
            <div class="card-value" style="font-size:1.4rem;margin:6px 0;${isComplete ? 'color:var(--success);' : ''}">
                ${fmt(g.current)}
                <span style="font-size:0.85rem;font-weight:400;color:var(--text-secondary);"> / ${fmt(g.target)}</span>
            </div>
            <div class="progress-bar-wrap">
                <div class="progress-bar-fill ${isComplete ? 'complete' : ''}" style="width:${pct}%"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:0.82rem;color:var(--text-secondary);">
                <span>📅 ${deadlineLabel}</span>
                <span style="font-weight:700;color:${isComplete ? 'var(--success)' : 'inherit'};">${pctStr}%</span>
            </div>
            <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:4px;opacity:0.7;">Klik untuk lihat riwayat →</div>
        </div>`;
    }).join('');
}

// ========== ADD GOAL ==========
function handleAddGoal(e) {
    e.preventDefault();
    const goals = getSavingsGoals();

    if (goals.length >= 5) {
        showNotif('Maksimal 5 tujuan tabungan!', 'error');
        return;
    }

    const name = document.getElementById('goalName').value.trim();
    const target = window.getUnformattedValue('goalTarget');
    const deadline = document.getElementById('goalDeadline').value;

    if (!name || isNaN(target) || target <= 0 || !deadline) {
        showNotif('Lengkapi semua field dengan benar.', 'error');
        return;
    }
    if (goals.some(g => g.name.toLowerCase() === name.toLowerCase())) {
        showNotif('Tujuan dengan nama ini sudah ada!', 'error');
        return;
    }

    goals.push({ name, target, deadline, current: 0, history: [] });
    setSavingsGoals(goals);
    document.getElementById('goalForm').reset();
    renderSavingsUI();
    showNotif(`Tujuan "${name}" berhasil dibuat!`);
}

// ========== DELETE GOAL ==========
function confirmDeleteGoal(index) {
    const goals = getSavingsGoals();
    const g = goals[index];
    if (!confirm(`Hapus tujuan "${g.name}"?\nSaldo Rp ${g.current.toLocaleString('id-ID')} akan dikembalikan ke Tabungan Umum.`)) return;

    // Refund to general
    if (g.current > 0) {
        const gen = getSavingsGeneral();
        gen.total += g.current;
        gen.history.unshift({ amount: g.current, type: 'add', date: todayStr(), note: `Refund dari ${g.name}` });
        setSavingsGeneral(gen);
    }

    goals.splice(index, 1);
    setSavingsGoals(goals);
    renderSavingsUI();
    showNotif(`Tujuan "${g.name}" dihapus.`);
}

// ========== GENERAL MODAL ==========
function openGeneralModal() {
    const gen = getSavingsGeneral();
    document.getElementById('modalGeneralBalance').textContent = fmt(gen.total);
    renderGeneralHistory(gen.history);
    document.getElementById('generalModal').classList.add('active');
}

function renderGeneralHistory(history) {
    const list = document.getElementById('generalHistoryList');
    if (!list) return;
    if (!history || history.length === 0) {
        list.innerHTML = '<div class="empty-history">Belum ada riwayat.</div>';
        return;
    }
    list.innerHTML = history.map((h, i) => `
        <div class="history-item">
            <div class="history-item-left">
                <span class="history-item-date">📅 ${h.date}${h.note ? ' · ' + h.note : ''}</span>
                <span class="history-item-amount ${h.type}">${h.type === 'add' ? '+' : '-'} ${fmt(h.amount)}</span>
            </div>
            <button class="history-del-btn" onclick="deleteGeneralHistory(${i})">Hapus</button>
        </div>
    `).join('');
}

function deleteGeneralHistory(index) {
    const gen = getSavingsGeneral();
    const item = gen.history[index];
    if (!item) return;
    // Reverse effect
    if (item.type === 'add') gen.total -= item.amount;
    else gen.total += item.amount;
    gen.total = Math.max(0, gen.total);
    gen.history.splice(index, 1);
    setSavingsGeneral(gen);
    document.getElementById('modalGeneralBalance').textContent = fmt(gen.total);
    document.getElementById('generalBalance').textContent = fmt(gen.total);
    renderGeneralHistory(gen.history);
    showNotif('Riwayat dihapus.');
}

function manualSaveGeneral(type) {
    const amount = window.getUnformattedValue('manualGeneralAmount');
    if (!amount || amount <= 0) { showNotif('Masukkan nominal yang valid.', 'error'); return; }

    const gen = getSavingsGeneral();
    if (type === 'withdraw') {
        if (gen.total < amount) { showNotif('Saldo tidak cukup!', 'error'); return; }
        gen.total -= amount;
    } else {
        gen.total += amount;
    }
    gen.history.unshift({ amount, type: type === 'withdraw' ? 'withdraw' : 'add', date: todayStr() });
    setSavingsGeneral(gen);

    document.getElementById('manualGeneralAmount').value = '';
    document.getElementById('modalGeneralBalance').textContent = fmt(gen.total);
    document.getElementById('generalBalance').textContent = fmt(gen.total);
    renderGeneralHistory(gen.history);
    showNotif(type === 'withdraw' ? 'Berhasil ditarik!' : 'Berhasil ditambahkan!');
}

// ========== GOAL MODAL ==========
function openGoalModal(index) {
    activeGoalIndex = index;
    const goals = getSavingsGoals();
    const g = goals[index];
    if (!g) return;

    const pct = g.target > 0 ? Math.min((g.current / g.target) * 100, 100) : 0;
    const isComplete = g.current >= g.target;
    const deadlineLabel = g.deadline
        ? new Date(g.deadline + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : '-';

    document.getElementById('modalGoalName').textContent = '🎯 ' + g.name;
    document.getElementById('modalGoalCurrent').textContent = fmt(g.current);
    document.getElementById('modalGoalTarget').textContent = fmt(g.target);
    document.getElementById('modalGoalPct').textContent = pct.toFixed(1) + '%';
    document.getElementById('modalGoalDeadline').textContent = deadlineLabel;
    const bar = document.getElementById('modalGoalBar');
    bar.style.width = pct + '%';
    bar.className = 'progress-bar-fill' + (isComplete ? ' complete' : '');

    renderGoalHistory(g.history);
    document.getElementById('goalModal').classList.add('active');
}

function renderGoalHistory(history) {
    const list = document.getElementById('goalHistoryList');
    if (!list) return;
    if (!history || history.length === 0) {
        list.innerHTML = '<div class="empty-history">Belum ada riwayat.</div>';
        return;
    }
    list.innerHTML = history.map((h, i) => `
        <div class="history-item">
            <div class="history-item-left">
                <span class="history-item-date">📅 ${h.date}</span>
                <span class="history-item-amount ${h.type}">${h.type === 'add' ? '+' : '-'} ${fmt(h.amount)}</span>
            </div>
            <button class="history-del-btn" onclick="deleteGoalHistory(${i})">Hapus</button>
        </div>
    `).join('');
}

function deleteGoalHistory(hIndex) {
    if (activeGoalIndex === null) return;
    const goals = getSavingsGoals();
    const g = goals[activeGoalIndex];
    if (!g) return;
    const item = g.history[hIndex];
    if (!item) return;
    // Reverse effect
    if (item.type === 'add') g.current -= item.amount;
    else g.current += item.amount;
    g.current = Math.max(0, g.current);
    g.history.splice(hIndex, 1);
    setSavingsGoals(goals);

    // Refresh modal display
    const pct = g.target > 0 ? Math.min((g.current / g.target) * 100, 100) : 0;
    document.getElementById('modalGoalCurrent').textContent = fmt(g.current);
    document.getElementById('modalGoalPct').textContent = pct.toFixed(1) + '%';
    const bar = document.getElementById('modalGoalBar');
    bar.style.width = pct + '%';
    renderGoalHistory(g.history);
    renderSavingsUI();
    showNotif('Riwayat dihapus.');
}

function manualSaveGoal(type) {
    if (activeGoalIndex === null) return;
    const amount = window.getUnformattedValue('manualGoalAmount');
    if (!amount || amount <= 0) { showNotif('Masukkan nominal yang valid.', 'error'); return; }

    const goals = getSavingsGoals();
    const g = goals[activeGoalIndex];
    if (!g) return;

    if (type === 'withdraw') {
        if (g.current < amount) { showNotif('Saldo tidak cukup!', 'error'); return; }
        g.current -= amount;
    } else {
        g.current += amount;
    }
    g.history = g.history || [];
    g.history.unshift({ amount, type: type === 'withdraw' ? 'withdraw' : 'add', date: todayStr() });
    setSavingsGoals(goals);

    document.getElementById('manualGoalAmount').value = '';

    // Refresh modal
    const pct = g.target > 0 ? Math.min((g.current / g.target) * 100, 100) : 0;
    document.getElementById('modalGoalCurrent').textContent = fmt(g.current);
    document.getElementById('modalGoalPct').textContent = pct.toFixed(1) + '%';
    const bar = document.getElementById('modalGoalBar');
    bar.style.width = pct + '%';
    bar.className = 'progress-bar-fill' + (g.current >= g.target ? ' complete' : '');
    renderGoalHistory(g.history);
    renderSavingsUI();
    showNotif(type === 'withdraw' ? 'Berhasil ditarik!' : 'Berhasil ditambahkan!');
}

// ========== MODAL HELPERS ==========
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// Close modals on backdrop click
document.addEventListener('click', (e) => {
    ['generalModal', 'goalModal'].forEach(id => {
        const modal = document.getElementById(id);
        if (modal && e.target === modal) closeModal(id);
    });
});

// ========== NOTIFICATION ==========
function showNotif(msg, type = 'success') {
    let notif = document.getElementById('savingNotif');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'savingNotif';
        notif.style.cssText = `
            position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
            padding:12px 24px;border-radius:12px;font-weight:700;font-size:0.9rem;
            z-index:9999;transition:opacity 0.4s;box-shadow:0 8px 24px rgba(0,0,0,0.3);
            max-width:90vw;text-align:center;
        `;
        document.body.appendChild(notif);
    }
    notif.textContent = msg;
    notif.style.background = type === 'error' ? 'var(--danger)' : 'var(--success)';
    notif.style.color = 'white';
    notif.style.opacity = '1';
    clearTimeout(notif._timer);
    notif._timer = setTimeout(() => { notif.style.opacity = '0'; }, 2800);
}

// Expose for global voice handler
window.renderSavingsUI = renderSavingsUI;
window.showNotif = showNotif;
