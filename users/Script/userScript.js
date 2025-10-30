document.addEventListener('DOMContentLoaded', async () => {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  function updateCartUI() {
    const itemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartTotal = document.getElementById('cart-total');

    const totalItems = cart.reduce((t, i) => t + i.quantity, 0);
    const subtotal = cart.reduce((t, i) => t + i.price * i.quantity, 0);

    if (cartCount) cartCount.textContent = totalItems;
    if (cartSubtotal) cartSubtotal.textContent = subtotal.toFixed(2) + ' FCFA';
    if (cartTotal) cartTotal.textContent = subtotal.toFixed(2) + ' FCFA';

    saveCart();

    if (!itemsContainer) return;
    if (!cart.length) {
      itemsContainer.innerHTML = `<div class="text-center py-8 text-gray-500">
        <i class="fas fa-shopping-cart text-4xl mb-3 opacity-30"></i>
        <p>Votre panier est vide</p>
      </div>`;
      return;
    }

    itemsContainer.innerHTML = cart.map(item => `
      <div class="flex items-start border-b border-gray-100 pb-4">
          <div class="w-16 h-16 bg-gray-100 rounded overflow-hidden mr-4">
              <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
          </div>
          <div class="flex-grow">
              <h4 class="font-medium text-gray-800">${item.name}</h4>
              <div class="flex justify-between items-center mt-1">
                  <span class="text-gray-600">${item.price.toFixed(2)} FCFA</span>
                  <div class="flex items-center">
                      <button class="decrease-quantity px-2" data-id="${item.id}">-</button>
                      <span class="mx-2">${item.quantity}</span>
                      <button class="increase-quantity px-2" data-id="${item.id}">+</button>
                  </div>
              </div>
          </div>
          <button class="remove-item text-red-500 ml-2" data-id="${item.id}">x</button>
      </div>
    `).join('');

    document.querySelectorAll('.remove-item').forEach(btn =>
      btn.addEventListener('click', () => {
        cart = cart.filter(item => item.id !== btn.dataset.id);
        updateCartUI();
      })
    );

    document.querySelectorAll('.decrease-quantity').forEach(btn =>
      btn.addEventListener('click', () => {
        const item = cart.find(i => i.id === btn.dataset.id);
        if (item.quantity > 1) item.quantity -= 1;
        else cart = cart.filter(i => i.id !== btn.dataset.id);
        updateCartUI();
      })
    );

    document.querySelectorAll('.increase-quantity').forEach(btn =>
      btn.addEventListener('click', () => {
        const item = cart.find(i => i.id === btn.dataset.id);
        if (item) item.quantity += 1;
        updateCartUI();
      })
    );
  }

  // =====================
  // Sync panier → BD
  // =====================
  async function syncCartWithDB() {
    const token = localStorage.getItem('token');
    if (!token || !cart.length) return;

    try {
      await fetch("https://luxeparfum-backend.onrender.com/cart/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ cart })
      });

      console.log("✅ Panier local synchronisé avec la BD");
      localStorage.removeItem("cart");
      cart = [];
    } catch (err) {
      console.error("❌ Erreur synchro panier :", err);
    }
  }

  // =====================
  // Charger panier depuis BD
  // =====================
  async function loadCartFromDB() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch("https://luxeparfum-backend.onrender.com/api/cart/get", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        cart = data.items || [];
        console.log("📦 Panier chargé depuis la BD :", cart);
        updateCartUI();
      }
    } catch (err) {
      console.error("⚠️ Impossible de charger le panier depuis la BD :", err);
    }
  }

  // =====================
  // Vérification login
  // =====================
  const logoutLink = document.getElementById('logout');
  const token = localStorage.getItem('token');

  if (token) {
    logoutLink.textContent = "Déconnexion";
    logoutLink.classList.remove("hidden");
    logoutLink.href = "#";
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("cart");
      window.location.href = "../visiteur.html";
    });

    // 🔥 synchronisation + chargement BD
    await syncCartWithDB();
    await loadCartFromDB();
  } else {
    logoutLink.textContent = "Connexion";
    logoutLink.classList.remove("hidden");
    logoutLink.href = "../utils/login.html";
  }

  // =====================
  // Affichage des produits
  // =====================
  async function fetchAndDisplayProducts() {
    try {
      const response = await fetch("https://luxeparfum-backend.onrender.com/api/products/get_product");
      if (!response.ok) {
        console.error("Erreur lors de la récupération des produits:", response.statusText);
        return;
      }

      const produits = await response.json();
      displayProducts(produits);
    } catch (err) {
      console.error("❌ Erreur fetch produits :", err);
    }
  }

  function displayProducts(produits) {
    const productContainer = document.getElementById("product-list");
    if (!productContainer) return;

    productContainer.innerHTML = produits.map(prod => {
      // Extraction correcte du nom du fichier
      const getImageFileName = (path) => {
        if (!path) return null;
        const parts = path.split('/');
        return parts[parts.length - 1];
      };

      const imageUrl = prod.imagePath
        ? `https://luxeparfum-backend.onrender.com/uploads/${getImageFileName(prod.imagePath)}`
        : 'https://via.placeholder.com/300x300?text=Image+Non+Disponible';

      return `
        <div class="product-card border p-4 rounded shadow-sm">
          <img src="${imageUrl}" alt="${prod.nom}" class="w-full h-48 object-cover rounded">
          <h3 class="mt-2 font-semibold text-lg">${prod.nom}</h3>
          <p class="text-sm text-gray-500">${prod.description || ''}</p>
          <p class="font-bold text-primary mt-1">${prod.prix.toFixed(2)} FCFA</p>
          <button onclick="addToCart('${prod.id}', '${prod.nom}', ${prod.prix}, '${imageUrl}')" 
                  class="mt-2 bg-blue-600 text-white px-4 py-2 rounded">
            Ajouter au panier
          </button>
        </div>
      `;
    }).join('');
  }

  // Appel de la fonction
  await fetchAndDisplayProducts();

  // Init panier
  updateCartUI();
});
