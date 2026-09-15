/* Bridge the admin page's top-level lexical product state to window for the UI layer. */
(function () {
    if (!/admin\.html$/i.test(location.pathname)) return;
    try {
        if (!Object.getOwnPropertyDescriptor(window, 'products')) {
            Object.defineProperty(window, 'products', {
                configurable: true,
                enumerable: false,
                get: function () {
                    try { return products; } catch (_) { return []; }
                },
                set: function (value) {
                    try { products = Array.isArray(value) ? value : []; } catch (_) {}
                }
            });
        }
    } catch (error) {
        console.warn('Hamasa admin state bridge unavailable', error);
    }
})();
