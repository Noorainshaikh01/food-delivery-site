// ===========================
// TRACK ORDER SCRIPT
// ===========================

document.addEventListener("DOMContentLoaded", function () {
  loadOrderDetails();
  updateCartCount();

  // Simulate order progress
  simulateOrderProgress();
});

function loadOrderDetails() {
  // Get order ID from URL or session
  const urlParams = new URLSearchParams(window.location.search);
  let orderId =
    urlParams.get("orderId") || sessionStorage.getItem("lastOrderId");

  if (!orderId) {
    alert("No order found");
    window.location.href = "index.html";
    return;
  }

  // Try to get order from localStorage
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  const order = orders.find((o) => o.orderId === orderId);

  if (!order) {
    alert("Order not found");
    window.location.href = "index.html";
    return;
  }

  displayOrderDetails(order);
}

function displayOrderDetails(order) {
  // Display order ID
  document.getElementById("order-id-text").textContent = order.orderId;

  // Display times
  const orderDate = new Date(order.orderDate);
  const estimatedDelivery = new Date(order.estimatedDelivery);

  document.getElementById("order-date").textContent = orderDate.toLocaleString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  document.getElementById("estimated-time").textContent =
    estimatedDelivery.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  document.getElementById("time-confirmed").textContent =
    orderDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // Display payment method
  const paymentMethods = {
    cod: "Cash on Delivery",
    upi: "UPI Payment",
    card: "Card Payment",
    netbanking: "Net Banking",
  };
  document.getElementById("payment-method").textContent =
    paymentMethods[order.paymentMethod] || order.paymentMethod;

  // Display items
  const itemsList = document.getElementById("items-list");
  itemsList.innerHTML = order.items
    .map(
      (item) => `
    <div class="order-item-row">
      <span>${item.name} x ${item.quantity}</span>
      <span>₹${item.price * item.quantity}</span>
    </div>
  `
    )
    .join("");

  // Display prices
  document.getElementById("subtotal").textContent = `₹${order.subtotal}`;
  document.getElementById("delivery-fee").textContent =
    order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee}`;
  document.getElementById("total").textContent = `₹${order.total}`;

  // Display address
  const address = order.address;
  document.getElementById("delivery-address").innerHTML = `
    <strong>${address.fullName}</strong> | ${address.phone}<br>
    ${address.address}${address.landmark ? ", " + address.landmark : ""}<br>
    ${address.city}, ${address.state} - ${address.pincode}
  `;
}

function simulateOrderProgress() {
  // Simulate order progress over time
  setTimeout(() => {
    updateStatus(1, "completed");
  }, 2000);

  setTimeout(() => {
    updateStatus(2, "active");
  }, 5000);

  setTimeout(() => {
    updateStatus(2, "completed");
    updateStatus(3, "active");
  }, 30000); // After 30 seconds, show "Out for Delivery"
}

function updateStatus(index, status) {
  const items = document.querySelectorAll(".timeline-item");
  if (items[index]) {
    items[index].className = `timeline-item ${status}`;
  }
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartCount = document.getElementById("cart-count");
  if (cartCount) {
    cartCount.textContent = totalItems;
  }
}
