// script.js - builds list page and YouTube embed
(function() {
  if (!window.PROPHETS) window.PROPHETS = [];
  const cardsEl = document.getElementById('cards');
  if (!cardsEl) return;

  PROPHETS.forEach((p, idx) => {
    const card = document.createElement('article');
    card.className = 'card';

    const h = document.createElement('h3');
    h.textContent = (idx + 1) + '. ' + p.name + ' (A.S.)';

    const sp = document.createElement('p');
    sp.textContent = p.short;

    const playBtn = document.createElement('a');
    playBtn.href = `prophet.html?id=${p.id}`;
    playBtn.className = 'btn play';
    playBtn.textContent = 'Read & Listen';

    // If prophet has YouTube ID, show preview video directly
    if (p.youtube) {
      const video = document.createElement('iframe');
      video.width = "100%";
      video.height = "200";
      video.src = `https://www.youtube.com/embed/${p.youtube}`;
      video.title = "YouTube video player";
      video.frameBorder = "0";
      video.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      video.allowFullscreen = true;
      card.appendChild(video);
    }

    card.appendChild(h);
    card.appendChild(sp);
    card.appendChild(playBtn);
    cardsEl.appendChild(card);
  });
})();
