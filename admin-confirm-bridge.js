/* Keep the custom admin confirmation dialog from being followed by the legacy native confirm. */
(function () {
    if (!/admin\.html$/i.test(location.pathname)) return;

    let tries = 0;
    const timer = setInterval(() => {
        tries++;
        const names = ['deleteProduct', 'deleteCategory', 'setStoreManualMode'];
        let ready = true;

        names.forEach(name => {
            const fn = window[name];
            if (typeof fn !== 'function' || fn.__hamasaConfirmBridge) {
                if (typeof fn !== 'function') ready = false;
                return;
            }

            const wrapped = async function () {
                const nativeConfirm = window.confirm;
                window.confirm = () => true;
                try {
                    return await fn.apply(this, arguments);
                } finally {
                    window.confirm = nativeConfirm;
                }
            };
            wrapped.__hamasaConfirmBridge = true;
            wrapped.original = fn;
            window[name] = wrapped;
        });

        if (ready || tries > 80) clearInterval(timer);
    }, 250);
})();
