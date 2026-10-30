# Muschio Industries

Sito statico pubblicato su GitHub Pages:

- [Homepage](./index.html)
- [Registro puntate](./registro-puntate/index.html)

## Aggiornare il registro

I dati delle giocate e i calcoli della dashboard si trovano in
[`js/dashboard.js`](./js/dashboard.js). Per aggiungere una giocata, inserire
un oggetto nell'array `bets` con:

```js
{
  initials: 'XX',
  date: '2026-11-20',
  received: '2026-10-30',
  place: 'Localita',
  lat: 45.000,
  lng: 10.000
}
```

Le coordinate sono utilizzate soltanto per la visualizzazione geografica.
Per luoghi privati usare coordinate approssimate oppure ometterle.

## Anteprima locale

Aprire `index.html` direttamente nel browser per la homepage. Per il registro
è preferibile un server statico locale, perché la mappa e le risorse esterne
vengono caricate via HTTPS.
