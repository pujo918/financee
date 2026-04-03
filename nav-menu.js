// nav-menu.js – Hamburger menu shared across all pages

(function () {
    // ===== INJECT HAMBURGER BUTTON INTO HEADER =====
    function injectHamburger() {
        const headerContent = document.querySelector('.header-content');
        if (!headerContent) return;

        // Create hamburger button
        const btn = document.createElement('button');
        btn.id = 'hamburgerBtn';
        btn.className = 'hamburger-btn';
        btn.setAttribute('aria-label', 'Menu');
        btn.innerHTML = `<span></span><span></span><span></span>`;
        headerContent.appendChild(btn);

        // Create overlay menu
        const overlay = document.createElement('div');
        overlay.id = 'mobileMenu';
        overlay.className = 'mobile-menu';

        // Determine active page
        const path = window.location.pathname;
        const isIndex = path.endsWith('index.html') || path.endsWith('/') || path === '';
        const isSaving = path.includes('saving.html');
        const isCalc = path.includes('calculator.html');

        const currentLang = localStorage.getItem('voiceLang') || 'id-ID';
        const currentTheme = localStorage.getItem('theme') || 'dark';

        overlay.innerHTML = `
            <div class="mobile-menu-inner">
                <div class="mobile-menu-header">
                    <span class="mobile-menu-title">💰 Finance Tracker</span>
                    <button class="mobile-close-btn" id="mobileCloseBtn">✕</button>
                </div>

                <nav class="mobile-nav">
                    <a href="index.html" class="mobile-nav-link ${isIndex ? 'active' : ''}">
                        📊 Dashboard
                    </a>
                    <a href="saving.html" class="mobile-nav-link ${isSaving ? 'active' : ''}">
                        💰 Tabungan
                    </a>
                    <a href="calculator.html" class="mobile-nav-link ${isCalc ? 'active' : ''}">
                        📋 Budget Planner
                    </a>
                </nav>

                <div class="mobile-menu-divider"></div>

                <div class="mobile-settings">
                    <div class="mobile-setting-label">🌐 Bahasa</div>
                    <div class="mobile-toggle-row">
                        <button class="mobile-toggle-btn ${currentLang === 'id-ID' ? 'active' : ''}" id="mobileLangID">🇮🇩 Indonesia</button>
                        <button class="mobile-toggle-btn ${currentLang === 'en-US' ? 'active' : ''}" id="mobileLangEN">🇬🇧 English</button>
                    </div>
                </div>

                <div class="mobile-settings" style="margin-top:12px;">
                    <div class="mobile-setting-label">🎨 Tampilan</div>
                    <div class="mobile-toggle-row">
                        <button class="mobile-toggle-btn ${currentTheme === 'dark' ? 'active' : ''}" id="mobileDark">🌙 Gelap</button>
                        <button class="mobile-toggle-btn ${currentTheme === 'light' ? 'active' : ''}" id="mobileLight">☀️ Terang</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // ===== EVENTS =====
        btn.addEventListener('click', openMenu);
        document.getElementById('mobileCloseBtn').addEventListener('click', closeMenu);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeMenu();
        });

        // Language buttons
        document.getElementById('mobileLangID').addEventListener('click', function () {
            setLang('id-ID');
            setActiveMobileBtns('mobileLangID', 'mobileLangEN');
        });
        document.getElementById('mobileLangEN').addEventListener('click', function () {
            setLang('en-US');
            setActiveMobileBtns('mobileLangEN', 'mobileLangID');
        });

        // Theme buttons
        document.getElementById('mobileDark').addEventListener('click', function () {
            setTheme('dark');
            setActiveMobileBtns('mobileDark', 'mobileLight');
        });
        document.getElementById('mobileLight').addEventListener('click', function () {
            setTheme('light');
            setActiveMobileBtns('mobileLight', 'mobileDark');
        });
    }

    function openMenu() {
        const menu = document.getElementById('mobileMenu');
        const btn = document.getElementById('hamburgerBtn');
        if (menu) menu.classList.add('open');
        if (btn) btn.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        const menu = document.getElementById('mobileMenu');
        const btn = document.getElementById('hamburgerBtn');
        if (menu) menu.classList.remove('open');
        if (btn) btn.classList.remove('open');
        document.body.style.overflow = '';
    }

    function setActiveMobileBtns(activeId, inactiveId) {
        const a = document.getElementById(activeId);
        const b = document.getElementById(inactiveId);
        if (a) a.classList.add('active');
        if (b) b.classList.remove('active');
    }

    function setLang(lang) {
        localStorage.setItem('voiceLang', lang);
        // Sync desktop lang toggle if exists
        const desktopBtn = document.getElementById('langToggle');
        if (desktopBtn) desktopBtn.textContent = lang === 'en-US' ? '🇬🇧 EN' : '🇮🇩 ID';
        // Sync voice recognition language if running
        if (window.recognition) window.recognition.lang = lang;
        if (window.currentLang !== undefined) window.currentLang = lang;
        if (typeof window.updateVoiceSuggestions === 'function') window.updateVoiceSuggestions();
    }

    function setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        // Sync desktop theme toggle if exists
        const desktopBtn = document.getElementById('themeToggle');
        if (desktopBtn) desktopBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    // ===== ALSO SYNC DESKTOP BUTTONS =====
    function initDesktopControls() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.body.setAttribute('data-theme', savedTheme);

        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
            themeBtn.addEventListener('click', function () {
                const isDark = document.body.getAttribute('data-theme') === 'dark';
                setTheme(isDark ? 'light' : 'dark');
                // Sync mobile buttons
                if (isDark) setActiveMobileBtns('mobileLight', 'mobileDark');
                else setActiveMobileBtns('mobileDark', 'mobileLight');
            });
        }

        const langBtn = document.getElementById('langToggle');
        const savedLang = localStorage.getItem('voiceLang') || 'id-ID';
        if (langBtn) {
            langBtn.textContent = savedLang === 'en-US' ? '🇬🇧 EN' : '🇮🇩 ID';
            langBtn.addEventListener('click', function () {
                const cur = localStorage.getItem('voiceLang') || 'id-ID';
                const next = cur === 'en-US' ? 'id-ID' : 'en-US';
                setLang(next);
                if (next === 'en-US') setActiveMobileBtns('mobileLangEN', 'mobileLangID');
                else setActiveMobileBtns('mobileLangID', 'mobileLangEN');
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        injectHamburger();
        initDesktopControls();
    });
})();
