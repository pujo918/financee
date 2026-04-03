// app-calculator.js – Budget Planner logic

document.addEventListener('DOMContentLoaded', () => {
    // Theme
    const btn = document.getElementById('themeToggle');
    const saved = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', saved);
    if (btn) {
        btn.textContent = saved === 'dark' ? '☀️' : '🌙';
        btn.addEventListener('click', () => {
            const isDark = document.body.getAttribute('data-theme') === 'dark';
            const next = isDark ? 'light' : 'dark';
            document.body.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            btn.textContent = next === 'dark' ? '☀️' : '🌙';
        });
    }

    // Initial render
    calculate();
});

// ========== SLIDER SYNC – Level 1 ==========
// Which slider was last moved locks the others proportionally
function syncSlider(changed) {
    const ids = ['needs', 'wants', 'saving'];
    const values = {
        needs:  parseInt(document.getElementById('needsPct').value),
        wants:  parseInt(document.getElementById('wantsPct').value),
        saving: parseInt(document.getElementById('savingPct').value),
    };

    // Show current value immediately
    document.getElementById('needsPctDisplay').textContent  = values.needs  + '%';
    document.getElementById('wantsPctDisplay').textContent  = values.wants  + '%';
    document.getElementById('savingPctDisplay').textContent = values.saving + '%';

    const total = values.needs + values.wants + values.saving;
    const warn = document.getElementById('l1Warning');
    if (warn) warn.classList.toggle('visible', total !== 100);
}

// ========== SLIDER SYNC – Level 2 ==========
function syncSubSlider() {
    const f = parseInt(document.getElementById('foodPct').value);
    const t = parseInt(document.getElementById('transPct').value);
    const h = parseInt(document.getElementById('healthPct').value);

    document.getElementById('foodPctDisplay').textContent   = f + '%';
    document.getElementById('transPctDisplay').textContent  = t + '%';
    document.getElementById('healthPctDisplay').textContent = h + '%';

    const total = f + t + h;
    const warn = document.getElementById('l2Warning');
    if (warn) warn.classList.toggle('visible', total !== 100);
}

// ========== CALCULATE ==========
function calculate() {
    const rawIncome = Number(document.getElementById('incomeInput').value) || 0;
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

    // ── Slider display labels ──
    document.getElementById('needsPctDisplay').textContent  = needsPct  + '%';
    document.getElementById('wantsPctDisplay').textContent  = wantsPct  + '%';
    document.getElementById('savingPctDisplay').textContent = savingPct + '%';
    document.getElementById('foodPctDisplay').textContent   = foodPct   + '%';
    document.getElementById('transPctDisplay').textContent  = transPct  + '%';
    document.getElementById('healthPctDisplay').textContent = healthPct + '%';

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
