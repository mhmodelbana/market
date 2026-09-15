/* HAMASA weighted selling extension - loaded before app DOMContentLoaded handlers */
(function () {
  'use strict';

  const W = window.HamasaWeighted = window.HamasaWeighted || {};
  const money = v => Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const num = v => Number(v || 0);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  W.normalize = function (p) {
    const method = p.selling_method || p.sellingMethod || 'piece';
    const baseUnit = p.base_unit || p.baseUnit || (method === 'weight' ? 'kg' : 'piece');
    const price = num(p.base_price ?? p.price);
    return { ...p, sellingMethod: method, baseUnit, basePrice: price, allowCustomWeight: p.allow_custom_weight !== false, weightStepGrams: Math.max(1, num(p.weight_step_grams) || 50), minWeightGrams: Math.max(1, num(p.min_weight_grams) || 250), maxWeightGrams: p.max_weight_grams == null ? null : Math.max(1, num(p.max_weight_grams)), price, unit: p.unit || (method === 'weight' ? 'كيلو' : 'قطعة') };
  };
  W.isWeighted = p => String(p?.sellingMethod || p?.selling_method || 'piece') === 'weight';
  W.priceForGrams = (p, grams) => Math.round((num(p.basePrice ?? p.price) * (num(grams) / 1000)) * 100) / 100;
  W.formatWeight = grams => num(grams) >= 1000 ? `${Number((num(grams) / 1000).toFixed(3))} كيلو` : `${Math.round(num(grams))} جم`;
  W.clampWeight = (p, grams) => {
    let g = Math.max(num(p.minWeightGrams) || 1, num(grams));
    if (p.maxWeightGrams != null) g = Math.min(g, num(p.maxWeightGrams));
    const step = Math.max(1, num(p.weightStepGrams) || 50), min = Math.max(1, num(p.minWeightGrams) || step);
    g = min + Math.round((g - min) / step) * step;
    if (p.maxWeightGrams != null) g = Math.min(g, num(p.maxWeightGrams));
    return Math.max(min, Math.round(g));
  };

  function addStyle() {
    if (document.getElementById('hamasaWeightedStyles')) return;
    const s=document.createElement('style'); s.id='hamasaWeightedStyles';
    s.textContent='.hw-hidden{display:none!important}.hw-weight-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem}.hw-weight-option{border:1px solid #e2e8f0;border-radius:1rem;padding:.7rem;background:#f8fafc;text-align:center;font-weight:800;font-size:.78rem}.hw-weight-option.active{border-color:#ffb300;background:#ffffe0;color:#a16207}.hw-weight-custom{display:flex;gap:.5rem;align-items:center}.hw-weight-custom input{min-width:0;flex:1}.hw-price-preview{font-size:.8rem;font-weight:900;color:#ea580c}';
    document.head.appendChild(s);
  }

  function injectAdminUI() {
    const form=document.getElementById('productForm'); if(!form||document.getElementById('newProdSellingMethod'))return;
    const priceWrap=document.getElementById('newProdPrice')?.parentElement; if(!priceWrap)return;
    const box=document.createElement('div'); box.className='lg:col-span-3 bg-slate-50 border border-slate-200 rounded-2xl p-4';
    box.innerHTML='<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"><div><label class="block text-xs font-bold text-slate-700 mb-1">طريقة البيع *</label><select id="newProdSellingMethod" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"><option value="piece">بالقطعة</option><option value="weight">بالوزن</option></select></div><div><label class="block text-xs font-bold text-slate-700 mb-1">الوحدة الأساسية</label><select id="newProdBaseUnit" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"><option value="piece">قطعة</option><option value="kg">كيلو</option><option value="g">جرام</option></select></div><div id="newProdWeightStepWrap" class="hw-hidden"><label class="block text-xs font-bold text-slate-700 mb-1">خطوة الوزن (جم)</label><input id="newProdWeightStep" type="number" min="1" step="1" value="50" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"></div><div id="newProdMinWeightWrap" class="hw-hidden"><label class="block text-xs font-bold text-slate-700 mb-1">أقل وزن (جم)</label><input id="newProdMinWeight" type="number" min="1" step="1" value="250" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"></div><div id="newProdMaxWeightWrap" class="hw-hidden"><label class="block text-xs font-bold text-slate-700 mb-1">أقصى وزن (جم)</label><input id="newProdMaxWeight" type="number" min="1" step="1" placeholder="بدون حد" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"></div><label id="newProdCustomWeightWrap" class="hw-hidden flex items-center gap-2 text-xs font-bold text-slate-700 pt-5"><input type="checkbox" id="newProdAllowCustomWeight" checked class="w-4 h-4"> السماح بوزن مخصص</label><div id="newProdWeightPreview" class="hw-hidden lg:col-span-2 p-3 bg-white border border-slate-200 rounded-xl"><div class="text-xs font-black text-slate-700 mb-2">معاينة السعر</div><div id="newProdWeightPreviewText" class="space-y-1"></div></div></div>';
    priceWrap.parentElement.insertBefore(box,priceWrap.nextSibling);
    document.getElementById('newProdSellingMethod').addEventListener('change',refreshAdminWeightUI);
    ['newProdPrice','newProdWeightStep','newProdMinWeight','newProdMaxWeight'].forEach(id=>document.getElementById(id)?.addEventListener('input',refreshAdminWeightUI));
    refreshAdminWeightUI();
  }
  function refreshAdminWeightUI(){
    const method=document.getElementById('newProdSellingMethod'); if(!method)return; const weighted=method.value==='weight';
    const label=document.getElementById('newProdPrice')?.parentElement?.querySelector('label'); if(label)label.textContent=weighted?'السعر لكل كيلو (ج.م) *':'السعر بالجنيه *';
    const unit=document.getElementById('newProdUnit'); if(unit){unit.readOnly=weighted;if(weighted)unit.value='كيلو';}
    ['newProdWeightStepWrap','newProdMinWeightWrap','newProdMaxWeightWrap','newProdCustomWeightWrap','newProdWeightPreview'].forEach(id=>document.getElementById(id)?.classList.toggle('hw-hidden',!weighted));
    const base=document.getElementById('newProdBaseUnit');if(base)base.value=weighted?'kg':'piece';
    if(weighted){const price=num(document.getElementById('newProdPrice')?.value),step=Math.max(1,num(document.getElementById('newProdWeightStep')?.value)||50),min=Math.max(1,num(document.getElementById('newProdMinWeight')?.value)||250),vals=[min,min+step,min+step*2,1000].filter((v,i,a)=>!a.slice(0,i).includes(v));const out=document.getElementById('newProdWeightPreviewText');if(out)out.innerHTML=vals.map(g=>`<div class="flex justify-between"><span>${W.formatWeight(g)}</span><strong>${money(price*g/1000)} ج.م</strong></div>`).join('');}
  }
  function patchAdmin(){
    addStyle();injectAdminUI();
    const originalLoad=window.loadDataFromSupabase;
    if(typeof originalLoad==='function'&&!originalLoad.__hw){const wrapped=async function(){await originalLoad.apply(this,arguments);const ids=products.map(p=>p.id).filter(Boolean);if(ids.length){const r=await marketSupabase.from('products').select('id,selling_method,base_unit,base_price,allow_custom_weight,weight_step_grams,min_weight_grams,max_weight_grams').in('id',ids);if(!r.error){const byId=new Map((r.data||[]).map(x=>[String(x.id),x]));products=products.map(p=>W.normalize({...p,...(byId.get(String(p.id))||{})}));}}else products=products.map(W.normalize);};wrapped.__hw=true;window.loadDataFromSupabase=wrapped;}
    const originalBuild=window.buildProductPayload;
    if(typeof originalBuild==='function'&&!originalBuild.__hw){const wrapped=function(args){const p=originalBuild.apply(this,arguments),method=document.getElementById('newProdSellingMethod')?.value||'piece';p.selling_method=method;p.base_unit=document.getElementById('newProdBaseUnit')?.value||(method==='weight'?'kg':'piece');p.base_price=num(args.price);p.allow_custom_weight=method==='weight'&&document.getElementById('newProdAllowCustomWeight')?.checked!==false;p.weight_step_grams=method==='weight'?Math.max(1,num(document.getElementById('newProdWeightStep')?.value)||50):50;p.min_weight_grams=method==='weight'?Math.max(1,num(document.getElementById('newProdMinWeight')?.value)||250):250;const max=num(document.getElementById('newProdMaxWeight')?.value);p.max_weight_grams=method==='weight'&&max>0?max:null;return p;};wrapped.__hw=true;window.buildProductPayload=wrapped;}
    const originalEdit=window.editProduct;
    if(typeof originalEdit==='function'&&!originalEdit.__hw){const wrapped=function(id){originalEdit.apply(this,arguments);const p=products.find(x=>String(x.id)===String(id));if(p){const m=document.getElementById('newProdSellingMethod'),u=document.getElementById('newProdBaseUnit');if(m)m.value=p.selling_method||'piece';if(u)u.value=p.base_unit||((m?.value==='weight')?'kg':'piece');const set=(i,v)=>{const e=document.getElementById(i);if(e)e.value=v??''};set('newProdWeightStep',p.weight_step_grams||50);set('newProdMinWeight',p.min_weight_grams||250);set('newProdMaxWeight',p.max_weight_grams||'');const c=document.getElementById('newProdAllowCustomWeight');if(c)c.checked=p.allow_custom_weight!==false;refreshAdminWeightUI();}};wrapped.__hw=true;window.editProduct=wrapped;}
  }

  let selectedWeight=0;
  function injectCustomerWeightUI(){const box=document.getElementById('productDetailsQuantityBox');if(!box||document.getElementById('productDetailsWeightBox'))return;const w=document.createElement('div');w.id='productDetailsWeightBox';w.className='hidden mt-4 bg-slate-50 border border-slate-200 rounded-2xl p-4';w.innerHTML='<div class="flex items-center justify-between mb-3"><span class="text-xs font-black text-slate-700">اختار الوزن</span><span id="productDetailsWeightPrice" class="hw-price-preview"></span></div><div id="productDetailsWeightOptions" class="hw-weight-grid"></div><div id="productDetailsCustomWeight" class="hw-weight-custom mt-3 hidden"><input id="productDetailsCustomWeightInput" type="number" min="1" step="1" placeholder="الوزن بالجرام" class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"><button type="button" id="productDetailsCustomWeightApply" class="bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-black">تطبيق</button></div>';box.parentElement.parentElement.insertBefore(w,box.parentElement.nextSibling);document.getElementById('productDetailsCustomWeightApply').onclick=()=>{const p=products.find(x=>String(x.id)===String(currentProductDetailsId));if(!p)return;setCustomerWeight(W.clampWeight(W.normalize(p),num(document.getElementById('productDetailsCustomWeightInput').value)));};}
  function setCustomerWeight(g){selectedWeight=Math.max(1,Math.round(g));const p=W.normalize(products.find(x=>String(x.id)===String(currentProductDetailsId))||{}),price=W.priceForGrams(p,selectedWeight);const pe=document.getElementById('productDetailsWeightPrice');if(pe)pe.textContent=`${money(price)} ج.م`;document.querySelectorAll('#productDetailsWeightOptions button').forEach(b=>b.classList.toggle('active',Number(b.dataset.grams)===selectedWeight));const q=document.getElementById('productDetailsQty');if(q)q.textContent=W.formatWeight(selectedWeight);}
  W.setCustomerWeight=setCustomerWeight;
  function patchCustomer(){
    addStyle();injectCustomerWeightUI();
    const originalLoad=window.loadStoreData;if(typeof originalLoad==='function'&&!originalLoad.__hw){const wrapped=async function(){await originalLoad.apply(this,arguments);products=products.map(W.normalize);};wrapped.__hw=true;window.loadStoreData=wrapped;}
    const originalOpen=window.openProductDetails;if(typeof originalOpen==='function'&&!originalOpen.__hw){const wrapped=function(id){originalOpen.apply(this,arguments);const p=W.normalize(products.find(x=>String(x.id)===String(id))||{});const box=document.getElementById('productDetailsWeightBox');if(!W.isWeighted(p)){box?.classList.add('hidden');return;}box?.classList.remove('hidden');const min=p.minWeightGrams||250,step=p.weightStepGrams||50,vals=[min,min+step,min+step*2,1000].filter((v,i,a)=>v<=(p.maxWeightGrams||Infinity)&&!a.slice(0,i).includes(v));const opts=document.getElementById('productDetailsWeightOptions');if(opts)opts.innerHTML=vals.map(g=>`<button type="button" data-grams="${g}" class="hw-weight-option" onclick="HamasaWeighted.setCustomerWeight(${g})">${esc(W.formatWeight(g))}<br><span>${money(W.priceForGrams(p,g))} ج.م</span></button>`).join('');document.getElementById('productDetailsCustomWeight')?.classList.toggle('hidden',p.allowCustomWeight===false);setCustomerWeight(min);};wrapped.__hw=true;window.openProductDetails=wrapped;}
    const originalAdd=window.addProductDetailsToCart;if(typeof originalAdd==='function'&&!originalAdd.__hw){const wrapped=function(){const p=W.normalize(products.find(x=>String(x.id)===String(currentProductDetailsId))||{});if(W.isWeighted(p)){if(!selectedWeight)setCustomerWeight(p.minWeightGrams||250);const existing=cart.find(x=>String(x.id)===String(p.id)&&Number(x.weight_grams)===selectedWeight),unitPrice=W.priceForGrams(p,selectedWeight);if(existing)existing.qty=Number(existing.qty||0)+1;else cart.push({...p,qty:1,weight_grams:selectedWeight,weight_label:W.formatWeight(selectedWeight),unit_price:unitPrice,price:unitPrice});cart=normalizeCart(cart);saveCart();renderProducts();updateCartUI();showAddToCartNotification(`${p.name} — ${W.formatWeight(selectedWeight)}`);closeProductDetails();return;}return originalAdd.apply(this,arguments);};wrapped.__hw=true;window.addProductDetailsToCart=wrapped;}
  }

  function updateWeightedQty(productId,weightGrams,newQty){const id=String(productId),g=Number(weightGrams);if(newQty<=0)cart=cart.filter(x=>!(String(x.id)===id&&Number(x.weight_grams)===g));else{const item=cart.find(x=>String(x.id)===id&&Number(x.weight_grams)===g);if(item)item.qty=newQty;}cart=normalizeCart(cart);saveCart();renderProducts();updateCartUI();}
  W.updateWeightedQty=updateWeightedQty;
  function patchCart(){
    const originalNormalize=window.normalizeCart;if(typeof originalNormalize==='function'&&!originalNormalize.__hw){const wrapped=function(items=[]){const map=new Map();for(const raw of(Array.isArray(items)?items:[])){const item={...raw},id=String(item.id??'');if(!id)continue;const key=item.weight_grams!=null?`${id}::w:${Number(item.weight_grams)}`:id,q=Number(item.qty||1),qty=Number.isFinite(q)&&q>0?q:1;if(!map.has(key))map.set(key,{...item,qty});else map.get(key).qty+=qty;}return[...map.values()];};wrapped.__hw=true;window.normalizeCart=wrapped;normalizeCart=wrapped;}
    const originalUI=window.updateCartUI;if(typeof originalUI==='function'&&!originalUI.__hw){const wrapped=function(){originalUI.apply(this,arguments);const list=document.getElementById('cartItemsList');if(!list)return;[...list.children].forEach((row,i)=>{const item=cart[i];if(!item)return;const buttons=[...row.querySelectorAll('button')],id=esc(item.id);if(item.weight_grams!=null){const minus=buttons.find(b=>b.textContent.trim()==='-'),plus=buttons.find(b=>b.textContent.trim()==='+'),del=buttons.find(b=>b.querySelector('.fa-trash-can'));if(minus)minus.setAttribute('onclick',`HamasaWeighted.updateWeightedQty('${id}',${Number(item.weight_grams)},${Number(item.qty)-1})`);if(plus)plus.setAttribute('onclick',`HamasaWeighted.updateWeightedQty('${id}',${Number(item.weight_grams)},${Number(item.qty)+1})`);if(del)del.setAttribute('onclick',`HamasaWeighted.updateWeightedQty('${id}',${Number(item.weight_grams)},0)`);const pe=row.querySelector('p');if(pe)pe.innerHTML=`${money(item.unit_price||item.price)} ج.م <span class="text-[10px] text-slate-400">/ ${esc(item.weight_label||W.formatWeight(item.weight_grams))}</span>`;}});};wrapped.__hw=true;window.updateCartUI=wrapped;updateCartUI=wrapped;}
    const originalAdd=window.addToCart;if(typeof originalAdd==='function'&&!originalAdd.__hw){const wrapped=function(id){const p=W.normalize(products.find(x=>String(x.id)===String(id))||{});if(W.isWeighted(p))return openProductDetails(id);return originalAdd.apply(this,arguments);};wrapped.__hw=true;window.addToCart=wrapped;}
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{patchAdmin();patchCustomer();patchCart();},0));
})();
