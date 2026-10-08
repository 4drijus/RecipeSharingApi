/* =========================
   INGREDIENTS
========================= */

let ingredientToEdit = null;
let recipeForIngredient = null;

let ingredientToDelete = null;
let recipeForIngredientDelete = null;


/* =========================
   INGREDIENTS SECTION
========================= */

function addIngredientsSection(
    modal,
    recipe
) {

    let section =
        modal.querySelector(
            ".ingredients-section"
        );


    if (!section) {

        section =
            document.createElement(
                "div"
            );

        section.className =
            "ingredients-section";


        section.style.marginTop =
            "25px";

        section.style.paddingTop =
            "20px";

        section.style.borderTop =
            "1px solid #e5e5e5";


        const modalContent =
            modal.querySelector(
                ".modal-content"
            );


        if (!modalContent) {
            return;
        }


        modalContent.appendChild(
            section
        );
    }


    section.innerHTML = `

        <div
            style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:15px;
                margin-bottom:15px;
                flex-wrap:wrap;
            "
        >

            <h3>
                Ingredientai
            </h3>


            ${
                canManageIngredients(
                    recipe
                )
                    ? `
                        <button
                            type="button"
                            class="primary-button add-ingredient-button">

                            + Pridėti ingredientą

                        </button>
                    `
                    : ""
            }

        </div>


        <div class="ingredient-list">
            Kraunama...
        </div>
    `;


    const addButton =
        section.querySelector(
            ".add-ingredient-button"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            () => {

                openIngredientModal(
                    recipe,
                    null
                );
            }
        );
    }


    loadIngredients(
        recipe,
        section
    );
}


/* =========================
   LOAD INGREDIENTS
========================= */

async function loadIngredients(
    recipe,
    section
) {

    const ingredientList =
        section.querySelector(
            ".ingredient-list"
        );


    try {

        const response =
            await apiFetch(
                `${API_URL}/recipes/${recipe.id}/ingredients`
            );


        if (!response.ok) {

            throw new Error(
                "Nepavyko gauti ingredientų"
            );
        }


        const ingredients =
            await response.json();


        displayIngredients(
            ingredients,
            recipe,
            ingredientList
        );


    } catch (error) {

        console.error(
            "Ingredientų API klaida:",
            error
        );


        ingredientList.innerHTML = `
            <p>
                Nepavyko įkelti ingredientų.
            </p>
        `;
    }
}


/* =========================
   DISPLAY INGREDIENTS
========================= */

function displayIngredients(
    ingredients,
    recipe,
    container
) {

    container.innerHTML =
        "";


    if (
        !ingredients ||
        ingredients.length === 0
    ) {

        container.innerHTML = `
            <p>
                Šis receptas ingredientų neturi.
            </p>
        `;

        return;
    }


    ingredients.forEach(
        ingredient => {

            const item =
                document.createElement(
                    "div"
                );


            item.style.display =
                "flex";

            item.style.justifyContent =
                "space-between";

            item.style.alignItems =
                "center";

            item.style.gap =
                "15px";

            item.style.padding =
                "10px 0";

            item.style.borderBottom =
                "1px solid #eeeeee";

            item.style.flexWrap =
                "wrap";


            const information =
                document.createElement(
                    "span"
                );


            information.textContent =
                `${ingredient.name} — ${ingredient.quantity} ${ingredient.unit}`;


            item.appendChild(
                information
            );


            if (
                canManageIngredients(
                    recipe
                )
            ) {

                const actions =
                    document.createElement(
                        "div"
                    );


                actions.style.display =
                    "flex";

                actions.style.gap =
                    "8px";


                actions.innerHTML = `
                    <button
                        type="button"
                        class="secondary-button edit-ingredient-button">

                        Redaguoti

                    </button>

                    <button
                        type="button"
                        class="secondary-button delete-ingredient-button">

                        Trinti

                    </button>
                `;


                const editButton =
                    actions.querySelector(
                        ".edit-ingredient-button"
                    );


                editButton.addEventListener(
                    "click",
                    () => {

                        openIngredientModal(
                            recipe,
                            ingredient
                        );
                    }
                );


                const deleteButton =
                    actions.querySelector(
                        ".delete-ingredient-button"
                    );


                deleteButton.addEventListener(
                    "click",
                    () => {

                        openDeleteIngredientModal(
                            recipe,
                            ingredient
                        );
                    }
                );


                item.appendChild(
                    actions
                );
            }


            container.appendChild(
                item
            );
        }
    );
}


/* =========================
   CREATE / EDIT MODAL
========================= */

function createIngredientModal() {

    let modal =
        document.getElementById(
            "ingredient-modal"
        );


    if (modal) {
        return modal;
    }


    modal =
        document.createElement(
            "div"
        );


    modal.id =
        "ingredient-modal";

    modal.className =
        "modal hidden";


    modal.innerHTML = `

        <div class="modal-content">

            <h2 id="ingredient-modal-title">
                Pridėti ingredientą
            </h2>


            <button
                id="close-ingredient-modal"
                class="modal-close"
                type="button"
                aria-label="Uždaryti">

                &times;

            </button>


            <form id="ingredient-form">

                <div class="form-group">

                    <label for="ingredient-name">
                        Pavadinimas
                    </label>

                    <input
                        id="ingredient-name"
                        name="name"
                        type="text"
                        required>

                </div>


                <div class="form-group">

                    <label for="ingredient-quantity">
                        Kiekis
                    </label>

                    <input
                        id="ingredient-quantity"
                        name="quantity"
                        type="number"
                        step="0.01"
                        min="0"
                        required>

                </div>


                <div class="form-group">

                    <label for="ingredient-unit">
                        Matavimo vienetas
                    </label>

                    <select
                        id="ingredient-unit"
                        name="unit"
                        required>

                        <option value="">
                            Pasirinkite vienetą
                        </option>

                        <option value="vnt.">
                            vnt.
                        </option>

                        <option value="g">
                            g
                        </option>

                        <option value="kg">
                            kg
                        </option>

                        <option value="ml">
                            ml
                        </option>

                        <option value="l">
                            l
                        </option>

                        <option value="šaukštelis">
                            šaukštelis
                        </option>

                        <option value="šaukštas">
                            šaukštas
                        </option>

                        <option value="žiupsnelis">
                            žiupsnelis
                        </option>

                    </select>

                </div>


                <div
                    style="
                        display:flex;
                        justify-content:flex-end;
                        gap:10px;
                        margin-top:20px;
                    "
                >

                    <button
                        id="cancel-ingredient-modal"
                        class="secondary-button"
                        type="button">

                        Atšaukti

                    </button>


                    <button
                        class="primary-button"
                        type="submit">

                        Išsaugoti

                    </button>

                </div>

            </form>

        </div>
    `;


    document.body.appendChild(
        modal
    );


    document
        .getElementById(
            "close-ingredient-modal"
        )
        .addEventListener(
            "click",
            closeIngredientModal
        );


    document
        .getElementById(
            "cancel-ingredient-modal"
        )
        .addEventListener(
            "click",
            closeIngredientModal
        );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "ingredient-modal"
            ) {

                closeIngredientModal();
            }
        }
    );


    document
        .getElementById(
            "ingredient-form"
        )
        .addEventListener(
            "submit",
            saveIngredient
        );


    return modal;
}


/* =========================
   OPEN INGREDIENT MODAL
========================= */

function openIngredientModal(
    recipe,
    ingredient
) {

    if (
        !canManageIngredients(
            recipe
        )
    ) {

        showToast(
            "Neturite teisės valdyti šio recepto ingredientų.",
            "error"
        );

        return;
    }


    const modal =
        createIngredientModal();


    const title =
        document.getElementById(
            "ingredient-modal-title"
        );


    const nameInput =
        document.getElementById(
            "ingredient-name"
        );


    const quantityInput =
        document.getElementById(
            "ingredient-quantity"
        );


    const unitInput =
        document.getElementById(
            "ingredient-unit"
        );


    recipeForIngredient =
        recipe;


    ingredientToEdit =
        ingredient;


    if (ingredient) {

        title.textContent =
            "Redaguoti ingredientą";


        nameInput.value =
            ingredient.name ?? "";


        quantityInput.value =
            ingredient.quantity ?? "";


        unitInput.value =
            ingredient.unit ?? "";


    } else {

        title.textContent =
            "Pridėti ingredientą";


        nameInput.value =
            "";


        quantityInput.value =
            "";


        unitInput.value =
            "";
    }


    showModal(
        modal
    );
}


/* =========================
   CLOSE INGREDIENT MODAL
========================= */

function closeIngredientModal() {

    const modal =
        document.getElementById(
            "ingredient-modal"
        );


    hideModal(
        modal
    );


    recipeForIngredient =
        null;


    ingredientToEdit =
        null;
}


/* =========================
   SAVE INGREDIENT
========================= */

async function saveIngredient(
    event
) {

    event.preventDefault();


    if (!recipeForIngredient) {
        return;
    }


    if (
        !canManageIngredients(
            recipeForIngredient
        )
    ) {

        closeIngredientModal();


        showToast(
            "Neturite teisės valdyti šio recepto ingredientų.",
            "error"
        );

        return;
    }


    const form =
        document.getElementById(
            "ingredient-form"
        );


    const formData =
        new FormData(
            form
        );


    const editingIngredient =
        ingredientToEdit;


    const recipe =
        recipeForIngredient;


    const ingredientData = {

        name:
            formData.get(
                "name"
            ),

        quantity:
            Number(
                formData.get(
                    "quantity"
                )
            ),

        unit:
            formData.get(
                "unit"
            )
    };


    try {

        let response;


        if (
            editingIngredient
        ) {

            response =
                await apiFetch(
                    `${API_URL}/recipes/${recipe.id}/ingredients/${editingIngredient.id}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                ingredientData
                            )
                    }
                );


        } else {

            response =
                await apiFetch(
                    `${API_URL}/recipes/${recipe.id}/ingredients`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                ingredientData
                            )
                    }
                );
        }


        if (!response.ok) {

            const errorText =
                await response.text();


            throw new Error(
                errorText ||
                "Nepavyko išsaugoti ingrediento"
            );
        }


        closeIngredientModal();


        const recipeModal =
            document.getElementById(
                "recipe-modal"
            );


        addIngredientsSection(
            recipeModal,
            recipe
        );


        showToast(
            editingIngredient
                ? "Ingredientas sėkmingai atnaujintas!"
                : "Ingredientas sėkmingai pridėtas!"
        );


    } catch (error) {

        console.error(
            "Ingrediento išsaugojimo klaida:",
            error
        );


        showToast(
            error.message || "Nepavyko išsaugoti ingrediento.",
            "error"
        );
    }
}


/* =========================
   DELETE INGREDIENT MODAL
========================= */

function createDeleteIngredientModal() {

    let modal =
        document.getElementById(
            "delete-ingredient-modal"
        );


    if (modal) {
        return modal;
    }


    modal =
        document.createElement(
            "div"
        );


    modal.id =
        "delete-ingredient-modal";

    modal.className =
        "modal hidden";


    modal.innerHTML = `

        <div class="modal-content">

            <h2>
                Trinti ingredientą
            </h2>


            <button
                id="close-delete-ingredient-modal"
                class="modal-close"
                type="button"
                aria-label="Uždaryti">

                &times;

            </button>


            <p
                id="delete-ingredient-message"
                style="margin:20px 0;"
            >
                Ar tikrai norite ištrinti šį ingredientą?
            </p>


            <div
                style="
                    display:flex;
                    justify-content:flex-end;
                    gap:10px;
                "
            >

                <button
                    id="cancel-delete-ingredient"
                    class="secondary-button"
                    type="button">

                    Atšaukti

                </button>


                <button
                    id="confirm-delete-ingredient"
                    class="primary-button"
                    type="button">

                    Trinti

                </button>

            </div>

        </div>
    `;


    document.body.appendChild(
        modal
    );


    document
        .getElementById(
            "close-delete-ingredient-modal"
        )
        .addEventListener(
            "click",
            closeDeleteIngredientModal
        );


    document
        .getElementById(
            "cancel-delete-ingredient"
        )
        .addEventListener(
            "click",
            closeDeleteIngredientModal
        );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "delete-ingredient-modal"
            ) {

                closeDeleteIngredientModal();
            }
        }
    );


    document
        .getElementById(
            "confirm-delete-ingredient"
        )
        .addEventListener(
            "click",
            deleteIngredient
        );


    return modal;
}


/* =========================
   OPEN DELETE INGREDIENT
========================= */

function openDeleteIngredientModal(
    recipe,
    ingredient
) {

    if (
        !canManageIngredients(
            recipe
        )
    ) {

        showToast(
            "Neturite teisės trinti šio ingrediento.",
            "error"
        );

        return;
    }


    recipeForIngredientDelete =
        recipe;


    ingredientToDelete =
        ingredient;


    const modal =
        createDeleteIngredientModal();


    document.getElementById(
        "delete-ingredient-message"
    ).textContent =
        `Ar tikrai norite ištrinti ingredientą „${ingredient.name}“?`;


    showModal(
        modal
    );
}


/* =========================
   CLOSE DELETE INGREDIENT
========================= */

function closeDeleteIngredientModal() {

    const modal =
        document.getElementById(
            "delete-ingredient-modal"
        );


    hideModal(
        modal
    );


    ingredientToDelete =
        null;


    recipeForIngredientDelete =
        null;
}


/* =========================
   DELETE INGREDIENT
========================= */

async function deleteIngredient() {

    if (
        !ingredientToDelete ||
        !recipeForIngredientDelete
    ) {

        return;
    }


    if (
        !canManageIngredients(
            recipeForIngredientDelete
        )
    ) {

        closeDeleteIngredientModal();


        showToast(
            "Neturite teisės trinti šio ingrediento.",
            "error"
        );

        return;
    }


    const recipe =
        recipeForIngredientDelete;


    const ingredient =
        ingredientToDelete;


    try {

        const response =
            await apiFetch(
                `${API_URL}/recipes/${recipe.id}/ingredients/${ingredient.id}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();


            throw new Error(
                errorText ||
                "Nepavyko ištrinti ingrediento"
            );
        }


        closeDeleteIngredientModal();


        const recipeModal =
            document.getElementById(
                "recipe-modal"
            );


        addIngredientsSection(
            recipeModal,
            recipe
        );


        showToast(
            "Ingredientas sėkmingai ištrintas!"
        );


    } catch (error) {

        console.error(
            "Ingrediento trynimo klaida:",
            error
        );


        showToast(
            error.message || "Nepavyko ištrinti ingrediento.",
            "error"
        );
    }
}