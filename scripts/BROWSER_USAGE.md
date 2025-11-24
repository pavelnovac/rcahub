# Ghid de Utilizare - Script Browser Collector

## Instalare și Utilizare

### Pasul 1: Deschide Calculatorul BNM

1. Deschide browserul și navighează la: https://rca.bnm.md/online
2. Click pe butonul **"Calculează acum"** pentru a deschide calculatorul

### Pasul 2: Deschide Console-ul Browserului

- **Chrome/Edge**: Apasă `F12` sau `Ctrl+Shift+J` (Windows/Linux) / `Cmd+Option+J` (Mac)
- **Firefox**: Apasă `F12` sau `Ctrl+Shift+K` (Windows/Linux) / `Cmd+Option+K` (Mac)
- **Safari**: Activează "Develop" menu din Preferences → Advanced, apoi `Cmd+Option+C`

### Pasul 3: Copiază și Rulează Scriptul

1. Deschide fișierul `scripts/browser-collector.js`
2. Copiază tot conținutul scriptului
3. Lipește-l în consola browserului
4. Apasă `Enter`

### Pasul 4: Pornește Colectarea

În consolă, scrie:
```javascript
collectRcaData()
```

Sau decomentează linia `// main();` din script pentru auto-start.

## Funcționare

Scriptul va:
1. Colectează datele doar pentru **Bonus Malus clasa 7** (coeficient 1 - nu influențează prețul)
2. **NU modifică** câmpul Bonus Malus din formular - rămâne la clasa 7
3. Testează toate combinațiile de:
   - Vehicule (A1-A8, B1-B4, C1-C3, D1-D3, E1-E2)
   - Teritorii: **CH** (Municipiul Chișinău) și **AL** (Alte localități ale țării)
   - Categorii de persoane (PF_AGE_LT23_EXP_LT2, etc., PJ)
4. Modifică celelalte câmpuri din formular (fiecare modificare declanșează calculul automat)
5. Așteaptă ca rezultatele să fie calculate
6. Extrage prețurile pentru toate companiile
7. Salvează datele în localStorage

## Progres și Salvare

- Datele sunt salvate în localStorage după fiecare 10 combinații procesate
- Datele sunt salvate după fiecare clasă Bonus Malus completată
- Poți vedea progresul în consolă

## Exportarea Datelor

După ce colectarea este completă, pentru a descărca datele:

```javascript
exportData()
```

Aceasta va descărca un fișier JSON cu toate datele colectate.

## Structura Datelor Salvate

Datele sunt salvate în format (doar pentru Bonus Malus 7):
```json
{
  "BM_7": {
    "A1_CH_PF_AGE_LT23_EXP_LT2": {
      "ACORD GRUP S.A.": 4768.92,
      "ASTERRA GRUP S.A.": 3331.28,
      ...
    },
    "A1_AL_PF_AGE_LT23_EXP_LT2": {
      "ACORD GRUP S.A.": 2540.50,
      "ASTERRA GRUP S.A.": 1775.35,
      ...
    },
    ...
  }
}
```

**Notă**: 
- Toate datele sunt colectate cu Bonus Malus clasa 7 (coeficient 1), care nu influențează prețul
- Datele sunt colectate pentru ambele teritorii: **CH** (Chișinău) și **AL** (Alte localități)

## Configurare

Poți ajusta timpii de așteptare în script:

```javascript
const DELAY_BETWEEN_CHANGES = 2000; // 2 secunde între modificări
const DELAY_AFTER_CALCULATION = 3000; // 3 secunde după calcul
```

## Probleme Comune

### Scriptul nu pornește
- Asigură-te că ai deschis calculatorul (click pe "Calculează acum")
- Verifică că jQuery și Select2 sunt încărcate (ar trebui să fie automat)

### Nu se extrag prețuri
- Verifică că rezultatele sunt afișate în calculator
- Poți verifica manual dacă există elemente cu id-uri `puls1`, `puls2`, etc.

### Browserul se blochează
- Mărește `DELAY_BETWEEN_CHANGES` și `DELAY_AFTER_CALCULATION`
- Nu închide tab-ul browserului în timpul colectării

## Notă Importantă

- **Nu închide tab-ul browserului** în timpul colectării
- **Nu naviga către alte pagini** - datele sunt salvate doar în localStorage al paginii curente
- Procesul poate dura **câteva ore** datorită numărului mare de combinații (~3600)
- Poți **opri și relua** scriptul - datele sunt salvate periodic în localStorage

## Verificare Date

Pentru a verifica datele salvate:

```javascript
JSON.parse(localStorage.getItem('rca_bnm_premiums_collected'))
```

