document.addEventListener("DOMContentLoaded", function () {

  const modal = document.getElementById("app-cart-modal");
  const overlay = modal.querySelector(".app-cart-overlay");
  const continueBtn = document.getElementById("app-continue-btn");

  const form = document.querySelector('form[action="/cart/add"]');
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(form);

    fetch("/cart/add.js", {
      method: "POST",
      body: formData,
    })
      .then(res => {
        if (!res.ok) throw new Error("Cart add failed");
        return res.json();
      })
      .then(addedItem => {
        return fetch("/cart.js");
      })
      .then(res => res.json())
      .then(cart => {
        console.log('[CartApp] Cart updated:', cart);
        const latestItem = cart.items[cart.items.length - 1];

        updateModal(latestItem);
        updateCartCount(cart.item_count);

        // Only open the custom modal IF we want a fallback. 
        // If we want the theme drawer to handle it, we might skip this.
        // openModal(); 
      })
      .catch(err => {
        console.error("Cart Error:", err);
      });

  });

  function updateModal(item) {
    document.getElementById("app-cart-image").src = item.image;
    document.getElementById("app-cart-title").textContent = item.product_title;
  }

  function updateCartCount(count) {
    const bubbles = document.querySelectorAll('[data-cart-count]');
    bubbles.forEach(el => el.textContent = count);
  }

  function openModal() {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  overlay.addEventListener("click", closeModal);
  continueBtn.addEventListener("click", closeModal);

});