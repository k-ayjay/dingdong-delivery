// ======================================================
// DingDong Delivery - Dynamic Modal Version (FINAL)
//  ✔ Per-item sizes & extras (from Config.Items)
//  ✔ Dynamic image, description, price
//  ✔ Quick-add, remove-item, live totals
// ======================================================

// DOM ELEMENTS
const cartBtn = document.getElementById('cartBtn');
const itemModal = document.getElementById('itemModal');
const checkoutModal = document.getElementById('checkoutModal');
const categoryBtns = document.querySelectorAll('.category-btn');
const searchInput = document.querySelector('.search-input');
const locationDisplay = document.querySelector('.location');

// STATE
let cart = [];
let cartCount = 0;
let currentCategory = 'all';
let currentSearchQuery = '';
let ITEMS = [];

// CONFIG (overwritten by lb-phone)
let DELIVERY_FEE = 5.00;
let RESOURCE_NAME = 'dingdong-delivery';
let CURRENCY = '$';
let ENABLE_CACHE_BUSTING = true;
let DEBUG = false;

// DEBUG HELPERS
function debugLog(...args) { if (DEBUG) console.log(...args); }
function debugWarn(...args) { if (DEBUG) console.warn(...args); }
function debugError(...args) { if (DEBUG) console.error(...args); }

// ======================================================
// NUI BRIDGE
// ======================================================
function fetchNui(eventName, data = {}) {
    return fetch(`https://${RESOURCE_NAME}/${eventName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
        .then(res => res.json())
        .catch(err => debugError('NUI Error:', err));
}

// ======================================================
// LOCATION
// ======================================================
function getPlayerLocation() {
    fetchNui('getLocation')
        .then(data => {
            if (data?.location) {
                locationDisplay.textContent = `📍 ${data.location}`;
            } else {
                locationDisplay.textContent = '📍 Unknown';
            }
        })
        .catch(() => {
            locationDisplay.textContent = '📍 Error';
        });
}

// ======================================================
// FILTERING
// ======================================================
function filterFoodItems() {
    const cards = document.querySelectorAll('.food-card');
    cards.forEach(card => {
        const category = card.dataset.category;
        const name = card.dataset.name.toLowerCase();

        const matchesCategory = currentCategory === 'all' || category === currentCategory;
        const matchesSearch = name.includes(currentSearchQuery.toLowerCase());

        card.style.display = (matchesCategory && matchesSearch) ? '' : 'none';
    });
}

if (searchInput) {
    searchInput.addEventListener('input', e => {
        currentSearchQuery = e.target.value;
        filterFoodItems();
        fetchNui('search', { query: currentSearchQuery });
    });
}

// ======================================================
// CHECKOUT MODAL
// ======================================================
function showCheckout() {
    if (cartCount <= 0) return;

    const cartItemsList =
        checkoutModal.querySelector('#cartItemsList') ||
        checkoutModal.querySelector('.cart-items-list');

    if (!cartItemsList) return;

    // Clear old listeners by cloning the container
    const newList = cartItemsList.cloneNode(false);
    cartItemsList.parentNode.replaceChild(newList, cartItemsList);

    let subtotal = 0;

    cart.forEach((item, index) => {
        const safeIndex = index;
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-row">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-actions">
                    <div class="cart-item-price">${CURRENCY}${itemTotal.toFixed(2)}</div>
                    <button class="remove-item-btn" data-index="${safeIndex}">🗑️</button>
                </div>
            </div>
            <div class="cart-item-meta">
                <span class="cart-item-qty">Qty: ${item.quantity}</span>
                <span class="cart-item-size">${item.size}</span>
                ${item.extras && item.extras.length > 0 ? `<div class="cart-item-extras">Extras: ${item.extras.join(', ')}</div>` : ''}
            </div>
        `;
        newList.appendChild(div);
    });

    const total = subtotal + DELIVERY_FEE;

    const subtotalEl = checkoutModal.querySelector('#subtotal');
    const totalEl = checkoutModal.querySelector('#orderTotal');
    const feeEl = checkoutModal.querySelector('#deliveryFee');

    if (subtotalEl) subtotalEl.textContent = `${CURRENCY}${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `${CURRENCY}${total.toFixed(2)}`;
    if (feeEl) feeEl.textContent = `${CURRENCY}${DELIVERY_FEE.toFixed(2)}`;

    checkoutModal.classList.add('active');

    // REMOVE ITEM HANDLERS
    newList.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = Number(e.target.dataset.index);
            if (isNaN(index) || !cart[index]) return;

            const removed = cart.splice(index, 1)[0];
            cartCount -= removed.quantity;
            document.querySelector('.cart-count').textContent = cartCount;

            if (cart.length === 0) {
                checkoutModal.classList.remove('active');
                return;
            }

            checkoutModal.offsetHeight; // force reflow
            showCheckout();
        });
    });
}

if (cartBtn) {
    cartBtn.addEventListener('click', () => {
        if (cartCount > 0) showCheckout();
    });
}

// ======================================================
// MODAL CLOSE
// ======================================================
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
        itemModal.classList.remove('active');
        checkoutModal.classList.remove('active');
    });
});

itemModal.addEventListener('click', e => {
    if (e.target === itemModal) itemModal.classList.remove('active');
});

checkoutModal.addEventListener('click', e => {
    if (e.target === checkoutModal) checkoutModal.classList.remove('active');
});

// ======================================================
// CHECKOUT BUTTONS
// ======================================================
const backBtn = document.getElementById('backToShoppingBtn');
if (backBtn) {
    backBtn.addEventListener('click', () => checkoutModal.classList.remove('active'));
}

const confirmBtn = document.getElementById('confirmOrderBtn');
if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
        const notes = document.getElementById('deliveryNotes')?.value || '';
        const subtotal = parseFloat(document.getElementById('subtotal')?.textContent.replace(CURRENCY, '')) || 0;
        const total = parseFloat(document.getElementById('orderTotal')?.textContent.replace(CURRENCY, '')) || 0;

        const order = {
            items: cart,
            deliveryNotes: notes,
            subtotal,
            deliveryFee: DELIVERY_FEE,
            total,
            timestamp: new Date().toISOString()
        };

        fetchNui('placeOrder', order).then(resp => {
            if (resp?.success) {
                confirmBtn.textContent = '✓ Order Placed!';
                setTimeout(() => {
                    confirmBtn.textContent = 'Confirm Order';
                    checkoutModal.classList.remove('active');
                    cart = [];
                    cartCount = 0;
                    document.querySelector('.cart-count').textContent = 0;
                }, 1500);
            }
        });
    });
}

// ======================================================
// ITEM MODAL (DYNAMIC)
// ======================================================
const qtyInput = itemModal.querySelector('.qty-input');
const qtyBtns = itemModal.querySelectorAll('.qty-btn');

function getSizeAndExtrasSections() {
    const customizations = itemModal.querySelectorAll('.customization');
    const sizeSection = customizations[0] || null;
    const extrasSection = customizations[1] || null;
    const sizeGroup = sizeSection ? sizeSection.querySelector('.option-group') : null;
    const extrasGroup = extrasSection ? extrasSection.querySelector('.checkbox-group') : null;
    return { sizeSection, extrasSection, sizeGroup, extrasGroup };
}

function updatePrice() {
    const base = parseFloat(itemModal.dataset.basePrice) || 0;
    const qty = parseInt(qtyInput.value) || 1;

    let sizeExtra = 0;
    const activeSize = itemModal.querySelector('.option-btn.active');
    if (activeSize && activeSize.dataset.price) {
        sizeExtra = parseFloat(activeSize.dataset.price) || 0;
    }

    let extras = 0;
    itemModal.querySelectorAll('.checkbox-item input[type="checkbox"]:checked').forEach(cb => {
        const p = parseFloat(cb.dataset.price || '0');
        extras += p;
    });

    const total = (base + sizeExtra + extras) * qty;
    const priceEl = itemModal.querySelector('.total-price');
    if (priceEl) priceEl.textContent = `${CURRENCY}${total.toFixed(2)}`;
}

if (qtyBtns.length >= 2) {
    qtyBtns[0].addEventListener('click', () => {
        qtyInput.value = Math.max(1, parseInt(qtyInput.value) - 1);
        updatePrice();
    });

    qtyBtns[1].addEventListener('click', () => {
        qtyInput.value = parseInt(qtyInput.value) + 1;
        updatePrice();
    });
}

if (qtyInput) qtyInput.addEventListener('change', updatePrice);

function updateModal(itemIndex) {
    const item = ITEMS[itemIndex];
    if (!item) return;

    const titleEl = itemModal.querySelector('.modal-title');
    const descEl = itemModal.querySelector('.modal-desc');
    const imgEl = itemModal.querySelector('.modal-image');
    const priceEl = itemModal.querySelector('.total-price');
    const addBtn = itemModal.querySelector('.modal-add-btn');

    if (titleEl) titleEl.textContent = item.name || '';
    if (descEl) descEl.textContent = item.desc || '';

    if (imgEl) {
        if (item.icon && typeof item.icon === 'string' && item.icon.startsWith('http')) {
            imgEl.style.backgroundImage = `url(${item.icon})`;
            imgEl.textContent = '';
        } else {
            imgEl.style.backgroundImage = '';
            imgEl.textContent = item.icon || '🍽️';
        }
    }

    const basePrice = parseFloat(item.price) || 0;
    itemModal.dataset.basePrice = basePrice;
    if (priceEl) priceEl.textContent = `${CURRENCY}${basePrice.toFixed(2)}`;

    qtyInput.value = 1;

    const { sizeSection, extrasSection, sizeGroup, extrasGroup } = getSizeAndExtrasSections();

    // Sizes (per-item only)
    if (sizeSection && sizeGroup) {
        sizeGroup.innerHTML = '';
        if (Array.isArray(item.sizes) && item.sizes.length > 0) {
            sizeSection.style.display = '';
            item.sizes.forEach((sz, idx) => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                if (idx === 0) btn.classList.add('active');
                btn.textContent = (sz.label || '').toUpperCase();
                btn.dataset.price = sz.price || 0;
                btn.addEventListener('click', () => {
                    sizeGroup.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    updatePrice();
                });
                sizeGroup.appendChild(btn);
            });
        } else {
            sizeSection.style.display = 'none';
        }
    }

    // Extras (per-item only)
    if (extrasSection && extrasGroup) {
        extrasGroup.innerHTML = '';
        if (Array.isArray(item.extras) && item.extras.length > 0) {
            extrasSection.style.display = '';
            item.extras.forEach(ext => {
                const label = document.createElement('label');
                label.className = 'checkbox-item';

                const input = document.createElement('input');
                input.type = 'checkbox';
                input.dataset.price = ext.price || 0;
                input.addEventListener('change', updatePrice);

                label.appendChild(input);
                label.appendChild(document.createTextNode(` ${ext.label} (+${CURRENCY}${(ext.price || 0).toFixed(2)})`));
                extrasGroup.appendChild(label);
            });
        } else {
            extrasSection.style.display = 'none';
        }
    }

    if (addBtn) addBtn.dataset.itemIndex = itemIndex;

    updatePrice();
}

// Add to cart
const addToCartBtn = itemModal.querySelector('.modal-add-btn');
if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
        const itemIndex = Number(addToCartBtn.dataset.itemIndex);
        const item = ITEMS[itemIndex];
        if (!item) return;

        const qty = parseInt(qtyInput.value) || 1;
        const totalPrice = parseFloat(itemModal.querySelector('.total-price').textContent.replace(CURRENCY, '')) || 0;
        const unitPrice = totalPrice / qty;

        const extras = [];
        itemModal.querySelectorAll('.checkbox-item input[type="checkbox"]:checked').forEach(cb => {
            const label = cb.parentElement.textContent.trim();
            extras.push(label);
        });

        let sizeLabel = 'Default';
        const activeSize = itemModal.querySelector('.option-btn.active');
        if (activeSize) sizeLabel = activeSize.textContent.trim();

        const cartItem = {
            id: item.id || itemIndex,
            name: item.name,
            quantity: qty,
            price: unitPrice,
            size: sizeLabel,
            extras,
            totalPrice
        };

        cart.push(cartItem);
        cartCount += qty;
        document.querySelector('.cart-count').textContent = cartCount;

        fetchNui('addToCart', cartItem);

        addToCartBtn.textContent = '✓ Added!';
        setTimeout(() => {
            addToCartBtn.textContent = 'Add to Cart';
            itemModal.classList.remove('active');
        }, 800);
    });
}

// ======================================================
// CATEGORY FILTERING
// ======================================================
categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        filterFoodItems();
        fetchNui('filterCategory', { category: currentCategory });
    });
});

// ======================================================
// FOOD CARD CLICK HANDLING (WITH QUICK-ADD FIX)
// ======================================================
document.addEventListener('click', e => {

    // QUICK ADD BUTTON — ONLY ADD TO CART, DO NOT OPEN MODAL
    const addBtn = e.target.closest('.add-btn');
    if (addBtn) {
        const card = addBtn.closest('.food-card');
        const index = Number(card.dataset.index);
        const item = ITEMS[index];
        if (!item) return;

        const name = item.name;
        const price = parseFloat(item.price) || 0;

        cart.push({
            id: item.id || index,
            name,
            quantity: 1,
            price,
            size: 'Default',
            extras: []
        });

        cartCount++;
        document.querySelector('.cart-count').textContent = cartCount;

        addBtn.textContent = '✓';
        setTimeout(() => addBtn.textContent = '+', 500);

        fetchNui('quickAddItem', { name, price });
        return;
    }

    // CARD CLICK — OPEN MODAL
    const card = e.target.closest('.food-card');
    if (card && card.style.display !== 'none') {
        const index = Number(card.dataset.index);
        updateModal(index);
        itemModal.classList.add('active');
    }
});

// ======================================================
// RENDER FOOD ITEMS
// ======================================================
function renderFoodItems(items) {
    const grid = document.querySelector('.food-grid');
    if (!grid) return;

    grid.innerHTML = '';

    items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'food-card';
        card.dataset.category = item.category || 'all';
        card.dataset.name = item.name || '';
        card.dataset.index = index;

        const img = document.createElement('div');
        img.className = 'food-image';

        if (item.icon && typeof item.icon === 'string' && item.icon.startsWith('http')) {
            img.style.backgroundImage = `url(${item.icon})`;
        } else {
            img.textContent = item.icon || '🍽️';
        }

        const info = document.createElement('div');
        info.className = 'food-info';

        const h3 = document.createElement('h3');
        h3.className = 'food-name';
        h3.textContent = item.name;

        const desc = document.createElement('p');
        desc.className = 'food-desc';
        desc.textContent = item.desc || '';

        const footer = document.createElement('div');
        footer.className = 'food-footer';

        const price = document.createElement('span');
        price.className = 'food-price';
        const pVal = parseFloat(item.price) || 0;
        price.textContent = `${CURRENCY}${pVal.toFixed(2)}`;

        const add = document.createElement('button');
        add.className = 'add-btn';
        add.textContent = '+';

        footer.appendChild(price);
        footer.appendChild(add);

        info.appendChild(h3);
        info.appendChild(desc);
        info.appendChild(footer);

        card.appendChild(img);
        card.appendChild(info);

        grid.appendChild(card);
    });

    filterFoodItems();
}

// ======================================================
// MESSAGE LISTENER
// ======================================================
window.addEventListener('message', event => {
    const data = event.data;

    if (data.type === 'config') {
        const cfg = data.config;
        if (!cfg) return;

        RESOURCE_NAME = cfg.ResourceName || RESOURCE_NAME;
        DELIVERY_FEE = typeof cfg.DeliveryFee === 'number' ? cfg.DeliveryFee : DELIVERY_FEE;
        CURRENCY = cfg.Currency || CURRENCY;
        ENABLE_CACHE_BUSTING = typeof cfg.EnableCacheBusting === 'boolean' ? cfg.EnableCacheBusting : ENABLE_CACHE_BUSTING;
        DEBUG = cfg.Debug?.Enabled || false;

        if (Array.isArray(cfg.items)) {
            ITEMS = cfg.items;
            renderFoodItems(ITEMS);
        }

        const feeEl = document.getElementById('deliveryFee');
        if (feeEl) feeEl.textContent = `${CURRENCY}${DELIVERY_FEE.toFixed(2)}`;
    }

    if (data.type === 'openMenu') {
        document.body.classList.add('app-visible');
        getPlayerLocation();
    }

    if (data.type === 'closeMenu') {
        document.body.classList.remove('app-visible');
        cart = [];
        cartCount = 0;
        currentCategory = 'all';
        currentSearchQuery = '';
        if (searchInput) searchInput.value = '';
        categoryBtns.forEach((btn, i) => btn.classList.toggle('active', i === 0));
        filterFoodItems();
    }

    if (data.type === 'updateLocation') {
        locationDisplay.textContent = `📍 ${data.location}`;
    }
});

// ======================================================
// INITIAL LOAD
// ======================================================
document.body.classList.add('app-visible');

fetchNui('requestConfig').then(resp => {
    if (resp?.config) {
        const cfg = resp.config;

        RESOURCE_NAME = cfg.ResourceName || RESOURCE_NAME;
        DELIVERY_FEE = typeof cfg.DeliveryFee === 'number' ? cfg.DeliveryFee : DELIVERY_FEE;
        CURRENCY = cfg.Currency || CURRENCY;
        ENABLE_CACHE_BUSTING = typeof cfg.EnableCacheBusting === 'boolean' ? cfg.EnableCacheBUSTING : ENABLE_CACHE_BUSTING;
        DEBUG = cfg.Debug?.Enabled || false;

        if (Array.isArray(cfg.items)) {
            ITEMS = cfg.items;
            renderFoodItems(ITEMS);
        }

        const feeEl = document.getElementById('deliveryFee');
        if (feeEl) feeEl.textContent = `${CURRENCY}${DELIVERY_FEE.toFixed(2)}`;
    }
});

// Initial price update (safe no-op until modal used)
updatePrice();