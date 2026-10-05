// ==========================================================================
// ATELIER ÉLÉONORE - HAUTE COUTURE CORE LOGIC & PAYMENT ENGINE
// ==========================================================================

const CURRENCIES = {
  USD: { symbol: "$", rate: 1.0, label: "USD ($)" },
  EUR: { symbol: "€", rate: 0.92, label: "EUR (€)" },
  GBP: { symbol: "£", rate: 0.79, label: "GBP (£)" },
  INR: { symbol: "₹", rate: 83.5, label: "INR (₹)" }
};

// Application State
const state = {
  currency: "USD",
  products: [],
  cart: [],
  wishlist: new Set(),
  activeCategory: "All Creations",
  searchQuery: "",
  sortBy: "featured",
  discountPercent: 0,
  discountCode: "",
  isGiftWrap: false,
  orders: [],
  currentModalProduct: null,
  checkoutStep: 1,
  checkoutData: {
    customerName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "United States",
    zip: "",
    shippingMethod: "standard",
    paymentMethod: "card",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvv: ""
  }
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  loadSavedState();
  renderProducts();
  setupEventListeners();
  updateCartUI();
  updateWishlistCount();
  setupInteractiveCard();
});

// Load state from localStorage or defaults
function loadSavedState() {
  const savedProducts = localStorage.getItem("atelier_products");
  if (savedProducts) {
    try {
      state.products = JSON.parse(savedProducts);
    } catch (e) {
      state.products = [...window.INITIAL_PRODUCTS];
    }
  } else {
    state.products = [...window.INITIAL_PRODUCTS];
  }

  const savedCart = localStorage.getItem("atelier_cart");
  if (savedCart) {
    try {
      state.cart = JSON.parse(savedCart);
    } catch (e) {
      state.cart = [];
    }
  }

  const savedWishlist = localStorage.getItem("atelier_wishlist");
  if (savedWishlist) {
    try {
      state.wishlist = new Set(JSON.parse(savedWishlist));
    } catch (e) {
      state.wishlist = new Set();
    }
  }

  const savedOrders = localStorage.getItem("atelier_orders");
  if (savedOrders) {
    try {
      state.orders = JSON.parse(savedOrders);
    } catch (e) {
      state.orders = [];
    }
  }

  const savedCurrency = localStorage.getItem("atelier_currency");
  if (savedCurrency && CURRENCIES[savedCurrency]) {
    state.currency = savedCurrency;
    const select = document.getElementById("currencySelector");
    if (select) select.value = savedCurrency;
  }
}

// Format Price with Currency
function formatPrice(amountUSD) {
  const curr = CURRENCIES[state.currency] || CURRENCIES.USD;
  const converted = Math.round(amountUSD * curr.rate);
  return `${curr.symbol}${converted.toLocaleString()}`;
}

// Render Products Grid
function renderProducts() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  let filtered = state.products.filter(p => {
    const matchesCat = state.activeCategory === "All Creations" || p.category === state.activeCategory;
    const matchesSearch = !state.searchQuery || 
      p.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      p.fabric.toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (state.sortBy === "price-low") {
    filtered.sort((a, b) => a.priceUSD - b.priceUSD);
  } else if (state.sortBy === "price-high") {
    filtered.sort((a, b) => b.priceUSD - a.priceUSD);
  } else if (state.sortBy === "rating") {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center text-stone-500">
        <p class="font-serif text-2xl mb-2">No creations found</p>
        <p class="text-sm">Try selecting another collection or clearing your search term.</p>
        <button onclick="resetFilters()" class="mt-4 btn-secondary text-xs">Clear Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(product => {
    const isWishlisted = state.wishlist.has(product.id);
    const secondaryImg = product.images[1] || product.images[0];
    return `
      <div class="product-card group" data-id="${product.id}">
        <div class="product-image-wrap">
          <span class="badge-tag">${product.badge || 'Handmade'}</span>
          <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" 
                  onclick="toggleWishlist('${product.id}', event)" 
                  title="Save to Wishlist" 
                  aria-label="Wishlist">
            <svg class="w-4 h-4 text-stone-700 transition" fill="${isWishlisted ? '#B86B5A' : 'none'}" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
          
          <img src="${product.images[0]}" alt="${product.name}" class="img-primary" loading="lazy" />
          <img src="${secondaryImg}" alt="${product.name} back view" class="img-secondary" loading="lazy" />

          <div class="quick-view-overlay">
            <button onclick="openProductModal('${product.id}')" class="flex-1 py-2.5 bg-white/95 text-stone-900 font-semibold text-xs uppercase tracking-wider rounded hover:bg-stone-900 hover:text-white transition">
              Quick View
            </button>
            <button onclick="quickAddToCart('${product.id}')" class="px-3 py-2.5 bg-[#C5A059] text-stone-900 font-bold rounded hover:bg-[#DFBE7B] transition flex items-center justify-center" title="Quick Add">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>

        <div class="p-5 flex flex-col flex-1 justify-between bg-white">
          <div>
            <div class="flex items-center justify-between text-xs text-stone-500 mb-1">
              <span>${product.category}</span>
              <span class="flex items-center gap-1 text-[#C5A059] font-medium">
                ★ ${product.rating.toFixed(1)} <span class="text-stone-400">(${product.reviewsCount})</span>
              </span>
            </div>
            <h3 class="font-serif text-lg font-semibold text-stone-900 group-hover:text-[#C5A059] transition cursor-pointer" onclick="openProductModal('${product.id}')">
              ${product.name}
            </h3>
            <p class="text-xs text-stone-500 line-clamp-1 mt-1 font-light italic">${product.subtitle || product.fabric}</p>
          </div>

          <div class="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
            <div>
              <span class="text-xs text-stone-400 uppercase tracking-widest block">Handmade Price</span>
              <span class="font-serif text-xl font-bold text-stone-900">${formatPrice(product.priceUSD)}</span>
            </div>
            <span class="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              ${product.artisanHours}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Reset Filters
function resetFilters() {
  state.activeCategory = "All Creations";
  state.searchQuery = "";
  state.sortBy = "featured";
  
  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.value = "";
  
  document.querySelectorAll(".category-tab-btn").forEach(btn => {
    btn.classList.toggle("active-cat", btn.dataset.category === "All Creations");
  });
  
  renderProducts();
}

// Toggle Wishlist
function toggleWishlist(productId, e) {
  if (e) e.stopPropagation();
  if (state.wishlist.has(productId)) {
    state.wishlist.delete(productId);
    showToast("Removed from Wishlist");
  } else {
    state.wishlist.add(productId);
    showToast("Added to your Wishlist ❤️");
  }
  localStorage.setItem("atelier_wishlist", JSON.stringify([...state.wishlist]));
  updateWishlistCount();
  renderProducts();
}

function updateWishlistCount() {
  const el = document.getElementById("wishlistCount");
  if (el) {
    el.textContent = state.wishlist.size;
    el.classList.toggle("hidden", state.wishlist.size === 0);
  }
}

// Quick Add to Cart with Default Size
function quickAddToCart(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const defaultSize = product.sizes[0] || "Custom Fit";
  addToCart(product, defaultSize, 1);
  openCartDrawer();
}

// Add to Cart Logic
function addToCart(product, size, quantity = 1, customMeasurements = null) {
  const existingIndex = state.cart.findIndex(item => 
    item.id === product.id && 
    item.size === size && 
    JSON.stringify(item.customMeasurements) === JSON.stringify(customMeasurements)
  );

  if (existingIndex > -1) {
    state.cart[existingIndex].quantity += quantity;
  } else {
    state.cart.push({
      id: product.id,
      name: product.name,
      priceUSD: product.priceUSD,
      image: product.images[0],
      size: size,
      artisanHours: product.artisanHours,
      quantity: quantity,
      customMeasurements: customMeasurements
    });
  }

  saveCart();
  updateCartUI();
  showToast(`Added "${product.name}" to Bag ✨`);
}

function saveCart() {
  localStorage.setItem("atelier_cart", JSON.stringify(state.cart));
}

// Update Cart Drawer UI
function updateCartUI() {
  const countEl = document.getElementById("cartCount");
  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  if (countEl) {
    countEl.textContent = totalItems;
    countEl.classList.toggle("hidden", totalItems === 0);
  }

  const itemsContainer = document.getElementById("cartItemsContainer");
  const emptyState = document.getElementById("cartEmptyState");
  const checkoutFooter = document.getElementById("cartCheckoutFooter");

  if (!itemsContainer) return;

  if (state.cart.length === 0) {
    itemsContainer.innerHTML = "";
    if (emptyState) emptyState.classList.remove("hidden");
    if (checkoutFooter) checkoutFooter.classList.add("hidden");
    updateFreeShippingMeter(0);
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");
  if (checkoutFooter) checkoutFooter.classList.remove("hidden");

  // Calculate Subtotal in USD
  const subtotalUSD = state.cart.reduce((sum, item) => sum + (item.priceUSD * item.quantity), 0);
  const discountUSD = Math.round(subtotalUSD * (state.discountPercent / 100));
  const giftWrapCostUSD = state.isGiftWrap ? 10 : 0;
  const isFreeShipping = subtotalUSD >= 200;
  const shippingUSD = isFreeShipping ? 0 : 25;
  const grandTotalUSD = Math.max(0, subtotalUSD - discountUSD + giftWrapCostUSD + shippingUSD);

  updateFreeShippingMeter(subtotalUSD);

  // Render Cart Items
  itemsContainer.innerHTML = state.cart.map((item, index) => `
    <div class="flex gap-4 p-4 border-b border-stone-100 items-start">
      <img src="${item.image}" alt="${item.name}" class="w-16 h-20 object-cover rounded bg-stone-100 flex-shrink-0" />
      <div class="flex-1 min-w-0">
        <h4 class="font-serif font-medium text-stone-900 truncate">${item.name}</h4>
        <div class="text-xs text-stone-500 mt-0.5">
          <span>Size: <strong class="text-stone-800">${item.size}</strong></span>
          ${item.customMeasurements ? `
            <span class="block text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1">
              Bust: ${item.customMeasurements.bust || '-'}, Waist: ${item.customMeasurements.waist || '-'}, Hips: ${item.customMeasurements.hips || '-'}
            </span>
          ` : ''}
        </div>
        <div class="text-xs font-semibold text-stone-900 mt-2">
          ${formatPrice(item.priceUSD)}
        </div>
        <div class="flex items-center justify-between mt-2">
          <div class="flex items-center border border-stone-200 rounded">
            <button onclick="changeCartQty(${index}, -1)" class="px-2 py-0.5 text-stone-600 hover:bg-stone-100">-</button>
            <span class="px-2 text-xs font-medium text-stone-800">${item.quantity}</span>
            <button onclick="changeCartQty(${index}, 1)" class="px-2 py-0.5 text-stone-600 hover:bg-stone-100">+</button>
          </div>
          <button onclick="removeCartItem(${index})" class="text-xs text-stone-400 hover:text-red-600 transition">Remove</button>
        </div>
      </div>
    </div>
  `).join("");

  // Update Summary values
  document.getElementById("cartSubtotal").textContent = formatPrice(subtotalUSD);
  document.getElementById("cartTotal").textContent = formatPrice(grandTotalUSD);

  const discountRow = document.getElementById("cartDiscountRow");
  if (discountRow) {
    if (discountUSD > 0) {
      discountRow.classList.remove("hidden");
      document.getElementById("cartDiscountAmount").textContent = `-${formatPrice(discountUSD)} (${state.discountCode})`;
    } else {
      discountRow.classList.add("hidden");
    }
  }

  const giftWrapRow = document.getElementById("cartGiftWrapRow");
  if (giftWrapRow) {
    giftWrapRow.classList.toggle("hidden", !state.isGiftWrap);
    if (state.isGiftWrap) {
      document.getElementById("cartGiftWrapAmount").textContent = formatPrice(giftWrapCostUSD);
    }
  }

  const shippingEl = document.getElementById("cartShippingAmount");
  if (shippingEl) {
    shippingEl.textContent = isFreeShipping ? "FREE" : formatPrice(shippingUSD);
    shippingEl.className = isFreeShipping ? "text-emerald-700 font-medium" : "text-stone-800 font-medium";
  }
}

// Free Shipping Progress Meter
function updateFreeShippingMeter(currentUSD) {
  const goalUSD = 200;
  const progressEl = document.getElementById("freeShippingProgress");
  const textEl = document.getElementById("freeShippingText");
  if (!progressEl || !textEl) return;

  const pct = Math.min(100, Math.round((currentUSD / goalUSD) * 100));
  progressEl.style.width = `${pct}%`;

  if (currentUSD >= goalUSD) {
    textEl.innerHTML = `<span class="text-emerald-700 font-medium">✨ Congratulations! You unlocked FREE Insured Express Shipping!</span>`;
  } else {
    const diffUSD = goalUSD - currentUSD;
    textEl.innerHTML = `Add <strong>${formatPrice(diffUSD)}</strong> more for <strong>FREE Insured Courier</strong>`;
  }
}

function changeCartQty(index, delta) {
  if (!state.cart[index]) return;
  state.cart[index].quantity += delta;
  if (state.cart[index].quantity <= 0) {
    state.cart.splice(index, 1);
  }
  saveCart();
  updateCartUI();
}

function removeCartItem(index) {
  state.cart.splice(index, 1);
  saveCart();
  updateCartUI();
  showToast("Item removed from Bag");
}

// Promo Code Application
function applyPromoCode() {
  const input = document.getElementById("promoCodeInput");
  if (!input) return;
  const code = input.value.trim().toUpperCase();

  if (code === "MAISON10") {
    state.discountPercent = 10;
    state.discountCode = "MAISON10";
    showToast("✨ 10% Couture Promo applied!");
  } else if (code === "HANDMADE15") {
    state.discountPercent = 15;
    state.discountCode = "HANDMADE15";
    showToast("✨ 15% Artisan Discount applied!");
  } else if (code === "SISTERLOVE") {
    state.discountPercent = 20;
    state.discountCode = "SISTERLOVE";
    showToast("❤️ 20% Special Atelier Discount applied!");
  } else {
    showToast("Invalid promo code. Try MAISON10 or HANDMADE15");
    return;
  }
  updateCartUI();
}

function toggleGiftWrap(checkbox) {
  state.isGiftWrap = checkbox.checked;
  updateCartUI();
}

// Product Quick View Modal
function openProductModal(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;
  state.currentModalProduct = product;

  const modal = document.getElementById("productDetailModal");
  const backdrop = document.getElementById("modalBackdrop");
  if (!modal || !backdrop) return;

  document.getElementById("modalProdName").textContent = product.name;
  document.getElementById("modalProdSubtitle").textContent = product.subtitle;
  document.getElementById("modalProdPrice").textContent = formatPrice(product.priceUSD);
  document.getElementById("modalProdRating").textContent = `★ ${product.rating} (${product.reviewsCount} atelier reviews)`;
  document.getElementById("modalProdBadge").textContent = product.badge;
  document.getElementById("modalProdHours").textContent = product.artisanHours;
  document.getElementById("modalProdFabric").textContent = product.fabric;
  document.getElementById("modalProdColor").textContent = product.color;
  document.getElementById("modalProdDesc").textContent = product.description;
  document.getElementById("modalProdCare").textContent = product.care;

  // Gallery
  const mainImg = document.getElementById("modalMainImg");
  mainImg.src = product.images[0];

  const thumbsContainer = document.getElementById("modalThumbnails");
  thumbsContainer.innerHTML = product.images.map((img, i) => `
    <button onclick="setModalMainImage('${img}')" class="w-16 h-20 rounded border border-stone-200 overflow-hidden hover:border-[#C5A059] transition">
      <img src="${img}" class="w-full h-full object-cover" />
    </button>
  `).join("");

  // Craftsmanship list
  const craftList = document.getElementById("modalCraftsmanship");
  craftList.innerHTML = product.craftsmanship.map(item => `
    <li class="flex items-start gap-2 text-xs text-stone-600">
      <span class="text-[#C5A059] font-bold">✓</span>
      <span>${item}</span>
    </li>
  `).join("");

  // Size buttons
  const sizeContainer = document.getElementById("modalSizeOptions");
  sizeContainer.innerHTML = product.sizes.map((s, idx) => `
    <label class="cursor-pointer">
      <input type="radio" name="modal_size" value="${s}" ${idx === 0 ? 'checked' : ''} class="peer sr-only" onchange="toggleCustomFitFields(this.value)" />
      <span class="px-3.5 py-1.5 border border-stone-300 rounded text-xs font-medium text-stone-700 peer-checked:border-stone-900 peer-checked:bg-stone-900 peer-checked:text-white transition block text-center">
        ${s}
      </span>
    </label>
  `).join("");

  // Reset custom measurements box
  const customBox = document.getElementById("customFitMeasurementsBox");
  if (customBox) customBox.classList.add("hidden");

  // Show Modal
  backdrop.classList.add("active");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function setModalMainImage(url) {
  const mainImg = document.getElementById("modalMainImg");
  if (mainImg) mainImg.src = url;
}

function toggleCustomFitFields(sizeValue) {
  const customBox = document.getElementById("customFitMeasurementsBox");
  if (!customBox) return;
  if (sizeValue === "Custom Fit") {
    customBox.classList.remove("hidden");
  } else {
    customBox.classList.add("hidden");
  }
}

function addCurrentModalToCart() {
  if (!state.currentModalProduct) return;
  const selectedSizeEl = document.querySelector('input[name="modal_size"]:checked');
  const size = selectedSizeEl ? selectedSizeEl.value : "Custom Fit";
  const qtyInput = document.getElementById("modalQty");
  const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;

  let customMeasurements = null;
  if (size === "Custom Fit") {
    customMeasurements = {
      bust: document.getElementById("fitBust")?.value || "",
      waist: document.getElementById("fitWaist")?.value || "",
      hips: document.getElementById("fitHips")?.value || "",
      height: document.getElementById("fitHeight")?.value || ""
    };
  }

  addToCart(state.currentModalProduct, size, qty, customMeasurements);
  closeProductModal();
  openCartDrawer();
}

function closeProductModal() {
  const modal = document.getElementById("productDetailModal");
  const backdrop = document.getElementById("modalBackdrop");
  if (modal) modal.classList.remove("active");
  if (backdrop) backdrop.classList.remove("active");
  document.body.style.overflow = "";
}

// Drawer Controls
function openCartDrawer() {
  const drawer = document.getElementById("cartDrawer");
  const backdrop = document.getElementById("cartBackdrop");
  if (drawer && backdrop) {
    drawer.classList.add("active");
    backdrop.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById("cartDrawer");
  const backdrop = document.getElementById("cartBackdrop");
  if (drawer && backdrop) {
    drawer.classList.remove("active");
    backdrop.classList.remove("active");
    document.body.style.overflow = "";
  }
}

// ==========================================================================
// CHECKOUT & PAYMENT INTEGRATION LOGIC
// ==========================================================================
function startCheckout() {
  if (state.cart.length === 0) {
    showToast("Your shopping bag is empty");
    return;
  }
  closeCartDrawer();
  const checkoutModal = document.getElementById("checkoutModal");
  const backdrop = document.getElementById("modalBackdrop");
  if (!checkoutModal || !backdrop) return;

  state.checkoutStep = 1;
  showCheckoutStep(1);
  updateCheckoutSummary();

  backdrop.classList.add("active");
  checkoutModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeCheckoutModal() {
  const checkoutModal = document.getElementById("checkoutModal");
  const backdrop = document.getElementById("modalBackdrop");
  if (checkoutModal) checkoutModal.classList.remove("active");
  if (backdrop) backdrop.classList.remove("active");
  document.body.style.overflow = "";
}

function showCheckoutStep(step) {
  state.checkoutStep = step;

  // Update pills
  for (let i = 1; i <= 3; i++) {
    const pill = document.getElementById(`stepPill${i}`);
    const section = document.getElementById(`checkoutStep${i}`);
    if (pill) {
      pill.classList.remove("active", "completed");
      if (i < step) pill.classList.add("completed");
      else if (i === step) pill.classList.add("active");
    }
    if (section) {
      section.classList.toggle("hidden", i !== step);
    }
  }

  // Update navigation buttons
  const prevBtn = document.getElementById("checkoutBackBtn");
  const nextBtn = document.getElementById("checkoutNextBtn");
  const payBtn = document.getElementById("checkoutPayBtn");

  if (prevBtn) prevBtn.classList.toggle("hidden", step === 1);
  if (nextBtn) nextBtn.classList.toggle("hidden", step === 3);
  if (payBtn) payBtn.classList.toggle("hidden", step !== 3);
}

function nextCheckoutStep() {
  if (state.checkoutStep === 1) {
    // Validate shipping info
    const name = document.getElementById("shipName").value.trim();
    const email = document.getElementById("shipEmail").value.trim();
    const address = document.getElementById("shipAddress").value.trim();
    const city = document.getElementById("shipCity").value.trim();
    const zip = document.getElementById("shipZip").value.trim();

    if (!name || !email || !address || !city || !zip) {
      showToast("Please fill in all shipping fields");
      return;
    }

    state.checkoutData.customerName = name;
    state.checkoutData.email = email;
    state.checkoutData.address = address;
    state.checkoutData.city = city;
    state.checkoutData.zip = zip;
    state.checkoutData.country = document.getElementById("shipCountry")?.value || "United States";
    state.checkoutData.phone = document.getElementById("shipPhone")?.value || "";

    showCheckoutStep(2);
  } else if (state.checkoutStep === 2) {
    // Courier selection
    const courierRadio = document.querySelector('input[name="shipping_method"]:checked');
    state.checkoutData.shippingMethod = courierRadio ? courierRadio.value : "standard";
    showCheckoutStep(3);
  }
}

function prevCheckoutStep() {
  if (state.checkoutStep > 1) {
    showCheckoutStep(state.checkoutStep - 1);
  }
}

function updateCheckoutSummary() {
  const summaryEl = document.getElementById("checkoutItemsSummary");
  if (!summaryEl) return;

  const subtotalUSD = state.cart.reduce((sum, item) => sum + (item.priceUSD * item.quantity), 0);
  const discountUSD = Math.round(subtotalUSD * (state.discountPercent / 100));
  const giftWrapCostUSD = state.isGiftWrap ? 10 : 0;
  const isFreeShipping = subtotalUSD >= 200 || state.checkoutData.shippingMethod === "standard";
  const shippingCost = state.checkoutData.shippingMethod === "express" ? 45 : (isFreeShipping ? 0 : 25);
  const grandTotalUSD = Math.max(0, subtotalUSD - discountUSD + giftWrapCostUSD + shippingCost);

  summaryEl.innerHTML = `
    <div class="space-y-2 mb-3 max-h-36 overflow-y-auto pr-1">
      ${state.cart.map(item => `
        <div class="flex justify-between items-center text-xs">
          <div class="truncate pr-2">
            <span class="font-medium text-stone-800">${item.name}</span>
            <span class="text-stone-400"> × ${item.quantity} (${item.size})</span>
          </div>
          <span class="font-semibold text-stone-900">${formatPrice(item.priceUSD * item.quantity)}</span>
        </div>
      `).join("")}
    </div>
    <div class="border-t border-stone-200 pt-2 space-y-1 text-xs text-stone-600">
      <div class="flex justify-between">
        <span>Subtotal</span>
        <span>${formatPrice(subtotalUSD)}</span>
      </div>
      ${discountUSD > 0 ? `
        <div class="flex justify-between text-emerald-700">
          <span>Artisan Discount</span>
          <span>-${formatPrice(discountUSD)}</span>
        </div>
      ` : ''}
      <div class="flex justify-between">
        <span>Courier</span>
        <span>${shippingCost === 0 ? 'Complimentary Insured' : formatPrice(shippingCost)}</span>
      </div>
      <div class="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
        <span>Total Due</span>
        <span class="text-[#A37F39]">${formatPrice(grandTotalUSD)}</span>
      </div>
    </div>
  `;

  const btnTotal = document.getElementById("checkoutPayBtnAmount");
  if (btnTotal) btnTotal.textContent = formatPrice(grandTotalUSD);
}

// Payment method tab selection (Card, UPI, PayPal)
function selectPaymentMethod(method) {
  state.checkoutData.paymentMethod = method;

  document.querySelectorAll(".payment-method-tab").forEach(tab => {
    tab.classList.toggle("border-stone-900", tab.dataset.method === method);
    tab.classList.toggle("bg-stone-50", tab.dataset.method === method);
  });

  document.getElementById("cardPaymentFields").classList.toggle("hidden", method !== "card");
  document.getElementById("upiPaymentFields").classList.toggle("hidden", method !== "upi");
  document.getElementById("paypalPaymentFields").classList.toggle("hidden", method !== "paypal");
}

// Interactive Credit Card visual simulation
function setupInteractiveCard() {
  const numInput = document.getElementById("ccNumber");
  const nameInput = document.getElementById("ccName");
  const expInput = document.getElementById("ccExpiry");
  const cvvInput = document.getElementById("ccCvv");

  if (numInput) {
    numInput.addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, "").substring(0, 16);
      let formatted = val.match(/.{1,4}/g)?.join(" ") || val;
      e.target.value = formatted;
      document.getElementById("cardDisplayNum").textContent = formatted || "•••• •••• •••• ••••";
    });
  }

  if (nameInput) {
    nameInput.addEventListener("input", (e) => {
      document.getElementById("cardDisplayName").textContent = e.target.value.toUpperCase() || "NAME ON CARD";
    });
  }

  if (expInput) {
    expInput.addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, "").substring(0, 4);
      if (val.length >= 2) val = val.substring(0, 2) + "/" + val.substring(2);
      e.target.value = val;
      document.getElementById("cardDisplayExp").textContent = val || "MM/YY";
    });
  }
}

// Process Payment (Stripe / Gateway Simulation with Security Handshake & OTP)
function processPayment() {
  const method = state.checkoutData.paymentMethod;

  if (method === "card") {
    const cardNum = document.getElementById("ccNumber")?.value.replace(/\s/g, "");
    const cardName = document.getElementById("ccName")?.value.trim();
    const cardExp = document.getElementById("ccExpiry")?.value.trim();
    const cardCvv = document.getElementById("ccCvv")?.value.trim();

    if (!cardNum || cardNum.length < 15 || !cardName || !cardExp || !cardCvv) {
      showToast("Please enter complete card details");
      return;
    }
  }

  // Show Payment Processing Overlay
  const processingOverlay = document.getElementById("paymentProcessingOverlay");
  const statusText = document.getElementById("paymentProcessingStatus");
  if (processingOverlay) processingOverlay.classList.remove("hidden");

  const steps = [
    "Establishing 256-Bit SSL Encrypted Connection...",
    "Authorizing with Haute Couture Banking Gateway...",
    "Verifying 3D Secure Fraud Protection Token...",
    "Securing Atelier Bespoke Order Confirmation..."
  ];

  let currentStep = 0;
  const interval = setInterval(() => {
    currentStep++;
    if (currentStep < steps.length) {
      if (statusText) statusText.textContent = steps[currentStep];
    } else {
      clearInterval(interval);
      finalizeOrderSuccess();
    }
  }, 900);
}

// Finalize Order & Generate Couture Invoice Receipt
function finalizeOrderSuccess() {
  const processingOverlay = document.getElementById("paymentProcessingOverlay");
  if (processingOverlay) processingOverlay.classList.add("hidden");
  closeCheckoutModal();

  const subtotalUSD = state.cart.reduce((sum, item) => sum + (item.priceUSD * item.quantity), 0);
  const discountUSD = Math.round(subtotalUSD * (state.discountPercent / 100));
  const giftWrapCostUSD = state.isGiftWrap ? 10 : 0;
  const shippingCost = state.checkoutData.shippingMethod === "express" ? 45 : (subtotalUSD >= 200 ? 0 : 25);
  const grandTotalUSD = Math.max(0, subtotalUSD - discountUSD + giftWrapCostUSD + shippingCost);

  const orderNumber = "AT-" + Math.floor(100000 + Math.random() * 900000);
  const orderDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const deliveryEst = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const orderRecord = {
    orderNumber,
    date: orderDate,
    customer: state.checkoutData.customerName,
    email: state.checkoutData.email,
    shippingAddress: `${state.checkoutData.address}, ${state.checkoutData.city}, ${state.checkoutData.zip}, ${state.checkoutData.country}`,
    items: [...state.cart],
    totalUSD: grandTotalUSD,
    paymentMethod: state.checkoutData.paymentMethod.toUpperCase(),
    status: "Handcrafting in Progress"
  };

  // Save to sister's order book in state and localStorage
  state.orders.unshift(orderRecord);
  localStorage.setItem("atelier_orders", JSON.stringify(state.orders));

  // Also sync to Python SQLite backend if running on Python server
  try {
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderRecord)
    }).catch(() => {});
  } catch(e) {}

  // Render Confirmation Receipt Modal
  renderReceiptModal(orderRecord, deliveryEst);

  // Clear cart
  state.cart = [];
  state.discountPercent = 0;
  state.discountCode = "";
  state.isGiftWrap = false;
  saveCart();
  updateCartUI();

  showToast(`Order ${orderNumber} placed successfully! 🎉`);
}

function renderReceiptModal(order, deliveryEst) {
  const receiptModal = document.getElementById("receiptModal");
  const backdrop = document.getElementById("modalBackdrop");
  if (!receiptModal || !backdrop) return;

  document.getElementById("receiptOrderNum").textContent = order.orderNumber;
  document.getElementById("receiptDate").textContent = order.date;
  document.getElementById("receiptCustomer").textContent = order.customer;
  document.getElementById("receiptEmail").textContent = order.email;
  document.getElementById("receiptAddress").textContent = order.shippingAddress;
  document.getElementById("receiptDeliveryEst").textContent = deliveryEst;
  document.getElementById("receiptMethod").textContent = order.paymentMethod;
  document.getElementById("receiptTotal").textContent = formatPrice(order.totalUSD);

  const itemsContainer = document.getElementById("receiptItems");
  itemsContainer.innerHTML = order.items.map(item => `
    <div class="flex justify-between py-2 border-b border-stone-100 text-xs">
      <div>
        <span class="font-medium text-stone-900">${item.name}</span>
        <span class="text-stone-400"> × ${item.quantity} (${item.size})</span>
        ${item.customMeasurements ? `
          <div class="text-[10px] text-stone-500 italic">Bust: ${item.customMeasurements.bust}, Waist: ${item.customMeasurements.waist}</div>
        ` : ''}
      </div>
      <span class="font-semibold text-stone-900">${formatPrice(item.priceUSD * item.quantity)}</span>
    </div>
  `).join("");

  backdrop.classList.add("active");
  receiptModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeReceiptModal() {
  const receiptModal = document.getElementById("receiptModal");
  const backdrop = document.getElementById("modalBackdrop");
  if (receiptModal) receiptModal.classList.remove("active");
  if (backdrop) backdrop.classList.remove("active");
  document.body.style.overflow = "";
}

function printReceipt() {
  window.print();
}

// ==========================================================================
// BESPOKE CONSULTATION REQUEST LOGIC
// ==========================================================================
function submitBespokeInquiry(e) {
  e.preventDefault();
  const name = document.getElementById("bespokeName").value;
  const email = document.getElementById("bespokeEmail").value;
  const occasion = document.getElementById("bespokeOccasion").value;
  const budget = document.getElementById("bespokeBudget").value;
  const notes = document.getElementById("bespokeNotes")?.value || "";

  // Sync to Python SQLite backend
  try {
    fetch('/api/bespoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, occasion, budget, notes })
    }).catch(() => {});
  } catch(e) {}

  showToast(`Thank you, ${name}! Your bespoke inquiry for "${occasion}" has been forwarded to the Designer Atelier.`);
  
  // Reset form
  e.target.reset();
}

// ==========================================================================
// DESIGNER STUDIO (SISTER'S ADMIN CONTROLLER)
// ==========================================================================
function openDesignerStudio() {
  const modal = document.getElementById("designerStudioModal");
  const backdrop = document.getElementById("modalBackdrop");
  if (!modal || !backdrop) return;

  renderDesignerOrdersList();
  backdrop.classList.add("active");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeDesignerStudio() {
  const modal = document.getElementById("designerStudioModal");
  const backdrop = document.getElementById("modalBackdrop");
  if (modal) modal.classList.remove("active");
  if (backdrop) backdrop.classList.remove("active");
  document.body.style.overflow = "";
}

function renderDesignerOrdersList() {
  const container = document.getElementById("designerOrdersList");
  if (!container) return;

  if (state.orders.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-stone-400 text-xs">
        No orders placed yet. Add items to bag and complete a demo checkout to see orders appear here!
      </div>
    `;
    return;
  }

  container.innerHTML = state.orders.map(o => `
    <div class="p-3 bg-stone-50 border border-stone-200 rounded text-xs space-y-1">
      <div class="flex justify-between font-semibold text-stone-900">
        <span>Order #${o.orderNumber}</span>
        <span class="text-emerald-700 font-bold">${formatPrice(o.totalUSD)}</span>
      </div>
      <div class="text-stone-500">Client: <strong>${o.customer}</strong> (${o.email})</div>
      <div class="text-stone-500">Status: <span class="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[10px]">${o.status}</span></div>
      <div class="text-stone-400 text-[11px]">Items: ${o.items.map(i => `${i.name} (${i.size})`).join(", ")}</div>
    </div>
  `).join("");
}

function addNewCreation(e) {
  e.preventDefault();
  const name = document.getElementById("newProdName").value.trim();
  const cat = document.getElementById("newProdCat").value;
  const price = parseFloat(document.getElementById("newProdPrice").value) || 190;
  const fabric = document.getElementById("newProdFabric").value.trim();
  const hours = document.getElementById("newProdHours").value.trim() || "24 Hours Handcrafting";
  const imgUrl = document.getElementById("newProdImg").value.trim() || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80";
  const desc = document.getElementById("newProdDesc").value.trim() || "Handcrafted with artisanal attention to detail.";

  const newProduct = {
    id: "custom-" + Date.now(),
    name: name,
    subtitle: fabric,
    category: cat,
    priceUSD: price,
    rating: 5.0,
    reviewsCount: 1,
    badge: "New Atelier Piece",
    artisanHours: hours,
    fabric: fabric,
    color: "Bespoke Dye",
    sizes: ["XS", "S", "M", "L", "Custom Fit"],
    inStock: 3,
    images: [imgUrl, imgUrl],
    description: desc,
    craftsmanship: [
      "Individually hand-stitched by designer",
      "Sustainable natural fibres",
      "Custom tailored upon order"
    ],
    care: "Dry clean or gentle hand wash."
  };

  state.products.unshift(newProduct);
  localStorage.setItem("atelier_products", JSON.stringify(state.products));
  renderProducts();
  showToast(`Added new creation "${name}" to your shop! ✨`);
  e.target.reset();
  closeDesignerStudio();
}

function resetAllDemoData() {
  if (confirm("Reset all products and orders to original default demo data?")) {
    localStorage.removeItem("atelier_products");
    localStorage.removeItem("atelier_orders");
    localStorage.removeItem("atelier_cart");
    localStorage.removeItem("atelier_wishlist");
    state.products = [...window.INITIAL_PRODUCTS];
    state.orders = [];
    state.cart = [];
    state.wishlist = new Set();
    saveCart();
    renderProducts();
    updateCartUI();
    updateWishlistCount();
    renderDesignerOrdersList();
    showToast("Reset to pristine demo data.");
  }
}

// Toast Alert System
function showToast(msg) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast-msg";
  toast.innerHTML = `
    <svg class="w-4 h-4 text-[#C5A059]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
    <span>${msg}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3600);
}

// Setup Event Listeners
function setupEventListeners() {
  // Currency Selector
  const currSelect = document.getElementById("currencySelector");
  if (currSelect) {
    currSelect.addEventListener("change", (e) => {
      state.currency = e.target.value;
      localStorage.setItem("atelier_currency", state.currency);
      renderProducts();
      updateCartUI();
      if (state.currentModalProduct) {
        document.getElementById("modalProdPrice").textContent = formatPrice(state.currentModalProduct.priceUSD);
      }
      showToast(`Currency changed to ${CURRENCIES[state.currency].label}`);
    });
  }

  // Category filter tabs
  document.querySelectorAll(".category-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".category-tab-btn").forEach(b => b.classList.remove("active-cat"));
      btn.classList.add("active-cat");
      state.activeCategory = btn.dataset.category;
      renderProducts();
    });
  });

  // Search input
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      renderProducts();
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById("sortSelector");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      state.sortBy = e.target.value;
      renderProducts();
    });
  }

  // Backdrop close
  const backdrop = document.getElementById("modalBackdrop");
  if (backdrop) {
    backdrop.addEventListener("click", () => {
      closeProductModal();
      closeCheckoutModal();
      closeReceiptModal();
      closeDesignerStudio();
    });
  }

  const cartBackdrop = document.getElementById("cartBackdrop");
  if (cartBackdrop) {
    cartBackdrop.addEventListener("click", closeCartDrawer);
  }
}
