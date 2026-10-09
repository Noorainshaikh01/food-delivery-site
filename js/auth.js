// ===========================
// FIREBASE CONFIGURATION
// ===========================
const firebaseConfig = {
  apiKey: "AIzaSyD9CL6y1_1sRi1t4XIgTeZ6M7j63_EvmZQ",
  authDomain: "food-express-60f2a.firebaseapp.com",
  projectId: "food-express-60f2a",
  storageBucket: "food-express-60f2a.firebasestorage.app",
  messagingSenderId: "368255201191",
  appId: "1:368255201191:web:b7565058f3af519f711082",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===========================
// UTILITY FUNCTIONS
// ===========================

// Toggle Password Visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const icon = input.nextElementSibling?.querySelector("i");
  if (!icon) return;

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

// Password Validation Function
function validatePassword(password) {
  if (password.length < 6) {
    return {
      valid: false,
      message: "Password must be at least 6 characters long",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number",
    };
  }

  return {
    valid: true,
    message: "Password is strong",
  };
}

// ===========================
// AUTHENTICATION FUNCTIONS
// ===========================

// Login Function
document
  .getElementById("loginForm")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email")?.value;
    const password = document.getElementById("loginPassword")?.value;

    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    try {
      const userCredential = await auth.signInWithEmailAndPassword(
        email,
        password
      );
      const user = userCredential.user;

      const userDoc = await db.collection("users").doc(user.uid).get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        const userRole = userData.role;

        sessionStorage.setItem("userRole", userRole);
        sessionStorage.setItem("userName", userData.name);
        sessionStorage.setItem("userEmail", userData.email);
        sessionStorage.setItem("userId", user.uid);

        alert(`Welcome back, ${userData.name}!`);

        if (userRole === "admin") {
          window.location.href = "admin-dashboard.html";
        } else {
          window.location.href = "index.html";
        }
      } else {
        alert("User data not found. Please contact support.");
      }
    } catch (error) {
      console.error("Login error:", error);

      let errorMessage = "Login failed. ";
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage += "No account found with this email.";
          break;
        case "auth/wrong-password":
          errorMessage += "Incorrect password.";
          break;
        case "auth/invalid-email":
          errorMessage += "Invalid email address.";
          break;
        case "auth/user-disabled":
          errorMessage += "This account has been disabled.";
          break;
        default:
          errorMessage += error.message;
      }
      alert(errorMessage);
    }
  });

// Signup Function with Strong Password Validation
document
  .getElementById("signupForm")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("signupUsername")?.value;
    const email = document.getElementById("signupEmail")?.value;
    const phone = document.getElementById("signupPhone")?.value;
    const password = document.getElementById("signupPassword")?.value;

    if (!email || !password || !name) {
      alert("Please fill in all required fields");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      alert(passwordValidation.message);
      return;
    }

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(
        email,
        password
      );
      const user = userCredential.user;

      await user.updateProfile({
        displayName: name,
      });

      await db
        .collection("users")
        .doc(user.uid)
        .set({
          name: name,
          email: email,
          phone: phone || "",
          role: "user",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          isActive: true,
        });

      sessionStorage.setItem("userRole", "user");
      sessionStorage.setItem("userName", name);
      sessionStorage.setItem("userEmail", email);
      sessionStorage.setItem("userId", user.uid);

      alert(`Account created successfully! Welcome ${name}!`);
      window.location.href = "index.html";
    } catch (error) {
      console.error("Signup error:", error);

      let errorMessage = "Signup failed. ";
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage +=
            "This email is already registered. Please login instead.";
          break;
        case "auth/invalid-email":
          errorMessage += "Invalid email address.";
          break;
        case "auth/weak-password":
          errorMessage +=
            "Password is too weak. Must contain uppercase, lowercase, and numbers.";
          break;
        default:
          errorMessage += error.message;
      }
      alert(errorMessage);
    }
  });

// ===========================
// UI UPDATE FUNCTIONS
// ===========================

// Display user info on page load
window.addEventListener("DOMContentLoaded", function () {
  const userName = sessionStorage.getItem("userName");
  const userRole = sessionStorage.getItem("userRole");

  const loginLink = document.getElementById("login-link");
  const signupLink = document.getElementById("signup-link");
  const userInfo = document.getElementById("user-info");
  const logoutButton = document.getElementById("logout-button");
  const userNameElement = document.getElementById("user-name");

  if (userName) {
    // User is logged in - show user info
    if (loginLink) loginLink.style.display = "none";
    if (signupLink) signupLink.style.display = "none";
    if (userInfo) userInfo.style.display = "block";
    if (logoutButton) logoutButton.style.display = "block";

    if (userNameElement) {
      userNameElement.textContent = userName;
    }

    console.log(`User logged in: ${userName} (${userRole})`);
  } else {
    // User is not logged in - show login/signup buttons
    if (loginLink) loginLink.style.display = "block";
    if (signupLink) signupLink.style.display = "block";
    if (userInfo) userInfo.style.display = "none";
    if (logoutButton) logoutButton.style.display = "none";
  }
});

// ===========================
// LOGOUT FUNCTION
// ===========================

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    auth
      .signOut()
      .then(() => {
        sessionStorage.clear();
        alert("Logged out successfully");
        window.location.href = "index.html";
      })
      .catch((error) => {
        console.error("Logout error:", error);
        alert("Error logging out. Please try again.");
      });
  }
}

// ===========================
// AUTH STATE OBSERVER
// ===========================

auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      const userDoc = await db.collection("users").doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log("Authentication State: Logged in");
        console.log("User:", userData.name);
        console.log("Role:", userData.role);
        console.log("Email:", userData.email);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  } else {
    console.log("Authentication State: Logged out");
  }
});

// ===========================
// MODAL FUNCTIONS - FIXED TO ALLOW PAGE NAVIGATION
// ===========================

// Only prevent default if modal exists on page
document.addEventListener("DOMContentLoaded", function () {
  const signinBtn = document.querySelector(".signin-btn");
  const signupBtn = document.querySelector(".signup-btn");

  if (signinBtn) {
    signinBtn.addEventListener("click", function (e) {
      const loginModal = document.getElementById("loginModal");
      // Only open modal if it exists on this page
      if (loginModal) {
        e.preventDefault();
        loginModal.style.display = "block";
      }
      // Otherwise let the link navigate to login.html
    });
  }

  if (signupBtn) {
    signupBtn.addEventListener("click", function (e) {
      const signupModal = document.getElementById("signupModal");
      // Only open modal if it exists on this page
      if (signupModal) {
        e.preventDefault();
        signupModal.style.display = "block";
      }
      // Otherwise let the link navigate to signup.html
    });
  }
});

// Modal close functions (only work if modals exist)
function closeLogin() {
  const loginModal = document.getElementById("loginModal");
  if (loginModal) loginModal.style.display = "none";
}

function closeSignup() {
  const signupModal = document.getElementById("signupModal");
  if (signupModal) signupModal.style.display = "none";
}

function switchToSignup() {
  closeLogin();
  const signupModal = document.getElementById("signupModal");
  if (signupModal) signupModal.style.display = "block";
}

function switchToLogin() {
  closeSignup();
  const loginModal = document.getElementById("loginModal");
  if (loginModal) loginModal.style.display = "block";
}

// Close modal on outside click
window.onclick = function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none";
  }
};
