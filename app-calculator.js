// app-calculator.js – Budget Planner logic

document.addEventListener('DOMContentLoaded', () => {
    // Initial render
    calculate();
});

// ========== SLIDER SYNC – Level 1 ==========
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

// ========== SLIDER SYNC – Level 2 ==========
const SUB_PCT_KEYS = ['food', 'trans', 'health'];

function syncSubSlider() {
    const f = parseInt(document.getElementById('foodPct').value, 10);
    const t = parseInt(document.getElementById('transPct').value, 10);
    const h = parseInt(document.getElementById('healthPct').value, 10);

    document.getElementById('foodPctInput').value   = f;
    document.getElementById('transPctInput').value  = t;
    document.getElementById('healthPctInput').value = h;

    const total = f + t + h;
    const warn = document.getElementById('l2Warning');
    if (warn) warn.classList.toggle('visible', total !== 100);
}

function setSubPctFromInput(key) {
    if (!SUB_PCT_KEYS.includes(key)) return;
    const input = document.getElementById(key + 'PctInput');
    const range = document.getElementById(key + 'Pct');
    const raw = String(input.value).trim();
    if (raw === '' || raw === '-') return;

    let v = parseInt(raw, 10);
    if (Number.isNaN(v)) v = 0;
    v = Math.max(0, Math.min(100, v));
    input.value = v;
    range.value = String(v);
    syncSubSlider();
    calculate();
}

function finalizeSubPctInput(key) {
    if (!SUB_PCT_KEYS.includes(key)) return;
    const input = document.getElementById(key + 'PctInput');
    const range = document.getElementById(key + 'Pct');
    const raw = String(input.value).trim();
    if (raw === '' || raw === '-') {
        input.value = 0;
        range.value = '0';
    }
    syncSubSlider();
    calculate();
}

// ========== CALCULATE ==========
function calculate() {
    const rawIncome = window.getUnformattedValue('incomeInput');
    const cycle     = document.getElementById('cycleSelect').value;
    const monthly   = cycle === 'weekly' ? rawIncome * 4 : rawIncome;

    document.getElementById('monthlyIncomeDisplay').textContent = fmt(monthly);

    // Level 1 percentages
    const needsPct  = parseInt(document.getElementById('needsPct').value);
    const wantsPct  = parseInt(document.getElementById('wantsPct').value);
    const savingPct = parseInt(document.getElementById('savingPct').value);
    const l1Total   = needsPct + wantsPct + savingPct;

    // Show warning if not 100
    document.getElementById('l1Warning').classList.toggle('visible', l1Total !== 100);

    // Level 2 percentages
    const foodPct   = parseInt(document.getElementById('foodPct').value);
    const transPct  = parseInt(document.getElementById('transPct').value);
    const healthPct = parseInt(document.getElementById('healthPct').value);
    const l2Total   = foodPct + transPct + healthPct;

    document.getElementById('l2Warning').classList.toggle('visible', l2Total !== 100);

    // ── Calculations ──
    const needs  = monthly * needsPct  / 100;
    const wants  = monthly * wantsPct  / 100;
    const saving = monthly * savingPct / 100;

    const food   = needs * foodPct   / 100;
    const trans  = needs * transPct  / 100;
    const health = needs * healthPct / 100;

    // ── Output text ──
    document.getElementById('outNeeds').textContent  = fmt(needs);
    document.getElementById('outWants').textContent  = fmt(wants);
    document.getElementById('outSaving').textContent = fmt(saving);
    document.getElementById('outFood').textContent   = fmt(food);
    document.getElementById('outTrans').textContent  = fmt(trans);
    document.getElementById('outHealth').textContent = fmt(health);

    // ── Pct labels ──
    document.getElementById('outNeedsPct').textContent  = needsPct;
    document.getElementById('outWantsPct').textContent  = wantsPct;
    document.getElementById('outSavingPct').textContent = savingPct;
    document.getElementById('outFoodPct').textContent   = foodPct;
    document.getElementById('outTransPct').textContent  = transPct;
    document.getElementById('outHealthPct').textContent = healthPct;

    document.getElementById('needsPctInput').value  = needsPct;
    document.getElementById('wantsPctInput').value  = wantsPct;
    document.getElementById('savingPctInput').value = savingPct;
    document.getElementById('foodPctInput').value   = foodPct;
    document.getElementById('transPctInput').value  = transPct;
    document.getElementById('healthPctInput').value = healthPct;

    // ── Bar chart ──
    const barNeeds  = document.getElementById('barNeeds');
    const barWants  = document.getElementById('barWants');
    const barSaving = document.getElementById('barSaving');

    if (l1Total > 0) {
        const n = (needsPct  / l1Total * 100).toFixed(1);
        const w = (wantsPct  / l1Total * 100).toFixed(1);
        const s = (savingPct / l1Total * 100).toFixed(1);
        barNeeds.style.width  = n + '%'; barNeeds.textContent  = needsPct  + '%';
        barWants.style.width  = w + '%'; barWants.textContent  = wantsPct  + '%';
        barSaving.style.width = s + '%'; barSaving.textContent = savingPct + '%';
    }
}

function fmt(n) {
    return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}
