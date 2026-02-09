// ========== VOICE PARSER ==========
class BilingualParser {
    constructor() {
        this.multipliers = {
            'k': 1000, 'rb': 1000, 'ribu': 1000, 'rebu': 1000,
            'thousand': 1000, 'juta': 1000000, 'jt': 1000000, 'million': 1000000
        };

        this.spokenNumbers = {
            'nol': 0, 'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4,
            'lima': 5, 'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9,
            'sepuluh': 10, 'sebelas': 11, 'dua belas': 12, 'tiga belas': 13,
            'empat belas': 14, 'lima belas': 15, 'enam belas': 16,
            'tujuh belas': 17, 'delapan belas': 18, 'sembilan belas': 19,
            'dua puluh': 20, 'tiga puluh': 30, 'empat puluh': 40, 
            'lima puluh': 50, 'enam puluh': 60, 'tujuh puluh': 70,
            'delapan puluh': 80, 'sembilan puluh': 90,
            'seratus': 100, 'dua ratus': 200, 'tiga ratus': 300,
            'empat ratus': 400, 'lima ratus': 500,
            'seribu': 1000, 'sejuta': 1000000
        };

        this.englishNumbers = {
            'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
            'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
            'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
            'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
            'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30,
            'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
            'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000
        };

        this.itemCategories = {
            'bread': 'food', 'roti': 'food', 'coffee': 'food', 'kopi': 'food',
            'tea': 'food', 'teh': 'food', 'lunch': 'food', 'makan': 'food',
            'dinner': 'food', 'breakfast': 'food', 'sarapan': 'food',
            'pizza': 'food', 'burger': 'food', 'sandwich': 'food',
            'nasi': 'food', 'mie': 'food', 'bakso': 'food', 'soto': 'food',
            'jajan': 'food', 'warteg': 'food', 'padang': 'food', 'indomie': 'food',
            'nasi goreng': 'food', 'mie goreng': 'food', 'mie ayam': 'food',
            'sate': 'food', 'ayam goreng': 'food', 'ayam bakar': 'food',
            'rendang': 'food', 'pecel': 'food', 'rawon': 'food',
            'gado gado': 'food', 'gado-gado': 'food', 'dimsum': 'food',
            'ice cream': 'food', 'es krim': 'food', 'permen': 'food', 'coklat': 'food',
            'keripik': 'food', 'kentang goreng': 'food', 'donat': 'food',
            'martabak manis': 'food', 'martabak telur': 'food',
            'siomay': 'food', 'batagor': 'food', 'cilok': 'food', 'cireng': 'food',
            'sosis': 'food', 'nugget': 'food',
            'roti tawar': 'food', 'roti bakar': 'food', 'croissant': 'food',
            'cake': 'food', 'brownies': 'food', 'cupcake': 'food',
            'kue lapis': 'food', 'kue bolu': 'food',
            'es teh': 'food', 'es jeruk': 'food', 'susu': 'food',
            'milkshake': 'food', 'jus buah': 'food', 'jus': 'food',
            'teh botol': 'food', 'teh botol sosro': 'food',
            'aqua': 'food', 'le minerale': 'food', 'cleo': 'food', 'vit': 'food',
            'ades': 'food', 'teh pucuk harum': 'food', 'teh kotak': 'food',
            'frestea': 'food', 'nu green tea': 'food',
            'coca cola': 'food', 'coca-cola': 'food', 'fanta': 'food',
            'sprite': 'food', 'pepsi': 'food',
            'pocari sweat': 'food', 'mizone': 'food', 'isoplus': 'food',
            'floridina': 'food', 'pulpy orange': 'food', 'buavita': 'food',
            'ultra milk': 'food', 'ultramilk': 'food', 'indomilk': 'food',
            'bear brand': 'food', 'cimory': 'food',
            'good day': 'food', 'kapal api': 'food', 'torabika': 'food',
            'abc coffee': 'food', 'nescafe': 'food',
            'kopi kenangan': 'food', 'janji jiwa': 'food', 'fore coffee': 'food',
            'tuku': 'food', 'point coffee': 'food', 'starbucks': 'food',
            'chatime': 'food', 'mixue': 'food', 'haus': 'food', 'haus!': 'food',
            'kopi soe': 'food',
            'energen': 'food', 'milo': 'food', 'ovaltine': 'food',
            'nutrisari': 'food', 'jasjus': 'food', 'pop ice': 'food',
            'gas': 'transport', 'bensin': 'transport', 'fuel': 'transport',
            'taxi': 'transport', 'grab': 'transport', 'gojek': 'transport',
            'ojek': 'transport', 'ojol': 'transport', 'parkir': 'transport',
            'parking': 'transport', 'tol': 'transport', 'toll': 'transport',
            'rent': 'bills', 'kos': 'bills', 'electricity': 'bills', 
            'listrik': 'bills', 'internet': 'bills', 'wifi': 'bills',
            'pulsa': 'bills', 'phone': 'bills', 'water': 'bills', 'air': 'bills',
            'book': 'study', 'buku': 'study', 'textbook': 'study',
            'course': 'study', 'kursus': 'study', 'kuliah': 'study',
            'print': 'study', 'fotokopi': 'study',
            'pensil': 'study', 'pencil': 'study', 'penghapus': 'study', 'eraser': 'study',
            'pulpen': 'study', 'pen': 'study', 'bolpoin': 'study',
            'spidol': 'study', 'marker': 'study', 'stabilo': 'study',
            'penggaris': 'study', 'ruler': 'study',
            'kertas': 'study', 'paper': 'study',
            'notebook': 'study', 'binder': 'study',
            'movie': 'entertainment', 'bioskop': 'entertainment',
            'cinema': 'entertainment', 'game': 'entertainment',
            'netflix': 'entertainment', 'spotify': 'entertainment',
            'karaoke': 'entertainment', 'nonton': 'entertainment',
            'clothes': 'shopping', 'baju': 'shopping', 'shirt': 'shopping',
            'shoes': 'shopping', 'sepatu': 'shopping', 'bag': 'shopping',
            'cosmetics': 'shopping', 'kosmetik': 'shopping',
            'medicine': 'health', 'obat': 'health', 'doctor': 'health',
            'dokter': 'health', 'hospital': 'health', 'clinic': 'health'
        };

        this.entertainmentKeywords = [
            // Musik & Konser
            'konser', 'tiket konser', 'gig', 'festival', 'musik', 'nonton band', 'live music', 'tiket event',
            // Game & Digital Entertainment
            'top up game', 'topup game', 'diamond', 'uc', 'voucher game', 'gacha', 'skin', 'battle pass',
            'steam', 'playstation', 'ps store', 'xbox',
            // Film & Streaming
            'nonton', 'bioskop', 'cinema', 'cgv', 'xxi', 'netflix', 'disney', 'prime video', 'langganan film',
            // Jalan-jalan & Rekreasi
            'jalan jalan', 'jalan-jalan', 'liburan', 'traveling', 'wisata', 'piknik', 'staycation',
            'tiket masuk', 'tempat wisata', 'pantai', 'gunung',
            // Nongkrong & Hangout
            'nongkrong', 'ngopi', 'cafe', 'hangout',
            // Hiburan Umum
            'hiburan', 'refreshing', 'fun', 'senang senang'
        ];

        this.studyKeywordsStrong = [
            'buku', 'beli buku', 'ebook', 'novel', 'modul', 'materi', 'diktat', 'buku tulis',
            'fotokopi', 'print', 'cetak',
            'pensil', 'pulpen', 'pena', 'penghapus', 'penggaris', 'stabilo', 'spidol', 'buku catatan', 'notes',
            'les', 'bimbel', 'kursus', 'tutoring', 'privat', 'kelas', 'workshop', 'pelatihan', 'bootcamp',
            'ai', 'chatgpt', 'langganan ai', 'tools ai', 'software', 'aplikasi belajar',
            'coursera', 'udemy', 'skillshare',
            'sekolah', 'kuliah', 'kampus', 'spp', 'uang sekolah', 'uang kuliah', 'semester',
            'ujian', 'pendaftaran', 'administrasi',
            'belajar', 'study', 'pendidikan', 'edukasi', 'akademik'
        ];

        this.studyKeywordsWeak = [
            'premium', 'pro', 'subscription'
        ];

        this.studyWeakAnchors = [
            'ai', 'chatgpt', 'coursera', 'udemy', 'skillshare',
            'belajar', 'study', 'pendidikan', 'edukasi',
            'kursus', 'les', 'bimbel', 'kuliah', 'sekolah', 'kampus'
        ];

        this.shoppingKeywordsStrong = [
            'baju', 'pakaian', 'kaos', 'kemeja', 'celana', 'jaket', 'hoodie',
            'sepatu', 'sandal', 'tas', 'topi', 'jam', 'aksesoris',
            'skincare', 'sabun', 'sampo', 'shampoo', 'pasta gigi', 'deodorant',
            'parfum', 'kosmetik', 'make up', 'lotion', 'bodycare',
            'belanja', 'shopping', 'beli barang', 'checkout', 'cart', 'keranjang',
            'tokopedia', 'shopee', 'lazada', 'tiktok shop', 'marketplace',
            'hp', 'handphone', 'smartphone', 'laptop', 'mouse', 'keyboard',
            'headset', 'earphone', 'charger', 'powerbank', 'elektronik'
        ];

        this.shoppingKeywordsWeak = [
            'barang', 'kebutuhan', 'beli'
        ];

        this.shoppingWeakAnchors = [
            'barang', 'kebutuhan', 'shopping', 'belanja', 'beli barang',
            'checkout', 'cart', 'keranjang',
            'tokopedia', 'shopee', 'lazada', 'tiktok shop', 'marketplace'
        ];

        this.healthKeywordsStrong = [
            'obat', 'apotek', 'vitamin', 'suplemen', 'tablet', 'kapsul', 'sirup',
            'antibiotik', 'jamu', 'herbal',
            'dokter', 'klinik', 'rumah sakit', 'rs', 'cek kesehatan', 'check up',
            'medical check up', 'lab', 'tes darah', 'rapid', 'swab',
            'gym', 'fitness', 'olahraga', 'workout', 'yoga', 'pilates', 'zumba',
            'lari', 'sepeda', 'renang',
            'terapi', 'konseling', 'psikolog', 'mental', 'meditasi', 'healing',
            'relaksasi', 'spa', 'pijat',
            'sehat', 'kesehatan', 'wellness'
        ];

        this.incomeKeywords = [
            'income', 'got', 'receive', 'received', 'earn', 'earned',
            'salary', 'wage', 'paid', 'payment', 'allowance', 'freelance',
            'terima', 'dapat', 'dapet', 'masuk', 'gaji', 'bayaran',
            'honor', 'uang', 'kiriman', 'transfer'
        ];

        this.timeRefs = {
            today: ['today', 'hari ini', 'tadi', 'barusan', 'this morning'],
            yesterday: ['yesterday', 'kemarin', 'kemaren', 'last night']
        };
    }

    parseNumericToken(token) {
        const t = String(token);
        if (/^\d{1,3}(?:[.,]\d{3})+$/.test(t)) {
            const num = parseInt(t.replace(/[.,]/g, ''), 10);
            return Number.isNaN(num) ? null : num;
        }

        if (/^\d+(?:[.,]\d+)?$/.test(t)) {
            const num = parseFloat(t.replace(',', '.'));
            return Number.isNaN(num) ? null : num;
        }

        return null;
    }

    escapeRegex(str) {
        return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    keywordMatches(text, kw) {
        if (!kw) return false;
        const k = String(kw).toLowerCase().trim();
        if (!k) return false;

        if (k.includes(' ')) {
            return text.includes(k);
        }

        const escaped = this.escapeRegex(k);
        const direct = new RegExp('\\b' + escaped + '\\b', 'i');
        if (direct.test(text)) return true;

        const prefixes = ['nge', 'ng', 'me', 'mem', 'men', 'meng', 'meny', 'di', 'ke', 'ter', 'ber', 'pe', 'per', 'pem', 'pen', 'peng', 'peny'];
        const prefixed = new RegExp('\\b(?:' + prefixes.join('|') + ')' + escaped + '\\b', 'i');
        if (prefixed.test(text)) return true;

        const suffixes = ['nya', 'in'];
        const suffixed = new RegExp('\\b' + escaped + '(?:' + suffixes.join('|') + ')?\\b', 'i');
        return suffixed.test(text);
    }

    findBestSpokenNumberMatch(text, map) {
        const entries = Object.entries(map)
            .sort((a, b) => b[0].length - a[0].length);

        for (const [spoken, value] of entries) {
            const escaped = this.escapeRegex(spoken).replace(/\s+/g, '\\s+');
            const re = new RegExp('\\b' + escaped + '\\b', 'i');
            if (re.test(text)) return value;
        }

        return null;
    }

    parse(text) {
        const lower = text.toLowerCase().trim();
        return {
            original: text,
            amount: this.extractAmount(lower),
            type: this.detectType(lower),
            category: this.detectCategory(lower),
            date: this.extractDate(lower),
            description: this.extractDescription(text)
        };
    }

    extractAmount(text) {
        const normalizedText = String(text)
            .replace(/(\d)([a-zA-Z])/g, '$1 $2')
            .replace(/([a-zA-Z])(\d)/g, '$1 $2')
            .replace(/\s+/g, ' ')
            .trim();

        const t = normalizedText;
        const spacedGroupingPattern = /\b\d{1,3}(?:\s+\d{3})+\b/;
        const spacedGroupingMatch = t.match(spacedGroupingPattern);
        if (spacedGroupingMatch) {
            const num = parseInt(spacedGroupingMatch[0].replace(/\s+/g, ''), 10);
            if (!Number.isNaN(num) && num > 0) return num;
        }

        const multiMultPattern = /(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|rebu|thousand|juta|jt|million)\b/gi;
        let multiMatch;
        let sum = 0;
        let multiFound = false;
        while ((multiMatch = multiMultPattern.exec(t)) !== null) {
            const num = parseFloat(String(multiMatch[1]).replace(',', '.'));
            const mult = String(multiMatch[2] || '').toLowerCase();
            if (Number.isNaN(num)) continue;
            const factor = this.multipliers[mult];
            if (!factor) continue;
            sum += num * factor;
            multiFound = true;
        }

        const fromWords = this.extractAmountFromWords(t);
        if (fromWords > 0) {
            if (multiFound && sum > 0) return Math.round(Math.max(sum, fromWords));
            return fromWords;
        }

        if (multiFound && sum > 0) return Math.round(sum);

        const idBaseValue = this.findBestSpokenNumberMatch(t, this.spokenNumbers);
        if (idBaseValue !== null) {
            if (/\b(ribu|rb|rebu)\b/i.test(t)) return idBaseValue * 1000;
            if (/\b(juta|jt)\b/i.test(t)) return idBaseValue * 1000000;
            if (idBaseValue >= 1000) return idBaseValue;
        }

        const enBaseValue = this.findBestSpokenNumberMatch(t, this.englishNumbers);
        if (enBaseValue !== null) {
            if (/\b(thousand|k)\b/i.test(t)) return enBaseValue * 1000;
            if (/\bmillion\b/i.test(t)) return enBaseValue * 1000000;
            if (enBaseValue >= 1000) return enBaseValue;
        }

        const multPattern = /(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|rebu|thousand|juta|jt|million)/i;
        let match = t.match(multPattern);
        if (match) {
            const num = parseFloat(match[1].replace(',', '.'));
            const mult = match[2].toLowerCase();
            for (const [key, val] of Object.entries(this.multipliers)) {
                if (mult === key || mult.startsWith(key)) return Math.round(num * val);
            }
        }

        const plainPattern = /\d{1,3}(?:[.,]\d{3})+|\d{4,}/;
        match = t.match(plainPattern);
        if (match) return parseInt(match[0].replace(/[.,]/g, ''));

        const smallNumPattern = /\b(\d+)\b/;
        match = t.match(smallNumPattern);
        if (match) {
            const num = parseInt(match[1]);
            if (num < 100 && /\b(ribu|rb|k|thousand)\b/i.test(t)) return num * 1000;
            return num;
        }

        return 0;
    }

    extractAmountFromWords(text) {
        const cleaned = text
            .toLowerCase()
            .replace(/[^a-z0-9\s.,]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const tokens = cleaned.split(' ').filter(Boolean);
        let best = 0;
        let seq = [];

        const flush = () => {
            if (seq.length === 0) return;
            const valId = this.parseIndonesianNumberTokens(seq);
            const valEn = this.parseEnglishNumberTokens(seq);
            best = Math.max(best, valId, valEn);
            seq = [];
        };

        for (const t of tokens) {
            if (this.isNumberRelatedToken(t)) {
                seq.push(t);
            } else {
                flush();
            }
        }
        flush();

        return best;
    }

    isNumberRelatedToken(t) {
        if (!t) return false;
        if (/^\d{1,3}(?:[.,]\d{3})+$/.test(t)) return true;
        if (/^\d+(?:[.,]\d+)?$/.test(t)) return true;
        if (t === 'dan' || t === 'and') return true;
        if (t === 'belas' || t === 'puluh' || t === 'ratus') return true;
        if (t === 'ribu' || t === 'rb' || t === 'rebu') return true;
        if (t === 'juta' || t === 'jt' || t === 'million') return true;
        if (t === 'thousand' || t === 'hundred' || t === 'k') return true;
        if (t === 'sepuluh' || t === 'sebelas' || t === 'seratus' || t === 'seribu' || t === 'sejuta') return true;
        if (Object.prototype.hasOwnProperty.call(this.spokenNumbers, t)) return true;
        if (Object.prototype.hasOwnProperty.call(this.englishNumbers, t)) return true;
        return false;
    }

    detectShopping(text) {
        for (const kw of this.shoppingKeywordsStrong) {
            if (!kw) continue;
            if (this.keywordMatches(text, kw)) return true;
        }

        let hasWeak = false;
        for (const kw of this.shoppingKeywordsWeak) {
            if (!kw) continue;
            if (this.keywordMatches(text, kw)) {
                hasWeak = true;
                break;
            }
        }
        if (!hasWeak) return false;

        for (const a of this.shoppingWeakAnchors) {
            if (!a) continue;
            if (this.keywordMatches(text, a)) return true;
        }

        return false;
    }

    detectHealth(text) {
        for (const kw of this.healthKeywordsStrong) {
            if (!kw) continue;
            if (this.keywordMatches(text, kw)) return true;
        }
        return false;
    }

    parseIndonesianNumberTokens(tokens) {
        const unit = {
            nol: 0, satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, delapan: 8, sembilan: 9
        };

        let total = 0;
        let current = 0;
        let seen = false;

        const applyScale = (scale) => {
            const base = current || 1;
            total += base * scale;
            current = 0;
        };

        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];
            if (t === 'dan') continue;

            const numeric = this.parseNumericToken(t);
            if (numeric !== null) {
                current += numeric;
                seen = true;
                continue;
            }

            if (t === 'sepuluh') { current += 10; seen = true; continue; }
            if (t === 'sebelas') { current += 11; seen = true; continue; }
            if (t === 'seratus') { current += 100; seen = true; continue; }
            if (t === 'seribu') { applyScale(1000); seen = true; continue; }
            if (t === 'sejuta') { applyScale(1000000); seen = true; continue; }

            if (Object.prototype.hasOwnProperty.call(unit, t)) {
                current += unit[t];
                seen = true;
                continue;
            }

            if (t === 'belas') {
                if (current === 0) current = 10;
                else current = current + 10;
                seen = true;
                continue;
            }

            if (t === 'puluh') {
                current = (current || 1) * 10;
                seen = true;
                continue;
            }

            if (t === 'ratus') {
                current = (current || 1) * 100;
                seen = true;
                continue;
            }

            if (t === 'ribu' || t === 'rb' || t === 'rebu') {
                applyScale(1000);
                seen = true;
                continue;
            }

            if (t === 'juta' || t === 'jt') {
                applyScale(1000000);
                seen = true;
                continue;
            }
        }

        const value = total + current;
        return seen ? value : 0;
    }

    parseEnglishNumberTokens(tokens) {
        const unit = {
            zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
            ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
            seventeen: 17, eighteen: 18, nineteen: 19
        };
        const tens = {
            twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90
        };

        let total = 0;
        let current = 0;
        let seen = false;

        const applyScale = (scale) => {
            const base = current || 1;
            total += base * scale;
            current = 0;
        };

        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];
            if (t === 'and') continue;

            const numeric = this.parseNumericToken(t);
            if (numeric !== null) {
                current += numeric;
                seen = true;
                continue;
            }

            if (Object.prototype.hasOwnProperty.call(unit, t)) {
                current += unit[t];
                seen = true;
                continue;
            }

            if (Object.prototype.hasOwnProperty.call(tens, t)) {
                current += tens[t];
                seen = true;
                continue;
            }

            if (t === 'hundred') {
                current = (current || 1) * 100;
                seen = true;
                continue;
            }

            if (t === 'thousand' || t === 'k') {
                applyScale(1000);
                seen = true;
                continue;
            }

            if (t === 'million') {
                applyScale(1000000);
                seen = true;
                continue;
            }
        }

        const value = total + current;
        return seen ? value : 0;
    }

    detectType(text) {
        for (const keyword of this.incomeKeywords) {
            if (text.includes(keyword)) return 'income';
        }
        return 'expense';
    }

    detectCategory(text) {
        if (this.detectEntertainment(text)) return 'entertainment';
        if (this.detectStudy(text)) return 'study';
        if (this.detectHealth(text)) return 'health';
        if (this.detectShopping(text)) return 'shopping';
        for (const [item, category] of Object.entries(this.itemCategories)) {
            if (item.includes(' ')) {
                if (text.includes(item)) return category;
            } else {
                const regex = new RegExp('\\b' + item + '\\b', 'i');
                if (regex.test(text)) return category;
            }
        }
        return 'other';
    }

    detectEntertainment(text) {
        for (const kw of this.entertainmentKeywords) {
            if (!kw) continue;
            if (this.keywordMatches(text, kw)) return true;
        }
        return false;
    }

    detectStudy(text) {
        for (const kw of this.studyKeywordsStrong) {
            if (!kw) continue;
            if (this.keywordMatches(text, kw)) return true;
        }

        let hasWeak = false;
        for (const kw of this.studyKeywordsWeak) {
            if (!kw) continue;
            if (this.keywordMatches(text, kw)) {
                hasWeak = true;
                break;
            }
        }
        if (!hasWeak) return false;

        for (const a of this.studyWeakAnchors) {
            if (!a) continue;
            if (this.keywordMatches(text, a)) return true;
        }

        return false;
    }

    extractDate(text) {
        const today = new Date();
        for (const [ref, keywords] of Object.entries(this.timeRefs)) {
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    if (ref === 'yesterday') {
                        const yesterday = new Date(today);
                        yesterday.setDate(today.getDate() - 1);
                        return yesterday.toISOString().split('T')[0];
                    }
                    return today.toISOString().split('T')[0];
                }
            }
        }
        return today.toISOString().split('T')[0];
    }

    extractDescription(text) {
        let clean = text;
        clean = clean.replace(/\d+(?:[.,]\d+)?\s*(k|rb|ribu|thousand|juta|jt|million)/gi, '');
        clean = clean.replace(/\b\d{4,}\b/g, '');
        clean = clean.replace(/\b(today|yesterday|hari ini|kemarin|tadi|barusan)\b/gi, '');
        const spokenNumbersPattern = /\b(nol|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|belas|puluh|ratus|seribu|sejuta)\b/gi;
        clean = clean.replace(spokenNumbersPattern, '');
        const englishNumbersPattern = /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million)\b/gi;
        clean = clean.replace(englishNumbersPattern, '');
        clean = clean.replace(/\s+/g, ' ').trim();
        if (clean.length < 3) return text;
        return clean;
    }
}

const parser = new BilingualParser();
