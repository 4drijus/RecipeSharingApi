const usersNavLink =
    document.getElementById(
        "users-nav-link"
    );

const usersContainer =
    document.getElementById(
        "users-container"
    );

const usersStatus =
    document.getElementById(
        "users-status"
    );

const refreshUsersButton =
    document.getElementById(
        "refresh-users-button"
    );

const userDetailsModal =
    document.getElementById(
        "user-details-modal"
    );

const userDetailsStatus =
    document.getElementById(
        "user-details-status"
    );

const userDetailsList =
    document.getElementById(
        "user-details-list"
    );

const deleteUserModal =
    document.getElementById(
        "delete-user-modal"
    );

const deleteUserMessage =
    document.getElementById(
        "delete-user-message"
    );

const deleteUserStatus =
    document.getElementById(
        "delete-user-status"
    );

let userToDelete = null;


function setUserStatus(element, message, type = "") {

    if (!element) {
        return;
    }

    element.textContent = message;

    if (type) {
        element.dataset.type = type;
    } else {
        delete element.dataset.type;
    }
}


async function readApiError(response) {

    const message =
        await response.text();

    return message ||
        `Užklausa nepavyko (HTTP ${response.status}).`;
}


async function loadAdminUsersPage(notice = "") {

    if (getCurrentUser()?.role !== "Admin") {
        return;
    }

    if (usersContainer) {
        usersContainer.replaceChildren();
    }

    setUserStatus(
        usersStatus,
        "Kraunamas naudotojų sąrašas..."
    );

    try {

        const response =
            await apiFetch(
                `${API_URL}/users`
            );

        if (!response.ok) {
            throw new Error(
                await readApiError(response)
            );
        }

        const users =
            await response.json();

        renderUsers(users);

        setUserStatus(
            usersStatus,
            [
                notice,
                users.length
                    ? `Sistemoje iš viso naudotojų: ${users.length}.`
                    : "Naudotojų nėra."
            ].filter(Boolean).join(" "),
            notice ? "success" : ""
        );

    } catch (error) {

        console.error(
            "Naudotojų sąrašo klaida:",
            error
        );

        setUserStatus(
            usersStatus,
            [
                notice,
                error.message || "Nepavyko įkelti naudotojų."
            ].filter(Boolean).join(" "),
            "error"
        );
    }
}


function renderUsers(users) {

    if (!usersContainer) {
        return;
    }

    usersContainer.replaceChildren();

    const currentUserId =
        getCurrentUser()?.id;

    users.forEach(user => {

        const row =
            document.createElement("article");

        row.className = "user-row";

        const information =
            document.createElement("div");

        const username =
            document.createElement("h2");

        username.textContent = user.username;

        const email =
            document.createElement("p");

        email.textContent = user.email;

        information.append(
            username,
            email
        );

        const actions =
            document.createElement("div");

        actions.className = "user-row-actions";

        const detailsButton =
            document.createElement("button");

        detailsButton.type = "button";
        detailsButton.className = "secondary-button";
        detailsButton.textContent = "Peržiūrėti";
        detailsButton.addEventListener(
            "click",
            () => showUserDetails(user.id)
        );

        actions.append(detailsButton);

        if (Number(user.id) !== Number(currentUserId)) {

            const deleteButton =
                document.createElement("button");

            deleteButton.type = "button";
            deleteButton.className = "danger-button";
            deleteButton.textContent = "Pašalinti";
            deleteButton.addEventListener(
                "click",
                () => openDeleteUserModal(user)
            );

            actions.append(deleteButton);
        }

        row.append(
            information,
            actions
        );

        usersContainer.append(row);
    });
}


async function showUserDetails(userId) {

    if (getCurrentUser()?.role !== "Admin") {
        return;
    }

    setUserStatus(
        userDetailsStatus,
        "Kraunama naudotojo informacija..."
    );

    userDetailsList?.replaceChildren();
    showModal(userDetailsModal);

    try {

        const response =
            await apiFetch(
                `${API_URL}/users/${userId}`
            );

        if (!response.ok) {
            throw new Error(
                await readApiError(response)
            );
        }

        const user =
            await response.json();

        [
            ["ID", user.id],
            ["Vartotojo vardas", user.username],
            ["El. paštas", user.email],
            ["Rolė", user.role]
        ].forEach(([label, value]) => {

            const term =
                document.createElement("dt");

            term.textContent = label;

            const description =
                document.createElement("dd");

            description.textContent = value ?? "";

            userDetailsList.append(
                term,
                description
            );
        });

        setUserStatus(
            userDetailsStatus,
            ""
        );

    } catch (error) {

        console.error(
            "Naudotojo informacijos klaida:",
            error
        );

        setUserStatus(
            userDetailsStatus,
            error.message || "Nepavyko įkelti naudotojo informacijos.",
            "error"
        );
    }
}


function openDeleteUserModal(user) {

    if (
        getCurrentUser()?.role !== "Admin" ||
        Number(user.id) === Number(getCurrentUser()?.id)
    ) {
        return;
    }

    userToDelete = user;

    deleteUserMessage.textContent =
        `Ar tikrai norite pašalinti „${user.username}“ paskyrą?`;

    setUserStatus(
        deleteUserStatus,
        ""
    );

    showModal(deleteUserModal);
}


function closeDeleteUserModal() {

    hideModal(deleteUserModal);
    userToDelete = null;
}


async function deleteUser() {

    if (
        !userToDelete ||
        getCurrentUser()?.role !== "Admin"
    ) {
        return;
    }

    const user = userToDelete;
    const confirmButton =
        document.getElementById(
            "confirm-delete-user"
        );

    confirmButton.disabled = true;

    setUserStatus(
        deleteUserStatus,
        "Šalinama paskyra..."
    );

    try {

        const response =
            await apiFetch(
                `${API_URL}/users/${user.id}`,
                {
                    method: "DELETE"
                }
            );

        if (!response.ok) {
            throw new Error(
                await readApiError(response)
            );
        }

        closeDeleteUserModal();

        await loadAdminUsersPage(
            `„${user.username}“ paskyra pašalinta.`
        );

    } catch (error) {

        console.error(
            "Naudotojo šalinimo klaida:",
            error
        );

        setUserStatus(
            deleteUserStatus,
            error.message || "Nepavyko pašalinti paskyros.",
            "error"
        );

    } finally {

        confirmButton.disabled = false;
    }
}


if (usersNavLink) {

    usersNavLink.addEventListener(
        "click",
        event => {

            event.preventDefault();

            if (getCurrentUser()?.role !== "Admin") {
                return;
            }

            if (window.location.hash === "#users") {

                loadAdminUsersPage();

            } else {

                window.location.hash = "users";
            }
        }
    );
}


if (refreshUsersButton) {

    refreshUsersButton.addEventListener(
        "click",
        loadAdminUsersPage
    );
}


document
    .getElementById("close-user-details-modal")
    .addEventListener(
        "click",
        () => hideModal(userDetailsModal)
    );

userDetailsModal.addEventListener(
    "click",
    event => {

        if (event.target === userDetailsModal) {
            hideModal(userDetailsModal);
        }
    }
);

document
    .getElementById("close-delete-user-modal")
    .addEventListener(
        "click",
        closeDeleteUserModal
    );

document
    .getElementById("cancel-delete-user")
    .addEventListener(
        "click",
        closeDeleteUserModal
    );

document
    .getElementById("confirm-delete-user")
    .addEventListener(
        "click",
        deleteUser
    );

deleteUserModal.addEventListener(
    "click",
    event => {

        if (event.target === deleteUserModal) {
            closeDeleteUserModal();
        }
    }
);
