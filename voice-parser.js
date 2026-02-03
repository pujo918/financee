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
        for (const [spoken, baseValue] of Object.entries(this.spokenNumbers)) {
            if (text.includes(spoken)) {
                if (text.includes('ribu') || text.includes('rb')) return baseValue * 1000;
                if (text.includes('juta') || text.includes('jt')) return baseValue * 1000000;
                if (baseValue >= 1000) return baseValue;
            }
        }

        for (const [spoken, baseValue] of Object.entries(this.englishNumbers)) {
            if (text.includes(spoken)) {
                if (text.includes('thousand') || text.includes('k')) return baseValue * 1000;
                if (text.includes('million')) return baseValue * 1000000;
                if (baseValue >= 1000) return baseValue;
            }
        }

        const multPattern = /(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|rebu|thousand|juta|jt|million)/i;
        let match = text.match(multPattern);
        if (match) {
            const num = parseFloat(match[1].replace(',', '.'));
            const mult = match[2].toLowerCase();
            for (const [key, val] of Object.entries(this.multipliers)) {
                if (mult === key || mult.startsWith(key)) return Math.round(num * val);
            }
        }

        const plainPattern = /\d{1,3}(?:[.,]\d{3})+|\d{4,}/;
        match = text.match(plainPattern);
        if (match) return parseInt(match[0].replace(/[.,]/g, ''));

        const smallNumPattern = /\b(\d+)\b/;
        match = text.match(smallNumPattern);
        if (match) {
            const num = parseInt(match[1]);
            if (num < 100 && /\b(ribu|rb|k|thousand)\b/i.test(text)) return num * 1000;
            return num;
        }

        return 0;
    }

    detectType(text) {
        for (const keyword of this.incomeKeywords) {
            if (text.includes(keyword)) return 'income';
        }
        return 'expense';
    }

    detectCategory(text) {
        for (const [item, category] of Object.entries(this.itemCategories)) {
            const regex = new RegExp('\\b' + item + '\\b', 'i');
            if (regex.test(text)) return category;
        }
        return 'other';
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
