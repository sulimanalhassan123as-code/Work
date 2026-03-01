document.addEventListener('DOMContentLoaded', () => {
  const timelineScreen = document.getElementById('timeline-screen');
  const detailsScreen = document.getElementById('details-screen');
  const timelineContainer = document.getElementById('timeline-container');
  const prophetDetailsContent = document.getElementById('prophet-details-content');
  const backButton = document.getElementById('back-button');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const whatsappLink = document.getElementById('whatsapp-link');
  const contactLink = document.getElementById('contact-link');
  const installBtn = document.getElementById('install-btn');
  let deferredPrompt;
  let prophetsData = [];

  const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/KR69AWXAxZ7JApiG2u2JiG';

  // --- DARK MODE ---
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

  // --- FETCH PROPHETS ---
  const fetchProphets = async () => {
    try {
      const res = await fetch('https://raw.githubusercontent.com/sulimanalhassan123as-code/Work/main/prophets.json');
      if (!res.ok) throw new Error('Network issue');
      prophetsData = await res.json();
      renderTimeline();
    } catch (e) {
      timelineContainer.innerHTML = `<p style="text-align:center;">Failed to load data. Please check connection.</p>`;
      console.error(e);
    }
  };

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
    timelineScreen.classList.remove('active');
    detailsScreen.classList.add('active');
    window.scrollTo(0, 0);
  };

  const showTimeline = () => {
    detailsScreen.classList.remove('active');
    timelineScreen.classList.add('active');
  };

  backButton.addEventListener('click', showTimeline);
  whatsappLink.href = WHATSAPP_GROUP_URL;
  contactLink.addEventListener('click', e => {
    e.preventDefault();
    alert('Contact feature coming soon!');
  });

  // --- PWA INSTALL LOGIC ---
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'inline-block';
  });

  installBtn.addEventListener('click', async () => {
    installBtn.style.display = 'none';
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      console.log('User choice:', outcome);
    }
  });

  setupDarkMode();
  fetchProphets();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').then(() => console.log('SW registered'));
  }
});
