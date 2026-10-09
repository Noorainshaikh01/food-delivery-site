// ===========================
// PAYMENT PAGE SCRIPT
// FINAL COMPLETE VERSION WITH ALL PAYMENT METHODS
// ===========================

let orderSummary = null;
let selectedPaymentMethod = "cod";

// ===========================
// TOAST NOTIFICATION FUNCTION
// ===========================

function showToast(message, type = "success", duration = 3000) {
  const existingToasts = document.querySelectorAll(".toast-notification");
  existingToasts.forEach((toast) => toast.remove());

  const toast = document.createElement("div");
  toast.className = `toast-notification toast-${type}`;

  const icon =
    type === "success"
      ? "check-circle"
      : type === "error"
      ? "exclamation-circle"
      : "info-circle";

  toast.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 100);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener("DOMContentLoaded", function () {
  addToastStyles();

  const userName = sessionStorage.getItem("userName");
  if (!userName) {
    alert("Please login to continue");
    window.location.href = "login.html";
    return;
  }

  orderSummary = JSON.parse(sessionStorage.getItem("orderSummary"));

  if (!orderSummary || !orderSummary.items || orderSummary.items.length === 0) {
    alert("No items in cart");
    window.location.href = "cart.html";
    return;
  }

  displayOrderSummary();
  displayDeliveryAddress();
  updateCartCount();

  document.getElementById("cod").checked = true;
  document.querySelector(".payment-option:last-child").classList.add("active");
});

function addToastStyles() {
  if (document.getElementById("toast-styles")) return;

  const style = document.createElement("style");
  style.id = "toast-styles";
  style.textContent = `
    .toast-notification {
      position: fixed;
      top: 100px;
      right: -400px;
      background: white;
      padding: 1.2em 2em;
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.3);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 1em;
      min-width: 300px;
      max-width: 400px;
      transition: right 0.3s ease;
    }
    
    .toast-notification.show {
      right: 20px;
    }
    
    .toast-notification i {
      font-size: 1.5rem;
    }
    
    .toast-notification span {
      font-weight: 600;
      font-size: 1rem;
    }
    
    .toast-success {
      border-left: 4px solid #4caf50;
    }
    
    .toast-success i {
      color: #4caf50;
    }
    
    .toast-error {
      border-left: 4px solid #f44336;
    }
    
    .toast-error i {
      color: #f44336;
    }
    
    .toast-info {
      border-left: 4px solid #2196F3;
    }
    
    .toast-info i {
      color: #2196F3;
    }
  `;
  document.head.appendChild(style);
}

// ===========================
// DISPLAY FUNCTIONS
// ===========================

function displayOrderSummary() {
  const orderItemsContainer = document.getElementById("order-items");

  orderItemsContainer.innerHTML = orderSummary.items
    .map(
      (item) => `
    <div class="order-item">
      <span class="order-item-name">${item.name}</span>
      <span class="order-item-qty">x${item.quantity}</span>
      <span class="order-item-price">₹${item.price * item.quantity}</span>
    </div>
  `
    )
    .join("");

  document.getElementById("subtotal").textContent = `₹${orderSummary.subtotal}`;
  document.getElementById("delivery-fee").textContent =
    orderSummary.deliveryFee === 0 ? "FREE" : `₹${orderSummary.deliveryFee}`;
  document.getElementById(
    "platform-fee"
  ).textContent = `₹${orderSummary.platformFee}`;
  document.getElementById("gst").textContent = `₹${orderSummary.gst}`;
  document.getElementById("total").textContent = `₹${orderSummary.total}`;
}

function displayDeliveryAddress() {
  const address = orderSummary.address;
  const addressText = document.getElementById("delivery-address-text");

  addressText.innerHTML = `
    <strong>${address.fullName}</strong> | ${address.phone}<br>
    ${address.address}${address.landmark ? ", " + address.landmark : ""}<br>
    ${address.city}, ${address.state} - ${address.pincode}
  `;
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartCount = document.getElementById("cart-count");
  if (cartCount) {
    cartCount.textContent = totalItems;
  }
}

// ===========================
// PAYMENT METHOD SELECTION
// ===========================

function selectPayment(method) {
  selectedPaymentMethod = method;

  // Remove active class from all options
  document.querySelectorAll(".payment-option").forEach((option) => {
    option.classList.remove("active");
  });

  // Add active class to selected option
  event.currentTarget.classList.add("active");
  document.getElementById(method).checked = true;

  // Hide all payment forms
  document.querySelectorAll(".payment-form-container").forEach((form) => {
    form.classList.remove("active");
  });

  // Show selected payment form
  if (method === "card") {
    document.getElementById("card-form").classList.add("active");
  } else if (method === "upi") {
    document.getElementById("upi-form").classList.add("active");
  } else if (method === "netbanking") {
    document.getElementById("netbanking-form").classList.add("active");
  }
}

// ===========================
// PLACE ORDER WITH ALL VALIDATIONS
// ===========================

async function placeOrder() {
  const userName = sessionStorage.getItem("userName");
  const userId = sessionStorage.getItem("userId");
  const userEmail = sessionStorage.getItem("userEmail");

  if (!selectedPaymentMethod) {
    showToast("Please select a payment method", "error");
    return;
  }

  // Validate UPI
  if (selectedPaymentMethod === "upi") {
    const upiId = document.getElementById("upiId").value;
    if (!upiId) {
      showToast("Please enter your UPI ID", "error");
      return;
    }
    if (!upiId.includes("@")) {
      showToast("Please enter a valid UPI ID (e.g., name@paytm)", "error");
      return;
    }
  }

  // Validate Card
  if (selectedPaymentMethod === "card") {
    const cardNumber = document.getElementById("cardNumber").value;
    const cardName = document.getElementById("cardName").value;
    const expiryDate = document.getElementById("expiryDate").value;
    const cvv = document.getElementById("cvv").value;

    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      showToast("Please fill in all card details", "error");
      return;
    }

    if (cardNumber.replace(/\s/g, "").length < 16) {
      showToast("Please enter a valid card number", "error");
      return;
    }

    if (cvv.length < 3) {
      showToast("Please enter a valid CVV", "error");
      return;
    }
  }

  // Validate Net Banking
  if (selectedPaymentMethod === "netbanking") {
    const bank = document.getElementById("bankSelect").value;
    if (!bank) {
      showToast("Please select your bank", "error");
      return;
    }
  }

  const placeOrderBtn = document.querySelector(".place-order-btn");
  const originalHTML = placeOrderBtn.innerHTML;
  placeOrderBtn.disabled = true;
  placeOrderBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Processing Order...';

  // Show payment processing message based on method
  if (selectedPaymentMethod === "upi") {
    showToast("Processing UPI payment...", "info", 2000);
  } else if (selectedPaymentMethod === "card") {
    showToast("Processing card payment...", "info", 2000);
  } else if (selectedPaymentMethod === "netbanking") {
    showToast("Redirecting to bank...", "info", 2000);
  } else {
    showToast("Processing your order...", "info", 2000);
  }

  const orderId = "FE" + Date.now();
  const currentDate = new Date();
  const estimatedDelivery = new Date(currentDate.getTime() + 45 * 60000);

  const orderData = {
    orderId: orderId,
    userId: userId || "guest",
    userName: userName,
    userEmail: userEmail || "",
    items: orderSummary.items,
    address: orderSummary.address,
    paymentMethod: selectedPaymentMethod,
    subtotal: orderSummary.subtotal,
    deliveryFee: orderSummary.deliveryFee,
    platformFee: orderSummary.platformFee,
    gst: orderSummary.gst,
    total: orderSummary.total,
    status: "Confirmed",
    orderDate: currentDate.toISOString(),
    estimatedDelivery: estimatedDelivery.toISOString(),
  };

  setTimeout(async () => {
    try {
      // Try to save to Firebase if available
      try {
        if (typeof firebase !== "undefined" && firebase.firestore) {
          const db = firebase.firestore();
          await db
            .collection("orders")
            .doc(orderId)
            .set({
              ...orderData,
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
          console.log("Order saved to Firebase:", orderId);
        }
      } catch (firebaseError) {
        console.warn(
          "Firebase save failed, using local storage:",
          firebaseError.message
        );
      }

      // Always save to localStorage
      const orders = JSON.parse(localStorage.getItem("orders") || "[]");
      orders.push(orderData);
      localStorage.setItem("orders", JSON.stringify(orders));

      // Clear cart and order summary
      localStorage.removeItem("cart");
      sessionStorage.removeItem("orderSummary");

      // Save order details
      sessionStorage.setItem("lastOrderId", orderId);
      sessionStorage.setItem("lastOrderTotal", orderSummary.total);
      sessionStorage.setItem(
        "estimatedDelivery",
        estimatedDelivery.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );

      // Show success
      showToast(`Payment successful! Order ID: ${orderId}`, "success", 4000);

      setTimeout(() => {
        document.getElementById("order-id-display").textContent = orderId;
        document.getElementById("success-modal").classList.add("active");

        const cartCount = document.getElementById("cart-count");
        if (cartCount) cartCount.textContent = "0";
      }, 1500);
    } catch (error) {
      console.error("Error placing order:", error);
      showToast("Error placing order. Please try again.", "error", 4000);

      placeOrderBtn.disabled = false;
      placeOrderBtn.innerHTML = originalHTML;
    }
  }, 1500);
}

// ===========================
// SUCCESS MODAL FUNCTIONS
// ===========================

function trackOrder() {
  const orderId = sessionStorage.getItem("lastOrderId");

  if (!orderId) {
    alert("Order ID not found");
    return;
  }

  console.log("Tracking order:", orderId);
  showToast("Opening order tracking...", "info", 2000);

  // Redirect to track order page
  setTimeout(() => {
    window.location.href = `track-order.html?orderId=${orderId}`;
  }, 500);
}

function continueShopping() {
  showToast("Thank you for your order! 🎉", "success", 2000);

  setTimeout(() => {
    window.location.href = "index.html";
  }, 1000);
}

// ===========================
// CARD NUMBER FORMATTING
// ===========================

document.getElementById("cardNumber")?.addEventListener("input", function (e) {
  let value = e.target.value.replace(/\s/g, "");
  let formattedValue = value.match(/.{1,4}/g)?.join(" ") || value;
  e.target.value = formattedValue;
});

document.getElementById("expiryDate")?.addEventListener("input", function (e) {
  let value = e.target.value.replace(/\D/g, "");
  if (value.length >= 2) {
    value = value.slice(0, 2) + "/" + value.slice(2, 4);
  }
  e.target.value = value;
});

document.getElementById("cvv")?.addEventListener("input", function (e) {
  e.target.value = e.target.value.replace(/\D/g, "");
});
