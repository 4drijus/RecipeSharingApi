const API_URL = "http://localhost:5000/api";

const PAGE_SIZE = 9;

let currentPage = 1;
let totalPages = 1;


/* =========================
   AUTHENTICATION HELPERS
========================= */

function getCurrentUser() {

    const accessToken =
        localStorage.getItem("accessToken");

    if (!accessToken) {
        return null;
    }

    try {

        const payload =
            accessToken.split(".")[1];

        const decodedPayload =
            JSON.parse(
                atob(
                    payload
                        .replace(/-/g, "+")
                        .replace(/_/g, "/")
                )
            );

        const userId =
            decodedPayload[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
            ] ||
            decodedPayload.nameid ||
            decodedPayload.sub;

        const role =
            decodedPayload[
                "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
            ] ||
            decodedPayload.role;

        return {
            id: Number(userId),
            role: role
        };

    } catch (error) {

        console.error(
            "JWT nuskaitymo klaida:",
            error
        );

        return null;
    }
}


function canEditRecipe(recipe) {

    const currentUser =
        getCurrentUser();

    if (!currentUser) {
        return false;
    }

    if (
        currentUser.role === "Admin"
    ) {
        return true;
    }

    return (
        Number(recipe.userId) ===
        Number(currentUser.id)
    );
}


/*
 * Trinti gali tie patys vartotojai,
 * kurie gali redaguoti receptą:
 *
 * - Admin -> visus receptus
 * - User -> tik savo receptus
 * - Guest -> nieko
 */
function canDeleteRecipe(recipe) {

    return canEditRecipe(recipe);
}


/* =========================
   API FETCH + REFRESH TOKEN
========================= */

async function refreshAccessToken() {

    const refreshToken =
        localStorage.getItem("refreshToken");

    if (!refreshToken) {
        return false;
    }

    try {

        const response = await fetch(
            `${API_URL}/auth/refresh`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    refreshToken: refreshToken
                })
            }
        );

        if (!response.ok) {

            localStorage.removeItem(
                "accessToken"
            );

            localStorage.removeItem(
                "refreshToken"
            );

            updateAuthUI();

            return false;
        }

        const data =
            await response.json();

        localStorage.setItem(
            "accessToken",
            data.accessToken
        );

        if (data.refreshToken) {

            localStorage.setItem(
                "refreshToken",
                data.refreshToken
            );
        }

        return true;

    } catch (error) {

        console.error(
            "Refresh Token klaida:",
            error
        );

        localStorage.removeItem(
            "accessToken"
        );

        localStorage.removeItem(
            "refreshToken"
        );

        updateAuthUI();

        return false;
    }
}


async function apiFetch(
    url,
    options = {},
    retry = true
) {

    const accessToken =
        localStorage.getItem(
            "accessToken"
        );

    const headers = {
        ...(options.headers || {})
    };

    if (accessToken) {

        headers.Authorization =
            `Bearer ${accessToken}`;
    }

    const response =
        await fetch(
            url,
            {
                ...options,
                headers
            }
        );


    if (
        response.status === 401 &&
        retry
    ) {

        const refreshed =
            await refreshAccessToken();

        if (refreshed) {

            return apiFetch(
                url,
                options,
                false
            );
        }
    }

    return response;
}


/* =========================
   RECIPES + PAGINATION
========================= */

async function loadRecipes(page = currentPage) {

    try {

        const response = await apiFetch(
            `${API_URL}/recipes?page=${page}&pageSize=${PAGE_SIZE}`
        );

        if (!response.ok) {

            throw new Error(
                "Nepavyko gauti receptų"
            );
        }

        const data =
            await response.json();


        /*
         * Jeigu ištrynus paskutinį receptą
         * dabartiniame puslapyje nebeliko receptų,
         * grįžtame į ankstesnį puslapį.
         */
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


function displayRecipes(recipes) {

    const container =
        document.getElementById(
            "recipes-container"
        );

    container.innerHTML = "";


    recipes.forEach(recipe => {

        const card =
            document.createElement(
                "article"
            );

        card.className =
            "recipe-card";


        let actionButtons = `
            <button
                class="secondary-button view-recipe-button"
                type="button">

                Žiūrėti receptą

            </button>
        `;


        /*
         * Redaguoti rodome:
         * - Admin -> visiems receptams
         * - User -> tik savo receptams
         * - Guest -> niekam
         */

        if (canEditRecipe(recipe)) {

            actionButtons += `
                <button
                    class="secondary-button edit-recipe-button"
                    type="button">

                    Redaguoti

                </button>
            `;
        }


        /*
         * Trinti rodome:
         * - Admin -> visiems receptams
         * - User -> tik savo receptams
         * - Guest -> niekam
         */

        if (canDeleteRecipe(recipe)) {

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
                🍽️
            </div>

            <div class="recipe-card-content">

                <h3>
                    ${recipe.title}
                </h3>

                <p>
                    ${recipe.description ?? ""}
                </p>

                <div class="recipe-meta">
                    <span>
                        ⏱️ ${recipe.preparationTime} min
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

    });
}


/* =========================
   PAGINATION UI
========================= */

function displayPagination() {

    const pagination =
        document.getElementById(
            "pagination"
        );

    pagination.innerHTML = "";


    if (totalPages <= 1) {
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

            if (currentPage > 1) {

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
                currentPage < totalPages
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

function openRecipeModal(recipe) {

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


    modal.classList.remove(
        "hidden"
    );
}


function closeRecipeModal() {

    const modal =
        document.getElementById(
            "recipe-modal"
        );

    modal.classList.add(
        "hidden"
    );
}


document
    .getElementById("close-modal")
    .addEventListener(
        "click",
        closeRecipeModal
    );


document
    .getElementById("recipe-modal")
    .addEventListener(
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


addRecipeButton.addEventListener(
    "click",
    () => {

        addRecipeModal.classList.remove(
            "hidden"
        );

    }
);


closeAddRecipeModal.addEventListener(
    "click",
    () => {

        addRecipeModal.classList.add(
            "hidden"
        );

    }
);


addRecipeModal.addEventListener(
    "click",
    event => {

        if (
            event.target.id ===
            "add-recipe-modal"
        ) {

            addRecipeModal.classList.add(
                "hidden"
            );
        }

    }
);


/* =========================
   CATEGORIES
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
   CREATE RECIPE
========================= */

const addRecipeForm =
    document.getElementById(
        "add-recipe-form"
    );


addRecipeForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


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


        const accessToken =
            localStorage.getItem(
                "accessToken"
            );


        if (!accessToken) {

            alert(
                "Norint sukurti receptą reikia prisijungti."
            );

            return;
        }


        try {

            const response =
                await apiFetch(
                    `${API_URL}/recipes`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                recipe
                            )
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


            addRecipeModal.classList.add(
                "hidden"
            );


            currentPage = 1;

            await loadRecipes(
                currentPage
            );


            alert(
                "Receptas sėkmingai sukurtas!"
            );


        } catch (error) {

            console.error(
                "Recepto kūrimo klaida:",
                error
            );


            alert(
                "Nepavyko sukurti recepto."
            );
        }

    }
);


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


function openEditRecipeModal(recipe) {

    /*
     * Papildoma apsauga frontend'e.
     * Net jei mygtukas netyčia būtų parodytas,
     * User negalės atidaryti kito vartotojo recepto.
     */

    if (!canEditRecipe(recipe)) {

        alert(
            "Neturite teisės redaguoti šio recepto."
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


    editRecipeModal.classList.remove(
        "hidden"
    );
}


closeEditRecipeModal.addEventListener(
    "click",
    () => {

        editRecipeModal.classList.add(
            "hidden"
        );

    }
);


editRecipeModal.addEventListener(
    "click",
    event => {

        if (
            event.target.id ===
            "edit-recipe-modal"
        ) {

            editRecipeModal.classList.add(
                "hidden"
            );
        }

    }
);


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


            editRecipeForm.reset();


            editRecipeModal.classList.add(
                "hidden"
            );


            await loadRecipes(
                currentPage
            );


            alert(
                "Receptas sėkmingai atnaujintas!"
            );


        } catch (error) {

            console.error(
                "Recepto redagavimo klaida:",
                error
            );


            alert(
                "Nepavyko atnaujinti recepto."
            );
        }

    }
);


/* =========================
   DELETE RECIPE
========================= */

let recipeToDelete = null;


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

            <div class="modal-header">

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

            </div>

            <div class="modal-body">

                <p id="delete-recipe-message">
                    Ar tikrai norite ištrinti šį receptą?
                </p>

            </div>

            <div class="modal-actions">

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


function openDeleteRecipeModal(recipe) {

    /*
     * Papildoma apsauga frontend'e.
     * User negali atidaryti kito vartotojo
     * recepto trynimo lango.
     */

    if (!canDeleteRecipe(recipe)) {

        alert(
            "Neturite teisės trinti šio recepto."
        );

        return;
    }


    recipeToDelete =
        recipe;


    const modal =
        createDeleteRecipeModal();


    const message =
        document.getElementById(
            "delete-recipe-message"
        );


    message.textContent =
        `Ar tikrai norite ištrinti receptą „${recipe.title}“?`;


    modal.classList.remove(
        "hidden"
    );
}


function closeDeleteRecipeModal() {

    const modal =
        document.getElementById(
            "delete-recipe-modal"
        );


    if (modal) {

        modal.classList.add(
            "hidden"
        );
    }


    recipeToDelete =
        null;
}


async function deleteRecipe() {

    if (!recipeToDelete) {
        return;
    }


    const recipeId =
        recipeToDelete.id;


    if (
        !canDeleteRecipe(
            recipeToDelete
        )
    ) {

        closeDeleteRecipeModal();


        alert(
            "Neturite teisės trinti šio recepto."
        );

        return;
    }


    try {

        const response =
            await apiFetch(
                `${API_URL}/recipes/${recipeId}`,
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


        await loadRecipes(
            currentPage
        );


        alert(
            "Receptas sėkmingai ištrintas!"
        );


    } catch (error) {

        console.error(
            "Recepto trynimo klaida:",
            error
        );


        alert(
            "Nepavyko ištrinti recepto."
        );
    }
}


/* =========================
   LOGIN
========================= */

const loginButton =
    document.getElementById(
        "login-button"
    );


const loginModal =
    document.getElementById(
        "login-modal"
    );


const closeLoginModal =
    document.getElementById(
        "close-login-modal"
    );


const loginForm =
    document.getElementById(
        "login-form"
    );


loginButton.addEventListener(
    "click",
    event => {

        event.preventDefault();


        loginModal.classList.remove(
            "hidden"
        );

    }
);


closeLoginModal.addEventListener(
    "click",
    () => {

        loginModal.classList.add(
            "hidden"
        );

    }
);


loginModal.addEventListener(
    "click",
    event => {

        if (
            event.target.id ===
            "login-modal"
        ) {

            loginModal.classList.add(
                "hidden"
            );
        }

    }
);


loginForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const formData =
            new FormData(
                loginForm
            );


        const loginData = {

            username:
                formData.get(
                    "username"
                ),

            password:
                formData.get(
                    "password"
                )
        };


        try {

            const response =
                await fetch(
                    `${API_URL}/auth/login`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                loginData
                            )
                    }
                );


            if (!response.ok) {

                const errorText =
                    await response.text();


                throw new Error(
                    errorText ||
                    "Neteisingi prisijungimo duomenys"
                );
            }


            const data =
                await response.json();


            localStorage.setItem(
                "accessToken",
                data.accessToken
            );


            localStorage.setItem(
                "refreshToken",
                data.refreshToken
            );


            loginForm.reset();


            loginModal.classList.add(
                "hidden"
            );


            updateAuthUI();


            currentPage = 1;

            await loadRecipes(
                currentPage
            );


            alert(
                "Sėkmingai prisijungėte!"
            );


        } catch (error) {

            console.error(
                "Prisijungimo klaida:",
                error
            );


            alert(
                "Nepavyko prisijungti. Patikrinkite duomenis."
            );
        }

    }
);


/* =========================
   REGISTER
========================= */

const registerButton =
    document.getElementById(
        "register-button"
    );


const registerModal =
    document.getElementById(
        "register-modal"
    );


const closeRegisterModal =
    document.getElementById(
        "close-register-modal"
    );


const registerForm =
    document.getElementById(
        "register-form"
    );


registerButton.addEventListener(
    "click",
    event => {

        event.preventDefault();


        registerModal.classList.remove(
            "hidden"
        );

    }
);


closeRegisterModal.addEventListener(
    "click",
    () => {

        registerModal.classList.add(
            "hidden"
        );

    }
);


registerModal.addEventListener(
    "click",
    event => {

        if (
            event.target.id ===
            "register-modal"
        ) {

            registerModal.classList.add(
                "hidden"
            );
        }

    }
);


registerForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const formData =
            new FormData(
                registerForm
            );


        const registerData = {

            username:
                formData.get(
                    "username"
                ),

            email:
                formData.get(
                    "email"
                ),

            password:
                formData.get(
                    "password"
                )
        };


        try {

            const response =
                await fetch(
                    `${API_URL}/auth/register`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                registerData
                            )
                    }
                );


            if (!response.ok) {

                const errorText =
                    await response.text();


                throw new Error(
                    errorText ||
                    "Nepavyko užregistruoti vartotojo"
                );
            }


            registerForm.reset();


            registerModal.classList.add(
                "hidden"
            );


            alert(
                "Registracija sėkminga! Dabar galite prisijungti."
            );


        } catch (error) {

            console.error(
                "Registracijos klaida:",
                error
            );


            alert(
                "Nepavyko užregistruoti vartotojo."
            );
        }

    }
);


/* =========================
   AUTH UI
========================= */

const logoutButton =
    document.getElementById(
        "logout-button"
    );


function updateAuthUI() {

    const accessToken =
        localStorage.getItem(
            "accessToken"
        );


    if (accessToken) {

        loginButton.classList.add(
            "hidden"
        );

        registerButton.classList.add(
            "hidden"
        );

        logoutButton.classList.remove(
            "hidden"
        );

        addRecipeButton.classList.remove(
            "hidden"
        );

    } else {

        loginButton.classList.remove(
            "hidden"
        );

        registerButton.classList.remove(
            "hidden"
        );

        logoutButton.classList.add(
            "hidden"
        );

        addRecipeButton.classList.add(
            "hidden"
        );
    }
}


/* =========================
   LOGOUT
========================= */

logoutButton.addEventListener(
    "click",
    async event => {

        event.preventDefault();


        const refreshToken =
            localStorage.getItem(
                "refreshToken"
            );


        const accessToken =
            localStorage.getItem(
                "accessToken"
            );


        if (refreshToken) {

            try {

                await fetch(
                    `${API_URL}/auth/logout`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${accessToken}`
                        },

                        body:
                            JSON.stringify({
                                refreshToken:
                                    refreshToken
                            })
                    }
                );

            } catch (error) {

                console.error(
                    "Atsijungimo klaida:",
                    error
                );
            }
        }


        localStorage.removeItem(
            "accessToken"
        );


        localStorage.removeItem(
            "refreshToken"
        );


        updateAuthUI();


        currentPage = 1;

        await loadRecipes(
            currentPage
        );


        alert(
            "Sėkmingai atsijungėte."
        );
    }
);


/* =========================
   START APPLICATION
========================= */

updateAuthUI();

loadRecipes();

loadCategories();