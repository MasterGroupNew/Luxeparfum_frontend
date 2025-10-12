class HeaderComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
    this.loadStyles();
    this.initEvents();
    this.updateNotificationDot(false);
    this.updateMessageDot(false);
  }

  async loadStyles() {
    try {
      const response = await fetch('../Style/headerStyles.css');
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
      <style>
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-overlay.active {
          display: flex;
        }
        .modal {
          background: white;
          border-radius: 8px;
          padding: 1rem 1.5rem;
          width: 300px;
          max-height: 400px;
          overflow-y: auto;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          font-family: system-ui, sans-serif;
        }
        .modal-header {
          font-weight: 600;
          margin-bottom: 1rem;
          font-size: 1.1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .close-btn {
          cursor: pointer;
          font-size: 1.5rem;
          font-weight: bold;
          border: none;
          background: none;
          line-height: 1;
        }
        .modal-list {
          list-style: none;
          padding: 0;
          margin: 0;
          max-height: 300px;
          overflow-y: auto;
          color: #374151;
          font-size: 0.9rem;
        }
        .modal-list li {
          padding: 0.5rem 0;
          border-bottom: 1px solid #eee;
        }
        @media (max-width: 768px) {
          .modal {
            width: 90%;
            margin: 0 1rem;
          }
          .mobile-menu {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            padding: 1rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 50;
          }
          .mobile-menu.active {
            display: block;
          }
          .mobile-menu-item {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
        }
      </style>

      <header class="bg-white shadow-sm p-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <button id="mobileMenuButton" class="md:hidden text-gray-600 p-2" aria-label="Toggle menu">
              <i class="fas fa-bars text-xl"></i>
            </button>
            <h1 class="text-xl font-semibold text-gray-800 truncate">Tableau de bord</h1>
          </div>
          
          <div class="flex items-center space-x-3">
            <button class="p-2 text-gray-600 relative" id="notificationBell">
              <i class="fas fa-bell text-xl"></i>
              <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" id="notificationDot"></span>
            </button>
            
            <button class="p-2 text-gray-600 relative" id="messageIcon">
              <i class="fas fa-envelope text-xl"></i>
              <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" id="messageDot"></span>
            </button>

            <div class="w-px h-6 bg-gray-300 hidden md:block"></div>
            
            <div class="flex items-center space-x-2">
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Admin" 
                   class="w-8 h-8 rounded-full object-cover">
              <span class="hidden md:inline text-sm font-medium">Admin</span>
            </div>
          </div>
        </div>

        <div id="mobileMenu" class="mobile-menu">
          <a href="#" class="mobile-menu-item">
            
            
          </a>
          <a href="#" class="mobile-menu-item">
            
          </a>
          <a href="#" class="mobile-menu-item">
            
            
          </a>
          <a href="#" class="mobile-menu-item">
            
            
          </a>
        </div>
      </header>

      <div id="notifModal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="notifTitle" tabindex="0">
        <div class="modal">
          <div class="modal-header">
            <span id="notifTitle">Notifications</span>
            <button class="close-btn" aria-label="Fermer notifications">&times;</button>
          </div>
          <ul class="modal-list" id="notifList">
            <li>Aucune notification pour le moment.</li>
          </ul>
        </div>
      </div>

      <div id="msgModal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="msgTitle" tabindex="0">
        <div class="modal">
          <div class="modal-header">
            <span id="msgTitle">Messages</span>
            <button class="close-btn" aria-label="Fermer messages">&times;</button>
          </div>
          <ul class="modal-list" id="msgList">
            <li>Aucun message pour le moment.</li>
          </ul>
        </div>
      </div>
    `;
  }

  initEvents() {
    const mobileBtn = this.querySelector('#mobileMenuButton');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('toggle-sidebar', { bubbles: true, composed: true }));
      });
    }

    const notifBell = this.querySelector('#notificationBell');
    const notifModal = this.querySelector('#notifModal');
    const notifCloseBtn = notifModal.querySelector('.close-btn');

    notifBell.addEventListener('click', () => {
      notifModal.classList.add('active');
      this.updateNotificationDot(false);
      notifModal.focus();
    });

    notifCloseBtn.addEventListener('click', () => {
      notifModal.classList.remove('active');
      notifBell.focus();
    });

    notifModal.addEventListener('click', e => {
      if (e.target === notifModal) {
        notifModal.classList.remove('active');
        notifBell.focus();
      }
    });

    const messageIcon = this.querySelector('#messageIcon');
    const msgModal = this.querySelector('#msgModal');
    const msgCloseBtn = msgModal.querySelector('.close-btn');

    messageIcon.addEventListener('click', () => {
      msgModal.classList.add('active');
      this.updateMessageDot(false);
      msgModal.focus();
    });

    msgCloseBtn.addEventListener('click', () => {
      msgModal.classList.remove('active');
      messageIcon.focus();
    });

    msgModal.addEventListener('click', e => {
      if (e.target === msgModal) {
        msgModal.classList.remove('active');
        messageIcon.focus();
      }
    });
    
    // Ajout de la gestion du menu mobile
    const mobileMenuBtn = this.querySelector('#mobileMenuButton');
    const mobileMenu = this.querySelector('#mobileMenu');
    
    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
      });

      // Fermer le menu mobile en cliquant ailleurs
      document.addEventListener('click', (e) => {
        if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
          mobileMenu.classList.remove('active');
        }
      });
    }
  }

  updateNotificationDot(show) {
    const dot = this.querySelector('#notificationDot');
    if (dot) {
      dot.style.display = show ? 'block' : 'none';
    }
  }

  updateMessageDot(show) {
    const dot = this.querySelector('#messageDot');
    if (dot) {
      dot.style.display = show ? 'block' : 'none';
    }
  }

  setNotifications(notifs) {
    const notifList = this.querySelector('#notifList');
    if (!notifList) return;

    if (!notifs || notifs.length === 0) {
      notifList.innerHTML = '<li>Aucune notification pour le moment.</li>';
    } else {
      notifList.innerHTML = notifs.map(n => `<li>${n}</li>`).join('');
    }
    this.updateNotificationDot(notifs && notifs.length > 0);
  }

  setMessages(msgs) {
    const msgList = this.querySelector('#msgList');
    if (!msgList) return;

    if (!msgs || msgs.length === 0) {
      msgList.innerHTML = '<li>Aucun message pour le moment.</li>';
    } else {
      msgList.innerHTML = msgs.map(m => `<li>${m}</li>`).join('');
    }
    this.updateMessageDot(msgs && msgs.length > 0);
  }
}

customElements.define('header-component', HeaderComponent);
