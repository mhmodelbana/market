const SUPABASE_URL = 'https://wqzllkstcbpgvnlnkurd.supabase.co';

const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_lmGYpaESsmAKWsspDyRwGQ_jrneV3U4';

if (!window.supabase) {
    throw new Error('Supabase JS library لم يتم تحميلها');
}

window.marketSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

document.write('<link rel="stylesheet" href="./weighted-products-ui.css">');
document.write('<script src="./weighted-products.js"><\\/script>');

// مهم: weighted-products.js بيتحمل قبل كود index، لذلك طبقة العميل
// لازم تشتغل وقت DOMContentLoaded بعد تعريف وظائف index وقبل loadStoreData.
document.addEventListener('DOMContentLoaded', function () {
    const W = window.HamasaWeighted;
    if (!W) return;

    const num = v => Number(v || 0);
    const money = v => num(v).toLocaleString('en-US', { maximumFractionDigits: 2 });

    if (typeof window.loadStoreData === 'function' && !window.loadStoreData.__weightedInit) {
        const original = window.loadStoreData;
        window.loadStoreData = async function () {
            await original.apply(this, arguments);
            if (Array.isArray(window.products)) {
                window.products = window.products.map(p => W.normalize(p));
            }
        };
        window.loadStoreData.__weightedInit = true;
    }

    if (typeof window.normalizeCart === 'function' && !window.normalizeCart.__weightedInit) {
        const original = window.normalizeCart;
        window.normalizeCart = function (items = []) {
            const map = new Map();
            for (const raw of Array.isArray(items) ? items : []) {
                const item = { ...raw };
                const id = String(item.id ?? '');
                if (!id) continue;
                const key = item.weight_grams != null ? `${id}::w:${num(item.weight_grams)}` : id;
                const qty = Math.max(1, num(item.qty) || 1);
                if (!map.has(key)) map.set(key, { ...item, qty });
                else map.get(key).qty += qty;
            }
            return [...map.values()];
        };
        window.normalizeCart.__weightedInit = true;
    }

    const quantityBox = document.getElementById('productDetailsQuantityBox');
    if (quantityBox && !document.getElementById('productDetailsWeightBox')) {
        const box = document.createElement('div');
        box.id = 'productDetailsWeightBox';
        box.className = 'hidden mt-4 p-4 rounded-2xl border border-slate-200 bg-slate-50';
        box.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <div>
                    <div class="text-sm font-black text-slate-800">اختار الوزن</div>
                    <div class="text-[11px] text-slate-400">السعر بيتحسب حسب الوزن</div>
                </div>
                <b id="productDetailsWeightPrice" class="text-sm text-brand-600"></b>
            </div>
            <div id="productDetailsWeightOptions" class="grid grid-cols-2 sm:grid-cols-4 gap-2"></div>
            <div id="productDetailsCustomWeight" class="hidden mt-3 flex gap-2">
                <input id="productDetailsCustomWeightInput" type="number" min="1" step="1" placeholder="الوزن بالجرام" class="flex-1 px-3 py-2 rounded-xl border border-slate-200">
                <button type="button" id="productDetailsCustomWeightApply" class="bg-brand-600 text-white px-4 rounded-xl text-xs font-bold">تطبيق</button>
            </div>`;
        quantityBox.parentElement.parentElement.insertBefore(box, quantityBox.parentElement.nextSibling);
    }

    let selectedWeight = 0;
    function setWeight(grams) {
        selectedWeight = Math.round(grams);
        const product = W.normalize((window.products || []).find(p => String(p.id) === String(window.currentProductDetailsId)) || {});
        const price = W.priceForGrams(product, selectedWeight);
        const priceEl = document.getElementById('productDetailsWeightPrice');
        if (priceEl) priceEl.textContent = `${money(price)} ج.م`;
        document.querySelectorAll('#productDetailsWeightOptions button').forEach(btn => {
            btn.classList.toggle('active', Number(btn.dataset.grams) === selectedWeight);
        });
        const qty = document.getElementById('productDetailsQty');
        if (qty) qty.textContent = W.formatWeight(selectedWeight);
    }
    window.HamasaWeightedCustomer = { setWeight };

    if (typeof window.openProductDetails === 'function' && !window.openProductDetails.__weightedInit) {
        const original = window.openProductDetails;
        window.openProductDetails = function (id) {
            original.apply(this, arguments);
            const product = W.normalize((window.products || []).find(p => String(p.id) === String(id)) || {});
            const box = document.getElementById('productDetailsWeightBox');
            if (!box || !W.isWeighted(product)) {
                box?.classList.add('hidden');
                return;
            }
            box.classList.remove('hidden');
            const min = product.minWeightGrams || 250;
            const step = product.weightStepGrams || 50;
            const values = [...new Set([min, min + step, min + step * 2, 1000])]
                .filter(g => g <= (product.maxWeightGrams || Infinity));
            const options = document.getElementById('productDetailsWeightOptions');
            if (options) {
                options.innerHTML = values.map(g => `
                    <button type="button" data-grams="${g}" class="hw-weight-option rounded-xl px-2 py-2 text-xs font-bold" onclick="HamasaWeightedCustomer.setWeight(${g})">
                        ${W.formatWeight(g)}
                        <span class="block text-[10px] text-brand-600 mt-1">${money(W.priceForGrams(product, g))} ج.م</span>
                    </button>`).join('');
            }
            document.getElementById('productDetailsCustomWeight')?.classList.toggle('hidden', product.allowCustomWeight === false);
            selectedWeight = W.clampWeight(product, min);
            setWeight(selectedWeight);
        };
        window.openProductDetails.__weightedInit = true;
    }

    if (typeof window.addProductDetailsToCart === 'function' && !window.addProductDetailsToCart.__weightedInit) {
        const original = window.addProductDetailsToCart;
        window.addProductDetailsToCart = function () {
            const product = W.normalize((window.products || []).find(p => String(p.id) === String(window.currentProductDetailsId)) || {});
            if (!W.isWeighted(product)) return original.apply(this, arguments);
            const grams = selectedWeight || W.clampWeight(product, product.minWeightGrams || 250);
            const unitPrice = W.priceForGrams(product, grams);
            const existing = window.cart.find(x => String(x.id) === String(product.id) && Number(x.weight_grams) === grams);
            if (existing) existing.qty = num(existing.qty) + 1;
            else window.cart.push({ ...product, qty: 1, weight_grams: grams, weight_label: W.formatWeight(grams), unit_price: unitPrice, price: unitPrice, unit: 'كيلو' });
            window.cart = window.normalizeCart(window.cart);
            window.saveCart();
            window.renderProducts();
            window.updateCartUI();
            window.showAddToCartNotification(`${product.name} — ${W.formatWeight(grams)}`);
            window.closeProductDetails();
        };
        window.addProductDetailsToCart.__weightedInit = true;
    }

    const customApply = document.getElementById('productDetailsCustomWeightApply');
    if (customApply) {
        customApply.onclick = function () {
            const product = W.normalize((window.products || []).find(p => String(p.id) === String(window.currentProductDetailsId)) || {});
            const grams = W.clampWeight(product, num(document.getElementById('productDetailsCustomWeightInput')?.value));
            setWeight(grams);
        };
    }

    if (Array.isArray(window.products)) window.products = window.products.map(p => W.normalize(p));
    console.log('Hamasa weighted customer layer initialized');
}, { once: true });

console.log('Supabase initialized successfully');
