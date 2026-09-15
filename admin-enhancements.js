/* HAMASA ADMIN UI ENHANCEMENTS
 * UI-only layer: keeps the existing data model and business logic intact.
 */
(function () {
    'use strict';

    if (!/admin\.html$/i.test(location.pathname)) return;

    const state = {
        activeTab: 'home',
        initialized: false,
        originalAlert: null,
        originalRefresh: null,
        originalFilter: null,
        originalLoad: null,
        toastTimer: null,
        loadingDepth: 0
    };

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
    const esc = (value = '') => String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    function addStyles() {
        if ($('#hamasaAdminEnhancementStyles')) return;
        const style = document.createElement('style');
        style.id = 'hamasaAdminEnhancementStyles';
        style.textContent = `
            #adminTopNav{position:sticky;top:0;z-index:40;background:rgba(255,255,255,.96);backdrop-filter:blur(12px);border-bottom:1px solid #e2e8f0;box-shadow:0 4px 16px rgba(15,23,42,.05)}
            #adminTopNav .admin-nav-scroll{display:flex;gap:.45rem;overflow-x:auto;padding:.55rem 0;scrollbar-width:none}
            #adminTopNav .admin-nav-scroll::-webkit-scrollbar{display:none}
            .admin-nav-btn{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;white-space:nowrap;padding:.62rem .9rem;border-radius:.85rem;color:#475569;font-size:.75rem;font-weight:800;transition:.18s;border:1px solid transparent}
            .admin-nav-btn:hover{background:#f8fafc;color:#0f172a}
            .admin-nav-btn.active{background:#fff7ed;color:#ea580c;border-color:#fed7aa;box-shadow:0 2px 8px rgba(234,88,12,.08)}
            .admin-nav-btn .nav-dot{width:.38rem;height:.38rem;border-radius:999px;background:#cbd5e1}
            .admin-nav-btn.active .nav-dot{background:#f97316}
            .admin-section-card{scroll-margin-top:7rem;transition:opacity .18s,transform .18s}
            .admin-section-hidden{display:none!important}
            .admin-section-title{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}
            .admin-section-meta{font-size:.68rem;color:#94a3b8;font-weight:700}
            .admin-product-toolbar{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;gap:.5rem;margin-top:.75rem}
            .admin-product-toolbar input,.admin-product-toolbar select{min-width:0}
            .admin-product-row{display:flex;align-items:center;justify-content:space-between;gap:.75rem;padding:.7rem;border:1px solid #e2e8f0;border-radius:1rem;background:#f8fafc;transition:.18s}
            .admin-product-row:hover{background:#fff;border-color:#cbd5e1;box-shadow:0 4px 14px rgba(15,23,42,.05)}
            .admin-product-image{width:3.2rem;height:3.2rem;border-radius:.8rem;object-fit:cover;background:#e2e8f0;flex:none}
            .admin-product-info{min-width:0;flex:1}
            .admin-product-name{font-size:.78rem;font-weight:900;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
            .admin-product-sub{font-size:.66rem;color:#64748b;margin-top:.2rem;display:flex;gap:.35rem;flex-wrap:wrap}
            .admin-product-actions{display:flex;align-items:center;gap:.2rem;flex:none}
            .admin-action-btn{width:2rem;height:2rem;border-radius:.65rem;display:inline-flex;align-items:center;justify-content:center;background:#fff;border:1px solid #e2e8f0;transition:.15s}
            .admin-action-btn:hover{transform:translateY(-1px);box-shadow:0 3px 8px rgba(15,23,42,.08)}
            .admin-filter-pill{display:inline-flex;align-items:center;gap:.3rem;padding:.18rem .5rem;border-radius:999px;font-size:.61rem;font-weight:900}
            .admin-empty{padding:2.5rem 1rem;text-align:center;color:#94a3b8}
            .admin-stat-grid{scroll-margin-top:6rem}
            .admin-toast-wrap{position:fixed;top:1rem;left:1rem;z-index:100;display:flex;flex-direction:column;gap:.6rem;pointer-events:none;max-width:min(92vw,380px)}
            .admin-toast{display:flex;align-items:flex-start;gap:.65rem;background:#0f172a;color:#fff;padding:.8rem .9rem;border-radius:1rem;box-shadow:0 14px 34px rgba(15,23,42,.22);font-size:.72rem;font-weight:700;pointer-events:auto;animation:adminToastIn .2s ease-out}
            .admin-toast.success{border-right:4px solid #22c55e}.admin-toast.error{border-right:4px solid #ef4444}.admin-toast.info{border-right:4px solid #f59e0b}
            .admin-toast-icon{width:1.9rem;height:1.9rem;border-radius:.65rem;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.1);flex:none}
            .admin-toast-close{margin-right:auto;opacity:.65;background:none;border:0;color:inherit;cursor:pointer}
            #adminLoadingBar{position:fixed;top:0;right:0;left:0;height:3px;background:linear-gradient(90deg,#ffb300,#f97316,#22c55e);z-index:110;transform:scaleX(0);transform-origin:right;opacity:0;transition:.2s}
            #adminLoadingBar.active{opacity:1;animation:adminLoading 1.1s ease-in-out infinite}
            .admin-confirm-backdrop{position:fixed;inset:0;z-index:105;background:rgba(15,23,42,.58);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:1rem}
            .admin-confirm-card{width:min(100%,390px);background:#fff;border-radius:1.5rem;padding:1.4rem;box-shadow:0 25px 70px rgba(15,23,42,.25)}
            .admin-confirm-actions{display:grid;grid-template-columns:1fr 1fr;gap:.6rem;margin-top:1rem}
            .admin-confirm-actions button{border:0;border-radius:.85rem;padding:.72rem;font-size:.75rem;font-weight:900;cursor:pointer}
            .admin-confirm-cancel{background:#f1f5f9;color:#475569}.admin-confirm-ok{background:#ef4444;color:#fff}
            .admin-mobile-refresh{display:none}
            .admin-form-grid-tight{row-gap:.7rem!important}
            #newProdOldPriceWrapEnhanced{transition:.15s}
            @keyframes adminToastIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
            @keyframes adminLoading{0%{transform:scaleX(0);transform-origin:right}50%{transform:scaleX(1);transform-origin:right}100%{transform:scaleX(0);transform-origin:left}}
            @media (max-width:900px){.admin-product-toolbar{grid-template-columns:1fr 1fr}.admin-product-toolbar input{grid-column:1/-1}.admin-mobile-refresh{display:inline-flex}}
            @media (max-width:640px){#adminTopNav .max-w-7xl{padding-left:.75rem;padding-right:.75rem}.admin-nav-btn{padding:.58rem .72rem}.admin-product-row{align-items:flex-start}.admin-product-actions{flex-wrap:wrap;justify-content:flex-end}.admin-product-image{width:2.8rem;height:2.8rem}.admin-confirm-actions{grid-template-columns:1fr}.admin-toast-wrap{left:.7rem;right:.7rem;max-width:none}}
        `;
        document.head.appendChild(style);
    }

    function showLoading() {
        state.loadingDepth++;
        $('#adminLoadingBar')?.classList.add('active');
    }

    function hideLoading() {
        state.loadingDepth = Math.max(0, state.loadingDepth - 1);
        if (!state.loadingDepth) $('#adminLoadingBar')?.classList.remove('active');
    }

    function toast(title, message = '', type = 'success', icon = 'fa-check') {
        let wrap = $('#adminToastWrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.id = 'adminToastWrap';
            wrap.className = 'admin-toast-wrap';
            document.body.appendChild(wrap);
        }
        const item = document.createElement('div');
        item.className = `admin-toast ${type}`;
        item.innerHTML = `
            <div class="admin-toast-icon"><i class="fa-solid ${esc(icon)}"></i></div>
            <div class="min-w-0"><div class="font-black">${esc(title)}</div>${message ? `<div class="mt-0.5 text-white/70 leading-relaxed">${esc(message)}</div>` : ''}</div>
            <button type="button" class="admin-toast-close" aria-label="إغلاق"><i class="fa-solid fa-xmark"></i></button>
        `;
        item.querySelector('.admin-toast-close').onclick = () => item.remove();
        wrap.appendChild(item);
        setTimeout(() => item.remove(), 4200);
    }

    function patchAlert() {
        if (typeof window.showAlert !== 'function' || window.showAlert.__hamasaEnhanced) return;
        state.originalAlert = window.showAlert;
        const enhancedAlert = function (title, message, icon = 'fa-check', colorClass = '') {
            const type = String(colorClass).includes('red') ? 'error' : String(colorClass).includes('yellow') ? 'info' : 'success';
            toast(title, message, type, icon);
        };
        enhancedAlert.__hamasaEnhanced = true;
        enhancedAlert.original = state.originalAlert;
        window.showAlert = enhancedAlert;
    }

    function setSection(card, key) {
        if (!card) return;
        card.dataset.adminSection = key;
        card.classList.add('admin-section-card');
    }

    function findSections() {
        setSection($('#storeSettingsForm')?.closest('.bg-white'), 'store');
        setSection($('#storeHoursForm')?.closest('.bg-white'), 'hours');
        setSection($('#categoryForm')?.closest('.bg-white'), 'categories');
        setSection($('#productForm')?.closest('.bg-white'), 'products');
        setSection($('#adminProductsList')?.closest('.bg-white'), 'products');
        const actionBox = $('#importFile')?.closest('.mt-8');
        setSection(actionBox, 'settings');
        const stats = $('#totalProducts')?.closest('.grid');
        if (stats) stats.classList.add('admin-stat-grid');
    }

    const tabs = [
        ['home', 'الرئيسية', 'fa-house'],
        ['store', 'المتجر', 'fa-store'],
        ['products', 'المنتجات', 'fa-box'],
        ['categories', 'الأقسام', 'fa-layer-group'],
        ['hours', 'أوقات العمل', 'fa-clock'],
        ['settings', 'الإعدادات', 'fa-sliders']
    ];

    function buildHeaderTools() {
        if ($('#adminTopNav')) return;
        const header = $('#adminDashboard > header');
        const main = $('#adminDashboard > main');
        if (!header || !main) return;

        const nav = document.createElement('div');
        nav.id = 'adminTopNav';
        nav.innerHTML = `<div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8"><div class="admin-nav-scroll"></div></div>`;
        const scroll = $('.admin-nav-scroll', nav);

        tabs.forEach(([id, label, icon]) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'admin-nav-btn';
            button.dataset.tab = id;
            button.innerHTML = `<span class="nav-dot"></span><i class="fa-solid ${icon}"></i><span>${label}</span>`;
            button.addEventListener('click', () => activateTab(id));
            scroll.appendChild(button);
        });

        const refresh = document.createElement('button');
        refresh.type = 'button';
        refresh.className = 'admin-nav-btn admin-mobile-refresh';
        refresh.title = 'تحديث البيانات';
        refresh.innerHTML = '<i class="fa-solid fa-rotate"></i><span>تحديث</span>';
        refresh.addEventListener('click', () => window.refreshAdminData?.());
        scroll.appendChild(refresh);

        header.insertAdjacentElement('afterend', nav);

        const bar = document.createElement('div');
        bar.id = 'adminLoadingBar';
        document.body.appendChild(bar);
    }

    function activateTab(id) {
        state.activeTab = id;
        $$('.admin-nav-btn[data-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === id));
        $$('[data-admin-section]').forEach(card => {
            const show = id === 'home' ? false : card.dataset.adminSection === id;
            card.classList.toggle('admin-section-hidden', !show);
        });
        const stats = $('.admin-stat-grid');
        if (stats) stats.classList.toggle('admin-section-hidden', id !== 'home');
        if (id === 'home') {
            const settings = $('[data-admin-section="settings"]');
            if (settings) settings.classList.add('admin-section-hidden');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function addSectionHeaders() {
        const configs = [
            ['store', 'بيانات المتجر', 'تعديل الاسم والواتساب ورسوم التوصيل.'],
            ['hours', 'مواعيد العمل', 'التحكم في حالة المتجر وجدول التشغيل.'],
            ['categories', 'الأقسام', 'إضافة وترتيب وتعديل أقسام المتجر.'],
            ['products', 'المنتجات', 'إضافة وتعديل وإدارة ظهور وتوفر المنتجات.'],
            ['settings', 'الإعدادات', 'أدوات النسخ والاستيراد وإدارة البيانات.']
        ];
        configs.forEach(([key, title, meta]) => {
            const card = $(`[data-admin-section="${key}"]`);
            if (!card || card.querySelector('.admin-enhanced-title')) return;
            const h3 = $('h3', card);
            if (h3) {
                const titleWrap = document.createElement('div');
                titleWrap.className = 'admin-enhanced-title';
                titleWrap.innerHTML = `<div class="admin-section-meta">${esc(meta)}</div>`;
                h3.parentElement?.classList.add('admin-section-title');
                h3.insertAdjacentElement('afterend', titleWrap);
            }
        });
    }

    function setupDiscountField() {
        const checkbox = $('#newProdHasDiscount');
        const oldPrice = $('#newProdOldPrice');
        if (!checkbox || !oldPrice) return;
        const wrap = oldPrice.parentElement;
        wrap.id = 'newProdOldPriceWrapEnhanced';
        const sync = () => {
            const enabled = checkbox.checked;
            wrap.classList.toggle('hidden', !enabled);
            oldPrice.disabled = !enabled;
            if (!enabled) oldPrice.value = '';
        };
        checkbox.removeEventListener('change', checkbox.__hamasaDiscountHandler || (() => {}));
        checkbox.__hamasaDiscountHandler = sync;
        checkbox.addEventListener('change', sync);
        sync();
    }

    function setupFormLoading() {
        const forms = [
            ['storeSettingsForm', 'storeSettingsSubmitBtn'],
            ['storeHoursForm', 'storeHoursSubmitBtn'],
            ['categoryForm', 'categorySubmitBtn'],
            ['productForm', 'productSubmitBtn']
        ];
        forms.forEach(([formId, buttonId]) => {
            const form = document.getElementById(formId);
            const button = document.getElementById(buttonId);
            if (!form || !button || form.__hamasaLoadingBound) return;
            form.__hamasaLoadingBound = true;
            form.addEventListener('submit', () => {
                setTimeout(() => {
                    if (!button.disabled) return;
                    button.dataset.adminOriginalHtml ||= button.innerHTML;
                }, 0);
            }, true);
        });
    }

    function installRefreshLoading() {
        if (typeof window.refreshAdminData !== 'function' || window.refreshAdminData.__hamasaEnhanced) return;
        state.originalRefresh = window.refreshAdminData;
        const wrapped = async function () {
            showLoading();
            try { return await state.originalRefresh.apply(this, arguments); }
            finally { hideLoading(); }
        };
        wrapped.__hamasaEnhanced = true;
        window.refreshAdminData = wrapped;
    }

    function installLoadLoading() {
        if (typeof window.loadDataFromSupabase !== 'function' || window.loadDataFromSupabase.__hamasaEnhanced) return;
        state.originalLoad = window.loadDataFromSupabase;
        const wrapped = async function () {
            showLoading();
            try { return await state.originalLoad.apply(this, arguments); }
            finally { hideLoading(); }
        };
        wrapped.__hamasaEnhanced = true;
        window.loadDataFromSupabase = wrapped;
    }

    function productStatus(product) {
        if (product?.is_active === false) return ['مخفي', 'bg-slate-200 text-slate-600', 'fa-eye-slash'];
        if (product?.available === false) return ['منتهي', 'bg-red-100 text-red-600', 'fa-ban'];
        return ['متوفر', 'bg-emerald-100 text-emerald-700', 'fa-circle-check'];
    }

    function renderEnhancedProducts() {
        const list = $('#adminProductsList');
        if (!list || !Array.isArray(window.products)) return;

        const search = ($('#searchProducts')?.value || '').trim().toLowerCase();
        const category = $('#filterCategory')?.value || 'all';
        const status = $('#adminProductStatusFilter')?.value || 'all';
        const sort = $('#adminProductSort')?.value || 'newest';

        let filtered = window.products.filter(p => {
            const matchesSearch = String(p.name || '').toLowerCase().includes(search);
            const matchesCategory = category === 'all' || p.category === category;
            const matchesStatus = status === 'all'
                || (status === 'visible' && p.is_active !== false)
                || (status === 'hidden' && p.is_active === false)
                || (status === 'available' && p.available !== false)
                || (status === 'ended' && p.available === false)
                || (status === 'discount' && p.hasDiscount);
            return matchesSearch && matchesCategory && matchesStatus;
        });

        filtered.sort((a, b) => {
            if (sort === 'name') return String(a.name || '').localeCompare(String(b.name || ''), 'ar');
            if (sort === 'priceLow') return Number(a.price || 0) - Number(b.price || 0);
            if (sort === 'priceHigh') return Number(b.price || 0) - Number(a.price || 0);
            if (sort === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });

        const count = $('#adminProdCount');
        if (count) count.textContent = String(filtered.length);

        if (!filtered.length) {
            list.innerHTML = `<div class="admin-empty"><div class="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3 text-xl"><i class="fa-solid fa-box-open"></i></div><p class="text-sm font-bold">لا توجد منتجات مطابقة</p><p class="text-xs mt-1">جرّب تغيير البحث أو الفلاتر.</p></div>`;
            return;
        }

        list.innerHTML = filtered.map(p => {
            const safeId = typeof window.encodeActionId === 'function' ? window.encodeActionId(p.id) : encodeURIComponent(String(p.id));
            const [statusText, statusClass, statusIcon] = productStatus(p);
            const categoryName = typeof window.getCategoryName === 'function' ? window.getCategoryName(p.category) : 'عام';
            return `
                <div class="admin-product-row">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                        <img src="${esc(p.image || '')}" class="admin-product-image" loading="lazy" onerror="this.src='https://placehold.co/100x100?text=+'">
                        <div class="admin-product-info">
                            <div class="admin-product-name" title="${esc(p.name)}">${esc(p.name)}</div>
                            <div class="admin-product-sub">
                                <span class="font-black text-orange-600">${Number(p.price || 0).toLocaleString('ar-EG')} ج.م</span>
                                <span>• ${esc(p.unit || 'قطعة')}</span>
                                <span>• ${esc(categoryName)}</span>
                            </div>
                            <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                <span class="admin-filter-pill ${statusClass}"><i class="fa-solid ${statusIcon}"></i>${statusText}</span>
                                ${p.hasDiscount ? '<span class="admin-filter-pill bg-orange-100 text-orange-700"><i class="fa-solid fa-percent"></i>خصم</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="admin-product-actions">
                        <button type="button" onclick="toggleProductVisibility(decodeURIComponent('${safeId}'))" class="admin-action-btn ${p.is_active === false ? 'text-emerald-600' : 'text-slate-500'}" title="${p.is_active === false ? 'إظهار المنتج' : 'إخفاء المنتج'}"><i class="fa-solid ${p.is_active === false ? 'fa-eye' : 'fa-eye-slash'}"></i></button>
                        <button type="button" onclick="toggleProductAvailability(decodeURIComponent('${safeId}'))" class="admin-action-btn ${p.available === false ? 'text-emerald-600' : 'text-red-500'}" title="${p.available === false ? 'تفعيل المنتج' : 'إنهاء المنتج'}"><i class="fa-solid ${p.available === false ? 'fa-circle-check' : 'fa-ban'}"></i></button>
                        <button type="button" onclick="editProduct(decodeURIComponent('${safeId}'))" class="admin-action-btn text-blue-600" title="تعديل"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button type="button" onclick="deleteProduct(decodeURIComponent('${safeId}'))" class="admin-action-btn text-red-500" title="حذف"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>`;
        }).join('');
    }

    function addProductToolbar() {
        const list = $('#adminProductsList');
        const card = list?.closest('.bg-white');
        if (!card || $('#adminProductStatusFilter')) return;
        const search = $('#searchProducts');
        const category = $('#filterCategory');
        const title = $('#adminProdCount')?.closest('h3');
        if (!search || !category) return;

        const toolbar = document.createElement('div');
        toolbar.className = 'admin-product-toolbar';
        toolbar.innerHTML = `
            <input type="text" id="searchProductsEnhanced" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="بحث سريع عن منتج..." autocomplete="off">
            <select id="adminProductCategoryFilter" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"></select>
            <select id="adminProductStatusFilter" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                <option value="all">كل الحالات</option><option value="visible">ظاهر</option><option value="hidden">مخفي</option><option value="available">متوفر</option><option value="ended">منتهي</option><option value="discount">عليه خصم</option>
            </select>
            <select id="adminProductSort" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                <option value="newest">الأحدث</option><option value="oldest">الأقدم</option><option value="name">الاسم</option><option value="priceLow">السعر من الأقل</option><option value="priceHigh">السعر من الأعلى</option>
            </select>`;

        const oldSearchWrap = search.parentElement;
        oldSearchWrap?.classList.add('hidden');
        card.querySelector('h3')?.parentElement?.insertAdjacentElement('afterend', toolbar);

        const enhancedSearch = $('#searchProductsEnhanced');
        enhancedSearch.value = search.value || '';
        enhancedSearch.addEventListener('input', () => {
            search.value = enhancedSearch.value;
            renderEnhancedProducts();
        });
        $('#adminProductStatusFilter').addEventListener('change', renderEnhancedProducts);
        $('#adminProductSort').addEventListener('change', renderEnhancedProducts);
        $('#adminProductCategoryFilter').addEventListener('change', () => {
            category.value = $('#adminProductCategoryFilter').value;
            renderEnhancedProducts();
        });
        syncProductCategoryFilter();
    }

    function syncProductCategoryFilter() {
        const source = $('#filterCategory');
        const target = $('#adminProductCategoryFilter');
        if (!source || !target) return;
        target.innerHTML = source.innerHTML;
        target.value = source.value || 'all';
    }

    function patchFilterFunction() {
        if (typeof window.filterAdminProducts !== 'function' || window.filterAdminProducts.__hamasaEnhanced) return;
        state.originalFilter = window.filterAdminProducts;
        const enhanced = function () {
            syncProductCategoryFilter();
            renderEnhancedProducts();
        };
        enhanced.__hamasaEnhanced = true;
        enhanced.original = state.originalFilter;
        window.filterAdminProducts = enhanced;
    }

    function installCustomConfirm() {
        if (document.__hamasaConfirmBound) return;
        document.__hamasaConfirmBound = true;
        document.addEventListener('click', event => {
            const target = event.target.closest('[onclick]');
            if (!target) return;
            const code = target.getAttribute('onclick') || '';
            let action = null;
            let value = null;
            if (code.includes('deleteProduct(')) { action = 'deleteProduct'; value = code.match(/deleteProduct\(decodeURIComponent\('([^']+)'\)\)/)?.[1]; }
            else if (code.includes('deleteCategory(')) { action = 'deleteCategory'; value = code.match(/deleteCategory\(decodeURIComponent\('([^']+)'\)\)/)?.[1]; }
            else if (code.includes("setStoreManualMode('open')")) { action = 'setStoreManualMode'; value = 'open'; }
            else if (code.includes("setStoreManualMode('closed')")) { action = 'setStoreManualMode'; value = 'closed'; }
            if (!action || value === null) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            const decoded = action === 'setStoreManualMode' ? value : decodeURIComponent(value);
            const text = action === 'deleteProduct' ? 'حذف المنتج نهائيًا؟' : action === 'deleteCategory' ? 'حذف القسم؟' : decoded === 'open' ? 'فتح المتجر الآن؟' : 'غلق المتجر الآن؟';
            openConfirm(text, () => window[action]?.(decoded));
        }, true);
    }

    function openConfirm(message, onConfirm) {
        const old = $('#hamasaConfirm');
        old?.remove();
        const wrap = document.createElement('div');
        wrap.id = 'hamasaConfirm';
        wrap.className = 'admin-confirm-backdrop';
        wrap.innerHTML = `
            <div class="admin-confirm-card" role="dialog" aria-modal="true">
                <div class="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-xl"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <h3 class="text-base font-black text-slate-900 mt-4">تأكيد العملية</h3>
                <p class="text-xs text-slate-500 mt-2 leading-relaxed">${esc(message)}</p>
                <div class="admin-confirm-actions"><button type="button" class="admin-confirm-cancel">إلغاء</button><button type="button" class="admin-confirm-ok">تأكيد</button></div>
            </div>`;
        document.body.appendChild(wrap);
        const close = () => wrap.remove();
        $('.admin-confirm-cancel', wrap).onclick = close;
        $('.admin-confirm-ok', wrap).onclick = () => { close(); onConfirm?.(); };
        wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
    }

    function bindKeyboard() {
        document.addEventListener('keydown', event => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                const input = $('#searchProductsEnhanced');
                if (input) { event.preventDefault(); activateTab('products'); input.focus(); input.select(); }
            }
            if (event.key === 'Escape') $('#hamasaConfirm')?.remove();
        });
    }

    function watchDashboard() {
        const dashboard = $('#adminDashboard');
        if (!dashboard || dashboard.__hamasaObserver) return;
        dashboard.__hamasaObserver = new MutationObserver(() => {
            if (!state.initialized && !dashboard.classList.contains('hidden')) init();
            if (state.initialized) {
                findSections();
                setupDiscountField();
                addProductToolbar();
                syncProductCategoryFilter();
            }
        });
        dashboard.__hamasaObserver.observe(dashboard, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }

    function init() {
        if (state.initialized) return;
        if (!$('#adminDashboard')) return;
        state.initialized = true;
        addStyles();
        buildHeaderTools();
        findSections();
        addSectionHeaders();
        setupDiscountField();
        setupFormLoading();
        installRefreshLoading();
        installLoadLoading();
        patchFilterFunction();
        addProductToolbar();
        installCustomConfirm();
        bindKeyboard();
        patchAlert();
        activateTab('home');
        setTimeout(() => {
            syncProductCategoryFilter();
            renderEnhancedProducts();
        }, 80);
    }

    function boot() {
        addStyles();
        watchDashboard();
        const tryInit = () => {
            if (typeof window.checkAdminSession === 'function' || !$('#adminDashboard')?.classList.contains('hidden')) init();
        };
        tryInit();
        let tries = 0;
        const timer = setInterval(() => {
            tries++;
            tryInit();
            if (state.initialized || tries > 80) clearInterval(timer);
        }, 250);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
})();
