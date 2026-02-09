// Food Ordering App JavaScript

const cartBtn = document.getElementById('cartBtn');
const itemModal = document.getElementById('itemModal');
const checkoutModal = document.getElementById('checkoutModal');
const modalClose = document.querySelector('.modal-close');
const foodCards = document.querySelectorAll('.food-card');
const categoryBtns = document.querySelectorAll('.category-btn');
const searchInput = document.querySelector('.search-input');
const locationDisplay = document.querySelector('.location');
let cartCount = 0;
let cart = [];
let currentCategory = 'all';
let currentSearchQuery = '';
// Configurable values (will be updated via lb-phone message)
let DELIVERY_FEE = 2.50;
let RESOURCE_NAME = 'dingdong-delivery';
let CURRENCY = '$';
let ENABLE_CACHE_BUSTING = true;
let ITEMS = [];
let DEBUG = false;

function debugLog(...args) {
    if (DEBUG) console.log(...args);
}

function debugWarn(...args) {
    if (DEBUG) console.warn(...args);
}

function debugError(...args) {
    if (DEBUG) console.error(...args);
}

// Send message to NUI/Server
function fetchNui(eventName, data = {}) {
    return fetch(`https://${RESOURCE_NAME}/${eventName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .catch(error => console.error('NUI Error:', error));
}

// Get player location on startup
function getPlayerLocation() {
    debugLog('Requesting player location...');
    fetchNui('getLocation').then((data) => {
        debugLog('Location response:', data);
        if (data && data.location) {
            locationDisplay.textContent = `📍 ${data.location}`;
            console.log('Location updated to:', data.location);
        } else {
            console.warn('No location data received');
            locationDisplay.textContent = '📍 Loading location...';
        }
    }).catch(err => {
        debugError('Failed to get location:', err);
        locationDisplay.textContent = '📍 Error getting location';
    });
}

// Filter and display food items
function filterFoodItems() {
    const allCards = document.querySelectorAll('.food-card');
    let visibleCount = 0;

    allCards.forEach(card => {
        const category = card.dataset.category;
        const name = card.dataset.name.toLowerCase();
        
        const matchesCategory = currentCategory === 'all' || category === currentCategory;
        const matchesSearch = name.includes(currentSearchQuery.toLowerCase());
        
        if (matchesCategory && matchesSearch) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    // Show "no results" message if needed (handled by CSS/other logic)
}

// Search functionality
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value;
        filterFoodItems();
        fetchNui('search', { query: currentSearchQuery });
    });
}

// Show checkout modal
function showCheckout() {
    // Wait for DOM to be ready and search for the element
    let cartItemsList = null;
    let attempts = 0;
    const maxAttempts = 5;
    
    function findCartList() {
        if (!cartItemsList && attempts < maxAttempts) {
            cartItemsList = checkoutModal.querySelector('#cartItemsList');
            if (!cartItemsList) {
                cartItemsList = checkoutModal.querySelector('.cart-items-list');
            }
            attempts++;
            if (!cartItemsList) {
                setTimeout(findCartList, 100);
                return;
            }
        }
        
        // Clear and populate cart items
        cartItemsList.innerHTML = '';
        
        let subtotal = 0;
        cart.forEach(item => {
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            subtotal += itemTotal;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            // Layout: name on left, item total on right, qty/size/extras below
            itemDiv.innerHTML = `
                <div class="cart-item-row">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${itemTotal.toFixed(2)}</div>
                </div>
                <div class="cart-item-meta">
                    <span class="cart-item-qty">Qty: ${item.quantity}</span>
                    <span class="cart-item-size">${item.size || ''}</span>
                    ${item.extras && item.extras.length > 0 ? `<div class="cart-item-extras">Extras: ${item.extras.join(', ')}</div>` : ''}
                </div>
            `;
            cartItemsList.appendChild(itemDiv);
        });
        
        // Calculate totals
        const total = subtotal + DELIVERY_FEE;
        const subtotalElement = checkoutModal.querySelector('#subtotal');
        const orderTotalElement = checkoutModal.querySelector('#orderTotal');
        
        if (subtotalElement) subtotalElement.textContent = `${CURRENCY}${subtotal.toFixed(2)}`;
        if (orderTotalElement) orderTotalElement.textContent = `${CURRENCY}${total.toFixed(2)}`;
        const deliveryFeeElement = checkoutModal.querySelector('#deliveryFee');
        if (deliveryFeeElement) deliveryFeeElement.textContent = `${CURRENCY}${DELIVERY_FEE.toFixed(2)}`;
        
        // Ensure checkout modal is visible (fallback) then show
        if (checkoutModal) {
            checkoutModal.classList.add('active');
            // Update checkout button label to 'Checkout'
            const checkoutBtn = checkoutModal.querySelector('#confirmOrderBtn') || document.getElementById('confirmOrderBtn');
            if (checkoutBtn) checkoutBtn.textContent = 'Checkout';
        }
    }
    
    findCartList();
}

// Cart functionality
if (cartBtn) {
    cartBtn.addEventListener('click', () => {
        if (cartCount > 0) {
            showCheckout();
        }
    });
}

// Close modal
modalClose.addEventListener('click', () => {
    itemModal.classList.remove('active');
    checkoutModal.classList.remove('active');
});

// Close modals when clicking outside
itemModal.addEventListener('click', (e) => {
    if (e.target === itemModal) {
        itemModal.classList.remove('active');
    }
});

checkoutModal.addEventListener('click', (e) => {
    if (e.target === checkoutModal) {
        checkoutModal.classList.remove('active');
    }
});

// Checkout button handlers
document.getElementById('backToShoppingBtn').addEventListener('click', () => {
    checkoutModal.classList.remove('active');
});

document.getElementById('confirmOrderBtn').addEventListener('click', () => {
    const deliveryNotes = document.getElementById('deliveryNotes').value;
    const subtotal = parseFloat(document.getElementById('subtotal').textContent.replace(CURRENCY, ''));
    const orderTotal = parseFloat(document.getElementById('orderTotal').textContent.replace(CURRENCY, ''));
    
    const orderData = {
        items: cart,
        deliveryNotes: deliveryNotes,
        subtotal: subtotal,
        deliveryFee: DELIVERY_FEE,
        total: orderTotal,
        timestamp: new Date().toISOString()
    };
    
    // Send to server
    fetchNui('placeOrder', orderData).then((response) => {
        if (response && response.success) {
            // Show success message
            const btn = document.getElementById('confirmOrderBtn');
            const original = btn.textContent;
            btn.textContent = '✓ Order Placed!';
            
            setTimeout(() => {
                btn.textContent = original;
                checkoutModal.classList.remove('active');
                
                // Clear cart
                cart = [];
                cartCount = 0;
                const countElement = document.querySelector('.cart-count');
                if (countElement) countElement.textContent = 0;
            }, 1500);
        }
    })
});

// Update modal with selected item data
function updateModal(name, price, itemId) {
    const titleEl = itemModal.querySelector('.modal-title');
    const priceEl = itemModal.querySelector('.total-price');
    const btnEl = itemModal.querySelector('.modal-add-btn');
    
    if (titleEl) titleEl.textContent = name;
    if (priceEl) priceEl.textContent = price;
    if (btnEl) btnEl.dataset.itemId = itemId;
}

// Quantity controls in modal
const qtyInput = itemModal.querySelector('.qty-input');
const qtyDecBtn = itemModal.querySelectorAll('.qty-btn')[0];
const qtyIncBtn = itemModal.querySelectorAll('.qty-btn')[1];

qtyDecBtn.addEventListener('click', () => {
    const val = parseInt(qtyInput.value);
    if (val > 1) qtyInput.value = val - 1;
    updatePrice();
});

qtyIncBtn.addEventListener('click', () => {
    const val = parseInt(qtyInput.value);
    qtyInput.value = val + 1;
    updatePrice();
});

qtyInput.addEventListener('change', updatePrice);

// Size option selection
itemModal.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updatePrice();
    });
});

// Checkbox extras
itemModal.querySelectorAll('.checkbox-item input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', updatePrice);
});

// Update price based on selections
function updatePrice() {
    let price = 8.99; // Base price
    const quantity = parseInt(qtyInput.value);
    let extras = 0;

    // Add extras cost
    itemModal.querySelectorAll('.checkbox-item input[type="checkbox"]:checked').forEach(checkbox => {
        const text = checkbox.parentElement.textContent;
        if (text.includes('$1)')) extras += 1;
        else if (text.includes('$2)')) extras += 2;
        else if (text.includes('$1.50)')) extras += 1.5;
    });

    const total = (price + extras) * quantity;
    const priceEl = itemModal.querySelector('.total-price');
    if (priceEl) priceEl.textContent = `$${total.toFixed(2)}`;
}

// Add to cart from modal
const addToCartBtn = itemModal.querySelector('.modal-add-btn');
if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
    const quantity = parseInt(itemModal.querySelector('.qty-input').value);
    const itemName = itemModal.querySelector('.modal-title').textContent;
    const basePrice = parseFloat(itemModal.querySelector('.total-price').textContent);
    const itemId = itemModal.querySelector('.modal-add-btn').dataset.itemId;
    
    // Get selected extras
    const extras = [];
    itemModal.querySelectorAll('.checkbox-item input[type="checkbox"]:checked').forEach(checkbox => {
        extras.push(checkbox.parentElement.textContent.trim());
    });
    
    // Get selected size
    const sizeBtn = itemModal.querySelector('.option-btn.active');
    const size = sizeBtn ? sizeBtn.textContent : 'Default';
    
    // Add to cart array
    const cartItem = {
        id: itemId,
        name: itemName,
        quantity: quantity,
        price: basePrice,
        size: size,
        extras: extras,
        totalPrice: basePrice * quantity
    };
    
    cart.push(cartItem);
    cartCount += quantity;
    const countElement = document.querySelector('.cart-count');
    if (countElement) countElement.textContent = cartCount;
    
    // Send to server
    fetchNui('addToCart', cartItem);
    
    // Show confirmation
    const btn = itemModal.querySelector('.modal-add-btn');
    const original = btn.textContent;
    btn.textContent = '✓ Added!';
    setTimeout(() => {
        btn.textContent = original;
        itemModal.classList.remove('active');
        // Reset form
        itemModal.querySelector('.qty-input').value = 1;
        itemModal.querySelectorAll('.checkbox-item input[type="checkbox"]').forEach(cb => cb.checked = false);
        itemModal.querySelectorAll('.option-btn').forEach((b, i) => {
            if (i === 0) b.classList.add('active');
            else b.classList.remove('active');
        });
        updatePrice();
    }, 1000);
    });
}

// Category filtering
categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        filterFoodItems();
        fetchNui('filterCategory', { category: currentCategory });
    });
});

// Event delegation for food cards and add buttons
document.addEventListener('click', function(e) {
    // Handle food card clicks
    if (e.target.closest('.food-card:not([style*="display: none"])')) {
        const card = e.target.closest('.food-card');
        if (card && card.style.display !== 'none') {
            const foodName = card.querySelector('.food-name').textContent;
            const foodPrice = card.querySelector('.food-price').textContent;
            const foodIndex = Array.from(document.querySelectorAll('.food-card')).indexOf(card);
            updateModal(foodName, foodPrice, foodIndex);
            itemModal.classList.add('active');
        }
    }

    // Handle add button clicks
    if (e.target.closest('.add-btn')) {
        e.stopPropagation();
        const btn = e.target.closest('.add-btn');
        const card = btn.closest('.food-card');
        const name = card.querySelector('.food-name').textContent;
        const price = card.querySelector('.food-price').textContent;
        
        cart.push({
            id: Array.from(document.querySelectorAll('.food-card')).indexOf(card),
            name: name,
            quantity: 1,
            price: parseFloat(price),
            size: 'Default',
            extras: []
        });
        
        cartCount++;
        const countElement = document.querySelector('.cart-count');
        if (countElement) countElement.textContent = cartCount;
        
        // Visual feedback
        btn.textContent = '✓';
        setTimeout(() => {
            btn.textContent = '+';
        }, 500);
        
        fetchNui('quickAddItem', { name, price });
    }
});

// Initial price update
updatePrice();

// Get location on load
getPlayerLocation();

// Listen for messages from server
window.addEventListener('message', (event) => {
    const data = event.data;
    debugLog('NUI message received:', data);
    
    if (data.type === 'config') {
        // Apply configuration from client
        if (data.config) {
            RESOURCE_NAME = data.config.ResourceName || RESOURCE_NAME;
            DELIVERY_FEE = (typeof data.config.DeliveryFee === 'number') ? data.config.DeliveryFee : DELIVERY_FEE;
            CURRENCY = data.config.Currency || CURRENCY;
            ENABLE_CACHE_BUSTING = (typeof data.config.EnableCacheBusting === 'boolean') ? data.config.EnableCacheBusting : ENABLE_CACHE_BUSTING;
            if (Array.isArray(data.config.items)) {
                ITEMS = data.config.items;
                renderFoodItems(ITEMS);
            }
            // Update delivery fee display if present
            const deliveryFeeEl = document.getElementById('deliveryFee');
            if (deliveryFeeEl) deliveryFeeEl.textContent = `${CURRENCY}${DELIVERY_FEE.toFixed(2)}`;
        }
    }
    else if (data.type === 'openMenu') {
        document.body.classList.add('app-visible');
        getPlayerLocation(); // Update location when menu opens
    } else if (data.type === 'closeMenu') {
        document.body.classList.remove('app-visible');
        cart = [];
        cartCount = 0;
        currentCategory = 'all';
        currentSearchQuery = '';
        // Reset UI
        searchInput.value = '';
        categoryBtns.forEach((btn, i) => {
            if (i === 0) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        filterFoodItems();
    } else if (data.type === 'updateLocation') {
        // Real-time location updates
        locationDisplay.textContent = `📍 ${data.location}`;
    }
});

// Render food items into the grid from config
function renderFoodItems(items) {
    const grid = document.querySelector('.food-grid');
    if (!grid) return;
    // Clear existing items
    grid.innerHTML = '';

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'food-card';
        card.dataset.category = item.category || 'all';
        card.dataset.name = item.name || '';

        const imageDiv = document.createElement('div');
        imageDiv.className = 'food-image';
        imageDiv.textContent = item.icon || '🍽️';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'food-info';

        const h3 = document.createElement('h3');
        h3.className = 'food-name';
        h3.textContent = item.name || '';

        const p = document.createElement('p');
        p.className = 'food-desc';
        p.textContent = item.desc || '';

        const footer = document.createElement('div');
        footer.className = 'food-footer';
        const priceSpan = document.createElement('span');
        priceSpan.className = 'food-price';
        const priceVal = (typeof item.price === 'number') ? item.price : parseFloat(item.price) || 0;
        priceSpan.textContent = `${CURRENCY}${priceVal.toFixed(2)}`;
        const addBtn = document.createElement('button');
        addBtn.className = 'add-btn';
        addBtn.textContent = '+';

        footer.appendChild(priceSpan);
        footer.appendChild(addBtn);

        infoDiv.appendChild(h3);
        infoDiv.appendChild(p);
        infoDiv.appendChild(footer);

        card.appendChild(imageDiv);
        card.appendChild(infoDiv);

        grid.appendChild(card);
    });

    // Re-apply current filters/search
    filterFoodItems();
}

// If the UI missed the lb-phone config message, request it directly from the client
document.body.classList.add('app-visible');

fetchNui('requestConfig').then(resp => {
    if (resp && resp.config) {
        const cfg = resp.config;
        RESOURCE_NAME = cfg.ResourceName || RESOURCE_NAME;
        DELIVERY_FEE = (typeof cfg.DeliveryFee === 'number') ? cfg.DeliveryFee : DELIVERY_FEE;
        CURRENCY = cfg.Currency || CURRENCY;
        ENABLE_CACHE_BUSTING = (typeof cfg.EnableCacheBusting === 'boolean') ? cfg.EnableCacheBusting : ENABLE_CACHE_BUSTING;
        if (Array.isArray(cfg.items)) {
            ITEMS = cfg.items;
            renderFoodItems(ITEMS);
        }
        const deliveryFeeEl = document.getElementById('deliveryFee');
        if (deliveryFeeEl) deliveryFeeEl.textContent = `${CURRENCY}${DELIVERY_FEE.toFixed(2)}`;
        debugLog('Config loaded via requestConfig NUI callback', cfg);
    }
})