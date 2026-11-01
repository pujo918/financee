// nav-menu.js – Shared navigation, theme, language, custom SVG icons & currency utilities

(function () {
    const IMAGE_THEME_KEY = 'theme';
    const COLOR_THEME_KEY = 'colorTheme';
    const IMAGE_THEME_DEFAULT = 'naruto';

    // Custom vector SVG icons for UI & Navigation
    const SVG_ICONS = {
        sun: '<svg class="ui-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
        moon: '<svg class="ui-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
        dashboard: '<svg class="ui-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
        savings: '<svg class="ui-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z"/><circle cx="13" cy="11" r="1"/></svg>',
        planner: '<svg class="ui-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>',
        mic: '<svg class="ui-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
        keyboard: '<svg class="ui-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="8" x2="6.01" y2="8"/><line x1="10" y1="8" x2="10.01" y2="8"/><line x1="14" y1="8" x2="14.01" y2="8"/><line x1="18" y1="8" x2="18.01" y2="8"/><line x1="8" y1="12" x2="8.01" y2="12"/><line x1="12" y1="12" x2="12.01" y2="12"/><line x1="16" y1="12" x2="16.01" y2="12"/><line x1="7" y1="16" x2="17" y2="16"/></svg>',
        trash: '<svg class="ui-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
        check: '<svg class="ui-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
        calendar: '<svg class="ui-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        globe: '<svg class="ui-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
        plus: '<svg class="ui-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
        history: '<svg class="ui-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/><polyline points="12 7 12 12 15 15"/></svg>',
        analytics: '<svg class="ui-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>',
        wallet: '<svg class="ui-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>',
        target: '<svg class="ui-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
        edit: '<svg class="ui-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
        search: '<svg class="ui-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
        download: '<svg class="ui-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
        upload: '<svg class="ui-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
        helm: '<svg class="ui-icon" viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="32" r="18"/><circle cx="32" cy="32" r="5"/><line x1="32" y1="4" x2="32" y2="14"/><line x1="32" y1="50" x2="32" y2="60"/><line x1="4" y1="32" x2="14" y2="32"/><line x1="50" y1="32" x2="60" y2="32"/><line x1="12.2" y1="12.2" x2="19.3" y2="19.3"/><line x1="44.7" y1="44.7" x2="51.8" y2="51.8"/><line x1="51.8" y1="12.2" x2="44.7" y2="19.3"/><line x1="19.3" y1="44.7" x2="12.2" y2="51.8"/></svg>',
        shuriken: '<svg class="ui-icon" viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="32,4 39,25 60,32 39,39 32,60 25,39 4,32 25,25"/><circle cx="32" cy="32" r="6"/></svg>'
    };

    // Custom vector SVG icons for each Expense & Income Category
    const CATEGORY_SVGS = {
        food: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>',
        transport: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>',
        bills: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
        study: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
        entertainment: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="4"/></svg>',
        shopping: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
        health: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
        salary: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></svg>',
        freelance: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
        bonus: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
        investment: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
        gift: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>',
        other: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>'
    };

    window.getIconSvg = function (name) {
        return SVG_ICONS[name] || '';
    };

    window.getCategorySvg = function (cat) {
        const key = String(cat || 'other').toLowerCase().trim();
        return CATEGORY_SVGS[key] || CATEGORY_SVGS.other;
    };

    window.getCategoryBadgeHtml = function (cat) {
        const key = String(cat || 'other').toLowerCase().trim();
        const svg = CATEGORY_SVGS[key] || CATEGORY_SVGS.other;
        return `<span class="cat-icon-badge cat-icon-badge--${key}">${svg}</span>`;
    };

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

        if (theme === 'original') {
            root.style.setProperty('--img-body-bg', 'none');
            root.style.setProperty('--img-income', 'none');
            root.style.setProperty('--img-expense', 'none');
            root.style.setProperty('--img-net', 'none');
            root.style.setProperty('--img-rate', 'none');
            root.style.setProperty('--img-voice-left', 'none');
            root.style.setProperty('--img-voice-right', 'none');
        } else {
            root.style.setProperty('--img-body-bg', `url("${getImagePath('naruto (12)', theme)}")`);
            root.style.setProperty('--img-income', `url("${getImagePath('naruto__2_-removebg-preview', theme)}")`);
            root.style.setProperty('--img-expense', `url("${getImagePath('naruto__3_-removebg-preview', theme)}")`);
            root.style.setProperty('--img-net', `url("${getImagePath('naruto__5_-removebg-preview', theme)}")`);
            root.style.setProperty('--img-rate', `url("${getImagePath('naruto__6_-removebg-preview', theme)}")`);
            root.style.setProperty('--img-voice-left', `url("${getImagePath('naruto__1_-removebg-preview', theme)}")`);
            root.style.setProperty('--img-voice-right', `url("${getImagePath('naruto__10_-removebg-preview', theme)}")`);
        }

        const avatar = document.getElementById('voiceAvatar');
        if (avatar) {
            if (theme === 'original') {
                avatar.style.display = 'none';
            } else {
                avatar.style.display = '';
                avatar.src = getImagePath('naruto', theme);
            }
        }

        document.body.classList.remove('naruto', 'onepiece', 'original');
        document.body.classList.add(theme);

        window.syncThemeToAndroidWidget(theme);
    }

    window.syncThemeToAndroidWidget = function (themeOverride) {
        try {
            const active = themeOverride || localStorage.getItem(IMAGE_THEME_KEY) || IMAGE_THEME_DEFAULT;
            if (window.AndroidWidget && typeof window.AndroidWidget.setTheme === 'function') {
                window.AndroidWidget.setTheme(active);
            }
        } catch (e) {}
    };

    function setImageTheme(themeName) {
        const previous = localStorage.getItem(IMAGE_THEME_KEY) || IMAGE_THEME_DEFAULT;
        const validThemes = ['original', 'naruto', 'onepiece'];
        const next = validThemes.includes(themeName) ? themeName : IMAGE_THEME_DEFAULT;
        const select = document.getElementById('animeThemeSelect');
        if (select) select.value = next;

        window.syncThemeToAndroidWidget(next);
        if (previous === next) return;

        runThemeLoading(next, function () {
            localStorage.setItem(IMAGE_THEME_KEY, next);
            applyImageTheme(next);
            applyThemeCopy(next);
            showThemeToast(next);
            window.syncThemeToAndroidWidget(next);
            if (typeof window.renderAnalytics === 'function' && document.getElementById('analyticsTab')?.classList.contains('active')) {
                window.renderAnalytics();
            }
        });
    }

    function injectAnimeThemeControl() {
        const actions = document.querySelector('.header-actions');
        if (!actions || document.getElementById('animeThemeSelect')) return;

        const select = document.createElement('select');
        select.id = 'animeThemeSelect';
        select.className = 'anime-theme-select';
        select.innerHTML = `
            <option value="original">Original</option>
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
        const originalQuotes = [
            'Disiplin finansial hari ini adalah kemerdekaan finansial masa depan.',
            'Ukur setiap rupiah pengeluaran, bangun masa depan dengan rencana.',
            'Bukan seberapa banyak yang dihasilkan, tapi seberapa bijak mengelolanya.'
        ];
        const pool = theme === 'original' ? originalQuotes : (theme === 'onepiece' ? onePieceQuotes : narutoQuotes);
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function applyThemeCopy(theme) {
        const isOnePiece = theme === 'onepiece';
        const isOriginal = theme === 'original';
        const quote = document.getElementById('dailyQuote');
        if (quote) quote.textContent = `"${pickThemeQuote(theme)}"`;

        const summaryTitle = document.querySelector('#monthlyDashboard .section-title span');
        if (summaryTitle) {
            summaryTitle.innerHTML = `${SVG_ICONS.dashboard} <span>${isOriginal ? 'Ringkasan Keuangan Bulanan' : (isOnePiece ? 'Grand Line Summary' : 'Konoha Monthly Summary')}</span>`;
        }

        const alltimeTitle = document.querySelector('#alltimeDashboard .section-title span');
        if (alltimeTitle) {
            alltimeTitle.innerHTML = `${SVG_ICONS.globe} <span>${isOriginal ? 'Ringkasan Finansial All-Time' : (isOnePiece ? 'Sea Voyage Summary' : 'Shinobi All-Time Summary')}</span>`;
        }

        const voiceTitle = document.querySelector('.voice-section h2');
        if (voiceTitle) {
            voiceTitle.innerHTML = `${SVG_ICONS.mic} <span>${isOriginal ? 'Catat Keuangan Lewat Suara' : (isOnePiece ? 'Crew Voice Log' : 'Shinobi Voice Input')}</span>`;
        }

        const h1 = document.querySelector('header h1');
        if (h1) h1.textContent = isOnePiece ? 'FINANCE VOYAGE' : 'FINANCE TRACKER';
    }

    function showThemeToast(theme) {
        let toast = document.getElementById('themeToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'themeToast';
            toast.className = 'theme-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = theme === 'original'
            ? 'Beralih ke Tema Original!'
            : (theme === 'onepiece' ? 'Set sail to Grand Line!' : 'Back to Hidden Leaf mode!');
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
                <div class="theme-loader-logo" id="themeLoaderLogo">${SVG_ICONS.helm}</div>
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

        loader.classList.remove('naruto', 'onepiece', 'original');
        loader.classList.add(nextTheme);

        if (textEl) {
            if (nextTheme === 'original') {
                textEl.textContent = 'Memuat tema Original...';
            } else if (nextTheme === 'onepiece') {
                textEl.textContent = 'Set sail to Grand Line!';
            } else {
                textEl.textContent = 'Returning to Hidden Leaf Village...';
            }
        }
        if (logoEl) {
            if (nextTheme === 'original') logoEl.innerHTML = SVG_ICONS.wallet;
            else if (nextTheme === 'onepiece') logoEl.innerHTML = SVG_ICONS.helm;
            else logoEl.innerHTML = SVG_ICONS.shuriken;
        }

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
                if (nextTheme === 'original') {
                    textEl.textContent = 'Menata visual finansial modern...';
                } else if (nextTheme === 'onepiece') {
                    textEl.textContent = 'Charting the ocean route...';
                } else {
                    textEl.textContent = 'Gathering chakra energy...';
                }
            }
            if (textEl && progress >= 85) {
                if (nextTheme === 'original') {
                    textEl.textContent = 'Tema Original siap digunakan!';
                } else if (nextTheme === 'onepiece') {
                    textEl.textContent = 'Crew ready. Prepare to sail!';
                } else {
                    textEl.textContent = 'Shinobi mode almost ready!';
                }
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
        if (!headerContent || document.getElementById('hamburgerBtn')) return;

        const btn = document.createElement('button');
        btn.id = 'hamburgerBtn';
        btn.className = 'hamburger-btn';
        btn.setAttribute('aria-label', 'Menu');
        btn.innerHTML = `<span></span><span></span><span></span>`;
        headerContent.appendChild(btn);

        const overlay = document.createElement('div');
        overlay.id = 'mobileMenu';
        overlay.className = 'mobile-menu';

        const path = window.location.pathname;
        const isSaving = path.includes('saving.html');
        const isCalc = path.includes('calculator.html');
        const isIndex = !isSaving && !isCalc;

        const currentLang = localStorage.getItem('voiceLang') || 'id-ID';
        const currentTheme = localStorage.getItem(COLOR_THEME_KEY) || 'dark';
        const currentImageTheme = localStorage.getItem(IMAGE_THEME_KEY) || IMAGE_THEME_DEFAULT;

        overlay.innerHTML = `
            <div class="mobile-menu-inner">
                <div class="mobile-menu-header">
                    <span class="mobile-menu-title">FINANCE TRACKER</span>
                    <button class="mobile-close-btn" id="mobileCloseBtn">✕</button>
                </div>

                <nav class="mobile-nav">
                    <a href="index.html" class="mobile-nav-link ${isIndex ? 'active' : ''}">
                        ${SVG_ICONS.dashboard} <span>Dashboard</span>
                    </a>
                    <a href="saving.html" class="mobile-nav-link ${isSaving ? 'active' : ''}">
                        ${SVG_ICONS.savings} <span>Tabungan</span>
                    </a>
                    <a href="calculator.html" class="mobile-nav-link ${isCalc ? 'active' : ''}">
                        ${SVG_ICONS.planner} <span>Budget Planner</span>
                    </a>
                </nav>

                <div class="mobile-menu-divider"></div>

                <div class="mobile-settings">
                    <div class="mobile-setting-label">Bahasa</div>
                    <div class="mobile-toggle-row">
                        <button class="mobile-toggle-btn ${currentLang === 'id-ID' ? 'active' : ''}" id="mobileLangID">[ID] Indonesia</button>
                        <button class="mobile-toggle-btn ${currentLang === 'en-US' ? 'active' : ''}" id="mobileLangEN">[EN] English</button>
                    </div>
                </div>

                <div class="mobile-settings" style="margin-top:12px;">
                    <div class="mobile-setting-label">Tampilan</div>
                    <div class="mobile-toggle-row">
                        <button class="mobile-toggle-btn ${currentTheme === 'dark' ? 'active' : ''}" id="mobileDark">${SVG_ICONS.moon} Gelap</button>
                        <button class="mobile-toggle-btn ${currentTheme === 'light' ? 'active' : ''}" id="mobileLight">${SVG_ICONS.sun} Terang</button>
                    </div>
                </div>
                <div class="mobile-settings" style="margin-top:12px;">
                    <div class="mobile-setting-label">Tema Tampilan</div>
                    <div class="mobile-toggle-row">
                        <button class="mobile-toggle-btn ${currentImageTheme === 'original' ? 'active' : ''}" id="mobileOriginal">Original</button>
                        <button class="mobile-toggle-btn ${currentImageTheme === 'naruto' ? 'active' : ''}" id="mobileNaruto">Naruto</button>
                        <button class="mobile-toggle-btn ${currentImageTheme === 'onepiece' ? 'active' : ''}" id="mobileOnePiece">One Piece</button>
                    </div>
                </div>

                <div class="mobile-settings" style="margin-top:16px;">
                    <button type="button" class="install-app-btn" onclick="triggerPwaInstall()" style="width:100%;justify-content:center;padding:12px;font-size:0.92rem;border-radius:12px;">
                        ${SVG_ICONS.download} <span>Install Aplikasi di HP</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        btn.addEventListener('click', openMenu);
        document.getElementById('mobileCloseBtn').addEventListener('click', closeMenu);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeMenu();
        });

        document.getElementById('mobileLangID').addEventListener('click', function () {
            setLang('id-ID');
            setActiveMobileBtns('mobileLangID', 'mobileLangEN');
        });
        document.getElementById('mobileLangEN').addEventListener('click', function () {
            setLang('en-US');
            setActiveMobileBtns('mobileLangEN', 'mobileLangID');
        });

        document.getElementById('mobileDark').addEventListener('click', function () {
            setTheme('dark');
            setActiveMobileBtns('mobileDark', 'mobileLight');
        });
        document.getElementById('mobileLight').addEventListener('click', function () {
            setTheme('light');
            setActiveMobileBtns('mobileLight', 'mobileDark');
        });

        function setActiveThemeMobile(activeId) {
            ['mobileOriginal', 'mobileNaruto', 'mobileOnePiece'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.toggle('active', id === activeId);
            });
        }

        document.getElementById('mobileOriginal').addEventListener('click', function () {
            setImageTheme('original');
            setActiveThemeMobile('mobileOriginal');
        });
        document.getElementById('mobileNaruto').addEventListener('click', function () {
            setImageTheme('naruto');
            setActiveThemeMobile('mobileNaruto');
        });
        document.getElementById('mobileOnePiece').addEventListener('click', function () {
            setImageTheme('onepiece');
            setActiveThemeMobile('mobileOnePiece');
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
        window.currentLang = lang;
        const desktopBtn = document.getElementById('langToggle');
        if (desktopBtn) {
            desktopBtn.textContent = lang === 'en-US' ? 'EN' : 'ID';
            desktopBtn.classList.add('active');
        }
        if (window.recognition) window.recognition.lang = lang;
        if (typeof window.updateVoiceSuggestions === 'function') window.updateVoiceSuggestions();
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem(COLOR_THEME_KEY, theme);
        const desktopBtn = document.getElementById('themeToggle');
        if (desktopBtn) desktopBtn.innerHTML = theme === 'dark' ? SVG_ICONS.sun : SVG_ICONS.moon;
        if (typeof window.renderAnalytics === 'function' && document.getElementById('analyticsTab')?.classList.contains('active')) {
            window.renderAnalytics();
        }
    }

    window.setLang = setLang;
    window.setTheme = setTheme;

    function initDesktopControls() {
        const savedTheme = localStorage.getItem(COLOR_THEME_KEY) || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.body.setAttribute('data-theme', savedTheme);

        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.disabled = false;
            themeBtn.style.pointerEvents = 'auto';
            themeBtn.style.cursor = 'pointer';
            themeBtn.innerHTML = savedTheme === 'dark' ? SVG_ICONS.sun : SVG_ICONS.moon;
            themeBtn.onclick = function () {
                const isDark = document.body.getAttribute('data-theme') === 'dark';
                setTheme(isDark ? 'light' : 'dark');
                if (isDark) setActiveMobileBtns('mobileLight', 'mobileDark');
                else setActiveMobileBtns('mobileDark', 'mobileLight');
            };
        }

        const langBtn = document.getElementById('langToggle');
        const savedLang = localStorage.getItem('voiceLang') || 'id-ID';
        window.currentLang = savedLang;
        if (langBtn) {
            langBtn.textContent = savedLang === 'en-US' ? 'EN' : 'ID';
            langBtn.classList.add('active');
            langBtn.onclick = function () {
                const cur = localStorage.getItem('voiceLang') || 'id-ID';
                const next = cur === 'en-US' ? 'id-ID' : 'en-US';
                setLang(next);
                if (next === 'en-US') setActiveMobileBtns('mobileLangEN', 'mobileLangID');
                else setActiveMobileBtns('mobileLangID', 'mobileLangEN');
            };
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        injectAnimeThemeControl();
        const currentImageTheme = localStorage.getItem(IMAGE_THEME_KEY) || IMAGE_THEME_DEFAULT;
        applyImageTheme(currentImageTheme);
        applyThemeCopy(currentImageTheme);
        injectHamburger();
        initDesktopControls();
    });
})();

// Timezone-safe local date helpers (prevents UTC date shift before 07:00 WIB)
window.getLocalTodayStr = function (dateObj) {
    const d = dateObj instanceof Date ? dateObj : new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

window.parseLocalDate = function (dateStr) {
    if (!dateStr) return new Date(NaN);
    const parts = String(dateStr).split('-').map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(dateStr);
};

window.escapeHtml = function (str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

window.formatCurrencyInput = function (e) {
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
        if (newCursorPosition < 0) newCursorPosition = 0;
        input.setSelectionRange(newCursorPosition, newCursorPosition);
    } catch (err) {}
};

window.getUnformattedValue = function (elementId) {
    let el = document.getElementById(elementId);
    if (!el) return 0;
    return Number(el.value.replace(/[^0-9]/g, '')) || 0;
};

// ========== UNIVERSAL COMPACT MINI CALENDAR POPUP (BODY-MOUNTED TOP LAYER) ==========
(function () {
    const ID_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const ID_MONTHS_LONG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    let activeInputId = null;
    let activeTriggerEl = null;
    let activeOptions = { minToday: false, onSelect: null };
    let viewMonth = new Date().getMonth();
    let viewYear = new Date().getFullYear();

    function formatDisplayDate(dateStr) {
        if (!dateStr) return 'Pilih tanggal...';
        const d = window.parseLocalDate(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function updateTriggerLabel(inputId, dateStr) {
        const labelEl = document.getElementById(inputId + 'Label') ||
            (inputId === 'goalDeadline' ? document.getElementById('selectedDateLabel') : null);
        if (labelEl) {
            labelEl.textContent = formatDisplayDate(dateStr);
        }
    }

    function hookInputValueProperty(inputEl) {
        if (!inputEl || inputEl._datepickerHooked) return;
        const proto = Object.getPrototypeOf(inputEl);
        const desc = Object.getOwnPropertyDescriptor(proto, 'value');
        if (!desc || !desc.get || !desc.set) return;

        Object.defineProperty(inputEl, 'value', {
            get: function () {
                return desc.get.call(this);
            },
            set: function (val) {
                desc.set.call(this, val);
                updateTriggerLabel(this.id, val);
            }
        });
        inputEl._datepickerHooked = true;
        if (inputEl.value) {
            updateTriggerLabel(inputEl.id, inputEl.value);
        }
    }

    function ensureGlobalPopup() {
        let popup = document.getElementById('globalMiniCalendarPopup');
        if (popup) return popup;

        popup = document.createElement('div');
        popup.id = 'globalMiniCalendarPopup';
        popup.className = 'global-mini-calendar-popup';
        popup.addEventListener('click', function (e) {
            e.stopPropagation();
        });
        document.body.appendChild(popup);
        return popup;
    }

    function positionGlobalPopup() {
        const popup = document.getElementById('globalMiniCalendarPopup');
        if (!popup || !popup.classList.contains('open') || !activeTriggerEl) return;

        const rect = activeTriggerEl.getBoundingClientRect();
        const popupW = popup.offsetWidth || 224;
        const popupH = popup.offsetHeight || 230;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let top = rect.bottom + 5;
        if (top + popupH + 8 > vh && rect.top - popupH - 5 >= 8) {
            top = rect.top - popupH - 5;
        } else if (top + popupH + 8 > vh) {
            top = Math.max(8, vh - popupH - 8);
        }

        let left = rect.left;
        if (left + popupW + 8 > vw) {
            left = Math.max(8, vw - popupW - 8);
        }
        if (left < 8) left = 8;

        popup.style.top = `${Math.round(top)}px`;
        popup.style.left = `${Math.round(left)}px`;
    }

    function renderGlobalPopupContent() {
        const popup = ensureGlobalPopup();
        const inputEl = activeInputId ? document.getElementById(activeInputId) : null;
        const selectedVal = inputEl ? inputEl.value : '';
        const minToday = Boolean(activeOptions && activeOptions.minToday);

        const now = new Date();
        const curY = now.getFullYear();
        const minYear = minToday ? curY : curY - 5;
        const maxYear = minToday ? curY + 10 : curY + 3;

        const yearOptions = [];
        for (let y = minYear; y <= maxYear; y++) {
            yearOptions.push(`<option value="${y}" ${y === viewYear ? 'selected' : ''}>${y}</option>`);
        }

        const monthOptions = ID_MONTHS_SHORT.map((m, idx) =>
            `<option value="${idx}" ${idx === viewMonth ? 'selected' : ''}>${m}</option>`
        ).join('');

        const presetsHtml = minToday
            ? `
                <button type="button" class="cal-preset-btn" data-preset="30">+1 Bln</button>
                <button type="button" class="cal-preset-btn" data-preset="90">+3 Bln</button>
                <button type="button" class="cal-preset-btn" data-preset="180">+6 Bln</button>
                <button type="button" class="cal-preset-btn" data-preset="365">+1 Thn</button>
            `
            : `
                <button type="button" class="cal-preset-btn" data-preset="0">Hari Ini</button>
                <button type="button" class="cal-preset-btn" data-preset="-1">Kemarin</button>
                <button type="button" class="cal-preset-btn" data-preset="-2">-2 Hari</button>
                <button type="button" class="cal-preset-btn" data-preset="first">Awal Bln</button>
            `;

        const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const todayIso = window.getLocalTodayStr(now);

        let daysHtml = '';
        for (let i = 0; i < firstDayOfWeek; i++) {
            daysHtml += `<div class="cal-day empty"></div>`;
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const mm = String(viewMonth + 1).padStart(2, '0');
            const dd = String(day).padStart(2, '0');
            const iso = `${viewYear}-${mm}-${dd}`;
            const cellTime = new Date(viewYear, viewMonth, day).getTime();

            const isPast = minToday && cellTime < todayZero;
            const isToday = iso === todayIso;
            const isSelected = iso === selectedVal;

            const cls = ['cal-day'];
            if (isPast) cls.push('past');
            if (isToday) cls.push('today');
            if (isSelected) cls.push('selected');

            daysHtml += `<div class="${cls.join(' ')}" ${isPast ? '' : `data-date="${iso}"`}>${day}</div>`;
        }

        popup.innerHTML = `
            <div class="cal-quick-presets">${presetsHtml}</div>
            <div class="calendar-top-bar">
                <button type="button" class="cal-nav-btn" id="gCalPrevBtn" title="Bulan sebelumnya">‹</button>
                <div class="cal-month-year-selects">
                    <select id="gCalMonthSelect">${monthOptions}</select>
                    <select id="gCalYearSelect">${yearOptions}</select>
                </div>
                <button type="button" class="cal-nav-btn" id="gCalNextBtn" title="Bulan berikutnya">›</button>
            </div>
            <div class="cal-weekdays">
                <span>Min</span><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span>
            </div>
            <div class="cal-days-grid">${daysHtml}</div>
        `;

        // Bind events inside popup
        popup.querySelectorAll('.cal-preset-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const p = this.getAttribute('data-preset');
                const d = new Date();
                if (p === 'first') {
                    d.setDate(1);
                } else {
                    d.setDate(d.getDate() + Number(p));
                }
                const iso = window.getLocalTodayStr(d);
                window.setDatePickerValue(activeInputId, iso, true);
                closeMiniCalendar();
            });
        });

        const prevBtn = popup.querySelector('#gCalPrevBtn');
        const nextBtn = popup.querySelector('#gCalNextBtn');
        const mSel = popup.querySelector('#gCalMonthSelect');
        const ySel = popup.querySelector('#gCalYearSelect');

        if (prevBtn) {
            prevBtn.addEventListener('click', function () {
                viewMonth--;
                if (viewMonth < 0) { viewMonth = 11; viewYear--; }
                if (minToday && viewYear < curY) { viewYear = curY; viewMonth = now.getMonth(); }
                renderGlobalPopupContent();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                viewMonth++;
                if (viewMonth > 11) { viewMonth = 0; viewYear++; }
                renderGlobalPopupContent();
            });
        }
        if (mSel) {
            mSel.addEventListener('change', function () {
                viewMonth = parseInt(this.value, 10);
                renderGlobalPopupContent();
            });
        }
        if (ySel) {
            ySel.addEventListener('change', function () {
                viewYear = parseInt(this.value, 10);
                renderGlobalPopupContent();
            });
        }

        popup.querySelectorAll('.cal-day[data-date]').forEach(cell => {
            cell.addEventListener('click', function () {
                const iso = this.getAttribute('data-date');
                window.setDatePickerValue(activeInputId, iso, true);
                closeMiniCalendar();
            });
        });
    }

    window.setDatePickerValue = function (inputId, dateStr, fireEvents = true) {
        const inputEl = document.getElementById(inputId);
        if (inputEl) {
            hookInputValueProperty(inputEl);
            inputEl.value = dateStr;
            if (fireEvents) {
                inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                inputEl.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
        updateTriggerLabel(inputId, dateStr);
        if (inputId === 'goalDeadline' && typeof window.updateCalendarPlanPreview === 'function') {
            window.updateCalendarPlanPreview();
        }
    };

    window.toggleMiniCalendar = function (event, inputId, options) {
        if (event) event.stopPropagation();
        const popup = ensureGlobalPopup();
        const triggerEl = (event && event.currentTarget) || document.getElementById(inputId + 'Trigger') || document.getElementById('goalDeadlineTrigger');

        if (popup.classList.contains('open') && activeInputId === inputId) {
            closeMiniCalendar();
            return;
        }

        document.querySelectorAll('.datepicker-trigger.open').forEach(el => el.classList.remove('open'));
        activeInputId = inputId;
        activeTriggerEl = triggerEl;
        activeOptions = options || { minToday: inputId === 'goalDeadline' };

        const inputEl = document.getElementById(inputId);
        if (inputEl) hookInputValueProperty(inputEl);

        const curVal = inputEl && inputEl.value ? window.parseLocalDate(inputEl.value) : new Date();
        const baseDate = isNaN(curVal.getTime()) ? new Date() : curVal;
        viewMonth = baseDate.getMonth();
        viewYear = baseDate.getFullYear();

        renderGlobalPopupContent();
        popup.classList.add('open');
        if (activeTriggerEl) activeTriggerEl.classList.add('open');
        positionGlobalPopup();
    };

    function closeMiniCalendar() {
        const popup = document.getElementById('globalMiniCalendarPopup');
        if (popup) popup.classList.remove('open');
        document.querySelectorAll('.datepicker-trigger.open').forEach(el => el.classList.remove('open'));
        activeInputId = null;
        activeTriggerEl = null;
    }

    window.closeMiniCalendar = closeMiniCalendar;

    document.addEventListener('click', function (e) {
        const popup = document.getElementById('globalMiniCalendarPopup');
        if (!popup || !popup.classList.contains('open')) return;
        if (popup.contains(e.target)) return;
        if (activeTriggerEl && activeTriggerEl.contains(e.target)) return;
        closeMiniCalendar();
    });

    window.addEventListener('scroll', positionGlobalPopup, true);
    window.addEventListener('resize', positionGlobalPopup);

    document.addEventListener('DOMContentLoaded', function () {
        ['date', 'editDate', 'goalDeadline'].forEach(id => {
            const el = document.getElementById(id);
            if (el) hookInputValueProperty(el);
        });
    });
})();

// ========== PROGRESSIVE WEB APP (PWA) SERVICE WORKER & INSTALL CONTROLLER ==========
(function () {
    let deferredInstallPrompt = null;

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('./sw.js').then(function (registration) {
                console.log('[PWA] Service Worker registered with scope:', registration.scope);
            }).catch(function (error) {
                console.warn('[PWA] Service Worker registration failed:', error);
            });
        });
    }

    // Capture install prompt for Android/Desktop Chrome
    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        deferredInstallPrompt = e;
        document.querySelectorAll('.install-app-btn').forEach(function (btn) {
            btn.style.display = 'inline-flex';
        });
    });

    window.addEventListener('appinstalled', function () {
        deferredInstallPrompt = null;
        document.querySelectorAll('.install-app-btn').forEach(function (btn) {
            btn.style.display = 'none';
        });
        console.log('[PWA] App successfully installed!');
    });

    window.triggerPwaInstall = function () {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            deferredInstallPrompt.userChoice.then(function (choice) {
                if (choice.outcome === 'accepted') {
                    console.log('[PWA] User accepted installation prompt');
                }
                deferredInstallPrompt = null;
            });
        } else {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            if (isIOS) {
                alert('Cara Install di iPhone / iPad:\n1. Tekan tombol Bagikan (Share) di Safari bawah (ikon kotak panah ke atas).\n2. Gulir ke bawah lalu pilih "Tambahkan ke Layar Utama" (Add to Home Screen).');
            } else {
                alert('Aplikasi siap di-install!\n\nDi Browser HP (Chrome / Samsung Internet / Edge):\nTekan menu titik tiga (⋮) di pojok kanan atas browser, lalu pilih "Install Aplikasi" atau "Tambahkan ke Layar Utama".');
            }
        }
    };

    // Ensure initial theme synchronizes to Android Home Screen Widget in real time
    [100, 400, 1000, 2500].forEach(function (delay) {
        setTimeout(function () {
            if (typeof window.syncThemeToAndroidWidget === 'function') {
                window.syncThemeToAndroidWidget();
            }
        }, delay);
    });
})();
