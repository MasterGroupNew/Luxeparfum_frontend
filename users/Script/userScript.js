document.addEventListener('DOMContentLoaded', async () => {

  // =====================
    // Mobile menu toggle
    // =====================
    const mobileBtn = document.getElementById('mobile-menu-btn');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) mobileMenu.classList.toggle('hidden');
        });
    }
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

    // Système de cache pour les images
    const imageCache = new Map();

    async function loadImageWithCache(url) {
      if (imageCache.has(url)) {
        return imageCache.get(url);
      }

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Image non trouvée');
        imageCache.set(url, url);
        return url;
      } catch (error) {
        console.warn(`Erreur chargement image: ${url}`, error);
        return 'https://via.placeholder.com/300x300?text=Image+Non+Disponible';
      }
    }

    // Chargement et affichage des produits avec gestion des images
    Promise.all(produits.map(async (prod) => {
      const getImageFileName = (path) => {
        if (!path) return null;
        return path.split('/').pop()?.split('\\').pop();
      };


      let imageUrl;

      if (prod.imagePath) {
        // Utiliser directement l'URL Cloudinary stockée dans la DB
        imageUrl = await loadImageWithCache(prod.imagePath);
      } else {
        // Placeholder si pas d'image
        imageUrl = 'https://via.placeholder.com/300x300?text=Image+Non+Disponible';
      }


      return `
        <div class="product-card border p-4 rounded shadow-sm">
          <img src="${imageUrl}" 
               alt="${prod.nom}" 
               class="w-full h-48 object-cover rounded"
               onerror="this.onerror=null; this.src='https://via.placeholder.com/300x300?text=Image+Non+Disponible';">
          <h3 class="mt-2 font-semibold text-lg">${prod.nom}</h3>
          <p class="text-sm text-gray-500">${prod.description || ''}</p>
          <p class="font-bold text-primary mt-1">${prod.prix.toFixed(2)} FCFA</p>
          <button onclick="checkAuthAndAddToCart('${prod.id}', '${prod.nom}', ${prod.prix}, '${imageUrl}')" 
                  class="mt-2 bg-blue-600 text-white px-4 py-2 rounded">
            Ajouter au panier
          </button>
        </div>
      `;
    })).then(cards => {
      productContainer.innerHTML = cards.join('');
    }).catch(error => {
      console.error('Erreur affichage produits:', error);
      productContainer.innerHTML = `
        <div class="text-center py-8">
          <p class="text-red-500">Erreur d'affichage des produits</p>
        </div>`;
    });
  }

  // Ajout de la fonction de vérification au niveau global
  window.checkAuthAndAddToCart = function (id, nom, prix, image) {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Veuillez vous connecter pour ajouter des articles au panier');
      window.location.href = '../utils/login.html';
      return;
    }

    // Si connecté, on ajoute au panier
    const exist = cart.find(item => item.id === id);
    if (exist) {
      exist.quantity += 1;
    } else {
      cart.push({ id, name: nom, price: prix, image, quantity: 1 });
    }

    saveCart();
    updateCartUI();

    // Feedback visuel
    alert('Produit ajouté au panier !');
  };

  // Appel de la fonction
  await fetchAndDisplayProducts();

  // Init panier
  updateCartUI();
});
