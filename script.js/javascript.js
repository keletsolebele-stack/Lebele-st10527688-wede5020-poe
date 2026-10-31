script.js
// 1. Mobile menu toggle
const toggle = document.querySelector(".nav-toggle");
const navbar = document.querySelector(".navbar");

toggle.addEventListener("click", () => {
  const open = navbar.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});

// 2. Image lightbox
const overlay = document.createElement("div");
overlay.className = "lightbox";
overlay.innerHTML = '<img alt="">';
document.body.appendChild(overlay);
const overlayImg = overlay.querySelector("img");

document.querySelectorAll(".gallery-item img, .location-card img").forEach((img) => {
  img.addEventListener("click", () => {
    overlayImg.src = img.src;
    overlayImg.alt = img.alt;
    overlay.classList.add("show");
  });
});

overlay.addEventListener("click", () => overlay.classList.remove("show"));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") overlay.classList.remove("show");
});

// 3. Fade in sections on scroll
const sections = document.querySelectorAll(".menu-section");
sections.forEach((s) => s.classList.add("fade-in"));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
sections.forEach((s) => observer.observe(s));