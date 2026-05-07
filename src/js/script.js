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

// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

// update nav click handler to trim text and use distinct index variable
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    const targetPage = this.textContent.trim().toLowerCase();
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
  });
}
