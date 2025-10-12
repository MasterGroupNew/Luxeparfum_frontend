class SidebarComponent extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    await this.loadStyles();
    this.render();
    this.initEvents();
    await this.loadUserProfile(); // appel après le render
  }

  async loadStyles() {
    try {
      const response = await fetch('../Style/styles.css');
      const styles = await response.text();
      const styleEl = document.createElement('style');
      styleEl.textContent = styles;
      this.appendChild(styleEl);
    } catch (e) {
      console.error('Erreur au chargement du CSS :', e);
    }
  }

  render() {
    this.innerHTML = `
      <div class="sidebar bg-indigo-800 text-white w-64 flex flex-col" style="height: 100%;">
        <!-- Logo -->
        <div class="p-4 flex items-center space-x-2 border-b border-indigo-700">
          <i class="fas fa-spa text-2xl text-pink-300"></i>
          <span class="nav-text text-xl font-bold">Parfumerie Admin</span>
        </div>

        <!-- Profile -->
        <div class="p-4 flex items-center space-x-3 border-b border-indigo-700">
          <img id="profileImage" src="" alt="Admin" class="w-10 h-10 rounded-full">
          <div>
            <p class="font-medium nav-text" id="profileName"></p>
            <p class="text-xs text-indigo-300 nav-text" id="profileEmail"></p>
            <button id="openProfileBtn" class="text-indigo-600 text-xs nav-text">Modifier le profil</button>
          </div>
        </div>

        <!-- Menu -->
        <nav class="flex-1 overflow-y-auto">
          <ul>
            <li>
              <a href="./Dashboard.html" class="flex items-center p-4 space-x-3 hover:bg-indigo-700 bg-indigo-700">
                <i class="fas fa-tachometer-alt"></i>
                <span class="nav-text">Tableau de bord</span>
              </a>
            </li>
            <!-- Produits Dropdown -->
            <li class="relative group">
              <button class="flex items-center p-4 space-x-3 w-full hover:bg-indigo-700 focus:outline-none">
                <i class="fas fa-pump-soap"></i>
                <span class="nav-text">Produits</span>
                <svg class="w-4 h-4 ml-auto transform group-hover:rotate-180 transition-transform duration-200"
                  fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <ul class="absolute left-0 w-full bg-indigo-800 text-white shadow-lg rounded-md hidden group-hover:block z-10">
                <li><a href="./ajouter-produit.html" class="block px-4 py-2 hover:bg-indigo-600">Ajouter produit</a></li>
                <li><a href="./gerer-produits.html" class="block px-4 py-2 hover:bg-indigo-600">Gérer les produits</a></li>
              </ul>
            </li>
            <!-- Catégories Dropdown -->
            <li class="relative group">
              <button class="flex items-center p-4 space-x-3 w-full hover:bg-indigo-700 focus:outline-none">
                <i class="fas fa-tags"></i>
                <span class="nav-text">Catégories</span>
                <svg class="w-4 h-4 ml-auto transform group-hover:rotate-180 transition-transform duration-200"
                  fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <ul class="absolute left-0 w-full bg-indigo-800 text-white shadow-lg rounded-md hidden group-hover:block z-10">
                <li><a href="./ajouter-categorie.html" class="block px-4 py-2 hover:bg-indigo-600">Ajouter catégorie</a></li>
                <li><a href="./gerer-categories.html" class="block px-4 py-2 hover:bg-indigo-600">Gérer les catégories</a></li>
              </ul>
            </li>
            <!-- Autres liens -->
            <li><a href="./commande-list.html" class="flex items-center p-4 space-x-3 hover:bg-indigo-700"><i class="fas fa-shopping-cart"></i><span class="nav-text">Voir toutes les commandes</span></a></li>
            <li><a href="./users-list.html" class="flex items-center p-4 space-x-3 hover:bg-indigo-700"><i class="fas fa-users"></i><span class="nav-text">Voir tous les clients</span></a></li>
            <li><a href="./admin-list.html" class="flex items-center p-4 space-x-3 hover:bg-indigo-700"><i class="fas fa-user-shield"></i><span class="nav-text">Administrateurs</span></a></li>
            <li><a href="./statistic.html" class="flex items-center p-4 space-x-3 hover:bg-indigo-700"><i class="fas fa-chart-line"></i><span class="nav-text">Statistiques</span></a></li>
            <li><a href="./paramtre.html" class="flex items-center p-4 space-x-3 hover:bg-indigo-700"><i class="fas fa-cog"></i><span class="nav-text">Paramètres</span></a></li>
          </ul>
        </nav>

        <!-- Déconnexion -->
        <ul>
          <li>
            <a id="logoutBtn" class="flex items-center p-4 space-x-3 hover:bg-indigo-700 cursor-pointer">
              <i class="fas fa-sign-out-alt"></i>
              <span class="nav-text">Déconnexion</span>
            </a>
          </li>
        </ul>

        <!-- Toggle -->
        <div class="p-4 border-t border-indigo-700">
          <button id="toggleBtn" class="w-full flex items-center space-x-3 text-indigo-200 hover:text-white">
            <i class="fas fa-chevron-left"></i>
            <span class="nav-text">Réduire</span>
          </button>
        </div>
      </div>

      <!-- Modale Profil -->
      <div id="editProfileModal" class="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 hidden">
        <div class="bg-white p-8 rounded-lg w-full max-w-lg transform scale-90 transition-transform">
          <h2 class="text-2xl font-semibold text-purple-600 mb-4">Modifier le Profil</h2>
          <form id="profileForm">
            <div class="flex justify-center mb-4">
              <label for="productImage" class="cursor-pointer w-40 h-40 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border-4 border-purple-500 hover:bg-indigo-200 transition duration-300 relative">
                <i class="fas fa-camera text-3xl" id="cameraIcon"></i>
                <span class="mt-2 text-sm font-medium text-gray-600" id="selectText">Sélectionner une photo</span>
                <input type="file" id="productImage" accept="image/*" class="hidden">
                <img id="imagePreview" src="" alt="Aperçu" class="w-40 h-40 rounded-full object-cover hidden border-4 border-purple-500 absolute top-0 left-0">
              </label>
            </div>
            <div class="mb-4"><label class="block text-sm font-medium text-gray-700">Nom</label><input type="text" id="name" class="mt-1 block w-full px-4 py-2 border rounded-lg focus:ring-indigo-500"></div>
            <div class="mb-4"><label class="block text-sm font-medium text-gray-700">Email</label><input type="email" id="email" class="mt-1 block w-full px-4 py-2 border rounded-lg focus:ring-indigo-500"></div>
            <div class="mb-4"><label class="block text-sm font-medium text-gray-700">Mot de passe</label><input type="password" id="password" placeholder="Nouveau mot de passe" class="mt-1 block w-full px-4 py-2 border rounded-lg focus:ring-indigo-500"></div>
          </form>
          <div class="mt-4 flex justify-between">
            <button id="saveBtn" class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">Enregistrer</button>
            <button id="closeBtn" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Fermer</button>
          </div>
        </div>
      </div>
    `;
  }

  initEvents() {
    this.querySelector('#toggleBtn')?.addEventListener('click', () => this.toggleSidebar());
    this.querySelector('#openProfileBtn')?.addEventListener('click', () => this.openModal());
    this.querySelector('#closeBtn')?.addEventListener('click', () => this.closeModal());
    this.querySelector('#saveBtn')?.addEventListener('click', () => this.saveProfile());
    this.querySelector('#productImage')?.addEventListener('change', (e) => this.previewImage(e));
    this.querySelector('#logoutBtn')?.addEventListener('click', () => this.logout());
  }

  toggleSidebar() {
    const sb = this.querySelector('.sidebar');
    const navs = sb.querySelectorAll('.nav-text');
    sb.classList.toggle('w-20');
    sb.classList.toggle('w-64');
    navs.forEach(t => t.style.display = sb.classList.contains('w-20') ? 'none' : 'inline');
  }

  async loadUserProfile() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://luxeparfum-backend.onrender.com/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Impossible de récupérer le profil');
      const user = await res.json();

      // Sidebar dynamique
      const imgEl = this.querySelector('#profileImage');
      const nameEl = this.querySelector('#profileName');
      const emailEl = this.querySelector('#profileEmail');

      imgEl.src = user.photoUrl || 'https://randomuser.me/api/portraits/women/44.jpg';
      nameEl.textContent = `${user.nom} ${user.prenoms || ''}`;
      emailEl.textContent = user.email;

      // Modale
      this.querySelector('#name').value = user.nom;
      this.querySelector('#email').value = user.email;
      this.querySelector('#password').value = '';
      if (user.photoUrl) {
        const img = this.querySelector('#imagePreview');
        img.src = user.photoUrl;
        img.classList.remove('hidden');
        this.querySelector('#cameraIcon').classList.add('hidden');
        this.querySelector('#selectText').classList.add('hidden');
      }
    } catch (err) {
      console.error(err);
    }
  }

  async saveProfile() {
    try {
      const token = localStorage.getItem('token');
      const name = this.querySelector('#name').value;
      const email = this.querySelector('#email').value;
      const password = this.querySelector('#password').value;

      const res = await fetch('https://luxeparfum-backend.onrender.com/api/auth/updateProfile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nom: name, email, password: password || undefined })
      });

      if (!res.ok) throw new Error('Erreur lors de la mise à jour du profil');

      const data = await res.json();
      alert(data.message);
      await this.loadUserProfile(); // rafraîchit la sidebar
      this.closeModal();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la mise à jour');
    }
  }

  previewImage(e) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = this.querySelector('#imagePreview');
      img.src = ev.target.result;
      img.classList.remove('hidden');
      this.querySelector('#cameraIcon').classList.add('hidden');
      this.querySelector('#selectText').classList.add('hidden');
    };
    reader.readAsDataURL(e.target.files[0]);
  }

  openModal() {
    const m = this.querySelector('#editProfileModal');
    m?.classList.remove('hidden');
    setTimeout(() => m?.querySelector('div')?.classList.remove('scale-90'), 50);
  }

  closeModal() {
    const m = this.querySelector('#editProfileModal');
    m.querySelector('div')?.classList.add('scale-90');
    setTimeout(() => m?.classList.add('hidden'), 200);
  }

  logout() {
    alert("Déconnexion réussie !");
    localStorage.removeItem('token');
    window.location.href = "../visiteur.html";
  }
}

// Déclaration du composant
customElements.define('sidebar-component', SidebarComponent);
