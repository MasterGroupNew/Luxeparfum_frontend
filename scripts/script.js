document.addEventListener("DOMContentLoaded", () => {
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

    // =====================
    // Search bar toggle
    // =====================
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const searchBar = document.getElementById('search-bar');
            if (searchBar) searchBar.classList.toggle('hidden');
        });
    }

    // =====================
    // Panier
    // =====================
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function openCartSidebar() {
        const sidebar = document.getElementById('cart-sidebar');
        const overlay = document.getElementById('cart-overlay');
        if (sidebar) sidebar.classList.remove('translate-x-full');
        if (overlay) overlay.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    }

    function closeCart() {
        const sidebar = document.getElementById('cart-sidebar');
        const overlay = document.getElementById('cart-overlay');
        if (sidebar) sidebar.classList.add('translate-x-full');
        if (overlay) overlay.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    }

    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) cartBtn.addEventListener('click', openCartSidebar);

    const closeCartBtn = document.getElementById('close-cart');
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);

    const cartOverlay = document.getElementById('cart-overlay');
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    // =====================
    // Récupérer les produits depuis l'API
    // =====================
    async function fetchProduits() {
        try {
            const response = await fetch('https://luxeparfum-backend.onrender.com/api/products/get_product');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors du chargement des produits');
            }
            const produits = await response.json();
            displayProduits(produits);
        } catch (err) {
            console.error('Erreur détaillée:', err);
            const container = document.getElementById('products-container');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <p class="text-red-500">Impossible de charger les produits</p>
                        <p class="text-gray-500 text-sm mt-2">${err.message}</p>
                    </div>`;
            }
        }
    }

    // =====================
    // Afficher les produits
    // =====================
    function displayProduits(produits) {
        const container = document.getElementById('products-container');
        if (!container) return;

        // Cache pour les images
        const imageCache = new Map();

        // Fonction pour charger une image avec cache
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

        // Fonction améliorée pour obtenir l'URL de l'image
        /*async function getImageUrl(product) {
            if (!product.imagePath) {
                return 'https://via.placeholder.com/300x300?text=Image+Non+Disponible';
            }

            const fileName = product.imagePath.split('/').pop()?.split('\\').pop();
            if (!fileName) {
                return 'https://via.placeholder.com/300x300?text=Image+Non+Disponible';
            }

            const imageUrl = `https://luxeparfum-backend.onrender.com/uploads/${fileName}`;
            return await loadImageWithCache(imageUrl);
        }*/
        // Fonction améliorée pour obtenir l'URL de l'image
        async function getImageUrl(product) {
            // Si aucune image, renvoyer un placeholder
            if (!product.imagePath) {
                return 'https://via.placeholder.com/300x300?text=Image+Non+Disponible';
            }

            // Utiliser directement l'URL Cloudinary stockée dans la DB
            const imageUrl = product.imagePath;

            // Si tu as une fonction pour précharger/cacher l'image
            return await loadImageWithCache(imageUrl);
        }

        // Affichage des produits avec gestion asynchrone des images
        Promise.all(produits.map(async (p) => {
            const imgUrl = await getImageUrl(p);
            const categoryName = p.categorie?.nom || 'Non catégorisé';

            return `
            <div class="parfum-card bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer transition p-4"
                data-id="${p.id}"
                data-name="${p.nom}"
                data-price="${p.prix}"
                data-category="${categoryName}"
                data-description="${p.description}"
                data-image="${imgUrl}">
                <div class="relative h-64 overflow-hidden">
                    <img src="${imgUrl}" 
                         alt="${p.nom}" 
                         class="w-full h-full object-cover parfum-image"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/300x300?text=Image+Non+Disponible';">
                </div>
                <h3 class="font-bold text-gray-800 mt-2">${p.nom}</h3>
                <p class="text-sm text-gray-500">${categoryName}</p>
                <p class="text-gray-600 text-sm mt-1">${p.description}</p>
                <div class="mt-2 flex justify-between items-center">
                    <span class="font-bold text-gray-800">${p.prix.toFixed(2)} FCFA</span>
                    <button class="add-to-cart bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-full text-sm transition"
                        data-id="${p.id}" data-name="${p.nom}" data-price="${p.prix}" data-image="${imgUrl}">
                        Ajouter
                    </button>
                </div>
            </div>`;
        })).then(cards => {
            container.innerHTML = cards.join('');
            attachAddToCartEvents();
            attachProductModalEvents();
        }).catch(error => {
            console.error('Erreur affichage produits:', error);
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-500">Erreur d'affichage des produits</p>
                </div>`;
        });
    }

    // =====================
    // Ajouter au panier
    // =====================
    function attachAddToCartEvents() {
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const name = btn.dataset.name;
                const price = parseFloat(btn.dataset.price);
                const image = btn.dataset.image;

                const exist = cart.find(item => item.id === id);
                if (exist) exist.quantity += 1;
                else cart.push({ id, name, price, image, quantity: 1 });

                saveCart();
                updateCartUI();
                openCartSidebar();

                btn.innerHTML = '<i class="fas fa-check mr-1"></i> Ajouté';
                btn.classList.replace('bg-purple-600', 'bg-green-500');
                setTimeout(() => {
                    btn.innerHTML = 'Ajouter';
                    btn.classList.replace('bg-green-500', 'bg-purple-600');
                }, 1000);
            });
        });
    }

    // =====================
    // Mettre à jour le panier
    // =====================
    function updateCartUI() {
        const itemsContainer = document.getElementById('cart-items');
        const cartCount = document.getElementById('cart-count');
        const cartSubtotal = document.getElementById('cart-subtotal');
        const cartTotal = document.getElementById('cart-total');

        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

        if (cartCount) cartCount.textContent = totalItems;
        if (cartSubtotal) cartSubtotal.textContent = subtotal.toFixed(2) + ' FCFA';
        if (cartTotal) cartTotal.textContent = subtotal.toFixed(2) + ' FCFA';

        if (itemsContainer) {
            if (!cart.length) {
                itemsContainer.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <p>Votre panier est vide</p>
                    </div>`;
                return;
            }

            itemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item flex items-start border-b border-gray-100 pb-4">
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
                    <button class="remove-item ml-2" data-id="${item.id}">x</button>
                </div>
            `).join('');
        }

        // Re-attacher les events
        document.querySelectorAll('.remove-item').forEach(btn =>
            btn.addEventListener('click', () => {
                cart = cart.filter(item => item.id !== btn.dataset.id);
                saveCart();
                updateCartUI();
            })
        );
        document.querySelectorAll('.decrease-quantity').forEach(btn =>
            btn.addEventListener('click', () => {
                const item = cart.find(i => i.id === btn.dataset.id);
                if (item.quantity > 1) item.quantity -= 1;
                else cart = cart.filter(i => i.id !== btn.dataset.id);
                saveCart();
                updateCartUI();
            })
        );
        document.querySelectorAll('.increase-quantity').forEach(btn =>
            btn.addEventListener('click', () => {
                const item = cart.find(i => i.id === btn.dataset.id);
                item.quantity += 1;
                saveCart();
                updateCartUI();
            })
        );
    }

    // =====================
    // Checkout
    // =====================
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (!cart.length) {
                alert('Votre panier est vide');
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                alert('Veuillez vous connecter pour passer commande');
                window.location.href = './utils/login.html';
                return;
            }

            // Redirection vers la page de checkout si authentifié
            window.location.href = '../users/checkout.html';
        });
    }

    // =====================
    // Product modal
    // =====================
    function attachProductModalEvents() {
        document.querySelectorAll('.parfum-card').forEach(card => {
            card.addEventListener('click', () => {
                const modal = document.getElementById('product-modal');
                if (!modal) return;

                const modalImage = document.getElementById('modal-image');
                const modalName = document.getElementById('modal-name');
                const modalCategory = document.getElementById('modal-category');
                const modalPrice = document.getElementById('modal-price');
                const modalDescription = document.getElementById('modal-description');

                if (modalImage) modalImage.src = card.dataset.image;
                if (modalName) modalName.textContent = card.dataset.name;
                if (modalCategory) modalCategory.textContent = card.dataset.category;
                if (modalPrice) modalPrice.textContent = card.dataset.price + ' FCFA';
                if (modalDescription) modalDescription.textContent = card.dataset.description;

                modal.classList.remove('hidden');
            });
        });

        const closeBtn = document.getElementById('close-product-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const modal = document.getElementById('product-modal');
                if (modal) modal.classList.add('hidden');
            });
        }
    }

    // =====================
    // Au chargement de la page
    // =====================
    fetchProduits();
    updateCartUI();
});
