/* =========================
   RECIPES
========================= */

const PAGE_SIZE = 9;

let currentPage = 1;
let totalPages = 1;

let recipeToDelete = null;

function getRecipeImagePath(recipe) {
    const storedImageUrl =
        typeof getStoredImageUrl === "function"
            ? getStoredImageUrl(recipe.imageUrl)
            : null;

    if (storedImageUrl) {
        return storedImageUrl;
    }

    return "assets/images/recipes/Recipe_Placeholder.svg";
}


/* =========================
   RECIPE PERMISSIONS
========================= */

function canEditRecipe(recipe) {

    const currentUser =
        getCurrentUser();


    if (!currentUser) {
        return false;
    }


    if (
        currentUser.role ===
        "Admin"
    ) {

        return true;
    }


    return (
        Number(recipe.userId) ===
        Number(currentUser.id)
    );
}


function canDeleteRecipe(recipe) {

    return canEditRecipe(
        recipe
    );
}


function canManageIngredients(recipe) {

    return canEditRecipe(
        recipe
    );
}


/* =========================
   LOAD RECIPES
========================= */

async function loadRecipes(
    page = currentPage
) {

    try {

        const response =
            await apiFetch(
                `${API_URL}/recipes?page=${page}&pageSize=${PAGE_SIZE}`
            );


        if (!response.ok) {

            throw new Error(
                "Nepavyko gauti receptų"
            );
        }


        const data =
            await response.json();


        if (
            data.items.length === 0 &&
            page > 1
        ) {

            await loadRecipes(
                page - 1
            );

            return;
        }


        currentPage =
            data.page;

        totalPages =
            data.totalPages;


        displayRecipes(
            data.items
        );


        displayPagination();


    } catch (error) {

        console.error(
            "API klaida:",
            error
        );
    }
}

async function refreshRecipeViews() {

    await loadRecipes(
        currentPage
    );

    if (
        typeof currentCategoryId !== "undefined" &&
        currentCategoryId !== null &&
        typeof categoryRecipesPage !== "undefined" &&
        !categoryRecipesPage.classList.contains("hidden")
    ) {

        await loadCategoryRecipes(
            currentCategoryPage
        );
    }
}


/* =========================
   DISPLAY RECIPES
========================= */

function displayRecipes(
    recipes
) {

    const container =
        document.getElementById(
            "recipes-container"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    recipes.forEach(
        recipe => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "recipe-card";

            const recipeImagePath =
                getRecipeImagePath(recipe);


            let actionButtons = `
                <button
                    class="secondary-button view-recipe-button"
                    type="button">

                    Žiūrėti receptą

                </button>
            `;


            if (
                canEditRecipe(
                    recipe
                )
            ) {

                actionButtons += `
                    <button
                        class="secondary-button edit-recipe-button"
                        type="button">

                        Redaguoti

                    </button>
                `;
            }


            if (
                canDeleteRecipe(
                    recipe
                )
            ) {

                actionButtons += `
                    <button
                        class="secondary-button delete-recipe-button"
                        type="button">

                        Trinti

                    </button>
                `;
            }


            card.innerHTML = `

                <div class="recipe-image">
                    ${
                        recipeImagePath
                            ? `<img src="${recipeImagePath}" alt="${escapeRecipeHtml(recipe.title)}">`
                            : "<span>Receptas</span>"
                    }
                </div>


                <div class="recipe-card-content">

                    <h3>
                        ${escapeRecipeHtml(
                            recipe.title
                        )}
                    </h3>


                    <p>
                        ${escapeRecipeHtml(
                            recipe.description ?? ""
                        )}
                    </p>


                    <div class="recipe-meta">

                        <span>
                            Paruošimo laikas: ${recipe.preparationTime} min
                        </span>

                    </div>


                    <div class="recipe-card-actions">

                        ${actionButtons}

                    </div>

                </div>

            `;


            const viewButton =
                card.querySelector(
                    ".view-recipe-button"
                );


            viewButton.addEventListener(
                "click",
                () => {

                    openRecipeModal(
                        recipe
                    );
                }
            );


            const editButton =
                card.querySelector(
                    ".edit-recipe-button"
                );


            if (editButton) {

                editButton.addEventListener(
                    "click",
                    () => {

                        openEditRecipeModal(
                            recipe
                        );
                    }
                );
            }


            const deleteButton =
                card.querySelector(
                    ".delete-recipe-button"
                );


            if (deleteButton) {

                deleteButton.addEventListener(
                    "click",
                    () => {

                        openDeleteRecipeModal(
                            recipe
                        );
                    }
                );
            }


            container.appendChild(
                card
            );

        }
    );
}


/* =========================
   ESCAPE HTML
========================= */

function escapeRecipeHtml(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================
   PAGINATION
========================= */

function displayPagination() {

    const pagination =
        document.getElementById(
            "pagination"
        );


    if (!pagination) {
        return;
    }


    pagination.innerHTML =
        "";


    if (
        totalPages <= 1
    ) {

        return;
    }


    const previousButton =
        document.createElement(
            "button"
        );


    previousButton.type =
        "button";

    previousButton.className =
        "pagination-button";

    previousButton.textContent =
        "←";

    previousButton.title =
        "Ankstesnis puslapis";

    previousButton.disabled =
        currentPage === 1;


    previousButton.addEventListener(
        "click",
        () => {

            if (
                currentPage > 1
            ) {

                loadRecipes(
                    currentPage - 1
                );
            }
        }
    );


    pagination.appendChild(
        previousButton
    );


    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        const pageButton =
            document.createElement(
                "button"
            );


        pageButton.type =
            "button";

        pageButton.className =
            "pagination-button";

        pageButton.textContent =
            page;


        if (
            page === currentPage
        ) {

            pageButton.classList.add(
                "active"
            );
        }


        pageButton.addEventListener(
            "click",
            () => {

                if (
                    page !== currentPage
                ) {

                    loadRecipes(
                        page
                    );
                }
            }
        );


        pagination.appendChild(
            pageButton
        );
    }


    const nextButton =
        document.createElement(
            "button"
        );


    nextButton.type =
        "button";

    nextButton.className =
        "pagination-button";

    nextButton.textContent =
        "→";

    nextButton.title =
        "Kitas puslapis";

    nextButton.disabled =
        currentPage === totalPages;


    nextButton.addEventListener(
        "click",
        () => {

            if (
                currentPage <
                totalPages
            ) {

                loadRecipes(
                    currentPage + 1
                );
            }
        }
    );


    pagination.appendChild(
        nextButton
    );
}


/* =========================
   RECIPE VIEW MODAL
========================= */

function openRecipeModal(
    recipe
) {

    const modal =
        document.getElementById(
            "recipe-modal"
        );


    document.getElementById(
        "modal-title"
    ).textContent =
        recipe.title;


    document.getElementById(
        "modal-description"
    ).textContent =
        recipe.description ?? "";


    document.getElementById(
        "modal-time"
    ).textContent =
        `Ruošimo laikas: ${recipe.preparationTime} min`;


    document.getElementById(
        "modal-instructions"
    ).textContent =
        recipe.instructions ?? "";


    addIngredientsSection(
        modal,
        recipe
    );


    showModal(
        modal
    );
}


function closeRecipeModal() {

    const modal =
        document.getElementById(
            "recipe-modal"
        );


    hideModal(
        modal
    );
}


const closeRecipeModalButton =
    document.getElementById(
        "close-modal"
    );


if (
    closeRecipeModalButton
) {

    closeRecipeModalButton.addEventListener(
        "click",
        closeRecipeModal
    );
}


const recipeModal =
    document.getElementById(
        "recipe-modal"
    );


if (recipeModal) {

    recipeModal.addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "recipe-modal"
            ) {

                closeRecipeModal();
            }
        }
    );
}


/* =========================
   CATEGORIES FOR RECIPE FORM
========================= */

async function loadCategories() {

    try {

        const response =
            await apiFetch(
                `${API_URL}/categories`
            );


        if (!response.ok) {

            throw new Error(
                "Nepavyko gauti kategorijų"
            );
        }


        const categories =
            await response.json();


        fillCategorySelect(
            "recipe-category",
            categories
        );


        fillCategorySelect(
            "edit-recipe-category",
            categories
        );


    } catch (error) {

        console.error(
            "Kategorijų API klaida:",
            error
        );
    }
}


function fillCategorySelect(
    selectId,
    categories
) {

    const categorySelect =
        document.getElementById(
            selectId
        );


    if (!categorySelect) {
        return;
    }


    categorySelect.innerHTML = `
        <option value="">
            Pasirinkite kategoriją
        </option>
    `;


    categories.forEach(
        category => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                category.id;


            option.textContent =
                category.name;


            categorySelect.appendChild(
                option
            );
        }
    );
}


/* =========================
   ADD RECIPE
========================= */

const addRecipeButton =
    document.getElementById(
        "add-recipe-button"
    );


const addRecipeModal =
    document.getElementById(
        "add-recipe-modal"
    );


const closeAddRecipeModal =
    document.getElementById(
        "close-add-recipe-modal"
    );


if (addRecipeButton) {

    addRecipeButton.addEventListener(
        "click",
        () => {

            showModal(
                addRecipeModal
            );
        }
    );
}


if (closeAddRecipeModal) {

    closeAddRecipeModal.addEventListener(
        "click",
        () => {

            hideModal(
                addRecipeModal
            );
        }
    );
}


if (addRecipeModal) {

    addRecipeModal.addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "add-recipe-modal"
            ) {

                hideModal(
                    addRecipeModal
                );
            }
        }
    );
}


const addRecipeForm =
    document.getElementById(
        "add-recipe-form"
    );


if (addRecipeForm) {

    addRecipeForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const accessToken =
                localStorage.getItem(
                    "accessToken"
                );


            if (!accessToken) {

                showToast(
                    "Norint sukurti receptą reikia prisijungti.",
                    "error"
                );

                return;
            }


            const formData =
                new FormData(
                    addRecipeForm
                );


            const recipe = {

                title:
                    formData.get(
                        "title"
                    ),

                description:
                    formData.get(
                        "description"
                    ),

                instructions:
                    formData.get(
                        "instructions"
                    ),

                preparationTime:
                    Number(
                        formData.get(
                            "preparationTime"
                        )
                    ),

                categoryId:
                    Number(
                        formData.get(
                            "categoryId"
                        )
                    )
            };

            const imageFile = formData.get("image");
            const hasImage = imageFile instanceof File && imageFile.size > 0;

            if (hasImage && imageFile.size > 5 * 1024 * 1024) {
                showToast("Nuotrauka negali būti didesnė nei 5 MB.", "error");
                return;
            }


            try {

                const response =
                    await apiFetch(
                        hasImage
                            ? `${API_URL}/recipes/with-image`
                            : `${API_URL}/recipes`,
                        hasImage
                            ? {
                                method: "POST",
                                body: formData
                            }
                            : {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify(recipe)
                            }
                    );


                if (!response.ok) {

                    const errorText =
                        await response.text();


                    throw new Error(
                        errorText ||
                        "Nepavyko sukurti recepto"
                    );
                }


                addRecipeForm.reset();


                hideModal(
                    addRecipeModal
                );


                currentPage =
                    1;


                await refreshRecipeViews();

                showToast(
                    "Receptas sėkmingai sukurtas!"
                );


            } catch (error) {

                console.error(
                    "Recepto kūrimo klaida:",
                    error
                );


                showToast(
                    error.message || "Nepavyko sukurti recepto.",
                    "error"
                );
            }

        }
    );
}


/* =========================
   EDIT RECIPE
========================= */

const editRecipeModal =
    document.getElementById(
        "edit-recipe-modal"
    );


const closeEditRecipeModal =
    document.getElementById(
        "close-edit-recipe-modal"
    );


const editRecipeForm =
    document.getElementById(
        "edit-recipe-form"
    );


function openEditRecipeModal(
    recipe
) {

    if (
        !canEditRecipe(
            recipe
        )
    ) {

        showToast(
            "Neturite teisės redaguoti šio recepto.",
            "error"
        );

        return;
    }


    document.getElementById(
        "edit-recipe-id"
    ).value =
        recipe.id;


    document.getElementById(
        "edit-recipe-title"
    ).value =
        recipe.title ?? "";


    document.getElementById(
        "edit-recipe-description"
    ).value =
        recipe.description ?? "";


    document.getElementById(
        "edit-recipe-instructions"
    ).value =
        recipe.instructions ?? "";


    document.getElementById(
        "edit-recipe-preparation-time"
    ).value =
        recipe.preparationTime ?? "";


    document.getElementById(
        "edit-recipe-category"
    ).value =
        recipe.categoryId ?? "";

    document.getElementById(
        "edit-recipe-image"
    ).value = "";


    showModal(
        editRecipeModal
    );
}


if (closeEditRecipeModal) {

    closeEditRecipeModal.addEventListener(
        "click",
        () => {

            hideModal(
                editRecipeModal
            );
        }
    );
}


if (editRecipeModal) {

    editRecipeModal.addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "edit-recipe-modal"
            ) {

                hideModal(
                    editRecipeModal
                );
            }
        }
    );
}


if (editRecipeForm) {

    editRecipeForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const recipeId =
                document.getElementById(
                    "edit-recipe-id"
                ).value;


            const formData =
                new FormData(
                    editRecipeForm
                );


            const updatedRecipe = {

                title:
                    formData.get(
                        "title"
                    ),

                description:
                    formData.get(
                        "description"
                    ),

                instructions:
                    formData.get(
                        "instructions"
                    ),

                preparationTime:
                    Number(
                        formData.get(
                            "preparationTime"
                        )
                    ),

                categoryId:
                    Number(
                        formData.get(
                            "categoryId"
                        )
                    )
            };

            const imageFile = formData.get("image");
            if (imageFile instanceof File && imageFile.size > 5 * 1024 * 1024) {
                showToast("Nuotrauka negali būti didesnė nei 5 MB.", "error");
                return;
            }


            try {

                const response =
                    await apiFetch(
                        `${API_URL}/recipes/${recipeId}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    updatedRecipe
                                )
                        }
                    );


                if (!response.ok) {

                    const errorText =
                        await response.text();


                    throw new Error(
                        errorText ||
                        "Nepavyko atnaujinti recepto"
                    );
                }

                if (imageFile instanceof File && imageFile.size > 0) {
                    await uploadImage(
                        `${API_URL}/recipes/${recipeId}/image`,
                        imageFile
                    );
                }


                editRecipeForm.reset();


                hideModal(
                    editRecipeModal
                );


                await refreshRecipeViews();

                showToast(
                    "Receptas sėkmingai atnaujintas!"
                );


            } catch (error) {

                console.error(
                    "Recepto redagavimo klaida:",
                    error
                );


                showToast(
                    error.message || "Nepavyko atnaujinti recepto.",
                    "error"
                );
            }

        }
    );
}


/* =========================
   DELETE RECIPE
========================= */

function createDeleteRecipeModal() {

    const existingModal =
        document.getElementById(
            "delete-recipe-modal"
        );


    if (existingModal) {
        return existingModal;
    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "delete-recipe-modal";

    modal.className =
        "modal hidden";


    modal.innerHTML = `
        <div class="modal-content">

            <h2>
                Trinti receptą
            </h2>

            <button
                id="close-delete-recipe-modal"
                class="modal-close"
                type="button"
                aria-label="Uždaryti">

                &times;

            </button>

            <p
                id="delete-recipe-message"
                style="margin:20px 0;"
            >
                Ar tikrai norite ištrinti šį receptą?
            </p>

            <div
                style="
                    display:flex;
                    justify-content:flex-end;
                    gap:10px;
                "
            >

                <button
                    id="cancel-delete-recipe"
                    class="secondary-button"
                    type="button">

                    Atšaukti

                </button>

                <button
                    id="confirm-delete-recipe"
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
            "close-delete-recipe-modal"
        )
        .addEventListener(
            "click",
            closeDeleteRecipeModal
        );


    document
        .getElementById(
            "cancel-delete-recipe"
        )
        .addEventListener(
            "click",
            closeDeleteRecipeModal
        );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "delete-recipe-modal"
            ) {

                closeDeleteRecipeModal();
            }
        }
    );


    document
        .getElementById(
            "confirm-delete-recipe"
        )
        .addEventListener(
            "click",
            deleteRecipe
        );


    return modal;
}


function openDeleteRecipeModal(
    recipe
) {

    if (
        !canDeleteRecipe(
            recipe
        )
    ) {

        showToast(
            "Neturite teisės trinti šio recepto.",
            "error"
        );

        return;
    }


    recipeToDelete =
        recipe;


    const modal =
        createDeleteRecipeModal();


    document.getElementById(
        "delete-recipe-message"
    ).textContent =
        `Ar tikrai norite ištrinti receptą „${recipe.title}“?`;


    showModal(
        modal
    );
}


function closeDeleteRecipeModal() {

    const modal =
        document.getElementById(
            "delete-recipe-modal"
        );


    hideModal(
        modal
    );


    recipeToDelete =
        null;
}


async function deleteRecipe() {

    if (!recipeToDelete) {
        return;
    }


    const recipe =
        recipeToDelete;


    if (
        !canDeleteRecipe(
            recipe
        )
    ) {

        closeDeleteRecipeModal();


        showToast(
            "Neturite teisės trinti šio recepto.",
            "error"
        );

        return;
    }


    try {

        const response =
            await apiFetch(
                `${API_URL}/recipes/${recipe.id}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();


            throw new Error(
                errorText ||
                "Nepavyko ištrinti recepto"
            );
        }


        closeDeleteRecipeModal();


        await refreshRecipeViews();

        showToast(
            "Receptas sėkmingai ištrintas!"
        );


    } catch (error) {

        console.error(
            "Recepto trynimo klaida:",
            error
        );


        showToast(
            error.message || "Nepavyko ištrinti recepto.",
            "error"
        );
    }
}