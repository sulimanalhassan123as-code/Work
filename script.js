
const API_KEY = 'AIzaSyAsscFyli7AR5vJQtfUoDV6adHlK3Bh-C8'; // provided
const CX = '909f5c55f2a504e45'; // provided
const RESULTS_PER_PAGE = 10;

const qEl = document.getElementById('q');
const searchBtn = document.getElementById('searchBtn');
const categoryEl = document.getElementById('category');
const resultsEl = document.getElementById('results');
const paginationEl = document.getElementById('pagination');
const voiceBtn = document.getElementById('voiceBtn');

const curated = ['quran.com','sunnah.com','islamqa.info','al-islam.org','islamweb.net','searchtruth.com'];
const categorySites = {
  quran: ['quran.com','tafsir.org','quranexplorer.com'],
  hadith: ['sunnah.com','al-islam.org'],
  history: ['al-islam.org'],
  fiqh: ['islamqa.info','ahlalhadeeth.com']
};

let currentStart = 1;
let lastQuery = '';

searchBtn?.addEventListener('click', ()=>doSearch(1));
qEl?.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') doSearch(1); });
voiceBtn?.addEventListener('click', startVoiceCapture);

document.getElementById && document.getElementById('submitForm')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  document.getElementById('submitMsg').textContent = 'Thank you — submission received (local demo).';
  setTimeout(()=>document.getElementById('submitMsg').textContent = '', 4000);
});

function quick(q){ qEl.value = q; doSearch(1); }

function startVoiceCapture(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){ alert('Voice recognition not supported.'); return; }
  const rec = new SpeechRecognition();
  rec.lang = 'en-US';
  rec.interimResults = false;
  rec.onresult = (evt) => { qEl.value = evt.results[0][0].transcript; doSearch(1); };
  rec.onerror = ()=> alert('Voice capture error.');
  rec.start();
}

function buildSiteQuery(filter, query){
  if(filter === 'all') return query;
  if(filter === 'curated') return curated.map(s=>`site:${s}`).join(' OR ') + ' ' + query;
  if(categorySites[filter]) return categorySites[filter].map(s=>`site:${s}`).join(' OR ') + ' ' + query;
  return query;
}

async function doSearch(start){
  const query = (qEl?.value || '').trim();
  const filter = categoryEl?.value || 'all';
  currentStart = start || 1;

  if(!query){
    resultsEl.innerHTML = `<div class="muted card">Please enter a search query.</div>`;
    paginationEl.innerHTML = '';
    return;
  }

  resultsEl.innerHTML = `<div class="muted card">Searching for <strong>${escapeHtml(query)}</strong>...</div>`;
  lastQuery = query;

  const finalQuery = buildSiteQuery(filter, query);
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(API_KEY)}&cx=${encodeURIComponent(CX)}&q=${encodeURIComponent(finalQuery)}&start=${currentStart}&num=${RESULTS_PER_PAGE}`;

  try{
    const resp = await fetch(url);
    if(!resp.ok){
      const txt = await resp.text();
      resultsEl.innerHTML = `<div class="muted card">Search API error: ${resp.status} ${resp.statusText}. ${escapeHtml(txt)}</div>`;
      paginationEl.innerHTML = '';
      return;
    }
    const data = await resp.json();
    renderResults(data);
  } catch(err){
    resultsEl.innerHTML = `<div class="muted card">Network error: ${escapeHtml(err.message)}</div>`;
    paginationEl.innerHTML = '';
  }
}

function renderResults(data){
  if(!data || !data.items || data.items.length === 0){
    const info = data && data.searchInformation ? `Search time: ${data.searchInformation.formattedSearchTime || '-'}, Total: ${data.searchInformation.totalResults || 0}` : '';
    resultsEl.innerHTML = `<div class="muted card"><strong>No results found</strong> — try different keywords or remove filters.<div class="small muted">${info}</div></div>`;
    paginationEl.innerHTML = '';
    return;
  }

  const html = data.items.map(it=>{
    const title = it.title || '';
    const link = it.link || it.formattedUrl || '#';
    const snippet = it.snippet || '';
    const displayLink = it.displayLink || (new URL(link)).hostname || '';
    return `<article class="result">
      <a href="${escapeAttr(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a>
      <div class="link">${escapeHtml(displayLink)}</div>
      <p class="snippet">${escapeHtml(snippet)}</p>
    </article>`;
  }).join('');

  resultsEl.innerHTML = html;

  const total = data.searchInformation && data.searchInformation.totalResults ? parseInt(data.searchInformation.totalResults) : null;
  if(total && total > RESULTS_PER_PAGE){
    const currentPage = Math.floor((currentStart-1)/RESULTS_PER_PAGE)+1;
    const totalPages = Math.min(10, Math.ceil(total/RESULTS_PER_PAGE));
    let pageHtml = '';
    if(currentStart > 1){
      pageHtml += `<button class="btn" onclick="doSearch(${Math.max(1,currentStart-RESULTS_PER_PAGE)})">Prev</button>`;
    }
    pageHtml += `<div class="muted small card" style="display:inline-block;padding:8px;border-radius:10px;margin:0 8px;">Page ${currentPage} of ${totalPages} — about ${numberWithCommas(total)} results</div>`;
    if(currentStart + RESULTS_PER_PAGE <= total && currentStart + RESULTS_PER_PAGE <= 100){
      pageHtml += `<button class="btn" onclick="doSearch(${currentStart+RESULTS_PER_PAGE})">Next</button>`;
    }
    paginationEl.innerHTML = pageHtml;
  } else {
    paginationEl.innerHTML = '';
  }
}

/* helpers */
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function escapeAttr(s){ return escapeHtml(s).replace(/'/g,'&#39;'); }
function numberWithCommas(x){ return x ? x.toString().replace(/\B(?=(\d{3})+(?!\d))/g,",") : x; }

/* if page loaded with ?q= param, auto search */
(function(){
  const p = new URLSearchParams(location.search);
  if(p.has('q')){ qEl.value = p.get('q'); doSearch(1); }
})();
