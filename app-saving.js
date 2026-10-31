// app-saving.js – Saving page logic with interactive calendar & saving target estimator

let activeGoalIndex = null; // which goal is open in modal
let calViewMonth = new Date().getMonth();
let calViewYear = new Date().getFullYear();
let calSelectedDate = '';

const ID_MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    initGoalCalendar();
    renderSavingsUI();

    const form = document.getElementById('goalForm');
    if (form) form.addEventListener('submit', handleAddGoal);
});

// ========== INTERACTIVE CALENDAR & PLAN CALCULATOR ==========
function computeGoalPlanMetrics(targetAmount, currentAmount, deadlineStr) {
    const target = Number(targetAmount) || 0;
    const current = Number(currentAmount) || 0;
    const remainingAmount = Math.max(0, target - current);
    const isComplete = target > 0 && current >= target;

    if (!deadlineStr) {
        return { remainingAmount, daysLeft: null, perDay: 0, perWeek: 0, perMonth: 0, isComplete };
    }

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const parts = String(deadlineStr).split('-').map(Number);
    const deadlineDate = parts.length === 3
        ? new Date(parts[0], parts[1] - 1, parts[2])
        : new Date(deadlineStr + 'T00:00:00');

    const diffMs = deadlineDate.getTime() - todayMidnight.getTime();
    const daysLeft = Math.ceil(diffMs / 86400000);

    if (daysLeft <= 0) {
        return {
            remainingAmount,
            daysLeft,
            perDay: remainingAmount,
            perWeek: remainingAmount,
            perMonth: remainingAmount,
            isComplete
        };
    }

    const perDay = Math.ceil(remainingAmount / daysLeft);
    const weeksLeft = Math.max(1, daysLeft / 7);
    const monthsLeft = Math.max(1, daysLeft / 30);
    const perWeek = Math.ceil(remainingAmount / weeksLeft);
    const perMonth = Math.ceil(remainingAmount / monthsLeft);

    return { remainingAmount, daysLeft, perDay, perWeek, perMonth, isComplete };
}

function formatPlanBoxHtml(g) {
    const m = computeGoalPlanMetrics(g.target, g.current, g.deadline);
    if (m.isComplete) {
        return `<div class="goal-plan-panel complete">
            <div class="goal-plan-complete-text">✓ Target tabungan telah berhasil tercapai 100%!</div>
        </div>`;
    }
    if (m.daysLeft === null) return '';

    if (m.daysLeft < 0) {
        return `<div class="goal-plan-panel overdue">
            <div class="goal-plan-overdue-header">
                <span>[!] Lewat ${Math.abs(m.daysLeft)} hari dari deadline</span>
                <span class="goal-plan-lack">Kurang: ${fmt(m.remainingAmount)}</span>
            </div>
        </div>`;
    }
    if (m.daysLeft === 0) {
        return `<div class="goal-plan-panel today">
            <div class="goal-plan-overdue-header">
                <span>▲ Deadline hari ini!</span>
                <span class="goal-plan-lack">Kurang: ${fmt(m.remainingAmount)}</span>
            </div>
        </div>`;
    }

    return `<div class="goal-plan-panel">
        <div class="goal-plan-status-row">
            <div class="goal-plan-pill-info">
                <span class="goal-plan-label">Sisa Waktu</span>
                <span class="goal-plan-val">${m.daysLeft} hari lagi</span>
            </div>
            <div class="goal-plan-pill-info text-right">
                <span class="goal-plan-label">Kekurangan</span>
                <span class="goal-plan-val">${fmt(m.remainingAmount)}</span>
            </div>
        </div>
        <div class="goal-plan-rhythm-grid">
            <div class="goal-plan-rhythm-card">
                <span class="rhythm-label">Nabung Harian</span>
                <span class="rhythm-val">${fmt(m.perDay)}</span>
            </div>
            <div class="goal-plan-rhythm-card">
                <span class="rhythm-label">${m.daysLeft >= 30 ? 'Nabung Bulanan' : 'Nabung Mingguan'}</span>
                <span class="rhythm-val">${fmt(m.daysLeft >= 30 ? m.perMonth : m.perWeek)}</span>
            </div>
        </div>
    </div>`;
}

function initGoalCalendar() {
    selectPresetOffset(30);
}

function selectPresetOffset(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + Number(daysOffset));
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const iso = `${yyyy}-${mm}-${dd}`;
    calSelectedDate = iso;
    if (typeof window.setDatePickerValue === 'function') {
        window.setDatePickerValue('goalDeadline', iso, false);
    } else {
        const hiddenInput = document.getElementById('goalDeadline');
        if (hiddenInput) hiddenInput.value = iso;
    }
    updateCalendarPlanPreview();
}

function updateCalendarPlanPreview() {
    const previewEl = document.getElementById('calPlanPreview');
    if (!previewEl) return;

    const target = typeof window.getUnformattedValue === 'function'
        ? window.getUnformattedValue('goalTarget')
        : 0;
    const deadline = document.getElementById('goalDeadline')?.value || calSelectedDate;

    if (!deadline) {
        previewEl.innerHTML = 'Pilih tanggal di kalender untuk menentukan kapan tujuan ingin dicapai.';
        return;
    }

    const m = computeGoalPlanMetrics(target, 0, deadline);
    const parts = deadline.split('-').map(Number);
    const niceDate = new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    if (!target || target <= 0) {
        previewEl.innerHTML = `Target tanggal: <strong>${niceDate}</strong> (<strong>${Math.max(0, m.daysLeft)} hari lagi</strong>).<br><span style="color:var(--text-secondary);">Ketik nominal target di atas untuk melihat simulasi tabungan harian & bulanan.</span>`;
        return;
    }

    if (m.daysLeft <= 0) {
        previewEl.innerHTML = `Target tanggal: <strong>${niceDate}</strong> (Hari ini). Nominal yang dibutuhkan: <strong style="color:var(--accent-primary);">${fmt(target)}</strong>`;
        return;
    }

    previewEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px dashed var(--border);">
            <span>Target: <strong>${niceDate}</strong></span>
            <span style="color:var(--accent-primary);font-weight:700;">Sisa ${m.daysLeft} hari lagi</span>
        </div>
        <div class="goal-plan-rhythm-grid">
            <div class="goal-plan-rhythm-card">
                <span class="rhythm-label">Nabung Harian</span>
                <span class="rhythm-val">${fmt(m.perDay)}</span>
            </div>
            <div class="goal-plan-rhythm-card">
                <span class="rhythm-label">${m.daysLeft >= 30 ? 'Nabung Bulanan' : 'Nabung Mingguan'}</span>
                <span class="rhythm-val">${fmt(m.daysLeft >= 30 ? m.perMonth : m.perWeek)}</span>
            </div>
        </div>
    `;
}


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
    return typeof window.getLocalTodayStr === 'function'
        ? window.getLocalTodayStr()
        : new Date().toISOString().split('T')[0];
}

function fmt(n) {
    return 'Rp ' + Number(n).toLocaleString('id-ID');
}

// ========== RENDER MAIN UI ==========
function renderSavingsUI() {
    const esc = window.escapeHtml || (s => s);

    // General balance
    const gen = getSavingsGeneral();
    const genEl = document.getElementById('generalBalance');
    if (genEl) genEl.textContent = fmt(gen.total);

    // Goals
    const goals = getSavingsGoals();
    const goalsSum = goals.reduce((s, g) => s + (Number(g.current) || 0), 0);
    const totalAllEl = document.getElementById('totalAllSavings');
    const breakdownEl = document.getElementById('totalSavingsBreakdown');
    if (totalAllEl) totalAllEl.textContent = fmt(gen.total + goalsSum);
    if (breakdownEl) breakdownEl.textContent = `Umum (${fmt(gen.total)}) + ${goals.length} Tujuan (${fmt(goalsSum)})`;

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

        const targetIcon = typeof window.getIconSvg === 'function' ? window.getIconSvg('target') : '';
        const calIcon = typeof window.getIconSvg === 'function' ? window.getIconSvg('calendar') : '';
        const trashIcon = typeof window.getIconSvg === 'function' ? window.getIconSvg('trash') : '';

        return `
        <div class="card goal-card" onclick="openGoalModal(${i})">
            <div class="goal-card-header">
                <div class="goal-card-lead">
                    <div class="goal-card-icon-wrap">
                        ${targetIcon}
                    </div>
                    <div class="goal-card-title-group">
                        <div class="goal-card-title" title="${esc(g.name)}">${esc(g.name)}</div>
                        <span class="goal-card-status-pill ${isComplete ? 'complete' : ''}">
                            ${isComplete ? 'Tercapai ✓' : 'Target Aktif'}
                        </span>
                    </div>
                </div>
                <button class="goal-delete-btn" title="Hapus tujuan" onclick="event.stopPropagation(); confirmDeleteGoal(${i})">
                    ${trashIcon || '✕'}
                </button>
            </div>

            <div class="goal-balance-row">
                <div class="goal-balance-col">
                    <span class="goal-balance-label">Terkumpul</span>
                    <div class="goal-balance-current ${isComplete ? 'complete' : ''}">${fmt(g.current)}</div>
                </div>
                <div class="goal-balance-col goal-balance-target-col">
                    <span class="goal-balance-label">Target Akhir</span>
                    <div class="goal-balance-target">${fmt(g.target)}</div>
                </div>
            </div>

            <div class="goal-progress-section">
                <div class="goal-progress-track">
                    <div class="goal-progress-fill ${isComplete ? 'complete' : ''}" style="width:${pct}%"></div>
                </div>
                <div class="goal-progress-meta">
                    <span class="goal-deadline-badge">
                        ${calIcon} <span>${deadlineLabel}</span>
                    </span>
                    <span class="goal-pct-pill ${isComplete ? 'complete' : ''}">${pctStr}%</span>
                </div>
            </div>

            ${formatPlanBoxHtml(g)}

            <div class="goal-card-footer">
                <span>Kelola setor/tarik & riwayat</span>
                <span class="goal-footer-arrow">→</span>
            </div>
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
    const deadline = document.getElementById('goalDeadline').value || calSelectedDate;

    if (!name || isNaN(target) || target <= 0 || !deadline) {
        showNotif('Lengkapi nama tujuan, target nominal, dan pilih tanggal di kalender.', 'error');
        return;
    }
    if (goals.some(g => g.name.toLowerCase() === name.toLowerCase())) {
        showNotif('Tujuan dengan nama ini sudah ada!', 'error');
        return;
    }

    goals.push({ name, target, deadline, current: 0, history: [] });
    setSavingsGoals(goals);
    document.getElementById('goalForm').reset();
    selectPresetOffset(30, false);
    renderSavingsUI();
    showNotif(`Tujuan "${name}" berhasil dibuat!`);
}

// ========== DELETE GOAL ==========
function confirmDeleteGoal(index) {
    const goals = getSavingsGoals();
    const g = goals[index];
    if (!g) return;
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
    const esc = window.escapeHtml || (s => s);
    list.innerHTML = history.map((h, i) => `
        <div class="history-item">
            <div class="history-item-left">
                <span class="history-item-date">▸ ${esc(h.date)}${h.note ? ' · ' + esc(h.note) : ''}</span>
                <span class="history-item-amount ${h.type}">${h.type === 'add' ? '+' : '−'} ${fmt(h.amount)}</span>
            </div>
            <button class="history-del-btn" onclick="deleteGeneralHistory(${i})">Hapus</button>
        </div>
    `).join('');
}

function deleteGeneralHistory(index) {
    const gen = getSavingsGeneral();
    const item = gen.history[index];
    if (!item) return;
    if (item.type === 'add') gen.total -= item.amount;
    else gen.total += item.amount;
    gen.total = Math.max(0, gen.total);
    gen.history.splice(index, 1);
    setSavingsGeneral(gen);
    document.getElementById('modalGeneralBalance').textContent = fmt(gen.total);
    document.getElementById('generalBalance').textContent = fmt(gen.total);
    renderGeneralHistory(gen.history);
    renderSavingsUI();
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
    renderSavingsUI();
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

    document.getElementById('modalGoalName').textContent = '◈ ' + g.name;
    document.getElementById('modalGoalCurrent').textContent = fmt(g.current);
    document.getElementById('modalGoalTarget').textContent = fmt(g.target);
    document.getElementById('modalGoalPct').textContent = pct.toFixed(1) + '%';
    document.getElementById('modalGoalDeadline').textContent = deadlineLabel;
    const bar = document.getElementById('modalGoalBar');
    bar.style.width = pct + '%';
    bar.className = 'progress-bar-fill' + (isComplete ? ' complete' : '');

    const planBox = document.getElementById('modalGoalPlanBox');
    if (planBox) planBox.outerHTML = `<div id="modalGoalPlanBox">${formatPlanBoxHtml(g)}</div>`;

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
    const esc = window.escapeHtml || (s => s);
    list.innerHTML = history.map((h, i) => `
        <div class="history-item">
            <div class="history-item-left">
                <span class="history-item-date">▸ ${esc(h.date)}</span>
                <span class="history-item-amount ${h.type}">${h.type === 'add' ? '+' : '−'} ${fmt(h.amount)}</span>
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
    if (item.type === 'add') g.current -= item.amount;
    else g.current += item.amount;
    g.current = Math.max(0, g.current);
    g.history.splice(hIndex, 1);
    setSavingsGoals(goals);

    const pct = g.target > 0 ? Math.min((g.current / g.target) * 100, 100) : 0;
    document.getElementById('modalGoalCurrent').textContent = fmt(g.current);
    document.getElementById('modalGoalPct').textContent = pct.toFixed(1) + '%';
    const bar = document.getElementById('modalGoalBar');
    bar.style.width = pct + '%';
    const planBox = document.getElementById('modalGoalPlanBox');
    if (planBox) planBox.innerHTML = formatPlanBoxHtml(g);
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

    const pct = g.target > 0 ? Math.min((g.current / g.target) * 100, 100) : 0;
    document.getElementById('modalGoalCurrent').textContent = fmt(g.current);
    document.getElementById('modalGoalPct').textContent = pct.toFixed(1) + '%';
    const bar = document.getElementById('modalGoalBar');
    bar.style.width = pct + '%';
    bar.className = 'progress-bar-fill' + (g.current >= g.target ? ' complete' : '');
    const planBox = document.getElementById('modalGoalPlanBox');
    if (planBox) planBox.innerHTML = formatPlanBoxHtml(g);
    renderGoalHistory(g.history);
    renderSavingsUI();
    showNotif(type === 'withdraw' ? 'Berhasil ditarik!' : 'Berhasil ditambahkan!');
}

// ========== MODAL HELPERS ==========
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

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

// Expose for global voice handler & calendar HTML handlers
window.renderSavingsUI = renderSavingsUI;
window.showNotif = showNotif;
window.openGeneralModal = openGeneralModal;
window.openGoalModal = openGoalModal;
window.closeModal = closeModal;
window.manualSaveGeneral = manualSaveGeneral;
window.manualSaveGoal = manualSaveGoal;
window.deleteGeneralHistory = deleteGeneralHistory;
window.deleteGoalHistory = deleteGoalHistory;
window.confirmDeleteGoal = confirmDeleteGoal;
window.selectPresetOffset = selectPresetOffset;
window.updateCalendarPlanPreview = updateCalendarPlanPreview;
