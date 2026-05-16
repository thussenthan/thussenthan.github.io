"use strict";

// element toggle function
const elementToggleFunc = function (elem) {
  elem.classList.toggle("active");
};

// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function () {
  elementToggleFunc(sidebar);
  this.classList.toggle("active");
  const span = this.querySelector("span");
  const icon = this.querySelector("ion-icon");
  if (sidebar.classList.contains("active")) {
    span.textContent = "Hide Contacts";
    icon.setAttribute("name", "chevron-up");
  } else {
    span.textContent = "Show Contacts";
    icon.setAttribute("name", "chevron-down");
  }
  this.blur();
});

// auto-toggle sidebar based on window width
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");

  // Toggle “active” based on window width
  function adjustLayout() {
    const isCompact = document.documentElement.clientWidth < 1230;
    sidebar.classList.toggle("active", isCompact);
    // sync toggle button label, icon, and active class with sidebar state
    const span = sidebarBtn.querySelector("span");
    const icon = sidebarBtn.querySelector("ion-icon");
    if (sidebar.classList.contains("active")) {
      span.textContent = "Hide Contacts";
      icon.setAttribute("name", "chevron-up");
      sidebarBtn.classList.add("active");
    } else {
      span.textContent = "Show Contacts";
      icon.setAttribute("name", "chevron-down");
      sidebarBtn.classList.remove("active");
    }
  }

  // Simple debounce helper
  function debounce(fn, wait = 100) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  }

  // Run once on load…
  adjustLayout();
  // …and on resize (debounced)
  window.addEventListener("resize", debounce(adjustLayout));
});

// contact form variables
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");
const successMessage = document.getElementById("success-message");
const errorMessage = document.getElementById("error-message");

// add event to all form input field
for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function () {
    // check form validation
    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }
  });
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  if (!form.checkValidity()) return;
  const formData = new FormData(form);
  try {
    const response = await fetch(form.action, {
      method: form.method,
      body: formData,
      headers: { Accept: "application/json" },
    });
    if (response.ok) {
      successMessage.style.display = "block";
      errorMessage.style.display = "none";
      form.reset();
      formBtn.setAttribute("disabled", "");
      setTimeout(() => {
        successMessage.style.display = "none";
      }, 3000);
    } else {
      errorMessage.style.display = "block";
      successMessage.style.display = "none";
      setTimeout(() => {
        errorMessage.style.display = "none";
      }, 3000);
    }
  } catch (error) {
    errorMessage.style.display = "block";
    successMessage.style.display = "none";
    setTimeout(() => {
      errorMessage.style.display = "none";
    }, 3000);
  }
});

// mouse-reactive shine for cards and icon-boxes
function addShineEffect(selector) {
  document.querySelectorAll(selector).forEach(function (el) {
    el.addEventListener("mousemove", function (e) {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--mouse-x", x + "%");
      el.style.setProperty("--mouse-y", y + "%");
    });
  });
}

addShineEffect(".service-item");
addShineEffect(".icon-box");
addShineEffect(".navbar-link");

function syncSidebarHeight() {
  const measuredSidebar = document.querySelector(".sidebar");
  if (!measuredSidebar) return;

  document.documentElement.style.setProperty(
    "--sidebar-current-height",
    `${Math.round(measuredSidebar.getBoundingClientRect().height)}px`,
  );
}

syncSidebarHeight();
window.addEventListener("resize", syncSidebarHeight);

// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");
let gameScriptPromise = null;

function loadGameScript() {
  if (window.initArrowsGame) {
    return Promise.resolve();
  }

  if (!gameScriptPromise) {
    gameScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        'script[data-arrows-game-script="true"]',
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), {
          once: true,
        });
        existingScript.addEventListener("error", () => reject(new Error("Failed to load game script")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.src = "./src/js/arrows-game.js?v=20260523b";
      script.defer = true;
      script.dataset.arrowsGameScript = "true";
      script.addEventListener(
        "load",
        () => resolve(),
        { once: true },
      );
      script.addEventListener(
        "error",
        () => reject(new Error("Failed to load game script")),
        { once: true },
      );
      document.head.appendChild(script);
    }).catch((error) => {
      gameScriptPromise = null;
      throw error;
    });
  }

  return gameScriptPromise;
}

// update nav click handler to trim text and use distinct index variable
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    const targetPage = this.textContent.trim().toLowerCase();
    if (targetPage === "game") {
      document.body.classList.add("game-active");
    } else {
      document.body.classList.remove("game-active");
    }

    for (let j = 0; j < pages.length; j++) {
      if (targetPage === pages[j].dataset.page) {
        pages[j].classList.add("active");
        navigationLinks[j].classList.add("active");
        window.scrollTo(0, 0);
      } else {
        pages[j].classList.remove("active");
        navigationLinks[j].classList.remove("active");
      }
    }

    if (targetPage === "game") {
      syncSidebarHeight();
      loadGameScript()
        .then(() => {
          if (typeof window.initArrowsGame === "function") {
            window.initArrowsGame();
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }

    document.dispatchEvent(
      new CustomEvent("pagechange", {
        detail: { page: targetPage },
      }),
    );
  });
}

const activePage = document.querySelector("[data-page].active");
if (activePage) {
  document.dispatchEvent(
    new CustomEvent("pagechange", {
      detail: { page: activePage.dataset.page },
    }),
  );
}
