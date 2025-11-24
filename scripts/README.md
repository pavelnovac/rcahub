# Scripturi pentru Colectarea Datelor RCA

## Descriere

Acest director conține scripturi pentru automatizarea colectării prețurilor RCA de la calculatorul BNM pentru toate clasele Bonus Malus (0-17).

## Proces

Calculatorul BNM permite calcularea primei de asigurare RCA pentru diferite configurații:
- **Bonus Malus**: Clase de la 0 la 17 (clasa 7 = coeficient 1, nu influențează prețul)
- **Vehicule**: A1-A8, B1-B4, C1-C3, D1-D3, E1-E2
- **Teritorii**: CH (Chișinău și raioanele apropiate), AL (Alte localități)
- **Categorii persoane**: 
  - PF_AGE_LT23_EXP_LT2 (Persoană fizică < 23 ani, vechime < 2 ani)
  - PF_AGE_LT23_EXP_GE2 (Persoană fizică < 23 ani, vechime ≥ 2 ani)
  - PF_AGE_GE23_EXP_LT2 (Persoană fizică ≥ 23 ani, vechime < 2 ani)
  - PF_AGE_GE23_EXP_GE2 (Persoană fizică ≥ 23 ani, vechime ≥ 2 ani)
  - PJ (Persoană juridică)

## Utilizare

### Instalare dependențe

```bash
npm install
```

### Rulare script

```bash
npm run collect-premiums
```

## Structura Datelor

Datele colectate vor fi salvate în directorul `data/` cu următoarea structură:

```
data/
  ├── bnm_premiums_bm0.json
  ├── bnm_premiums_bm1.json
  ├── ...
  ├── bnm_premiums_bm17.json
  └── bnm_all_premiums.json (toate datele)
```

Fiecare fișier JSON conține prețurile pentru toate companiile de asigurări pentru clasa respectivă de Bonus Malus.

## Format Date

Fiecare entry în fișierul JSON are următoarea structură:

```json
{
  "A1_CH_PF_AGE_LT23_EXP_LT2": {
    "company1": 3901.23,
    "company2": 3850.50,
    ...
  },
  ...
}
```

Unde:
- Cheia este `cell_id` în format `{vehicle_id}_{territory_id}_{person_category_id}`
- Valoarea este un obiect cu prețurile pentru fiecare companie

## Note

- Scriptul face pauze între cereri pentru a nu suprasolicita serverul BNM
- Progresul este salvat după fiecare clasă Bonus Malus pentru a evita pierderea datelor
- Procesul poate dura câteva ore datorită numărului mare de combinații (18 clase BM × ~20 vehicule × 2 teritorii × 5 categorii = ~3600 de cereri)

