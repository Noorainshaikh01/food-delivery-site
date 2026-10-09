// ===========================
// ADVANCED ADMIN DASHBOARD
// FINAL COMPLETE VERSION
// ===========================

let ordersListener = null;
let usersListener = null;
let dishes = [];

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener("DOMContentLoaded", function () {
  const isAdmin = sessionStorage.getItem("isAdmin");
  const adminEmail = sessionStorage.getItem("adminEmail");

  if (!isAdmin || isAdmin !== "true" || !adminEmail) {
    window.location.href = "admin-login.html";
    return;
  }

  console.log("✓ Admin authenticated:", adminEmail);
  updateAdminInfo(adminEmail);
  initializeDashboard();
  loadDishes();

  // Auto-refresh every 10 seconds
  setInterval(() => {
    if (!ordersListener) {
      loadDashboardData();
    }
  }, 10000);
});

function updateAdminInfo(email) {
  const headerTitle = document.querySelector(".header h1");
  if (headerTitle) {
    headerTitle.innerHTML = `
      Admin Dashboard 
      <span style="font-size: 0.5em; color: #666; font-weight: normal;">
        | ${email} | 
        <span id="last-updated" style="color: #999;"></span>
      </span>
    `;
  }
  updateLastRefreshTime();
}

function updateLastRefreshTime() {
  const lastUpdated = document.getElementById("last-updated");
  if (lastUpdated) {
    const now = new Date();
    lastUpdated.textContent = `Updated: ${now.toLocaleTimeString("en-IN")}`;
  }
}

// ===========================
// INITIALIZE DASHBOARD
// ===========================

async function initializeDashboard() {
  console.log("Initializing dashboard...");

  try {
    if (typeof firebase !== "undefined" && firebase.firestore) {
      console.log("Firebase available - Setting up real-time listeners");
      setupFirebaseListeners();
    } else {
      console.log("Firebase not available - Using localStorage");
      loadDashboardData();
    }
  } catch (error) {
    console.error("Error initializing dashboard:", error);
    loadDashboardData();
  }
}

// ===========================
// FIREBASE REAL-TIME LISTENERS
// ===========================

function setupFirebaseListeners() {
  const db = firebase.firestore();

  ordersListener = db
    .collection("orders")
    .orderBy("orderDate", "desc")
    .onSnapshot(
      (snapshot) => {
        console.log("📦 Orders updated from Firebase");
        const orders = [];
        snapshot.forEach((doc) => {
          orders.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        localStorage.setItem("orders", JSON.stringify(orders));

        displayRecentOrders(orders.slice(0, 5));
        displayAllOrders(orders);
        updateStats(orders);
        loadUsersFromOrders(orders);
        updateLastRefreshTime();
      },
      (error) => {
        console.error("Firebase orders listener error:", error);
        loadDashboardData();
      }
    );

  console.log("✓ Real-time Firebase listeners activated");
}

// ===========================
// LOAD DATA (FALLBACK)
// ===========================

function loadDashboardData() {
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  displayRecentOrders(orders.slice(0, 5));
  displayAllOrders(orders);
  updateStats(orders);
  loadUsersFromOrders(orders);
  updateLastRefreshTime();
}

// ===========================
// DISPLAY RECENT ORDERS
// ===========================

function displayRecentOrders(orders) {
  const tbody = document.getElementById("recent-orders-tbody");
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2em; color: #999;">
          <i class="fas fa-inbox" style="font-size: 3em; margin-bottom: 0.5em; display: block;"></i>
          No orders yet
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = orders
    .map((order) => {
      const orderData = JSON.stringify(order)
        .replace(/'/g, "&apos;")
        .replace(/"/g, "&quot;");
      return `
      <tr style="animation: fadeIn 0.3s ease;">
        <td><strong style="color: #667eea;">${order.orderId}</strong></td>
        <td>
          <i class="fas fa-user-circle" style="color: #999; margin-right: 0.3em;"></i>
          ${order.userName}
        </td>
        <td>
          <div style="text-align: center;">
            <span style="background: #f0f0f0; padding: 0.5em 0.8em; border-radius: 20px; font-weight: bold;">
              ${order.items.length}
            </span>
          </div>
        </td>
        <td><strong style="color: #388e3c;">₹${order.total}</strong></td>
        <td><span class="status-badge status-confirmed">${
          order.status
        }</span></td>
        <td>
          <div style="font-size: 0.85em;">
            <i class="fas fa-clock" style="color: #999; margin-right: 0.3em;"></i>
            ${formatDateTimeShort(order.orderDate)}
          </div>
        </td>
        <td>
          <button class="btn btn-view" onclick='viewOrder(${orderData})'>
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `;
    })
    .join("");
}



// ===========================
// DISPLAY ALL ORDERS
// ===========================

function displayAllOrders(orders) {
  const tbody = document.getElementById("all-orders-tbody");
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2em; color: #999;">
          <i class="fas fa-inbox" style="font-size: 3em; margin-bottom: 0.5em; display: block;"></i>
          No orders found
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = orders
    .map((order) => {
      const orderData = JSON.stringify(order)
        .replace(/'/g, "&apos;")
        .replace(/"/g, "&quot;");
      const paymentMethodDisplay = getPaymentMethodDisplay(order.paymentMethod);

      return `
      <tr style="animation: fadeIn 0.3s ease;">
        <td><strong style="color: #667eea;">${order.orderId}</strong></td>
        <td>
          <div style="display: flex; flex-direction: column;">
            <strong>${order.userName}</strong>
            <small style="color: #999;">${order.userEmail || "N/A"}</small>
          </div>
        </td>
        <td>
          <i class="fas fa-phone" style="color: #999; margin-right: 0.3em;"></i>
          ${order.address.phone}
        </td>
        <td>
          <div style="text-align: center;">
            <span style="background: #f0f0f0; padding: 0.5em 0.8em; border-radius: 20px; font-weight: bold;">
              ${order.items.length}
            </span>
          </div>
        </td>
        <td><strong style="color: #388e3c; font-size: 1.1em;">₹${
          order.total
        }</strong></td>
        <td>
          <div style="text-align: center;">
            <span style="background: #e3f2fd; color: #1976d2; padding: 0.5em 0.8em; border-radius: 20px; font-weight: 600; font-size: 0.9em; white-space: nowrap;">
              ${paymentMethodDisplay}
            </span>
          </div>
        </td>
        <td>
          <span class="status-badge status-confirmed">${order.status}</span>
        </td>
        <td>
          <div style="font-size: 0.85em; line-height: 1.4;">
            ${formatDateTimeShort(order.orderDate)}
          </div>
        </td>
        <td>
          <button class="btn btn-view" onclick='viewOrder(${orderData})'>
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `;
    })
    .join("");
}

// ===========================
// LOAD USERS FROM ORDERS
// ===========================

function loadUsersFromOrders(orders) {
  const usersMap = new Map();

  orders.forEach((order) => {
    const userId = order.userId || order.userEmail || order.userName;

    if (!usersMap.has(userId)) {
      usersMap.set(userId, {
        name: order.userName,
        email: order.userEmail || "N/A",
        phone: order.address.phone,
        city: order.address.city,
        joinedDate: order.orderDate,
        totalOrders: 1,
        totalSpent: order.total,
        userId: userId,
      });
    } else {
      const user = usersMap.get(userId);
      user.totalOrders += 1;
      user.totalSpent += order.total;
    }
  });

  const usersArray = Array.from(usersMap.values());
  usersArray.sort((a, b) => b.totalSpent - a.totalSpent);

  displayUsers(usersArray);
}

// ===========================
// DISPLAY USERS - FIXED
// ===========================

function displayUsers(users) {
  const tbody = document.getElementById("users-tbody");
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2em; color: #999;">
          <i class="fas fa-users" style="font-size: 3em; margin-bottom: 0.5em; display: block;"></i>
          No users found
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = users
    .map(
      (user, index) => `
    <tr style="animation: fadeIn 0.3s ease; animation-delay: ${index * 0.05}s;">
      <td>
        <div style="display: flex; align-items: center; gap: 0.5em;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
            ${user.name.charAt(0).toUpperCase()}
          </div>
          <strong>${user.name}</strong>
        </div>
      </td>
      <td>
        <i class="fas fa-envelope" style="color: #999; margin-right: 0.3em;"></i>
        ${user.email}
      </td>
      <td>
        <i class="fas fa-phone" style="color: #999; margin-right: 0.3em;"></i>
        ${user.phone}
      </td>
      <td>
        <i class="fas fa-calendar" style="color: #999; margin-right: 0.3em;"></i>
        ${formatDate(user.joinedDate)}
      </td>
      <td>
        <div style="text-align: center;">
          <span style="background: #e3f2fd; color: #1976d2; padding: 0.5em 1em; border-radius: 20px; font-weight: bold; font-size: 1.1em;">
            ${user.totalOrders}
          </span>
        </div>
      </td>
      <td>
        <strong style="color: #388e3c; font-size: 1.2em;">₹${user.totalSpent.toFixed(
          2
        )}</strong>
      </td>
      <td>
        <button class="btn btn-delete" onclick="deleteUser('${user.userId}', '${
        user.name
      }')">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `
    )
    .join("");
}

// ===========================
// UPDATE STATISTICS
// ===========================

function updateStats(orders) {
  const totalOrdersEl = document.getElementById("total-orders");
  if (totalOrdersEl) {
    animateNumber(totalOrdersEl, orders.length);
  }

  const totalRevenueEl = document.getElementById("total-revenue");
  if (totalRevenueEl) {
    const revenue = orders.reduce((sum, order) => sum + order.total, 0);
    totalRevenueEl.textContent = `₹${revenue.toFixed(2)}`;
  }

  const totalUsersEl = document.getElementById("total-users");
  if (totalUsersEl) {
    const uniqueUsers = new Set(
      orders.map((order) => order.userId || order.userEmail || order.userName)
    ).size;
    animateNumber(totalUsersEl, uniqueUsers);
  }

  const pendingOrdersEl = document.getElementById("pending-orders");
  if (pendingOrdersEl) {
    const pending = orders.filter(
      (order) => order.status === "Pending" || order.status === "Confirmed"
    ).length;
    animateNumber(pendingOrdersEl, pending);
  }

  const totalDishesEl = document.getElementById("total-dishes");
  if (totalDishesEl) {
    totalDishesEl.textContent = dishes.length;
  }
}

function animateNumber(element, target) {
  const current = parseInt(element.textContent) || 0;
  if (current === target) return;

  const duration = 500;
  const steps = 20;
  const increment = (target - current) / steps;
  let step = 0;

  const timer = setInterval(() => {
    step++;
    const value = Math.round(current + increment * step);
    element.textContent = value;

    if (step >= steps) {
      element.textContent = target;
      clearInterval(timer);
    }
  }, duration / steps);
}

// ===========================
// VIEW ORDER MODAL
// ===========================

function viewOrder(order) {
  const modal = document.getElementById("order-modal");
  const modalBody = document.getElementById("order-modal-body");

  if (!modal || !modalBody) return;

  const paymentMethodDisplay = getPaymentMethodDisplay(order.paymentMethod);

  modalBody.innerHTML = `
    <div style="display: grid; gap: 1em;">
      <div class="order-detail-row">
        <strong><i class="fas fa-hashtag"></i> Order ID:</strong>
        <span style="color: #667eea; font-weight: 600;">${order.orderId}</span>
      </div>
      <div class="order-detail-row">
        <strong><i class="fas fa-user"></i> Customer:</strong>
        <span>${order.userName}</span>
      </div>
      <div class="order-detail-row">
        <strong><i class="fas fa-envelope"></i> Email:</strong>
        <span>${order.userEmail || "N/A"}</span>
      </div>
      <div class="order-detail-row">
        <strong><i class="fas fa-phone"></i> Phone:</strong>
        <span>${order.address.phone}</span>
      </div>
      <div class="order-detail-row">
        <strong><i class="fas fa-map-marker-alt"></i> Address:</strong>
        <span>${order.address.address}, ${order.address.city}, ${
    order.address.state
  } - ${order.address.pincode}</span>
      </div>
      ${
        order.address.landmark
          ? `
        <div class="order-detail-row">
          <strong><i class="fas fa-map-pin"></i> Landmark:</strong>
          <span>${order.address.landmark}</span>
        </div>
      `
          : ""
      }
      <div class="order-detail-row">
        <strong><i class="fas fa-credit-card"></i> Payment:</strong>
        <span>${paymentMethodDisplay}</span>
      </div>
      <div class="order-detail-row">
        <strong><i class="fas fa-calendar"></i> Order Date:</strong>
        <span>${formatDateTime(order.orderDate)}</span>
      </div>
      <div class="order-detail-row">
        <strong><i class="fas fa-truck"></i> Delivery Time:</strong>
        <span>${formatDateTime(order.estimatedDelivery)}</span>
      </div>
      <div class="order-detail-row">
        <strong><i class="fas fa-info-circle"></i> Status:</strong>
        <span class="status-badge status-confirmed">${order.status}</span>
      </div>
    </div>
    
    <h3 style="margin-top: 1.5em; margin-bottom: 1em; color: #333;">
      <i class="fas fa-shopping-bag"></i> Order Items
    </h3>
    <div class="order-items">
      ${order.items
        .map(
          (item) => `
        <div class="order-item">
          <div>
            <strong>${item.name}</strong><br>
            <small style="color: #999;">Quantity: ${item.quantity} × ₹${
            item.price
          }</small>
          </div>
          <strong style="color: #388e3c;">₹${
            item.price * item.quantity
          }</strong>
        </div>
      `
        )
        .join("")}
    </div>
    
    <div style="margin-top: 1.5em; padding-top: 1em; border-top: 2px solid #f0f0f0;">
      <div class="order-detail-row">
        <strong>Subtotal:</strong>
        <span>₹${order.subtotal}</span>
      </div>
      <div class="order-detail-row">
        <strong>Delivery Fee:</strong>
        <span>${
          order.deliveryFee === 0 ? "FREE" : "₹" + order.deliveryFee
        }</span>
      </div>
      <div class="order-detail-row">
        <strong>Platform Fee:</strong>
        <span>₹${order.platformFee}</span>
      </div>
      <div class="order-detail-row">
        <strong>GST (5%):</strong>
        <span>₹${order.gst}</span>
      </div>
      <div class="order-detail-row" style="font-size: 1.3rem; color: #667eea; padding-top: 0.8em; border-top: 2px solid #e0e0e0;">
       <strong>Total Amount:</strong>
        <strong>₹${order.total}</strong>
      </div>
    </div>
  `;

  modal.classList.add("active");
}

// ===========================
// DISHES MANAGEMENT
// ===========================

function loadDishes() {
  dishes = JSON.parse(localStorage.getItem("dishes") || "[]");
  displayDishes();
}

function displayDishes() {
  const grid = document.getElementById("dishes-grid");
  if (!grid) return;

  if (dishes.length === 0) {
    grid.innerHTML =
      '<p style="text-align: center; color: #999; padding: 2em;">No dishes found. Add your first dish!</p>';
    return;
  }

  grid.innerHTML = dishes
    .map(
      (dish) => `
    <div class="dish-card">
      <img src="${
        dish.image || "https://via.placeholder.com/300x200?text=No+Image"
      }" 
           alt="${dish.name}" 
           class="dish-card-image"
           onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
      <div class="dish-card-content">
        <div class="dish-card-title">${dish.name}</div>
        <div class="dish-card-description">${dish.description}</div>
        <div style="margin: 0.5em 0;">
          <span style="background: #e3f2fd; color: #1976d2; padding: 0.3em 0.8em; border-radius: 20px; font-size: 0.85rem;">
            ${dish.category}
          </span>
        </div>
        <div class="dish-card-footer">
          <div class="dish-price">₹${dish.price}</div>
          <div class="dish-actions">
            <button class="btn btn-edit" onclick="editDish('${dish.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-delete" onclick="deleteDish('${dish.id}', '${
        dish.name
      }')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  updateStats(JSON.parse(localStorage.getItem("orders") || "[]"));
}

function openAddDishModal() {
  document.getElementById("dish-modal-title").innerHTML =
    '<i class="fas fa-plus"></i> Add New Dish';
  document.getElementById("dish-form").reset();
  document.getElementById("dish-id").value = "";
  document.getElementById("dish-modal").classList.add("active");
}

function editDish(dishId) {
  const dish = dishes.find((d) => d.id === dishId);
  if (!dish) return;

  document.getElementById("dish-modal-title").innerHTML =
    '<i class="fas fa-edit"></i> Edit Dish';
  document.getElementById("dish-id").value = dish.id;
  document.getElementById("dish-name").value = dish.name;
  document.getElementById("dish-description").value = dish.description;
  document.getElementById("dish-price").value = dish.price;
  document.getElementById("dish-category").value = dish.category;
  document.getElementById("dish-image").value = dish.image || "";

  document.getElementById("dish-modal").classList.add("active");
}

function saveDish(event) {
  event.preventDefault();

  const dishId = document.getElementById("dish-id").value;
  const dishData = {
    id: dishId || "dish_" + Date.now(),
    name: document.getElementById("dish-name").value,
    description: document.getElementById("dish-description").value,
    price: parseFloat(document.getElementById("dish-price").value),
    category: document.getElementById("dish-category").value,
    image:
      document.getElementById("dish-image").value ||
      "https://via.placeholder.com/300x200?text=No+Image",
  };

  if (dishId) {
    const index = dishes.findIndex((d) => d.id === dishId);
    if (index !== -1) {
      dishes[index] = dishData;
    }
  } else {
    dishes.push(dishData);
  }

  localStorage.setItem("dishes", JSON.stringify(dishes));
  displayDishes();
  closeModal("dish-modal");

  alert(dishId ? "Dish updated successfully!" : "Dish added successfully!");
}

function deleteDish(dishId, dishName) {
  if (confirm(`Are you sure you want to delete "${dishName}"?`)) {
    dishes = dishes.filter((d) => d.id !== dishId);
    localStorage.setItem("dishes", JSON.stringify(dishes));
    displayDishes();
    alert("Dish deleted successfully!");
  }
}

// ===========================
// USER MANAGEMENT
// ===========================

function deleteUser(userId, userName) {
  if (
    confirm(
      `Are you sure you want to delete user "${userName}"?\n\nThis will remove all their order history.`
    )
  ) {
    let orders = JSON.parse(localStorage.getItem("orders") || "[]");
    orders = orders.filter(
      (order) =>
        order.userId !== userId &&
        order.userEmail !== userId &&
        order.userName !== userId
    );
    localStorage.setItem("orders", JSON.stringify(orders));
    loadDashboardData();
    alert("User deleted successfully!");
  }
}

// ===========================
// MODAL FUNCTIONS
// ===========================

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

window.onclick = function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.classList.remove("active");
  }
};

// ===========================
// NAVIGATION
// ===========================

function showSection(sectionName) {
  const section = document.getElementById(sectionName);
  if (!section) return;

  document
    .querySelectorAll(".section")
    .forEach((sec) => sec.classList.remove("active"));
  document
    .querySelectorAll(".sidebar li")
    .forEach((li) => li.classList.remove("active"));

  section.classList.add("active");
  if (event && event.currentTarget) {
    event.currentTarget.classList.add("active");
  }
}

// ===========================
// LOGOUT
// ===========================

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    if (ordersListener) ordersListener();
    if (usersListener) usersListener();

    sessionStorage.clear();
    window.location.href = "admin-login.html";
  }
}

// ===========================
// HELPER FUNCTIONS
// ===========================

// ===========================
// HELPER FUNCTIONS - UPDATED
// ===========================

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  };
  return date.toLocaleDateString('en-IN', options);
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  
  // Format date part
  const day = date.getDate();
  const month = date.toLocaleString('en-IN', { month: 'short' });
  const year = date.getFullYear();
  
  // Format time part
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

function formatDateTimeShort(dateString) {
  const date = new Date(dateString);
  
  // Format: 9 Oct 2025, 09:56 am
  const day = date.getDate();
  const month = date.toLocaleString('en-IN', { month: 'short' });
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = hours.toString().padStart(2, '0');
  
  return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm}`;
}

function getPaymentMethodDisplay(method) {
  const methods = {
    cod: "Cash on Delivery",
    upi: "UPI Payment",
    card: "Card Payment",
    netbanking: "Net Banking",
  };
  return methods[method] || method.toUpperCase();
}


// Add animation styles
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);
