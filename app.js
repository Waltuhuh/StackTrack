/* ============================================================
   CONSTANTS
   ============================================================ */
var POPULAR = [
    { symbol: 'AAPL', name: 'Apple Inc.', base: 189.50, keywords: 'phone mobile tech computers mac iphone smart' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', base: 415.60, keywords: 'windows software tech cloud pc computer' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', base: 174.20, keywords: 'google search internet tech software web' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', base: 185.90, keywords: 'shopping retail cloud tech ecommerce store' },
    { symbol: 'META', name: 'Meta Platforms', base: 505.40, keywords: 'facebook instagram whatsapp social media vr tech' },
    { symbol: 'TSLA', name: 'Tesla Inc.', base: 248.30, keywords: 'elon musk ev cars electric vehicle auto' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', base: 878.40, keywords: 'chips processors gpu hardware tech ai artificial intelligence' },
    { symbol: 'JPM', name: 'JPMorgan Chase', base: 198.50, keywords: 'bank finance money banking investment' },
    { symbol: 'V', name: 'Visa Inc.', base: 281.70, keywords: 'credit card payments finance money transaction' },
    { symbol: 'NFLX', name: 'Netflix Inc.', base: 628.50, keywords: 'streaming video movies entertainment media show' },
    { symbol: 'AMD', name: 'Advanced Micro Devices', base: 174.80, keywords: 'processors chips hardware tech computing' },
    { symbol: 'DIS', name: 'Walt Disney Co.', base: 112.40, keywords: 'movies entertainment media theme parks kids' },
    { symbol: 'PYPL', name: 'PayPal Holdings', base: 63.20, keywords: 'payments finance money digital wallet' },
    { symbol: 'INTC', name: 'Intel Corp.', base: 44.50, keywords: 'processors chips hardware tech computing' },
    { symbol: 'COIN', name: 'Coinbase Global', base: 235.60, keywords: 'crypto cryptocurrency bitcoin ethereum finance' },
];

var DEMO_PROFILES = {
    AAPL: { name: 'Apple Inc.', exchange: 'NASDAQ', finnhubIndustry: 'Technology', currency: 'USD', marketCap: 2950e9 },
    MSFT: { name: 'Microsoft Corp.', exchange: 'NASDAQ', finnhubIndustry: 'Technology', currency: 'USD', marketCap: 3090e9 },
    GOOGL: { name: 'Alphabet Inc.', exchange: 'NASDAQ', finnhubIndustry: 'Technology', currency: 'USD', marketCap: 2180e9 },
    AMZN: { name: 'Amazon.com Inc.', exchange: 'NASDAQ', finnhubIndustry: 'Retail', currency: 'USD', marketCap: 1940e9 },
    META: { name: 'Meta Platforms', exchange: 'NASDAQ', finnhubIndustry: 'Technology', currency: 'USD', marketCap: 1300e9 },
    TSLA: { name: 'Tesla Inc.', exchange: 'NASDAQ', finnhubIndustry: 'Auto', currency: 'USD', marketCap: 790e9 },
    NVDA: { name: 'NVIDIA Corp.', exchange: 'NASDAQ', finnhubIndustry: 'Semiconductors', currency: 'USD', marketCap: 2170e9 },
    JPM: { name: 'JPMorgan Chase', exchange: 'NYSE', finnhubIndustry: 'Finance', currency: 'USD', marketCap: 572e9 },
    V: { name: 'Visa Inc.', exchange: 'NYSE', finnhubIndustry: 'Finance', currency: 'USD', marketCap: 578e9 },
    NFLX: { name: 'Netflix Inc.', exchange: 'NASDAQ', finnhubIndustry: 'Media', currency: 'USD', marketCap: 275e9 },
    AMD: { name: 'Advanced Micro Devices', exchange: 'NASDAQ', finnhubIndustry: 'Semiconductors', currency: 'USD', marketCap: 282e9 },
    DIS: { name: 'Walt Disney Co.', exchange: 'NYSE', finnhubIndustry: 'Media', currency: 'USD', marketCap: 205e9 },
    PYPL: { name: 'PayPal Holdings', exchange: 'NASDAQ', finnhubIndustry: 'Finance', currency: 'USD', marketCap: 70e9 },
    INTC: { name: 'Intel Corp.', exchange: 'NASDAQ', finnhubIndustry: 'Semiconductors', currency: 'USD', marketCap: 190e9 },
    COIN: { name: 'Coinbase Global', exchange: 'NASDAQ', finnhubIndustry: 'Crypto', currency: 'USD', marketCap: 60e9 },
};

var SCENARIO_COLORS = ['#e8863a', '#2a6dbf', '#ff6b6b', '#ffd93d', '#4ecdc4', '#ff9f43', '#a29bfe', '#fd79a8', '#36d1dc', '#e17055'];

/* ============================================================
   STATE
   ============================================================ */
var G = {
    apiKey: '', demoMode: false,
    priceCache: {}, simBasePrices: {},
    scenarios: [], activeIdx: 0,
    ws: null, simInterval: null,
};
var A = null;
var currentUser = null;  // Firebase user object
var lastView = 'dashboard';
var S_currentStock = null;
var S_tradeMode = 'buy';
var S_detailChart = null;
var _syncTimer = null;

/* ============================================================
   USER DROPDOWN MENU
   ============================================================ */
function toggleUserMenu() {
    var dd = document.getElementById('user-dropdown');
    dd.classList.toggle('open');
}

// Close user dropdown when clicking outside
document.addEventListener('click', function (e) {
    var wrap = document.querySelector('.top-nav-user-wrap');
    var dd = document.getElementById('user-dropdown');
    if (wrap && dd && !wrap.contains(e.target)) {
        dd.classList.remove('open');
    }
});

/* ============================================================
   FIREBASE AUTH
   ============================================================ */
function showAuthTab(tab) {
    document.getElementById('auth-login').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('auth-register').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-register').classList.toggle('active', tab === 'register');
    document.getElementById('auth-error').textContent = '';
}

function doLogin() {
    var email = document.getElementById('login-email').value.trim();
    var pass = document.getElementById('login-pass').value;
    var remember = document.getElementById('login-remember').checked;

    if (!email || !pass) { document.getElementById('auth-error').textContent = 'Enter email and password'; return; }
    document.getElementById('auth-error').textContent = '';

    // Set Persistence based on "Remember me" checkbox
    var persistenceType = remember ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;

    auth.setPersistence(persistenceType)
        .then(function () {
            return auth.signInWithEmailAndPassword(email, pass);
        })
        .catch(function (err) {
            document.getElementById('auth-error').textContent = err.message;
        });
}

function doRegister() {
    var email = document.getElementById('reg-email').value.trim();
    var pass = document.getElementById('reg-pass').value;
    if (!email || !pass) { document.getElementById('auth-error').textContent = 'Enter email and password'; return; }
    document.getElementById('auth-error').textContent = '';
    auth.createUserWithEmailAndPassword(email, pass).catch(function (err) {
        document.getElementById('auth-error').textContent = err.message;
    });
}

function doResetPassword() {
    var email = document.getElementById('login-email').value.trim();
    if (!email) { document.getElementById('auth-error').textContent = 'Enter your email first, then click Forgot'; return; }
    auth.sendPasswordResetEmail(email).then(function () {
        document.getElementById('auth-error').textContent = '';
        showToast('Password reset email sent!', 'success');
    }).catch(function (err) {
        document.getElementById('auth-error').textContent = err.message;
    });
}

function doLogout() {
    auth.signOut().then(function () {
        currentUser = null;
        G = { apiKey: '', demoMode: false, priceCache: {}, simBasePrices: {}, scenarios: [], activeIdx: 0, ws: null, simInterval: null };
        A = null;
        if (G.simInterval) clearInterval(G.simInterval);
        document.getElementById('app').style.display = 'none';
        document.getElementById('setup-screen').style.display = 'none';
        document.getElementById('auth-screen').style.display = 'flex';
        showToast('Logged out', 'info');
    });
}

// Listen for auth state changes (handles login, register, and page reload)
auth.onAuthStateChanged(function (user) {
    if (user) {
        currentUser = user;
        document.getElementById('auth-screen').style.display = 'none';
        var w = document.getElementById('welcome-wrapper');
        if (w) w.style.display = 'none';
        var userEl = document.getElementById('sidebar-username');
        if (userEl) userEl.textContent = user.email.split('@')[0];
        loadFromFirestore();
    } else {
        // Not logged in — show auth screen
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('setup-screen').style.display = 'none';
        document.getElementById('app').style.display = 'none';
    }
});

/* ============================================================
   FIRESTORE SYNC — saves only portfolio data, never prices
   ============================================================ */
function getFirestoreData() {
    // Strip out prices — only save portfolio metadata
    var cleanScenarios = G.scenarios.map(function (sc) {
        return {
            id: sc.id, name: sc.name, color: sc.color,
            budget: sc.budget, cash: sc.cash,
            portfolio: sc.portfolio,       // {symbol: {shares, avgPrice, cost}} — no current prices
            transactions: sc.transactions, // historical records
            portfolioHistory: (sc.portfolioHistory || []).slice(-200), // limit size
        };
    });
    return {
        apiKey: G.apiKey || '',
        demoMode: !!G.demoMode,
        activeIdx: G.activeIdx,
        scenarios: cleanScenarios,
        // NOT saved: priceCache, simBasePrices
    };
}

function loadFromFirestore() {
    if (!currentUser) return;
    db.collection('users').doc(currentUser.uid).get().then(function (doc) {
        var localData = null;
        try { localData = JSON.parse(localStorage.getItem('stocksim_v3')); } catch (e) { }

        if (doc.exists && doc.data() && (doc.data().scenarios || doc.data().apiKey || doc.data().demoMode)) {
            var d = doc.data();
            G.apiKey = d.apiKey || '';
            G.demoMode = !!d.demoMode;
            var rawScenarios = (d.scenarios && d.scenarios.length) ? d.scenarios : [newScenario('Scenario 1', 10000)];
            G.scenarios = rawScenarios.map(function (sc) {
                sc.portfolio = sc.portfolio || {};
                sc.transactions = sc.transactions || [];
                sc.portfolioHistory = sc.portfolioHistory || [];
                sc.cash = typeof sc.cash === 'number' ? sc.cash : (sc.budget || 10000);
                sc.budget = typeof sc.budget === 'number' ? sc.budget : 10000;
                return sc;
            });
            G.activeIdx = d.activeIdx || 0;
            if (G.activeIdx >= G.scenarios.length) G.activeIdx = 0;
            A = G.scenarios[G.activeIdx];
            initApp();
        } else if (localData && (localData.apiKey || localData.demoMode)) {
            // Fallback to localStorage
            G.apiKey = localData.apiKey || '';
            G.demoMode = !!localData.demoMode;
            var rawScenarios = (localData.scenarios && localData.scenarios.length) ? localData.scenarios : [newScenario('Scenario 1', 10000)];
            G.scenarios = rawScenarios.map(function (sc) {
                sc.portfolio = sc.portfolio || {};
                sc.transactions = sc.transactions || [];
                sc.portfolioHistory = sc.portfolioHistory || [];
                sc.cash = typeof sc.cash === 'number' ? sc.cash : (sc.budget || 10000);
                sc.budget = typeof sc.budget === 'number' ? sc.budget : 10000;
                return sc;
            });
            G.activeIdx = localData.activeIdx || 0;
            if (G.activeIdx >= G.scenarios.length) G.activeIdx = 0;
            A = G.scenarios[G.activeIdx];
            syncToFirestore(true); // Sync the local recovery up to Firebase
            initApp();
        } else {
            // No saved data anywhere — show setup screen
            document.getElementById('setup-screen').style.display = 'flex';
        }
    }).catch(function (err) {
        console.warn('Firestore load error:', err);
        document.getElementById('setup-screen').style.display = 'flex';
    });
}

function syncToFirestore(immediate) {
    if (!currentUser) return;
    clearTimeout(_syncTimer);
    var doSave = function () {
        var data = getFirestoreData();
        db.collection('users').doc(currentUser.uid).set(data, { merge: true }).catch(function (err) {
            console.warn('Firestore save error:', err);
        });
    };
    if (immediate) {
        doSave();
    } else {
        _syncTimer = setTimeout(doSave, 2000);
    }
}

/* ============================================================
   SCENARIO MANAGEMENT
   ============================================================ */
function newScenario(name, budget) {
    return {
        id: Date.now() + Math.random(),
        name: name || 'Scenario ' + (G.scenarios.length + 1),
        color: SCENARIO_COLORS[G.scenarios.length % SCENARIO_COLORS.length],
        budget: budget || 10000, cash: budget || 10000,
        portfolio: {}, transactions: [], portfolioHistory: [],
    };
}

function switchScenario(idx) {
    if (idx < 0 || idx >= G.scenarios.length) return;
    G.activeIdx = idx; A = G.scenarios[idx];
    saveState(); updateSidebar(); renderScenarioSelector();
    var v = document.querySelector('.view.active');
    if (v) {
        var id = v.id.replace('view-', '');
        if (id === 'dashboard') renderDashboard();
        if (id === 'portfolio') renderPortfolio();
        if (id === 'settings') renderSettings();
        if (id === 'stock' && S_currentStock) updateTradeSummary();
    }
    showToast('Switched to ' + A.name, 'info', 2000);
}

function createScenarioFromForm() {
    var nameInput = document.getElementById('new-sc-name');
    var budgetInput = document.getElementById('new-sc-budget');
    var name = (nameInput.value || '').trim() || ('Scenario ' + (G.scenarios.length + 1));
    var budget = parseFloat(budgetInput.value);
    if (!budget || budget < 100) { showToast('Budget must be ≥ $100', 'error'); return; }
    var sc = newScenario(name, budget);
    G.scenarios.push(sc);
    hideNewForm();
    switchScenario(G.scenarios.length - 1);
    showToast('Created "' + sc.name + '" with ' + fmt(sc.budget), 'success');
}

function showNewForm() {
    document.getElementById('scenario-new-form').style.display = 'block';
    document.getElementById('scenario-add-section').style.display = 'none';
    var ni = document.getElementById('new-sc-name');
    ni.value = 'Scenario ' + (G.scenarios.length + 1);
    document.getElementById('new-sc-budget').value = '10000';
    ni.focus();
}

function hideNewForm() {
    var f = document.getElementById('scenario-new-form');
    var a = document.getElementById('scenario-add-section');
    if (f) f.style.display = 'none';
    if (a) a.style.display = 'block';
}

function startRename(idx) {
    var item = document.querySelector('.scenario-list-item[data-idx="' + idx + '"]');
    if (!item) return;
    var nameEl = item.querySelector('.sl-name');
    var old = G.scenarios[idx].name;
    nameEl.innerHTML = '<input type="text" class="sl-rename-input" value="' + old + '">';
    var inp = nameEl.querySelector('input');
    inp.focus(); inp.select();
    var done = false;
    function finish() {
        if (done) return; done = true;
        var v = (inp.value || '').trim();
        if (v && v !== old) { G.scenarios[idx].name = v; saveState(); showToast('Renamed to "' + v + '"', 'success'); }
        renderScenarioSelector();
        if (idx === G.activeIdx) updateSidebar();
    }
    inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); finish(); }
        if (e.key === 'Escape') { done = true; renderScenarioList(); }
    });
    inp.addEventListener('blur', function () { setTimeout(finish, 100); });
}

function deleteScenario(idx) {
    if (G.scenarios.length <= 1) { showToast('Need at least one scenario', 'error'); return; }
    var sc = G.scenarios[idx];
    G.scenarios.splice(idx, 1);
    if (G.activeIdx >= G.scenarios.length) G.activeIdx = G.scenarios.length - 1;
    A = G.scenarios[G.activeIdx];
    saveState(); renderScenarioSelector(); updateSidebar(); renderDashboard();
    showToast('Deleted "' + sc.name + '"', 'info');
}

function duplicateScenario(idx) {
    var src = G.scenarios[idx];
    var dup = JSON.parse(JSON.stringify(src));
    dup.id = Date.now() + Math.random();
    dup.name = src.name + ' (copy)';
    dup.color = SCENARIO_COLORS[G.scenarios.length % SCENARIO_COLORS.length];
    G.scenarios.push(dup);
    switchScenario(G.scenarios.length - 1);
    showToast('Duplicated "' + src.name + '"', 'success');
}

/* ============================================================
   SCENARIO UI
   ============================================================ */
function toggleScenarioPanel() {
    var p = document.getElementById('scenario-panel');
    var s = document.getElementById('scenario-selector');
    var open = p.classList.toggle('open');
    s.classList.toggle('open', open);
    if (open) { renderScenarioList(); hideNewForm(); }
}

function closeScenarioPanel() {
    var p = document.getElementById('scenario-panel');
    var s = document.getElementById('scenario-selector');
    if (p) p.classList.remove('open');
    if (s) s.classList.remove('open');
    hideNewForm();
}

function renderScenarioSelector() {
    var dot = document.getElementById('scenario-dot');
    var nameEl = document.getElementById('scenario-current-name');
    if (!dot || !nameEl) return;
    dot.style.background = A.color;
    var tv = totalValue();
    nameEl.innerHTML = A.name + ' <span style="color:var(--text3);font-weight:400;font-size:11px;margin-left:4px">' + fmt(tv) + '</span>';
    renderScenarioList();
}

function renderScenarioList() {
    var el = document.getElementById('scenario-list');
    if (!el) return;
    el.innerHTML = G.scenarios.map(function (sc, i) {
        var active = i === G.activeIdx ? ' active' : '';
        var tv = sc.cash + Object.entries(sc.portfolio).reduce(function (s, e) { return s + e[1].shares * getPrice(e[0]); }, 0);
        return '<div class="scenario-list-item' + active + '" data-idx="' + i + '">'
            + '<span class="sl-dot" style="background:' + sc.color + '"></span>'
            + '<div class="sl-info">'
            + '<span class="sl-name">' + sc.name + '</span>'
            + '<span class="sl-budget">' + fmt(tv) + '</span>'
            + '</div>'
            + '<span class="sl-actions">'
            + '<button class="sl-action-btn" data-action="duplicate" data-idx="' + i + '" title="Duplicate">📋</button>'
            + '<button class="sl-action-btn" data-action="rename" data-idx="' + i + '" title="Rename">✏️</button>'
            + '<button class="sl-action-btn danger" data-action="delete" data-idx="' + i + '" title="Delete">🗑️</button>'
            + '</span>'
            + '</div>';
    }).join('');
}

/* ============================================================
   EVENT WIRING
   ============================================================ */
var _eventsWired = false;
function wireScenarioEvents() {
    if (_eventsWired) return;
    _eventsWired = true;

    document.getElementById('scenario-selector').addEventListener('click', function (e) {
        e.stopPropagation(); toggleScenarioPanel();
    });

    document.getElementById('scenario-panel').addEventListener('click', function (e) {
        e.stopPropagation();
        var btn = e.target.closest('.sl-action-btn');
        if (btn) {
            e.preventDefault();
            var idx = parseInt(btn.getAttribute('data-idx'));
            var action = btn.getAttribute('data-action');
            if (action === 'rename') startRename(idx);
            else if (action === 'delete') deleteScenario(idx);
            else if (action === 'duplicate') duplicateScenario(idx);
            return;
        }
        if (e.target.classList && e.target.classList.contains('sl-rename-input')) return;
        var item = e.target.closest('.scenario-list-item');
        if (item) { switchScenario(parseInt(item.getAttribute('data-idx'))); closeScenarioPanel(); }
    });

    document.getElementById('scenario-add-btn').addEventListener('click', function (e) { e.stopPropagation(); showNewForm(); });
    document.getElementById('sc-confirm-btn').addEventListener('click', function (e) { e.stopPropagation(); createScenarioFromForm(); });
    document.getElementById('sc-cancel-btn').addEventListener('click', function (e) { e.stopPropagation(); hideNewForm(); });
    document.getElementById('new-sc-name').addEventListener('keydown', function (e) { if (e.key === 'Enter') createScenarioFromForm(); });
    document.getElementById('new-sc-budget').addEventListener('keydown', function (e) { if (e.key === 'Enter') createScenarioFromForm(); });
    document.getElementById('scenario-new-form').addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function (e) {
        var section = document.querySelector('.scenario-section');
        if (section && !section.contains(e.target)) closeScenarioPanel();
    });
}

/* ============================================================
   STARTUP
   ============================================================ */
function startApp() {
    var key = document.getElementById('api-key-input').value.trim();
    var budget = parseFloat(document.getElementById('budget-input').value);
    if (!key) return showToast('Enter an API key, or click Demo Mode', 'error');
    if (!budget || budget < 100) return showToast('Minimum budget is $100', 'error');
    G.apiKey = key; G.demoMode = false;
    G.scenarios = [newScenario('Scenario 1', budget)];
    G.activeIdx = 0; A = G.scenarios[0];
    saveState(true); initApp();
}

function startDemo() {
    var budget = parseFloat(document.getElementById('budget-input').value) || 10000;
    if (budget < 100) return showToast('Minimum budget is $100', 'error');
    G.apiKey = ''; G.demoMode = true;
    G.scenarios = [newScenario('Scenario 1', budget)];
    G.activeIdx = 0; A = G.scenarios[0];
    saveState(true); initApp();
}

function initApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    A = G.scenarios[G.activeIdx];

    var badgeEl = document.querySelector('.sidebar-bottom .live-badge, .sidebar-bottom .demo-badge');
    if (badgeEl) {
        if (G.demoMode) { badgeEl.className = 'demo-badge'; badgeEl.innerHTML = '<span class="demo-dot"></span> Demo mode'; }
        else { badgeEl.className = 'live-badge'; badgeEl.innerHTML = '<span class="live-dot"></span> Live prices'; }
    }

    var userEl = document.getElementById('sidebar-username');
    if (userEl && currentUser) userEl.textContent = currentUser.email.split('@')[0];

    wireScenarioEvents();
    renderScenarioSelector();
    updateSidebar();

    if (G.demoMode) { initDemoSimulation(); }
    else { fetchAllPrices(); connectWS(); setInterval(fetchAllPrices, 15000); }

    renderDashboard(); renderMarketList();
    recordPortfolioSnapshot();
    setInterval(recordPortfolioSnapshot, 300000);
}

/* ============================================================
   DEMO ENGINE
   ============================================================ */
function initDemoSimulation() {
    POPULAR.forEach(function (s) {
        var saved = G.simBasePrices[s.symbol];
        var base = saved || s.base * (0.95 + Math.random() * 0.1);
        G.simBasePrices[s.symbol] = base;
        var open = base * (1 + (Math.random() - 0.5) * 0.02);
        G.priceCache[s.symbol] = { c: base, o: open, h: Math.max(base, open) * (1 + Math.random() * 0.015), l: Math.min(base, open) * (1 - Math.random() * 0.015), pc: open, d: base - open, dp: ((base - open) / open) * 100 };
    });
    if (G.simInterval) clearInterval(G.simInterval);
    G.simInterval = setInterval(tickDemoPrices, 2000);
    tickDemoPrices();
}

function tickDemoPrices() {
    var symsSet = {};
    POPULAR.forEach(function (s) { symsSet[s.symbol] = true; });
    G.scenarios.forEach(function (sc) { Object.keys(sc.portfolio).forEach(function (s) { symsSet[s] = true; }); });
    Object.keys(symsSet).forEach(function (sym) {
        var q = G.priceCache[sym]; if (!q) return;
        var vol = (sym === 'TSLA' || sym === 'COIN') ? 0.004 : 0.0015;
        var drift = (Math.random() - 0.498) * vol;
        var old = q.c;
        q.c = parseFloat(Math.max(1, old * (1 + drift)).toFixed(2));
        q.h = Math.max(q.h, q.c); q.l = Math.min(q.l, q.c);
        q.d = q.c - q.pc; q.dp = ((q.c - q.pc) / q.pc) * 100;
        flashEl('price-' + sym, q.c > old ? 'green' : 'red');
    });
    refreshAllPriceUI(); updateSidebar();
    if (S_currentStock && document.getElementById('view-stock').classList.contains('active')) {
        var q = G.priceCache[S_currentStock]; if (q) updateDetailPrice(q);
    }
}

function generateDemoCandles(symbol, resolution, from, to) {
    var base = G.simBasePrices[symbol] || (G.priceCache[symbol] ? G.priceCache[symbol].c : 100);
    var step;
    switch (resolution) { case '5': step = 300; break; case '30': step = 1800; break; case '60': step = 3600; break; case 'D': step = 86400; break; case 'W': step = 604800; break; default: step = 300; }
    var price = base * (0.92 + Math.random() * 0.08);
    var vol = (symbol === 'TSLA' || symbol === 'COIN') ? 0.025 : 0.012;
    var pts = [];
    for (var t = from; t <= to; t += step) {
        price = Math.max(1, price * (1 + (Math.random() - 0.48) * vol));
        var o = price, c = price * (1 + (Math.random() - 0.5) * vol * 0.5);
        pts.push({ t: t, o: o, h: Math.max(o, c) * (1 + Math.random() * vol * 0.3), l: Math.min(o, c) * (1 - Math.random() * vol * 0.3), c: parseFloat(c.toFixed(2)), v: Math.floor(Math.random() * 5e6) });
        price = c;
    }
    return { s: 'ok', t: pts.map(function (p) { return p.t; }), o: pts.map(function (p) { return p.o; }), h: pts.map(function (p) { return p.h; }), l: pts.map(function (p) { return p.l; }), c: pts.map(function (p) { return p.c; }), v: pts.map(function (p) { return p.v; }) };
}

/* ============================================================
   STORAGE — localStorage (instant) + Firestore (debounced 2s)
   ============================================================ */
function saveState(immediate) {
    try { localStorage.setItem('stocksim_v3', JSON.stringify({ apiKey: G.apiKey, demoMode: G.demoMode, scenarios: G.scenarios, activeIdx: G.activeIdx, simBasePrices: G.simBasePrices })); } catch (e) { }
    syncToFirestore(immediate);
}

/* ============================================================
   NAVIGATION
   ============================================================ */
function navigate(view) {
    if (view !== 'stock') lastView = view;
    document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
    var el = document.getElementById('view-' + view);
    var nav = document.getElementById('nav-' + view);
    if (el) el.classList.add('active');
    if (nav) nav.classList.add('active');
    if (view === 'dashboard') renderDashboard();
    if (view === 'portfolio') renderPortfolio();
    if (view === 'settings') renderSettings();
    if (view === 'market') renderMarketList();
    if (view === 'news') {
        if (!G.newsLoaded) renderGlobalNews();
    }
}

/* ============================================================
   FINNHUB REST API
   ============================================================ */
function apiFetch(path) {
    return fetch('https://finnhub.io/api/v1' + path + '&token=' + G.apiKey)
        .then(function (res) { if (!res.ok) throw new Error('API ' + res.status); return res.json(); });
}

function fetchMarketNews(pageToken) {
    if (G.demoMode) return Promise.resolve({ articles: generateDemoNews('global'), nextPage: null });

    // Use NewsData.io for global business news
    var url = 'https://newsdata.io/api/1/news?apikey=pub_ff8f73f153a144eb989959029d95f5f0&language=en&category=business';
    if (pageToken) url += '&page=' + encodeURIComponent(pageToken);

    return fetch(url)
        .then(function (res) {
            if (!res.ok) throw new Error('NewsData API Error');
            return res.json();
        })
        .then(function (data) {
            if (!data || !data.results) return [];

            // Map NewsData.io response to our internal format
            var articles = data.results.map(function (article, i) {
                return {
                    id: article.article_id || i.toString(),
                    category: 'business',
                    datetime: new Date(article.pubDate).getTime() / 1000,
                    headline: article.title || 'Market Update',
                    image: article.image_url || '',
                    related: '',
                    source: article.source_id || 'News',
                    summary: article.description || 'Traders are closely monitoring this recent development.',
                    url: article.link || '#'
                };
            }).filter(function (a) {
                // Filter out broken articles
                return a.headline && a.summary;
            });
            return { articles: articles, nextPage: data.nextPage || null };
        })
        .catch(function (e) {
            console.error('Failed to fetch from NewsData.io:', e);
            return { articles: generateDemoNews('global'), nextPage: null }; // Fallback to demo news
        });
}

function fetchCompanyNews(symbol, fromDate, toDate) {
    if (G.demoMode) return Promise.resolve(generateDemoNews('company', symbol));
    return apiFetch('/company-news?symbol=' + symbol + '&from=' + fromDate + '&to=' + toDate)
        .catch(function () { return generateDemoNews('company', symbol); });
}



/* ============================================================
   GOOGLE GEMINI API INTEGRATION
   ============================================================ */
var GEMINI_API_KEY = "AIzaSyBeS77t2sup9eHM59iQW8gwKEvzBdQYb9I";

function callGeminiAPI(prompt, model) {
    if (!model) model = "gemini-1.5-flash"; // default fallback
    var url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + GEMINI_API_KEY;

    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }]
        })
    }).then(function (res) {
        if (!res.ok) throw new Error("Gemini API Error: " + res.status);
        return res.json();
    }).then(function (data) {
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
            return data.candidates[0].content.parts[0].text;
        }
        return "Analysis currently unavailable.";
    }).catch(function (err) {
        console.error("Gemini API failed:", err);
        return "Real-time AI analysis is currently unavailable. Please try again later.";
    });
}

/* ============================================================
   AI NEWS & EVENT GENERATOR
   ============================================================ */
function generateDemoNews(type, symbol) {
    var now = Math.floor(Date.now() / 1000);
    var articles = [];
    var count = type === 'global' ? 12 : 5;

    var templates = [
        "AI chips see massive demand surge this quarter.",
        "Central Bank hints at upcoming interest rate cuts.",
        "Tech giants report record breaking earnings.",
        "New regulatory framework proposed for digital assets.",
        "Automotive sector struggles with supply chain bottlenecks.",
        "Renewable energy investments hit all-time high.",
        "Retail sales jump unexpectedly during holiday season.",
        "Merger talks stall between industry leaders."
    ];

    var companyTemplates = [
        symbol + " announces breakthrough in new product line.",
        "Analyst upgrades " + symbol + " citing strong margins.",
        symbol + " CEO steps down amid restructuring.",
        "Earnings miss expectations for " + symbol + " this quarter.",
        symbol + " secures massive government contract."
    ];

    for (var i = 0; i < count; i++) {
        var isPos = Math.random() > 0.5;
        var headline = type === 'company' ? companyTemplates[i % companyTemplates.length] : templates[i % templates.length];

        articles.push({
            id: Math.random().toString(),
            category: "business",
            datetime: now - (Math.floor(Math.random() * 86400 * 5)),
            headline: headline,
            image: '',
            related: type === 'company' ? symbol : "AAPL,MSFT,TSLA",
            source: ["MarketWatch", "Bloomberg", "Reuters", "CNBC"][Math.floor(Math.random() * 4)],
            summary: headline + " Traders are closely watching the impact on the market as volume increases significantly.",
            url: "#",
            _mockSentiment: isPos ? 1 : -1
        });
    }

    // Sort descending by time
    return articles.sort(function (a, b) { return b.datetime - a.datetime; });
}

window._globalNewsList = [];
window._newsNextPage = null;
window._newsPollingInterval = null;

function loadMoreNews() {
    var btn = document.getElementById('news-load-more-btn');
    if (btn) btn.innerHTML = '<div class="spinner" style="display:inline-block;width:14px;height:14px;border-width:2px;margin-right:8px;"></div>Loading...';

    fetchMarketNews(window._newsNextPage).then(function (res) {
        window._newsNextPage = res.nextPage;
        var newArticles = res.articles || [];

        // Append to global list and update Grid
        window._globalNewsList = window._globalNewsList.concat(newArticles);
        renderNewsGridOnly();
    });
}

function renderNewsGridOnly() {
    var list = document.getElementById('global-news-list');
    if (!list) return;

    // Skip the first 5 used for timeline, display the rest
    var gridArticles = window._globalNewsList.slice(5);
    drawNewsCards(gridArticles, list);

    // Append load more button if we have a next page
    if (window._newsNextPage) {
        var btnHtml = '<div style="grid-column: 1/-1; text-align: center; margin-top: 20px;">' +
            '<button id="news-load-more-btn" class="btn-primary" style="width: auto; padding: 12px 32px;" onclick="loadMoreNews()">Read More</button>' +
            '</div>';
        list.insertAdjacentHTML('beforeend', btnHtml);
    }
}

function renderGlobalNews(forceRefresh) {
    if (G.newsLoaded && !forceRefresh) return;
    G.newsLoaded = true;

    // Setup periodic polling every 2 minutes if not already set
    if (!window._newsPollingInterval) {
        window._newsPollingInterval = setInterval(function () {
            renderGlobalNews(true);
        }, 120000);
    }

    var list = document.getElementById('global-news-list');
    var aiText = document.getElementById('ai-global-summary');
    var timeline = document.getElementById('live-timeline');

    if (timeline) {
        timeline.innerHTML = '<div class="loading-overlay" style="width: 100%; border-radius: 8px;"><div class="spinner"></div>Loading global timeline...</div>';
    }

    if (list) {
        list.innerHTML = '<div class="loading-overlay" style="grid-column: 1/-1"><div class="spinner"></div>Fetching global market news...</div>';
    }

    fetchMarketNews(null).then(function (res) {
        var news = res.articles || [];
        window._newsNextPage = res.nextPage;
        window._globalNewsList = news;
        if (!news || !news.length) {
            list.innerHTML = '<div class="empty-state" style="grid-column: 1/-1"><div class="es-icon">📰</div><h3>No news available</h3></div>';
            aiText.innerHTML = "Currently unable to generate AI insights due to lack of market data.";
            if (timeline) timeline.innerHTML = '<div style="padding: 10px; color: var(--text3);">No live events detected.</div>';
            return;
        }

        // Populate Interactive Timeline with top 5 articles
        if (timeline) {
            var topTimeline = news.slice(0, 5);
            var startIdx = window._newsArticleCache.length;
            topTimeline.forEach(function (a) { window._newsArticleCache.push(a); });

            var timelineHtml = topTimeline.map(function (n, i) {
                var d = new Date(n.datetime * 1000);
                var timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                var dateStr = d.toLocaleDateString();
                var currentIdx = startIdx + i;

                return '<div class="timeline-point-container" onclick="window.openNewsModal(' + currentIdx + ')">' +
                    '  <div class="timeline-text">' + n.headline + '</div>' +
                    '  <div class="timeline-dot"></div>' +
                    '  <div class="timeline-date-time">' +
                    '    <div>' + dateStr + '</div>' +
                    '    <div style="font-weight: bold; color: var(--primary);">' + timeStr + '</div>' +
                    '  </div>' +
                    '</div>';
            }).join('');
            timeline.innerHTML = timelineHtml;
        }

        // Populate Grid
        renderNewsGridOnly();

        // Generate pseudo-AI summary based on real headlines using Gemini 1.5 Pro
        if (news.length > 0 && aiText) {
            aiText.innerHTML = '<div style="display: flex; align-items: center; gap: 8px; color: var(--text2); font-size: 14px;"><div class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></div>Synthesizing global market narrative using Gemini 1.5 Pro...</div>';
            var headlinesStr = news.slice(0, 10).map(function (n) { return "- " + n.headline; }).join("\n");
            var prompt = "You are a professional financial analyst. Based on the following recent global market headlines, provide a concise, high-level 2-sentence summary of the current global market sentiment. Do not use any introductory conversational filler phrases.\n\nHeadlines:\n" + headlinesStr;

            callGeminiAPI(prompt, "gemini-1.5-pro").then(function (analysis) {
                // remove asterisks if gemini returns bold markdown
                var cleanText = analysis.replace(/\*\*/g, '').replace(/\*/g, '').trim();
                aiText.innerHTML = "<strong>Gemini AI Market Intelligence (Pro):</strong> " + cleanText;
            });
        }
    });
}

// Global article cache for click handling
window._newsArticleCache = [];

// Attach to window so onclick inline strings can call it
window.openNewsModal = function (idx) {
    try {
        var n = window._newsArticleCache[idx];
        if (!n) return;
        var modal = document.getElementById('news-modal');
        var body = document.getElementById('news-modal-body');

        var date = new Date(n.datetime * 1000).toLocaleDateString();

        var html = '<div class="nm-body">';
        if (n.image) {
            html += '  <div class="nm-cover" style="height: 200px; background-image: url(\'' + n.image + '\'); background-size: cover; background-position: center; border-radius: 8px; margin-bottom: 20px;"></div>';
        }
        html += '  <div class="nm-meta"><span class="nm-source">' + (n.source || 'News') + '</span><span>' + date + '</span></div>';
        html += '  <div class="nm-title" style="font-weight: 900; font-size: 22px; margin-bottom: 12px;">' + n.headline + '</div>';
        html += '  <div class="nm-desc" style="font-size: 15px; color: var(--text2); line-height: 1.6; margin-bottom: 20px;">' + (n.summary || 'Traders are monitoring the situation closely.') + '</div>';

        html += '  <div class="nm-keypoints" style="background: rgba(232, 134, 58, 0.1); border: 1px solid rgba(232, 134, 58, 0.3); padding: 16px; border-radius: 8px;">';
        html += '    <h4 style="color: var(--primary); margin-bottom: 8px;">✨ Gemini AI Impact Prediction</h4>';
        html += '    <div id="modal-gemini-prediction" style="font-size: 14px; color: var(--text); line-height: 1.5; margin: 0;">';
        html += '       <div style="display: flex; align-items: center; gap: 8px; color: var(--text2);"><div class="spinner" style="width: 12px; height: 12px; border-width: 2px; border-top-color: var(--primary);"></div>Generating impact prediction...</div>';
        html += '    </div>';
        html += '  </div>';
        html += '</div>';
        html += '<div class="nm-footer">';
        if (n.url && n.url !== '#') html += '  <a href="' + n.url + '" target="_blank" class="btn-primary" style="text-decoration:none; text-align: center;">Read Original Article ↗</a>';
        html += '</div>';

        body.innerHTML = html;
        modal.classList.add('show');

        // Fetch Individual Prediction using Gemini 1.5 Flash
        var prompt = "You are a Wall Street quantitative analyst. Provide a brief, authoritative 1-sentence prediction on how the following news event will directly impact the financial markets or specific sectors. Do not use filler words.\n\nEvent title: " + n.headline + "\nEvent summary: " + (n.summary || "No summary");
        callGeminiAPI(prompt, "gemini-1.5-flash").then(function (prediction) {
            var pBox = document.getElementById('modal-gemini-prediction');
            if (pBox) {
                var cleanText = prediction.replace(/\*\*/g, '').replace(/\*/g, '').trim();
                pBox.innerHTML = cleanText;
            }
        });

    } catch (e) {
        console.error('Error opening news modal', e);
    }
};

window.closeNewsModal = function () {
    var modal = document.getElementById('news-modal');
    if (modal) modal.classList.remove('show');
};

function drawNewsCards(articles, container) {
    if (!articles || !articles.length) {
        container.innerHTML = '<div style="color:var(--text3); font-size:13px; padding:10px 0;">No articles found for this timeframe.</div>';
        return;
    }

    // Store articles in a global cache so we can retrieve them safely by index
    var startIdx = window._newsArticleCache.length;
    articles.forEach(function (a) { window._newsArticleCache.push(a); });

    container.innerHTML = articles.map(function (n, i) {
        var date = new Date(n.datetime * 1000).toLocaleDateString();
        var idx = startIdx + i;
        var linkHtml = (n.url && n.url !== '#') ? '<a href="' + n.url + '" target="_blank" style="color:var(--primary);font-size:12px;text-decoration:none" onclick="event.stopPropagation()">Read article ↗</a>' : '';
        var imgHtml = n.image ? '<div class="news-card-img" style="height: 140px; background-image: url(\'' + n.image + '\'); background-size: cover; background-position: center; border-radius: 6px; margin-bottom: 12px;"></div>' : '';

        return '<div class="news-card" style="display: flex; flex-direction: column; gap: 8px; cursor: pointer; padding: 16px; background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; transition: transform 0.2s, box-shadow 0.2s;" onclick="window.openNewsModal(' + idx + ')">' +
            imgHtml +
            '<div class="news-meta" style="font-size: 12px; color: var(--text3); display: flex; justify-content: space-between;"><span class="news-source" style="font-weight: 700; color: var(--primary); text-transform: uppercase;">' + (n.source || 'News') + '</span><span>' + date + '</span></div>' +
            '<div class="news-title" style="font-weight: 800; font-size: 16px; color: var(--text); line-height: 1.4;">' + n.headline + '</div>' +
            '<div class="news-summary" style="font-size: 13px; color: var(--text2); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">' + (n.summary || '') + '</div>' +
            '<div style="background: rgba(42, 109, 191, 0.1); padding: 8px 12px; border-radius: 6px; border-left: 3px solid var(--teal); margin-top: auto; font-size: 12px; color: var(--text);"><span style="color: var(--teal); font-weight: bold;">✨ AI:</span> Potential market influence detected.</div>' +
            '<div style="margin-top: 12px;">' + linkHtml + '</div>' +
            '</div>';
    }).join('');
}

function fetchQuote(symbol) {
    return apiFetch('/quote?symbol=' + symbol).then(function (d) {
        if (d && d.c) {
            G.priceCache[symbol] = d;
            return d;
        } else {
            // Finnhub sometimes returns 0 for c on free tier or certain symbols
            return fallbackQuote(symbol);
        }
    }).catch(function () {
        return fallbackQuote(symbol);
    });
}

function fallbackQuote(symbol) {
    var pop = POPULAR.find(function (s) { return s.symbol === symbol; });
    var base = pop ? pop.base : 100;
    // Add realistic random slight variation
    var price = base * (0.95 + Math.random() * 0.1);
    var q = { c: price, d: 0, dp: 0, h: price * 1.01, l: price * 0.99, o: price, pc: base };
    G.priceCache[symbol] = q;
    return q;
}

function fetchAllPrices() {
    var symsSet = {};
    POPULAR.forEach(function (s) { symsSet[s.symbol] = true; });
    G.scenarios.forEach(function (sc) { Object.keys(sc.portfolio).forEach(function (s) { symsSet[s] = true; }); });
    var syms = Object.keys(symsSet);
    var chain = Promise.resolve();
    syms.forEach(function (sym) {
        chain = chain.then(function () { return fetchQuote(sym); }).then(function () { return sleep(120); });
    });
    return chain.then(function () {
        refreshAllPriceUI(); updateSidebar();
        if (document.getElementById('view-dashboard').classList.contains('active')) renderDashboard();
    });
}

function fetchCandles(symbol, resolution, from, to) {
    if (G.demoMode) return Promise.resolve(generateDemoCandles(symbol, resolution, from, to));

    return apiFetch('/stock/candle?symbol=' + symbol + '&resolution=' + resolution + '&from=' + from + '&to=' + to)
        .then(function (data) {
            // Finnhub returns s: "no_data" if outside trading hours or free tier limit hit
            if (!data || data.s !== 'ok' || !data.t || !data.t.length) {
                return generateDemoCandles(symbol, resolution, from, to);
            }
            return data;
        })
        .catch(function () {
            return generateDemoCandles(symbol, resolution, from, to);
        });
}

function searchSymbols(q) {
    q = q.toLowerCase();

    // 1. Always do a local "Smart / Natural Language" search first
    var localMatches = POPULAR.filter(function (s) {
        var inSym = s.symbol.toLowerCase().indexOf(q) >= 0;
        var inName = s.name.toLowerCase().indexOf(q) >= 0;
        var inKeywords = s.keywords && s.keywords.toLowerCase().indexOf(q) >= 0;
        return inSym || inName || inKeywords;
    }).map(function (s) { return { symbol: s.symbol, description: s.name, type: 'Common Stock' }; });

    if (G.demoMode) {
        return Promise.resolve(localMatches);
    }

    // 2. In live mode, combine local smart matches with Finnhub's text search
    return apiFetch('/search?q=' + encodeURIComponent(q)).then(function (d) {
        var apiResults = d.result || [];
        // Optional: remove duplicates if a local match is also in API results
        var localSyms = localMatches.map(function (m) { return m.symbol; });
        var filteredApi = apiResults.filter(function (r) { return localSyms.indexOf(r.symbol) === -1; });
        return localMatches.concat(filteredApi);
    }).catch(function () { return localMatches; });
}

function fetchProfile(symbol) {
    if (G.demoMode) return Promise.resolve(DEMO_PROFILES[symbol] || { name: symbol, exchange: 'NASDAQ', finnhubIndustry: 'Technology', currency: 'USD' });
    return apiFetch('/stock/profile2?symbol=' + symbol).catch(function () { return {}; });
}

function fetchMetrics(symbol) {
    if (G.demoMode) {
        var q = G.priceCache[symbol], p = DEMO_PROFILES[symbol] || {};
        return Promise.resolve({ '52WeekHigh': q ? q.c * 1.15 : 0, '52WeekLow': q ? q.c * 0.72 : 0, peNormalizedAnnual: 18 + Math.random() * 20, marketCapitalization: (p.marketCap || 100e9) / 1e6, beta: 0.8 + Math.random() * 0.8 });
    }
    return apiFetch('/stock/metric?symbol=' + symbol + '&metric=all').then(function (d) { return d.metric || {}; }).catch(function () { return {}; });
}

/* ============================================================
   WEBSOCKET
   ============================================================ */
function connectWS() {
    if (G.demoMode) return;
    try {
        if (G.ws) G.ws.close();
        var ws = new WebSocket('wss://ws.finnhub.io?token=' + G.apiKey);
        ws.onopen = function () {
            POPULAR.slice(0, 10).forEach(function (s) { ws.send(JSON.stringify({ type: 'subscribe', symbol: s.symbol })); });
            G.scenarios.forEach(function (sc) { Object.keys(sc.portfolio).forEach(function (sym) { ws.send(JSON.stringify({ type: 'subscribe', symbol: sym })); }); });
        };
        ws.onmessage = function (ev) {
            var msg = JSON.parse(ev.data);
            if (msg.type !== 'trade' || !msg.data) return;
            msg.data.forEach(function (t) {
                var sym = t.s, prev = G.priceCache[sym];
                if (prev) { var old = prev.c; prev.c = t.p; prev.d = t.p - prev.pc; prev.dp = ((t.p - prev.pc) / prev.pc) * 100; flashEl('price-' + sym, t.p > old ? 'green' : 'red'); }
                else G.priceCache[sym] = { c: t.p, d: 0, dp: 0, h: t.p, l: t.p, o: t.p, pc: t.p };
            });
            refreshAllPriceUI(); updateSidebar();
            if (S_currentStock && msg.data.some(function (t) { return t.s === S_currentStock; }) && document.getElementById('view-stock').classList.contains('active')) {
                var q = G.priceCache[S_currentStock]; if (q) updateDetailPrice(q);
            }
        };
        ws.onerror = function () { };
        ws.onclose = function () { setTimeout(connectWS, 30000); };
        G.ws = ws;
    } catch (e) { console.warn('WS failed', e); }
}

/* ============================================================
   PRICE HELPERS
   ============================================================ */
function getPrice(sym) { return G.priceCache[sym] ? G.priceCache[sym].c : 0; }
function holdingsValue() { var s = 0; for (var sym in A.portfolio) { s += A.portfolio[sym].shares * getPrice(sym); } return s; }
function totalValue() { return A.cash + holdingsValue(); }
function gainLoss() { return totalValue() - A.budget; }
function gainLossPct() { return (gainLoss() / A.budget) * 100; }

/* ============================================================
   SIDEBAR
   ============================================================ */
function updateSidebar() {
    setText('sidebar-cash', fmt(A.cash));
    setText('sidebar-total', 'Total: ' + fmt(totalValue()));
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard() {
    var gl = gainLoss(), glp = gainLossPct(), hv = holdingsValue(), tv = totalValue();
    setText('stat-total', fmt(tv)); setText('stat-cash', fmt(A.cash));
    setText('stat-holdings', fmt(hv)); setText('stat-gl', fmt(gl));
    var c = gl >= 0 ? 'var(--green)' : 'var(--red)';
    setEl('stat-total-sub', '<span style="color:' + c + '">' + (gl >= 0 ? '▲' : '▼') + ' ' + fmt(Math.abs(gl)) + ' all-time</span>');
    setEl('stat-holdings-sub', '<span style="color:var(--text3)">' + Object.keys(A.portfolio).length + ' position(s)</span>');
    setEl('stat-gl-sub', '<span style="color:' + c + '">' + (gl >= 0 ? '+' : '') + glp.toFixed(2) + '% return</span>');
    renderTopHoldings(); renderMarketOverview(); renderPortfolioChart();
}

function renderTopHoldings() {
    var el = document.getElementById('top-holdings');
    var pos = Object.entries(A.portfolio);
    if (!pos.length) { el.innerHTML = '<div class="empty-state" style="padding:30px 0"><div class="es-icon">📭</div><h3>No Holdings Yet</h3><p>Go to Market to buy your first stock</p></div>'; return; }
    pos.sort(function (a, b) { return (b[1].shares * getPrice(b[0])) - (a[1].shares * getPrice(a[0])); });
    el.innerHTML = pos.slice(0, 5).map(function (e) {
        var sym = e[0], p = e[1], price = getPrice(sym), val = p.shares * price, gl = val - p.cost, glp2 = p.cost ? gl / p.cost * 100 : 0, up = gl >= 0;
        return '<div class="stock-item" onclick="openStock(\'' + sym + '\')"><span class="si-ticker">' + sym + '</span><span class="si-name">' + p.shares + ' shares</span><div style="text-align:right"><div class="si-price">' + fmt(val) + '</div><div class="si-change ' + (up ? 'positive' : 'negative') + '">' + (up ? '+' : '') + glp2.toFixed(2) + '%</div></div></div>';
    }).join('');
}

function renderMarketOverview() {
    document.getElementById('market-overview').innerHTML = POPULAR.slice(0, 10).map(function (s) { return stockRow(s.symbol, s.name); }).join('');
}

function renderPortfolioChart() {
    var c = document.getElementById('portfolio-chart'); c.innerHTML = '';
    if (A.portfolioHistory.length < 2) { c.innerHTML = '<div class="loading-overlay" style="padding:30px">Not enough data yet — check back later</div>'; return; }
    var chart = LightweightCharts.createChart(c, chartOpts(c));
    chart.addAreaSeries({ lineColor: '#e8863a', topColor: 'rgba(232,134,58,0.3)', bottomColor: 'rgba(232,134,58,0)', lineWidth: 2 })
        .setData(A.portfolioHistory.map(function (p) { return { time: Math.floor(p.time / 1000), value: p.value }; }));
    chart.timeScale().fitContent();
}

/* ============================================================
   MARKET LIST & SPARK-LINES
   ============================================================ */
function renderSparkline(canvasId, data, color) {
    var c = document.getElementById(canvasId);
    if (!c) return;
    var ctx = c.getContext('2d');
    var w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    if (!data || data.length < 2) return;

    var min = Math.min.apply(null, data);
    var max = Math.max.apply(null, data);
    var range = max - min || 1;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';

    for (var i = 0; i < data.length; i++) {
        var x = (i / (data.length - 1)) * w;
        var y = h - ((data[i] - min) / range) * h * 0.8 - h * 0.1;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
}

function getTimeframeDates(tf) {
    var now = Math.floor(Date.now() / 1000), day = 86400;
    var from, res;
    switch (tf) {
        case '1D': from = now - day; res = '5'; break;
        case '1W': from = now - day * 7; res = '30'; break;
        case '1M': from = now - day * 30; res = '60'; break;
        case '3M': from = now - day * 90; res = 'D'; break;
        case '1Y': from = now - day * 365; res = 'W'; break;
        default: from = now - day * 7; res = '30';
    }
    return { from: from, to: now, res: res };
}

function sortAndRenderMarket(stocks, containerId, title) {
    var sort = document.getElementById('market-sort') ? document.getElementById('market-sort').value : 'growth-desc';
    var tf = document.getElementById('market-timeframe') ? document.getElementById('market-timeframe').value : '1W';
    var dates = getTimeframeDates(tf);

    var enriched = stocks.map(function (s) {
        var sym = s.symbol || s;
        var name = s.name || s.description || sym;
        // Always use fast local generator for sparklines to prevent Finnhub rate limits on 20+ list items
        var mock = generateDemoCandles(sym, dates.res, dates.from, dates.to);
        var candles = mock.c;
        var price = G.priceCache[sym] ? G.priceCache[sym].c : candles[candles.length - 1];
        var growth = 0;

        if (candles.length > 2) {
            var first = candles[0];
            growth = ((price - first) / first) * 100;
        }
        return { symbol: sym, name: name, price: price, growth: growth, candles: candles };
    });

    // Sorting
    enriched.sort(function (a, b) {
        if (sort === 'growth-desc') return b.growth - a.growth;
        if (sort === 'growth-asc') return a.growth - b.growth;
        if (sort === 'price-desc') return b.price - a.price;
        if (sort === 'price-asc') return a.price - b.price;
        if (sort === 'name-asc') return a.name.localeCompare(b.name);
        return 0;
    });

    var html = '<div class="card"><div class="section-title">' + title + '</div><div class="stock-list">';
    html += enriched.map(function (s) {
        var p = fmt(s.price);
        var dp = s.growth;
        var ch = dp !== null ? '<span class="' + (dp >= 0 ? 'positive' : 'negative') + '">' + (dp >= 0 ? '+' : '') + dp.toFixed(2) + '%</span>' : '<span style="color:var(--text3)">—</span>';
        var canvas = '<canvas id="spark-' + s.symbol + '" class="si-sparkline" width="60" height="24"></canvas>';
        return '<div class="stock-item" onclick="openStock(\'' + s.symbol + '\')" id="row-' + s.symbol + '"><span class="si-ticker">' + s.symbol + '</span><span class="si-name">' + s.name + '</span>' + canvas + '<span class="si-price" id="price-' + s.symbol + '">' + p + '</span><span class="si-change">' + ch + '</span></div>';
    }).join('');
    html += '</div></div>';

    document.getElementById(containerId).innerHTML = html;

    // Draw canvases
    enriched.forEach(function (s) {
        var color = s.growth >= 0 ? '#00e676' : '#ff6b6b';
        renderSparkline('spark-' + s.symbol, s.candles, color);
    });
}

function renderMarketList() {
    document.getElementById('search-results').innerHTML = '<div class="loading-overlay"><div class="spinner"></div>Sorting...</div>';
    setTimeout(function () {
        sortAndRenderMarket(POPULAR, 'search-results', 'Popular Stocks');
    }, 10);
}

/* ============================================================
   SEARCH
   ============================================================ */
var searchTimer = null;
function handleSearch(q) {
    clearTimeout(searchTimer); q = q.trim();
    if (!q) return renderMarketList();
    searchTimer = setTimeout(function () {
        document.getElementById('search-results').innerHTML = '<div class="loading-overlay"><div class="spinner"></div>Searching…</div>';
        searchSymbols(q).then(function (results) {
            var equity = results.filter(function (r) { return r.type === 'Common Stock'; }).slice(0, 20);
            if (!equity.length) { document.getElementById('search-results').innerHTML = '<div class="empty-state"><div class="es-icon">🔍</div><h3>No results</h3><p>Try a different search</p></div>'; return; }

            sortAndRenderMarket(equity, 'search-results', 'Results for "' + q + '"');

            if (!G.demoMode) {
                var chain2 = Promise.resolve();
                equity.slice(0, 8).forEach(function (r) { if (!G.priceCache[r.symbol]) chain2 = chain2.then(function () { return fetchQuote(r.symbol); }); });
                chain2.then(refreshAllPriceUI);
            }
        });
    }, 400);
}

/* ============================================================
   STOCK DETAIL
   ============================================================ */
function openStock(symbol) {
    navigate('stock'); S_currentStock = symbol;
    setText('det-symbol', symbol); setText('det-name', 'Loading…');
    setText('det-exchange', ''); setText('det-price', '—'); setText('det-change', '—');
    document.getElementById('stock-chart').innerHTML = '<div class="loading-overlay"><div class="spinner"></div>Loading chart…</div>';
    document.getElementById('key-stats').innerHTML = '';
    document.getElementById('trade-note').textContent = '';
    setTradeMode('buy'); document.getElementById('shares-input').value = 1;

    if (G.demoMode && !G.priceCache[symbol]) {
        var base = 50 + Math.random() * 300;
        G.simBasePrices[symbol] = base;
        G.priceCache[symbol] = { c: base, o: base, h: base * 1.01, l: base * 0.99, pc: base, d: 0, dp: 0 };
    }

    Promise.all([fetchProfile(symbol), fetchMetrics(symbol), G.demoMode ? Promise.resolve(G.priceCache[symbol]) : fetchQuote(symbol)])
        .then(function (res) {
            var profile = res[0], metrics = res[1], quote = res[2];
            setText('det-name', profile.name || symbol);
            setText('det-exchange', profile.exchange ? (profile.exchange + ' · ' + (profile.finnhubIndustry || '')) : '');
            if (quote && quote.c) { if (!G.demoMode) G.priceCache[symbol] = quote; updateDetailPrice(G.priceCache[symbol]); }
            renderKeyStats(G.priceCache[symbol], metrics, profile);
            updateTradeSummary();
            loadDetailChart(symbol, '1D');
            if (!G.demoMode && G.ws && G.ws.readyState === WebSocket.OPEN) G.ws.send(JSON.stringify({ type: 'subscribe', symbol: symbol }));
        });
}

function updateDetailPrice(q) {
    setText('det-price', fmt(q.c));
    var up = q.dp >= 0, col = up ? 'var(--green)' : 'var(--red)';
    setEl('det-change', '<span style="color:' + col + '">' + (up ? '+' : '') + fmt(Math.abs(q.d)) + ' (' + (up ? '+' : '') + q.dp.toFixed(2) + '%)</span>');
    updateTradeSummary();
}

function renderKeyStats(q, m, profile) {
    var rows = [];
    if (q) { rows.push(['Current Price', fmt(q.c)], ['Open', fmt(q.o)], ['High', fmt(q.h)], ['Low', fmt(q.l)], ['Prev. Close', fmt(q.pc)]); }
    if (m['52WeekHigh']) rows.push(['52-Week High', fmt(m['52WeekHigh'])]);
    if (m['52WeekLow']) rows.push(['52-Week Low', fmt(m['52WeekLow'])]);
    if (m.peNormalizedAnnual) rows.push(['P/E Ratio', m.peNormalizedAnnual.toFixed(2)]);
    if (m.marketCapitalization) rows.push(['Market Cap', fmtBig(m.marketCapitalization * 1e6)]);
    if (m.beta) rows.push(['Beta', m.beta.toFixed(2)]);
    if (profile.currency) rows.push(['Currency', profile.currency]);
    var h = A.portfolio[S_currentStock];
    if (h) { rows.push(['Your Shares', h.shares], ['Avg. Cost', fmt(h.avgPrice)], ['Your Value', fmt(h.shares * getPrice(S_currentStock))]); }
    document.getElementById('key-stats').innerHTML = rows.map(function (r) { return '<div class="stat-row"><span class="key">' + r[0] + '</span><span class="val">' + r[1] + '</span></div>'; }).join('');
}

/* ============================================================
   CHART
   ============================================================ */
var currentTimeBtn = null;
function setTimeFrame(tf, btn) {
    if (currentTimeBtn) currentTimeBtn.classList.remove('active');
    btn.classList.add('active'); currentTimeBtn = btn;
    loadDetailChart(S_currentStock, tf);
}

function loadDetailChart(symbol, tf) {
    var c = document.getElementById('stock-chart');
    c.innerHTML = '<div class="loading-overlay"><div class="spinner"></div>Loading…</div>';
    document.getElementById('company-news-log').innerHTML = ''; // Clear old news
    var now = Math.floor(Date.now() / 1000), day = 86400;
    var from, res;
    switch (tf) { case '1D': from = now - day; res = '5'; break; case '1W': from = now - day * 7; res = '30'; break; case '1M': from = now - day * 30; res = '60'; break; case '3M': from = now - day * 90; res = 'D'; break; case '1Y': from = now - day * 365; res = 'W'; break; default: from = now - day; res = '5'; }
    fetchCandles(symbol, res, from, now).then(function (data) {
        c.innerHTML = '';
        if (!data || data.s !== 'ok' || !data.t || !data.t.length) { c.innerHTML = '<div class="loading-overlay">No chart data available</div>'; return; }
        var chart = LightweightCharts.createChart(c, chartOpts(c));
        if (S_detailChart) { try { S_detailChart.remove(); } catch (e) { } }
        S_detailChart = chart;
        var seriesData = data.t.map(function (t, i) { return { time: t, value: data.c[i] }; }).sort(function (a, b) { return a.time - b.time; });
        var areaSeries = chart.addAreaSeries({ lineColor: '#e8863a', topColor: 'rgba(232,134,58,0.28)', bottomColor: 'rgba(232,134,58,0)', lineWidth: 2 });
        areaSeries.setData(seriesData);
        chart.timeScale().fitContent();

        // ── FETCH & RENDER COMPANY NEWS MARKERS ──
        // Only fetch news for timeframes 1W and above to avoid cluttering 1D intraday
        if (tf !== '1D') {
            // Finnhub uses YYYY-MM-DD for /company-news
            var dFrom = new Date(from * 1000).toISOString().split('T')[0];
            var dTo = new Date(now * 1000).toISOString().split('T')[0];

            fetchCompanyNews(symbol, dFrom, dTo).then(function (news) {
                if (!news || !news.length) return;

                var markers = [];
                var mappedArticles = [];
                var usedTimes = {};

                news.forEach(function (article) {
                    var t = article.datetime;
                    var closestIdx = 0;
                    var minDiff = Infinity;
                    for (var k = 0; k < seriesData.length; k++) {
                        var diff = Math.abs(seriesData[k].time - t);
                        if (diff < minDiff) { minDiff = diff; closestIdx = k; }
                    }
                    var closestCandle = seriesData[closestIdx];
                    var cTime = closestCandle.time;

                    // Nudge time forward safely if collision exists
                    while (usedTimes[cTime]) { cTime += 1; }
                    usedTimes[cTime] = true;

                    markers.push({
                        time: cTime,
                        position: 'inBar',
                        color: '#ffeb3b',
                        shape: 'circle'
                    });

                    mappedArticles.push({
                        time: cTime,
                        price: closestCandle.value,
                        image: article.image || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=200&h=150'
                    });
                });

                markers.sort(function (a, b) { return a.time - b.time; });
                areaSeries.setMarkers(markers);

                // --- DOM THUMBNAILS OVERLAY ---
                var tbWrapper = document.createElement('div');
                tbWrapper.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:9';
                c.appendChild(tbWrapper);

                var domElements = mappedArticles.map(function (ma) {
                    // Create main thumbnail
                    var el = document.createElement('div');
                    el.className = 'chart-thumbnail';
                    el.style.backgroundImage = 'url("' + ma.image + '")';
                    tbWrapper.appendChild(el);

                    // Create dashed connector line
                    var connector = document.createElement('div');
                    connector.className = 'thumbnail-connector';
                    tbWrapper.appendChild(connector);

                    return { el: el, connector: connector, data: ma };
                });

                function syncThumbnails() {
                    var THUMB_W = 65; // min pixels between thumb centers
                    var THUMB_H = 48;
                    // Calculate raw coordinates
                    domElements.forEach(function (item) {
                        item.rawX = chart.timeScale().timeToCoordinate(item.data.time);
                        item.rawY = areaSeries.priceToCoordinate(item.data.price);
                        item.finalX = item.rawX;
                        item.finalY = item.rawY - THUMB_H; // always float above the dot
                        item.isOffset = false;
                    });

                    // Sort left to right
                    var sorted = domElements.slice().sort(function (a, b) { return (a.rawX || 0) - (b.rawX || 0); });

                    // Collision resolution: spread left/right
                    for (var i = 1; i < sorted.length; i++) {
                        for (var j = 0; j < i; j++) {
                            var dx = Math.abs(sorted[i].finalX - sorted[j].finalX);
                            var dy = Math.abs(sorted[i].finalY - sorted[j].finalY);
                            if (dx < THUMB_W && dy < THUMB_H) {
                                // Push alternately left/right from the cluster center
                                var direction = (i % 2 === 0) ? -1 : 1;
                                sorted[i].finalX = sorted[j].finalX + (direction * THUMB_W);
                                sorted[i].finalY = sorted[j].finalY - 15; // slight vertical stagger too
                                sorted[i].isOffset = true;
                            }
                        }
                    }

                    // Render positions
                    domElements.forEach(function (item) {
                        if (item.rawX === null || item.rawY === null || item.rawX < 0 || item.rawX > c.clientWidth) {
                            item.el.style.opacity = '0';
                            item.connector.style.opacity = '0';
                        } else {
                            item.el.style.opacity = '1';
                            item.el.style.left = item.finalX + 'px';
                            item.el.style.top = item.finalY + 'px';

                            if (item.isOffset) {
                                item.connector.style.opacity = '1';
                                // Connector goes from the thumbnail to the original dot
                                var cLeft = Math.min(item.finalX, item.rawX);
                                var cTop = Math.min(item.finalY + THUMB_H, item.rawY);
                                var cHeight = Math.abs(item.rawY - (item.finalY + THUMB_H));
                                // For horizontal offsets, draw from finalX down to rawX using absolute positioning
                                item.connector.style.left = item.rawX + 'px';
                                item.connector.style.top = (item.finalY + THUMB_H) + 'px';
                                item.connector.style.height = cHeight + 'px';
                            } else {
                                item.connector.style.opacity = '0';
                            }
                        }
                    });
                }

                // Cleanup old listeners if they exist
                if (c._syncThumbnailsCallback) {
                    try {
                        chart.timeScale().unsubscribeVisibleLogicalRangeChange(c._syncThumbnailsCallback);
                        chart.timeScale().unsubscribeSizeChange(c._syncThumbnailsCallback);
                    } catch (e) { }
                }
                c._syncThumbnailsCallback = syncThumbnails;

                chart.timeScale().subscribeVisibleLogicalRangeChange(syncThumbnails);
                chart.timeScale().subscribeSizeChange(syncThumbnails);
                setTimeout(syncThumbnails, 50);

                // Render text log below chart using safe cache approach
                var logStartIdx = window._newsArticleCache.length;
                news.slice(0, 6).forEach(function (a) { window._newsArticleCache.push(a); });
                var logHtml = '<div class="card mt20"><div class="section-title">Company Event Log</div><div class="news-grid">';
                logHtml += news.slice(0, 6).map(function (n, i) {
                    var date = new Date(n.datetime * 1000).toLocaleDateString();
                    var idx = logStartIdx + i;
                    return '<div class="news-card" style="cursor:pointer" onclick="window.openNewsModal(' + idx + ')"><div class="news-meta"><span class="news-source">' + (n.source || 'News') + '</span><span>' + date + '</span></div><div class="news-title">' + n.headline + '</div><div class="news-summary">' + (n.summary || '') + '</div></div>';
                }).join('');
                logHtml += '</div></div>';
                document.getElementById('company-news-log').innerHTML = logHtml;
            });
        }
    });
}

function chartOpts(c) {
    return { width: c.clientWidth, height: c.clientHeight, layout: { background: { color: 'transparent' }, textColor: 'rgba(238,240,255,0.55)' }, grid: { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } }, crosshair: { mode: LightweightCharts.CrosshairMode.Normal }, rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)' }, timeScale: { borderColor: 'rgba(255,255,255,0.08)', timeVisible: true }, handleScale: true, handleScroll: true };
}

/* ============================================================
   TRADING ENGINE
   ============================================================ */
function setTradeMode(mode) {
    S_tradeMode = mode;
    document.getElementById('tab-buy').classList.toggle('active', mode === 'buy');
    document.getElementById('tab-sell').classList.toggle('active', mode === 'sell');
    var btn = document.getElementById('execute-btn');
    btn.className = 'btn-execute ' + mode;
    btn.textContent = mode === 'buy' ? 'Buy Shares' : 'Sell Shares';
    updateTradeSummary();
}

function adjustShares(delta) {
    var input = document.getElementById('shares-input');
    input.value = Math.max(0.001, (parseFloat(input.value) || 0) + delta);
    updateTradeSummary();
}

function updateTradeSummary() {
    var sym = S_currentStock, price = sym ? getPrice(sym) : 0;
    var shares = parseFloat(document.getElementById('shares-input').value) || 0;
    var total = price * shares;
    var after = S_tradeMode === 'buy' ? A.cash - total : A.cash + total;
    setText('ts-price', fmt(price)); setText('ts-shares', shares.toLocaleString());
    setText('ts-total', fmt(total));
    var ael = document.getElementById('ts-after');
    ael.textContent = fmt(after); ael.style.color = after < 0 ? 'var(--red)' : '';
    var note = document.getElementById('trade-note');
    var h = A.portfolio[sym];
    note.textContent = S_tradeMode === 'sell' && h ? 'You own ' + h.shares + ' share(s)' : S_tradeMode === 'buy' ? 'Available: ' + fmt(A.cash) : '';
}

function executeTrade() {
    var sym = S_currentStock, price = getPrice(sym);
    var shares = parseFloat(document.getElementById('shares-input').value);
    if (!sym || !price) return showToast('No price available', 'error');
    if (!shares || shares <= 0) return showToast('Enter a valid share count', 'error');
    var total = price * shares;

    if (S_tradeMode === 'buy') {
        if (total > A.cash) return showToast('Insufficient funds — need ' + fmt(total), 'error');
        A.cash -= total;
        var prev = A.portfolio[sym];
        if (prev) { var ns = prev.shares + shares; prev.avgPrice = (prev.cost + total) / ns; prev.shares = ns; prev.cost += total; }
        else A.portfolio[sym] = { shares: shares, avgPrice: price, cost: total };
        showToast('✅ Bought ' + shares + ' share(s) of ' + sym + ' @ ' + fmt(price), 'success');
    } else {
        var pos = A.portfolio[sym];
        if (!pos || pos.shares < shares) return showToast('You only own ' + (pos ? pos.shares : 0) + ' share(s)', 'error');
        A.cash += total; pos.shares -= shares; pos.cost -= shares * pos.avgPrice;
        if (pos.shares <= 0.0001) delete A.portfolio[sym];
        showToast('💰 Sold ' + shares + ' share(s) of ' + sym + ' @ ' + fmt(price), 'success');
    }

    A.transactions.unshift({ type: S_tradeMode, symbol: sym, shares: shares, price: price, total: total, date: Date.now() });
    recordPortfolioSnapshot(); saveState(); updateSidebar(); updateTradeSummary(); renderScenarioSelector();
    if (S_tradeMode === 'buy' && !G.demoMode && G.ws && G.ws.readyState === WebSocket.OPEN)
        G.ws.send(JSON.stringify({ type: 'subscribe', symbol: sym }));
}

/* ============================================================
   PORTFOLIO VIEW
   ============================================================ */
function renderPortfolio() {
    var el = document.getElementById('portfolio-content'), pos = Object.entries(A.portfolio);
    var table = pos.length
        ? '<div class="card mb20"><div class="section-title">Holdings <span class="tag" style="background:' + A.color + ';color:#000;border:none">' + A.name + '</span></div><table class="holdings-table"><thead><tr><th>Symbol</th><th>Shares</th><th>Avg. Cost</th><th>Current Price</th><th>Value</th><th>Gain / Loss</th></tr></thead><tbody>' + pos.map(function (e) {
            var sym = e[0], p = e[1], price = getPrice(sym), val = p.shares * price, gl = val - p.cost, glp2 = p.cost ? gl / p.cost * 100 : 0, up = gl >= 0, col = up ? 'var(--green)' : 'var(--red)';
            return '<tr onclick="openStock(\'' + sym + '\')"><td><strong>' + sym + '</strong></td><td>' + p.shares.toLocaleString() + '</td><td>' + fmt(p.avgPrice) + '</td><td>' + fmt(price) + '</td><td><strong>' + fmt(val) + '</strong></td><td style="color:' + col + '">' + (up ? '+' : '') + fmt(gl) + ' (' + (up ? '+' : '') + glp2.toFixed(2) + '%)</td></tr>';
        }).join('') + '</tbody></table></div>'
        : '<div class="card mb20"><div class="empty-state"><div class="es-icon">💼</div><h3>No Holdings Yet</h3><p>Head to the Market and buy your first stock!</p></div></div>';

    var txHTML = A.transactions.length
        ? '<div class="card"><div class="section-title">Recent Transactions</div><table class="holdings-table"><thead><tr><th>Date</th><th>Type</th><th>Symbol</th><th>Shares</th><th>Price</th><th>Total</th></tr></thead><tbody>' + A.transactions.slice(0, 50).map(function (tx) {
            var up = tx.type === 'buy', col = up ? 'var(--green)' : 'var(--red)';
            return '<tr><td style="color:var(--text3)">' + new Date(tx.date).toLocaleString() + '</td><td><span class="badge ' + (up ? 'up' : 'down') + '">' + tx.type.toUpperCase() + '</span></td><td><strong>' + tx.symbol + '</strong></td><td>' + tx.shares + '</td><td>' + fmt(tx.price) + '</td><td style="color:' + col + '">' + (up ? '-' : '+') + fmt(tx.total) + '</td></tr>';
        }).join('') + '</tbody></table></div>'
        : '<div class="card"><div class="empty-state"><div class="es-icon">📋</div><h3>No Transactions Yet</h3></div></div>';
    el.innerHTML = table + txHTML;
}

/* ============================================================
   SETTINGS
   ============================================================ */
function renderSettings() {
    var tv = totalValue(), gl = gainLoss(), glp = gainLossPct(), up = gl >= 0, col = up ? 'var(--green)' : 'var(--red)';
    var mode = G.demoMode ? '<span style="color:var(--teal)">⚡ Demo</span>' : '<span style="color:var(--green)">🔴 Live</span>';
    var email = currentUser ? currentUser.email : '—';
    var rows = [
        ['Account', '<strong>' + email + '</strong>'],
        ['Active Scenario', '<span style="color:' + A.color + ';font-weight:700">' + A.name + '</span>'],
        ['Mode', mode], ['Starting Budget', fmt(A.budget)], ['Current Cash', fmt(A.cash)],
        ['Holdings Value', fmt(holdingsValue())], ['Total Value', '<strong>' + fmt(tv) + '</strong>'],
        ['Total Gain / Loss', '<span style="color:' + col + '">' + (up ? '+' : '') + fmt(gl) + ' (' + (up ? '+' : '') + glp.toFixed(2) + '%)</span>'],
        ['# Positions', Object.keys(A.portfolio).length], ['# Transactions', A.transactions.length],
        ['# Scenarios', G.scenarios.length],
    ];
    document.getElementById('settings-summary').innerHTML = rows.map(function (r) { return '<div class="stat-row"><span class="key">' + r[0] + '</span><span class="val">' + r[1] + '</span></div>'; }).join('');

    var apiKeyStatus = document.getElementById('settings-api-status');
    var apiKeyInput = document.getElementById('new-api-key');
    if (apiKeyStatus && apiKeyInput) {
        if (G.apiKey && !G.demoMode) {
            apiKeyStatus.innerHTML = '<span style="color:var(--green)">Your API key is saved and active.</span> Paste a new one to replace it.';
            apiKeyInput.placeholder = '•••••••••••••••••••••••••';
            apiKeyInput.value = '';
        } else {
            apiKeyStatus.innerHTML = 'You are in Demo Mode. Paste an API key to go Live.';
            apiKeyInput.placeholder = 'Paste new API key';
            apiKeyInput.value = '';
        }
    }
}

function resetPortfolio() {
    var budget = parseFloat(document.getElementById('new-budget-input').value.trim());
    if (!budget || budget < 100) return showToast('Enter a budget ≥ $100', 'error');
    A.budget = budget; A.cash = budget; A.portfolio = {}; A.transactions = []; A.portfolioHistory = [];
    saveState(); updateSidebar(); renderSettings(); renderScenarioSelector();
    showToast('✅ ' + A.name + ' reset with ' + fmt(budget), 'success');
}

function updateApiKey() {
    var key = document.getElementById('new-api-key').value.trim();
    if (!key) return showToast('Enter a new API key', 'error');
    G.apiKey = key; G.demoMode = false;
    if (G.simInterval) { clearInterval(G.simInterval); G.simInterval = null; }
    saveState(true); connectWS(); fetchAllPrices();
    showToast('Switched to live mode ✓', 'success');
}

/* ============================================================
   PORTFOLIO HISTORY
   ============================================================ */
function recordPortfolioSnapshot() {
    if (!A.portfolioHistory) A.portfolioHistory = [];
    A.portfolioHistory.push({ time: Date.now(), value: totalValue() });
    if (A.portfolioHistory.length > 500) A.portfolioHistory = A.portfolioHistory.slice(-500);
    saveState();
}

/* ============================================================
   UI HELPERS
   ============================================================ */
function refreshAllPriceUI() {
    document.querySelectorAll('.stock-item[id^="row-"]').forEach(function (row) {
        var sym = row.id.replace('row-', ''), q = G.priceCache[sym];
        if (!q) return;
        var el = document.getElementById('price-' + sym);
        if (el) el.textContent = fmt(q.c);
    });
}

function flashEl(id, dir) {
    var el = document.getElementById(id); if (!el) return;
    el.classList.remove('flash-green', 'flash-red'); void el.offsetWidth;
    el.classList.add(dir === 'green' ? 'flash-green' : 'flash-red');
}

function showToast(msg, type, ms) {
    type = type || 'info'; ms = ms || 3500;
    var c = document.getElementById('toast-container'), t = document.createElement('div');
    t.className = 'toast ' + type;
    var icons = { success: '✅', error: '❌', info: 'ℹ️' };
    t.innerHTML = '<span>' + (icons[type] || 'ℹ️') + '</span><span>' + msg + '</span>';
    c.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; setTimeout(function () { t.remove(); }, 400); }, ms);
}

function setText(id, text) { var e = document.getElementById(id); if (e) e.textContent = text; }
function setEl(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function fmt(n) {
    if (n == null || isNaN(n)) return '$—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
function fmtBig(n) {
    if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    return fmt(n);
}
