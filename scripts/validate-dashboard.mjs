import { readFile } from 'node:fs/promises';

const dashboard = await readFile('js/dashboard.js', 'utf8');
const page = await readFile('registro-puntate/index.html', 'utf8');

if (!dashboard.includes('const bets = [') || !dashboard.includes('window.places = places;')) {
  throw new Error('Dashboard data contract is incomplete.');
}

for (const requiredId of ['m-bets', 'calendar', 'donut', 'geo-map']) {
  if (!page.includes(`id="${requiredId}"`)) {
    throw new Error(`Missing dashboard element: ${requiredId}`);
  }
}

const entries = [...dashboard.matchAll(/\{ initials: '([^']+)', date: '([^']+)'/g)];
if (!entries.length) throw new Error('No bet entries found.');

for (const [, initials, date] of entries) {
  if (!/^[A-Z0-9]+$/.test(initials) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid bet entry: ${initials} / ${date}`);
  }
}

console.log(`Validated ${entries.length} bet entries.`);
