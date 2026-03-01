document.addEventListener('DOMContentLoaded', () => {
  // --- DOM ELEMENTS ---
  const timelineContainer = document.getElementById('timeline-container');
  const prophetDetailsContent = document.getElementById('prophet-details-content');
  const detailsScreen = document.getElementById('details-screen');
  const backButton = document.getElementById('back-button');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const installBtn = document.getElementById('install-btn');
  const searchBar = document.getElementById('search-bar');
  
  // Navigation Elements
  const navItems = document.querySelectorAll('.nav-item');
  const appPages = document.querySelectorAll('.app-page');

  // Zikr Elements
  const zikrCountDisplay = document.getElementById('zikr-count');
  const zikrTapBtn = document.getElementById('zikr-tap-btn');
  const zikrResetBtn = document.getElementById('zikr-reset-btn');
  const zikrDisplayBox = document.querySelector('.zikr-display');
  const zikrSelector = document.getElementById('zikr-selector');

  // Ramadan Elements
  const dailyQuoteText = document.getElementById('daily-quote-text');
  const dailyQuoteRef = document.getElementById('daily-quote-ref');

  let deferredPrompt;
  let prophetsData = [];

  // --- 1. BOTTOM NAVIGATION LOGIC ---
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach(nav => nav.classList.remove('active'));
      appPages.forEach(page => page.classList.remove('active'));
      
      item.classList.add('active');
      const targetId = item.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');
      window.scrollTo(0, 0);
    });
  });

  // --- 2. DARK MODE ---
  const setupDarkMode = () => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.body.classList.add('dark-mode');
      darkModeToggle.textContent = '☀️';
    }
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const dark = document.body.classList.contains('dark-mode');
      localStorage.setItem('theme', dark ? 'dark' : 'light');
      darkModeToggle.textContent = dark ? '☀️' : '🌙';
    });
  };

  // --- 3. FETCH PROPHETS ---
  const fetchProphets = async () => {
    try {
      const res = await fetch('./prophets.json');
      if (!res.ok) throw new Error('Network issue');
      prophetsData = await res.json();
      renderTimeline();
    } catch (e) {
      timelineContainer.innerHTML = `<p style="text-align:center;">Failed to load data. Please check connection.</p>`;
      console.error(e);
    }
  };

  // --- 4. RENDER TIMELINE ---
  const renderTimeline = () => {
    timelineContainer.innerHTML = '';
    const eras = [...new Set(prophetsData.map(p => p.era))];

    eras.forEach(era => {
      const eraDiv = document.createElement('div');
      eraDiv.className = 'era-section';
      const eraTitle = document.createElement('div');
      eraTitle.className = 'era-title';
      eraTitle.textContent = era;
      eraDiv.appendChild(eraTitle);

      prophetsData.filter(p => p.era === era).forEach(prophet => {
        const card = document.createElement('div');
        card.className = 'prophet-card';
        card.dataset.id = prophet.id;
        card.innerHTML = `<h2>${prophet.name}</h2><p>${prophet.bio.substring(0, 100)}...</p>`;
        card.addEventListener('click', () => showDetails(prophet.id));
        eraDiv.appendChild(card);
      });
      timelineContainer.appendChild(eraDiv);
    });
  };

  // --- 5. SHOW/HIDE PROPHET DETAILS ---
  const showDetails = id => {
    const prophet = prophetsData.find(p => p.id === id);
    if (!prophet) return;

    prophetDetailsContent.innerHTML = `
      <h1>${prophet.name}</h1>
      <div class="detail-section"><h3>Biography</h3><p>${prophet.bio}</p></div>
      <div class="detail-section"><h3>Key Events & Miracles</h3><ul>${prophet.events.map(e => `<li>${e}</li>`).join('')}</ul></div>
      <div class="detail-section"><h3>Mentions in the Qur'an</h3><p>${prophet.verses.join(', ')}</p></div>
      <div class="detail-section"><h3>Lessons From Their Life</h3><p>${prophet.lessons}</p></div>
      <div class="detail-section"><h3>Learn More (Video)</h3>
        <div class="youtube-embed">
          <iframe src="https://www.youtube.com/embed/${prophet.youtubeId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
      </div>
    `;
    detailsScreen.classList.add('active');
    document.body.style.overflow = 'hidden'; 
  };

  backButton.addEventListener('click', () => {
    detailsScreen.classList.remove('active');
    document.body.style.overflow = 'auto';
  });

  // --- 6. LIVE SEARCH FILTER ---
  if (searchBar) {
    searchBar.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const cards = document.querySelectorAll('.prophet-card');
      cards.forEach(card => {
        const name = card.querySelector('h2').textContent.toLowerCase();
        if (name.includes(searchTerm)) { card.style.display = 'block'; } else { card.style.display = 'none'; }
      });
      const eraSections = document.querySelectorAll('.era-section');
      eraSections.forEach(section => {
        const visibleCards = section.querySelectorAll('.prophet-card[style="display: block;"], .prophet-card:not([style="display: none;"])');
        const eraTitle = section.querySelector('.era-title');
        if (visibleCards.length === 0) { eraTitle.style.display = 'none'; } else { eraTitle.style.display = 'inline-block'; }
      });
    });
  }

  // --- 7. MULTI-ZIKR COUNTER LOGIC ---
  if (zikrCountDisplay && zikrTapBtn && zikrSelector) {
    // Determine which Zikr we are currently tracking
    let currentZikrKey = 'zikr_' + zikrSelector.value; 

    // Function to load the specific count
    const loadCount = () => {
      let saved = localStorage.getItem(currentZikrKey);
      return saved ? parseInt(saved) : 0;
    };

    let currentCount = loadCount();
    zikrCountDisplay.textContent = currentCount;

    // When user changes the dropdown to a different Zikr
    zikrSelector.addEventListener('change', (e) => {
      currentZikrKey = 'zikr_' + e.target.value;
      currentCount = loadCount();
      zikrCountDisplay.textContent = currentCount;
    });

    // When the TAP button is pressed
    zikrTapBtn.addEventListener('click', () => {
      currentCount++;
      zikrCountDisplay.textContent = currentCount;
      localStorage.setItem(currentZikrKey, currentCount);
      
      // Bump animation
      zikrDisplayBox.style.transform = 'scale(1.05)';
      setTimeout(() => { zikrDisplayBox.style.transform = 'scale(1)'; }, 100);
    });

    // When the RESET button is pressed
    zikrResetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset this specific count to 0?')) {
        currentCount = 0;
        zikrCountDisplay.textContent = currentCount;
        localStorage.setItem(currentZikrKey, currentCount);
      }
    });
  }

  // --- 8. AUTO-UPDATING DAILY RAMADAN QUOTES ---
  if (dailyQuoteText && dailyQuoteRef) {
    const dailyQuotes = [
      { text: "\"O you who have believed, decreed upon you is fasting as it was decreed upon those before you that you may become righteous.\"", ref: "- Surah Al-Baqarah 2:183" },
      { text: "\"Whoever fasts Ramadan out of faith and in the hope of reward, his previous sins will be forgiven.\"", ref: "- Sahih Bukhari" },
      { text: "\"The month of Ramadhan [is that] in which was revealed the Qur'an, a guidance for the people...\"", ref: "- Surah Al-Baqarah 2:185" },
      { text: "\"Fasting is a shield with which a servant protects himself from the Fire.\"", ref: "- Musnad Ahmad" },
      { text: "\"When the month of Ramadan begins, the gates of heaven are opened, the gates of Hellfire are closed, and the devils are chained.\"", ref: "- Sahih Bukhari" },
      { text: "\"And when My servants ask you, [O Muhammad], concerning Me - indeed I am near. I respond to the invocation of the supplicant when he calls upon Me.\"", ref: "- Surah Al-Baqarah 2:186" },
      { text: "\"There is a gate in Paradise called Ar-Rayyan, and those who observe fasts will enter through it on the Day of Resurrection...\"", ref: "- Sahih Bukhari" }
    ];

    // Math to pick a different quote based on the current day of the year
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const quoteIndex = dayOfYear % dailyQuotes.length;

    // Inject today's quote into the HTML
    dailyQuoteText.textContent = dailyQuotes[quoteIndex].text;
    dailyQuoteRef.textContent = dailyQuotes[quoteIndex].ref;
  }

  // --- 9. PWA INSTALL LOGIC ---
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'flex';
  });

  installBtn.addEventListener('click', async () => {
    installBtn.style.display = 'none';
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
    }
  });

  // --- INITIALIZE ---
  setupDarkMode();
  fetchProphets();

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').then(() => console.log('SW registered'));
  }
});
