const API_URL = "http://localhost:5000/api";


/* =========================
   MODAL SCROLL LOCK
========================= */

let openModalCount = 0;
let savedScrollPosition = 0;


function lockBodyScroll() {

    if (openModalCount === 0) {

        savedScrollPosition =
            window.scrollY;

        document.body.style.position =
            "fixed";

        document.body.style.top =
            `-${savedScrollPosition}px`;

        document.body.style.left =
            "0";

        document.body.style.right =
            "0";

        document.body.style.width =
            "100%";

        document.body.classList.add(
            "modal-open"
        );
    }

    openModalCount++;
}


function unlockBodyScroll() {

    if (openModalCount <= 0) {
        return;
    }

    openModalCount--;

    if (openModalCount === 0) {

        document.body.classList.remove(
            "modal-open"
        );

        document.body.style.position =
            "";

        document.body.style.top =
            "";

        document.body.style.left =
            "";

        document.body.style.right =
            "";

        document.body.style.width =
            "";

        window.scrollTo(
            0,
            savedScrollPosition
        );
    }
}


function showModal(modal) {

    if (!modal) {
        return;
    }

    if (
        modal.classList.contains(
            "hidden"
        )
    ) {

        modal.classList.remove(
            "hidden"
        );

        lockBodyScroll();
    }
}


function hideModal(modal) {

    if (!modal) {
        return;
    }

    if (
        !modal.classList.contains(
            "hidden"
        )
    ) {

        modal.classList.add(
            "hidden"
        );

        unlockBodyScroll();
    }
}


/* =========================
   AUTHENTICATION HELPERS
========================= */

function getCurrentUser() {

    const accessToken =
        localStorage.getItem(
            "accessToken"
        );

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


/* =========================
   API FETCH + REFRESH TOKEN
========================= */

async function refreshAccessToken() {

    const refreshToken =
        localStorage.getItem(
            "refreshToken"
        );

    if (!refreshToken) {
        return false;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/auth/refresh`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        refreshToken:
                            refreshToken
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


if (loginButton) {

    loginButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            showModal(
                loginModal
            );
        }
    );
}


if (closeLoginModal) {

    closeLoginModal.addEventListener(
        "click",
        () => {

            hideModal(
                loginModal
            );
        }
    );
}


if (loginModal) {

    loginModal.addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "login-modal"
            ) {

                hideModal(
                    loginModal
                );
            }
        }
    );
}


if (loginForm) {

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


                hideModal(
                    loginModal
                );


                updateAuthUI();


                if (
                    typeof loadRecipes ===
                    "function"
                ) {

                    await loadRecipes(
                        1
                    );
                }


                if (
                    typeof loadCategoryCrud ===
                    "function"
                ) {

                    await loadCategoryCrud();
                }


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
}


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


if (registerButton) {

    registerButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            showModal(
                registerModal
            );
        }
    );
}


if (closeRegisterModal) {

    closeRegisterModal.addEventListener(
        "click",
        () => {

            hideModal(
                registerModal
            );
        }
    );
}


if (registerModal) {

    registerModal.addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "register-modal"
            ) {

                hideModal(
                    registerModal
                );
            }
        }
    );
}


if (registerForm) {

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


                hideModal(
                    registerModal
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
}


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

        if (loginButton) {

            loginButton.classList.add(
                "hidden"
            );
        }


        if (registerButton) {

            registerButton.classList.add(
                "hidden"
            );
        }


        if (logoutButton) {

            logoutButton.classList.remove(
                "hidden"
            );
        }


        if (
            typeof addRecipeButton !==
            "undefined" &&
            addRecipeButton
        ) {

            addRecipeButton.classList.remove(
                "hidden"
            );
        }


    } else {

        if (loginButton) {

            loginButton.classList.remove(
                "hidden"
            );
        }


        if (registerButton) {

            registerButton.classList.remove(
                "hidden"
            );
        }


        if (logoutButton) {

            logoutButton.classList.add(
                "hidden"
            );
        }


        if (
            typeof addRecipeButton !==
            "undefined" &&
            addRecipeButton
        ) {

            addRecipeButton.classList.add(
                "hidden"
            );
        }
    }
}


/* =========================
   LOGOUT
========================= */

if (logoutButton) {

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


            if (
                typeof loadRecipes ===
                "function"
            ) {

                await loadRecipes(
                    1
                );
            }


            alert(
                "Sėkmingai atsijungėte."
            );
        }
    );
}


/* =========================
   MOBILE MENU
========================= */

const menuToggle =
    document.getElementById(
        "menu-toggle"
    );


const mobileNav =
    document.querySelector(
        ".desktop-nav"
    );


if (
    menuToggle &&
    mobileNav
) {

    menuToggle.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            mobileNav.classList.toggle(
                "active"
            );
        }
    );


    mobileNav
        .querySelectorAll("a")
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        mobileNav.classList.remove(
                            "active"
                        );
                    }
                );
            }
        );
}