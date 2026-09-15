const SUPABASE_URL = 'https://wqzllkstcbpgvnlnkurd.supabase.co';

const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_lmGYpaESsmAKWsspDyRwGQ_jrneV3U4';

if (!window.supabase) {
    throw new Error('Supabase JS library لم يتم تحميلها');
}

window.marketSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

// Load the weighted-selling extension safely.
// Never use document.write because it can replace the document while parsing.
(function loadWeightedLayer() {
    if (!document.getElementById('hamasaWeightedCss')) {
        const link = document.createElement('link');
        link.id = 'hamasaWeightedCss';
        link.rel = 'stylesheet';
        link.href = './weighted-products-ui.css';
        document.head.appendChild(link);
    }

    if (!document.getElementById('hamasaWeightedScript')) {
        const script = document.createElement('script');
        script.id = 'hamasaWeightedScript';
        script.src = './weighted-products.js';
        script.async = false;
        document.head.appendChild(script);
    }

    // Admin-only visual/UX layer. It does not change the data model.
    if (/admin\.html$/i.test(location.pathname) && !document.getElementById('hamasaAdminEnhancementsScript')) {
        const script = document.createElement('script');
        script.id = 'hamasaAdminEnhancementsScript';
        script.src = './admin-enhancements.js';
        script.async = false;
        document.head.appendChild(script);
    }
})();

document.addEventListener('DOMContentLoaded', function () {
    const W = window.HamasaWeighted;
    if (!W) {
        console.warn('Hamasa weighted layer not loaded yet');
        return;
    }

    if (typeof window.loadStoreData === 'function' && !window.loadStoreData.__weightedInit) {
        const original = window.loadStoreData;
        const wrapped = async function () {
            await original.apply(this, arguments);
            if (Array.isArray(window.products)) {
                window.products = window.products.map(p => W.normalize(p));
            }
        };
        wrapped.__weightedInit = true;
        window.loadStoreData = wrapped;
    }

    if (Array.isArray(window.products)) {
        window.products = window.products.map(p => W.normalize(p));
    }

    console.log('Hamasa weighted customer layer initialized');
}, { once: true });

console.log('Supabase initialized successfully');