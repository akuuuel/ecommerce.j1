// ============================================
// RUMAH MAKAN PADANG - Main JavaScript
// Cart Management & Interactive Features
// ============================================

// ============================================
// Authentication System
// ============================================

// Hamburger Menu Toggle
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
}

// User Credentials (Simple prototype - in production use backend)
const users = {
    'admin@rmpadang.com': {
        password: 'admin123',
        name: 'Admin RM Padang',
        role: 'admin'
    },
    'user@rmpadang.com': {
        password: 'user123',
        name: 'Tamu Kehormatan',
        role: 'customer'
    }
};

// Login Function
function login(email, password) {
    const user = users[email];
    if (user && user.password === password) {
        localStorage.setItem('currentUser', JSON.stringify({
            email: email,
            name: user.name,
            role: user.role
        }));
        return { success: true, message: 'Login berhasil!' };
    }
    return { success: false, message: 'Email atau password salah' };
}

// Register Function
function register(name, email, password, confirmPassword) {
    if (password !== confirmPassword) {
        return { success: false, message: 'Password tidak cocok' };
    }
    if (users[email]) {
        return { success: false, message: 'Email sudah terdaftar' };
    }
    users[email] = { password: password, name: name, role: 'customer' };
    return { success: true, message: 'Pendaftaran berhasil! Silakan login.' };
}

// Logout Function
function logout() {
    localStorage.removeItem('currentUser');
    showToast('Logout berhasil');
    window.location.href = 'index.html';
}

// Get Current User
function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

// Check if User is Logged In
function isLoggedIn() {
    return getCurrentUser() !== null;
}

// Protect Admin Page
function protectAdminPage() {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        showToast('Akses ditolak! Silakan login sebagai admin');
        window.location.href = 'login.html';
    }
}

// Cart State
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Sample Products Data (untuk halaman detail & preview)
// Note: Product data is now managed via the Database class (db) and localStorage.
// The hardcoded object here has been removed to ensure consistency with the admin panel.

// ============================================
// Cart Functions
// ============================================

// Add to Cart
function addToCart(productId, quantity = 1, notes = '', spicyLevel = '') {
    const allProducts = db.getProducts();
    const product = allProducts.find(p => p.id === productId);
    if (!product) return false;

    // Check if product is out of stock
    if (product.stock <= 0) {
        showToast('Maaf, stok produk ini sedang habis!', 'error');
        return false;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    const currentQuantityInCart = existingItem ? existingItem.quantity : 0;

    // Check if requested quantity exceeds available stock
    if (currentQuantityInCart + quantity > product.stock) {
        showToast(`Maaf, stok tidak mencukupi. Sisa stok: ${product.stock}`, 'error');
        return false;
    }
    
    if (existingItem) {
        existingItem.quantity += quantity;
        if (notes) existingItem.notes = notes;
        if (spicyLevel) existingItem.spicyLevel = spicyLevel;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity,
            notes: notes,
            spicyLevel: spicyLevel
        });
    }
    
    saveCart();
    updateCartCount();
    showToast('Berhasil ditambahkan ke keranjang!');
    return true;
}

// Update Cart Item Quantity
function updateQuantity(productId, newQuantity) {
    const allProducts = db.getProducts();
    const product = allProducts.find(p => p.id === productId);
    const item = cart.find(item => item.id === productId);
    
    if (item && product) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        } 
        
        // Check stock
        if (newQuantity > product.stock) {
            showToast(`Maaf, stok tidak mencukupi. Maksimal: ${product.stock}`, 'error');
            return;
        }

        item.quantity = newQuantity;
        saveCart();
    }
    updateCartCount();
    renderCartPage();
}

// Remove from Cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    renderCartPage();
    showToast('Item dihapus dari keranjang');
}

// Get Cart Total
function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Get Cart Item Count
function getCartItemCount() {
    return cart.reduce((count, item) => count + item.quantity, 0);
}

// Save Cart to Local Storage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Update Cart Count Display
function updateCartCount() {
    const cartCountElements = document.querySelectorAll('.cart-count');
    const count = getCartItemCount();
    cartCountElements.forEach(el => {
        el.textContent = count;
        // In Shopee style, we usually show 0 as hidden or 0, let's keep it visible if count > 0
        el.style.display = count > 0 ? 'block' : 'none';
    });
}

// ============================================
// UI Functions
// ============================================

// Show Toast Notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (type === 'error') {
        toast.style.backgroundColor = 'var(--accent)';
    } else {
        toast.style.backgroundColor = 'var(--primary)';
    }
    toast.innerHTML = `
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Render Cart Page
function renderCartPage() {
    const cartContainer = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('summary-subtotal');
    const serviceEl = document.getElementById('summary-service');
    const totalElement = document.getElementById('cart-total');
    
    if (!cartContainer) return;
    
    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div style="text-align: center; padding: 5rem 2rem; background: white; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.02);">
                <div style="font-size: 4rem; margin-bottom: 1.5rem;"><i class="fa-solid fa-basket-shopping"></i></div>
                <h2 style="font-family: 'Fraunces', serif; margin-bottom: 1rem;">Keranjang Masih Kosong</h2>
                <p style="color: var(--gray-500); margin-bottom: 2rem;">Sepertinya Anda belum memilih hidangan spesial kami hari ini.</p>
                <a href="menu.html" class="btn-primary" style="padding: 1rem 2.5rem; border-radius: 12px; text-decoration: none;">Eksplor Menu Minang</a>
            </div>
        `;
        if (subtotalEl) subtotalEl.textContent = 'Rp 0';
        if (serviceEl) serviceEl.textContent = 'Rp 0';
        if (totalElement) totalElement.textContent = 'Rp 0';
        return;
    }
    
    cartContainer.innerHTML = cart.map(item => `
        <div class="cart-item-card">
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-info">
                <div class="cart-item-header">
                    <h3 class="cart-item-title">${item.name}</h3>
                    <div class="cart-item-meta">
                        ${item.spicyLevel ? `<span><i class="fa-solid fa-pepper-hot"></i> Pedas: ${item.spicyLevel}</span>` : ''}
                        ${item.notes ? `<span><i class="fa-solid fa-note-sticky"></i> Catatan: ${item.notes}</span>` : ''}
                    </div>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-control-modern">
                        <button class="q-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                        <span class="q-val">${item.quantity}</span>
                        <button class="q-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                    <button class="remove-btn-sm" onclick="removeFromCart('${item.id}')">
                        <i class="fa-solid fa-trash-can"></i> Hapus
                    </button>
                </div>
            </div>
            <div class="cart-item-subtotal">
                <p>Subtotal</p>
                <strong>Rp ${(item.price * item.quantity).toLocaleString()}</strong>
            </div>
        </div>
    `).join('');
    
    const subtotal = getCartTotal();
    const serviceFee = Math.round(subtotal * 0.05);
    const total = subtotal + serviceFee;

    if (subtotalEl) subtotalEl.textContent = `Rp ${subtotal.toLocaleString()}`;
    if (serviceEl) serviceEl.textContent = `Rp ${serviceFee.toLocaleString()}`;
    if (totalElement) totalElement.textContent = `Rp ${total.toLocaleString()}`;
}

// ============================================
// Search & Filter Functions
// ============================================

// Search Products
function searchProducts() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const title = card.querySelector('.product-title')?.textContent.toLowerCase();
        if (title && title.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Filter by Category
function filterByCategory(category) {
    renderMenuPage(category);
    showToast(`Menampilkan produk: ${category}`);
}

// ============================================
// Image Preview
// ============================================

function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    if (input.files && input.files[0] && preview) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ============================================
// Navigation & Mobile Menu
// ============================================

// Mobile Menu Toggle
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
}

// Navigate to Page with Cart State
function navigateTo(page) {
    window.location.href = page;
}

// ============================================
// Checkout Process
// ============================================

function processCheckout(event) {
    if (event) event.preventDefault();
    
    if (cart.length === 0) {
        showToast('Keranjang masih kosong!', 'error');
        return false;
    }

    const form = document.getElementById('checkout-form');
    if (!form) return false;

    // Extract form data
    const name = form.querySelector('[name="name"]')?.value || 'Guest';
    const phone = form.querySelector('[name="phone"]')?.value || '-';
    const address = form.querySelector('[name="address"]')?.value || '-';
    const shipping = form.querySelector('[name="shipping"]:checked')?.value || '-';
    const payment = form.querySelector('[name="payment"]:checked')?.value || '-';
    const notes = form.querySelector('[name="notes"]')?.value || '';

    const overlay = document.getElementById('checkout-modal-overlay');
    const modalBody = document.getElementById('modal-body');

    if (!overlay || !modalBody) return false;

    // Step 1: Shipping Simulation
    function stepShipping() {
        if (shipping === 'Ambil Sendiri') {
            stepPayment();
            return;
        }

        overlay.style.display = 'flex';
        let icon = '';
        let brandColor = '#5D4037';
        
        const shippingConfig = {
            'Gojek': { icon: '<i class="fa-solid fa-motorcycle"></i>', color: '#00AA13', logo: 'aset/gojek.png' },
            'Grab': { icon: '<i class="fa-solid fa-truck-fast"></i>', color: '#00B14F', logo: 'aset/grab.png' },
            'ShopeeFood': { icon: '<i class="fa-solid fa-bag-shopping"></i>', color: '#EE4D2D', logo: 'aset/shopeefood.png' },
            'J&T': { icon: '<i class="fa-solid fa-truck"></i>', color: '#FF0000', logo: 'aset/jnt.png' },
            'Sicepat': { icon: '<i class="fa-solid fa-truck-moving"></i>', color: '#D40000', logo: 'aset/sicepat.png' }
        };

        const config = shippingConfig[shipping] || { icon: '<i class="fa-solid fa-box"></i>', color: '#5D4037', logo: '' };
        
        modalBody.innerHTML = `
            ${config.logo ? `<img src="${config.logo}" style="height: 60px; margin-bottom: 1rem; object-fit: contain;">` : `<div style="font-size: 4rem; margin-bottom: 1rem;">${config.icon}</div>`}
            <h2 style="color: ${config.color}; margin-bottom: 0.5rem;">Menghubungkan ke ${shipping}...</h2>
            <p style="margin-bottom: 1.5rem;">Mohon tunggu, kami sedang memproses pengiriman Anda.</p>
            <div class="loading-bar" style="height: 6px; background: #eee; border-radius: 3px; overflow: hidden; margin-bottom: 1.5rem;">
                <div style="width: 100%; height: 100%; background: ${config.color}; animation: loading 2s linear;"></div>
            </div>
            <button class="btn-primary" id="confirm-shipping" style="width: 100%; background: ${config.color};">Lanjut ke Pembayaran</button>
        `;

        document.getElementById('confirm-shipping').onclick = () => {
            stepPayment();
        };
    }

    // Step 2: Payment Simulation
    function stepPayment() {
        overlay.style.display = 'flex';
        let modalHTML = '';
        let paymentColor = '#5D4037';

        const paymentConfig = {
            'QRIS': { logo: 'aset/qris.png', color: '#333' },
            'GoPay': { logo: 'aset/gopay.png', color: '#00AED6' },
            'Dana': { logo: 'aset/dana.png', color: '#108EE9' },
            'OVO': { logo: 'aset/ovo.png', color: '#4C2A86' },
            'ShopeePay': { logo: 'aset/shopeepay.png', color: '#EE4D2D' },
            'BRI': { logo: 'aset/bri.png', color: '#00529C' },
            'BNI': { logo: 'aset/bni.png', color: '#F15A23' },
            'Mandiri': { logo: 'aset/mandiri.png', color: '#FDB813' }
        };

        const config = paymentConfig[payment] || { logo: '', color: '#5D4037' };
        paymentColor = config.color;

        if (payment === 'QRIS') {
            modalHTML = `
                <div style="background: #fff; border-radius: 12px; padding: 1.5rem; text-align: center;">
                    <img src="aset/qris.png" style="height: 40px; margin-bottom: 1rem;" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg'">
                    <h3 style="margin-bottom: 0.5rem; color: #333;">RUMAH MAKAN PADANG</h3>
                    <p style="font-size: 0.8rem; color: #666; margin-bottom: 1rem;">NMID: ID1234567890</p>
                    <div style="background: #f9f9f9; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; display: inline-block;">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=RM-PADANG-PAY-ID-${Date.now()}" style="display: block;">
                    </div>
                    <div style="font-size: 1.2rem; font-weight: 700; color: var(--accent); margin-bottom: 1rem;">Rp ${getCartTotal().toLocaleString()}</div>
                    <p style="font-size: 0.85rem; color: #666; margin-bottom: 1.5rem;">Silakan scan QR di atas menggunakan aplikasi pembayaran Anda.</p>
                    <button class="btn-primary" id="confirm-payment" style="width: 100%; background: #333;">Saya Sudah Bayar</button>
                </div>
            `;
        } else if (['GoPay', 'Dana', 'OVO', 'ShopeePay'].includes(payment)) {
            modalHTML = `
                <div style="text-align: center;">
                    <img src="${config.logo}" style="height: 50px; margin-bottom: 1.5rem;" onerror="this.style.display='none'">
                    <h2 style="margin-bottom: 1rem;">Konfirmasi di Aplikasi</h2>
                    <p style="margin-bottom: 1.5rem; color: #666;">Kami telah mengirimkan permintaan pembayaran ke akun <strong>${payment}</strong> Anda.</p>
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                        <div style="font-size: 0.85rem; color: #166534;">Total Tagihan</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #166534;">Rp ${getCartTotal().toLocaleString()}</div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <button class="btn-primary" id="confirm-payment" style="width: 100%; background: ${paymentColor};">Buka Aplikasi ${payment}</button>
                        <button class="btn-secondary" onclick="document.getElementById('checkout-modal-overlay').style.display='none'" style="width: 100%; border: none;">Batal</button>
                    </div>
                </div>
            `;
        } else {
            // Bank Transfer
            modalHTML = `
                <div style="text-align: left;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h2 style="font-size: 1.25rem;">Transfer Virtual Account</h2>
                        <img src="${config.logo}" style="height: 30px;" onerror="this.style.display='none'">
                    </div>
                    <p style="margin-bottom: 0.5rem; color: #666; font-size: 0.9rem;">Nomor Virtual Account:</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #f3f4f6; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                        <span style="font-size: 1.25rem; font-weight: 700; color: var(--primary); letter-spacing: 1px;">8800 0812 3456 7890</span>
                        <button onclick="showToast('Nomor VA disalin')" style="background: none; border: none; color: var(--secondary); font-weight: 700; cursor: pointer;">Salin</button>
                    </div>
                    <div style="margin-bottom: 1.5rem;">
                        <p style="font-size: 0.9rem; color: #666; margin-bottom: 0.25rem;">Total Pembayaran:</p>
                        <p style="font-size: 1.25rem; font-weight: 700; color: var(--accent);">Rp ${getCartTotal().toLocaleString()}</p>
                    </div>
                    <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                        <p style="font-size: 0.8rem; color: #92400e;"><strong>Penting:</strong> Masukkan nomor Virtual Account dengan benar agar pesanan dapat diproses secara otomatis.</p>
                    </div>
                    <button class="btn-primary" id="confirm-payment" style="width: 100%; background: ${paymentColor};">Konfirmasi Pembayaran</button>
                </div>
            `;
        }

        modalBody.innerHTML = modalHTML;

        document.getElementById('confirm-payment').onclick = () => {
            completeCheckout();
        };
    }

    // Step 3: Complete Checkout
    function completeCheckout() {
        modalBody.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 1rem;"><i class="fa-solid fa-circle-check" style="color: #22c55e;"></i></div>
            <h2 style="color: var(--primary);">Pesanan Berhasil!</h2>
            <p style="margin-bottom: 1.5rem;">Pesanan Anda telah diterima dan sedang disiapkan oleh dapur kami.</p>
            <div style="text-align: left; background: #f9f9f9; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.9rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span>Metode:</span> <strong>${shipping}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>Pembayaran:</span> <strong>${payment}</strong></div>
            </div>
            <button class="btn-primary" style="width: 100%;" onclick="window.location.href='index.html'">Kembali ke Beranda</button>
        `;

        // Create order object
        const newOrder = {
            customer: name,
            email: getCurrentUser()?.email || 'guest@example.com',
            phone: phone,
            address: address,
            items: cart.length,
            total: getCartTotal(),
            status: 'Diproses',
            date: new Date().toISOString().split('T')[0],
            details: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            }))
        };

        // Save to "database"
        const savedOrder = db.addOrder(newOrder);

        // Save order ID to browser cache (localStorage) for history tracking without login
        const myOrders = JSON.parse(localStorage.getItem('myOrders') || '[]');
        myOrders.push(savedOrder.id);
        localStorage.setItem('myOrders', JSON.stringify(myOrders));

        // Reduce stock in database
        cart.forEach(item => {
            db.updateStock(item.id, -item.quantity);
        });
        
        // Clear cart
        cart = [];
        saveCart();
        updateCartCount();
    }

    // Start flow
    stepShipping();
    
    return false;
}

// Render Home Page Products (Top 6)
function renderHomePage() {
    const grid = document.getElementById('home-product-grid');
    if (!grid) return;
    
    const products = db.getProducts().slice(0, 6);
    grid.innerHTML = products.map(product => {
        const isOutOfStock = product.stock <= 0;
        const stockStatus = isOutOfStock ? '<span style="color: var(--accent); font-size: 0.8rem; font-weight: 700;">STOK HABIS</span>' : `<span style="color: var(--primary); font-size: 0.8rem;">Stok: ${product.stock}</span>`;
        
        return `
            <div class="card product-card" data-id="${product.id}" onclick="window.location.href='detail.html?id=${product.id}'">
                <img src="${product.image || 'https://placehold.co/400x300?text=Product+Image'}" 
                    alt="${product.name}" 
                    class="product-image"
                    style="${isOutOfStock ? 'filter: grayscale(1); opacity: 0.7;' : ''}"
                    onerror="this.onerror=null; this.src='https://placehold.co/400x300?text=${encodeURIComponent(product.name)}';">
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div style="margin-bottom: 0.5rem;">${stockStatus}</div>
                    <p class="product-price">Rp ${product.price.toLocaleString()}</p>
                    <button class="btn-primary add-to-cart-btn" 
                        onclick="event.stopPropagation(); addToCart(${product.id})" 
                        style="width: 100%; margin-top: 0.5rem; ${isOutOfStock ? 'background: var(--gray-400); cursor: not-allowed;' : ''}"
                        ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'Habis' : 'Tambah ke Keranjang'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Render Menu Page Dynamically
function renderMenuPage(filterCategory = 'Semua', limit = 9) {
    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) return;

    const products = db.getProducts();
    let filteredProducts = filterCategory === 'Semua' 
        ? products 
        : products.filter(p => p.category === filterCategory);

    // Apply limit
    filteredProducts = filteredProducts.slice(0, limit);

    if (filteredProducts.length === 0) {
        productGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem;"><h3>Menu tidak ditemukan</h3></div>';
        return;
    }

    productGrid.innerHTML = filteredProducts.map(product => {
        const isOutOfStock = product.stock <= 0;
        const stockStatus = isOutOfStock ? '<span style="color: var(--accent); font-size: 0.8rem; font-weight: 700;">STOK HABIS</span>' : `<span style="color: var(--primary); font-size: 0.8rem;">Stok: ${product.stock}</span>`;

        return `
            <div class="card product-card" data-id="${product.id}" onclick="window.location.href='detail.html?id=${product.id}'">
                <img src="${product.image || 'https://placehold.co/400x300?text=Product+Image'}" 
                    alt="${product.name}" 
                    class="product-image"
                    style="${isOutOfStock ? 'filter: grayscale(1); opacity: 0.7;' : ''}"
                    onerror="this.onerror=null; this.src='https://placehold.co/400x300?text=${encodeURIComponent(product.name)}';">
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p style="font-size: 0.85rem; color: #888;">${product.category}</p>
                    <div style="margin-bottom: 0.5rem;">${stockStatus}</div>
                    <p>${product.description || 'Kelezatan autentik khas Minang'}</p>
                    <p class="product-price">Rp ${product.price.toLocaleString()}</p>
                    <button class="btn-primary add-to-cart-btn" 
                        onclick="event.stopPropagation(); addToCart(${product.id})" 
                        style="width: 100%; ${isOutOfStock ? 'background: var(--gray-400); cursor: not-allowed;' : ''}"
                        ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'Habis' : 'Tambah ke Keranjang'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// Centralized Database Management System
// ============================================

// Database Management
class Database {
    constructor() {
        this.initData();
    }

    initData() {
        const DB_VERSION = '2.1'; // Updated for RUMAH MAKAN PADANG rebranding
        const currentVersion = localStorage.getItem('dbVersion');

        if (!localStorage.getItem('dbProducts') || currentVersion !== DB_VERSION) {
            console.log('Updating database to version ' + DB_VERSION);
            localStorage.setItem('dbProducts', JSON.stringify([
                // Resep Warisan (Makanan Berat)
                { id: 1, name: 'Nasi Goreng Keraton', price: 45000, stock: 50, category: 'Resep Warisan', image: 'https://images.unsplash.com/photo-1680675027408-7232d86cbc47?q=80&w=1170&auto=format&fit=crop' },
                { id: 2, name: 'Sate Maranggi Heritage', price: 55000, stock: 45, category: 'Resep Warisan', image: 'https://images.unsplash.com/photo-1645696301019-35adcc18fc21?q=80&w=1629&auto=format&fit=crop' },
                { id: 3, name: 'Rawon Hitam Peuyeum', price: 60000, stock: 25, category: 'Resep Warisan', image: 'https://images.unsplash.com/photo-1677921739245-4efaa1914ef3?q=80&w=1170&auto=format&fit=crop' },
                { id: 4, name: 'Gado-gado Premium', price: 38000, stock: 60, category: 'Resep Warisan', image: 'https://images.unsplash.com/photo-1707269561481-a4a0370a980a?q=80&w=676&auto=format&fit=crop' },
                { id: 5, name: 'Soto Betawi Istimewa', price: 45000, stock: 40, category: 'Resep Warisan', image: 'https://images.unsplash.com/photo-1687425973269-af0d62587769?q=80&w=1170&auto=format&fit=crop' },
                // Camilan Klasik (Street Food)
                { id: 7, name: 'Lumpia Semarang Klasik', price: 25000, stock: 80, category: 'Camilan Klasik', image: 'https://images.unsplash.com/photo-1695712641569-05eee7b37b6d?q=80&w=1170&auto=format&fit=crop' },
                { id: 8, name: 'Tahu Telur Heritage', price: 22000, stock: 70, category: 'Camilan Klasik', image: 'https://images.unsplash.com/photo-1585521537000-c2fd8b2d5e7f?w=800' },
                { id: 9, name: 'Pisang Goreng Madu', price: 18000, stock: 55, category: 'Camilan Klasik', image: 'https://images.unsplash.com/photo-1634353866099-d7360a67eafd?w=800' },
                // Segar Alami (Minuman)
                { id: 6, name: 'Es Cendol Gula Aren', price: 20000, stock: 100, category: 'Segar Alami', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800' }
            ]));
            
            localStorage.setItem('dbOrders', JSON.stringify([
                { id: 'ORD001', customer: 'Budi Santoso', email: 'budi@email.com', items: 5, total: 75000, status: 'Selesai', date: '2026-04-25', phone: '08123456789', address: 'Jl. Merdeka No. 123', details: [{id: 1, name: 'Nasi Goreng Keraton', price: 45000, quantity: 1}, {id: 7, name: 'Lumpia Semarang Klasik', price: 25000, quantity: 1}, {id: 6, name: 'Es Cendol Gula Aren', price: 20000, quantity: 2}] },
                { id: 'ORD002', customer: 'Siti Aminah', email: 'siti@email.com', items: 3, total: 120000, status: 'Diproses', date: '2026-04-26', phone: '08234567890', address: 'Jl. Sudirman No. 456', details: [{id: 2, name: 'Sate Maranggi Heritage', price: 55000, quantity: 2}, {id: 9, name: 'Pisang Goreng Madu', price: 18000, quantity: 1}] },
                { id: 'ORD003', customer: 'Agus Wijaya', email: 'agus@email.com', items: 2, total: 50000, status: 'Diproses', date: '2026-04-28', phone: '08345678901', address: 'Jl. Ahmad Yani No. 7', details: [{id: 1, name: 'Nasi Goreng Keraton', price: 45000, quantity: 1}] },
                { id: 'ORD004', customer: 'Rina Kusuma', email: 'rina@email.com', items: 4, total: 150000, status: 'Selesai', date: '2026-04-28', phone: '08456789012', address: 'Jl. Gatot Subroto No. 88', details: [{id: 3, name: 'Rawon Hitam Peuyeum', price: 60000, quantity: 2}, {id: 6, name: 'Es Cendol Gula Aren', price: 20000, quantity: 2}] },
                { id: 'ORD005', customer: 'Hendra Pratama', email: 'hendra@email.com', items: 1, total: 35000, status: 'Dibatalkan', date: '2026-04-28', phone: '08567890123', address: 'Jl. Diponegoro No. 22', details: [{id: 4, name: 'Gado-gado Premium', price: 38000, quantity: 1}] },
                { id: 'ORD006', customer: 'Dewi Lestari', email: 'dewi@email.com', items: 3, total: 95000, status: 'Diproses', date: '2026-04-28', phone: '08678901234', address: 'Jl. Thamrin No. 10', details: [{id: 5, name: 'Soto Betawi Istimewa', price: 45000, quantity: 2}, {id: 9, name: 'Pisang Goreng Madu', price: 18000, quantity: 1}] }
            ]));

            localStorage.setItem('dbCustomers', JSON.stringify([
                { id: 1, name: 'Budi Santoso', email: 'budi@email.com', phone: '08123456789', orders: 5, status: 'Aktif' },
                { id: 2, name: 'Siti Aminah', email: 'siti@email.com', phone: '08234567890', orders: 3, status: 'Aktif' },
                { id: 3, name: 'Agus Wijaya', email: 'agus@email.com', phone: '08345678901', orders: 8, status: 'Aktif' },
                { id: 4, name: 'Rina Kusuma', email: 'rina@email.com', phone: '08456789012', orders: 2, status: 'Nonaktif' },
                { id: 5, name: 'Hendra Pratama', email: 'hendra@email.com', phone: '08567890123', orders: 6, status: 'Aktif' },
                { id: 6, name: 'Dewi Lestari', email: 'dewi@email.com', phone: '08678901234', orders: 1, status: 'Nonaktif' },
                { id: 7, name: 'Andi Hermawan', email: 'andi@email.com', phone: '08789012345', orders: 4, status: 'Aktif' },
                { id: 8, name: 'Maya Sari', email: 'maya@email.com', phone: '08890123456', orders: 0, status: 'Baru' },
                { id: 9, name: 'Joko Susilo', email: 'joko@email.com', phone: '08901234567', orders: 12, status: 'Aktif' }
            ]));

            localStorage.setItem('dbVersion', DB_VERSION);
        }
    }

    getProducts() {
        return JSON.parse(localStorage.getItem('dbProducts') || '[]');
    }

    getCustomers() {
        const customers = JSON.parse(localStorage.getItem('dbCustomers') || '[]');
        console.log('Fetching customers:', customers); // Debug
        return customers;
    }

    addProduct(product) {
        const products = this.getProducts();
        product.id = Math.max(...products.map(p => p.id), 0) + 1;
        products.push(product);
        localStorage.setItem('dbProducts', JSON.stringify(products));
        return product;
    }

    updateProduct(id, updated) {
        const products = this.getProducts();
        const idx = products.findIndex(p => p.id === id);
        if (idx >= 0) {
            products[idx] = { ...products[idx], ...updated };
            localStorage.setItem('dbProducts', JSON.stringify(products));
            return products[idx];
        }
        return null;
    }

    deleteProduct(id) {
        const products = this.getProducts().filter(p => p.id !== id);
        localStorage.setItem('dbProducts', JSON.stringify(products));
    }

    getOrders() {
        return JSON.parse(localStorage.getItem('dbOrders') || '[]');
    }

    addOrder(order) {
        const orders = this.getOrders();
        order.id = 'ORD' + String(Math.max(...orders.map(o => parseInt(o.id.replace('ORD', ''))), 0) + 1).padStart(3, '0');
        orders.push(order);
        localStorage.setItem('dbOrders', JSON.stringify(orders));
        return order;
    }

    updateOrder(id, updated) {
        const orders = this.getOrders();
        const idx = orders.findIndex(o => o.id === id);
        if (idx >= 0) {
            orders[idx] = { ...orders[idx], ...updated };
            localStorage.setItem('dbOrders', JSON.stringify(orders));
            return orders[idx];
        }
        return null;
    }

    // Stock Management
    updateStock(productId, quantity) {
        const products = this.getProducts();
        const product = products.find(p => p.id === productId);
        if (product) {
            product.stock = Math.max(0, product.stock + quantity);
            localStorage.setItem('dbProducts', JSON.stringify(products));
            return product;
        }
        return null;
    }

    getLowStockItems(threshold = 30) {
        return this.getProducts().filter(p => p.stock < threshold);
    }

    // Reports
    getSalesReport() {
        const orders = this.getOrders();
        return {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
            completedOrders: orders.filter(o => o.status === 'Selesai').length,
            pendingOrders: orders.filter(o => o.status === 'Diproses').length
        };
    }

    getInventoryReport() {
        const products = this.getProducts();
        return {
            totalProducts: products.length,
            totalStock: products.reduce((sum, p) => sum + p.stock, 0),
            lowStockItems: this.getLowStockItems(),
            averageStock: Math.round(products.reduce((sum, p) => sum + p.stock, 0) / products.length)
        };
    }
}

const db = new Database();

// ============================================
// Product Management UI
// ============================================

let editingProductId = null;

function renderAdminProducts(limit = 9) {
    const tableBody = document.getElementById('products-table-body');
    if (!tableBody) return;
    
    const products = db.getProducts().slice(0, limit);
    tableBody.innerHTML = products.map(product => {
        const isLow = product.stock < 30;
        const statusColor = isLow ? '#ef4444' : '#22c55e';
        const statusBg = isLow ? '#fef2f2' : '#f0fdf4';
        
        return `
            <div class="admin-item-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                        <span style="font-size: 0.75rem; color: var(--secondary); font-weight: 700;">ID: ${product.id}</span>
                        <h3 style="margin-top: 0.25rem;">${product.name}</h3>
                        <p style="color: #666; font-size: 0.85rem;">${product.category}</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 700; color: var(--primary); font-size: 1.1rem;">Rp ${product.price.toLocaleString()}</div>
                        <span style="background: ${statusBg}; color: ${statusColor}; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700; border: 1px solid ${statusColor}44;">
                            STOK: ${product.stock}
                        </span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-secondary" onclick="startEditProduct(${product.id})" style="flex: 1; padding: 0.5rem; font-size: 0.8rem;"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                    <button class="btn-secondary" onclick="showStockControl(${product.id})" style="flex: 1; padding: 0.5rem; font-size: 0.8rem; background: #22c55e;"><i class="fa-solid fa-box-open"></i> Stok</button>
                    <button class="btn-outline" onclick="deleteProduct(${product.id})" style="flex: 1; padding: 0.5rem; font-size: 0.8rem; border-color: #ef4444; color: #ef4444;"><i class="fa-solid fa-trash"></i> Hapus</button>
                </div>
            </div>
        `;
    }).join('');
}

function startEditProduct(id) {
    editingProductId = id;
    const product = db.getProducts().find(p => p.id === id);
    if (product) {
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-image-url').value = product.image || '';
        previewImageURL(); // Update preview
        window.scrollTo(0, document.getElementById('form-title').offsetTop - 20);
    }
}

function saveProduct() {
    const name = document.getElementById('product-name').value;
    const price = parseInt(document.getElementById('product-price').value);
    const category = document.getElementById('product-category').value;
    const stock = parseInt(document.getElementById('product-stock').value);
    const image = document.getElementById('product-image-url').value || 'https://via.placeholder.com/400';

    if (!name || !price || !category || stock < 0) {
        showToast('Semua field harus diisi dengan benar!', 'error');
        return;
    }

    if (editingProductId) {
        db.updateProduct(editingProductId, { name, price, category, stock, image });
        showToast('Produk berhasil diupdate!');
        editingProductId = null;
    } else {
        db.addProduct({ name, price, category, stock, image });
        showToast('Produk berhasil ditambahkan!');
    }

    // Reset form
    document.getElementById('product-name').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-stock').value = '';
    document.getElementById('product-image-url').value = '';
    document.getElementById('url-preview-container').style.display = 'none';
    renderAdminProducts();
}

function previewImageURL() {
    const url = document.getElementById('product-image-url').value;
    const container = document.getElementById('url-preview-container');
    const img = document.getElementById('url-preview');
    
    if (url && (url.startsWith('http') || url.startsWith('https'))) {
        img.src = url;
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

function deleteProduct(id) {
    if (confirm('Yakin ingin menghapus produk ini?')) {
        db.deleteProduct(id);
        showToast('Produk berhasil dihapus!');
        renderAdminProducts();
    }
}

function showStockControl(productId) {
    const product = db.getProducts().find(p => p.id === productId);
    if (!product) return;

    const change = prompt(`Kelola Stok: ${product.name}\n\nStok saat ini: ${product.stock}\n\nMasukkan jumlah perubahan (+ untuk tambah, - untuk kurangi):`);
    if (change !== null && change !== '') {
        const quantity = parseInt(change);
        if (!isNaN(quantity)) {
            db.updateStock(productId, quantity);
            const updated = db.getProducts().find(p => p.id === productId);
            showToast(`Stok diperbarui: ${product.name} → ${updated.stock} unit`);
            renderAdminProducts();
        }
    }
}

function addProductUI() {
    editingProductId = null;
    document.getElementById('product-name').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-stock').value = '';
    document.getElementById('product-image-url').value = '';
    document.getElementById('url-preview-container').style.display = 'none';
    document.getElementById('form-title').textContent = 'Tambah Produk Baru';
    window.scrollTo(0, document.getElementById('form-title').offsetTop - 20);
}

// ============================================
// Shopee Layout Injection
// ============================================

function injectShopeeLayout() {
    const currentPath = window.location.pathname;
    const isAdmin = currentPath.includes('admin') || currentPath.includes('product') || currentPath.includes('orders') || currentPath.includes('customers') || currentPath.includes('inventory-report') || currentPath.includes('settings');
    const isCheckout = currentPath.includes('checkout.html');

    // 1. Top Header (Mobile Only)
    const header = document.createElement('div');
    header.className = 'shopee-header mobile-only';
    header.innerHTML = `
        ${isAdmin ? '<div class="menu-toggle-admin" onclick="toggleAdminSidebar()"><i class="fa-solid fa-bars"></i></div>' : ''}
        <div class="search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" placeholder="Cari di RM Padang..." oninput="searchProductsFromHeader(this.value)">
        </div>
        <div class="header-icons">
            <a href="cart.html" style="color: inherit; position: relative;">
                <i class="fa-solid fa-cart-shopping"></i>
                <span class="cart-count" style="position: absolute; top: -8px; right: -8px; background: #ee4d2d; color: white; font-size: 0.6rem; padding: 2px 5px; border-radius: 10px; min-width: 15px; text-align: center;">0</span>
            </a>
            <i class="fa-regular fa-comment-dots"></i>
        </div>
    `;
    document.body.prepend(header);

    // 1.5 Profile Header (Mobile Admin/Profile)
    if (isAdmin) {
        const user = getCurrentUser();
        const profileHeader = document.createElement('div');
        profileHeader.className = 'shopee-profile-header mobile-only';
        profileHeader.innerHTML = `
            <div class="profile-avatar">${user?.name?.charAt(0) || 'A'}</div>
            <div class="profile-info">
                <h3>${user?.name || 'Administrator'}</h3>
                <p>${user?.role || 'Seller Centre'}</p>
            </div>
        `;
        header.after(profileHeader);

        // Add Overlay for Sidebar
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay mobile-only';
        overlay.onclick = toggleAdminSidebar;
        document.body.appendChild(overlay);
    }

    if (!isAdmin && !isCheckout) {
        const nav = document.createElement('div');
        nav.className = 'bottom-nav mobile-only';
        nav.innerHTML = `
            <a href="index.html" class="nav-item ${currentPath.includes('index.html') || currentPath === '/' ? 'active' : ''}">
                <i class="fa-solid fa-house"></i>
                <span>Beranda</span>
            </a>
            <a href="menu.html" class="nav-item ${currentPath.includes('menu.html') ? 'active' : ''}">
                <i class="fa-solid fa-utensils"></i>
                <span>Menu</span>
            </a>
            <a href="history.html" class="nav-item ${currentPath.includes('history.html') ? 'active' : ''}">
                <i class="fa-solid fa-clipboard-list"></i>
                <span>Riwayat</span>
            </a>
            <a href="cart.html" class="nav-item ${currentPath.includes('cart.html') ? 'active' : ''}">
                <i class="fa-solid fa-cart-shopping"></i>
                <span>Keranjang</span>
            </a>
            <a href="${isLoggedIn() ? 'admin.html' : 'login.html'}" class="nav-item ${currentPath.includes('login.html') ? 'active' : ''}">
                <i class="fa-solid fa-user"></i>
                <span>Saya</span>
            </a>
        `;
        document.body.appendChild(nav);
    }
}

function toggleAdminSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    // Add close button if not exists
    if (sidebar && !sidebar.querySelector('.sidebar-close')) {
        const closeBtn = document.createElement('div');
        closeBtn.className = 'sidebar-close mobile-only';
        closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        closeBtn.onclick = toggleAdminSidebar;
        closeBtn.style.cssText = 'position: absolute; top: 1.5rem; right: 1.5rem; font-size: 1.5rem; color: var(--primary); cursor: pointer;';
        sidebar.prepend(closeBtn);
    }

    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

function searchProductsFromHeader(term) {
    const searchTerm = term.toLowerCase();
    
    // User Menu Page
    if (window.location.pathname.includes('menu.html')) {
        const productCards = document.querySelectorAll('.product-grid .product-card');
        productCards.forEach(card => {
            const title = card.querySelector('.product-title')?.textContent.toLowerCase();
            card.style.display = title.includes(searchTerm) ? 'block' : 'none';
        });
    } 
    // Admin Product Page
    else if (window.location.pathname.includes('product.html')) {
        const productCards = document.querySelectorAll('.admin-card-grid .admin-item-card');
        productCards.forEach(card => {
            const title = card.querySelector('h3')?.textContent.toLowerCase();
            card.style.display = title.includes(searchTerm) ? 'block' : 'none';
        });
    }
    // Admin Orders Page
    else if (window.location.pathname.includes('orders.html')) {
        const orderCards = document.querySelectorAll('.admin-card-grid .admin-item-card');
        orderCards.forEach(card => {
            const customer = card.querySelector('h3')?.textContent.toLowerCase();
            const id = card.querySelector('span')?.textContent.toLowerCase();
            card.style.display = (customer.includes(searchTerm) || id.includes(searchTerm)) ? 'block' : 'none';
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    injectShopeeLayout();
    // Update cart count on all pages
    updateCartCount();
    
    // Render cart page if on cart page
    if (document.getElementById('cart-items')) {
        renderCartPage();
    }
    
    // Render Home page if on home page
    if (document.getElementById('home-product-grid')) {
        renderHomePage();
    }
    
    // Render menu if on menu page
    if (document.getElementById('menu-product-grid')) {
        renderMenuPage();
    }
    
    // Setup search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const productCards = document.querySelectorAll('.product-card');
            productCards.forEach(card => {
                const title = card.querySelector('.product-title')?.textContent.toLowerCase();
                card.style.display = title.includes(searchTerm) ? 'block' : 'none';
            });
        });
    }
    
    // Setup category filters
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.querySelector('p')?.textContent;
            if (category) filterByCategory(category);
        });
    });
    
    // Setup add to cart buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    addToCartButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = parseInt(btn.dataset.id);
            addToCart(productId);
        });
    });
    
    // Setup product cards navigation
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('click', () => {
            const productId = card.dataset.id;
            if (productId) {
                window.location.href = `detail.html?id=${productId}`;
            }
        });
    });
    
    // Setup checkout form
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', processCheckout);
    }
    
    // Setup image preview for product management
    const imageInput = document.getElementById('product-image');
    if (imageInput) {
        imageInput.addEventListener('change', function() {
            previewImage(this, 'image-preview');
        });
    }
    
    // Load product detail if on detail page
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (productId && document.getElementById('product-detail')) {
        const allProducts = db.getProducts();
        const product = allProducts.find(p => p.id === parseInt(productId));
        if (product) {
            document.getElementById('product-detail').innerHTML = `
                <img src="${product.image}" alt="${product.name}" style="width: 100%; border-radius: var(--radius-md); aspect-ratio: 16/9; object-fit: cover;">
                <h1 style="margin-top: 1rem;">${product.name}</h1>
                <p style="color: #666; margin-bottom: 1rem;">${product.description || 'Nikmati hidangan lezat khas Minang dengan bumbu autentik.'}</p>
                <h2 class="product-price">Rp ${product.price.toLocaleString()}</h2>
            `;
        } else {
            document.getElementById('product-detail').innerHTML = '<h3>Produk tidak ditemukan</h3>';
        }
    }
});