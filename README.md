# Recipe Sharing API

REST API sistema maisto receptų dalijimosi puslapiui.

## Projekto paskirtis

API naudojama receptų, jų kategorijų ir receptų ingredientų valdymui.

Sistema leidžia:

* peržiūrėti receptų kategorijas;
* kurti, peržiūrėti, redaguoti ir trinti kategorijas;
* peržiūrėti receptus;
* kurti, redaguoti ir trinti receptus;
* filtruoti receptus pagal kategoriją;
* naudoti receptų puslapiavimą (pagination);
* peržiūrėti išsamią recepto informaciją kartu su kategorija ir ingredientais;
* peržiūrėti ir valdyti receptų ingredientus;
* naudoti hypermedia (HATEOAS) nuorodas;
* gauti tinkamus HTTP atsakymo kodus pagal užklausos rezultatą.

## Naudotos technologijos

* **C#**
* **.NET 9**
* **ASP.NET Core Web API**
* **Entity Framework Core**
* **MySQL**
* **Postman**
* **OpenAPI**
* **Git / GitHub**

## Domeno objektai

API naudojami trys pagrindiniai domeno objektai:

* `Category`
* `Recipe`
* `RecipeIngredient`

`RecipeIngredient` yra susietas su konkrečiu receptu ir nėra bendras ingredientų katalogas.

### Objektų ryšiai

```text
Category 1 ─── N Recipe

Recipe 1 ─── N RecipeIngredient
```

## Duomenų bazė

Naudojama MySQL duomenų bazė.

Pagrindinės lentelės:

```text
Categories
Recipes
RecipeIngredients
```

Duomenų bazė valdoma naudojant Entity Framework Core migracijas.

## Projekto paleidimas

### 1. Reikalavimai

Kompiuteryje turi būti įdiegta:

* .NET 9 SDK
* MySQL
* Git

API testavimui rekomenduojama naudoti Postman.

### 2. Duomenų bazės paruošimas

Projekte naudojama ši prisijungimo eilutė:

```text
server=localhost;port=3306;database=recipe_sharing;user=root;password=
```

Paleidus MySQL, duomenų bazę galima sukurti ir atnaujinti naudojant Entity Framework Core migracijas:

```bash
dotnet ef database update
```

### 3. Projekto paleidimas

Projekto kataloge vykdyti:

```bash
dotnet run
```

API paleidžiama adresu:

```text
http://localhost:5000
```

## OpenAPI

OpenAPI specifikacija pasiekiama adresu:

```text
http://localhost:5000/openapi/v1.json
```

OpenAPI specifikacijoje aprašyti visi API metodai, jų parametrų tipai, užklausų duomenys ir galimi HTTP atsakymo kodai.

## API metodai

### Categories

| Method | Endpoint               | Paskirtis                 |
| ------ | ---------------------- | ------------------------- |
| GET    | `/api/categories`      | Gauti visas kategorijas   |
| GET    | `/api/categories/{id}` | Gauti kategoriją pagal ID |
| POST   | `/api/categories`      | Sukurti kategoriją        |
| PUT    | `/api/categories/{id}` | Redaguoti kategoriją      |
| DELETE | `/api/categories/{id}` | Ištrinti kategoriją       |

### Recipes

| Method | Endpoint                    | Paskirtis                                          |
| ------ | --------------------------- | -------------------------------------------------- |
| GET    | `/api/recipes`              | Gauti receptus su puslapiavimu ir filtravimu       |
| GET    | `/api/recipes/{id}`         | Gauti receptą pagal ID                             |
| POST   | `/api/recipes`              | Sukurti receptą                                    |
| PUT    | `/api/recipes/{id}`         | Redaguoti receptą                                  |
| DELETE | `/api/recipes/{id}`         | Ištrinti receptą                                   |
| GET    | `/api/recipes/{id}/details` | Gauti receptą kartu su kategorija ir ingredientais |

### Recipe Ingredients

| Method | Endpoint                                   | Paskirtis                  |
| ------ | ------------------------------------------ | -------------------------- |
| GET    | `/api/recipes/{recipeId}/ingredients`      | Gauti recepto ingredientus |
| GET    | `/api/recipes/{recipeId}/ingredients/{id}` | Gauti konkretų ingredientą |
| POST   | `/api/recipes/{recipeId}/ingredients`      | Pridėti ingredientą        |
| PUT    | `/api/recipes/{recipeId}/ingredients/{id}` | Redaguoti ingredientą      |
| DELETE | `/api/recipes/{recipeId}/ingredients/{id}` | Ištrinti ingredientą       |

## Receptų filtravimas

Receptus galima filtruoti pagal kategoriją naudojant `categoryId` query parametrą.

Pavyzdys:

```text
GET /api/recipes?categoryId=1
```

Filtravimas gali būti naudojamas kartu su puslapiavimu:

```text
GET /api/recipes?categoryId=1&page=1&pageSize=10
```

Jeigu nurodyta neegzistuojanti kategorija, API grąžina:

```text
404 Not Found
```

## Receptų puslapiavimas

`GET /api/recipes` palaiko puslapiavimą naudojant `page` ir `pageSize` parametrus.

Pavyzdys:

```text
GET /api/recipes?page=1&pageSize=2
```

Atsakyme pateikiama:

* dabartinio puslapio numeris;
* puslapio dydis;
* bendras rezultatų skaičius;
* bendras puslapių skaičius;
* konkretaus puslapio receptai.

Puslapiavimo rezultatas atitinka `PagedRecipesDto` struktūrą.

`page` turi būti ne mažesnis už 1, o `pageSize` turi būti nuo 1 iki 100. Netinkamų reikšmių atveju grąžinamas `400 Bad Request`.

## Hierarchinis resursas

API realizuotas hierarchinis metodas, apimantis visus tris domeno objektus:

```text
GET /api/recipes/{id}/details
```

Šis metodas viename atsakyme pateikia:

```text
Recipe
├── Category
└── Ingredients
    ├── RecipeIngredient
    ├── RecipeIngredient
    └── RecipeIngredient
```

Pavyzdys:

```text
GET /api/recipes/1/details
```

Atsakyme pateikiama recepto informacija, jo kategorija ir visi recepto ingredientai.

## Hypermedia / HATEOAS

`GET /api/recipes/{id}/details` atsakyme pateikiamos hypermedia nuorodos.

Pavyzdys:

```json
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
  }
]
```

Nuorodos leidžia API klientui iš gauto resurso sužinoti susijusių resursų adresus.

## HTTP atsakymo kodai

API naudoja standartinius HTTP status kodus:

| Kodas             | Reikšmė                                          |
| ----------------- | ------------------------------------------------ |
| `200 OK`          | Užklausa įvykdyta sėkmingai                      |
| `201 Created`     | Sėkmingai sukurtas naujas resursas               |
| `204 No Content`  | Resursas sėkmingai ištrintas, atsakymo kūno nėra |
| `400 Bad Request` | Neteisingi užklausos duomenys                    |
| `404 Not Found`   | Nurodytas resursas nerastas                      |

## Duomenų validacija

API tikrina gaunamų duomenų tinkamumą naudojant `DataAnnotations` bei papildomą verslo logikos validaciją.

Pavyzdžiai:

* kategorijos pavadinimas yra privalomas;
* recepto pavadinimas ir instrukcijos yra privalomi;
* recepto paruošimo laikas turi būti nuo 1 iki 1440 minučių;
* receptas turi priklausyti egzistuojančiai kategorijai;
* ingrediento pavadinimas ir matavimo vienetas yra privalomi;
* ingrediento kiekis turi būti teigiamas;
* ingredientas gali būti pridedamas tik egzistuojančiam receptui.

Netinkamų duomenų atveju API grąžina `400 Bad Request`.

## Postman testavimas

API testavimui naudojama Postman kolekcija:

```text
Recipe Sharing API
├── Categories
├── Recipes
├── Recipe Ingredients
└── Error Tests
```

Kolekcijoje tikrinami:

* pagrindiniai CRUD API metodai;
* receptų filtravimas;
* receptų puslapiavimas;
* hierarchinis recepto informacijos gavimas;
* HATEOAS nuorodos;
* `404 Not Found` klaidos;
* `400 Bad Request` klaidos;
* HTTP atsakymo statusai;
* atsakymo struktūra ir turinys.

Kolekcijos Runner naudojamas automatiniam visų testų vykdymui.

Paskutinio testavimo metu visi kolekcijoje esantys testai praėjo sėkmingai.

## Projekto versijų kontrolė

Projektas saugomas Git repozitorijoje GitHub platformoje.

Git naudojamas projekto kodo ir pakeitimų versijoms valdyti.
