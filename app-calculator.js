// app-calculator.js – Smart Zero-Based & Priority Tiered Budget Planner (Synced with Dashboard Budget & Savings Goals)

const PLANNER_STORAGE_KEY = 'planner_state';
const ACTIVE_BUDGET_CATS_KEY = 'active_budget_categories';
const BUDGET_INPUTS_META_KEY = 'budget_inputs_meta';
const BUDGET_LINE_ITEMS_KEY = 'budget_line_items';
const EXPENSE_CATEGORIES = ['food', 'transport', 'bills', 'study', 'entertainment', 'shopping', 'health', 'other'];

const CATEGORY_LABELS_ID = {
    food: 'Makanan (Food)',
    transport: 'Transport',
    bills: 'Tagihan (Bills)',
    study: 'Produktif / Study',
    entertainment: 'Hiburan (Entertainment)',
    shopping: 'Belanja (Shopping)',
    health: 'Kesehatan (Health)',
    other: 'Lainnya (Other)'
};

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

let activeSubCats = [];
let subPcts = {};

document.addEventListener('DOMContentLoaded', () => {
    loadPlannerState();
    refreshAllPlannerViews();
});

function calcMonthlyItemAmount(item) {
    const raw = Number(item.rawAmount) || 0;
    const cycle = item.cycle || 'monthly';
    if (cycle === 'daily') return raw * 30;
    if (cycle === 'weekly') return raw * 4;
    if (cycle === 'yearly') return Math.round(raw / 12);
    return raw;
}

function getStoredBudgets() {
    try {
        return JSON.parse(localStorage.getItem('budgets') || '{}');
    } catch {
        return {};
    }
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

    let initialCats = ['food', 'transport', 'health'];
    try {
        const rawCats = JSON.parse(localStorage.getItem(ACTIVE_BUDGET_CATS_KEY) || 'null');
        if (Array.isArray(rawCats) && rawCats.length > 0) {
            initialCats = rawCats.filter(c => EXPENSE_CATEGORIES.includes(c));
        }
    } catch (e) {}

    const budgets = getStoredBudgets();
    const migrated = initialCats.map((cat, idx) => {
        const cycle = cat === 'food' ? 'daily' : 'monthly';
        const monthlyFallback = Number(budgets[cat]) || (cat === 'food' ? 900000 : 250000);
        const rawAmount = cycle === 'daily' ? Math.round(monthlyFallback / 30) : monthlyFallback;
        return {
            id: Date.now() + idx,
            name: DEFAULT_CATEGORY_ITEM_NAMES[cat] || cat,
            category: cat,
            tier: cat === 'entertainment' || cat === 'shopping' ? 3 : (cat === 'health' || cat === 'study' ? 2 : 1),
            type: cat === 'bills' || cat === 'study' ? 'subscription' : 'quota',
            rawAmount,
            cycle,
            paidMonths: {}
        };
    });

    syncBudgetsFromLineItems(migrated);
    return migrated;
}

function syncBudgetsFromLineItems(items) {
    const list = Array.isArray(items) ? items : [];
    localStorage.setItem(BUDGET_LINE_ITEMS_KEY, JSON.stringify(list));

    const existingBudgets = getStoredBudgets();
    EXPENSE_CATEGORIES.forEach(c => { existingBudgets[c] = 0; });

    const catSet = new Set();
    list.forEach(item => {
        if (!EXPENSE_CATEGORIES.includes(item.category)) return;
        catSet.add(item.category);
        existingBudgets[item.category] = (existingBudgets[item.category] || 0) + calcMonthlyItemAmount(item);
    });

    const orderedActive = EXPENSE_CATEGORIES.filter(c => catSet.has(c));
    localStorage.setItem('budgets', JSON.stringify(existingBudgets));
    localStorage.setItem(ACTIVE_BUDGET_CATS_KEY, JSON.stringify(orderedActive));
}

function getActiveBudgetCategories() {
    const items = getBudgetLineItems();
    const catSet = new Set(items.map(i => i.category));
    return EXPENSE_CATEGORIES.filter(c => catSet.has(c));
}

function getMonthlySavingGoalsCommitment() {
    try {
        const raw = localStorage.getItem('savings_goals');
        if (!raw) return { totalMonthlyRequired: 0, activeGoalsCount: 0 };
        const goals = JSON.parse(raw);
        if (!Array.isArray(goals)) return { totalMonthlyRequired: 0, activeGoalsCount: 0 };

        const now = new Date();
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        let totalMonthlyRequired = 0;
        let activeGoalsCount = 0;

        goals.forEach(g => {
            const target = Number(g.target) || 0;
            const current = Number(g.current) || 0;
            const rem = Math.max(0, target - current);
            if (rem <= 0) return;
            activeGoalsCount++;

            if (!g.deadline) {
                totalMonthlyRequired += Math.ceil(rem / 6);
                return;
            }
            const parts = String(g.deadline).split('-').map(Number);
            const dlTime = parts.length === 3
                ? new Date(parts[0], parts[1] - 1, parts[2]).getTime()
                : new Date(g.deadline + 'T00:00:00').getTime();
            const daysLeft = Math.max(1, Math.ceil((dlTime - todayMidnight) / 86400000));
            const monthsLeft = Math.max(1, daysLeft / 30);
            totalMonthlyRequired += Math.ceil(rem / monthsLeft);
        });

        return { totalMonthlyRequired, activeGoalsCount };
    } catch {
        return { totalMonthlyRequired: 0, activeGoalsCount: 0 };
    }
}

function pullIncomeFromTransactions() {
    try {
        const txns = JSON.parse(localStorage.getItem('transactions') || '[]');
        const now = new Date();
        const curM = now.getMonth();
        const curY = now.getFullYear();

        const monthlyIncome = txns
            .filter(t => {
                if (t.type !== 'income') return false;
                const d = typeof window.parseLocalDate === 'function' ? window.parseLocalDate(t.date) : new Date(t.date);
                return d.getMonth() === curM && d.getFullYear() === curY;
            })
            .reduce((s, t) => s + (Number(t.amount) || 0), 0);

        if (monthlyIncome > 0) {
            document.getElementById('cycleSelect').value = 'monthly';
            document.getElementById('incomeInput').value = monthlyIncome.toLocaleString('id-ID');
            calculate();
        } else {
            alert('Belum ada transaksi pemasukan (Income) tercatat di bulan ini.');
        }
    } catch (e) {}
}

function initDynamicSubCategories() {
    activeSubCats = getActiveBudgetCategories();
    const budgets = getStoredBudgets();

    if (activeSubCats.length === 0) {
        subPcts = {};
        return;
    }

    const totalBudget = activeSubCats.reduce((s, c) => s + (Number(budgets[c]) || 0), 0);
    let remaining = 100;
    subPcts = {};

    activeSubCats.forEach((cat, idx) => {
        if (idx === activeSubCats.length - 1) {
            subPcts[cat] = Math.max(0, remaining);
        } else {
            const share = totalBudget > 0
                ? Math.round(((Number(budgets[cat]) || 0) / totalBudget) * 100)
                : Math.floor(100 / activeSubCats.length);
            subPcts[cat] = share;
            remaining -= share;
        }
    });
}

function refreshAllPlannerViews() {
    initDynamicSubCategories();
    renderPlannerLineItems();
    renderDynamicSubSliders();
    calculate();
}

// ========== LINE ITEM CRUD IN PLANNER ==========
function plannerQuickAdd(name, category, tier, type, rawAmount, cycle) {
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
    refreshAllPlannerViews();
}

function plannerAddCustomItem() {
    const editIdEl = document.getElementById('pEditingItemId');
    const nameEl = document.getElementById('pNewItemName');
    const catEl = document.getElementById('pNewItemCat');
    const tierEl = document.getElementById('pNewItemTier');
    const typeEl = document.getElementById('pNewItemType');
    const amtEl = document.getElementById('pNewItemAmount');
    const cycleEl = document.getElementById('pNewItemCycle');

    const cat = catEl ? catEl.value : 'food';
    const name = (nameEl ? nameEl.value.trim() : '') || DEFAULT_CATEGORY_ITEM_NAMES[cat] || cat;
    const tier = parseInt(tierEl?.value || '1', 10) || 1;
    const type = typeEl?.value || 'quota';
    const rawAmount = window.getUnformattedValue('pNewItemAmount');
    const cycle = cycleEl?.value || 'monthly';

    if (!rawAmount || rawAmount <= 0) {
        alert('Masukkan nominal (Rp) terlebih dahulu.');
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
        plannerCancelEdit();
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
    refreshAllPlannerViews();
}

function plannerEditItem(itemId) {
    const items = getBudgetLineItems();
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const editIdEl = document.getElementById('pEditingItemId');
    const nameEl = document.getElementById('pNewItemName');
    const catEl = document.getElementById('pNewItemCat');
    const tierEl = document.getElementById('pNewItemTier');
    const typeEl = document.getElementById('pNewItemType');
    const amtEl = document.getElementById('pNewItemAmount');
    const cycleEl = document.getElementById('pNewItemCycle');
    const submitBtn = document.getElementById('pSubmitItemBtn');
    const cancelBtn = document.getElementById('pCancelEditBtn');
    const titleEl = document.getElementById('pBuilderFormTitle');

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

function plannerCancelEdit() {
    const editIdEl = document.getElementById('pEditingItemId');
    const nameEl = document.getElementById('pNewItemName');
    const amtEl = document.getElementById('pNewItemAmount');
    const submitBtn = document.getElementById('pSubmitItemBtn');
    const cancelBtn = document.getElementById('pCancelEditBtn');
    const titleEl = document.getElementById('pBuilderFormTitle');

    if (editIdEl) editIdEl.value = '';
    if (nameEl) nameEl.value = '';
    if (amtEl) amtEl.value = '';
    if (submitBtn) submitBtn.textContent = '+ Tambah Item';
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (titleEl) titleEl.innerHTML = `<span>+ Tambah / Edit Item Pengeluaran</span>`;
}

function plannerCycleTier(itemId) {
    const items = getBudgetLineItems();
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    item.tier = item.tier === 1 ? 2 : (item.tier === 2 ? 3 : 1);
    syncBudgetsFromLineItems(items);
    refreshAllPlannerViews();
}

function plannerRemoveItem(itemId) {
    const items = getBudgetLineItems().filter(i => i.id !== itemId);
    syncBudgetsFromLineItems(items);
    refreshAllPlannerViews();
}

function formatPlannerCycleDesc(item) {
    const raw = Number(item.rawAmount || 0).toLocaleString('id-ID');
    const catLabel = CATEGORY_LABELS_ID[item.category] || item.category;
    if (item.cycle === 'daily') return `${catLabel} · Rp ${raw}/hari (×30)`;
    if (item.cycle === 'weekly') return `${catLabel} · Rp ${raw}/minggu (×4)`;
    if (item.cycle === 'yearly') return `${catLabel} · Rp ${raw}/tahun (÷12)`;
    return `${catLabel} · ${item.type === 'subscription' ? 'Tagihan/Langganan Bulanan' : 'Kuota Bulanan (×1)'}`;
}

function renderPlannerLineItems() {
    const container = document.getElementById('plannerLineItemsContainer');
    if (!container) return;

    const items = getBudgetLineItems();
    const esc = window.escapeHtml || (s => s);
    const badgeFn = typeof window.getCategoryBadgeHtml === 'function' ? window.getCategoryBadgeHtml : () => '';

    if (items.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:28px;border:1.5px dashed var(--border);border-radius:14px;color:var(--text-secondary);">
                <div style="font-weight:700;color:var(--text-primary);margin-bottom:4px;">Belum ada item pengeluaran</div>
                <div style="font-size:0.84rem;">Tambahkan item seperti <strong>+ Langganan Gemini</strong> atau <strong>+ Makan Harian</strong> di atas!</div>
            </div>
        `;
        return;
    }

    const sorted = [...items].sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return calcMonthlyItemAmount(b) - calcMonthlyItemAmount(a);
    });

    const tierLabel = (t) => t === 1 ? 'T1 · Wajib' : (t === 2 ? 'T2 · Penting' : 'T3 · Keinginan');

    container.innerHTML = `<div class="budget-categories-grid">` + sorted.map(item => {
        const monthlyEq = calcMonthlyItemAmount(item);
        return `
            <div class="budget-clean-item">
                <div class="budget-clean-item-left">
                    ${badgeFn(item.category)}
                    <div class="budget-clean-item-info">
                        <div class="budget-clean-item-title-row">
                            <span class="budget-clean-item-name">${esc(item.name)}</span>
                            <span class="tier-pill tier-pill--${item.tier}" onclick="plannerCycleTier(${item.id})" title="Klik untuk ganti prioritas (T1 → T2 → T3)">
                                ${tierLabel(item.tier)}
                            </span>
                        </div>
                        <div class="budget-clean-item-meta">${formatPlannerCycleDesc(item)}</div>
                    </div>
                </div>
                <div class="budget-clean-item-right">
                    <div class="budget-clean-item-amount">
                        ${fmt(monthlyEq)}<span style="font-size:0.7rem;font-weight:600;color:var(--text-secondary);">/bln</span>
                    </div>
                    <button type="button" class="item-action-btn" onclick="plannerEditItem(${item.id})" title="Edit item">✎</button>
                    <button type="button" class="item-action-btn del" onclick="plannerRemoveItem(${item.id})" title="Hapus">✕</button>
                </div>
            </div>
        `;
    }).join('') + `</div>`;
}

// ========== STATE PERSISTENCE ==========
function loadPlannerState() {
    try {
        const raw = localStorage.getItem(PLANNER_STORAGE_KEY);
        if (!raw) return;
        const state = JSON.parse(raw);
        if (state.income && Number(state.income) > 0) {
            document.getElementById('incomeInput').value = Number(state.income).toLocaleString('id-ID');
        }
        if (state.cycle === 'weekly' || state.cycle === 'monthly') {
            document.getElementById('cycleSelect').value = state.cycle;
        }
        if (Number.isFinite(state.needsPct))  document.getElementById('needsPct').value  = state.needsPct;
        if (Number.isFinite(state.wantsPct))  document.getElementById('wantsPct').value  = state.wantsPct;
        if (Number.isFinite(state.savingPct)) document.getElementById('savingPct').value = state.savingPct;
    } catch (err) {}
}

function savePlannerState() {
    try {
        const state = {
            income:    window.getUnformattedValue('incomeInput'),
            cycle:     document.getElementById('cycleSelect').value,
            needsPct:  parseInt(document.getElementById('needsPct').value, 10) || 0,
            wantsPct:  parseInt(document.getElementById('wantsPct').value, 10) || 0,
            savingPct: parseInt(document.getElementById('savingPct').value, 10) || 0,
            subPcts:   { ...subPcts }
        };
        localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(state));
    } catch (err) {}
}

function renderDynamicSubSliders() {
    const container = document.getElementById('dynamicSubSlidersContainer');
    if (!container) return;

    if (activeSubCats.length === 0) {
        container.innerHTML = `<div style="font-size:0.84rem;color:var(--text-secondary);">Tambahkan minimal 1 item di atas untuk melihat distribusi kategori.</div>`;
        return;
    }

    const badgeFn = typeof window.getCategoryBadgeHtml === 'function' ? window.getCategoryBadgeHtml : () => '';

    container.innerHTML = activeSubCats.map(cat => {
        const pct = Number(subPcts[cat] ?? 0);
        const label = CATEGORY_LABELS_ID[cat] || cat;
        return `
            <div class="sub-pct-row">
                <label>
                    ${badgeFn(cat)}
                    <span>${label}</span>
                </label>
                <input type="range" id="subRange_${cat}" min="0" max="100" value="${pct}" oninput="onSubRangeChange('${cat}')">
                <div class="sub-pct-input-wrap">
                    <input type="number" class="sub-pct-input" id="subInput_${cat}" min="0" max="100" step="1" value="${pct}" inputmode="numeric"
                        oninput="setSubPctFromInput('${cat}')" onblur="finalizeSubPctInput('${cat}')">
                    <span class="sub-pct-suffix">%</span>
                </div>
            </div>
        `;
    }).join('');
}

// ========== SLIDER SYNC ==========
function syncSlider() {
    const values = {
        needs:  parseInt(document.getElementById('needsPct').value, 10),
        wants:  parseInt(document.getElementById('wantsPct').value, 10),
        saving: parseInt(document.getElementById('savingPct').value, 10),
    };

    document.getElementById('needsPctInput').value  = values.needs;
    document.getElementById('wantsPctInput').value  = values.wants;
    document.getElementById('savingPctInput').value = values.saving;

    const total = values.needs + values.wants + values.saving;
    const warn = document.getElementById('l1Warning');
    if (warn) warn.classList.toggle('visible', total !== 100);
}

function setLevel1PctFromInput(key) {
    const input = document.getElementById(key + 'PctInput');
    const range = document.getElementById(key + 'Pct');
    const raw = String(input.value).trim();
    if (raw === '' || raw === '-') return;

    let v = parseInt(raw, 10);
    if (Number.isNaN(v)) v = 0;
    v = Math.max(0, Math.min(100, v));
    input.value = v;
    range.value = String(v);
    syncSlider();
    calculate();
}

function finalizeLevel1PctInput(key) {
    const input = document.getElementById(key + 'PctInput');
    const range = document.getElementById(key + 'Pct');
    const raw = String(input.value).trim();
    if (raw === '' || raw === '-') {
        input.value = 0;
        range.value = '0';
    }
    syncSlider();
    calculate();
}

function onSubRangeChange(cat) {
    const range = document.getElementById(`subRange_${cat}`);
    const input = document.getElementById(`subInput_${cat}`);
    if (!range) return;
    const v = parseInt(range.value, 10) || 0;
    subPcts[cat] = v;
    if (input) input.value = v;
    checkSubTotalWarning();
    calculate();
}

function setSubPctFromInput(cat) {
    const input = document.getElementById(`subInput_${cat}`);
    const range = document.getElementById(`subRange_${cat}`);
    if (!input || !range) return;
    const raw = String(input.value).trim();
    if (raw === '' || raw === '-') return;

    let v = parseInt(raw, 10);
    if (Number.isNaN(v)) v = 0;
    v = Math.max(0, Math.min(100, v));
    subPcts[cat] = v;
    input.value = v;
    range.value = String(v);
    checkSubTotalWarning();
    calculate();
}

function finalizeSubPctInput(cat) {
    const input = document.getElementById(`subInput_${cat}`);
    const range = document.getElementById(`subRange_${cat}`);
    if (!input || !range) return;
    const raw = String(input.value).trim();
    if (raw === '' || raw === '-') {
        subPcts[cat] = 0;
        input.value = 0;
        range.value = '0';
    }
    checkSubTotalWarning();
    calculate();
}

function checkSubTotalWarning() {
    const total = activeSubCats.reduce((s, c) => s + (Number(subPcts[c]) || 0), 0);
    const warn = document.getElementById('l2Warning');
    if (warn) warn.classList.toggle('visible', activeSubCats.length > 0 && total !== 100);
    return total;
}

// ========== ZERO-BASED & PRIORITY TIER CALCULATION ==========
function calculate() {
    const rawIncome = window.getUnformattedValue('incomeInput');
    const cycle     = document.getElementById('cycleSelect').value;
    const monthly   = cycle === 'weekly' ? rawIncome * 4 : rawIncome;

    document.getElementById('monthlyIncomeDisplay').textContent = fmt(monthly);

    const items = getBudgetLineItems();
    const { totalMonthlyRequired: goalMonthlyCommitment, activeGoalsCount } = getMonthlySavingGoalsCommitment();

    const goalBadge = document.getElementById('savingGoalsCommitmentBadge');
    if (goalBadge) {
        goalBadge.innerHTML = activeGoalsCount > 0
            ? `◈ Komitmen ${activeGoalsCount} Tabungan Tujuan: <strong style="color:var(--success);">${fmt(goalMonthlyCommitment)}/bln</strong>`
            : `Belum ada target cicilan di <a href="saving.html" style="color:var(--accent-primary);">Tabungan Tujuan</a>`;
    }

    let tier1Total = 0;
    let tier2Total = 0;
    let tier3Total = 0;

    items.forEach(item => {
        const m = calcMonthlyItemAmount(item);
        if (item.tier === 1) tier1Total += m;
        else if (item.tier === 2) tier2Total += m;
        else tier3Total += m;
    });

    const totalExpensesPlanned = tier1Total + tier2Total + tier3Total;
    const totalWithGoals = totalExpensesPlanned + goalMonthlyCommitment;
    const unassignedCash = monthly - totalWithGoals;

    // Render Priority Tier Summary Cards
    const gridEl = document.getElementById('priorityTierSummaryGrid');
    if (gridEl) {
        const pctOfInc = (val) => monthly > 0 ? `${((val / monthly) * 100).toFixed(1)}% dari income` : 'Isi pendapatan di atas';
        gridEl.innerHTML = `
            <div class="calc-summary-box" style="border-left:4px solid var(--danger);">
                <div class="label">Tier 1 — Wajib (Survival & Kerja)</div>
                <div class="val tier-val-1">${fmt(tier1Total)}</div>
                <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:3px;">${pctOfInc(tier1Total)} · Prioritas Utama</div>
            </div>
            <div class="calc-summary-box" style="border-left:4px solid var(--warning);">
                <div class="label">Tier 2 — Penting (Produktif)</div>
                <div class="val tier-val-2">${fmt(tier2Total)}</div>
                <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:3px;">${pctOfInc(tier2Total)} · Kualitas Hidup</div>
            </div>
            <div class="calc-summary-box" style="border-left:4px solid #2563eb;">
                <div class="label">Tier 3 — Keinginan (Fleksibel)</div>
                <div class="val tier-val-3">${fmt(tier3Total)}</div>
                <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:3px;">${pctOfInc(tier3Total)} · Bisa Dipangkas</div>
            </div>
            <div class="calc-summary-box" style="border-left:4px solid var(--accent-primary);">
                <div class="label">Total Rencana + Target Goal</div>
                <div class="val" style="color:var(--accent-primary);">${fmt(totalWithGoals)}</div>
                <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:3px;">≈ ${fmt(Math.round(totalExpensesPlanned / 30))}/hari (pengeluaran)</div>
            </div>
        `;
    }

    // Update Zero-Based Allocation Bar
    const denom = Math.max(monthly, totalWithGoals, 1);
    const wT1 = Math.min(100, (tier1Total / denom) * 100);
    const wT2 = Math.min(100, (tier2Total / denom) * 100);
    const wT3 = Math.min(100, (tier3Total / denom) * 100);
    const wGoal = Math.min(100, (goalMonthlyCommitment / denom) * 100);
    const wFree = monthly > totalWithGoals ? ((monthly - totalWithGoals) / denom) * 100 : 0;

    const setBar = (id, w, label) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.width = `${w.toFixed(1)}%`;
        el.textContent = w >= 7 ? `${Math.round(w)}%` : '';
    };
    setBar('zbBarT1', wT1);
    setBar('zbBarT2', wT2);
    setBar('zbBarT3', wT3);
    setBar('zbBarGoal', wGoal);
    setBar('zbBarFree', wFree);

    // Smart Reality Check & Priority Cut Advisor
    const advisorEl = document.getElementById('zeroBasedAdvisorBox');
    if (advisorEl) {
        const esc = window.escapeHtml || (s => s);
        if (!monthly || monthly <= 0) {
            advisorEl.innerHTML = `
                <div style="padding:12px 14px;border-radius:10px;background:var(--bg-primary);border:1px solid var(--border);font-size:0.86rem;color:var(--text-secondary);">
                    ▸ Total rincian kebutuhanmu saat ini adalah <strong style="color:var(--text-primary);">${fmt(totalExpensesPlanned)}/bulan</strong> (Wajib: ${fmt(tier1Total)}, Penting: ${fmt(tier2Total)}, Keinginan: ${fmt(tier3Total)}).<br>
                    Masukkan <strong>Nominal Pendapatan</strong> pada Langkah 01 di atas untuk melihat diagnosis <em>Zero-Based Budgeting</em> & rekomendasi prioritas otomatis.
                </div>
            `;
        } else if (unassignedCash >= 0) {
            const safeDailyExtra = Math.round(unassignedCash / 30);
            advisorEl.innerHTML = `
                <div style="padding:14px 16px;border-radius:12px;background:rgba(72,187,120,0.1);border:1.5px solid rgba(72,187,120,0.35);font-size:0.86rem;line-height:1.55;">
                    <div style="font-weight:700;color:var(--success);font-size:0.95rem;margin-bottom:4px;">
                        ✓ Zero-Based Check Sehat — Surplus Uang Bebas: ${fmt(unassignedCash)} / bulan
                    </div>
                    <div style="color:var(--text-primary);">
                        Seluruh kebutuhan <strong>Tier 1 Wajib (${fmt(tier1Total)})</strong>, <strong>Tier 2 Penting (${fmt(tier2Total)})</strong>, <strong>Tier 3 Keinginan (${fmt(tier3Total)})</strong>, dan <strong>Target Tabungan (${fmt(goalMonthlyCommitment)})</strong> tercukupi sepenuhnya!<br>
                        <span style="color:var(--text-secondary);">Prinsip Zero-Based Budgeting: Beri tugas untuk sisa <strong>${fmt(unassignedCash)}</strong> ini (misal tambahkan ke Tabungan Umum/Investasi atau cadangan aman <strong>${fmt(safeDailyExtra)}/hari</strong>).</span>
                    </div>
                </div>
            `;
        } else {
            const deficit = Math.abs(unassignedCash);
            // Build automatic cut suggestions from Tier 3 first, then Tier 2
            const cutCandidates = [...items]
                .filter(i => i.tier === 3 || i.tier === 2)
                .sort((a, b) => {
                    if (b.tier !== a.tier) return b.tier - a.tier; // Tier 3 first, then Tier 2
                    return calcMonthlyItemAmount(b) - calcMonthlyItemAmount(a);
                });

            let accSaved = 0;
            const suggestedCuts = [];
            for (const cand of cutCandidates) {
                if (accSaved >= deficit) break;
                const mAmt = calcMonthlyItemAmount(cand);
                if (mAmt <= 0) continue;
                accSaved += mAmt;
                suggestedCuts.push({ item: cand, monthlyAmt: mAmt });
            }

            const cutListHtml = suggestedCuts.length > 0
                ? `<div style="margin-top:8px;padding-top:8px;border-top:1px dashed rgba(245,101,101,0.35);">
                    <strong>Rekomendasi Urutan Pemangkasan (Tanpa Mengganggu Tier 1 Wajib):</strong>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">
                        ${suggestedCuts.map(c => `
                            <span style="display:inline-flex;align-items:center;gap:6px;background:var(--bg-card);border:1px solid var(--border);padding:4px 10px;border-radius:999px;font-size:0.78rem;">
                                <span class="tier-pill tier-pill--${c.item.tier}">T${c.item.tier}</span>
                                <strong>${esc(c.item.name)}</strong> (${fmt(c.monthlyAmt)}/bln)
                                <button type="button" onclick="plannerRemoveItem(${c.item.id})" style="background:rgba(245,101,101,0.2);color:var(--danger);border:none;border-radius:5px;padding:1px 6px;font-size:0.72rem;cursor:pointer;" title="Hapus/Tunda item ini">Pangkas ✕</button>
                            </span>
                        `).join('')}
                    </div>
                   </div>`
                : `<div style="margin-top:6px;color:var(--warning);">[!] Bahkan seluruh pengeluaranmu adalah Tier 1 (Wajib). Pertimbangkan mencari tambahan income atau meninjau ulang biaya tetap.</div>`;

            advisorEl.innerHTML = `
                <div style="padding:14px 16px;border-radius:12px;background:rgba(245,101,101,0.1);border:1.5px solid rgba(245,101,101,0.4);font-size:0.86rem;line-height:1.55;">
                    <div style="font-weight:700;color:var(--danger);font-size:0.95rem;margin-bottom:4px;">
                        [!] Overbudget / Defisit sebesar ${fmt(deficit)} / bulan
                    </div>
                    <div style="color:var(--text-primary);">
                        Total rencana pengeluaran (${fmt(totalExpensesPlanned)}) + komitmen tabungan (${fmt(goalMonthlyCommitment)}) = <strong>${fmt(totalWithGoals)}</strong>, melebihi pendapatanmu (<strong>${fmt(monthly)}</strong>).
                        ${cutListHtml}
                    </div>
                </div>
            `;
        }
    }

    // ── Step 04: Top-Down Percentage Simulator ──
    const needsPct  = parseInt(document.getElementById('needsPct').value, 10) || 0;
    const wantsPct  = parseInt(document.getElementById('wantsPct').value, 10) || 0;
    const savingPct = parseInt(document.getElementById('savingPct').value, 10) || 0;
    const l1Total   = needsPct + wantsPct + savingPct;

    document.getElementById('l1Warning').classList.toggle('visible', l1Total !== 100);
    checkSubTotalWarning();

    const needs  = monthly * needsPct  / 100;
    const wants  = monthly * wantsPct  / 100;
    const saving = monthly * savingPct / 100;

    document.getElementById('outNeeds').textContent  = fmt(needs);
    document.getElementById('outWants').textContent  = fmt(wants);
    document.getElementById('outSaving').textContent = fmt(saving);

    document.getElementById('outNeedsPct').textContent  = needsPct;
    document.getElementById('outWantsPct').textContent  = wantsPct;
    document.getElementById('outSavingPct').textContent = savingPct;

    document.getElementById('needsPctInput').value  = needsPct;
    document.getElementById('wantsPctInput').value  = wantsPct;
    document.getElementById('savingPctInput').value = savingPct;

    const subBreakdownEl = document.getElementById('dynamicNeedsSubBreakdown');
    if (subBreakdownEl) {
        const badgeFn = typeof window.getCategoryBadgeHtml === 'function' ? window.getCategoryBadgeHtml : () => '';
        const budgets = getStoredBudgets();
        if (activeSubCats.length === 0) {
            subBreakdownEl.innerHTML = `<div style="font-size:0.84rem;color:var(--text-secondary);">Tidak ada kategori aktif.</div>`;
        } else {
            subBreakdownEl.innerHTML = activeSubCats.map(cat => {
                const pct = Number(subPcts[cat] || 0);
                const val = needs * pct / 100;
                const actualCatAmt = Number(budgets[cat] || 0);
                const label = CATEGORY_LABELS_ID[cat] || cat;
                return `
                    <div class="sub-row">
                        <span class="sub-row-label">
                            ${badgeFn(cat)}
                            <span>${label} (${pct}%)</span>
                        </span>
                        <span class="sub-row-value">
                            Simulasi: ${fmt(val)} <span style="font-size:0.76rem;color:var(--text-secondary);font-weight:500;">(Aktual Item: ${fmt(actualCatAmt)})</span>
                        </span>
                    </div>
                `;
            }).join('');
        }
    }

    savePlannerState();
}

function syncSlidersFromActualItems() {
    const rawIncome = window.getUnformattedValue('incomeInput');
    const cycle     = document.getElementById('cycleSelect').value;
    const monthly   = cycle === 'weekly' ? rawIncome * 4 : rawIncome;

    const items = getBudgetLineItems();
    let t12 = 0;
    let t3 = 0;
    items.forEach(i => {
        const m = calcMonthlyItemAmount(i);
        if (i.tier === 3) t3 += m;
        else t12 += m;
    });

    const base = monthly > 0 ? monthly : Math.max(1, t12 + t3);
    const nPct = Math.min(100, Math.round((t12 / base) * 100));
    const wPct = Math.min(100 - nPct, Math.round((t3 / base) * 100));
    const sPct = Math.max(0, 100 - nPct - wPct);

    document.getElementById('needsPct').value  = nPct;
    document.getElementById('wantsPct').value  = wPct;
    document.getElementById('savingPct').value = sPct;

    initDynamicSubCategories();
    renderDynamicSubSliders();
    syncSlider();
    calculate();
}

function resetPlannerDefaults() {
    document.getElementById('needsPct').value  = 50;
    document.getElementById('wantsPct').value  = 30;
    document.getElementById('savingPct').value = 20;

    if (activeSubCats.length > 0) {
        let rem = 100;
        activeSubCats.forEach((cat, idx) => {
            if (idx === activeSubCats.length - 1) {
                subPcts[cat] = Math.max(0, rem);
            } else {
                const eq = Math.floor(100 / activeSubCats.length);
                subPcts[cat] = eq;
                rem -= eq;
            }
        });
        renderDynamicSubSliders();
    }

    syncSlider();
    calculate();
}

function fmt(n) {
    return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

window.pullIncomeFromTransactions = pullIncomeFromTransactions;
window.plannerQuickAdd = plannerQuickAdd;
window.plannerAddCustomItem = plannerAddCustomItem;
window.plannerEditItem = plannerEditItem;
window.plannerCancelEdit = plannerCancelEdit;
window.plannerCycleTier = plannerCycleTier;
window.plannerRemoveItem = plannerRemoveItem;
window.syncSlidersFromActualItems = syncSlidersFromActualItems;
window.resetPlannerDefaults = resetPlannerDefaults;
window.onSubRangeChange = onSubRangeChange;
window.setSubPctFromInput = setSubPctFromInput;
window.finalizeSubPctInput = finalizeSubPctInput;
window.setLevel1PctFromInput = setLevel1PctFromInput;
window.finalizeLevel1PctInput = finalizeLevel1PctInput;
window.syncSlider = syncSlider;
window.calculate = calculate;
