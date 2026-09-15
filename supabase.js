const SUPABASE_URL = 'https://wqzllkstcbpgvnlnkurd.supabase.co';

const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_lmGYpaESsmAKWsspDyRwGQ_jrneV3U4';

if (!window.supabase) {
    throw new Error('Supabase JS library لم يتم تحميلها');
}

window.marketSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

// weighted-products.js is loaded explicitly by index.html.
// Do not use document.write here; it can replace the document during loading.

document.addEventListener('DOMContentLoaded', function () {
    const W = window.HamasaWeighted;
    if (!W) {
        console.warn('Hamasa weighted layer not loaded');
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