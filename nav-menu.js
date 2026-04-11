// nav-menu.js – Hamburger menu shared across all pages

(function () {
    const IMAGE_THEME_KEY = 'theme';
    const COLOR_THEME_KEY = 'colorTheme';
    const IMAGE_THEME_DEFAULT = 'naruto';

    const imageMapping = {
        'naruto': 'one piece',
        'naruto (12)': '12',
        'naruto__1_-removebg-preview': '1',
        'naruto__10_-removebg-preview': '10',
        'naruto__2_-removebg-preview': '2',
        'naruto__3_-removebg-preview': '3',
        'naruto__5_-removebg-preview': '5',
        'naruto__6_-removebg-preview': '6'
    };

    const narutoExt = {
        'naruto': 'jpeg',
        'naruto (12)': 'jpg'
    };

    function getImagePath(name, themeName) {
        const theme = themeName || localStorage.getItem(IMAGE_THEME_KEY) || IMAGE_THEME_DEFAULT;
        if (theme === 'onepiece') {
            const mapped = imageMapping[name] || name;
            return `images/tema 2/${mapped}.png`;
        }
        const ext = narutoExt[name] || 'png';
        return `images/${name}.${ext}`;
    }

    function applyImageTheme(themeName) {
        const theme = themeName || localStorage.getItem(IMAGE_THEME_KEY) || IMAGE_THEME_DEFAULT;
        const root = document.documentElement;
        root.style.setProperty('--img-body-bg', `url("${getImagePath('naruto (12)', theme)}")`);
        root.style.setProperty('--img-income', `url("${getImagePath('naruto__2_-removebg-preview', theme)}")`);
        root.style.setProperty('--img-expense', `url("${getImagePath('naruto__3_-removebg-preview', theme)}")`);
        root.style.setProperty('--img-net', `url("${getImagePath('naruto__5_-removebg-preview', theme)}")`);
        root.style.setProperty('--img-rate', `url("${getImagePath('naruto__6_-removebg-preview', theme)}")`);
        root.style.setProperty('--img-voice-left', `url("${getImagePath('naruto__1_-removebg-preview', theme)}")`);
        root.style.setProperty('--img-voice-right', `url("${getImagePath('naruto__10_-removebg-preview', theme)}")`);

        const avatar = document.getElementById('voiceAvatar');
        if (avatar) avatar.src = getImagePath('naruto', theme);

        document.body.classList.remove('naruto', 'onepiece');
        document.body.classList.add(theme);
    }

    function setImageTheme(themeName) {
        const previous = localStorage.getItem(IMAGE_THEME_KEY) || IMAGE_THEME_DEFAULT;
        const next = themeName === 'onepiece' ? 'onepiece' : IMAGE_THEME_DEFAULT;
        const select = document.getElementById('animeThemeSelect');
        if (select) select.value = next;
        if (previous === next) return;

        runThemeLoading(next, function () {
            localStorage.setItem(IMAGE_THEME_KEY, next);
            applyImageTheme(next);
            applyThemeCopy(next);
            showThemeToast(next);
        });
    }

    function injectAnimeThemeControl() {
        const actions = document.querySelector('.header-actions');
        if (!actions || document.getElementById('animeThemeSelect')) return;

        const select = document.createElement('select');
        select.id = 'animeThemeSelect';
        select.className = 'anime-theme-select';
        select.innerHTML = `
            <option value="naruto">Naruto</option>
            <option value="onepiece">One Piece</option>
        `;
        select.value = localStorage.getItem(IMAGE_THEME_KEY) || IMAGE_THEME_DEFAULT;
        select.addEventListener('change', (e) => setImageTheme(e.target.value));
        actions.prepend(select);
    }

    function pickThemeQuote(theme) {
        const narutoQuotes = [
            'Track smart, spend wise!',
            'Small steps, big savings!',
            'Monthly reflection helps growth!'
        ];
        const onePieceQuotes = [
            'Set sail, track every berry!',
            'Build your treasure, one step at a time!',
            'Navigate your budget like a captain!'
        ];
        const pool = theme === 'onepiece' ? onePieceQuotes : narutoQuotes;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function applyThemeCopy(theme) {
        const isOnePiece = theme === 'onepiece';
        const quote = document.getElementById('dailyQuote');
        if (quote) quote.textContent = `"${pickThemeQuote(theme)}"`;

        const summaryTitle = document.querySelector('#monthlyDashboard .section-title span');
        if (summaryTitle) summaryTitle.textContent = isOnePiece ? '⚓ Grand Line Summary' : '🍥 Konoha Monthly Summary';

        const alltimeTitle = document.querySelector('#alltimeDashboard .section-title span');
        if (alltimeTitle) alltimeTitle.textContent = isOnePiece ? '🌊 Sea Voyage Summary' : '🔥 Shinobi All-Time Summary';

        const voiceTitle = document.querySelector('.voice-section h2');
        if (voiceTitle) voiceTitle.textContent = isOnePiece ? '🏴‍☠️ Crew Voice Log' : '🥷 Shinobi Voice Input';

        const h1 = document.querySelector('header h1');
        if (h1) h1.textContent = isOnePiece ? '🏴‍☠️ Finance Voyage' : '💰 Finance Tracker';
    }

    function showThemeToast(theme) {
        let toast = document.getElementById('themeToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'themeToast';
            toast.className = 'theme-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = theme === 'onepiece' ? 'Set sail to Grand Line!' : 'Back to Hidden Leaf mode!';
        toast.classList.add('show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), 1800);
    }

    function ensureThemeLoader() {
        let loader = document.getElementById('themeLoader');
        if (loader) return loader;

        loader = document.createElement('div');
        loader.id = 'themeLoader';
        loader.className = 'theme-loader';
        loader.innerHTML = `
            <div class="theme-loader-card">
                <div class="theme-loader-logo" id="themeLoaderLogo">⚓</div>
                <div class="theme-loader-text" id="themeLoaderText">Set sail to Grand Line!</div>
                <div class="theme-loader-percent" id="themeLoaderPercent">1%</div>
                <div class="theme-loader-track">
                    <div class="theme-loader-fill" id="themeLoaderFill"></div>
                </div>
            </div>
        `;
        document.body.appendChild(loader);
        return loader;
    }

    function runThemeLoading(nextTheme, onDone) {
        const loader = ensureThemeLoader();
        if (loader.classList.contains('show')) return;

        const textEl = document.getElementById('themeLoaderText');
        const logoEl = document.getElementById('themeLoaderLogo');
        const percentEl = document.getElementById('themeLoaderPercent');
        const fillEl = document.getElementById('themeLoaderFill');

        loader.classList.remove('naruto', 'onepiece');
        loader.classList.add(nextTheme);

        if (textEl) {
            textEl.textContent = nextTheme === 'onepiece'
                ? 'Set sail to Grand Line!'
                : 'Returning to Hidden Leaf Village...';
        }
        if (logoEl) logoEl.textContent = nextTheme === 'onepiece' ? '⚓' : '🍥';

        let progress = 1;
        if (percentEl) percentEl.textContent = `${progress}%`;
        if (fillEl) fillEl.style.width = `${progress}%`;

        loader.classList.add('show');
        document.body.style.overflow = 'hidden';

        const timer = setInterval(function () {
            progress += 1;
            if (percentEl) percentEl.textContent = `${progress}%`;
            if (fillEl) fillEl.style.width = `${progress}%`;
            if (textEl && progress >= 40 && progress < 85) {
                textEl.textContent = nextTheme === 'onepiece'
                    ? 'Charting the ocean route...'
                    : 'Gathering chakra energy...';
            }
            if (textEl && progress >= 85) {
                textEl.textContent = nextTheme === 'onepiece'
                    ? 'Crew ready. Prepare to sail!'
                    : 'Shinobi mode almost ready!';
            }

            if (progress >= 100) {
                clearInterval(timer);
                onDone();
                setTimeout(function () {
                    loader.classList.remove('show');
                    document.body.style.overflow = '';
                }, 220);
            }
        }, 18);
    }

    window.getImagePath = getImagePath;
    window.setImageTheme = setImageTheme;

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
        const currentTheme = localStorage.getItem(COLOR_THEME_KEY) || 'dark';
        const currentImageTheme = localStorage.getItem(IMAGE_THEME_KEY) || IMAGE_THEME_DEFAULT;

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
                <div class="mobile-settings" style="margin-top:12px;">
                    <div class="mobile-setting-label">🖼️ Tema Karakter</div>
                    <div class="mobile-toggle-row">
                        <button class="mobile-toggle-btn ${currentImageTheme === 'naruto' ? 'active' : ''}" id="mobileNaruto">Naruto</button>
                        <button class="mobile-toggle-btn ${currentImageTheme === 'onepiece' ? 'active' : ''}" id="mobileOnePiece">One Piece</button>
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
        document.getElementById('mobileNaruto').addEventListener('click', function () {
            setImageTheme('naruto');
            setActiveMobileBtns('mobileNaruto', 'mobileOnePiece');
        });
        document.getElementById('mobileOnePiece').addEventListener('click', function () {
            setImageTheme('onepiece');
            setActiveMobileBtns('mobileOnePiece', 'mobileNaruto');
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
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem(COLOR_THEME_KEY, theme);
        // Sync desktop theme toggle if exists
        const desktopBtn = document.getElementById('themeToggle');
        if (desktopBtn) desktopBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    // ===== ALSO SYNC DESKTOP BUTTONS =====
    function initDesktopControls() {
        const savedTheme = localStorage.getItem(COLOR_THEME_KEY) || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.body.setAttribute('data-theme', savedTheme);

        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.disabled = false;
            themeBtn.style.pointerEvents = 'auto';
            themeBtn.style.cursor = 'pointer';
            themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
            themeBtn.onclick = function () {
                const isDark = document.body.getAttribute('data-theme') === 'dark';
                setTheme(isDark ? 'light' : 'dark');
                // Sync mobile buttons
                if (isDark) setActiveMobileBtns('mobileLight', 'mobileDark');
                else setActiveMobileBtns('mobileDark', 'mobileLight');
            };
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
        injectAnimeThemeControl();
        const currentImageTheme = localStorage.getItem(IMAGE_THEME_KEY) || IMAGE_THEME_DEFAULT;
        applyImageTheme(currentImageTheme);
        applyThemeCopy(currentImageTheme);
        injectHamburger();
        initDesktopControls();
        setTimeout(initDesktopControls, 120);
    });
})();

window.formatCurrencyInput = function(e) {
    let input = e.target;
    if (input.type === 'number') {
        input.type = 'text';
        input.inputMode = 'numeric';
    }
    let cursorPosition = input.selectionStart;
    let oldVal = input.value;
    
    let value = oldVal.replace(/[^0-9]/g, '');
    if (value === '') {
        input.value = '';
        return;
    }
    let formatted = parseInt(value, 10).toLocaleString('id-ID');
    input.value = formatted;
    
    try {
        let newCursorPosition = cursorPosition + (formatted.length - oldVal.length);
        if(newCursorPosition < 0) newCursorPosition = 0;
        input.setSelectionRange(newCursorPosition, newCursorPosition);
    } catch (err) {}
};

window.getUnformattedValue = function(elementId) {
    let el = document.getElementById(elementId);
    if (!el) return 0;
    return Number(el.value.replace(/[^0-9]/g, '')) || 0;
};
