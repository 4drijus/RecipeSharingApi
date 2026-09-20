# Recipe Sharing API

REST API sistema maisto receptų dalijimosi puslapiui

## Projekto paskirtis

API naudojama receptų, jų kategorijų ir receptų ingredientų valdymui

Sistema leidžia:

* peržiūrėti receptų kategorijas;
* kurti, peržiūrėti, redaguoti ir trinti kategorijas;
* peržiūrėti receptus;
* kurti, redaguoti ir trinti receptus;
* peržiūrėti ir valdyti receptų ingredientus;
* gauti tinkamus HTTP atsakymo kodus pagal užklausos rezultatą.

## Naudotos technologijos

* **C#**
* **.NET 9**
* **ASP.NET Core Web API**
* **MySQL**
* **Postman**
* **OpenAPI**
* **Git / GitHub**

## Domeno objektai

API naudojami trys pagrindiniai objektai:

* `Category`
* `Recipe`
* `RecipeIngredient`

`RecipeIngredient` yra susietas su konkrečiu receptu ir nėra bendras ingredientų katalogas.

## Duomenų bazė

Naudojama MySQL duomenų bazė.

Pagrindinės lentelės:

```text
Categories
Recipes
RecipeIngredients
```

Ryšiai:

```text
Category 1 ─── N Recipe
Recipe   1 ─── N RecipeIngredient
```

## Projekto paleidimas

### 1. Reikalavimai

Kompiuteryje turi būti įdiegta:

* .NET 9 SDK
* MySQL
* Git

### 2. Duomenų bazės paruošimas

Projekte naudojama ši prisijungimo eilutė:

```text
server=localhost;port=3306;database=recipe_sharing;user=root;password=
```

Paleidus MySQL, duomenų bazę galima sukurti naudojant Entity Framework Core migracijas:

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

OpenAPI specifikacijoje aprašyti visi 15 API metodų.

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

| Method | Endpoint            | Paskirtis              |
| ------ | ------------------- | ---------------------- |
| GET    | `/api/recipes`      | Gauti visus receptus   |
| GET    | `/api/recipes/{id}` | Gauti receptą pagal ID |
| POST   | `/api/recipes`      | Sukurti receptą        |
| PUT    | `/api/recipes/{id}` | Redaguoti receptą      |
| DELETE | `/api/recipes/{id}` | Ištrinti receptą       |

### Recipe Ingredients

| Method | Endpoint                                   | Paskirtis                  |
| ------ | ------------------------------------------ | -------------------------- |
| GET    | `/api/recipes/{recipeId}/ingredients`      | Gauti recepto ingredientus |
| GET    | `/api/recipes/{recipeId}/ingredients/{id}` | Gauti konkretų ingredientą |
| POST   | `/api/recipes/{recipeId}/ingredients`      | Pridėti ingredientą        |
| PUT    | `/api/recipes/{recipeId}/ingredients/{id}` | Redaguoti ingredientą      |
| DELETE | `/api/recipes/{recipeId}/ingredients/{id}` | Ištrinti ingredientą       |

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
* recepto paruošimo laikas turi būti teigiamas;
* receptas turi priklausyti egzistuojančiai kategorijai;
* ingrediento pavadinimas ir matavimo vienetas yra privalomi;
* ingrediento kiekis turi būti teigiamas;
* ingredientas gali būti pridedamas tik egzistuojančiam receptui.

## Postman testavimas

API testavimui naudojama Postman kolekcija:

```text
Recipe Sharing API
├── Categories
├── Recipes
├── Recipe Ingredients
└── Error Tests
```

Kolekcijoje yra:

* 15 pagrindinių API metodų;
* 6 klaidų testai;
* automatiniai HTTP statusų patikrinimai.

Iš viso vykdomi **21 automatinis testas**.

Paskutinio testavimo rezultatas:

```text
21 / 21 passed
0 failed
```

Klaidų testuose tikrinami:

* `404 Not Found` neegzistuojantiems resursams;
* `400 Bad Request` netinkamiems duomenims.

## Projekto versijų kontrolė

Projektas saugomas Git repozitorijoje GitHub platformoje.

Git naudojamas projekto kodo ir pakeitimų versijoms valdyti.
