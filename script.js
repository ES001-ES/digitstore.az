/** ===== Database Schema and Storage ===== */
const DB = {
    users: 'dm_users',
    products: 'dm_products', 
    orders: 'dm_orders',
    payments: 'dm_payments',
    stats: 'dm_stats',
    withdraws: 'dm_withdraws'
  };
  
  const get = (key) => JSON.parse(localStorage.getItem(key) || '[]');
  const set = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  
  /** ===== Initial Data Seeding ===== */
  function initializeData() {
    const users = get(DB.users);
    
    // Create admin user
    if (!users.find(u => u.role === 'admin')) {
      users.push({
        id: uid(),
        email: 'admin@digit.store',
        password: 'admin123',
        role: 'admin',
        sellerApproved: true,
        createdAt: new Date().toISOString()
      });
    }
    
    // Create demo seller
    if (!users.find(u => u.email === 'seller@demo.com')) {
      users.push({
        id: 'demo-seller',
        email: 'seller@demo.com',
        password: 'demo123',
        role: 'seller',
        sellerApproved: true,
        createdAt: new Date().toISOString()
      });
    }
    
    set(DB.users, users);
    
    // Create sample products
    const products = get(DB.products);
    if (products.length === 0) {
      const sampleProducts = [
        {
          id: uid(),
          name: 'E-kitab: Web Dizayn Əsasları',
          desc: '150 səhifəlik ətraflı bələdçi. HTML, CSS və responsive dizayn mövzuları.',
          price: 15.00,
          cat: 'e-kitab',
          file: 'data:text/plain,Web%20Dizayn%20E-kitab%20Demo',
          sellerId: 'demo-seller',
          status: 'approved',
          createdAt: new Date().toISOString()
        },
        {
          id: uid(),
          name: 'Premium Logo Şablonları',
          desc: '50 ədəd yüksək keyfiyyətli logo şablonu. AI və PSD formatlarında.',
          price: 35.00,
          cat: 'dizayn',
          file: 'data:text/plain,Logo%20Şablonları%20Demo',
          sellerId: 'demo-seller',
          status: 'approved',
          createdAt: new Date().toISOString()
        },
      ];
      set(DB.products, sampleProducts);
    }
  
    // Initialize stats
    const stats = get(DB.stats);
    if (stats.length === 0) {
      set(DB.stats, {
        totalRevenue: 0,
        companyRevenue: 0,
        sellerRevenue: 0,
        totalOrders: 0,
        totalProducts: products.length,
        totalUsers: users.length
      });
    }
  }
  
  /** ===== Application State ===== */
  let currentUser = null;
  let currentPaymentOrder = null;
  
  function loadSession() {
    const sessionData = sessionStorage.getItem('dm_session');
    currentUser = sessionData ? JSON.parse(sessionData) : null;
  }
  
  function saveSession() {
    if (currentUser) {
      sessionStorage.setItem('dm_session', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('dm_session');
    }
  }
  
  /** ===== Navigation System ===== */
  const sections = ['landing', 'home', 'about', 'cart', 'auth', 'seller', 'admin', 'orders', 'payment', 'profile'];
  
  function show(sectionId) {
    sections.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.classList.add('hidden');
        element.classList.remove('fade-in'); // köhnə animasiyanı təmizlə
      }
    });
  
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.remove('hidden');
      setTimeout(() => targetSection.classList.add('fade-in'), 10); // animasiya yenidən işə düşsün
    }
  
    // Load section-specific data
    switch (sectionId) {
      case 'home': renderProducts(); break;
      case 'about': updateAboutStats(); break;
      case 'cart': renderCart(); break;
      case 'seller': renderSeller(); break;
      case 'admin': renderAdmin(); break;
      case 'orders': renderOrders(); break;
      case 'profile': renderProfile(); break;
    }
  }
  
  
  function toast(element, message, type = 'ok') {
    element.innerHTML = `<div class="pill ${type}">${message}</div>`;
    setTimeout(() => element.innerHTML = '', 3000);
  }
  
  /** ===== Authentication System ===== */
  function switchTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    
    // Add active class to selected tab
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
  }
  
  function register() {
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPass').value.trim();
    const confirmPassword = document.getElementById('regPassConfirm').value.trim();
    const role = document.getElementById('regRole').value;
    
    if (!email || !password || !confirmPassword) {
      return showToast('Bütün sahələri doldurun');
    }
    
    if (password !== confirmPassword) {
      return showToast('Şifrələr uyğun gəlmir');
    }
    
    if (password.length < 6) {
      return showToast('Şifrə ən azı 6 simvol olmalıdır');
    }
    
    const users = get(DB.users);
    if (users.find(u => u.email === email)) {
      return showToast('Bu email artıq mövcuddur');
    }
    
    const newUser = {
      id: uid(),
      email,
      password,
      role,
      sellerApproved: false,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    set(DB.users, users);
    
    showToast('Qeydiyyat uğurlu! İndi hesabınıza daxil ola bilərsiniz.');
    switchTab('login');
    
    // Clear form
    document.getElementById('regEmail').value = '';
    document.getElementById('regPass').value = '';
    document.getElementById('regPassConfirm').value = '';
  }
  
  function login() {
    const email = document.getElementById('logEmail').value.trim();
    const password = document.getElementById('logPass').value.trim();
    
    if (!email || !password) {
      return showToast('Email və şifrə tələb olunur');
    }
    
    const user = get(DB.users).find(u => u.email === email && u.password === password);
    if (!user) {
      return showToast('Email və ya şifrə yanlışdır');
    }
    
    currentUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      sellerApproved: user.sellerApproved
    };
    
    saveSession();
    onAuthChange();
    show('home');
    
    // Clear login form
    document.getElementById('logEmail').value = '';
    document.getElementById('logPass').value = '';
  }
  
  function logout() {
    currentUser = null;
    saveSession();
    onAuthChange();
    show('home');
  }
  
  function onAuthChange() {
    const role = currentUser?.role || 'qonaq';
    const roleText = role === 'qonaq' ? 'Qonaq' : role.charAt(0).toUpperCase() + role.slice(1);
    
    document.getElementById('roleChip').textContent = roleText;
    document.getElementById('loginBtn').classList.toggle('hidden', !!currentUser);
    document.getElementById('logoutBtn').classList.toggle('hidden', !currentUser);
    
    // Show/hide role-specific menus
    document.getElementById('sellerMenu').classList.toggle('hidden', 
      !(currentUser && currentUser.role === 'seller'));
    document.getElementById('adminMenu').classList.toggle('hidden', 
      !(currentUser && currentUser.role === 'admin'));
    
    // Handle orders menu for users
    if (currentUser && currentUser.role === 'user') {
      if (!document.getElementById('ordersLink')) {
        const btn = document.createElement('button');
        btn.id = 'ordersLink';
        btn.className = 'ghost';
        btn.textContent = 'Alışlarım';
        btn.onclick = () => show('orders');
        document.querySelector('.menu').insertBefore(btn, document.getElementById('sellerMenu'));
      }
    } else {
      const ordersLink = document.getElementById('ordersLink');
      if (ordersLink) ordersLink.remove();
    }

        // Handle profile menu for users
        if (currentUser && currentUser.role === 'user') {
          if (!document.getElementById('profileLink')) {
            const btn = document.createElement('button');
            btn.id = 'profileLink';
            btn.className = 'ghost';
            btn.textContent = 'Profilim';
            btn.onclick = () => show('profile');
            document.querySelector('.menu').insertBefore(btn, document.getElementById('sellerMenu'));
          }
        } else {
          const profileLink = document.getElementById('profileLink');
          if (profileLink) profileLink.remove();
        }
    
    updateCartCount();
  }
  


  function renderProducts() {
    const container = document.getElementById('catalog');
    container.innerHTML = '';
    
    const searchQuery = document.getElementById('q').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;
    
    let products = get(DB.products).filter(p => p.status === 'approved');
    
    // Axtarış və filterlər
    if (searchQuery) {
      products = products.filter(p =>
        [p.name, p.desc, p.cat].join(' ').toLowerCase().includes(searchQuery)
      );
    }
    if (categoryFilter) {
      products = products.filter(p => p.cat === categoryFilter);
    }
    if (priceFilter) {
      products = products.filter(p => {
        const price = parseFloat(p.price);
        switch (priceFilter) {
          case '0-5': return price <= 5;
          case '5-15': return price > 5 && price <= 15;
          case '15-50': return price > 15 && price <= 50;
          case '50+': return price > 50;
          default: return true;
        }
      });
    }
  
    if (products.length === 0) {
      container.innerHTML = '<div class="muted">Uyğun məhsul tapılmadı.</div>';
      return;
    }
  
    // Məhsul kartı
    products.forEach(product => {
      // Qiymət hesablama (VIP endirim yoxlaması ilə)
      let price = product.price;
      let priceHTML = `${price.toFixed(2)} AZN`;
  
      if (currentUser?.isVIP) {
        const discounted = (price * 0.9).toFixed(2);
        priceHTML = `
          <span style="color:#4caf50;font-weight:bold;">${discounted} AZN</span>
          <span class="muted" style="text-decoration:line-through;margin-left:8px;">
            ${price.toFixed(2)} AZN
          </span>`;
      }
  
      const card = document.createElement('div');
      card.className = 'card product-card';
      card.innerHTML = `
        <div class="product-header">
          <h3>${product.name}</h3>
          <span class="tag">${product.cat}</span>
        </div>
        ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width:100%;border-radius:12px;margin:10px 0;">` : ''}
        <div class="product-description muted">${product.desc || ''}</div>
        <div class="product-footer">
          <div class="price">${priceHTML}</div>
          <div class="product-actions">
            <button onclick="addToCart('${product.id}')" class="tooltip" data-tooltip="Səbətə əlavə et">
              ➕ Səbətə at
            </button>
            <button class="share-btn" onclick="copyProductLink('${product.id}')" title="Paylaş">
              <i class="fa-solid fa-share-nodes"></i>
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }
  
  
  
  /** ===== Shopping Cart System ===== */
  function getCart() {
    if (!currentUser) return [];
    return JSON.parse(localStorage.getItem('dm_cart_' + currentUser.id) || '[]');
  }
  
  function setCart(items) {
    if (!currentUser) return showToast('Öncə daxil ol');
    localStorage.setItem('dm_cart_' + currentUser.id, JSON.stringify(items));
    updateCartCount();
  }
  
  function updateCartCount() {
    const count = currentUser ? getCart().length : 0;
    document.getElementById('cartCount').textContent = count;
  }
  
  function addToCart(productId) {
    if (!currentUser) {
      showToast('Səbətə məhsul əlavə etmək üçün daxil olun');
      return;
    }
    
    const cart = getCart();
    if (!cart.includes(productId)) {
      cart.push(productId);
      setCart(cart);
      
      // Show success feedback
      const btn = event.target;
      const originalText = btn.innerHTML;
      btn.innerHTML = '✓ Əlavə edildi';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 1500);
    }
  }
  
  function removeFromCart(productId) {
    const cart = getCart().filter(id => id !== productId);
    setCart(cart);
    renderCart();
  }
  
  function clearCart() {
    setCart([]);
    renderCart();
  }
  
  function renderCart() {
    const container = document.getElementById('cartList');
    container.innerHTML = '';
    
    if (!currentUser) {
      container.innerHTML = '<div class="muted">Səbət üçün giriş et.</div>';
      return;
    }
    
    const cartItems = getCart();
    if (cartItems.length === 0) {
      container.innerHTML = '<div class="muted">Səbət boşdur.</div>';
      document.getElementById('cartSubtotal').textContent = '0 AZN';
      document.getElementById('cartTotal').textContent = '0 AZN';
      return;
    }
    
    const products = get(DB.products).filter(p => cartItems.includes(p.id));
    let subtotal = 0;
    
    products.forEach(product => {
      let price = product.price;
      let priceHTML = `${price.toFixed(2)} AZN`;
  
      // 🔹 VIP endirim yoxlaması
      if (currentUser?.isVIP) {
        const discounted = (price * 0.9).toFixed(2);
        priceHTML = `
          <span style="color:#4caf50;font-weight:bold;">${discounted} AZN</span>
          <span class="muted" style="text-decoration:line-through;margin-left:6px;">
            ${price.toFixed(2)} AZN
          </span>`;
        price = parseFloat(discounted);
      }
  
      subtotal += price;
  
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div class="cart-item-info">
          <div class="cart-item-name">${product.name}</div>
          <div class="cart-item-category muted">${product.cat}</div>
        </div>
        <div class="cart-item-price">${priceHTML}</div>
        <button class="ghost cart-remove-btn" onclick="removeFromCart('${product.id}')" title="Sil">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
          </svg>
        </button>
      `;
      container.appendChild(row);
    });
    
    document.getElementById('cartSubtotal').textContent = subtotal.toFixed(2) + ' AZN';
    document.getElementById('cartTotal').textContent = subtotal.toFixed(2) + ' AZN';
  }
  
  
  /** ===== Payment System ===== */
  function startPayment() {
    if (!currentUser) {
      showToast('Ödəniş üçün giriş et');
      return;
    }
    
    const cartItems = getCart();
    if (cartItems.length === 0) {
      showToast('Səbət boşdur');
      return;
    }
    
    const products = get(DB.products).filter(p => cartItems.includes(p.id));
    const total = products.reduce((sum, p) => sum + parseFloat(p.price || 0), 0);
    
    currentPaymentOrder = {
      id: uid(),
      userId: currentUser.id,
      items: products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        file: p.file,
        sellerId: p.sellerId
      })),
      total,
      createdAt: new Date().toISOString(),
      status: 'pending_payment'
    };
    
    // Render payment details
    const detailsContainer = document.getElementById('paymentOrderDetails');
    detailsContainer.innerHTML = products.map(p => `
      <div class="payment-item">
        <span>${p.name}</span>
        <span>${p.price.toFixed(2)} AZN</span>
      </div>
    `).join('');
    
    document.getElementById('paymentTotal').textContent = total.toFixed(2) + ' AZN';
    show('payment');
  }
  
  function previewReceipt() {
    const fileInput = document.getElementById('receiptFile');
    const preview = document.getElementById('receiptPreview');
    const submitBtn = document.getElementById('submitPaymentBtn');
    
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const reader = new FileReader();
      
      reader.onload = function(e) {
        if (file.type.startsWith('image/')) {
          preview.innerHTML = `
            <div class="receipt-preview-container">
              <img src="${e.target.result}" alt="Ödəniş çeki" class="receipt-image">
              <div class="muted">Fayl: ${file.name}</div>
            </div>
          `;
        } else {
          preview.innerHTML = `
            <div class="receipt-preview-container">
              <div class="file-preview">📄 ${file.name}</div>
              <div class="muted">PDF fayl yükləndi</div>
            </div>
          `;
        }
        submitBtn.disabled = false;
      };
      
      reader.readAsDataURL(file);
    }
  }
  
  function submitPayment() {
    if (!currentPaymentOrder) return;
    
    const receiptFile = document.getElementById('receiptFile').files[0];
    if (!receiptFile) {
      showToast('Çek faylını yükləyin');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      // Create payment record
      const payment = {
        ...currentPaymentOrder,
        receiptData: e.target.result,
        receiptFileName: receiptFile.name,
        submittedAt: new Date().toISOString(),
        status: 'pending_confirmation'
      };
      
      const payments = get(DB.payments);
      payments.push(payment);
      set(DB.payments, payments);
      
      // Clear cart
      clearCart();
      currentPaymentOrder = null;
      
      showToast('Ödəniş təsdiqi üçün göndərildi. Admin tərəfindən yoxlanılacaq.');
      show('orders');
    };
    
    reader.readAsDataURL(receiptFile);
  }
  
  /** ===== Seller Dashboard ===== */
  function renderSeller() {
    if (!(currentUser && currentUser.role === 'seller')) {
      document.getElementById('seller').innerHTML = '<div class="muted">Satıcı paneli üçün satıcı kimi giriş et.</div>';
      return;
    }
    
    updateSellerStats();
    renderSellerProducts();
    renderSellerEarnings();
    renderWithdrawHistory();
  }
  
  function updateSellerStats() {
    const user = get(DB.users).find(u => u.id === currentUser.id);
    const statusText = user?.sellerApproved ? 'Təsdiqlənib' : 'Gözləmədə';
    document.getElementById('sellerStatus').textContent = 'Təsdiq: ' + statusText;
  
    const orders = get(DB.orders).filter(o => o.status === 'completed');
    const myProducts = get(DB.products).filter(p => p.sellerId === currentUser.id);
  
    let totalRevenue = 0;
    let totalOrders = 0;
  
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.sellerId === currentUser.id) {
          totalRevenue += parseFloat(item.price || 0);
          totalOrders++;
        }
      });
    });
  
    const sellerTotalRevenue = totalRevenue;   // ümumi satış
    const sellerRevenue = sellerTotalRevenue * 0.85; // satıcı payı (85%)
  
    // Çıxarış edilmiş məbləğləri nəzərə al
    const withdraws = get(DB.withdraws).filter(w => w.sellerId === currentUser.id && w.status === "approved");
    const withdrawnAmount = withdraws.reduce((sum, w) => sum + parseFloat(w.amount), 0);
  
    const availableBalance = sellerRevenue - withdrawnAmount; // çıxarıla biləcək qalıq
  
    document.getElementById('sellerRevenue').textContent = availableBalance.toFixed(2) + ' AZN';
    document.getElementById('sellerOrders').textContent = totalOrders;
    document.getElementById('sellerProducts').textContent = myProducts.length;
    document.getElementById('sellerCommission').textContent = (sellerTotalRevenue * 0.15).toFixed(2) + ' AZN';
  
    // Çıxarış düyməsini deaktiv et əgər qalıq yoxdursa
    const withdrawBtn = document.querySelector('#seller button.primary[onclick="toggleWithdrawForm()"]');
    if (withdrawBtn) {
      withdrawBtn.disabled = availableBalance <= 0;
    }
  }

  
  
  function renderSellerProducts() {
    const table = document.getElementById('myProducts');
    const products = get(DB.products).filter(p => p.sellerId === currentUser.id).reverse();
    
    table.innerHTML = `
      <tr>
        <th>Məhsul</th>
        <th>Kateqoriya</th>
        <th>Qiymət</th>
        <th>Status</th>
        <th>Tarix</th>
        <th>Əməliyyat</th>
      </tr>
    `;
    
    products.forEach(product => {
      const row = table.insertRow();
      const statusClass = product.status === 'approved' ? 'ok' : 
                         product.status === 'pending' ? 'warn' : 'err';
      const statusText = product.status === 'approved' ? 'Təsdiqlənib' :
                        product.status === 'pending' ? 'Gözləmədə' : 'Rədd edilib';
      
      row.innerHTML = `
        <td><strong>${product.name}</strong></td>
        <td>${product.cat}</td>
        <td>${product.price.toFixed(2)} AZN</td>
        <td>
          <span class="pill ${statusClass}">${statusText}</span>
          ${
            product.status === 'rejected' && product.rejectReason 
            ? `<div class="muted">Səbəb: ${product.rejectReason}</div>` 
            : ''
          }
        </td>
        <td class="muted">${new Date(product.createdAt).toLocaleDateString()}</td>
        <td>
          <button class="danger" onclick="deleteProduct('${product.id}')">Sil</button>
        </td>
      `;
    });
  }
  
  
  function renderSellerEarnings() {
    const container = document.getElementById('earningsChart');
    
    // Get seller's completed orders by month
    const orders = get(DB.orders).filter(o => o.status === 'completed');
    const earnings = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.sellerId === currentUser.id) {
          const month = new Date(order.completedAt || order.createdAt).toLocaleDateString('az-AZ', { year: 'numeric', month: 'short' });
          earnings[month] = (earnings[month] || 0) + (parseFloat(item.price || 0) * 0.85);
        }
      });
    });
    
    const months = Object.keys(earnings).slice(-6); // Last 6 months
    const maxEarning = Math.max(...Object.values(earnings), 1);
    
    container.innerHTML = `
      <h4>Son 6 ayın gəliri</h4>
      <div class="chart-bar">
        ${months.map(month => `
          <div class="bar" style="height: ${(earnings[month] / maxEarning) * 100}%">
            <div class="bar-label">${month}<br>${earnings[month].toFixed(0)} AZN</div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  function addProduct() {
    if (!(currentUser && currentUser.role === 'seller')) {
      showToast('Satıcı girişi tələb olunur');
      return;
    }
  
    const name = document.getElementById('pName').value.trim();
    const desc = document.getElementById('pDesc').value.trim();
    const price = parseFloat(document.getElementById('pPrice').value);
    const cat = document.getElementById('pCat').value;
    const file = document.getElementById('pFile').value.trim();
    const imgFile = document.getElementById('pImg').files[0];
  
    if (!name || !price || price <= 0 || !file) {
      showToast('Ad, düzgün qiymət və fayl linki tələb olunur');
      return;
    }
  
    if (!imgFile) {
      showToast('Məhsul şəkli tələb olunur');
      return; // şəkil yoxdursa, burda çıxırıq
    }
  
    // şəkil seçilibsə, base64 kimi oxuyuruq
    const reader = new FileReader();
    reader.onload = function (e) {
      saveProduct(name, desc, price, cat, file, e.target.result);
    };
    reader.readAsDataURL(imgFile);
  }
  
  function saveProduct(name, desc, price, cat, file, image) {
    const products = get(DB.products);
    const newProduct = {
      id: uid(),
      name,
      desc,
      price,
      cat,
      file,
      image, // base64 şəkil
      sellerId: currentUser.id,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
  
    products.push(newProduct);
    set(DB.products, products);
  
    // form sahələrini təmizlə
    document.getElementById('pName').value = '';
    document.getElementById('pDesc').value = '';
    document.getElementById('pPrice').value = '';
    document.getElementById('pFile').value = '';
    document.getElementById('pImg').value = '';
  
    showToast('Məhsul uğurla əlavə edildi. Admin təsdiqi gözlənilir.');
    renderSeller();
    renderAdmin(); // admin panel də yenilənsin
  }
  
  
  
  /** ===== Admin Dashboard ===== */
  function renderAdmin() {
    if (!(currentUser && currentUser.role === 'admin')) {
      document.getElementById('admin').innerHTML = '<div class="muted">Admin paneli üçün admin kimi giriş et.</div>';
      return;
    }
    
    updateAdminStats();
    renderPendingPayments();
    renderPendingProducts();
    renderAllUsers();
    renderSalesChart();
    renderWithdrawRequests();
  }
  
  function updateAdminStats() {
    const orders = get(DB.orders);
    const payments = get(DB.payments);
    const users = get(DB.users);
    const products = get(DB.products);
    
    let totalRevenue = 0;
    let companyRevenue = 0;
    
    orders.filter(o => o.status === 'completed').forEach(order => {
      totalRevenue += parseFloat(order.total || 0);
      companyRevenue += parseFloat(order.total || 0) * 0.15; // 15% commission
    });
    
    const pendingPaymentsCount = payments.filter(p => p.status === 'pending_confirmation').length;
    const activeUsers = users.filter(u => u.role !== 'admin').length;
    
    document.getElementById('totalRevenue').textContent = totalRevenue.toFixed(2) + ' AZN';
    document.getElementById('companyRevenue').textContent = companyRevenue.toFixed(2) + ' AZN';
    document.getElementById('pendingPayments').textContent = pendingPaymentsCount;
    document.getElementById('activeUsers').textContent = activeUsers;
  }
  
  function renderPendingPayments() {
    const table = document.getElementById('pendingPaymentsTable');
    const payments = get(DB.payments).filter(p => p.status === 'pending_confirmation');
    
    table.innerHTML = `
      <tr>
        <th>İstifadəçi</th>
        <th>Məbləğ</th>
        <th>Tarix</th>
        <th>Çek</th>
        <th>Əməliyyat</th>
      </tr>
    `;
    
    if (payments.length === 0) {
      table.innerHTML += '<tr><td colspan="5" class="muted">Gözləyən ödəniş yoxdur</td></tr>';
      return;
    }
    
    payments.forEach(payment => {
      const user = get(DB.users).find(u => u.id === payment.userId);
      const row = table.insertRow();
      row.innerHTML = `
        <td>${user?.email || 'Naməlum'}</td>
        <td class="price">${payment.total.toFixed(2)} AZN</td>
        <td class="muted">${new Date(payment.submittedAt).toLocaleDateString()}</td>
        <td>
          <button class="ghost" onclick="viewReceipt('${payment.id}')">Çekə bax</button>
        </td>
        <td>
          <div class="flex" style="gap: 8px;">
            <button class="success" onclick="confirmPayment('${payment.id}')">Təsdiq</button>
            <button class="danger" onclick="rejectPayment('${payment.id}')">Rədd</button>
          </div>
        </td>
      `;
    });
  }
  
  function renderPendingProducts() {
    const table = document.getElementById('pending');
    const products = get(DB.products).filter(p => p.status === 'pending');
    const users = get(DB.users);
  
    table.innerHTML = `
      <tr>
        <th>Şəkil</th>
        <th>Məhsul</th>
        <th>Satıcı</th>
        <th>Kateqoriya</th>
        <th>Qiymət</th>
        <th>Fayl Linki</th>
        <th>Rədd səbəbi</th>
        <th>Əməliyyat</th>
      </tr>
    `;
  
    if (products.length === 0) {
      table.innerHTML += '<tr><td colspan="8" class="muted">Gözləyən məhsul yoxdur</td></tr>';
      return;
    }
  
    products.forEach(product => {
      const seller = users.find(u => u.id === product.sellerId);
      const row = table.insertRow();
      row.innerHTML = `
  <td>${product.image ? `<img src="${product.image}" width="60">` : '—'}</td>
  <td>${product.name}</td>
  <td>${seller?.email || 'Naməlum'}</td>
  <td>${product.cat}</td>
  <td>${product.price.toFixed(2)} AZN</td>
  <td><a href="${product.file}" target="_blank">Faylı aç</a></td>
  <td>
    <textarea id="reason-${product.id}" placeholder="Rədd səbəbi..." rows="2"></textarea>
  </td>
  <td>
    <button class="success" onclick="approveProduct('${product.id}')">Təsdiqlə</button>
    <button class="danger" onclick="rejectProduct('${product.id}')">Rədd et</button>
  </td>
`;
    });
  }
  

  function renderWithdrawRequests() {
    const table = document.getElementById("withdrawTable");
    const withdraws = get(DB.withdraws);
  
    table.innerHTML = `
      <tr>
        <th>Satıcı</th>
        <th>Ad Soyad</th>
        <th>Kart</th>
        <th>Telefon</th>
        <th>Məbləğ</th>
        <th>Tarix</th>
        <th>Status</th>
        <th>Əməliyyat</th>
      </tr>
    `;
  
    if (withdraws.length === 0) {
      table.innerHTML += `<tr><td colspan="8" class="muted">Sorğu yoxdur</td></tr>`;
      return;
    }
  
    withdraws.forEach(w => {
      const seller = get(DB.users).find(u => u.id === w.sellerId);
      const row = table.insertRow();
      row.innerHTML = `
        <td>${seller?.email || "Naməlum"}</td>
        <td>${w.name}</td>
        <td>${w.card}</td>
        <td>${w.phone}</td>
        <td class="price">${w.amount} AZN</td>
        <td>${new Date(w.createdAt).toLocaleDateString()}</td>
        <td>
          <span class="pill ${w.status === "pending" ? "warn" : w.status === "approved" ? "ok" : "err"}">
            ${w.status === "pending" ? "Gözləmədə" : w.status === "approved" ? "Ödənildi" : "İmtina edildi"}
          </span>
          ${w.reason ? `<div class="muted">Səbəb: ${w.reason}</div>` : ""}
        </td>
        <td>
          ${
            w.status === "pending"
              ? `
              <button class="success" onclick="approveWithdraw('${w.id}')">Təsdiq et</button>
              <button class="danger" onclick="rejectWithdraw('${w.id}')">İmtina et</button>
            `
              : "-"
          }
        </td>
      `;
    });
  }
  
  

  
  
  function renderAllUsers() {
    const table = document.getElementById('users');
    const users = get(DB.users);
    
    table.innerHTML = `
      <tr>
        <th>Email</th>
        <th>Rol</th>
        <th>Qeydiyyat tarixi</th>
        <th>Satıcı təsdiqi</th>
        <th>Əməliyyat</th>
      </tr>
    `;
    
    users.forEach(user => {
      if (user.role === 'admin') return; // Don't show admin users
      
      const row = table.insertRow();
      const approvalPill = user.role === 'seller' 
        ? `<span class="pill ${user.sellerApproved ? 'ok' : 'warn'}">${user.sellerApproved ? 'Bəli' : 'Xeyr'}</span>`
        : '-';
      
      row.innerHTML = `
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td class="muted">${new Date(user.createdAt).toLocaleDateString()}</td>
        <td>${approvalPill}</td>
        <td>
          ${user.role === 'seller' ? `
            <button onclick="toggleSellerApproval('${user.id}')" class="${user.sellerApproved ? 'danger' : 'success'}">
              ${user.sellerApproved ? 'Ləğv et' : 'Təsdiq et'}
            </button>
          ` : '-'}
        </td>
      `;
    });
  }
  
  function renderSalesChart() {
    const container = document.getElementById('salesChart');
    const orders = get(DB.orders).filter(o => o.status === 'completed');
    
    // Group orders by month
    const salesByMonth = {};
    orders.forEach(order => {
      const month = new Date(order.completedAt || order.createdAt).toLocaleDateString('az-AZ', { year: 'numeric', month: 'short' });
      salesByMonth[month] = (salesByMonth[month] || 0) + parseFloat(order.total || 0);
    });
    
    const months = Object.keys(salesByMonth).slice(-6);
    const maxSale = Math.max(...Object.values(salesByMonth), 1);
    
    container.innerHTML = `
      <h4>Aylıq satış statistikası</h4>
      <div class="chart-bar">
        ${months.map(month => `
          <div class="bar" style="height: ${(salesByMonth[month] / maxSale) * 100}%">
            <div class="bar-label">${month}<br>${salesByMonth[month].toFixed(0)} AZN</div>
          </div>
        `).join('')}
      </div>
      ${months.length === 0 ? '<div class="muted">Hələ satış yoxdur</div>' : ''}
    `;
  }
  
  function viewReceipt(paymentId) {
    const payment = get(DB.payments).find(p => p.id === paymentId);
    if (!payment) return;
    
    const modal = document.getElementById('paymentModal');
    const detailsContainer = document.getElementById('paymentDetails');
    const receiptViewer = document.getElementById('receiptViewer');
    
    detailsContainer.innerHTML = `
      <div class="payment-details">
        <div><strong>Sifariş ID:</strong> #${payment.id.slice(-6)}</div>
        <div><strong>Məbləğ:</strong> ${payment.total.toFixed(2)} AZN</div>
        <div><strong>Tarix:</strong> ${new Date(payment.submittedAt).toLocaleString()}</div>
      </div>
    `;
    
    if (payment.receiptData.startsWith('data:image/')) {
      receiptViewer.innerHTML = `<img src="${payment.receiptData}" class="receipt-image" style="max-width: 100%; border-radius: 8px;">`;
    } else {
      receiptViewer.innerHTML = `<div class="file-preview">📄 ${payment.receiptFileName}</div>`;
    }
    
    // Store current payment for confirm/reject actions
    window.currentAdminPayment = payment.id;
    modal.classList.remove('hidden');
  }
  
  function closePaymentModal() {
    document.getElementById('paymentModal').classList.add('hidden');
    window.currentAdminPayment = null;
  }
  
  function confirmPayment(paymentId = null) {
    const id = paymentId || window.currentAdminPayment;
    if (!id) return;
    
    const payments = get(DB.payments);
    const paymentIndex = payments.findIndex(p => p.id === id);
    if (paymentIndex === -1) return;
    
    const payment = payments[paymentIndex];
    
    // Update payment status
    payments[paymentIndex].status = 'confirmed';
    payments[paymentIndex].confirmedAt = new Date().toISOString();
    set(DB.payments, payments);
    
    // Create order with download links
    const order = {
      ...payment,
      status: 'completed',
      completedAt: new Date().toISOString()
    };
    
    const orders = get(DB.orders);
    orders.push(order);
    set(DB.orders, orders);
    
    // Update statistics
    updateStatsAfterSale(payment.total, payment.items);
    
    closePaymentModal();
    showToast('Ödəniş təsdiqləndi və sifariş tamamlandı');
    renderAdmin();
  }
  
  function rejectPayment(paymentId = null) {
    const id = paymentId || window.currentAdminPayment;
    if (!id) return;
    
    if (!confirm('Ödənişi rədd etmək istədiyinizə əminsiniz?')) return;
    
    const payments = get(DB.payments);
    const updatedPayments = payments.filter(p => p.id !== id);
    set(DB.payments, updatedPayments);
    
    closePaymentModal();
    showToast('Ödəniş rədd edildi');
    renderAdmin();
  }
  
  function updateStatsAfterSale(total, items) {
    const stats = get(DB.stats) || {};
    stats.totalRevenue = (stats.totalRevenue || 0) + parseFloat(total);
    stats.companyRevenue = (stats.companyRevenue || 0) + (parseFloat(total) * 0.15);
    stats.sellerRevenue = (stats.sellerRevenue || 0) + (parseFloat(total) * 0.85);
    stats.totalOrders = (stats.totalOrders || 0) + 1;
    set(DB.stats, stats);
  }
  
  function approveProduct(productId) {
    const products = get(DB.products);
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
      products[productIndex].status = 'approved';
      products[productIndex].approvedAt = new Date().toISOString();
      set(DB.products, products);
      renderAdmin();
    }
  }
  
  function rejectProduct(productId) {
    const products = get(DB.products);
    const product = products.find(p => p.id === productId);
    if (!product) return;
  
    const reasonInput = document.getElementById(`reason-${productId}`);
    const reason = reasonInput ? reasonInput.value.trim() : '';
  
    if (!reason) {
      showToast("Xahiş olunur rədd etmə səbəbini yazın.");
      return;
    }
  
    product.status = 'rejected';
    product.rejectReason = reason;
  
    set(DB.products, products);
    showToast('Məhsul rədd edildi!');
    renderAdmin();
  }
  
  
  
 /** ===== Orders Management ===== */
function renderOrders() {
  const container = document.getElementById('orderList');
  
  if (!currentUser) {
    container.innerHTML = '<div class="muted">Sifarişlər üçün giriş et</div>';
    return;
  }
  
  const orders = get(DB.orders).filter(o => o.userId === currentUser.id).reverse();
  
  if (orders.length === 0) {
    container.innerHTML = '<div class="muted">Hələ sifariş yoxdur.</div>';
    return;
  }
  
  container.innerHTML = '';
  
  orders.forEach(order => {
    const card = document.createElement('div');
    card.className = 'card order-card';
    
    const statusClass = order.status === 'completed' ? 'ok' : 
                       order.status === 'pending_payment' ? 'warn' : 'pending';
    const statusText = order.status === 'completed' ? 'Tamamlandı' :
                      order.status === 'pending_payment' ? 'Ödəniş gözlənilir' : 'Təsdiq gözlənilir';
    
    card.innerHTML = `
      <div class="order-header">
        <div class="order-info">
          <strong>Sifariş #${order.id.slice(-6)}</strong>
          <span class="pill ${statusClass}">${statusText}</span>
        </div>
        <div class="order-meta">
          <div class="order-date muted">${new Date(order.createdAt).toLocaleString()}</div>
          <div class="order-total price">${order.total.toFixed(2)} AZN</div>
        </div>
      </div>
      <div class="order-items">
        ${order.items.map(item => `
          <div class="order-item">
            ${item.image ? `<img src="${item.image}" alt="${item.name}" class="order-item-img">` : ''}
            <div class="order-item-info">
              <div class="order-item-name">${item.name}</div>
              <div class="order-item-price">${item.price.toFixed(2)} AZN</div>
              ${
                order.status === 'completed'
                  ? (item.file
                      ? `<a href="${item.file}" download class="btn download-btn" title="Yüklə">
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                             <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
                           </svg>
                           Yüklə
                         </a>`
                      : `<div class="muted">Fayl mövcud deyil</div>`)
                  : `<div class="muted">Fayl gözlənilir</div>`
              }
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    container.appendChild(card);
  });
}


  
  /** ===== About Page ===== */
  function updateAboutStats() {
    const products = get(DB.products).filter(p => p.status === 'approved');
    const sellers = get(DB.users).filter(u => u.role === 'seller' && u.sellerApproved);
    const orders = get(DB.orders).filter(o => o.status === 'completed');
    
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('totalSellers').textContent = sellers.length;
    document.getElementById('totalOrders').textContent = orders.length;
  }
  
  /** ===== Utility Functions ===== */
  function preview(fileUrl) {
    const url = decodeURIComponent(fileUrl);
    window.open(url, '_blank');
  }
  
  /** ===== Application Initialization ===== */
  function initializeApp() {
    initializeData();
    loadSession();
    onAuthChange();
    renderTrendingProducts();
    show('landing'); // yalnız açılışda landing görünsün
  

    
    // Add smooth scrolling for better UX
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            show('home');
            break;
          case '2':
            e.preventDefault();
            show('about');
            break;
          case '3':
            e.preventDefault();
            if (currentUser) show('cart');
            break;
        }
      }
    });
    
    // Add loading states to buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('button:not(.ghost):not(.close-btn)')) {
        e.target.classList.add('loading');
        setTimeout(() => {
          e.target.classList.remove('loading');
        }, 300);
      }
    });
  }
  
  /** ===== Enhanced Cart Styling ===== */
  function addCartItemStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .cart-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        border: 1px solid #1f2937;
        border-radius: 12px;
        margin-bottom: 12px;
        background: #0f172a;
        transition: all 0.2s ease;
      }
      
      .cart-item:hover {
        border-color: var(--pri);
        background: rgba(96, 165, 250, 0.05);
      }
      
      .cart-item-info {
        flex: 1;
      }
      
      .cart-item-name {
        font-weight: 600;
        display: block;
        margin-bottom: 4px;
      }
      
      .cart-item-category {
        font-size: 13px;
      }
      
      .cart-item-price {
        font-weight: 700;
        color: var(--ok);
        margin-right: 16px;
      }
      
      .cart-remove-btn {
        padding: 8px;
        border-radius: 8px;
      }
      
      .cart-remove-btn:hover {
        background: rgba(239, 68, 68, 0.1);
        border-color: var(--err);
        color: var(--err);
      }
      
      .order-card {
        margin-bottom: 20px;
      }
      
      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 16px;
        flex-wrap: wrap;
        gap: 12px;
      }
      
      .order-info {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      
      .order-meta {
        text-align: right;
      }
      
      .order-items {
        border-top: 1px solid #1f2937;
        padding-top: 16px;
      }
      
      .order-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #1f2937;
      }
      
      .order-item:last-child {
        border-bottom: none;
      }
      
      .order-item-info {
        display: flex;
        justify-content: space-between;
        flex: 1;
        margin-right: 16px;
      }
      
      .order-item-name {
        font-weight: 600;
      }
      
      .download-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        background: var(--ok);
        color: white;
        border: none;
        font-size: 13px;
      }
      
      .download-btn:hover {
        background: #059669;
        transform: translateY(-1px);
      }
      
      .payment-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #1f2937;
      }
      
      .payment-item:last-child {
        border-bottom: none;
      }
      
      .receipt-image {
        max-width: 100%;
        max-height: 300px;
        border-radius: 8px;
        border: 1px solid #334155;
      }
      
      .receipt-preview-container {
        margin-top: 12px;
        text-align: center;
      }
      
      .file-preview {
        padding: 20px;
        background: #0b1220;
        border: 1px dashed #334155;
        border-radius: 8px;
        color: var(--muted);
      }
      
      .product-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 12px;
      }
      
      .product-description {
        margin-bottom: 16px;
        line-height: 1.6;
      }
      
      .product-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .product-actions {
        display: flex;
        gap: 8px;
      }
      
      .product-actions button {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        padding: 8px 12px;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Initialize the application
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    addCartItemStyles();
  });
  
  // Initialize immediately if DOM is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeApp();
      addCartItemStyles();
    });
  } else {
    initializeApp();
    addCartItemStyles();
  }

  /** ===== Trend Məhsullar Landingdə ===== */
function renderTrendingProducts() {
  const container = document.getElementById('trendingProducts');
  if (!container) return;

  // Bütün təsdiqlənmiş məhsullar
  let products = get(DB.products).filter(p => p.status === 'approved');

  // Ən son əlavə olunanlardan 3 ədəd götürək
  products = products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);

  // Əgər məhsul yoxdursa
  if (products.length === 0) {
    container.innerHTML = '<div class="muted">Hələ məhsul yoxdur.</div>';
    return;
  }

  // Məhsulları göstər
  container.innerHTML = '';
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'card product-card';
    card.innerHTML = `
  <div class="product-header">
    <h3>${product.name}</h3>
    <span class="tag">${product.cat}</span>
  </div>
  ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width:100%;border-radius:12px;margin:10px 0;">` : ''}
  <div class="product-description muted">${product.desc || ''}</div>
  <div class="product-footer">
    <div class="price">${product.price.toFixed(2)} AZN</div>
    <div class="product-actions">
      <button onclick="addToCart('${product.id}')" class="tooltip" data-tooltip="Səbətə əlavə et">
        ➕ Səbətə at
      </button>
    </div>
  </div>
`;

    container.appendChild(card);
  });
}


function deleteProduct(productId) {
  if (!confirm("Bu məhsulu silmək istədiyinizə əminsiniz?")) return;

  let products = get(DB.products);
  products = products.filter(p => !(p.id === productId && p.sellerId === currentUser.id));
  set(DB.products, products);

  showToast("Məhsul silindi ✅");
  renderSeller(); // paneli yenilə
}





  // ==== 3 dəqiqəlik geri sayım ====
  let timeLeft = 180; // saniyə
  const timerEl = document.getElementById('paymentTimer');

  const countdown = setInterval(() => {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    timerEl.textContent = `Ödənişi tamamlamaq üçün vaxt: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    if (timeLeft <= 0) {
      clearInterval(countdown);
      timerEl.textContent = "Vaxt bitdi! Ödəniş yenidən başlatmaq lazımdır.";
      document.getElementById('submitPaymentBtn').disabled = true; // təsdiqi blokla
    }
    timeLeft--;
  }, 1000);





  function submitWithdraw() {
    const name = document.getElementById("wName").value.trim();
    const card = document.getElementById("wCard").value.trim();
    const phone = document.getElementById("wPhone").value.trim();
    const amount = parseFloat(document.getElementById("wAmount").value);
  
    if (!name || !card || !phone || !amount) {
      showToast("Bütün xanaları doldurun.");
      return;
    }
  
    if (!/^\+994\d{9}$/.test(phone)) {
      showToast("Telefon nömrəsini düzgün formatda daxil edin. (Məs: +994501234567)");
      return;
    }
  
    if (amount <= 0) {
      showToast("Məbləğ düzgün deyil.");
      return;
    }
  
    // çıxarış sorğusunu yadda saxla
    const withdrawals = get("dm_withdrawals") || [];
    withdrawals.push({
      id: uid(),
      sellerId: currentUser.id,
      name,
      phone,   // ✅ Telefonu da yadda saxlayırıq
      card,
      amount,
      status: "pending",
      createdAt: new Date().toISOString()
    });
    set("dm_withdrawals", withdrawals);
  
    document.getElementById("withdrawResult").textContent =
      "Çıxarış sorğunuz yaradıldı və admin təsdiqini gözləyir.";
  
    // inputları təmizlə
    document.getElementById("wName").value = "";
    document.getElementById("wCard").value = "";
    document.getElementById("wPhone").value = "";
    document.getElementById("wAmount").value = "";
  }
  
  function toggleWithdrawForm() {
    const form = document.getElementById("withdrawForm");
    form.classList.toggle("hidden");
  }
  
  function submitWithdraw() {
    const name = document.getElementById("wName").value.trim();
    const card = document.getElementById("wCard").value.trim();
    const phone = document.getElementById("wPhone").value.trim();
    const amount = parseFloat(document.getElementById("wAmount").value);
  
    if (!name || !card || !phone || !amount) {
      return showToast("Bütün sahələri doldurun");
    }
  
    const withdraws = get(DB.withdraws);
  
    withdraws.push({
      id: uid(),
      sellerId: currentUser.id,
      name,
      card,
      phone,
      amount,
      status: "pending",
      createdAt: new Date().toISOString()
    });
  
    set(DB.withdraws, withdraws);
  
    // formu təmizlə
    document.getElementById("wName").value = "";
    document.getElementById("wCard").value = "";
    document.getElementById("wPhone").value = "";
    document.getElementById("wAmount").value = "";
  
    document.getElementById("withdrawResult").textContent = "Sorğu göndərildi. Admin təsdiq edəcək.";
  }
  


  function approveWithdraw(id) {
    const withdraws = get(DB.withdraws);
    const w = withdraws.find(x => x.id === id);
    if (!w) return;
  
    w.status = "approved";
    w.approvedAt = new Date().toISOString();
  
    set(DB.withdraws, withdraws);
    renderWithdrawRequests();
    showToast("Çıxarış təsdiqləndi (Ödənildi).");
  }
  
  function rejectWithdraw(id) {
    const reason = prompt("İmtina səbəbini yazın:");
    if (!reason) return;
  
    const withdraws = get(DB.withdraws);
    const w = withdraws.find(x => x.id === id);
    if (!w) return;
  
    w.status = "rejected";
    w.reason = reason;
    w.rejectedAt = new Date().toISOString();
  
    set(DB.withdraws, withdraws);
    renderWithdrawRequests();
    showToast("Çıxarış imtina edildi.");
  }
  

  function renderWithdrawHistory() {
    const table = document.getElementById("withdrawHistory");
    const withdraws = get(DB.withdraws).filter(w => w.sellerId === currentUser.id);
  
    table.innerHTML = `
      <tr>
        <th>Məbləğ</th>
        <th>Tarix</th>
        <th>Status</th>
      </tr>
    `;
  
    if (withdraws.length === 0) {
      table.innerHTML += `<tr><td colspan="3" class="muted">Tarixçə boşdur</td></tr>`;
      return;
    }
  
    withdraws.forEach(w => {
      table.innerHTML += `
        <tr>
          <td class="price">${w.amount} AZN</td>
          <td>${new Date(w.createdAt).toLocaleDateString()}</td>
          <td>
            <span class="pill ${w.status === "pending" ? "warn" : w.status === "approved" ? "ok" : "err"}">
              ${w.status === "pending" ? "Gözləmədə" : w.status === "approved" ? "Ödənildi" : "İmtina edildi"}
            </span>
            ${w.reason ? `<div class="muted">Səbəb: ${w.reason}</div>` : ""}
          </td>
        </tr>
      `;
    });
  }
  


  // butonu JS ilə işə sal
window.addProduct = addProduct; // funksiya qlobal olsun

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("addProductBtn");
  if (btn) btn.addEventListener("click", addProduct);
});


function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // 3.5 saniyəyə avtomatik silinsin
  setTimeout(() => {
    toast.remove();
  }, 3500);
}




function copyProductLink(productId) {
  const url = `${window.location.origin}${window.location.pathname}?product=${productId}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast("Məhsul linki kopyalandı!");
  });
}

// Məhsulu modalda açmaq
function openProductModal(productId) {
  const product = get(DB.products).find(p => p.id === productId);
  if (!product) return;

  document.getElementById("modalProductName").textContent = product.name;
  document.getElementById("modalProductBody").innerHTML = `
    ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width:100%;border-radius:12px;margin-bottom:15px;">` : ''}
    <p class="muted">${product.desc}</p>
    <div class="price">${product.price.toFixed(2)} AZN</div>
    <div style="margin-top:15px;display:flex;gap:10px;">
      <button onclick="addToCart('${product.id}')" class="primary">➕ Səbətə at</button>
      <button class="share-btn" onclick="copyProductLink('${product.id}')">
        <i class="fa-solid fa-share-nodes"></i> Paylaş
      </button>
    </div>
  `;

  document.getElementById("productModal").classList.remove("hidden");
}

// Modalı bağlamaq
function closeProductModal() {
  document.getElementById("productModal").classList.add("hidden");
}

// Səhifə yüklənəndə ?product=ID varsa həm scroll, həm də modal açılır
window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("product");
  if (productId) {
    show('home');
    setTimeout(() => {
      const el = document.getElementById("product-" + productId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      openProductModal(productId); // 🔹 modal açılır
    }, 500);
  }
});




// Handle profile menu for users
if (currentUser && currentUser.role === 'user') {
  if (!document.getElementById('profileLink')) {
    const btn = document.createElement('button');
    btn.id = 'profileLink';
    btn.className = 'ghost';
    btn.textContent = 'Profilim';
    btn.onclick = () => show('profile');
    document.querySelector('.menu').insertBefore(btn, document.getElementById('sellerMenu'));
  }
} else {
  const profileLink = document.getElementById('profileLink');
  if (profileLink) profileLink.remove();
}




function renderProfile() {
  if (!currentUser) {
    document.getElementById('profile').innerHTML = '<div class="muted">Profil üçün giriş edin.</div>';
    return;
  }

  // İstifadəçi məlumatları
  const user = get(DB.users).find(u => u.id === currentUser.id);
  document.getElementById('profileEmail').textContent = user?.email || '-';
  document.getElementById('profileCreated').textContent =
    user ? new Date(user.createdAt).toLocaleDateString() : '-';

  // Sifarişlər (YALNIZ tamamlananları saysın)
  const myOrders = get(DB.orders).filter(o => o.userId === currentUser.id && o.status === 'completed');

  // Hesab statistikası
  document.getElementById('totalOrdersStat').textContent = myOrders.length;
  const totalSpent = myOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  document.getElementById('totalSpentStat').textContent = totalSpent.toFixed(2) + ' AZN';
  if (myOrders.length > 0) {
    const lastOrder = myOrders[myOrders.length - 1];
    document.getElementById('lastOrderDate').textContent =
      new Date(lastOrder.createdAt).toLocaleDateString();
  } else {
    document.getElementById('lastOrderDate').textContent = '-';
  }

  // VİP statusu hesabla
  const totalItems = myOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0);

  const itemsPercent = Math.min((totalItems / 20) * 100, 100);
  const spentPercent = Math.min((totalSpent / 200) * 100, 100);

  // progress barları doldur
  document.getElementById('itemsProgress').style.width = itemsPercent + "%";
  document.getElementById('itemsProgressText').textContent = `${totalItems} / 20`;

  document.getElementById('spentProgress').style.width = spentPercent + "%";
  document.getElementById('spentProgressText').textContent = `${totalSpent.toFixed(2)} / 200 AZN`;

  const vipEl = document.getElementById('vipStatus');
  const vipProgress = document.getElementById('vipProgress');

  if (totalItems >= 20 && totalSpent >= 200) {
    user.isVIP = true;
    currentUser.isVIP = true; // 🔹 əlavə et
    vipEl.textContent = "🎉 Təbriklər! VİP profil təsdiq edildi (10% endirim)";
    vipEl.classList.remove('muted');
    vipEl.classList.add('success');
    vipProgress.style.display = "none"; 
  } else {
    user.isVIP = false;
    currentUser.isVIP = false; // 🔹 əlavə et
    vipEl.textContent = "VİP statusa çatmaq üçün missionları tamamlayın:";
    vipEl.classList.remove('success');
    vipEl.classList.add('muted');
    vipProgress.style.display = "block"; 
  }
  
  // 🔹 dəyişiklikləri saxla
  const users = get(DB.users);
  const idx = users.findIndex(u => u.id === user.id);
  if (idx !== -1) {
    users[idx] = user;
    set(DB.users, users);
  }
  
}






function togglePasswordForm() {
  const form = document.getElementById('passwordForm');
  const arrow = document.getElementById('passwordArrow');

  if (form.classList.contains('hidden')) {
    form.classList.remove('hidden');
    arrow.textContent = "▲";
  } else {
    form.classList.add('hidden');
    arrow.textContent = "▼";
  }
}


function changePassword() {
  const oldPass = document.getElementById('oldPass').value.trim();
  const newPass = document.getElementById('newPass').value.trim();
  const resultEl = document.getElementById('passChangeResult');

  const users = get(DB.users);
  const user = users.find(u => u.id === currentUser.id);
  if (!user) return;

  if (user.password !== oldPass) {
    resultEl.textContent = "❌ Köhnə şifrə yanlışdır.";
    return;
  }
  if (newPass.length < 6) {
    resultEl.textContent = "⚠️ Yeni şifrə ən azı 6 simvol olmalıdır.";
    return;
  }

  user.password = newPass;
  set(DB.users, users);

  resultEl.textContent = "✅ Şifrə uğurla dəyişdirildi.";
  document.getElementById('oldPass').value = '';
  document.getElementById('newPass').value = '';
}




function openProductModal(productId) {
  const product = get(DB.products).find(p => p.id === productId);
  if (!product) return;

  // VIP endirim hesablaması
  let price = product.price;
  let priceHTML = `${price.toFixed(2)} AZN`;

  if (currentUser?.isVIP) {
    const discounted = (price * 0.9).toFixed(2);
    priceHTML = `
      <span style="color:#4caf50;font-weight:bold;">${discounted} AZN</span>
      <span class="muted" style="text-decoration:line-through;margin-left:8px;">
        ${price.toFixed(2)} AZN
      </span>`;
  }

  document.getElementById("modalProductName").textContent = product.name;
  document.getElementById("modalProductBody").innerHTML = `
    ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width:100%;border-radius:12px;margin-bottom:15px;">` : ''}
    <p class="muted">${product.desc}</p>
    <div class="price">${priceHTML}</div>
    <div style="margin-top:15px;display:flex;gap:10px;">
      <button onclick="addToCart('${product.id}')" class="primary">➕ Səbətə at</button>
      <button class="share-btn" onclick="copyProductLink('${product.id}')">
        <i class="fa-solid fa-share-nodes"></i> Paylaş
      </button>
    </div>
  `;

  document.getElementById("productModal").classList.remove("hidden");
}





function renderAdminSellers() {
  const container = document.getElementById('adminSellersList');
  const users = get(DB.users).filter(u => u.role === 'seller');

  if (users.length === 0) {
    container.innerHTML = '<div class="muted">Heç bir satıcı yoxdur.</div>';
    return;
  }

  container.innerHTML = users.map(u => `
    <div class="seller-card">
      <div class="seller-header" onclick="toggleSellerProducts('${u.id}')">
        <strong>${u.name || u.email}</strong>
        <button class="ghost">▼</button>
      </div>
      <div id="seller-products-${u.id}" class="seller-products hidden"></div>
    </div>
  `).join('');
}


