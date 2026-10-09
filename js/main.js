// ===========================
// GLOBAL VARIABLES
// ===========================
let cart = [];
let currentCategory = "all";
let currentPage = 1;
const itemsPerPage = 12;
let filteredFoods = [...foodDatabase];

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

function initializeApp() {
  loadUserCartFromStorage();
  setupEventListeners();
  displayFoods();
  updateCartCount();
}

// Load user-specific cart
function loadUserCartFromStorage() {
  const userId = sessionStorage.getItem("userId") || 
                 sessionStorage.getItem("userEmail") || 
                 "guest";
  const cartKey = `cart_${userId}`;
  cart = JSON.parse(localStorage.getItem(cartKey)) || [];
}

// ===========================
// EVENT LISTENERS SETUP
// ===========================
function setupEventListeners() {
  // Category tabs
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      currentCategory = this.dataset.category;
      currentPage = 1;
      filterAndDisplay();
    });
  });

  // Sort functionality
  document
    .getElementById("sortSelect")
    ?.addEventListener("change", function () {
      sortFoods(this.value);
      displayFoods();
    });

  // Price filter
  document.getElementById("priceFilter")?.addEventListener("change", () => {
    filterAndDisplay();
  });

  // Search functionality
  document.getElementById("navSearchInput")?.addEventListener("input", (e) => {
    searchFoods(e.target.value);
  });

  // Pagination buttons
  document.getElementById("prevBtn")?.addEventListener("click", () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  });
  
  document.getElementById("nextBtn")?.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredFoods.length / itemsPerPage);
    if (currentPage < totalPages) goToPage(currentPage + 1);
  });
}

// ===========================
// FILTER AND DISPLAY FUNCTIONS
// ===========================
function filterAndDisplay() {
  if (currentCategory === "all") {
    filteredFoods = [...foodDatabase];
  } else {
    filteredFoods = foodDatabase.filter(
      (food) => food.category === currentCategory
    );
  }

  const priceFilter = document.getElementById("priceFilter")?.value;
  if (priceFilter && priceFilter !== "all") {
    if (priceFilter === "500+") {
      filteredFoods = filteredFoods.filter((food) => food.price >= 500);
    } else {
      const [min, max] = priceFilter.split("-").map(Number);
      filteredFoods = filteredFoods.filter(
        (food) => food.price >= min && food.price <= max
      );
    }
  }

  currentPage = 1;
  displayFoods();
}

function sortFoods(sortBy) {
  switch (sortBy) {
    case "price-low":
      filteredFoods.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      filteredFoods.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      filteredFoods.sort((a, b) => b.rating - a.rating);
      break;
    default:
      filteredFoods = [...foodDatabase];
  }
}

function searchFoods(query) {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) {
    filteredFoods = [...foodDatabase];
  } else {
    filteredFoods = foodDatabase.filter(
      (food) =>
        food.name.toLowerCase().includes(searchTerm) ||
        food.category.toLowerCase().includes(searchTerm) ||
        food.restaurant.toLowerCase().includes(searchTerm) ||
        (food.description &&
          food.description.toLowerCase().includes(searchTerm))
    );
  }
  currentPage = 1;
  displayFoods();
}

// ===========================
// DISPLAY FOODS
// ===========================
function displayFoods() {
  const foodGrid = document.getElementById("foodGrid");
  const loading = document.getElementById("loading-spinner");

  loading.style.display = "block";
  foodGrid.innerHTML = "";

  setTimeout(() => {
    loading.style.display = "none";

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFoods = filteredFoods.slice(startIndex, endIndex);

    if (paginatedFoods.length === 0) {
      foodGrid.innerHTML =
        '<p style="text-align:center;grid-column:1/-1;padding:3em;">No items found</p>';
      return;
    }

    paginatedFoods.forEach((food) => {
      const card = createFoodCard(food);
      foodGrid.appendChild(card);
    });

    renderPagination();
    updateResultsCount();
  }, 300);
}

// ===========================
// CREATE FOOD CARD
// ===========================
function createFoodCard(food) {
  const card = document.createElement("div");
  card.className = "food-card animated-pop";
  card.onclick = () => viewDetails(food.id);

  card.innerHTML = `
    <img src="${food.image}" alt="${food.name}" loading="lazy" />
    <div class="food-info">
      <h4>${food.name}</h4>
      <p class="restaurant-name"><i class="fas fa-store"></i> ${
        food.restaurant
      }</p>
      <div class="food-badges">
        ${
          food.isVeg
            ? '<span class="badge veg-badge">🟢 Veg</span>'
            : '<span class="badge non-veg-badge">🔴 Non-Veg</span>'
        }
        ${food.isSpicy ? '<span class="badge spicy-badge">🌶️ Spicy</span>' : ""}
      </div>
      <p class="food-description">${
        food.description ? food.description.substring(0, 80) + "..." : ""
      }</p>
      <div class="food-meta">
        <span><i class="fas fa-clock"></i> ${
          food.prepTime || "15-20 mins"
        }</span>
        <span><i class="fas fa-fire"></i> ${food.calories || "N/A"} cal</span>
      </div>
      <span class="food-rating"><i class="fas fa-star"></i> ${
        food.rating
      }</span>
      <p class="price">₹${food.price}</p>
      <div class="card-actions">
        <button class="add-cart-btn" onclick="event.stopPropagation(); addToCart(${
          food.id
        })">
          <i class="fas fa-plus"></i> Add
        </button>
      </div>
    </div>
  `;
  return card;
}

// ===========================
// VIEW DETAILS MODAL
// ===========================
function viewDetails(foodId) {
  const food = foodDatabase.find((f) => f.id === foodId);
  if (!food) return;

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "block";

  modal.innerHTML = `
    <div class="modal-content food-details-modal animated-fadein">
      <span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span>
      <div class="detail-container">
        <img src="${food.image}" alt="${food.name}" class="detail-image" />
        <div class="detail-info">
          <h2>${food.name}</h2>
          <p class="detail-restaurant"><i class="fas fa-store"></i> ${
            food.restaurant
          }</p>
          <div class="food-badges">
            ${
              food.isVeg
                ? '<span class="badge veg-badge">🟢 Vegetarian</span>'
                : '<span class="badge non-veg-badge">🔴 Non-Vegetarian</span>'
            }
            ${
              food.isSpicy
                ? '<span class="badge spicy-badge">🌶️ Spicy</span>'
                : ""
            }
          </div>
          <p class="detail-description">${food.description}</p>
          <div class="detail-specs">
            <div class="spec-item"><i class="fas fa-utensils"></i><strong>Ingredients:</strong><p>${
              food.ingredients || "Various fresh ingredients"
            }</p></div>
            <div class="spec-item"><i class="fas fa-pizza-slice"></i><strong>Serving Size:</strong><p>${
              food.servingSize || "Standard"
            }</p></div>
            <div class="spec-item"><i class="fas fa-fire"></i><strong>Calories:</strong><p>${
              food.calories || "N/A"
            } kcal</p></div>
            <div class="spec-item"><i class="fas fa-clock"></i><strong>Prep Time:</strong><p>${
              food.prepTime || "15-20 mins"
            }</p></div>
            <div class="spec-item"><i class="fas fa-star"></i><strong>Rating:</strong><p>${
              food.rating
            } / 5.0</p></div>
          </div>
          <div class="detail-price">
            <h3>₹${food.price}</h3>
            <button class="add-cart-btn-large" onclick="addToCart(${
              food.id
            }); this.closest('.modal').remove();">
              <i class="fas fa-shopping-cart"></i> Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}

// ===========================
// CART FUNCTIONS
// ===========================
function addToCart(foodId) {
  // Check if user is logged in
  const userName = sessionStorage.getItem("userName");
  if (!userName) {
    if (confirm("Please login to add items to cart. Would you like to login now?")) {
      window.location.href = "login.html";
    }
    return;
  }

  const food = foodDatabase.find((f) => f.id === foodId);
  if (!food) return;

  const existingItem = cart.find((item) => item.id === foodId);
  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 1) + 1;
  } else {
    cart.push({ ...food, quantity: 1 });
  }

  saveCart();
  updateCartCount();
  showNotification(`${food.name} added to cart!`);
  showCartPrompt();
}

function showCartPrompt() {
  const existingPrompt = document.querySelector(".cart-prompt");
  if (existingPrompt) existingPrompt.remove();

  const prompt = document.createElement("div");
  prompt.className = "cart-prompt";
  prompt.innerHTML = `
    <div class="prompt-content">
      <i class="fas fa-check-circle"></i>
      <p>Item added to cart!</p>
      <button onclick="window.location.href='cart.html'" class="view-cart-btn">
        <i class="fas fa-shopping-cart"></i> View Cart
      </button>
      <button onclick="this.parentElement.parentElement.remove()" class="continue-btn">
        Continue Shopping
      </button>
    </div>
  `;
  document.body.appendChild(prompt);

  setTimeout(() => prompt.remove(), 5000);
}

function saveCart() {
  const userId = sessionStorage.getItem("userId") || 
                 sessionStorage.getItem("userEmail") || 
                 "guest";
  const cartKey = `cart_${userId}`;
  localStorage.setItem(cartKey, JSON.stringify(cart));
}

function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartCountElement = document.getElementById("cart-count");
  if (cartCountElement) {
    cartCountElement.textContent = totalItems;
  }
}

// ===========================
// CLICKABLE PAGINATION
// ===========================
function renderPagination() {
  const totalPages = Math.ceil(filteredFoods.length / itemsPerPage);
  const pageNumbersContainer = document.getElementById('pageNumbers');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (!pageNumbersContainer) return;

  pageNumbersContainer.innerHTML = '';
  
  // Update prev/next button states
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage === totalPages;

  const maxVisiblePages = 7;
  let startPage = Math.max(1, currentPage - 3);
  let endPage = Math.min(totalPages, currentPage + 3);

  // Adjust if near beginning or end
  if (currentPage <= 4) {
    endPage = Math.min(maxVisiblePages, totalPages);
  }
  if (currentPage > totalPages - 4) {
    startPage = Math.max(1, totalPages - maxVisiblePages + 1);
  }

  // First page + ellipsis
  if (startPage > 1) {
    addPageButton(1);
    if (startPage > 2) {
      addEllipsis();
    }
  }

  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    addPageButton(i);
  }

  // Ellipsis + last page
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      addEllipsis();
    }
    addPageButton(totalPages);
  }

  function addPageButton(pageNum) {
    const pageBtn = document.createElement('div');
    pageBtn.className = `page-number ${pageNum === currentPage ? 'active' : ''}`;
    pageBtn.textContent = pageNum;
    pageBtn.onclick = () => goToPage(pageNum);
    pageNumbersContainer.appendChild(pageBtn);
  }

  function addEllipsis() {
    const ellipsis = document.createElement('span');
    ellipsis.className = 'page-ellipsis';
    ellipsis.textContent = '...';
    pageNumbersContainer.appendChild(ellipsis);
  }
}

function goToPage(pageNumber) {
  const totalPages = Math.ceil(filteredFoods.length / itemsPerPage);
  if (pageNumber < 1 || pageNumber > totalPages) return;
  
  currentPage = pageNumber;
  displayFoods();
  
  // Smooth scroll to menu
  document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===========================
// UTILITY FUNCTIONS
// ===========================
function updateResultsCount() {
  const resultsCount = document.getElementById("results-count");
  if (resultsCount) {
    resultsCount.textContent = `Showing ${filteredFoods.length} items`;
  }
}

function showNotification(message) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: #4caf50;
    color: white;
    padding: 1em 2em;
    border-radius: 8px;
    z-index: 4000;
    animation: slideIn 0.3s;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = "fadeOut 0.3s";
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Make functions globally accessible
window.addToCart = addToCart;
window.viewDetails = viewDetails;
window.goToPage = goToPage;
