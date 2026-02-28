/**
 * RÉPERTOIRE JEUX EPS – Application principale
 * 310 jeux d'éducation physique alignés PFEQ
 * Style PopArt / Comic / Cartoon
 */

// ============================================================
// STATE
// ============================================================
const state = {
  games: typeof GAMES_DATA !== 'undefined' ? GAMES_DATA : [],
  filteredGames: [],
  favorites: JSON.parse(localStorage.getItem('eps-favorites') || '[]'),
  activeCategory: 'all',
  activeDuration: 'all',
  activePfeq: 'all',
  activeMaterial: 'all',
  searchQuery: '',
  sortBy: 'id',
  viewMode: 'grid',
  showFavorites: false,
  theme: localStorage.getItem('eps-theme') ||
         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
};

// ============================================================
// CATEGORY CONFIG
// ============================================================
const CATEGORIES = {
  'ballons-chasseurs': { name: 'Ballons chasseurs', icon: '🔴', color: '#FF2D2D' },
  'poursuites': { name: 'Jeux de poursuites', icon: '🏃', color: '#FF8C00' },
  'ludiques': { name: 'Jeux ludiques/coopératifs', icon: '🎮', color: '#00D26A' },
  'collectifs': { name: 'Jeux collectifs', icon: '⚽', color: '#0088FF' },
  'opposition': { name: "Jeux d'opposition", icon: '🤼', color: '#8B2FC9' },
  'duels': { name: 'Jeux de duels', icon: '⚔️', color: '#FFD000' },
};

// ============================================================
// DOM ELEMENTS
// ============================================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
  searchInput: $('#searchInput'),
  searchClear: $('#searchClear'),
  gameGrid: $('#gameGrid'),
  emptyState: $('#emptyState'),
  resultsCount: $('#resultsCount'),
  activeFilters: $('#activeFilters'),
  sortSelect: $('#sortSelect'),
  menuToggle: $('#menuToggle'),
  sidebar: $('#sidebar'),
  sidebarOverlay: $('#sidebarOverlay'),
  modalOverlay: $('#modalOverlay'),
  modalBody: $('#modalBody'),
  modalClose: $('#modalClose'),
  themeToggle: $('#themeToggle'),
  favoritesBtn: $('#favoritesBtn'),
  favCount: $('#favCount'),
  favoritesView: $('#favoritesView'),
  favGrid: $('#favGrid'),
  favEmpty: $('#favEmpty'),
  backFromFav: $('#backFromFav'),
  statsBar: $('#statsBar'),
  resetFilters: $('#resetFilters'),
};

// ============================================================
// INITIALIZATION
// ============================================================
function init() {
  // Apply saved theme
  document.documentElement.setAttribute('data-theme', state.theme);

  // Initialize filtered games
  state.filteredGames = [...state.games];

  // Render
  renderGameGrid();
  updateCounts();
  updateFavCount();

  // Event listeners
  setupEventListeners();

  console.log(`✅ Répertoire EPS chargé : ${state.games.length} jeux`);
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function setupEventListeners() {
  // Search
  dom.searchInput.addEventListener('input', debounce(handleSearch, 200));
  dom.searchClear.addEventListener('click', clearSearch);

  // Categories
  $$('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => handleCategoryClick(btn));
  });

  // Duration filter
  $$('#durationFilter .chip').forEach(chip => {
    chip.addEventListener('click', () => handleFilterClick(chip, 'duration'));
  });

  // PFEQ filter
  $$('#pfeqFilter .chip').forEach(chip => {
    chip.addEventListener('click', () => handleFilterClick(chip, 'pfeq'));
  });

  // Material filter
  $$('#materialFilter .chip').forEach(chip => {
    chip.addEventListener('click', () => handleFilterClick(chip, 'material'));
  });

  // Sort
  dom.sortSelect.addEventListener('change', handleSort);

  // View toggle
  $$('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => handleViewToggle(btn));
  });

  // Mobile menu
  dom.menuToggle.addEventListener('click', toggleSidebar);
  dom.sidebarOverlay.addEventListener('click', closeSidebar);

  // Modal
  dom.modalOverlay.addEventListener('click', (e) => {
    if (e.target === dom.modalOverlay) closeModal();
  });
  dom.modalClose.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Theme
  dom.themeToggle.addEventListener('click', toggleTheme);

  // Favorites
  dom.favoritesBtn.addEventListener('click', showFavorites);
  dom.backFromFav.addEventListener('click', hideFavorites);

  // Reset
  dom.resetFilters.addEventListener('click', resetAll);
}

// ============================================================
// SEARCH
// ============================================================
function handleSearch() {
  state.searchQuery = dom.searchInput.value.trim().toLowerCase();
  dom.searchClear.classList.toggle('visible', state.searchQuery.length > 0);
  applyFilters();
}

function clearSearch() {
  dom.searchInput.value = '';
  state.searchQuery = '';
  dom.searchClear.classList.remove('visible');
  applyFilters();
}

// ============================================================
// FILTERS
// ============================================================
function handleCategoryClick(btn) {
  $$('.category-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.activeCategory = btn.dataset.category;
  applyFilters();
  closeSidebar();
}

function handleFilterClick(chip, filterType) {
  const parent = chip.parentElement;
  parent.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');

  switch (filterType) {
    case 'duration':
      state.activeDuration = chip.dataset.duration;
      break;
    case 'pfeq':
      state.activePfeq = chip.dataset.pfeq;
      break;
    case 'material':
      state.activeMaterial = chip.dataset.material;
      break;
  }

  applyFilters();
}

function applyFilters() {
  let filtered = [...state.games];

  // Category filter
  if (state.activeCategory !== 'all') {
    filtered = filtered.filter(g => g.category === state.activeCategory);
  }

  // Duration filter
  if (state.activeDuration !== 'all') {
    const dur = parseInt(state.activeDuration);
    if (dur === 10) {
      filtered = filtered.filter(g => g.dureeMin <= 15);
    } else if (dur === 15) {
      filtered = filtered.filter(g => g.dureeMin >= 15 && g.dureeMin <= 20);
    } else if (dur === 20) {
      filtered = filtered.filter(g => g.dureeMin >= 20 && g.dureeMin <= 30);
    } else if (dur === 30) {
      filtered = filtered.filter(g => g.dureeMin >= 30);
    }
  }

  // PFEQ filter
  if (state.activePfeq !== 'all') {
    if (state.activePfeq === 'C1') {
      filtered = filtered.filter(g => g.intentionsC1);
    } else if (state.activePfeq === 'C2') {
      filtered = filtered.filter(g => g.intentionsC2);
    } else if (state.activePfeq === 'C3') {
      filtered = filtered.filter(g => g.intentionsC3);
    }
  }

  // Material filter
  if (state.activeMaterial !== 'all') {
    const mat = state.activeMaterial.toLowerCase();
    filtered = filtered.filter(g => {
      const materielStr = (Array.isArray(g.materiel) ? g.materiel.join(' ') : g.materiel).toLowerCase();
      return materielStr.includes(mat);
    });
  }

  // Search
  if (state.searchQuery) {
    const q = state.searchQuery;
    filtered = filtered.filter(g => {
      const searchText = [
        g.title,
        g.but,
        g.intentionsC1,
        g.intentionsC2,
        g.intentionsC3 || '',
        Array.isArray(g.materiel) ? g.materiel.join(' ') : g.materiel,
        g.disposition,
        Array.isArray(g.deroulement) ? g.deroulement.join(' ') : '',
        Array.isArray(g.variantes) ? g.variantes.join(' ') : '',
        Array.isArray(g.transversales) ? g.transversales.join(' ') : '',
      ].join(' ').toLowerCase();
      return searchText.includes(q);
    });
  }

  // Sort
  filtered = sortGames(filtered);

  state.filteredGames = filtered;
  renderGameGrid();
  updateResultsCount();
}

// ============================================================
// SORTING
// ============================================================
function handleSort() {
  state.sortBy = dom.sortSelect.value;
  applyFilters();
}

function sortGames(games) {
  const sorted = [...games];
  switch (state.sortBy) {
    case 'id':
      sorted.sort((a, b) => a.id - b.id);
      break;
    case 'title':
      sorted.sort((a, b) => a.title.localeCompare(b.title, 'fr'));
      break;
    case 'duration':
      sorted.sort((a, b) => a.dureeMin - b.dureeMin);
      break;
    case 'category':
      sorted.sort((a, b) => a.category.localeCompare(b.category));
      break;
  }
  return sorted;
}

// ============================================================
// VIEW
// ============================================================
function handleViewToggle(btn) {
  $$('.view-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.viewMode = btn.dataset.view;
  dom.gameGrid.classList.toggle('list-view', state.viewMode === 'list');
}

// ============================================================
// RENDER GAME GRID
// ============================================================
function renderGameGrid() {
  const games = state.filteredGames;

  if (games.length === 0) {
    dom.gameGrid.style.display = 'none';
    dom.emptyState.style.display = 'block';
    return;
  }

  dom.gameGrid.style.display = '';
  dom.emptyState.style.display = 'none';

  // Use DocumentFragment for performance
  const fragment = document.createDocumentFragment();

  games.forEach((game, index) => {
    const card = createGameCard(game, index);
    fragment.appendChild(card);
  });

  dom.gameGrid.innerHTML = '';
  dom.gameGrid.appendChild(fragment);

  // Restore view mode
  dom.gameGrid.classList.toggle('list-view', state.viewMode === 'list');
}

function createGameCard(game, index) {
  const card = document.createElement('div');
  card.className = 'game-card';
  card.style.animationDelay = `${Math.min(index * 0.02, 0.3)}s`;
  card.onclick = () => openGameDetail(game);

  const isFav = state.favorites.includes(game.id);
  const catConfig = CATEGORIES[game.category] || {};
  const categoryLabel = catConfig.name || game.categoryName || game.category;

  card.innerHTML = `
    <div class="card-top">
      <div class="card-category-bar ${game.category}"></div>
      <div class="card-number">${game.id}</div>
      <div class="card-title">${escapeHtml(game.title)}</div>
      <div class="card-but">${escapeHtml(game.but)}</div>
    </div>
    <div class="card-bottom">
      <div class="card-tags">
        <span class="card-tag category ${game.category}">${categoryLabel}</span>
        <span class="card-tag duration">${game.duree || game.dureeMin + ' min'}</span>
      </div>
      <button class="card-fav ${isFav ? 'is-fav' : ''}" onclick="event.stopPropagation(); toggleFavorite(${game.id})" title="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
        ${isFav ? '⭐' : '☆'}
      </button>
    </div>
  `;

  return card;
}

// ============================================================
// GAME DETAIL MODAL
// ============================================================
function openGameDetail(game) {
  const isFav = state.favorites.includes(game.id);
  const catConfig = CATEGORIES[game.category] || {};

  let html = `
    <div class="detail-category-bar ${game.category}"></div>
    <div class="detail-header">
      <div class="detail-meta">
        <div class="detail-number">${game.id}</div>
        <span class="detail-cat-badge ${game.category}">${game.categoryIcon || ''} ${catConfig.name || game.categoryName}</span>
        <button class="detail-fav-btn ${isFav ? 'is-fav' : ''}" onclick="toggleFavorite(${game.id}); refreshModal(${game.id});">
          ${isFav ? '⭐ Favori' : '☆ Ajouter'}
        </button>
      </div>
      <h2 class="detail-title">${escapeHtml(game.title)}</h2>
    </div>
    <div class="detail-sections">
      <!-- But -->
      <div class="detail-section">
        <div class="detail-section-title">🎯 But du jeu</div>
        <p>${escapeHtml(game.but)}</p>
      </div>

      <!-- Intentions pédagogiques -->
      <div class="detail-section">
        <div class="detail-section-title">📚 Intentions pédagogiques (PFEQ)</div>
        <div class="competency-grid">
          ${game.intentionsC1 ? `<div class="comp-item"><span class="comp-badge c1">C1</span> ${escapeHtml(game.intentionsC1)}</div>` : ''}
          ${game.intentionsC2 ? `<div class="comp-item"><span class="comp-badge c2">C2</span> ${escapeHtml(game.intentionsC2)}</div>` : ''}
          ${game.intentionsC3 ? `<div class="comp-item"><span class="comp-badge c3">C3</span> ${escapeHtml(game.intentionsC3)}</div>` : ''}
          ${game.transversales && game.transversales.length > 0 ? `<div class="comp-item"><span class="comp-badge ct">CT</span> ${escapeHtml(game.transversales.join(', '))}</div>` : ''}
        </div>
      </div>

      <!-- Matériel -->
      <div class="detail-section">
        <div class="detail-section-title">🏐 Matériel</div>
        <div class="material-tags">
          ${(Array.isArray(game.materiel) ? game.materiel : [game.materiel]).map(m =>
            `<span class="material-tag">${escapeHtml(m)}</span>`
          ).join('')}
        </div>
      </div>

      <!-- Disposition -->
      <div class="detail-section">
        <div class="detail-section-title">📐 Disposition</div>
        <p>${escapeHtml(game.disposition)}</p>
      </div>

      <!-- Durée -->
      <div class="detail-section">
        <div class="detail-section-title">⏱️ Durée</div>
        <p>${escapeHtml(game.duree || game.dureeMin + ' minutes')}</p>
      </div>

      <!-- Déroulement -->
      <div class="detail-section">
        <div class="detail-section-title">📋 Déroulement</div>
        <ol>
          ${(Array.isArray(game.deroulement) ? game.deroulement : []).map(step =>
            `<li>${escapeHtml(step)}</li>`
          ).join('')}
        </ol>
      </div>

      <!-- Variantes -->
      ${game.variantes && game.variantes.length > 0 ? `
      <div class="detail-section">
        <div class="detail-section-title">💡 Variantes</div>
        ${game.variantes.map(v => `<div class="variante-item">${escapeHtml(v)}</div>`).join('')}
      </div>
      ` : ''}

      <!-- Print button -->
      <button class="detail-print-btn" onclick="printGame(${game.id})">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Imprimer cette fiche
      </button>
    </div>
  `;

  dom.modalBody.innerHTML = html;
  dom.modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function refreshModal(gameId) {
  const game = state.games.find(g => g.id === gameId);
  if (game) {
    openGameDetail(game);
  }
}

function closeModal() {
  dom.modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ============================================================
// FAVORITES
// ============================================================
function toggleFavorite(gameId) {
  const idx = state.favorites.indexOf(gameId);
  if (idx > -1) {
    state.favorites.splice(idx, 1);
  } else {
    state.favorites.push(gameId);
  }
  localStorage.setItem('eps-favorites', JSON.stringify(state.favorites));
  updateFavCount();

  // Update card buttons
  renderGameGrid();

  // If in favorites view, refresh it
  if (state.showFavorites) {
    renderFavorites();
  }
}

function updateFavCount() {
  dom.favCount.textContent = state.favorites.length;
  dom.favCount.setAttribute('data-count', state.favorites.length);
}

function showFavorites() {
  state.showFavorites = true;
  dom.gameGrid.style.display = 'none';
  dom.emptyState.style.display = 'none';
  dom.statsBar.style.display = 'none';
  dom.favoritesView.style.display = 'block';
  renderFavorites();
}

function hideFavorites() {
  state.showFavorites = false;
  dom.favoritesView.style.display = 'none';
  dom.statsBar.style.display = '';
  applyFilters();
}

function renderFavorites() {
  const favGames = state.games.filter(g => state.favorites.includes(g.id));

  if (favGames.length === 0) {
    dom.favGrid.style.display = 'none';
    dom.favEmpty.style.display = 'block';
    return;
  }

  dom.favGrid.style.display = '';
  dom.favEmpty.style.display = 'none';

  const fragment = document.createDocumentFragment();
  favGames.forEach((game, index) => {
    fragment.appendChild(createGameCard(game, index));
  });

  dom.favGrid.innerHTML = '';
  dom.favGrid.appendChild(fragment);
}

// ============================================================
// THEME
// ============================================================
function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('eps-theme', state.theme);
}

// ============================================================
// SIDEBAR (MOBILE)
// ============================================================
function toggleSidebar() {
  dom.sidebar.classList.toggle('open');
}

function closeSidebar() {
  dom.sidebar.classList.remove('open');
}

// ============================================================
// PRINT
// ============================================================
function printGame(gameId) {
  const game = state.games.find(g => g.id === gameId);
  if (!game) return;

  const printWindow = window.open('', '_blank');
  const catConfig = CATEGORIES[game.category] || {};

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>${game.title} – Fiche de jeu EPS</title>
      <style>
        @font-face { font-family: 'Bangers'; src: url('Bangers-Regular.ttf'); }
        @font-face { font-family: 'Barriecito'; src: url('Barriecito-Regular.ttf'); }
        body { font-family: 'Barriecito', -apple-system, sans-serif; max-width: 700px; margin: 0 auto; padding: 30px; color: #1A1A2E; }
        h1 { font-family: 'Bangers', Impact, sans-serif; font-size: 1.8rem; text-transform: uppercase; letter-spacing: 2px; border-bottom: 3px solid ${catConfig.color || '#333'}; padding-bottom: 8px; margin-bottom: 4px; }
        .meta { font-family: 'Barriecito', sans-serif; font-size: 0.9rem; color: #666; margin-bottom: 16px; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 50px; font-family: 'Bangers', sans-serif; font-size: 0.8rem; font-weight: 700; color: white; background: ${catConfig.color || '#333'}; letter-spacing: 1px; }
        h2 { font-family: 'Bangers', Impact, sans-serif; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 2px; color: ${catConfig.color || '#333'}; margin: 14px 0 6px; border-bottom: 1px dashed #ccc; padding-bottom: 4px; }
        p, li { font-family: 'Barriecito', sans-serif; font-size: 0.92rem; line-height: 1.7; }
        ul, ol { padding-left: 20px; }
        li { margin-bottom: 3px; }
        .variante { padding-left: 16px; margin-bottom: 4px; font-family: 'Barriecito', sans-serif; font-size: 0.92rem; }
        .variante::before { content: "💡 "; }
        .footer { margin-top: 24px; padding-top: 10px; border-top: 2px solid #333; font-size: 0.75rem; color: #999; text-align: center; font-family: 'Barriecito', sans-serif; }
        .material-tag { display: inline-block; padding: 2px 8px; margin: 2px; border: 1px solid #333; border-radius: 50px; font-family: 'Barriecito', sans-serif; font-size: 0.85rem; }
        @media print { body { padding: 10px; } }
      </style>
    </head>
    <body>
      <h1>Jeu #${game.id} : ${escapeHtml(game.title)}</h1>
      <div class="meta"><span class="badge">${game.categoryIcon} ${catConfig.name || game.categoryName}</span> &nbsp; ⏱️ ${game.duree || game.dureeMin + ' min'}</div>

      <h2>🎯 But du jeu</h2>
      <p>${escapeHtml(game.but)}</p>

      <h2>📚 Intentions pédagogiques (PFEQ)</h2>
      <ul>
        ${game.intentionsC1 ? `<li><strong>C1 :</strong> ${escapeHtml(game.intentionsC1)}</li>` : ''}
        ${game.intentionsC2 ? `<li><strong>C2 :</strong> ${escapeHtml(game.intentionsC2)}</li>` : ''}
        ${game.intentionsC3 ? `<li><strong>C3 :</strong> ${escapeHtml(game.intentionsC3)}</li>` : ''}
        ${game.transversales && game.transversales.length ? `<li><strong>CT :</strong> ${escapeHtml(game.transversales.join(', '))}</li>` : ''}
      </ul>

      <h2>🏐 Matériel</h2>
      <p>${(Array.isArray(game.materiel) ? game.materiel : [game.materiel]).map(m => `<span class="material-tag">${escapeHtml(m)}</span>`).join(' ')}</p>

      <h2>📐 Disposition</h2>
      <p>${escapeHtml(game.disposition)}</p>

      <h2>📋 Déroulement</h2>
      <ol>
        ${(Array.isArray(game.deroulement) ? game.deroulement : []).map(s => `<li>${escapeHtml(s)}</li>`).join('')}
      </ol>

      ${game.variantes && game.variantes.length ? `
        <h2>💡 Variantes</h2>
        ${game.variantes.map(v => `<div class="variante">${escapeHtml(v)}</div>`).join('')}
      ` : ''}

      <div class="footer">Répertoire de jeux EPS – PFEQ Primaire – 310 jeux</div>
    </body>
    </html>
  `);

  printWindow.document.close();
  setTimeout(() => printWindow.print(), 500);
}

// ============================================================
// UPDATE UI
// ============================================================
function updateResultsCount() {
  const count = state.filteredGames.length;
  dom.resultsCount.textContent = `${count} jeu${count > 1 ? 'x' : ''}`;

  // Active filters display
  const filters = [];
  if (state.activeCategory !== 'all') {
    const cat = CATEGORIES[state.activeCategory];
    filters.push(cat ? cat.name : state.activeCategory);
  }
  if (state.activeDuration !== 'all') {
    const labels = { '10': '≤ 15 min', '15': '15-20 min', '20': '20-30 min', '30': '30+ min' };
    filters.push(labels[state.activeDuration] || '');
  }
  if (state.activePfeq !== 'all') {
    filters.push(state.activePfeq);
  }
  if (state.activeMaterial !== 'all') {
    filters.push(state.activeMaterial);
  }
  if (state.searchQuery) {
    filters.push(`"${state.searchQuery}"`);
  }

  dom.activeFilters.textContent = filters.length > 0 ? `Filtres : ${filters.join(' • ')}` : '';
}

function updateCounts() {
  const countByCategory = {};
  state.games.forEach(g => {
    countByCategory[g.category] = (countByCategory[g.category] || 0) + 1;
  });

  const countEl = (id, cat) => {
    const el = document.getElementById(id);
    if (el) el.textContent = countByCategory[cat] || 0;
  };

  const allEl = document.getElementById('countAll');
  if (allEl) allEl.textContent = state.games.length;

  countEl('countBallons', 'ballons-chasseurs');
  countEl('countPoursuites', 'poursuites');
  countEl('countLudiques', 'ludiques');
  countEl('countCollectifs', 'collectifs');
  countEl('countOpposition', 'opposition');
  countEl('countDuels', 'duels');
}

// ============================================================
// RESET
// ============================================================
function resetAll() {
  // Reset state
  state.activeCategory = 'all';
  state.activeDuration = 'all';
  state.activePfeq = 'all';
  state.activeMaterial = 'all';
  state.searchQuery = '';
  state.sortBy = 'id';

  // Reset UI
  dom.searchInput.value = '';
  dom.searchClear.classList.remove('visible');
  dom.sortSelect.value = 'id';

  $$('.category-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  $$('#durationFilter .chip').forEach((c, i) => c.classList.toggle('active', i === 0));
  $$('#pfeqFilter .chip').forEach((c, i) => c.classList.toggle('active', i === 0));
  $$('#materialFilter .chip').forEach((c, i) => c.classList.toggle('active', i === 0));

  // Hide favorites if shown
  if (state.showFavorites) hideFavorites();

  applyFilters();
}

// ============================================================
// UTILITIES
// ============================================================
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
// LAUNCH
// ============================================================
document.addEventListener('DOMContentLoaded', init);
