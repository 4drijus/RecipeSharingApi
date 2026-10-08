# Recipe Sharing API

ASP.NET Core Web API projektas, skirtas receptų dalijimosi sistemai. Projektas įgyvendintas naudojant C#, .NET 9, Entity Framework Core ir MySQL.

Projektas sukurtas atliekant KTU dalyko **„Saityno taikomųjų programų projektavimas“** laboratorinius darbus.

---

## Naudotos technologijos

* **C#**
* **.NET 9**
* **ASP.NET Core Web API**
* **Entity Framework Core**
* **MySQL**
* **JWT (JSON Web Token)**
* **ASP.NET Core Authentication / Authorization**
* **Microsoft Identity PasswordHasher**
* **Postman**
* **OpenAPI**
* **Git / GitHub**

---

# Lab 1 – REST API

## Projekto paskirtis

API skirta receptų kūrimui, peržiūrai, redagavimui ir trynimui bei receptų susiejimui su kategorijomis ir ingredientais.

API palaiko:

* CRUD operacijas;
* puslapiavimą;
* filtravimą pagal kategoriją;
* hierarchinį recepto informacijos gavimą;
* HATEOAS nuorodas;
* duomenų validaciją;
* tinkamus HTTP atsakymo kodus;
* OpenAPI dokumentaciją;
* automatizuotus Postman testus.

---

# Lab 2 – JWT autentifikacija ir autorizacija

Ant Lab 1 pagrindu sukurta autentifikacijos ir autorizacijos sistema naudojant **JWT**.

Įgyvendintos funkcijos:

* vartotojo registracija;
* vartotojo prisijungimas;
* slaptažodžių hashavimas;
* JWT Access Token generavimas;
* JWT Refresh Token generavimas;
* Access Token galiojimo laikas – 15 minučių;
* Refresh Token galiojimo laikas – 7 dienos;
* Refresh Token rotacija;
* atsijungimas ir Refresh Token atšaukimas;
* vartotojo informacijos gavimas iš JWT;
* autorizacija pagal vartotojo rolę;
* autorizacija pagal resurso savininką;
* dvi autentifikuotų vartotojų rolės: `User` ir `Admin`;
* apsaugoti API endpointai.

Sistemoje taip pat yra neprisijungęs naudotojas (**Guest**). Guest nėra duomenų bazėje saugoma rolė ir nėra JWT `Role` claim. Tai naudotojas, kuris nėra autentifikuotas.

---

## Autentifikacijos procesas

### Registracija

Naujas vartotojas registruojamas:

```http
POST /api/auth/register
```

Registracijos metu perduodami:

```json
{
  "username": "user",
  "email": "user@example.com",
  "password": "password123"
}
```

Naujai užregistruotam vartotojui automatiškai priskiriama rolė `User`.

Vartotojas registracijos metu negali pasirinkti `Admin` rolės.

### Prisijungimas

Prisijungimas atliekamas:

```http
POST /api/auth/login
```

Sėkmingo prisijungimo metu grąžinami:

* Access Token;
* Refresh Token;
* Access Token galiojimo laikas.

Access Token JWT viduje saugoma:

* vartotojo ID;
* vartotojo vardas;
* vartotojo rolė.

### Access Token

Access Token naudojamas prieigai prie apsaugotų endpointų.

Užklausoje perduodama:

```text
Authorization: Bearer <AccessToken>
```

Access Token galioja 15 minučių.

### Refresh Token

Pasibaigus Access Token galiojimui, naujas Access Token gaunamas naudojant:

```http
POST /api/auth/refresh
```

Refresh Token saugomas duomenų bazėje ir turi:

* sukūrimo datą;
* galiojimo datą;
* atšaukimo datą;
* vartotojo ID.

Naudojama **Refresh Token rotacija**. Panaudotas Refresh Token atšaukiamas ir sugeneruojamas naujas Refresh Token.

Refresh Token galioja 7 dienas.

### Atsijungimas

Atsijungimas atliekamas:

```http
POST /api/auth/logout
```

Atsijungimo metu Refresh Token pažymimas kaip atšauktas (`RevokedAt`).

Atšauktas Refresh Token nebegali būti naudojamas naujam Access Token gauti.

### Prisijungusio vartotojo informacija

Informacija apie dabartinį vartotoją gaunama:

```http
GET /api/auth/me
```

Endpointas grąžina:

* vartotojo ID;
* vartotojo vardą;
* vartotojo rolę.

---

# Vartotojų tipai ir rolės

Sistemoje yra trys naudotojų tipai:

| Tipas   | JWT rolė | Aprašymas                |
| ------- | -------- | ------------------------ |
| `Guest` | –        | Neprisijungęs naudotojas |
| `User`  | `User`   | Registruotas naudotojas  |
| `Admin` | `Admin`  | Administratorius         |

`Guest` nėra duomenų bazėje saugoma rolė. Jis neturi JWT tokeno ir gali naudotis tik viešais endpointais.

## Teisių matrica

| Funkcija                                    | Guest | User | Admin |
| ------------------------------------------- | ----: | ---: | ----: |
| Pagrindinis puslapis / vieša API prieiga    |     ✅ |    ✅ |     ✅ |
| Peržiūrėti kategorijas                      |     ✅ |    ✅ |     ✅ |
| Peržiūrėti receptus                         |     ✅ |    ✅ |     ✅ |
| Filtruoti receptus                          |     ✅ |    ✅ |     ✅ |
| Peržiūrėti recepto detales                  |     ✅ |    ✅ |     ✅ |
| Registracija                                |     ✅ |    – |     – |
| Prisijungimas                               |     ✅ |    – |     – |
| Atsijungimas                                |     ❌ |    ✅ |     ✅ |
| Kurti receptą                               |     ❌ |    ✅ |     ✅ |
| Redaguoti savo receptą                      |     ❌ |    ✅ |     ✅ |
| Trinti savo receptą                         |     ❌ |    ✅ |     ✅ |
| Redaguoti kito naudotojo receptą            |     ❌ |    ❌ |     ✅ |
| Trinti kito naudotojo receptą               |     ❌ |    ❌ |     ✅ |
| Valdyti savo recepto ingredientus           |     ❌ |    ✅ |     ✅ |
| Valdyti kito naudotojo recepto ingredientus |     ❌ |    ❌ |     ✅ |
| Kurti kategoriją                            |     ❌ |    ❌ |     ✅ |
| Redaguoti kategoriją                        |     ❌ |    ❌ |     ✅ |
| Trinti kategoriją                           |     ❌ |    ❌ |     ✅ |
| Peržiūrėti naudotojus                       |     ❌ |    ❌ |     ✅ |
| Valdyti naudotojų paskyras                  |     ❌ |    ❌ |     ✅ |

Neprisijungęs vartotojas prie apsaugoto endpointo gauna:

```text
401 Unauthorized
```

Prisijungęs vartotojas, neturintis reikiamos rolės, gauna:

```text
403 Forbidden
```

---

# Autorizacijos endpointai

## User prieiga

```http
GET /api/authorization/user
```

Prieinama rolėms:

* `User`
* `Admin`

## Admin prieiga

```http
GET /api/authorization/admin
```

Prieinama tik:

* `Admin`

Šie endpointai naudojami role-based authorization veikimui patikrinti.

---

# Ownership-based autorizacija

Receptas turi vartotoją-savininką per `UserId`.

Paprastas `User` gali:

* redaguoti savo receptą;
* ištrinti savo receptą;
* pridėti ingredientus prie savo recepto;
* redaguoti savo recepto ingredientus;
* ištrinti savo recepto ingredientus.

Paprastas `User` negali:

* redaguoti kito vartotojo recepto;
* ištrinti kito vartotojo recepto;
* valdyti kito vartotojo recepto ingredientų.

Tokiu atveju grąžinamas:

```text
403 Forbidden
```

`Admin` gali:

* redaguoti bet kurio vartotojo receptą;
* ištrinti bet kurio vartotojo receptą;
* valdyti bet kurio recepto ingredientus.

Tai leidžia vienu metu naudoti:

* role-based authorization;
* ID / ownership-based authorization.

---

# Domeno objektai

API naudojami penki pagrindiniai domeno objektai:

* `Category`
* `Recipe`
* `RecipeIngredient`
* `User`
* `RefreshToken`

`RecipeIngredient` yra susietas su konkrečiu receptu ir nėra bendras ingredientų katalogas.

`User` saugo registruoto vartotojo informaciją, įskaitant vartotojo vardą, el. paštą, slaptažodžio hash ir rolę.

`RefreshToken` naudojamas vartotojo sesijai pratęsti pasibaigus Access Token galiojimui. Refresh Token saugomas duomenų bazėje kartu su sukūrimo, galiojimo ir atšaukimo informacija.

## Objektų ryšiai

```text
Category 1 ─── N Recipe

Recipe 1 ─── N RecipeIngredient

User 1 ─── N Recipe

User 1 ─── N RefreshToken
```

Receptas turi vartotoją-savininką per `UserId`.

Tai naudojama ownership-based autorizacijai: paprastas `User` gali redaguoti ir trinti tik savo sukurtus receptus.

---

# Duomenų bazė

Naudojama **MySQL** duomenų bazė.

Pagrindinės lentelės:

```text
Categories
Recipes
RecipeIngredients
Users
RefreshTokens
__EFMigrationsHistory
```

Pagrindiniai ryšiai:

```text
Categories
    │
    └── Recipes
            │
            └── RecipeIngredients

Users
    ├── Recipes
    └── RefreshTokens
```

`Recipes.UserId` nurodo vartotoją, kuris sukūrė receptą.

`RefreshTokens.UserId` nurodo vartotoją, kuriam priklauso Refresh Token.
`Recipes.ImageUrl` ir `Categories.ImageUrl` saugo Cloudinary nuotraukų URL;
pačių paveikslėlių dvejetainiai duomenys DB nelaikomi.

Duomenų bazės struktūra valdoma naudojant Entity Framework Core migracijas.

Migracijos kuriamos ir vykdomos naudojant:

```bash
dotnet ef migrations add <MigrationName>
dotnet ef database update
```

---

# API endpointai

## Authentication

| Method | Endpoint             | Aprašymas                        | Autorizacija |
| ------ | -------------------- | -------------------------------- | ------------ |
| POST   | `/api/auth/register` | Registracija                     | Nereikalinga |
| POST   | `/api/auth/login`    | Prisijungimas                    | Nereikalinga |
| POST   | `/api/auth/refresh`  | Access Token atnaujinimas        | Nereikalinga |
| POST   | `/api/auth/logout`   | Atsijungimas                     | Nereikalinga |
| GET    | `/api/auth/me`       | Dabartinio vartotojo informacija | Reikalinga   |

## Authorization

| Method | Endpoint                   | Reikalinga rolė |
| ------ | -------------------------- | --------------- |
| GET    | `/api/authorization/user`  | `User`, `Admin` |
| GET    | `/api/authorization/admin` | `Admin`         |

## Users

| Method | Endpoint          | Aprašymas                | Autorizacija |
| ------ | ----------------- | ------------------------ | ------------ |
| GET    | `/api/users`      | Gauti naudotojų sąrašą   | `Admin`      |
| GET    | `/api/users/{id}` | Gauti konkretų naudotoją | `Admin`      |
| DELETE | `/api/users/{id}` | Ištrinti naudotoją       | `Admin`      |

Slaptažodžio hash naudotojų endpointuose negrąžinamas.
Frontend administratoriaus navigacijoje yra „Naudotojai“ skiltis: joje galima peržiūrėti
paskyrų sąrašą, atverti naudotojo informaciją ir pašalinti kito naudotojo paskyrą.
Pašalinus paskyrą, jos receptai lieka viešame kataloge be savininko.
Sąsajos sėkmės ir klaidų pranešimai pateikiami puslapyje, o receptų sąrašai po pakeitimų
atnaujinami automatiškai.

## Categories

| Method | Endpoint               | Aprašymas                  | Autorizacija |
| ------ | ---------------------- | -------------------------- | ------------ |
| GET    | `/api/categories`      | Gauti kategorijas          | Nereikalinga |
| GET    | `/api/categories/{id}` | Gauti konkrečią kategoriją | Nereikalinga |
| POST   | `/api/categories`      | Sukurti kategoriją         | `Admin`      |
| POST   | `/api/categories/with-image` | Sukurti kategoriją su nuotrauka | `Admin` |
| PUT    | `/api/categories/{id}` | Atnaujinti kategoriją      | `Admin`      |
| POST   | `/api/categories/{id}/image` | Įkelti arba pakeisti nuotrauką | `Admin` |
| DELETE | `/api/categories/{id}` | Ištrinti kategoriją        | `Admin`      |

## Recipes

| Method | Endpoint                    | Aprašymas                                    | Autorizacija |
| ------ | --------------------------- | -------------------------------------------- | ------------ |
| GET    | `/api/recipes`              | Gauti receptus                               | Nereikalinga |
| GET    | `/api/recipes/{id}`         | Gauti receptą                                | Nereikalinga |
| GET    | `/api/recipes/{id}/details` | Gauti receptą su kategorija ir ingredientais | Nereikalinga |
| POST   | `/api/recipes`              | Sukurti receptą                              | Reikalinga   |
| POST   | `/api/recipes/with-image`   | Sukurti receptą su nuotrauka                 | Reikalinga   |
| PUT    | `/api/recipes/{id}`         | Atnaujinti receptą                           | Reikalinga   |
| POST   | `/api/recipes/{id}/image`   | Įkelti arba pakeisti nuotrauką               | Savininkas arba `Admin` |
| DELETE | `/api/recipes/{id}`         | Ištrinti receptą                             | Reikalinga   |

## Recipe ingredients

| Method | Endpoint                                   | Aprašymas                  | Autorizacija |
| ------ | ------------------------------------------ | -------------------------- | ------------ |
| GET    | `/api/recipes/{recipeId}/ingredients`      | Gauti recepto ingredientus | Nereikalinga |
| GET    | `/api/recipes/{recipeId}/ingredients/{id}` | Gauti konkretų ingredientą | Nereikalinga |
| POST   | `/api/recipes/{recipeId}/ingredients`      | Pridėti ingredientą        | Reikalinga   |
| PUT    | `/api/recipes/{recipeId}/ingredients/{id}` | Atnaujinti ingredientą     | Reikalinga   |
| DELETE | `/api/recipes/{recipeId}/ingredients/{id}` | Ištrinti ingredientą       | Reikalinga   |

Ingredientų POST, PUT ir DELETE operacijose `User` gali valdyti tik savo receptų ingredientus, o `Admin` gali valdyti bet kurio recepto ingredientus.

---

# Receptų puslapiavimas ir filtravimas

Receptų sąrašas palaiko puslapiavimą:

```http
GET /api/recipes?page=1&pageSize=10
```

Taip pat galima filtruoti pagal kategoriją:

```http
GET /api/recipes?page=1&pageSize=10&categoryId=1
```

Atsakyme pateikiama:

* dabartinio puslapio numeris;
* puslapio dydis;
* bendras įrašų skaičius;
* bendras puslapių skaičius;
* receptų sąrašas.

`pageSize` reikšmė ribojama nuo 1 iki 100.

---

# Hierarchinis resursas

Norint gauti išsamią recepto informaciją:

```http
GET /api/recipes/{id}/details
```

Grąžinama:

* recepto informacija;
* kategorija;
* ingredientai;
* HATEOAS nuorodos.

Pavyzdinė struktūra:

```json
{
  "id": 1,
  "title": "Pasta",
  "description": "Simple pasta recipe",
  "instructions": "Cook pasta...",
  "preparationTime": 20,
  "category": {
    "id": 1,
    "name": "Main dishes",
    "description": "Main dishes"
  },
  "ingredients": [],
  "links": [
    {
      "rel": "self",
      "href": "/api/recipes/1/details"
    },
    {
      "rel": "recipe",
      "href": "/api/recipes/1"
    },
    {
      "rel": "category",
      "href": "/api/categories/1"
    },
    {
      "rel": "ingredients",
      "href": "/api/recipes/1/ingredients"
    },
    {
      "rel": "categoryIngredients",
      "href": "/api/categories/1/recipes/1/ingredients"
    }
  ]
}
```

Ingredientus taip pat galima gauti URL, kuris apriboja užklausą visais trimis
domeno objektais — kategorija, receptu ir ingredientais:

```http
GET /api/categories/{categoryId}/recipes/{recipeId}/ingredients
```

Receptas turi priklausyti nurodytai kategorijai. Jei receptas nerastas arba
nepriklauso tai kategorijai, API grąžina `404 Not Found`. Atsakyme pateikiamas
nurodyto recepto ingredientų sąrašas JSON formatu.

---

# HATEOAS

API pateikia HATEOAS nuorodas hierarchiniame recepto atsakyme.

Naudojami ryšių tipai:

* `self`
* `recipe`
* `category`
* `ingredients`

Tai leidžia klientui pagal gautą resursą rasti susijusius API endpointus.

---

# HTTP atsakymo kodai

API naudoja standartinius HTTP status kodus.

| Kodas              | Reikšmė                                        |
| ------------------ | ---------------------------------------------- |
| `200 OK`           | Užklausa įvykdyta sėkmingai                    |
| `201 Created`      | Resursas sukurtas                              |
| `204 No Content`   | Operacija įvykdyta be atsakymo turinio         |
| `400 Bad Request`  | Neteisingi užklausos duomenys                  |
| `401 Unauthorized` | Vartotojas neprisijungęs arba token netinkamas |
| `403 Forbidden`    | Vartotojas neturi reikiamų teisių              |
| `404 Not Found`    | Resursas nerastas                              |

---

# Duomenų validacija

API tikrina:

* ar egzistuoja nurodyta kategorija;
* ar egzistuoja prašomas receptas;
* ar egzistuoja prašomas ingredientas;
* ar `page` nėra mažesnis už 1;
* ar `pageSize` yra nuo 1 iki 100;
* ar vartotojo vardas arba el. paštas nėra naudojami kito vartotojo;
* ar prisijungimo duomenys teisingi;
* ar Refresh Token egzistuoja;
* ar Refresh Token nėra atšauktas;
* ar Refresh Token nėra pasibaigęs;
* ar JWT turi galiojantį vartotojo ID ir rolę;
* ar naudotojas turi teisę valdyti konkretų resursą;
* ar įkeliama nuotrauka yra JPEG, PNG arba WebP ir neviršija 5 MB.

---

# Slaptažodžių saugojimas

Vartotojų slaptažodžiai nėra saugomi duomenų bazėje atviru tekstu.

Naudojamas:

```text
Microsoft.AspNetCore.Identity.PasswordHasher
```

Registracijos metu slaptažodis paverčiamas hash reikšme.

Prisijungimo metu pateiktas slaptažodis tikrinamas naudojant saugomą hash.

---

# Projekto paleidimas

## 1. Reikalavimai

Prieš paleidžiant projektą turi būti įdiegta:

* .NET 9 SDK;
* MySQL serveris;
* XAMPP arba kita MySQL aplinka;
* Git.

## 2. Projekto gavimas

Projektą galima nuklonuoti:

```bash
git clone https://github.com/4drijus/RecipeSharingApi.git
cd RecipeSharingApi
```

## 3. Priklausomybių atkūrimas

```bash
dotnet restore
```

## 4. MySQL

Paleiskite MySQL serverį, pavyzdžiui, per XAMPP.

Duomenų bazės prisijungimo informacija konfigūruojama `appsettings.json` faile naudojant `ConnectionStrings:DefaultConnection`.

Pavyzdys:

```json
"ConnectionStrings": {
  "DefaultConnection": "server=localhost;port=3306;database=recipe_sharing;user=root;password="
}
```

## 5. Duomenų bazės migracijos

Atnaujinkite duomenų bazę:

```bash
dotnet ef database update
```

## 6. JWT konfigūracija

JWT slaptasis raktas nėra laikomas `appsettings.json`.

Naudojami .NET User Secrets.

Pirmą kartą:

```bash
dotnet user-secrets init
```

JWT raktas nustatomas:

```bash
dotnet user-secrets set "Jwt:Key" "YOUR_SECRET_KEY"
```

`YOUR_SECRET_KEY` turi būti pakeistas savo saugiu slaptuoju raktu.

Kiti JWT nustatymai saugomi `appsettings.json`:

```json
"Jwt": {
  "Issuer": "RecipeSharingApi",
  "Audience": "RecipeSharingApi",
  "AccessTokenMinutes": 15,
  "RefreshTokenDays": 7
}
```

## 7. Projekto paleidimas

```bash
dotnet run
```

API adresas priklauso nuo paleidimo metu konsolėje nurodyto URL.

Pavyzdžiui:

```text
http://localhost:5000
```

Frontend sąsaja pateikiama tame pačiame adrese, o API pasiekiamas per `/api`.
Sąsaja API bazinį adresą nustato pagal dabartinį puslapio adresą, todėl vietiniam
ir viešam adresui nereikia atskirų URL kiekvienam API metodui.

Pavyzdžiai:

```text
http://localhost:5000/api/auth/login
http://localhost:5000/api/recipes?page=1&pageSize=10
```

OpenAPI dokumentacija:

```text
http://localhost:5000/openapi/v1.json
```

## Laikina vieša demonstracija

Cloudflare Quick Tunnel gali laikinai suteikti HTTPS adresą vietiniam
veikiančiam projektui. Viešas adresas naudoja tokį patį kelių išdėstymą:

```text
https://<viešas-adresas>/
https://<viešas-adresas>/api/auth/login
https://<viešas-adresas>/api/recipes?page=1&pageSize=10
```

Tai nėra nuolatinis debesijos talpinimas: kompiuteris, API, MySQL ir tunelis
turi veikti, o tunelio adresas gali pasikeisti jį paleidus iš naujo. API
kreipiasi į vietinę MySQL duomenų bazę; duomenų bazės prievadas viešai
neatveriamas. Viešos demonstracijos metu registracija ir API tampa prieinamos
interneto naudotojams, todėl JWT raktas turi būti perduodamas per saugią
aplinkos konfigūraciją, o ne įrašomas į frontendą ar viešą Git repozitoriją.

## Nuolatinis nemokamas demonstracinis talpinimas

Projektą galima talpinti kaip vieną Render Web Service: ASP.NET API ir
`frontend` failai pateikiami tuo pačiu `onrender.com` adresu. Repozitorijos
šakniniame kataloge esantis `Dockerfile` skirtas šiai publikavimo aplinkai.
Render Free paslauga neveiklumui esant užmiega, todėl pirmoji užklausa po
pertraukos gali užtrukti. Tai demonstracinis, ne produkcinis planas.

Nuotolinei MySQL suderinamai duomenų bazei galima naudoti TiDB Cloud Starter
nemokamą kvotą. Duomenų bazė turi būti pasiekiama per TLS. Render aplinkos
kintamajame `ConnectionStrings__DefaultConnection` nustatoma TiDB pateikta
MySQL prisijungimo eilutė, o `Jwt__Key` nustatomas kaip atskiras slaptas
aplinkos kintamasis. Šių reikšmių negalima įrašyti į Git ar frontendą.

Render Web Service aplinkoje reikia pasirinkti Docker publikavimą,
repozitorijos šakninį `Dockerfile` ir `Free` planą. Sukūrus TiDB klasterį,
reikia perkelti DB schemą bei duomenis į jį, Render aplinkoje nustatyti
prisijungimo eilutę ir stiprų JWT raktą, tada patikrinti viešą paslaugos URL.
TiDB nemokamai kvotai viršijus limitą nauji DB prisijungimai gali būti
atmetami. Render nemokamas Web Service neveiklumui esant užmiega ir turi
mėnesinį nemokamų valandų limitą.

## Nuotraukų įkėlimas

Naujos receptų ir kategorijų nuotraukos saugomos Cloudinary, o duomenų bazėje
laikomas tik `ImageUrl`. Esamiems receptams ir kategorijoms be `ImageUrl`
frontend naudoja projekte esančias neutralias SVG iliustracijas. Jos sukurtos
šiam projektui ir pakeičia anksčiau naudotas nepatikrintos licencijos nuotraukas.

Render aplinkoje saugiai nustatykite šiuos Cloudinary aplinkos kintamuosius:

```text
Cloudinary__CloudName
Cloudinary__ApiKey
Cloudinary__ApiSecret
```

Jų reikšmes rasite Cloudinary paskyros API Keys skiltyje. `ApiSecret` negalima
įrašyti į `appsettings.json`, Git repozitoriją, Postman kolekciją ar frontendą.
Be šios konfigūracijos API grąžina `503 Service Unavailable` bandant įkelti
nuotrauką. Leidžiami JPEG, PNG ir WebP failai iki 5 MB.

Schema papildoma EF Core migracija `20261008183607_AddImageUrls`. Kadangi TiDB
schema buvo sukurta rankiniu būdu, paleiskite TiDB SQL Editor šias komandas
vieną kartą prieš diegdami šią programos versiją:

```sql
ALTER TABLE `Recipes` ADD COLUMN `ImageUrl` longtext CHARACTER SET utf8mb4 NULL;
ALTER TABLE `Categories` ADD COLUMN `ImageUrl` longtext CHARACTER SET utf8mb4 NULL;
INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261008183607_AddImageUrls', '9.0.0');
```

Įkeliant naują receptą su nuotrauka, klientas siunčia
`POST /api/recipes/with-image` kaip `multipart/form-data`. Nauja kategorija su
nuotrauka kuriama per `POST /api/categories/with-image` (tik `Admin`).
Neprivalomai nuotrauką galima vėliau įkelti ar pakeisti per
`POST /api/recipes/{id}/image` arba `POST /api/categories/{id}/image`.
Naudotojas gali pakeisti tik savo recepto nuotrauką; `Admin` gali keisti bet
kurio recepto ir bet kurios kategorijos nuotrauką.

---

# Darbas su autentifikacija

Pagrindinė naudojimo seka:

```text
Register
   ↓
Login
   ↓
Access Token + Refresh Token
   ↓
API užklausos su Bearer Access Token
   ↓
Access Token pasibaigia
   ↓
Refresh Token
   ↓
Naujas Access Token + naujas Refresh Token
   ↓
Logout
   ↓
Refresh Token atšaukiamas
```

Apsaugotoms užklausoms naudojama:

```text
Authorization: Bearer <AccessToken>
```

---

# Postman testai

Projekto API testavimui naudojamas **Postman**.

Testai suskirstyti į grupes:

```text
01 - Registration

02 - Authentication

03 - User

04 - Token

05 - Authorization

06 - Ownership

07 - Negative Tests
```

## Registration

Tikrinama:

* sėkminga registracija;
* vartotojo sukūrimas;
* numatytosios `User` rolės priskyrimas;
* registracija su jau egzistuojančiu vartotojo vardu arba el. paštu.

## Authentication

Tikrinama:

* User prisijungimas;
* Admin prisijungimas;
* Access Token gavimas;
* Refresh Token gavimas;
* neteisingas slaptažodis;
* neegzistuojantis vartotojas.

## User

Tikrinama:

* `GET /api/auth/me`;
* vartotojo ID gavimas;
* vartotojo vardo gavimas;
* vartotojo rolės gavimas.

## Token

Tikrinama:

* Refresh Token panaudojimas;
* naujo Access Token gavimas;
* naujo Refresh Token gavimas;
* seno Refresh Token atšaukimas;
* atšaukto Refresh Token panaudojimas;
* Logout.

## Authorization

Tikrinama:

* User prieiga;
* Admin prieiga;
* User prieiga prie Admin endpointo;
* `401 Unauthorized`;
* `403 Forbidden`;
* skirtingų rolių prieigos teisės.

## Ownership

Tikrinama:

* User recepto sukūrimas;
* User savo recepto redagavimas;
* User bandymas redaguoti kito vartotojo receptą;
* Admin kito vartotojo recepto redagavimas;
* User savo recepto trynimas;
* User bandymas trinti kito vartotojo receptą;
* Admin kito vartotojo recepto trynimas;
* User savo recepto ingredientų valdymas;
* User bandymas valdyti kito vartotojo recepto ingredientus;
* Admin kito vartotojo recepto ingredientų valdymas.

## Users

Tikrinama:

* Admin gali gauti naudotojų sąrašą;
* Admin gali gauti konkretų naudotoją;
* Admin gali ištrinti naudotoją;
* User negali pasiekti naudotojų administravimo endpointų;
* neprisijungęs vartotojas negali pasiekti naudotojų administravimo endpointų.

## Negative Tests

Tikrinamos neleistinos arba klaidingos užklausos:

* neprisijungusio vartotojo prieiga;
* neteisingas Access Token;
* neteisingas Refresh Token;
* atšauktas Refresh Token;
* neteisinga vartotojo rolė;
* prieiga prie neegzistuojančio resurso;
* bandymas keisti kito vartotojo receptą;
* bandymas keisti kito vartotojo recepto ingredientus;
* User bandymas valdyti kategorijas;
* User bandymas valdyti naudotojų paskyras;
* neteisingi užklausos parametrai.

---

# OpenAPI

API turi OpenAPI dokumentaciją.

Paleidus projektą, OpenAPI dokumentą galima pasiekti:

```text
http://localhost:5000/openapi/v1.json
```

---

# Git ir versijų kontrolė

Projektas saugomas Git repozitorijoje:

```text
https://github.com/4drijus/RecipeSharingApi
```

Naudojamos Git komandos:

```bash
git status

git add .

git commit -m "..."

git push
```

JWT slaptasis raktas nėra laikomas Git repozitorijoje ir konfigūruojamas naudojant .NET User Secrets.

---

# Projekto struktūra

Pagrindinė projekto struktūra:

```text
RecipeSharingApi
│
├── Controllers
│   ├── AuthController.cs
│   ├── AuthorizationController.cs
│   ├── CategoriesController.cs
│   ├── RecipeIngredientsController.cs
│   ├── RecipesController.cs
│   └── UsersController.cs
│
├── Data
│   └── AppDbContext.cs
│
├── DTOs
│   ├── AuthResponseDto.cs
│   ├── LoginDto.cs
│   ├── RefreshDto.cs
│   ├── RegisterDto.cs
│   ├── RecipeDto.cs
│   ├── RecipeDetailsDto.cs
│   └── ...
│
├── Models
│   ├── Category.cs
│   ├── Recipe.cs
│   ├── RecipeIngredient.cs
│   ├── User.cs
│   └── RefreshToken.cs
│
├── Services
│   ├── JwtService.cs
│   └── PasswordService.cs
│
├── Migrations
│
├── appsettings.json
├── Program.cs
└── README.md
```

---

# Santrauka

Projekte įgyvendinta REST tipo receptų dalijimosi API su:

* CRUD operacijomis;
* puslapiavimu;
* filtravimu;
* hierarchiniais resursais;
* HATEOAS;
* MySQL duomenų baze;
* Entity Framework Core;
* vartotojų registracija ir prisijungimu;
* slaptažodžių hashavimu;
* JWT Access Token;
* Refresh Token;
* Refresh Token rotacija;
* Logout ir tokenų atšaukimu;
* `User` ir `Admin` rolėmis;
* Guest prieigos lygiu;
* role-based authorization;
* ownership-based authorization;
* apsaugotais API endpointais;
* naudotojų administravimo endpointais;
* OpenAPI dokumentacija;
* automatizuotais Postman testais;
* Git/GitHub versijų kontrole.
