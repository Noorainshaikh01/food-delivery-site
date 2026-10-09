// ===========================
// USER-SPECIFIC CART MANAGEMENT SYSTEM
// FINAL COMPLETE VERSION
// ===========================

let cart = [];

// ===========================
// HELPER FUNCTIONS FOR USER-SPECIFIC STORAGE
// ===========================

function getUserId() {
  return (
    sessionStorage.getItem("userId") ||
    sessionStorage.getItem("userEmail") ||
    "guest"
  );
}

function getUserCartKey() {
  return `cart_${getUserId()}`;
}

function getUserAddressKey() {
  return `address_${getUserId()}`;
}

// ===========================
// CART MIGRATION (Old to New)
// ===========================

function migrateOldCart() {
  const oldCart = localStorage.getItem("cart");
  const userId = getUserId();
  const newCartKey = `cart_${userId}`;

  // If old cart exists and new cart doesn't exist
  if (oldCart && !localStorage.getItem(newCartKey)) {
    console.log("✓ Migrating old cart to user-specific cart...");
    localStorage.setItem(newCartKey, oldCart);
    console.log("✓ Migration complete!");

    // Remove old cart key
    localStorage.removeItem("cart");
  }
}

// ===========================
// LOAD & SAVE USER-SPECIFIC CART
// ===========================

function loadUserCart() {
  const cartKey = getUserCartKey();
  const savedCart = localStorage.getItem(cartKey);
  cart = savedCart ? JSON.parse(savedCart) : [];
  console.log(`✓ Loaded cart for user: ${getUserId()}`, cart);
  return cart;
}

function saveUserCart() {
  const cartKey = getUserCartKey();
  localStorage.setItem(cartKey, JSON.stringify(cart));
  console.log(`✓ Saved cart for user: ${getUserId()}`);
}

// ===========================
// CART DISPLAY FUNCTIONS
// ===========================

function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartCount = document.getElementById("cart-count");
  if (cartCount) {
    cartCount.textContent = totalItems;
  }
}

function displayCartItems() {
  const cartItemsContainer = document.getElementById("cart-items-container");
  const emptyCart = document.getElementById("empty-cart");
  const addressSection = document.getElementById("address-section");

  console.log("Displaying cart:", cart);

  if (cart.length === 0) {
    if (cartItemsContainer) cartItemsContainer.style.display = "none";
    if (emptyCart) emptyCart.style.display = "block";
    if (addressSection) addressSection.style.display = "none";
    return;
  }

  if (cartItemsContainer) cartItemsContainer.style.display = "block";
  if (emptyCart) emptyCart.style.display = "none";
  if (addressSection) addressSection.style.display = "block";

  cartItemsContainer.innerHTML = cart
    .map(
      (item, index) => `
    <div class="cart-item-card">
      <img src="${item.image}" alt="${
        item.name
      }" onerror="this.src='https://via.placeholder.com/100x100?text=Food'">
      <div class="item-details">
        <h4>${item.name}</h4>
        <p class="item-meta"><i class="fas fa-store"></i> ${
          item.restaurant || "Food Express"
        }</p>
        <p class="item-price">₹${item.price}</p>
        
        <div class="quantity-controls">
          <button onclick="decreaseQuantity(${index})"><i class="fas fa-minus"></i></button>
          <span>${item.quantity}</span>
          <button onclick="increaseQuantity(${index})"><i class="fas fa-plus"></i></button>
        </div>
      </div>
      <button class="remove-btn" onclick="removeFromCart(${index})">
        <i class="fas fa-trash"></i> Remove
      </button>
    </div>
  `
    )
    .join("");

  calculateTotal();
}

// ===========================
// CART ITEM MANAGEMENT
// ===========================

function addToCart(item) {
  // Check if user is logged in
  const userName = sessionStorage.getItem("userName");
  if (!userName) {
    if (
      confirm("Please login to add items to cart. Would you like to login now?")
    ) {
      window.location.href = "login.html";
    }
    return;
  }

  // Load user's cart
  loadUserCart();

  // Check if item already exists
  const existingItemIndex = cart.findIndex(
    (cartItem) => cartItem.id === item.id || cartItem.name === item.name
  );

  if (existingItemIndex !== -1) {
    cart[existingItemIndex].quantity += 1;
    alert(`${item.name} quantity increased!`);
  } else {
    cart.push({
      id: item.id || Date.now().toString(),
      name: item.name,
      price: item.price,
      image: item.image || "https://via.placeholder.com/100x100?text=Food",
      restaurant: item.restaurant || "Food Express",
      quantity: 1,
    });
    alert(`${item.name} added to cart!`);
  }

  saveUserCart();
  updateCartCount();
}

function increaseQuantity(index) {
  if (cart[index]) {
    cart[index].quantity += 1;
    saveUserCart();
    displayCartItems();
    updateCartCount();
  }
}

function decreaseQuantity(index) {
  if (cart[index] && cart[index].quantity > 1) {
    cart[index].quantity -= 1;
    saveUserCart();
    displayCartItems();
    updateCartCount();
  } else if (cart[index] && cart[index].quantity === 1) {
    removeFromCart(index);
  }
}

function removeFromCart(index) {
  if (confirm("Remove this item from cart?")) {
    cart.splice(index, 1);
    saveUserCart();
    displayCartItems();
    updateCartCount();
  }
}

function clearUserCart() {
  if (confirm("Are you sure you want to clear your cart?")) {
    const cartKey = getUserCartKey();
    localStorage.removeItem(cartKey);
    cart = [];
    updateCartCount();
    if (window.location.pathname.includes("cart.html")) {
      displayCartItems();
    }
  }
}

// ===========================
// PRICE CALCULATION
// ===========================

function calculateTotal() {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = subtotal >= 299 ? 0 : 40;
  const platformFee = 5;
  const gst = Math.round((subtotal + platformFee) * 0.05);
  const total = subtotal + deliveryFee + platformFee + gst;

  const subtotalEl = document.getElementById("subtotal");
  const deliveryFeeEl = document.getElementById("delivery-fee");
  const platformFeeEl = document.getElementById("platform-fee");
  const gstEl = document.getElementById("gst");
  const totalEl = document.getElementById("total");

  if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
  if (deliveryFeeEl)
    deliveryFeeEl.textContent = deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`;
  if (platformFeeEl) platformFeeEl.textContent = `₹${platformFee}`;
  if (gstEl) gstEl.textContent = `₹${gst}`;
  if (totalEl) totalEl.textContent = `₹${total}`;
}

// ===========================
// USER-SPECIFIC ADDRESS MANAGEMENT
// ===========================

function saveAddress(event) {
  if (event) event.preventDefault();

  const fullNameEl = document.getElementById("fullName");
  const phoneEl = document.getElementById("phone");
  const addressEl = document.getElementById("address");
  const landmarkEl = document.getElementById("landmark");
  const pincodeEl = document.getElementById("pincode");
  const cityEl = document.getElementById("city");
  const stateEl = document.getElementById("state");
  const addressTypeEl = document.querySelector(
    'input[name="addressType"]:checked'
  );

  if (
    !fullNameEl ||
    !phoneEl ||
    !addressEl ||
    !pincodeEl ||
    !cityEl ||
    !stateEl
  ) {
    alert("Please fill in all required fields");
    return;
  }

  const addressData = {
    fullName: fullNameEl.value,
    phone: phoneEl.value,
    address: addressEl.value,
    landmark: landmarkEl ? landmarkEl.value : "",
    pincode: pincodeEl.value,
    city: cityEl.value,
    state: stateEl.value,
    type: addressTypeEl ? addressTypeEl.value : "Home",
  };

  const addressKey = getUserAddressKey();
  localStorage.setItem(addressKey, JSON.stringify(addressData));

  displaySavedAddress();
  hideAddressForm();

  // Reset form
  const form = document.getElementById("address-form");
  if (form) {
    const formElement = form.querySelector("form");
    if (formElement) formElement.reset();
  }

  alert("Address saved successfully!");
}

function displaySavedAddress() {
  const addressKey = getUserAddressKey();
  const savedAddress = localStorage.getItem(addressKey);

  const savedAddressEl = document.getElementById("saved-address");
  const addAddressBtn = document.getElementById("add-address-btn");

  if (savedAddress) {
    const address = JSON.parse(savedAddress);

    if (savedAddressEl) savedAddressEl.style.display = "block";
    if (addAddressBtn) addAddressBtn.style.display = "none";

    const addressTypeEl = document.getElementById("address-type");
    const addressDetailsEl = document.getElementById("address-details");

    if (addressTypeEl) addressTypeEl.textContent = address.type;
    if (addressDetailsEl) {
      addressDetailsEl.innerHTML = `
        <strong>${address.fullName}</strong> | ${address.phone}<br>
        ${address.address}${address.landmark ? ", " + address.landmark : ""}<br>
        ${address.city}, ${address.state} - ${address.pincode}
      `;
    }
  } else {
    if (savedAddressEl) savedAddressEl.style.display = "none";
    if (addAddressBtn) addAddressBtn.style.display = "block";
  }
}

function editAddress() {
  const addressKey = getUserAddressKey();
  const savedAddress = localStorage.getItem(addressKey);

  if (savedAddress) {
    const address = JSON.parse(savedAddress);

    const fullNameEl = document.getElementById("fullName");
    const phoneEl = document.getElementById("phone");
    const addressEl = document.getElementById("address");
    const landmarkEl = document.getElementById("landmark");
    const pincodeEl = document.getElementById("pincode");
    const cityEl = document.getElementById("city");
    const stateEl = document.getElementById("state");

    if (fullNameEl) fullNameEl.value = address.fullName;
    if (phoneEl) phoneEl.value = address.phone;
    if (addressEl) addressEl.value = address.address;
    if (landmarkEl) landmarkEl.value = address.landmark || "";
    if (pincodeEl) pincodeEl.value = address.pincode;
    if (cityEl) cityEl.value = address.city;
    if (stateEl) stateEl.value = address.state;

    const addressTypeEl = document.querySelector(
      `input[name="addressType"][value="${address.type}"]`
    );
    if (addressTypeEl) addressTypeEl.checked = true;

    showAddressForm();
  }
}

function deleteAddress() {
  if (confirm("Are you sure you want to delete this address?")) {
    const addressKey = getUserAddressKey();
    localStorage.removeItem(addressKey);

    const savedAddressEl = document.getElementById("saved-address");
    const addAddressBtn = document.getElementById("add-address-btn");

    if (savedAddressEl) savedAddressEl.style.display = "none";
    if (addAddressBtn) addAddressBtn.style.display = "block";

    alert("Address deleted successfully!");
  }
}

function showAddressForm() {
  const addressForm = document.getElementById("address-form");
  const addAddressBtn = document.getElementById("add-address-btn");
  const savedAddress = document.getElementById("saved-address");

  if (addressForm) addressForm.style.display = "block";
  if (addAddressBtn) addAddressBtn.style.display = "none";
  if (savedAddress) savedAddress.style.display = "none";
}

function hideAddressForm() {
  const addressForm = document.getElementById("address-form");
  const addAddressBtn = document.getElementById("add-address-btn");

  if (addressForm) addressForm.style.display = "none";
  if (addAddressBtn) addAddressBtn.style.display = "block";

  displaySavedAddress();
}

// ===========================
// CHECKOUT FUNCTION
// ===========================

function proceedToCheckout() {
  const userName = sessionStorage.getItem("userName");

  // Check if user is logged in
  if (!userName) {
    alert("Please login to proceed");
    window.location.href = "login.html";
    return;
  }

  // Check if cart is empty
  if (cart.length === 0) {
    alert("Your cart is empty! Add some items first.");
    window.location.href = "index.html";
    return;
  }

  // Check if address is saved
  const addressKey = getUserAddressKey();
  const savedAddress = localStorage.getItem(addressKey);

  if (!savedAddress) {
    alert("Please add a delivery address before proceeding");
    const addressForm = document.getElementById("address-form");
    if (addressForm) {
      addressForm.scrollIntoView({ behavior: "smooth" });
      showAddressForm();
    }
    return;
  }

  // Calculate order summary
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = subtotal >= 299 ? 0 : 40;
  const platformFee = 5;
  const gst = Math.round((subtotal + platformFee) * 0.05);
  const total = subtotal + deliveryFee + platformFee + gst;

  // Save order summary to sessionStorage
  sessionStorage.setItem(
    "orderSummary",
    JSON.stringify({
      items: cart,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      platformFee: platformFee,
      gst: gst,
      total: total,
      address: JSON.parse(savedAddress),
    })
  );

  // Redirect to payment page
  window.location.href = "payment.html";
}

// ===========================
// DEBUG FUNCTION
// ===========================

function debugCart() {
  console.log("=== CART DEBUG INFO ===");
  console.log("User ID:", getUserId());
  console.log("Cart Key:", getUserCartKey());
  console.log("Cart Contents:", cart);
  console.log("Cart Length:", cart.length);
  console.log("======================");
}

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener("DOMContentLoaded", function () {
  console.log("✓ Cart system initializing...");

  // Migrate old cart if exists
  migrateOldCart();

  // Load user-specific cart
  loadUserCart();

  // Debug info
  debugCart();

  // Update cart count
  updateCartCount();

  // If on cart page, display cart and address
  if (window.location.pathname.includes("cart.html")) {
    console.log("✓ Cart page detected, displaying items...");
    displayCartItems();
    displaySavedAddress();
  }
});

// ===========================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ===========================

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.clearUserCart = clearUserCart;
window.saveAddress = saveAddress;
window.editAddress = editAddress;
window.deleteAddress = deleteAddress;
window.showAddressForm = showAddressForm;
window.hideAddressForm = hideAddressForm;
window.proceedToCheckout = proceedToCheckout;
window.updateCartCount = updateCartCount;
window.debugCart = debugCart;

console.log("✓ Cart system loaded successfully!");
