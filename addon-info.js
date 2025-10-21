class AddonInfo extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.loadAddonInfo();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        /* Import the main stylesheet */
        @import url('../../style.css');
        @import url('https://fonts.googleapis.com/css2?family=BBH+Sans+Hegarty&display=swap');

        :host {
          display: block;
        }

        /* Lightbox styles */
        .lightbox {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.9);
          justify-content: center;
          align-items: center;
          z-index: 1000;
          cursor: pointer;
        }

        .lightbox img {
          max-width: 90%;
          max-height: 90%;
        }
      </style>

      <header class="site-header">
        <h1 class="site-title bbh-sans-hegarty-regular">
          <span class="cubyz">CubyzHub</span>
        </h1>
        <a href="../../upload.html" class="upload-btn" title="Upload Addon" aria-label="Upload Addon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="24" height="24">
            <path d="M5 20h14v-2H5v2zm7-18v12l5-5h-3V4h-4v5H7l5 5z" />
          </svg>
        </a>
      </header>

      <div class="addon-detail-wrapper">
        <main class="addon-detail-main">

          <!-- Addon Header -->
          <div class="addon-card-header" id="addon-header">
            <img id="addon-icon" class="addon-header-image" alt="Addon Icon" />
            <div class="addon-header-content">
              <h2 id="addon-title"></h2>
              <p id="addon-shortdesc"></p>
              <a id="addon-download" class="download-btn" download>⬇ Download</a>
            </div>
          </div>

          <!-- Tabs -->
          <div class="tab-menu">
            <button id="description-tab" class="active">Description</button>
            <button id="versions-tab">Versions</button>
          </div>

          <!-- Description Section -->
          <section id="description-section" class="addon-description">
            <img id="addon-banner" class="banner-img" alt="Addon Banner" />
            <div id="addon-longdesc"></div>
            <h3 id="screenshots-header" style="margin-top:20px;display:none;">Screenshots</h3>
            <div class="screenshot-grid" id="addon-screenshots"></div>
          </section>

          <!-- Versions Section -->
          <section id="versions-section" class="addon-description" style="display:none;">
            <h3>Addon Versions</h3>
            <ul class="addon-versions-list" id="version-list"></ul>
          </section>

        </main>

        <!-- Sidebar -->
        <aside class="addon-sidebar">
          <div class="sidebar-card">
            <h4>Compatibility</h4>
            <p><strong>Cubyz Version:</strong> <span id="addon-cubyzver"></span></p>
          </div>

          <div class="sidebar-card">
            <h4>File Information</h4>
            <p><strong>Addon Version:</strong> <span id="addon-version"></span></p>
            <p><strong>Last Updated:</strong> <span id="addon-updated"></span></p>
          </div>

          <div class="sidebar-card">
            <h4>Author</h4>
            <p><strong id="addon-author"></strong></p>
          </div>
        </aside>
      </div>

      <!-- Lightbox for screenshots -->
      <div id="lightbox" class="lightbox">
        <img src="" alt="Zoomed screenshot">
      </div>
    `;
  }

  parseMarkdown(md) {
    return md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>')
      .replace(/\*(.*?)\*/gim, '<i>$1</i>')
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      .replace(/\n$/gim, '<br />')
      .replace(/\n\n/gim, '<br><br>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
  }

  async loadAddonInfo() {
    try {
      const urlParts = window.location.pathname.split('/');
      const addonId = urlParts[urlParts.length - 1].replace('-info.html', '');
      const res = await fetch('../../addons.json');
      const addons = await res.json();
      const addon = addons.find(a => a.id === addonId);
      if (!addon) throw new Error('Addon not found');

      // Header info
      document.title = addon.name;
      this.shadowRoot.getElementById('addon-title').textContent = addon.name;
      this.shadowRoot.getElementById('addon-shortdesc').textContent = addon.description;
      this.shadowRoot.getElementById('addon-icon').src = '../../' + addon.icon;
      this.shadowRoot.getElementById('addon-download').href = '../../' + addon.download;

      // Banner & long description
      this.shadowRoot.getElementById('addon-banner').src = '../../' + addon.banner;
      const longDesc = addon.longDescription || addon.description || '';
      this.shadowRoot.getElementById('addon-longdesc').innerHTML = this.parseMarkdown(longDesc);

      // Sidebar
      this.shadowRoot.getElementById('addon-author').textContent = addon.author || 'Unknown';
      this.shadowRoot.getElementById('addon-version').textContent = addon.version || '—';
      this.shadowRoot.getElementById('addon-updated').textContent = addon.updated || '—';
      this.shadowRoot.getElementById('addon-cubyzver').textContent = addon.cubyzVersion || '—';

      // Screenshots
      const ssContainer = this.shadowRoot.getElementById('addon-screenshots');
      if (addon.screenshots && addon.screenshots.length > 0) {
        this.shadowRoot.getElementById('screenshots-header').style.display = 'block';
        addon.screenshots.forEach(src => {
          const img = document.createElement('img');
          img.src = '../../' + src;
          img.alt = 'Screenshot';
          ssContainer.appendChild(img);
          img.addEventListener('click', () => {
            const lightbox = this.shadowRoot.getElementById('lightbox');
            const lightboxImg = lightbox.querySelector('img');
            lightboxImg.src = img.src;
            lightbox.style.display = 'flex';
          });
        });
      }

      // Versions list (newest first)
      const versionList = this.shadowRoot.getElementById('version-list');
      if (addon.patchNotes && addon.patchNotes.length > 0) {
        addon.patchNotes
          .slice()
          .reverse()
          .forEach(v => {
            const li = document.createElement('li');
            li.innerHTML = `
              <div class="version-info">
                <span><strong>${v.version}</strong> ${v.notes}</span>
                <a href="../../${addon.download.replace(addon.version, v.version)}" class="version-download-btn" download>⬇ Download</a>
              </div>`;
            versionList.appendChild(li);
          });
      }
    } catch (err) {
      console.error('Error loading addon info:', err);
    }
  }

  setupEventListeners() {
    // Tab control
    const descriptionTab = this.shadowRoot.getElementById('description-tab');
    const versionsTab = this.shadowRoot.getElementById('versions-tab');
    const descSection = this.shadowRoot.getElementById('description-section');
    const verSection = this.shadowRoot.getElementById('versions-section');

    descriptionTab.addEventListener('click', () => {
      descriptionTab.classList.add('active');
      versionsTab.classList.remove('active');
      descSection.style.display = 'block';
      verSection.style.display = 'none';
    });

    versionsTab.addEventListener('click', () => {
      versionsTab.classList.add('active');
      descriptionTab.classList.remove('active');
      descSection.style.display = 'none';
      verSection.style.display = 'block';
    });

    // Lightbox
    const lightbox = this.shadowRoot.getElementById('lightbox');
    const lightboxImg = lightbox.querySelector('img');
    lightbox.addEventListener('click', () => {
      lightbox.style.display = 'none';
      lightboxImg.src = '';
    });
  }
}

// Define the custom element
customElements.define('addon-info', AddonInfo);
