# Ghid pentru Colectarea Datelor din Calculatorul BNM

## Pași pentru Completarea Scriptului

### 1. Analiza Structurii Formularului

Pentru a completa scriptul, este necesar să:

1. **Deschideți calculatorul BNM** în browser: https://rca.bnm.md/online
2. **Deschideți Developer Tools** (F12)
3. **Analizați structura formularului**:
   - Identificați selectoarele CSS pentru fiecare câmp
   - Identificați numele câmpurilor din formular
   - Identificați butonul de submit

### 2. Identificarea API-ului

1. **Deschideți tab-ul Network** în Developer Tools
2. **Completați formularul manual** cu o configurație de test
3. **Click pe "Calculează"** sau butonul de submit
4. **Analizați cererea POST** către `/online`:
   - Verificați payload-ul trimis
   - Verificați răspunsul primit
   - Identificați structura datelor

### 3. Maparea Câmpurilor

Următoarele câmpuri trebuie mapate în script:

#### Tip Persoană
- Fizică: `input[value="1"]` sau selector similar
- Juridică: `input[value="2"]` sau selector similar

#### Teritoriu
- Moldova (CH): `input[value="1"]` sau selector similar  
- Alte țări (AL): `input[value="2"]` sau selector similar

#### Vârstă (doar pentru PF)
- "Până la 23 de ani inclu iv"
- "De la 23 ani"

#### Vechime (doar pentru PF)
- "Până la 2 de ani inclu iv"
- "De la 2 ani"

#### Bonus Malus
- Dropdown cu clase 0-17
- Selector: `span[aria-label*="Cla a X"]` sau similar

#### Tip Vehicul
- Dropdown cu opțiuni: "Autoturi me", "Microbuze", etc.

#### Capacitate/Parametri Vehicul
- Dropdown cu opțiuni specifice fiecărui tip de vehicul

### 4. Extragerea Rezultatelor

După submit, rezultatele pot fi:
- Într-un tabel HTML cu companiile și prețurile
- Într-un obiect JSON în răspunsul API
- Într-o listă de elemente DOM

Identificați selectorul pentru:
- Lista de companii
- Prețurile asociate fiecărei companii

### 5. Completarea Scriptului

Odată ce aveți toate informațiile:

1. **Actualizați funcția `fillCalculatorForm`** cu selectoarele corecte
2. **Actualizați funcția `extractPrices`** cu logica de extragere
3. **Testați scriptul** cu o singură configurație
4. **Rulați scriptul complet** pentru toate combinațiile

### 6. Optimizări

- **Rate limiting**: Adăugați pauze între cereri (1-2 secunde)
- **Error handling**: Gestionați erorile și reîncercați dacă e necesar
- **Progress tracking**: Salvați progresul periodic
- **Resume capability**: Permiteți reluarea de la ultima configurație procesată

## Exemplu de Structură API (de verificat)

```javascript
// Payload posibil pentru cererea POST
{
  personType: "1", // 1 = fizica, 2 = juridica
  territory: "1", // 1 = CH, 2 = AL
  age: "1", // Opțiuni de vârstă
  experience: "1", // Opțiuni de vechime
  bonusMalus: "7", // Clasa Bonus Malus
  vehicleType: "1", // Tip vehicul
  vehicleParams: {...} // Parametri specifici vehiculului
}

// Răspuns posibil
{
  companies: [
    { name: "Company 1", price: 3901.23 },
    { name: "Company 2", price: 3850.50 },
    ...
  ]
}
```

## Testare Incrementală

1. Testați cu o singură clasă Bonus Malus (ex: BM7)
2. Testați cu un singur tip de vehicul (ex: A1)
3. Testați cu o singură categorie de persoană (ex: PF_AGE_LT23_EXP_LT2)
4. Extindeți treptat la toate combinațiile

## Note Importante

- **Respectați rate limits**: Nu faceți prea multe cereri simultan
- **Salvați progresul**: Scriptul salvează după fiecare clasă BM
- **Verificați datele**: Validați că prețurile extrase sunt corecte
- **Backup**: Păstrați backup-uri ale datelor colectate

