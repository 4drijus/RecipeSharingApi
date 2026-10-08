/* =========================
   CATEGORY PAGES + CRUD
========================= */


/* =========================
   ELEMENTS
========================= */

const categoriesPage =
    document.getElementById(
        "categories-page"
    );

const categoryRecipesPage =
    document.getElementById(
        "category-recipes-page"
    );

const usersPage =
    document.getElementById(
        "users-page"
    );

const recipesPage =
    document.getElementById(
        "recipes-page"
    );


const categoriesContainer =
    document.getElementById(
        "categories-container"
    );

const categoryImagePaths = new Map([
    ["pusryčiai", "assets/images/Breakfast.jpg"],
    ["pagrindiniai patiekalai", "assets/images/Main_Dishes.jpg"],
    ["desertai", "assets/images/Desert.jpg"],
    ["sveiki užkandžiai ir salotos", "assets/images/Healthy_Snacks_And_Salads.jpg"],
    ["sriubos", "assets/images/Soups.jpg"]
]);

const categoryRecipesContainer =
    document.getElementById(
        "category-recipes-container"
    );


const categoryRecipesTitle =
    document.getElementById(
        "category-recipes-title"
    );

const categoryRecipesDescription =
    document.getElementById(
        "category-recipes-description"
    );


const categoryRecipesPagination =
    document.getElementById(
        "category-recipes-pagination"
    );


const addCategoryButton =
    document.getElementById(
        "add-category-button"
    );


const backToCategoriesButton =
    document.getElementById(
        "back-to-categories-button"
    );


/* =========================
   CATEGORY MODALS
========================= */

const addCategoryModal =
    document.getElementById(
        "add-category-modal"
    );

const closeAddCategoryModal =
    document.getElementById(
        "close-add-category-modal"
    );

const addCategoryForm =
    document.getElementById(
        "add-category-form"
    );


const editCategoryModal =
    document.getElementById(
        "edit-category-modal"
    );

const closeEditCategoryModal =
    document.getElementById(
        "close-edit-category-modal"
    );

const editCategoryForm =
    document.getElementById(
        "edit-category-form"
    );


const deleteCategoryModal =
    document.getElementById(
        "delete-category-modal"
    );

const closeDeleteCategoryModal =
    document.getElementById(
        "close-delete-category-modal"
    );

const cancelDeleteCategory =
    document.getElementById(
        "cancel-delete-category"
    );

const confirmDeleteCategory =
    document.getElementById(
        "confirm-delete-category"
    );

const deleteCategoryName =
    document.getElementById(
        "delete-category-name"
    );


let categoryToDelete = null;


/* =========================
   CATEGORY STATE
========================= */

let currentCategoryId = null;
let currentCategoryPage = 1;

const categoryPageSize = 10;


/* =========================
   ADMIN CHECK
========================= */

function isCategoryAdmin() {

    const currentUser =
        getCurrentUser();

    return (
        currentUser &&
        currentUser.role === "Admin"
    );

}


/* =========================
   SHOW PAGE
========================= */

function showCategoryPage(
    page
) {

    if (recipesPage) {

        recipesPage.classList.add(
            "hidden"
        );

    }


    if (categoriesPage) {

        categoriesPage.classList.add(
            "hidden"
        );

    }


    if (categoryRecipesPage) {

        categoryRecipesPage.classList.add(
            "hidden"
        );

    }

    if (usersPage) {

        usersPage.classList.add(
            "hidden"
        );
    }


    if (page === "recipes") {

        if (recipesPage) {

            recipesPage.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if (page === "categories") {

        if (categoriesPage) {

            categoriesPage.classList.remove(
                "hidden"
            );

        }

        return;

    }

    if (page === "users") {

        if (usersPage) {

            usersPage.classList.remove(
                "hidden"
            );
        }

        return;
    }


    if (page === "category-recipes") {

        if (categoryRecipesPage) {

            categoryRecipesPage.classList.remove(
                "hidden"
            );

        }

    }

}


/* =========================
   LOAD ALL CATEGORIES
========================= */

async function loadCategoryCrud() {

    try {

        const response =
            await apiFetch(
                `${API_URL}/categories`
            );


        if (!response.ok) {

            throw new Error(
                "Nepavyko gauti kategorijų."
            );

        }


        const categories =
            await response.json();


        displayCategories(
            categories
        );


    } catch (error) {

        console.error(
            "Kategorijų gavimo klaida:",
            error
        );


        if (categoriesContainer) {

            categoriesContainer.innerHTML = `
                <div class="recipe-card">

                    <div class="recipe-card-content">

                        <h3>
                            Nepavyko įkelti kategorijų
                        </h3>

                        <p>
                            Patikrinkite, ar veikia API.
                        </p>

                    </div>

                </div>
            `;

        }

    }

}


/* =========================
   DISPLAY CATEGORIES
========================= */

function displayCategories(
    categories
) {

    if (!categoriesContainer) {

        return;

    }


    categoriesContainer.innerHTML = "";


    if (
        !categories ||
        categories.length === 0
    ) {

        categoriesContainer.innerHTML = `
            <div class="recipe-card">

                <div class="recipe-card-content">

                    <h3>
                        Kategorijų nėra
                    </h3>

                    <p>
                        Šiuo metu nėra sukurtų kategorijų.
                    </p>

                </div>

            </div>
        `;

        return;

    }


    categories.forEach(
        category => {

            const categoryImage =
                getStoredImageUrl(category.imageUrl) ||
                categoryImagePaths.get(
                    category.name?.trim().toLocaleLowerCase("lt-LT")
                );

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "recipe-card";


            const adminActions =
                isCategoryAdmin()
                    ? `
                        <div class="recipe-card-actions">

                            <button
                                type="button"
                                class="secondary-button edit-category-button">

                                Redaguoti

                            </button>

                            <button
                                type="button"
                                class="secondary-button delete-category-button">

                                Trinti

                            </button>

                        </div>
                    `
                    : "";


            card.innerHTML = `

                <div class="recipe-image category-image">
                    ${
                        categoryImage
                            ? `<img src="${categoryImage}" alt="${escapeCategoryHtml(category.name)}">`
                            : "<span>Kategorija</span>"
                    }
                </div>


                <div class="recipe-card-content">

                    <h3>
                        ${escapeCategoryHtml(
                            category.name
                        )}
                    </h3>


                    <p>
                        ${
                            escapeCategoryHtml(
                                category.description ||
                                "Aprašymo nėra."
                            )
                        }
                    </p>


                    <div class="recipe-card-actions">

                        <button
                            type="button"
                            class="primary-button view-category-button">

                            Peržiūrėti receptus

                        </button>

                        ${adminActions}

                    </div>

                </div>

            `;


            const viewButton =
                card.querySelector(
                    ".view-category-button"
                );


            viewButton.addEventListener(
                "click",
                () => {

                    openCategoryRecipes(
                        category
                    );

                }
            );


            if (isCategoryAdmin()) {

                const editButton =
                    card.querySelector(
                        ".edit-category-button"
                    );


                const deleteButton =
                    card.querySelector(
                        ".delete-category-button"
                    );


                editButton.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        openEditCategoryModal(
                            category
                        );

                    }
                );


                deleteButton.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        openDeleteCategoryModal(
                            category
                        );

                    }
                );

            }


            categoriesContainer.appendChild(
                card
            );

        }
    );

}


/* =========================
   ESCAPE HTML
========================= */

function escapeCategoryHtml(
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
   OPEN CATEGORY RECIPES
========================= */

async function openCategoryRecipes(
    category
) {

    currentCategoryId =
        category.id;

    currentCategoryPage = 1;


    if (categoryRecipesTitle) {

        categoryRecipesTitle.textContent =
            category.name;

    }


    if (categoryRecipesDescription) {

        categoryRecipesDescription.textContent =
            category.description ||
            "Šios kategorijos receptai.";

    }


    showCategoryPage(
        "category-recipes"
    );


    await loadCategoryRecipes(
        1
    );


    window.location.hash =
        `category/${category.id}`;

}


/* =========================
   LOAD CATEGORY RECIPES
========================= */

async function loadCategoryRecipes(
    page
) {

    currentCategoryPage =
        page;


    if (!currentCategoryId) {

        return;

    }


    if (categoryRecipesContainer) {

        categoryRecipesContainer.innerHTML = `
            <div class="recipe-card">

                <div class="recipe-card-content">

                    <h3>
                        Kraunama...
                    </h3>

                </div>

            </div>
        `;

    }


    try {

        const url =
            `${API_URL}/recipes?page=${page}&pageSize=${categoryPageSize}&categoryId=${currentCategoryId}`;


        const response =
            await apiFetch(
                url
            );


        if (!response.ok) {

            throw new Error(
                "Nepavyko gauti kategorijos receptų."
            );

        }


        const result =
            await response.json();

        if (
            result.items.length === 0 &&
            page > 1
        ) {

            await loadCategoryRecipes(
                page - 1
            );

            return;
        }


        displayCategoryRecipes(
            result.items || []
        );


        displayCategoryPagination(
            result
        );


    } catch (error) {

        console.error(
            "Kategorijos receptų klaida:",
            error
        );


        if (categoryRecipesContainer) {

            categoryRecipesContainer.innerHTML = `
                <div class="recipe-card">

                    <div class="recipe-card-content">

                        <h3>
                            Nepavyko įkelti receptų
                        </h3>

                        <p>
                            Patikrinkite, ar veikia API.
                        </p>

                    </div>

                </div>
            `;

        }


        if (categoryRecipesPagination) {

            categoryRecipesPagination.innerHTML =
                "";

        }

    }

}


/* =========================
   DISPLAY CATEGORY RECIPES
========================= */

function displayCategoryRecipes(
    recipes
) {

    if (!categoryRecipesContainer) {

        return;

    }


    categoryRecipesContainer.innerHTML =
        "";


    if (
        !recipes ||
        recipes.length === 0
    ) {

        categoryRecipesContainer.innerHTML = `
            <div class="recipe-card">

                <div class="recipe-card-content">

                    <h3>
                        Receptų nėra
                    </h3>

                    <p>
                        Šioje kategorijoje dar nėra receptų.
                    </p>

                </div>

            </div>
        `;

        return;

    }


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


            /*
             * Naudojame tą pačią ownership/role logiką
             * kaip pagrindiniame receptų lange.
             *
             * canEditRecipe(recipe)
             * canDeleteRecipe(recipe)
             */

            const canEdit =
                typeof canEditRecipe === "function" &&
                canEditRecipe(recipe);


            const canDelete =
                typeof canDeleteRecipe === "function" &&
                canDeleteRecipe(recipe);


            const editButton =
                canEdit
                    ? `
                        <button
                            type="button"
                            class="secondary-button category-recipe-edit-button">

                            Redaguoti

                        </button>
                    `
                    : "";


            const deleteButton =
                canDelete
                    ? `
                        <button
                            type="button"
                            class="secondary-button category-recipe-delete-button">

                            Trinti

                        </button>
                    `
                    : "";


            card.innerHTML = `

                <div class="recipe-image">
                    ${
                        recipeImagePath
                            ? `<img src="${recipeImagePath}" alt="${escapeCategoryHtml(recipe.title)}">`
                            : "<span>Receptas</span>"
                    }
                </div>


                <div class="recipe-card-content">

                    <h3>
                        ${escapeCategoryHtml(
                            recipe.title
                        )}
                    </h3>


                    <p>
                        ${
                            escapeCategoryHtml(
                                recipe.description ||
                                "Aprašymo nėra."
                            )
                        }
                    </p>


                    <div class="recipe-meta">
                        Paruošimo laikas: ${recipe.preparationTime} min.
                    </div>


                    <div class="recipe-card-actions">

                        <button
                            type="button"
                            class="primary-button category-recipe-view-button">

                            Peržiūrėti

                        </button>

                        ${editButton}

                        ${deleteButton}

                    </div>

                </div>

            `;


            /* =========================
               VIEW
            ========================= */

            const viewButton =
                card.querySelector(
                    ".category-recipe-view-button"
                );


            if (viewButton) {

                viewButton.addEventListener(
                    "click",
                    () => {

                        openCategoryRecipeModal(
                            recipe
                        );

                    }
                );

            }


            /* =========================
               EDIT
            ========================= */

            const editRecipeButton =
                card.querySelector(
                    ".category-recipe-edit-button"
                );


            if (editRecipeButton) {

                editRecipeButton.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        if (
                            typeof openEditRecipeModal ===
                            "function"
                        ) {

                            openEditRecipeModal(
                                recipe
                            );

                        }

                    }
                );

            }


            /* =========================
               DELETE
            ========================= */

            const deleteRecipeButton =
                card.querySelector(
                    ".category-recipe-delete-button"
                );


            if (deleteRecipeButton) {

                deleteRecipeButton.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        if (
                            typeof openDeleteRecipeModal ===
                            "function"
                        ) {

                            openDeleteRecipeModal(
                                recipe
                            );

                        }

                    }
                );

            }


            categoryRecipesContainer.appendChild(
                card
            );

        }
    );

}


/* =========================
   CATEGORY RECIPE MODAL
========================= */

async function openCategoryRecipeModal(
    recipe
) {

    const modal =
        document.getElementById(
            "recipe-modal"
        );


    const title =
        document.getElementById(
            "modal-title"
        );


    const description =
        document.getElementById(
            "modal-description"
        );


    const time =
        document.getElementById(
            "modal-time"
        );


    const instructions =
        document.getElementById(
            "modal-instructions"
        );


    if (
        !modal ||
        !title ||
        !description ||
        !time ||
        !instructions
    ) {

        return;

    }


    title.textContent =
        recipe.title;


    description.textContent =
        recipe.description ||
        "";


    time.textContent =
        `Paruošimo laikas: ${recipe.preparationTime} min.`;


    instructions.textContent =
        recipe.instructions ||
        "";


    if (
        typeof addIngredientsSection ===
        "function"
    ) {

        addIngredientsSection(
            modal,
            recipe
        );

    }


    if (
        typeof showModal ===
        "function"
    ) {

        showModal(
            modal
        );

    } else {

        modal.classList.remove(
            "hidden"
        );

    }

}


/* =========================
   CATEGORY PAGINATION
========================= */

function displayCategoryPagination(
    result
) {

    if (!categoryRecipesPagination) {

        return;

    }


    categoryRecipesPagination.innerHTML =
        "";


    const totalPages =
        result.totalPages || 0;


    if (totalPages <= 1) {

        return;

    }


    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "pagination-button";


        if (
            page === currentCategoryPage
        ) {

            button.classList.add(
                "active"
            );

        }


        button.textContent =
            page;


        button.addEventListener(
            "click",
            () => {

                loadCategoryRecipes(
                    page
                );

            }
        );


        categoryRecipesPagination.appendChild(
            button
        );

    }

}


/* =========================
   BACK TO CATEGORIES
========================= */

if (backToCategoriesButton) {

    backToCategoriesButton.addEventListener(
        "click",
        () => {

            currentCategoryId =
                null;


            currentCategoryPage =
                1;


            window.location.hash =
                "categories";


            showCategoryPage(
                "categories"
            );


            loadCategoryCrud();

        }
    );

}


/* =========================
   ADD CATEGORY MODAL
========================= */

if (addCategoryButton) {

    addCategoryButton.addEventListener(
        "click",
        () => {

            if (!isCategoryAdmin()) {

                return;

            }


            if (addCategoryForm) {

                addCategoryForm.reset();

            }


            if (addCategoryModal) {

                if (
                    typeof showModal ===
                    "function"
                ) {

                    showModal(
                        addCategoryModal
                    );

                } else {

                    addCategoryModal.classList.remove(
                        "hidden"
                    );

                }

            }

        }
    );

}


/* =========================
   CLOSE ADD CATEGORY MODAL
========================= */

if (closeAddCategoryModal) {

    closeAddCategoryModal.addEventListener(
        "click",
        () => {

            if (addCategoryModal) {

                if (
                    typeof hideModal ===
                    "function"
                ) {

                    hideModal(
                        addCategoryModal
                    );

                } else {

                    addCategoryModal.classList.add(
                        "hidden"
                    );

                }

            }

        }
    );

}


/* =========================
   CREATE CATEGORY
========================= */

if (addCategoryForm) {

    addCategoryForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!isCategoryAdmin()) {

                showToast(
                    "Tik Admin gali kurti kategorijas.",
                    "error"
                );

                return;

            }


            const formData =
                new FormData(
                    addCategoryForm
                );

            const imageFile = formData.get("image");
            const hasImage = imageFile instanceof File && imageFile.size > 0;

            if (hasImage && imageFile.size > 5 * 1024 * 1024) {
                showToast("Nuotrauka negali būti didesnė nei 5 MB.", "error");
                return;
            }

            const category = {
                name: formData.get("name"),
                description: formData.get("description") || null
            };

            try {

                const response =
                    await apiFetch(
                        hasImage
                            ? `${API_URL}/categories/with-image`
                            : `${API_URL}/categories`,
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
                                body: JSON.stringify(category)
                            }
                    );


                if (!response.ok) {

                    const errorText =
                        await response.text();


                    throw new Error(
                        errorText ||
                        "Nepavyko sukurti kategorijos."
                    );

                }


                addCategoryForm.reset();


                if (addCategoryModal) {

                    if (
                        typeof hideModal ===
                        "function"
                    ) {

                        hideModal(
                            addCategoryModal
                        );

                    } else {

                        addCategoryModal.classList.add(
                            "hidden"
                        );

                    }

                }


                await loadCategoryCrud();


                await loadCategories();


                showToast(
                    "Kategorija sėkmingai sukurta!"
                );


            } catch (error) {

                console.error(
                    "Kategorijos kūrimo klaida:",
                    error
                );


                showToast(
                    error.message || "Nepavyko sukurti kategorijos.",
                    "error"
                );

            }

        }
    );

}


/* =========================
   OPEN EDIT CATEGORY
========================= */

function openEditCategoryModal(
    category
) {

    const idInput =
        document.getElementById(
            "edit-category-id"
        );

    const nameInput =
        document.getElementById(
            "edit-category-name"
        );

    const descriptionInput =
        document.getElementById(
            "edit-category-description"
        );


    if (
        !idInput ||
        !nameInput ||
        !descriptionInput ||
        !editCategoryModal
    ) {

        return;

    }


    idInput.value =
        category.id;


    nameInput.value =
        category.name;


    descriptionInput.value =
        category.description || "";

    const imageInput =
        document.getElementById("edit-category-image");
    if (imageInput) {
        imageInput.value = "";
    }


    if (
        typeof showModal ===
        "function"
    ) {

        showModal(
            editCategoryModal
        );

    } else {

        editCategoryModal.classList.remove(
            "hidden"
        );

    }

}


/* =========================
   CLOSE EDIT CATEGORY
========================= */

if (closeEditCategoryModal) {

    closeEditCategoryModal.addEventListener(
        "click",
        () => {

            if (editCategoryModal) {

                if (
                    typeof hideModal ===
                    "function"
                ) {

                    hideModal(
                        editCategoryModal
                    );

                } else {

                    editCategoryModal.classList.add(
                        "hidden"
                    );

                }

            }

        }
    );

}


/* =========================
   UPDATE CATEGORY
========================= */

if (editCategoryForm) {

    editCategoryForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!isCategoryAdmin()) {

                showToast(
                    "Tik Admin gali redaguoti kategorijas.",
                    "error"
                );

                return;

            }


            const formData =
                new FormData(
                    editCategoryForm
                );


            const categoryId =
                formData.get(
                    "id"
                );


            const category = {

                name:
                    formData.get(
                        "name"
                    ),

                description:
                    formData.get(
                        "description"
                    ) || null

            };

            const imageFile = formData.get("image");
            if (imageFile instanceof File && imageFile.size > 0 &&
                imageFile.size > 5 * 1024 * 1024) {
                showToast("Nuotrauka negali būti didesnė nei 5 MB.", "error");
                return;
            }


            try {

                const response =
                    await apiFetch(
                        `${API_URL}/categories/${categoryId}`,
                        {

                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    category
                                )

                        }
                    );


                if (!response.ok) {

                    const errorText =
                        await response.text();


                    throw new Error(
                        errorText ||
                        "Nepavyko atnaujinti kategorijos."
                    );

                }

                if (imageFile instanceof File && imageFile.size > 0) {
                    await uploadImage(
                        `${API_URL}/categories/${categoryId}/image`,
                        imageFile
                    );
                }


                if (editCategoryModal) {

                    if (
                        typeof hideModal ===
                        "function"
                    ) {

                        hideModal(
                            editCategoryModal
                        );

                    } else {

                        editCategoryModal.classList.add(
                            "hidden"
                        );

                    }

                }


                await loadCategoryCrud();


                await loadCategories();


                showToast(
                    "Kategorija sėkmingai atnaujinta!"
                );


            } catch (error) {

                console.error(
                    "Kategorijos redagavimo klaida:",
                    error
                );


                showToast(
                    error.message || "Nepavyko atnaujinti kategorijos.",
                    "error"
                );

            }

        }
    );

}


/* =========================
   OPEN DELETE CATEGORY
========================= */

function openDeleteCategoryModal(
    category
) {

    categoryToDelete =
        category;


    if (deleteCategoryName) {

        deleteCategoryName.textContent =
            category.name;

    }


    if (deleteCategoryModal) {

        if (
            typeof showModal ===
            "function"
        ) {

            showModal(
                deleteCategoryModal
            );

        } else {

            deleteCategoryModal.classList.remove(
                "hidden"
            );

        }

    }

}


/* =========================
   CLOSE DELETE CATEGORY
========================= */

function closeDeleteCategory() {

    categoryToDelete =
        null;


    if (deleteCategoryModal) {

        if (
            typeof hideModal ===
            "function"
        ) {

            hideModal(
                deleteCategoryModal
            );

        } else {

            deleteCategoryModal.classList.add(
                "hidden"
            );

        }

    }

}


if (closeDeleteCategoryModal) {

    closeDeleteCategoryModal.addEventListener(
        "click",
        closeDeleteCategory
    );

}


if (cancelDeleteCategory) {

    cancelDeleteCategory.addEventListener(
        "click",
        closeDeleteCategory
    );

}


/* =========================
   DELETE CATEGORY
========================= */

if (confirmDeleteCategory) {

    confirmDeleteCategory.addEventListener(
        "click",
        async () => {

            if (!isCategoryAdmin()) {

                showToast(
                    "Tik Admin gali trinti kategorijas.",
                    "error"
                );

                return;

            }


            if (!categoryToDelete) {

                return;

            }


            try {

                const response =
                    await apiFetch(
                        `${API_URL}/categories/${categoryToDelete.id}`,
                        {
                            method: "DELETE"
                        }
                    );


                if (!response.ok) {

                    const errorText =
                        await response.text();


                    throw new Error(
                        errorText ||
                        "Nepavyko ištrinti kategorijos."
                    );

                }


                closeDeleteCategory();


                await loadCategoryCrud();


                await loadCategories();


                showToast(
                    "Kategorija sėkmingai ištrinta!"
                );


            } catch (error) {

                console.error(
                    "Kategorijos trynimo klaida:",
                    error
                );


                showToast(
                    error.message || "Nepavyko ištrinti kategorijos.",
                    "error"
                );

            }

        }
    );

}


/* =========================
   MODAL BACKDROP CLOSE
========================= */

if (addCategoryModal) {

    addCategoryModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                addCategoryModal
            ) {

                if (
                    typeof hideModal ===
                    "function"
                ) {

                    hideModal(
                        addCategoryModal
                    );

                } else {

                    addCategoryModal.classList.add(
                        "hidden"
                    );

                }

            }

        }
    );

}


if (editCategoryModal) {

    editCategoryModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                editCategoryModal
            ) {

                if (
                    typeof hideModal ===
                    "function"
                ) {

                    hideModal(
                        editCategoryModal
                    );

                } else {

                    editCategoryModal.classList.add(
                        "hidden"
                    );

                }

            }

        }
    );

}


if (deleteCategoryModal) {

    deleteCategoryModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                deleteCategoryModal
            ) {

                closeDeleteCategory();

            }

        }
    );

}


/* =========================
   HEADER NAVIGATION
========================= */

const categoriesNavLink =
    document.getElementById(
        "categories-nav-link"
    );

const recipesNavLink =
    document.getElementById(
        "recipes-nav-link"
    );


if (categoriesNavLink) {

    categoriesNavLink.addEventListener(
        "click",
        event => {

            event.preventDefault();


            window.location.hash =
                "categories";


            showCategoryPage(
                "categories"
            );


            loadCategoryCrud();

        }
    );

}


if (recipesNavLink) {

    recipesNavLink.addEventListener(
        "click",
        event => {

            event.preventDefault();


            window.location.hash =
                "recipes";


            showCategoryPage(
                "recipes"
            );

        }
    );

}


/* =========================
   LOGO NAVIGATION
========================= */

const logo =
    document.querySelector(
        ".logo"
    );


if (logo) {

    logo.addEventListener(
        "click",
        event => {

            event.preventDefault();


            window.location.hash =
                "recipes";


            showCategoryPage(
                "recipes"
            );

        }
    );

}


/* =========================
   HASH ROUTING
========================= */

async function handleCategoryHash() {

    const hash =
        window.location.hash;


    if (
        hash === "#categories"
    ) {

        showCategoryPage(
            "categories"
        );


        await loadCategoryCrud();


        return;

    }

    if (hash === "#users") {

        if (!isCategoryAdmin()) {

            window.location.hash =
                "recipes";

            showCategoryPage(
                "recipes"
            );

            return;
        }

        showCategoryPage(
            "users"
        );

        await loadAdminUsersPage();

        return;
    }


    if (
        hash.startsWith(
            "#category/"
        )
    ) {

        const categoryId =
            Number(
                hash.substring(
                    "#category/".length
                )
            );


        if (
            !Number.isInteger(
                categoryId
            ) ||
            categoryId <= 0
        ) {

            showCategoryPage(
                "categories"
            );


            await loadCategoryCrud();


            return;

        }


        try {

            const response =
                await apiFetch(
                    `${API_URL}/categories/${categoryId}`
                );


            if (!response.ok) {

                throw new Error(
                    "Kategorija nerasta."
                );

            }


            const category =
                await response.json();


            currentCategoryId =
                category.id;


            currentCategoryPage =
                1;


            if (categoryRecipesTitle) {

                categoryRecipesTitle.textContent =
                    category.name;

            }


            if (categoryRecipesDescription) {

                categoryRecipesDescription.textContent =
                    category.description ||
                    "Šios kategorijos receptai.";

            }


            showCategoryPage(
                "category-recipes"
            );


            await loadCategoryRecipes(
                1
            );


        } catch (error) {

            console.error(
                "Kategorijos hash klaida:",
                error
            );


            window.location.hash =
                "categories";


            showCategoryPage(
                "categories"
            );


            await loadCategoryCrud();

        }


        return;

    }


    showCategoryPage(
        "recipes"
    );

}


/* =========================
   INITIALIZATION
========================= */

function initializeCategoryUI() {

    if (isCategoryAdmin()) {

        if (addCategoryButton) {

            addCategoryButton.classList.remove(
                "hidden"
            );

        }

    } else {

        if (addCategoryButton) {

            addCategoryButton.classList.add(
                "hidden"
            );

        }

    }

}


initializeCategoryUI();


handleCategoryHash();


window.addEventListener(
    "hashchange",
    handleCategoryHash
);


/* =========================
   AUTH UI REFRESH
========================= */

setInterval(
    () => {

        const admin =
            isCategoryAdmin();


        if (addCategoryButton) {

            if (admin) {

                addCategoryButton.classList.remove(
                    "hidden"
                );

            } else {

                addCategoryButton.classList.add(
                    "hidden"
                );

            }

        }


        if (
            categoriesPage &&
            !categoriesPage.classList.contains(
                "hidden"
            )
        ) {

            loadCategoryCrud();

        }

    },
    1000
);