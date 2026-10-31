const nf = new Intl.NumberFormat('it-IT');
const df = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
const colors = ['#25c3d9','#f64f9b','#b8d93b','#f5c84b','#f47b43','#6675d1','#65b67a','#9f72d8'];
let overview;
let images;
let countriesChart;

const $ = (id) => document.getElementById(id);
const formatDate = (value) => value ? df.format(new Date(`${value}T12:00:00`)) : '-';
const setText = (id, value) => { $(id).textContent = value; };

Chart.defaults.font.family = 'DM Sans, sans-serif';
Chart.defaults.color = '#66708c';
Chart.defaults.borderColor = '#e3e7f0';

function horizontalChart(canvas, rows, color = '#25c3d9') {
  return new Chart(canvas, { type: 'bar', data: { labels: rows.map(r => r[0]), datasets: [{ data: rows.map(r => r[1]), backgroundColor: color, borderRadius: 2 }] }, options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${nf.format(c.raw)} apparizioni` } } }, scales: { x: { beginAtZero: true, grid: { color: '#e6e9f1' } }, y: { grid: { display: false } } } } });
}

function yearBins(rows, size = 5) {
  const bins = new Map();
  rows.forEach(([year, count]) => { if (!/^\d{4}$/.test(year)) return; const start = Math.floor(Number(year) / size) * size; bins.set(start, (bins.get(start) || 0) + count); });
  return [...bins.entries()].sort((a,b) => a[0]-b[0]).map(([start,count]) => [`${start}-${start+size-1}`, count]);
}

function renderOverview() {
  const s = overview.summary;
  setText('hero-images', nf.format(s.unique_images));
  setText('metric-appearances', nf.format(s.appearance_rows));
  setText('metric-countries', nf.format(s.countries));
  setText('metric-repeats', nf.format(s.repeated_images));
  setText('metric-max', `${s.max_repetitions} volte`);
  setText('freshness', `Archivio aggiornato al ${formatDate(overview.latest_game_date)}`);
}

function renderCharts() {
  countriesChart = horizontalChart($('countries-chart'), overview.countries.slice(0, 20));
  $('country-limit').addEventListener('change', (event) => { const rows = overview.countries.slice(0, Number(event.target.value)); countriesChart.data.labels = rows.map(r => r[0]); countriesChart.data.datasets[0].data = rows.map(r => r[1]); countriesChart.update(); });

  new Chart($('continents-chart'), { type: 'doughnut', data: { labels: overview.continents.map(r => r[0]), datasets: [{ data: overview.continents.map(r => r[1]), backgroundColor: colors, borderWidth: 3, borderColor: '#fff' }] }, options: { maintainAspectRatio: false, cutout: '66%', plugins: { legend: { display: false } } } });
  $('continent-legend').innerHTML = overview.continents.map((r,i) => `<span><i style="background:${colors[i%colors.length]}"></i>${r[0]}: ${nf.format(r[1])}</span>`).join('');

  const bins = yearBins(overview.years);
  new Chart($('years-chart'), { type: 'bar', data: { labels: bins.map(r => r[0]), datasets: [{ data: bins.map(r => r[1]), backgroundColor: bins.map((_,i) => i % 5 === 0 ? '#f64f9b' : '#10162f'), borderRadius: 2 }] }, options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { maxRotation: 60, minRotation: 60, autoSkip: true, maxTicksLimit: 30 } }, y: { beginAtZero: true } } } });

  const weeks = overview.weekly_repetition_average.slice(-26);
  new Chart($('repeats-chart'), { type: 'line', data: { labels: weeks.map(r => r.week), datasets: [{ data: weeks.map(r => r.avg_repeated_before), borderColor: '#f64f9b', backgroundColor: 'rgba(246,79,155,.12)', pointBackgroundColor: '#f64f9b', pointRadius: 3, tension: .28, fill: true }] }, options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${Number(c.raw).toFixed(2)} immagini al giorno` } } }, scales: { y: { beginAtZero: true, suggestedMax: 5, ticks: { stepSize: 1 } }, x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45 } } } } });
}

function renderRecentRepeats() {
  const rows = overview.daily_repetitions.slice(-30);
  const repeated = rows.reduce((sum,r) => sum + r.repeated_before, 0);
  const total = rows.reduce((sum,r) => sum + r.total_images, 0);
  setText('last-month-average', (repeated / rows.length).toFixed(2));
  setText('last-month-share', `${((repeated / total) * 100).toFixed(2)}%`);
}

function renderItaly() {
  const italy = overview.italy;
  setText('italy-total', nf.format(italy.appearances));
  setText('italy-detail', `${nf.format(italy.unique_images)} immagini uniche, ${nf.format(italy.repeated_images)} gia riutilizzate.`);
  horizontalChart($('italy-chart'), italy.cities.slice(0, 12), '#f47b43');
  $('city-list').innerHTML = italy.cities.map(([city,count]) => `<span>${city} <strong>${count}</strong></span>`).join('');
}

function renderMap() {
  const map = L.map('density-map', { scrollWheelZoom: false, minZoom: 2 }).setView([20, 8], 2);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19 }).addTo(map);
  const points = images.filter(r => Number.isFinite(Number(r.lat)) && Number.isFinite(Number(r.lng))).map(r => [Number(r.lat), Number(r.lng), .55]);
  L.heatLayer(points, { radius: 18, blur: 16, minOpacity: .35, gradient: { .15:'#25c3d9', .4:'#b8d93b', .65:'#f5c84b', .82:'#f47b43', 1:'#f64f9b' } }).addTo(map);
}

function renderSearch(date) {
  const rows = images.filter(row => row.date === date).sort((a,b) => a.round-b.round);
  $('search-results').innerHTML = '';
  if (!rows.length) { setText('search-message', `Nessuna partita archiviata per il ${formatDate(date)}.`); return; }
  setText('search-message', `${rows.length} immagini nella partita del ${formatDate(date)}.`);
  $('search-results').innerHTML = rows.map(row => {
    const previous = row.appearances.filter(item => item.date < row.date);
    const repeated = previous.length > 0;
    const dates = row.appearances.map(item => formatDate(item.date)).join(' · ');
    return `<article class="result-card"><img class="result-image" src="${row.url || ''}" alt="${row.city || row.country || 'Immagine WhenTaken'}" loading="lazy"><div class="result-body"><h3>${row.city || 'Localita non indicata'}</h3><p class="result-meta">${row.country || 'Paese non indicato'} · ${row.year || 'anno ignoto'}</p><span class="repeat-badge ${repeated ? '' : 'new'}">${repeated ? 'Gia apparsa' : 'Prima apparizione'}</span><div class="result-dates">${dates}</div></div></article>`;
  }).join('');
}

async function init() {
  try {
    [overview, images] = await Promise.all([fetch('./data/overview.json').then(r => { if(!r.ok) throw new Error('overview'); return r.json(); }), fetch('./data/images.json').then(r => { if(!r.ok) throw new Error('images'); return r.json(); })]);
    renderOverview(); renderCharts(); renderRecentRepeats(); renderItaly(); renderMap();
    $('game-date').min = images[0]?.date || ''; $('game-date').max = overview.latest_game_date; $('game-date').value = overview.latest_game_date; renderSearch(overview.latest_game_date);
  } catch (error) { setText('freshness', 'Dati non disponibili. Esegui prepare_site.py prima della pubblicazione.'); console.error(error); }
}

$('date-form').addEventListener('submit', event => { event.preventDefault(); renderSearch($('game-date').value); });
$('menu-button').addEventListener('click', () => { const nav = $('main-nav'); const open = nav.classList.toggle('open'); $('menu-button').setAttribute('aria-expanded', String(open)); });
document.querySelectorAll('#main-nav a').forEach(link => link.addEventListener('click', () => $('main-nav').classList.remove('open')));
init();
