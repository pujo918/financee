// ========== VOICE PARSER (BILINGUAL ID / EN) ==========
class BilingualParser {
    constructor() {
        this.multipliers = {
            'k': 1000, 'rb': 1000, 'ribu': 1000, 'rebu': 1000, 'thousand': 1000, 'bucks': 1000,
            'juta': 1000000, 'jt': 1000000, 'million': 1000000, 'mil': 1000000,
            'miliar': 1000000000, 'milyar': 1000000000, 'billion': 1000000000
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
            'seribu': 1000, 'sejuta': 1000000, 'semiliar': 1000000000,
            // Slang Indonesian Numbers
            'seceng': 1000, 'noceng': 2000, 'goceng': 5000, 'ceban': 10000,
            'capceng': 10000, 'noban': 20000, 'goban': 50000, 'cepek': 100,
            'gopek': 500, 'gocap': 50, 'cepek ceng': 100000, 'cepek ribu': 100000,
            'gopek ceng': 500000, 'gopek ribu': 500000, 'sejutaan': 1000000, 'seribuan': 1000
        };

        this.englishNumbers = {
            'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
            'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
            'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
            'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
            'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30,
            'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
            'eighty': 80, 'ninety': 90, 'hundred': 100,
            'thousand': 1000, 'million': 1000000, 'billion': 1000000000
        };

        this.entertainmentKeywords = [
            // Music & Concerts
            'konser', 'tiket konser', 'gig', 'festival', 'musik', 'music', 'live music', 'concert', 'band',
            // Gaming & Digital
            'game', 'gaming', 'top up game', 'topup game', 'diamond', 'uc', 'voucher game', 'gacha', 'skin', 'battle pass',
            'steam', 'playstation', 'ps store', 'ps5', 'ps4', 'xbox', 'nintendo', 'switch', 'mobile legends', 'free fire', 'pubg', 'valorant',
            // Movies & Streaming
            'nonton', 'bioskop', 'cinema', 'cgv', 'xxi', 'cinepolis', 'movie', 'film', 'theater', 'netflix', 'disney', 'prime video', 'hbo', 'spotify', 'apple music', 'youtube premium', 'streaming',
            // Leisure & Vacations
            'jalan jalan', 'jalan-jalan', 'liburan', 'traveling', 'travel', 'wisata', 'piknik', 'picnic', 'staycation',
            'tiket masuk', 'tempat wisata', 'pantai', 'beach', 'gunung', 'resort', 'hotel', 'villa', 'amusement park', 'dufan', 'theme park', 'sightseeing', 'holiday',
            // General Fun
            'hiburan', 'refreshing', 'fun', 'senang senang', 'party', 'clubbing', 'karaoke', 'arcade', 'billiard', 'bowling'
        ];

        this.studyKeywordsStrong = [
            // Books & Supplies
            'buku', 'beli buku', 'ebook', 'novel', 'modul', 'materi', 'diktat', 'buku tulis', 'textbook', 'book', 'stationery',
            'fotokopi', 'print', 'cetak', 'printing', 'photocopy',
            'pensil', 'pencil', 'pulpen', 'pen', 'pena', 'penghapus', 'eraser', 'penggaris', 'ruler', 'stabilo', 'highlighter', 'spidol', 'marker', 'buku catatan', 'notebook', 'binder', 'kertas', 'paper',
            // Courses & Learning
            'les', 'bimbel', 'kursus', 'tutoring', 'privat', 'kelas', 'class', 'course', 'workshop', 'pelatihan', 'training', 'bootcamp', 'seminar', 'webinar', 'sertifikasi', 'certification',
            // Tech & AI Tools
            'ai', 'chatgpt', 'openai', 'gemini', 'claude', 'langganan ai', 'tools ai', 'software', 'aplikasi belajar', 'license', 'software license',
            'coursera', 'udemy', 'skillshare', 'edx', 'duolingo',
            // Academic
            'sekolah', 'school', 'kuliah', 'college', 'kampus', 'campus', 'university', 'spp', 'uang sekolah', 'uang kuliah', 'tuition', 'tuition fee', 'semester', 'ukt',
            'ujian', 'exam', 'exam fee', 'pendaftaran', 'registration', 'administrasi',
            'belajar', 'study', 'studying', 'pendidikan', 'education', 'edukasi', 'akademik', 'academic'
        ];

        this.shoppingKeywordsStrong = [
            // Apparel & Footwear
            'baju', 'pakaian', 'clothes', 'clothing', 'kaos', 't-shirt', 'kemeja', 'shirt', 'celana', 'pants', 'trousers', 'jeans', 'jaket', 'jacket', 'hoodie', 'sweater', 'coat', 'dress', 'skirt', 'rok', 'gamis', 'hijab',
            'sepatu', 'shoes', 'sneakers', 'boots', 'sandal', 'sandals', 'slippers', 'tas', 'bag', 'backpack', 'handbag', 'tote bag', 'dompet', 'wallet', 'topi', 'hat', 'cap', 'jam tangan', 'watch', 'aksesoris', 'accessories', 'sunglasses', 'kacamata',
            // Personal Care & Beauty
            'skincare', 'sabun', 'soap', 'body wash', 'sampo', 'shampoo', 'pasta gigi', 'toothpaste', 'deodorant',
            'parfum', 'perfume', 'cologne', 'fragrance', 'kosmetik', 'cosmetics', 'make up', 'makeup', 'lipstick', 'lotion', 'bodycare', 'sunscreen', 'moisturizer',
            // Shopping Channels & Actions
            'belanja', 'shopping', 'shop', 'beli barang', 'checkout', 'cart', 'keranjang', 'mall', 'supermarket',
            'tokopedia', 'shopee', 'lazada', 'tiktok shop', 'marketplace', 'amazon', 'ebay', 'zalora',
            // Gadgets & Hardware
            'hp', 'handphone', 'smartphone', 'iphone', 'android', 'laptop', 'macbook', 'pc', 'mouse', 'keyboard',
            'headset', 'headphones', 'earphone', 'earphones', 'airpods', 'tws', 'charger', 'cable', 'powerbank', 'elektronik', 'gadget', 'gadgets'
        ];

        this.healthKeywordsStrong = [
            // Pharmacy & Medicine
            'obat', 'medicine', 'medication', 'pills', 'drugs', 'prescription', 'resep dokter', 'apotek', 'apotik', 'pharmacy', 'drugstore',
            'vitamin', 'vitamins', 'suplemen', 'supplements', 'tablet', 'kapsul', 'capsule', 'sirup', 'syrup', 'antibiotik', 'antibiotics', 'jamu', 'herbal',
            // Healthcare Facilities & Professionals
            'dokter', 'doctor', 'physician', 'dokter gigi', 'dentist', 'klinik', 'clinic', 'rumah sakit', 'hospital', 'rs', 'puskesmas',
            'cek kesehatan', 'check up', 'medical check up', 'medical checkup', 'lab', 'tes darah', 'blood test', 'rapid', 'swab', 'vaksin', 'vaccine',
            // Fitness & Wellness
            'gym', 'fitness', 'olahraga', 'workout', 'exercise', 'yoga', 'pilates', 'zumba', 'crossfit', 'aerobik',
            'lari', 'running', 'sepeda', 'cycling', 'renang', 'swimming', 'badminton', 'futsal', 'tennis',
            // Therapy & Mental Health
            'terapi', 'therapy', 'konseling', 'counseling', 'psikolog', 'psychologist', 'psikiater', 'psychiatrist', 'mental health', 'meditasi', 'meditation', 'healing',
            'relaksasi', 'spa', 'pijat', 'massage', 'reflexology', 'refleksi', 'salon', 'barbershop', 'haircut', 'potong rambut',
            'sehat', 'kesehatan', 'health', 'wellness'
        ];

        this.transportKeywordsStrong = [
            'transport', 'transportasi', 'transportation', 'commute',
            'bensin', 'gas', 'gasoline', 'petrol', 'fuel', 'pertalite', 'pertamax', 'solar', 'diesel', 'spbu', 'shell', 'bp',
            'ojol', 'gojek', 'goride', 'gocar', 'grab', 'grabcar', 'grabike', 'maxim', 'indrive', 'taxi', 'taksi', 'uber', 'lyft', 'cab', 'fare', 'ongkos',
            'parkir', 'parking', 'tol', 'toll', 'e-toll', 'etoll', 'highway',
            'bus', 'transjakarta', 'tj', 'busway', 'angkot', 'mikrolet', 'minibus',
            'kereta', 'krl', 'commuter line', 'mrt', 'lrt', 'train', 'subway', 'metro', 'tiket kereta',
            'pesawat', 'flight', 'plane', 'airplane', 'airline', 'tiket pesawat', 'bandara', 'airport', 'garuda', 'lion air', 'citilink', 'airasia',
            'service motor', 'service mobil', 'bengkel', 'cuci motor', 'cuci mobil', 'car wash', 'tambal ban'
        ];

        this.billsKeywordsStrong = [
            'bills', 'bill', 'tagihan', 'utilities', 'utility',
            'listrik', 'electricity', 'electric bill', 'power bill', 'token listrik', 'pln',
            'air', 'water', 'water bill', 'pdam',
            'internet', 'wifi', 'broadband', 'indihome', 'biznet', 'myrepublic', 'first media',
            'pulsa', 'phone bill', 'paket data', 'data plan', 'mobile data', 'sim card', 'telkomsel', 'indosat', 'xl', 'tri', 'smartfren',
            'rent', 'rental', 'sewa', 'kos', 'kost', 'uang kos', 'sewa kos', 'kontrakan', 'apartment', 'apartemen', 'mortgage', 'cicilan rumah',
            'ipl', 'maintenance', 'maintenance fee', 'service fee', 'iuran', 'iuran sampah', 'iuran keamanan', 'pbb', 'pajak',
            'asuransi', 'insurance', 'bpjs', 'premi'
        ];

        this.incomeKeywords = [
            'income', 'got', 'receive', 'received', 'earn', 'earned',
            'salary', 'wage', 'paycheck', 'payroll', 'got paid', 'allowance', 'freelance', 'bonus', 'thr',
            'terima', 'dapat', 'dapet', 'nemu', 'uang masuk', 'gaji', 'gajian', 'bayaran',
            'honor', 'kiriman', 'terima transfer', 'dapat transfer', 'ditransfer', 'transfer masuk', 'dikirimin', 'dikirimi', 'dikasih uang', 'komisi', 'commission', 'profit', 'cuan',
            'dividen', 'dividend', 'cashback', 'reimburse', 'reimbursement', 'refund', 'uang jajan dari'
        ];

        this.expenseVerbs = [
            'beli', 'bayar', 'jajan', 'sewa', 'cicil', 'langganan', 'traktir', 'top up', 'topup',
            'ongkos', 'biaya', 'uang sekolah', 'uang kuliah', 'tiket masuk', 'pesan', 'order',
            'buy', 'bought', 'spend', 'spent', 'pay', 'paid', 'paid for', 'purchase', 'purchased', 'subscribe', 'rent'
        ];

        this.timeRefs = {
            today: ['today', 'hari ini', 'tadi', 'barusan', 'this morning', 'just now'],
            yesterday: ['yesterday', 'kemarin', 'kemaren', 'last night', 'semalam']
        };

        this.itemCategories = {
            'bread': 'food', 'roti': 'food', 'coffee': 'food', 'kopi': 'food',
            'tea': 'food', 'teh': 'food', 'lunch': 'food', 'makan': 'food',
            'dinner': 'food', 'breakfast': 'food', 'sarapan': 'food', 'brunch': 'food',
            'pizza': 'food', 'burger': 'food', 'sandwich': 'food', 'fries': 'food',
            'nasi': 'food', 'mie': 'food', 'bakso': 'food', 'soto': 'food',
            'jajan': 'food', 'warteg': 'food', 'padang': 'food', 'indomie': 'food',
            'nasi goreng': 'food', 'mie goreng': 'food', 'mie ayam': 'food',
            'sate': 'food', 'ayam goreng': 'food', 'ayam bakar': 'food',
            'rendang': 'food', 'pecel': 'food', 'rawon': 'food',
            'ice cream': 'food', 'es krim': 'food', 'snack': 'food', 'cemilan': 'food',
            'groceries': 'food', 'belanja dapur': 'food', 'sayur': 'food', 'buah': 'food', 'daging': 'food',
            'air mineral': 'food', 'mineral water': 'food', 'jus': 'food', 'juice': 'food',
            'restaurant': 'food', 'resto': 'food', 'cafe': 'food', 'kafe': 'food'
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

        const suffixes = ['nya', 'in', 'an', 's', 'ed', 'ing'];
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

    // Pre-normalize spoken half, slang, and common speech artifacts
    normalizePreParsing(text) {
        let t = String(text || '').toLowerCase().trim();

        // 1. Indonesian Half / Setengah
        const idWordDigits = {
            'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5,
            'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9, 'sepuluh': 10
        };

        t = t.replace(/\b(\d+|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan)\s+setengah\s+(miliar|milyar|billion)\b/gi, (m, n) => {
            const val = idWordDigits[n] !== undefined ? idWordDigits[n] : parseFloat(n);
            return (val + 0.5) + ' miliar';
        });
        t = t.replace(/\bsetengah\s+(miliar|milyar|billion)\b/gi, '500 juta');

        t = t.replace(/\b(\d+|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan)\s+setengah\s+(juta|jt|million)\b/gi, (m, n) => {
            const val = idWordDigits[n] !== undefined ? idWordDigits[n] : parseFloat(n);
            return (val + 0.5) + ' juta';
        });
        t = t.replace(/\bsetengah\s+(juta|jt|million)\b/gi, '500 ribu');

        t = t.replace(/\b(\d+|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan)\s+setengah\s+(ribu|rb|rebu|thousand|k)\b/gi, (m, n) => {
            const val = idWordDigits[n] !== undefined ? idWordDigits[n] : parseFloat(n);
            return (val + 0.5) + ' ribu';
        });
        t = t.replace(/\bsetengah\s+(ribu|rb|rebu|thousand|k)\b/gi, '500');

        // 2. English Half / And A Half
        const enWordDigits = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
        };

        t = t.replace(/\b(\d+|one|two|three|four|five|six|seven|eight|nine)\s+and\s+a\s+half\s+(billion)\b/gi, (m, n) => {
            const val = enWordDigits[n] !== undefined ? enWordDigits[n] : parseFloat(n);
            return (val + 0.5) + ' billion';
        });
        t = t.replace(/\bhalf\s+a\s+billion\b/gi, '500 million');

        t = t.replace(/\b(\d+|one|two|three|four|five|six|seven|eight|nine)\s+and\s+a\s+half\s+(million)\b/gi, (m, n) => {
            const val = enWordDigits[n] !== undefined ? enWordDigits[n] : parseFloat(n);
            return (val + 0.5) + ' million';
        });
        t = t.replace(/\bhalf\s+a\s+million\b/gi, '500 thousand');

        t = t.replace(/\b(\d+|one|two|three|four|five|six|seven|eight|nine)\s+and\s+a\s+half\s+(thousand|k)\b/gi, (m, n) => {
            const val = enWordDigits[n] !== undefined ? enWordDigits[n] : parseFloat(n);
            return (val + 0.5) + ' thousand';
        });
        t = t.replace(/\bhalf\s+a\s+thousand\b/gi, '500');

        // 3. Indonesian Slang Numbers
        t = t.replace(/\bcepek\s+(?:ceng|ribu|rb)\b/gi, '100 ribu');
        t = t.replace(/\bgopek\s+(?:ceng|ribu|rb)\b/gi, '500 ribu');
        t = t.replace(/\bgoceng\b/gi, '5 ribu');
        t = t.replace(/\bceban\b/gi, '10 ribu');
        t = t.replace(/\bgoban\b/gi, '50 ribu');
        t = t.replace(/\bseceng\b/gi, '1 ribu');
        t = t.replace(/\bnoceng\b/gi, '2 ribu');
        t = t.replace(/\bnoban\b/gi, '20 ribu');
        t = t.replace(/\bcapceng\b/gi, '10 ribu');
        t = t.replace(/\bsejutaan\b/gi, '1 juta');
        t = t.replace(/\bseribuan\b/gi, '1 ribu');

        return t;
    }

    splitCompoundSegments(raw) {
        // Connector list regex ordered by length/specificity (including Gen Z / colloquial slang "ama", "ama juga")
        const connectorPattern = /\b(?:dan\s+juga|sama\s+juga|ama\s+juga|terus\s+juga|trus\s+juga|dan\s+lagi|habis\s+itu|abis\s+itu|setelah\s+itu|and\s+then|as\s+well\s+as|along\s+with|after\s+that|sekalian|terus|trus|lalu|kemudian|lanjut|serta|plus|then|tapi|sedangkan|sementara|but|while|sama|ama|dan|and)\b|,/gi;

        let match;
        const pieces = [];
        const connectors = [];
        let lastIndex = 0;

        while ((match = connectorPattern.exec(raw)) !== null) {
            pieces.push(raw.substring(lastIndex, match.index).trim());
            connectors.push(match[0]);
            lastIndex = match.index + match[0].length;
        }
        pieces.push(raw.substring(lastIndex).trim());

        if (pieces.length <= 1) return [raw];

        const resultTxns = [];
        let currentChunk = pieces[0];

        for (let i = 1; i < pieces.length; i++) {
            const conn = connectors[i - 1];
            const nextPiece = pieces[i];

            const currentAmt = this.extractAmount(currentChunk);
            const nextAmt = this.extractAmount(nextPiece);

            if (currentAmt > 0 && nextAmt > 0) {
                // Both sides have valid amounts -> true transaction separation!
                resultTxns.push(currentChunk.trim());
                currentChunk = nextPiece.replace(/^(?:juga|lagi|also)\s+/i, '').trim();
            } else {
                // One side has no amount (e.g. "sama teman" / "dan donat 30k") -> merge!
                currentChunk = currentChunk + ' ' + conn.trim() + ' ' + nextPiece;
            }
        }
        if (currentChunk.trim()) {
            resultTxns.push(currentChunk.trim());
        }

        return resultTxns.length > 1 ? resultTxns : [raw];
    }

    parseMultiple(text, existingGoals) {
        const raw = String(text || '').trim();
        if (!raw) return [this.parse('', existingGoals)];

        const parts = this.splitCompoundSegments(raw);
        if (parts.length > 1) {
            const parsedList = parts.map(p => this.parse(p, existingGoals)).filter(item => item && item.amount > 0);

            // Only accept multi-transaction split if we got at least 2 distinct parts with valid amounts (> 0)
            if (parsedList.length > 1) {
                const globalDate = this.extractDate(raw.toLowerCase());
                const hasExplicitGlobalDate = /\b(yesterday|today|last night|hari ini|kemarin|kemaren|tadi malam)\b/i.test(raw);

                parsedList.forEach((item, idx) => {
                    if (item.intent === 'transaction') {
                        const clauseHasExplicitDate = /\b(yesterday|today|last night|hari ini|kemarin|kemaren|tadi malam)\b/i.test(parts[idx] || '');
                        if (!clauseHasExplicitDate && hasExplicitGlobalDate) {
                            item.date = globalDate;
                        }
                    }
                });
                return parsedList;
            }
        }

        return [this.parse(raw, existingGoals)];
    }

    parse(text, existingGoals) {
        const preprocessed = this.normalizePreParsing(text);
        const lower = preprocessed.toLowerCase().trim();

        // Check saving intent (Bilingual ID / EN)
        const savingInfo = this.detectSavingIntent(lower, existingGoals || []);
        if (savingInfo) {
            return {
                original: text,
                intent: 'saving',
                action: savingInfo.action,
                goalName: savingInfo.goalName,
                amount: this.extractAmount(lower)
            };
        }

        // Standard financial transaction
        const detectedType = this.detectType(lower);
        return {
            original: text,
            intent: 'transaction',
            amount: this.extractAmount(lower),
            type: detectedType,
            category: detectedType === 'income' ? this.detectIncomeCategory(lower) : this.detectCategory(lower),
            date: this.extractDate(lower),
            description: this.extractDescription(text)
        };
    }

    extractAmount(text) {
        const preprocessed = this.normalizePreParsing(text);
        const normalizedText = String(preprocessed)
            .replace(/(\d)([a-zA-Z])/g, '$1 $2')
            .replace(/([a-zA-Z])(\d)/g, '$1 $2')
            .replace(/\s+/g, ' ')
            .trim();

        const t = normalizedText;

        // Check for Discount / Diskon within the clause
        const discountRegex = /\b(?:diskon|discount|potongan|cashback|off)\s+(.+)$/i;
        const discountMatch = t.match(discountRegex);
        if (discountMatch) {
            const beforeDiscountText = t.substring(0, discountMatch.index).trim();
            const afterDiscountText = discountMatch[1].trim();
            const mainAmount = this._extractRawAmount(beforeDiscountText);
            const discountAmount = this._extractRawAmount(afterDiscountText);
            if (mainAmount > 0 && discountAmount > 0 && mainAmount >= discountAmount) {
                return Math.round(mainAmount - discountAmount);
            }
            if (mainAmount > 0) return mainAmount;
        }

        return this._extractRawAmount(t);
    }

    _extractRawAmount(t) {
        // 1. Spaced grouping (e.g., "50 000")
        const spacedGroupingPattern = /\b\d{1,3}(?:\s+\d{3})+\b/;
        const spacedGroupingMatch = t.match(spacedGroupingPattern);
        if (spacedGroupingMatch) {
            const num = parseInt(spacedGroupingMatch[0].replace(/\s+/g, ''), 10);
            if (!Number.isNaN(num) && num > 0) return num;
        }

        // 2. Hierarchical multi-multiplier pattern (e.g., "2 juta 500 ribu" -> 2.500.000)
        const multiMultPattern = /(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|rebu|thousand|juta|jt|million|miliar|milyar|billion)\b/gi;
        const matches = [];
        let m;
        while ((m = multiMultPattern.exec(t)) !== null) {
            const num = parseFloat(String(m[1]).replace(',', '.'));
            const mult = String(m[2] || '').toLowerCase();
            const factor = this.multipliers[mult] || 1;
            if (!Number.isNaN(num)) {
                matches.push({ val: num * factor, factor });
            }
        }

        if (matches.length > 0) {
            // Check if matches are strictly hierarchical (descending scale)
            let isHierarchical = true;
            for (let i = 0; i < matches.length - 1; i++) {
                if (matches[i].factor <= matches[i + 1].factor) {
                    isHierarchical = false;
                    break;
                }
            }
            if (isHierarchical) {
                return Math.round(matches.reduce((sum, item) => sum + item.val, 0));
            }
            // If not hierarchical (e.g. multiple distinct items without split), take the primary match
            return Math.round(matches[0].val);
        }

        // 3. Spoken word parser
        const fromWords = this.extractAmountFromWords(t);
        if (fromWords > 0) return fromWords;

        // 4. Single spoken numbers
        const idBaseValue = this.findBestSpokenNumberMatch(t, this.spokenNumbers);
        if (idBaseValue !== null) {
            if (/\b(ribu|rb|rebu)\b/i.test(t)) return idBaseValue * 1000;
            if (/\b(juta|jt)\b/i.test(t)) return idBaseValue * 1000000;
            if (/\b(miliar|milyar|billion)\b/i.test(t)) return idBaseValue * 1000000000;
            return idBaseValue;
        }

        const enBaseValue = this.findBestSpokenNumberMatch(t, this.englishNumbers);
        if (enBaseValue !== null) {
            if (/\b(thousand|k)\b/i.test(t)) return enBaseValue * 1000;
            if (/\bmillion\b/i.test(t)) return enBaseValue * 1000000;
            if (/\bbillion\b/i.test(t)) return enBaseValue * 1000000000;
            return enBaseValue;
        }

        // 5. Standard single multiplier
        const multPattern = /(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|rebu|thousand|juta|jt|million|miliar|milyar|billion)/i;
        let match = t.match(multPattern);
        if (match) {
            const num = parseFloat(match[1].replace(',', '.'));
            const mult = match[2].toLowerCase();
            for (const [key, val] of Object.entries(this.multipliers)) {
                if (mult === key || mult.startsWith(key)) return Math.round(num * val);
            }
        }

        // 6. Plain formatted number (e.g., "50.000" or "50000")
        const plainPattern = /\d{1,3}(?:[.,]\d{3})+|\d{4,}/;
        match = t.match(plainPattern);
        if (match) return parseInt(match[0].replace(/[.,]/g, ''), 10);

        // 7. Small number
        const smallNumPattern = /\b(\d+)\b/;
        match = t.match(smallNumPattern);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num < 100 && /\b(ribu|rb|k|thousand)\b/i.test(t)) return num * 1000;
            if (num < 100 && /\b(juta|jt|million)\b/i.test(t)) return num * 1000000;
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
        if (t === 'miliar' || t === 'milyar' || t === 'billion') return true;
        if (t === 'thousand' || t === 'hundred' || t === 'k') return true;
        if (t === 'sepuluh' || t === 'sebelas' || t === 'seratus' || t === 'seribu' || t === 'sejuta' || t === 'semiliar') return true;
        if (Object.prototype.hasOwnProperty.call(this.spokenNumbers, t)) return true;
        if (Object.prototype.hasOwnProperty.call(this.englishNumbers, t)) return true;
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
            if (t === 'semiliar') { applyScale(1000000000); seen = true; continue; }

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

            if (t === 'miliar' || t === 'milyar') {
                applyScale(1000000000);
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

            if (t === 'billion') {
                applyScale(1000000000);
                seen = true;
                continue;
            }
        }

        const value = total + current;
        return seen ? value : 0;
    }

    // Contextual Precedence for Income vs Expense
    detectType(text) {
        const lower = text.toLowerCase().trim();

        // 1. Explicit Reimbursement or Refund is ALWAYS Income
        if (/\b(?:dapat|terima|got|received?)\s+(?:ganti|reimburse|reimbursement|refund|cashback|kembalian)\b/i.test(lower)) {
            return 'income';
        }
        if (/\b(?:reimburse|reimbursement|refund|cashback)\b/i.test(lower)) {
            return 'income';
        }

        // 2. Explicit Income Nouns & Sources
        const strongIncomeWords = [
            'gaji', 'gajian', 'salary', 'wage', 'paycheck', 'payroll', 'thr',
            'dividen', 'dividend', 'profit', 'cuan', 'komisi', 'commission',
            'freelance', 'honor', 'bonus', 'uang masuk', 'allowance', 'stipend',
            'uang saku', 'uang jajan', 'uang makan', 'ditransfer', 'transfer masuk', 'kiriman'
        ];

        for (const kw of strongIncomeWords) {
            if (this.keywordMatches(lower, kw)) {
                // If preceded by explicit payment verb like "bayar gaji karyawan" or "kasih uang saku", it's expense
                if (/\b(?:bayar|pay|paid|kasih|beri|berikan|give)\s+(?:gaji|salary|honor|bonus|allowance|uang\s*saku|uang\s*jajan)/i.test(lower)) {
                    return 'expense';
                }
                return 'income';
            }
        }

        // 3. Reception Verbs vs Action Expense Verbs (Precedence check)
        const receptionRegex = /\b(?:terima|dapat|dapet|nemu|receive|received|got|earned|earn)\b/i;
        const expenseActionRegex = /\b(?:beli|bayar|jajan|sewa|cicil|langganan|traktir|top\s*up|topup|buy|bought|pay|paid|spend|spent|purchase|order|pesan)\b/i;

        const recMatch = lower.match(receptionRegex);
        const expMatch = lower.match(expenseActionRegex);

        if (recMatch && (!expMatch || recMatch.index < expMatch.index)) {
            // E.g., "Terima uang makan", "Dapat uang bensin", "Got 50k", "Received allowance"
            return 'income';
        }

        if (expMatch) {
            return 'expense';
        }

        return 'expense';
    }

    detectIncomeCategory(text) {
        const incomeMap = {
            salary: ['gaji', 'gajian', 'salary', 'wage', 'upah', 'paycheck', 'payroll', 'allowance', 'uang saku', 'uang bulanan'],
            freelance: ['freelance', 'proyek', 'project', 'klien', 'client', 'honor', 'bayaran', 'komisi', 'commission', 'jasa', 'side hustle', 'consulting'],
            bonus: ['bonus', 'thr', 'insentif', 'incentive', 'reward', 'hadiah lomba', 'cashback', 'reimburse', 'reimbursement', 'refund'],
            investment: ['dividen', 'dividend', 'saham', 'stock', 'crypto', 'bunga', 'interest', 'investasi', 'investment', 'profit', 'cuan', 'reksadana', 'trading'],
            gift: ['hadiah', 'gift', 'angpao', 'kiriman', 'transfer', 'dikasih', 'sedekah', 'tip', 'tips']
        };

        for (const [cat, keywords] of Object.entries(incomeMap)) {
            for (const kw of keywords) {
                if (this.keywordMatches(text, kw)) return cat;
            }
        }
        return 'salary';
    }

    detectCategory(text) {
        if (this.detectBills(text)) return 'bills';
        if (this.detectTransport(text)) return 'transport';
        if (this.detectStudy(text)) return 'study';
        if (this.detectHealth(text)) return 'health';
        if (this.detectEntertainment(text)) return 'entertainment';
        if (this.detectShopping(text)) return 'shopping';
        if (this.detectFood(text)) return 'food';

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

    detectFood(text) {
        const foodKws = [
            'makan', 'minum', 'jajan', 'sarapan', 'lunch', 'dinner', 'breakfast', 'brunch', 'supper',
            'ngopi', 'coffee', 'tea', 'teh', 'kopi', 'cafe', 'kafe', 'resto', 'restaurant',
            'warteg', 'padang', 'indomie', 'mcd', 'mcdonalds', 'kfc', 'burger', 'pizza', 'bakery', 'bread', 'cake',
            'snack', 'cemilan', 'groceries', 'grocery', 'supermarket', 'pasar', 'indomaret', 'alfamart'
        ];
        for (const kw of foodKws) {
            if (this.keywordMatches(text, kw)) return true;
        }
        return false;
    }

    detectBills(text) {
        for (const kw of this.billsKeywordsStrong) {
            if (this.keywordMatches(text, kw)) return true;
        }
        return false;
    }

    detectTransport(text) {
        for (const kw of this.transportKeywordsStrong) {
            if (this.keywordMatches(text, kw)) return true;
        }
        return false;
    }

    detectEntertainment(text) {
        for (const kw of this.entertainmentKeywords) {
            if (this.keywordMatches(text, kw)) return true;
        }
        return false;
    }

    detectStudy(text) {
        for (const kw of this.studyKeywordsStrong) {
            if (this.keywordMatches(text, kw)) return true;
        }
        return false;
    }

    detectShopping(text) {
        for (const kw of this.shoppingKeywordsStrong) {
            if (this.keywordMatches(text, kw)) return true;
        }
        return false;
    }

    detectHealth(text) {
        for (const kw of this.healthKeywordsStrong) {
            if (this.keywordMatches(text, kw)) return true;
        }
        return false;
    }

    formatLocalDate(d) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    extractDate(text) {
        const today = new Date();
        for (const [ref, keywords] of Object.entries(this.timeRefs)) {
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    if (ref === 'yesterday') {
                        const yesterday = new Date(today);
                        yesterday.setDate(today.getDate() - 1);
                        return this.formatLocalDate(yesterday);
                    }
                    return this.formatLocalDate(today);
                }
            }
        }
        return this.formatLocalDate(today);
    }

    extractDescription(text) {
        let clean = text;
        clean = clean.replace(/\d+(?:[.,]\d+)?\s*(k|rb|ribu|rebu|thousand|juta|jt|million|miliar|billion)/gi, '');
        clean = clean.replace(/\b\d{4,}\b/g, '');
        clean = clean.replace(/\b(today|yesterday|hari ini|kemarin|kemaren|tadi|barusan|last night)\b/gi, '');

        const spokenNumbersPattern = /\b(nol|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|belas|puluh|ratus|ribu|rb|rebu|juta|jt|seribu|sejuta|semiliar|setengah|goceng|ceban|goban|seceng|noceng|noban|cepek|gopek)\b/gi;
        clean = clean.replace(spokenNumbersPattern, '');

        const englishNumbersPattern = /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|half)\b/gi;
        clean = clean.replace(englishNumbersPattern, '');

        clean = clean.replace(/\b\d+\b/g, '');
        clean = clean.replace(/\s+/g, ' ').trim();
        if (clean.length < 3) return text;
        return clean;
    }

    // Fully Bilingual (ID & EN) Saving Detection
    detectSavingIntent(text, existingGoals) {
        const lower = text.toLowerCase();

        const savingKeywords = [
            'tabung', 'nabung', 'menabung', 'tabungan', 'simpan',
            'save', 'saving', 'saved', 'deposit', 'depositing'
        ];
        const withdrawKeywords = [
            'ambil', 'tarik',
            'withdraw', 'withdrawing', 'withdrew', 'pull out', 'take out'
        ];
        const generalMarkers = [
            'tabunganku', 'tabungan saya', 'tabungan umum',
            'my savings', 'general savings', 'savings account', 'savings', 'tabungan'
        ];
        const prepositions = [
            'ke', 'untuk', 'di', 'buat', 'dari',
            'to', 'for', 'into', 'in', 'towards', 'from'
        ];

        const hasWithdrawKw = withdrawKeywords.some(kw => this.keywordMatches(lower, kw));
        const hasSavingKw = savingKeywords.some(kw => this.keywordMatches(lower, kw));

        const isWithdraw = hasWithdrawKw && (
            lower.includes('tabung') ||
            lower.includes('saving') ||
            lower.includes('emergency') ||
            lower.includes('darurat') ||
            generalMarkers.some(gm => lower.includes(gm)) ||
            (existingGoals || []).some(g => lower.includes(g.name.toLowerCase().trim()))
        );

        const isDeposit = !isWithdraw && hasSavingKw;

        if (!isWithdraw && !isDeposit) return null;

        const action = isWithdraw ? 'withdraw' : 'deposit';

        // Strip action keywords and prepositions to extract candidate goal name
        let stripped = lower;
        [...savingKeywords, ...withdrawKeywords, ...prepositions, 'tabungan', 'savings'].forEach(kw => {
            stripped = stripped.replace(new RegExp('\\b' + this.escapeRegex(kw) + '\\b', 'g'), ' ');
        });

        // Remove numbers (digits, slang, and spoken words)
        stripped = stripped.replace(/\d+(?:[.,]\d+)?\s*(k|rb|ribu|thousand|juta|jt|million|miliar|billion)?/gi, ' ');
        stripped = stripped.replace(/\b(nol|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|belas|puluh|ratus|seribu|sejuta|setengah|zero|one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|half)\b/gi, ' ');
        stripped = stripped.replace(/\b(goceng|ceban|goban|cepek|gopek|seceng|noban)\b/gi, ' ');
        stripped = stripped.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

        // Try to match against existing goal names preserving original casing
        const words = stripped.split(' ').filter(w => w.length > 1);

        const goalSynonyms = {
            'japan': 'jepang', 'jepang': 'japan',
            'car': 'mobil', 'mobil': 'car',
            'house': 'rumah', 'rumah': 'house',
            'wedding': 'nikah', 'nikah': 'wedding',
            'holiday': 'liburan', 'liburan': 'holiday', 'vacation': 'liburan',
            'emergency': 'darurat', 'darurat': 'emergency',
            'fund': 'dana', 'dana': 'fund',
            'college': 'kuliah', 'kuliah': 'college',
            'school': 'sekolah', 'sekolah': 'school',
            'laptop': 'laptop', 'pc': 'komputer', 'computer': 'komputer',
            'phone': 'hp', 'gadget': 'hp',
            'umroh': 'umroh', 'haji': 'haji', 'hajj': 'haji',
            'invest': 'investasi', 'investment': 'investasi',
            'retirement': 'pensiun', 'pensiun': 'retirement'
        };

        let matchedGoalObj = null;
        for (const g of (existingGoals || [])) {
            const goalName = (g.name || '').toLowerCase().trim();
            if (!goalName) continue;
            if (stripped.includes(goalName) || lower.includes(goalName)) {
                matchedGoalObj = g;
                break;
            }
            const goalWords = goalName.split(' ');
            for (const gw of goalWords) {
                if (words.includes(gw) && gw.length > 2) {
                    matchedGoalObj = g;
                    break;
                }
                const syn = goalSynonyms[gw];
                if (syn && (words.includes(syn) || stripped.includes(syn))) {
                    matchedGoalObj = g;
                    break;
                }
            }
            if (matchedGoalObj) break;
        }

        // Check if any word in stripped has a synonym matching an existing goal
        if (!matchedGoalObj) {
            for (const w of words) {
                const syn = goalSynonyms[w];
                if (syn) {
                    const found = (existingGoals || []).find(g => (g.name || '').toLowerCase().trim().includes(syn));
                    if (found) {
                        matchedGoalObj = found;
                        break;
                    }
                }
            }
        }

        // If explicit general markers used and no goal matched, returns null (general savings)
        return { action, goalName: matchedGoalObj ? matchedGoalObj.name : null };
    }
}

const parser = new BilingualParser();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BilingualParser, parser };
}
