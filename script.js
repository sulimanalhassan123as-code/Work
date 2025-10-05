document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const timelineScreen = document.getElementById('timeline-screen');
    const detailsScreen = document.getElementById('details-screen');
    const timelineContainer = document.getElementById('timeline-container');
    const prophetDetailsContent = document.getElementById('prophet-details-content');
    const backButton = document.getElementById('back-button');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const whatsappLink = document.getElementById('whatsapp-link');
    const contactLink = document.getElementById('contact-link');

    let prophetsData = []; // To store the fetched data

    // --- YOUR WHATSAPP GROUP LINK IS NOW INCLUDED ---
    const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/KR69AWXAxZ7JApiG2u2JiG'; 

    // --- Dark Mode Logic ---
    const setupDarkMode = () => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');

        if ((savedTheme === 'dark') || (!savedTheme && prefersDark)) {
            document.body.classList.add('dark-mode');
            darkModeToggle.textContent = '☀️';
        }

        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            darkModeToggle.textContent = isDark ? '☀️' : '🌙';
        });
    };

    // --- Data Fetching and Rendering ---
    const fetchProphets = async () => {
        try {
            // This URL is now correct and points to YOUR GitHub repository.
            const response = await fetch('https://raw.githubusercontent.com/sulimanalhassan123as-code/Work/main/prophets.json');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            prophetsData = await response.json();
            renderTimeline();
        } catch (error) {
            timelineContainer.innerHTML = '<p style="text-align:center;">Failed to load data. Please check your connection and the file path in script.js.</p>';
            console.error('Fetch error:', error);
        }
    };

    const renderTimeline = () => {
        timelineContainer.innerHTML = ''; // Clear loading spinner
        
        const eras = [...new Set(prophetsData.map(p => p.era))];
        
        eras.forEach(era => {
            const eraSection = document.createElement('div');
            eraSection.className = 'era-section';

            const eraTitle = document.createElement('div');
            eraTitle.className = 'era-title';
            eraTitle.textContent = era;
            eraSection.appendChild(eraTitle);
            
            const prophetsInEra = prophetsData.filter(p => p.era === era);
            prophetsInEra.forEach(prophet => {
                const card = document.createElement('div');
                card.className = 'prophet-card';
                card.dataset.id = prophet.id;
                card.innerHTML = `
                    <h2>${prophet.name}</h2>
                    <p>${prophet.bio.substring(0, 100)}...</p>
                `;
                card.addEventListener('click', () => showDetails(prophet.id));
                eraSection.appendChild(card);
            });
            timelineContainer.appendChild(eraSection);
        });
    };

    const showDetails = (id) => {
        const prophet = prophetsData.find(p => p.id === id);
        if (!prophet) return;

        prophetDetailsContent.innerHTML = `
            <h1>${prophet.name}</h1>
            <div class="detail-section">
                <h3>Biography</h3>
                <p>${prophet.bio}</p>
            </div>
            <div class="detail-section">
                <h3>Key Events & Miracles</h3>
                <ul>${prophet.events.map(event => `<li>${event}</li>`).join('')}</ul>
            </div>
            <div class="detail-section">
                <h3>Mentions in the Qur'an</h3>
                <p>${prophet.verses.join(', ')}</p>
            </div>
            <div class="detail-section">
                <h3>Lessons From Their Life</h3>
                <p>${prophet.lessons}</p>
            </div>
            <div class="detail-section">
                <h3>Learn More (Video)</h3>
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

    // --- Initial Setup and Event Listeners ---
    
    whatsappLink.href = WHATSAPP_GROUP_URL;
    
    contactLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Contact feature coming soon!');
    });

    backButton.addEventListener('click', showTimeline);

    // Initialize the app
    setupDarkMode();
    fetchProphets();
});
