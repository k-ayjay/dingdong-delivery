// ======================================================
// DingDong Delivery - Full Updated JavaScript
// All fixes applied: pricing, cart logic, modal logic,
// extras parsing, NUI safety, config injection, filtering.
// ======================================================

// DOM ELEMENTS
const cartBtn = document.getElementById('cartBtn');
const itemModal = document.getElementById('itemModal');
const checkoutModal = document.getElementById('checkoutModal');
const modalClose = document.querySelector('.modal-close');
const foodCards = document.querySelectorAll('.food-card');
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
let DELIVERY_FEE = 2.50;
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

    cartItemsList.innerHTML = '';

    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-row">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${CURRENCY}${itemTotal.toFixed(2)}</div>
            </div>
            <div class="cart-item-meta">
                <span class="cart-item-qty">Qty: ${item.quantity}</span>
                <span class="cart-item-size">${item.size}</span>
                ${item.extras.length > 0 ? `<div class="cart-item-extras">Extras: ${item.extras.join(', ')}</div>` : ''}
            </div>
        `;
        cartItemsList.appendChild(div);
    });

    const total = subtotal + DELIVERY_FEE;

    const subtotalEl = checkoutModal.querySelector('#subtotal');
    const totalEl = checkoutModal.querySelector('#orderTotal');
    const feeEl = checkoutModal.querySelector('#deliveryFee');

    if (subtotalEl) subtotalEl.textContent = `${CURRENCY}${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `${CURRENCY}${total.toFixed(2)}`;
    if (feeEl) feeEl.textContent = `${CURRENCY}${DELIVERY_FEE.toFixed(2)}`;

    checkoutModal.classList.add('active');
}

if (cartBtn) {
    cartBtn.addEventListener('click', () => {
        if (cartCount > 0) showCheckout();
    });
}

// ======================================================
// MODAL CLOSE
// ======================================================
if (modalClose) {
    modalClose.addEventListener('click', () => {
        itemModal.classList.remove('active');
        checkoutModal.classList.remove('active');
    });
}

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
                    confirmBtn.textContent = 'Checkout';
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
// ITEM MODAL
// ======================================================
function updateModal(name, price, itemId) {
    const title = itemModal.querySelector('.modal-title');
    const priceEl = itemModal.querySelector('.total-price');
    const btn = itemModal.querySelector('.modal-add-btn');

    const numericPrice = parseFloat(price.replace(CURRENCY, ''));

    if (title) title.textContent = name;
    if (priceEl) priceEl.textContent = `${CURRENCY}${numericPrice.toFixed(2)}`;
    if (btn) btn.dataset.itemId = itemId;

    itemModal.dataset.basePrice = numericPrice;
}

// Quantity
const qtyInput = itemModal.querySelector('.qty-input');
const qtyBtns = itemModal.querySelectorAll('.qty-btn');

if (qtyBtns.length >= 2) {
    qtyBtns[0].addEventListener('click', () => {
        const val = Math.max(1, parseInt(qtyInput.value) - 1);
        qtyInput.value = val;
        updatePrice();
    });

    qtyBtns[1].addEventListener('click', () => {
        qtyInput.value = parseInt(qtyInput.value) + 1;
        updatePrice();
    });
}

if (qtyInput) qtyInput.addEventListener('change', updatePrice);

// Size buttons
itemModal.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updatePrice();
    });
});

// Extras
itemModal.querySelectorAll('.checkbox-item input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', updatePrice);
});

// Price calculation
function updatePrice() {
    const base = parseFloat(itemModal.dataset.basePrice) || 0;
    const qty = parseInt(qtyInput.value) || 1;

    let extras = 0;
    itemModal.querySelectorAll('.checkbox-item input[type="checkbox"]:checked').forEach(cb => {
        const text = cb.parentElement.textContent;
        const match = text.match(/\$(\d+(\.\d+)?)/);
        if (match) extras += parseFloat(match[1]);
    });

    const total = (base + extras) * qty;
    const priceEl = itemModal.querySelector('.total-price');
    if (priceEl) priceEl.textContent = `${CURRENCY}${total.toFixed(2)}`;
}

// Add to cart
const addToCartBtn = itemModal.querySelector('.modal-add-btn');
if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
        const qty = parseInt(qtyInput.value);
        const name = itemModal.querySelector('.modal-title').textContent;
        const price = parseFloat(itemModal.querySelector('.total-price').textContent.replace(CURRENCY, ''));
        const id = addToCartBtn.dataset.itemId;

        const extras = [];
        itemModal.querySelectorAll('.checkbox-item input[type="checkbox"]:checked').forEach(cb => {
            extras.push(cb.parentElement.textContent.trim());
        });

        const sizeBtn = itemModal.querySelector('.option-btn.active');
        const size = sizeBtn ? sizeBtn.textContent : 'Default';

        const item = {
            id,
            name,
            quantity: qty,
            price,
            size,
            extras,
            totalPrice: price * qty
        };

        cart.push(item);
        cartCount += qty;
        document.querySelector('.cart-count').textContent = cartCount;

        fetchNui('addToCart', item);

        addToCartBtn.textContent = '✓ Added!';
        setTimeout(() => {
            addToCartBtn.textContent = 'Add';
            itemModal.classList.remove('active');
            qtyInput.value = 1;
            itemModal.querySelectorAll('.checkbox-item input').forEach(cb => cb.checked = false);
            itemModal.querySelectorAll('.option-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
            updatePrice();
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
// FOOD CARD CLICK HANDLING
// ======================================================
document.addEventListener('click', e => {
    const card = e.target.closest('.food-card');
    if (card && card.style.display !== 'none') {
        const name = card.querySelector('.food-name').textContent;
        const price = card.querySelector('.food-price').textContent;
        const index = Array.from(document.querySelectorAll('.food-card')).indexOf(card);

        updateModal(name, price, index);
        itemModal.classList.add('active');
    }

    const addBtn = e.target.closest('.add-btn');
    if (addBtn) {
        e.stopPropagation();
        const card = addBtn.closest('.food-card');
        const name = card.querySelector('.food-name').textContent;
        const price = parseFloat(card.querySelector('.food-price').textContent.replace(CURRENCY, ''));

        cart.push({
            id: Array.from(document.querySelectorAll('.food-card')).indexOf(card),
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
    }
});

// ======================================================
// RENDER FOOD ITEMS
// ======================================================
function renderFoodItems(items) {
    const grid = document.querySelector('.food-grid');
    if (!grid) return;

    grid.innerHTML = '';

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'food-card';
        card.dataset.category = item.category || 'all';
        card.dataset.name = item.name || '';

        const img = document.createElement('div');
        img.className = 'food-image';

        if (item.icon?.startsWith('http')) {
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
        searchInput.value = '';
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
        ENABLE_CACHE_BUSTING = typeof cfg.EnableCacheBusting === 'boolean' ? cfg.EnableCacheBusting : ENABLE_CACHE_BUSTING;

        if (Array.isArray(cfg.items)) {
            ITEMS = cfg.items;
            renderFoodItems(ITEMS);
        }

        const feeEl = document.getElementById('deliveryFee');
        if (feeEl) feeEl.textContent = `${CURRENCY}${DELIVERY_FEE.toFixed(2)}`;
    }
});

// Initial price update
updatePrice();