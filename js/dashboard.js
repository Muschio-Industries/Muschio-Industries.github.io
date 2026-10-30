'use strict';

const bets = [
  { initials: 'LT', date: '2026-11-16', received: '2026-10-28', place: 'Leno', lat: 45.367, lng: 10.2185 },
  { initials: 'LZ', date: '2026-11-18', received: '2026-10-28', place: 'Leno', lat: 45.367, lng: 10.2185 },
  { initials: 'CM', date: '2026-11-20', received: '2026-10-28', place: 'Leno', lat: 45.367, lng: 10.2185 },
  { initials: 'AZ', date: '2026-11-19', received: '2026-10-28', place: 'Cignano', lat: 45.37661, lng: 10.10579 },
  { initials: 'GS', date: '2026-11-08', received: '2026-10-28', place: 'Villaggio Sereno', lat: 45.51066, lng: 10.18992 },
  { initials: 'AZ2', date: '2026-11-19', received: '2026-10-28', place: 'Leno', lat: 45.367, lng: 10.2185 },
  { initials: 'SB', date: '2026-11-11', received: '2026-10-28', place: 'Manerbio', lat: 45.35612, lng: 10.13791 },
  { initials: 'ARZ', date: '2026-11-14', received: '2026-10-29', place: 'Orzinuovi', lat: 45.4049, lng: 9.9226 },
  { initials: 'EC', date: '2026-11-19', received: '2026-10-29', place: 'Caionvico (BS)', lat: 45.525306, lng: 10.288554 },
  { initials: 'BO', date: '2026-11-18', received: '2026-10-29', place: 'Cazzago San Martino', lat: 45.5796182, lng: 10.0258983 }
];

const stake = 3;
const due = Date.UTC(2026, 10, 16);
const day = 86400000;
const colors = { pre: '#07553d', due: '#d2b400', post: '#4b5961' };
const fmtDate = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const fmtToday = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
const eur = (value) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
const toTime = (date) => Date.parse(`${date}T00:00:00Z`);
const today = new Date();
const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
const daysToDue = Math.round((due - todayUtc) / day);
const offset = (date) => Math.round((toTime(date) - due) / day);
const prize = (date) => {
  const difference = offset(date);
  return difference >= -10 && difference <= 5 ? 1 : difference >= -14 && difference <= 14 ? 1.5 : 2;
};
const pirli = (value) => value === 1 ? '1 pirlo' : `${value.toLocaleString('it-IT')} pirli`;
const setText = (id, value) => {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
};

const grouped = bets.reduce((groups, bet) => {
  if (!groups[bet.date]) groups[bet.date] = [];
  groups[bet.date].push(bet);
  return groups;
}, {});
const total = bets.length * stake;
const gift = total * 0.2;
const sortedOffsets = bets.map((bet) => offset(bet.date)).sort((a, b) => a - b);
const medianOffset = sortedOffsets.length ? sortedOffsets[Math.floor(sortedOffsets.length / 2)] : 0;

setText('update-date', fmtToday.format(new Date()));
setText('m-bets', bets.length);
setText('m-dates', Object.keys(grouped).length);
setText('m-total', eur(total));
setText('m-gift', eur(gift));
setText('m-median', fmtDate.format(due + medianOffset * day));
setText('m-days', daysToDue);

const calendar = document.getElementById('calendar');
if (calendar) {
  calendar.replaceChildren();
  const firstDayOffset = (new Date(Date.UTC(2026, 10, 1)).getUTCDay() + 6) % 7;
  for (let index = 0; index < firstDayOffset; index += 1) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    empty.setAttribute('aria-hidden', 'true');
    calendar.append(empty);
  }
  for (let dateNumber = 1; dateNumber <= 30; dateNumber += 1) {
    const iso = `2026-11-${String(dateNumber).padStart(2, '0')}`;
    const cell = document.createElement('div');
    cell.className = `cal-day${dateNumber === 16 ? ' due' : ''}`;
    cell.setAttribute('aria-label', `${dateNumber} novembre 2026: ${(grouped[iso] || []).length} giocate`);
    const number = document.createElement('div');
    number.className = 'cal-number';
    number.textContent = dateNumber;
    const dots = document.createElement('div');
    dots.className = 'bet-dots';
    (grouped[iso] || []).forEach((bet) => {
      const dot = document.createElement('i');
      dot.className = 'bet-dot';
      dot.title = bet.initials;
      dot.setAttribute('aria-label', `Giocata di ${bet.initials}`);
      dots.append(dot);
    });
    cell.append(number, dots);
    calendar.append(cell);
  }
}

const counts = {
  pre: bets.filter((bet) => offset(bet.date) < 0).length,
  due: bets.filter((bet) => offset(bet.date) === 0).length,
  post: bets.filter((bet) => offset(bet.date) > 0).length
};
const percentage = (key) => bets.length ? counts[key] / bets.length * 100 : 0;
const donut = document.getElementById('donut');
if (donut) {
  donut.style.background = `conic-gradient(${colors.pre} 0 ${percentage('pre')}%,${colors.due} ${percentage('pre')}% ${percentage('pre') + percentage('due')}%,${colors.post} ${percentage('pre') + percentage('due')}% 100%)`;
}
setText('donut-total', bets.length);
const donutLegend = document.getElementById('donut-legend');
if (donutLegend) {
  donutLegend.innerHTML = [['pre', 'Prima'], ['due', 'Sulla DPP'], ['post', 'Dopo']]
    .map(([key, label]) => `<div class="legend-row"><i style="background:${colors[key]}"></i><span>${label}<small> · ${Math.round(percentage(key))}%</small></span><b>${counts[key]}</b></div>`)
    .join('');
}

function bars(target, items, colorClass = '') {
  const container = document.getElementById(target);
  if (!container) return;
  const maxValue = Math.max(1, ...items.map((item) => item.value));
  container.innerHTML = items.map((item) => `<div class="bar-row"><span class="bar-label">${item.label}</span><div class="bar-track"><div class="bar-fill ${item.className || colorClass}" style="width:${item.value / maxValue * 100}%"></div></div><b class="bar-value">${item.display ?? item.value}</b></div>`).join('');
}

const popular = Object.entries(grouped)
  .map(([date, list]) => ({ label: fmtDate.format(toTime(date)), value: list.length }))
  .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
bars('popular-bars', popular);
bars('prize-bars', [1, 1.5, 2].map((value, index) => ({
  label: pirli(value),
  value: bets.filter((bet) => prize(bet.date) === value).length,
  className: index === 0 ? '' : index === 1 ? 'gold' : 'coral'
})));

setText('money-gift', eur(gift));
setText('money-pool', eur(total - gift));
const mean = sortedOffsets.reduce((sum, value) => sum + value, 0) / Math.max(1, bets.length);
const uniquePercentage = Math.round(Object.keys(grouped).length / Math.max(1, bets.length) * 100);
const extreme = sortedOffsets.reduce((current, value) => Math.abs(value) > Math.abs(current) ? value : current, 0);
const maxWinners = Math.max(0, ...Object.values(grouped).map((list) => list.length));
const insights = document.getElementById('insights');
if (insights) {
  insights.innerHTML = `<div class="insight"><strong>${mean > 0 ? '+' : ''}${mean.toLocaleString('it-IT', { maximumFractionDigits: 1 })} gg</strong><span>Scostamento medio</span></div><div class="insight"><strong>${uniquePercentage}%</strong><span>Date uniche sul totale</span></div><div class="insight"><strong>${extreme > 0 ? '+' : ''}${extreme} gg</strong><span>Pronostico più estremo</span></div><div class="insight"><strong>${maxWinners}</strong><span>Massimo vincitori sulla stessa data</span></div>`;
}
bars('exposure-bars', popular.map((item) => ({ ...item, display: `${item.value} ×` })));

const placeGroups = bets.filter((bet) => Number.isFinite(bet.lat) && Number.isFinite(bet.lng))
  .reduce((groups, bet) => {
    groups[bet.place] ??= { place: bet.place, lat: bet.lat, lng: bet.lng, count: 0 };
    groups[bet.place].count += 1;
    return groups;
  }, {});
const places = Object.values(placeGroups);
const topPlace = places.slice().sort((a, b) => b.count - a.count)[0];
setText('geo-places', places.length);
setText('geo-top', topPlace ? `${topPlace.place} · ${topPlace.count}` : 'Nessuna località');

function geoDistance(a, b) {
  const radians = Math.PI / 180;
  const latitudeDifference = (b.lat - a.lat) * radians;
  const longitudeDifference = (b.lng - a.lng) * radians;
  const value = Math.sin(latitudeDifference / 2) ** 2 + Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin(longitudeDifference / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

let farthest = 0;
for (let first = 0; first < places.length; first += 1) {
  for (let second = first + 1; second < places.length; second += 1) {
    farthest = Math.max(farthest, geoDistance(places[first], places[second]));
  }
}
setText('geo-distance', `${Math.round(farthest)} km`);

window.bets = bets;
window.places = places;
