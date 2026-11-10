
document.addEventListener("DOMContentLoaded", function () {
    const dropdown = document.getElementById("profileDropdown");
    const avatar = document.getElementById("userAvatar");
    const menu = document.getElementById("profileMenu");

    if (!dropdown || !avatar || !menu) {
        return;
    }

    avatar.addEventListener("click", function (event) {
        event.stopPropagation();

        const isOpen = menu.classList.toggle("show");
        avatar.setAttribute("aria-expanded", isOpen);
    });

    document.addEventListener("click", function (event) {
        if (!dropdown.contains(event.target)) {
            menu.classList.remove("show");
            avatar.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            menu.classList.remove("show");
            avatar.setAttribute("aria-expanded", "false");
        }
    });
});
