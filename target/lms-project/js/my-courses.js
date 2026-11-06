/* Course search, card menus, and copy-link behavior for courses.html. */
(() => {
    "use strict";

    const searchForm = document.querySelector("#courseSearch");
    const searchInput = document.querySelector("#courseQuery");
    const courseList = document.querySelector(".course-list");
    const courses = [...document.querySelectorAll(".my-course")];
    const noResults = document.querySelector("#noResults");

    function filterCourses() {
        const query = searchInput.value.trim().toLocaleLowerCase();
        let visibleCount = 0;

        for (const course of courses) {
            const matches = course.textContent.toLocaleLowerCase().includes(query);
            course.hidden = !matches;
            if (matches) visibleCount += 1;
        }

    // Keep the add-course control visible even when no existing course matches.
    if (noResults) noResults.hidden = visibleCount !== 0;
}

    searchForm?.addEventListener("submit", (event) => event.preventDefault());
    searchInput?.addEventListener("input", filterCourses);

    function closeMenus(except = null) {
        document.querySelectorAll("[data-menu][aria-expanded='true']").forEach((button) => {
            const wrap = button.closest(".pop-wrap");
            if (wrap === except) return;
            button.setAttribute("aria-expanded", "false");
            wrap?.querySelector(".pop-menu")?.setAttribute("hidden", "");
        });
    }

    document.addEventListener("click", async (event) => {
        const menuButton = event.target.closest("[data-menu]");
        if (menuButton) {
            const wrap = menuButton.closest(".pop-wrap");
            const menu = wrap?.querySelector(".pop-menu");
        if (!menu) return;

            const opening = menuButton.getAttribute("aria-expanded") !== "true";
            closeMenus(wrap);
            menuButton.setAttribute("aria-expanded", String(opening));
            menu.toggleAttribute("hidden", !opening);
            return;
        }

    const copyButton = event.target.closest("[data-action='copy-course']");
    if (copyButton) {
        const courseUrl = new URL(copyButton.dataset.url || "", window.location.href).href;
        try {
            await navigator.clipboard.writeText(courseUrl);
            copyButton.textContent = "Link copied!";
            window.setTimeout(() => { copyButton.textContent = "Copy course link"; }, 1600);
    } catch (error) {
        // Clipboard access requires HTTPS or localhost in most browsers.
        window.prompt("Copy this course link:", courseUrl);
    }
        return;
    }

    if (!event.target.closest(".pop-wrap")) closeMenus();
});

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenus();
            document.querySelector("[data-menu]")?.focus();
        }
    });

  // The add-course link is a placeholder in the supplied HTML (#). Prevent it
  // from jumping the page until a real add-course destination is configured.
    document.querySelector(".add-course[href='#']")?.addEventListener("click", (event) => {
        event.preventDefault();
    });
})();
