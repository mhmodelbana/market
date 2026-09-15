const SUPABASE_URL = 'https://wqzllkstcbpgvnlnkurd.supabase.co';

const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_lmGYpaESsmAKWsspDyRwGQ_jrneV3U4';

if (!window.supabase) {
    throw new Error('Supabase JS library لم يتم تحميلها');
}

window.marketSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

// حمّل إضافة البيع بالوزن على صفحات المتجر والإدارة.
// يتم تحميلها هنا قبل DOMContentLoaded حتى تتمكن من توحيد وظائف التطبيق الحالية.
document.write('<link rel="stylesheet" href="./weighted-products-ui.css">');
document.write('<script src="./weighted-products.js"><\/script>');

console.log('Supabase initialized successfully');
