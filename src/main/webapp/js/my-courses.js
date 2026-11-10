
document.addEventListener("DOMContentLoaded", async function () {
    const courseList = document.getElementById("courseList");
    const searchInput = document.getElementById("courseQuery");
    const noResults = document.getElementById("noResults");

    if (!courseList) return;

    const addCourse = courseList.querySelector(".add-course");

    function filterCourses() {
        const query = searchInput?.value.trim().toLowerCase() || "";
        const cards = courseList.querySelectorAll(".my-course");

        let visibleCount = 0;

        cards.forEach(card => {
            const matches = card.textContent.toLowerCase().includes(query);
            card.hidden = !matches;

            if (matches) visibleCount++;
        });

        if (noResults) {
            noResults.hidden = visibleCount !== 0 || cards.length === 0;
        }
    }

    searchInput?.addEventListener("input", filterCourses);

    function closeMenus(except = null) {
        document.querySelectorAll("[data-menu][aria-expanded='true']").forEach(button => {
            const wrap = button.closest(".pop-wrap");

            if (wrap === except) return;

            button.setAttribute("aria-expanded", "false");

            const menu = wrap?.querySelector(".pop-menu");

            if (menu) menu.setAttribute("hidden", "");
        });
    }

    try {
        const response = await fetch("MyCoursesServlet", {
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error("Unable to load courses. Status: " + response.status);
        }

        const courses = await response.json();

        courseList.querySelector("#coursesLoading")?.remove();

        if (!Array.isArray(courses) || courses.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "empty-courses";
            emptyMessage.textContent = "You are not enrolled in any courses yet.";

            courseList.insertBefore(emptyMessage, addCourse);

            if (noResults) noResults.hidden = true;
            return;
        }

        courses.forEach(course => {
            const card = document.createElement("article");
            card.className = "my-course";

            // Course header
            const head = document.createElement("div");
            head.className = "my-course-head";

            const courseLink = document.createElement("a");
            courseLink.className = "my-course-link";
            courseLink.href = "#";

            courseLink.addEventListener("click", event => {
                event.preventDefault();
            });

            const title = document.createElement("h3");
            title.className = "my-course-title";
            title.textContent = course.courseTitle || "Untitled Course";

            const batch = document.createElement("p");
            batch.className = "my-course-batch";
            batch.textContent = course.courseCode || "No course code";

            courseLink.append(title, batch);
            head.appendChild(courseLink);

            // Course avatar
            const avatar = document.createElement("div");
            avatar.className = "my-course-avatar";

            avatar.innerHTML = `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 3 2.5 8 12 13l9.5-5L12 3z"/>
                    <path d="M6 10v5c3.5 3 8.5 3 12 0v-5"/>
                    <path d="M21.5 8v7"/>
                </svg>
            `;

            head.appendChild(avatar);

            // Course body
            const body = document.createElement("div");
            body.className = "my-course-body";

            const description = document.createElement("p");
            description.textContent =
                course.description || "No course description available.";

            const status = document.createElement("p");
            status.textContent = "Status: " + (course.status || "Active");

            body.append(description, status);

            // Course footer
            const foot = document.createElement("div");
            foot.className = "my-course-foot";

            const popWrap = document.createElement("div");
            popWrap.className = "pop-wrap";

            const menuButton = document.createElement("button");
            menuButton.type = "button";
            menuButton.className = "dots";
            menuButton.setAttribute("data-menu", "");
            menuButton.setAttribute("aria-expanded", "false");
            menuButton.setAttribute("aria-label", "Course options");

            menuButton.innerHTML = `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="5" cy="12" r="1.5"/>
                    <circle cx="12" cy="12" r="1.5"/>
                    <circle cx="19" cy="12" r="1.5"/>
                </svg>
            `;

            const menu = document.createElement("div");
            menu.className = "pop-menu";
            menu.setAttribute("hidden", "");

            const copyButton = document.createElement("button");
            copyButton.type = "button";
            copyButton.textContent = "Copy course link";
            copyButton.setAttribute("data-action", "copy-course");

            copyButton.dataset.url =
                window.location.href.split("?")[0] +
                "?courseId=" + encodeURIComponent(course.courseId);

            menu.appendChild(copyButton);
            popWrap.append(menuButton, menu);
            foot.appendChild(popWrap);

            // Assemble card
            card.append(head, body, foot);

            courseList.insertBefore(card, addCourse);
        });

        filterCourses();

    } catch (error) {
        console.error("My Courses Error:", error);

        courseList.querySelector("#coursesLoading")?.remove();

        const errorMessage = document.createElement("p");
        errorMessage.className = "empty-courses";
        errorMessage.textContent =
            "Unable to load your courses. Please refresh the page.";

        courseList.insertBefore(errorMessage, addCourse);
    }

    // Menu and copy-link functionality
    document.addEventListener("click", async function (event) {
        const target = event.target;

        const menuButton = target.closest("[data-menu]");

        if (menuButton) {
            const wrap = menuButton.closest(".pop-wrap");
            const menu = wrap?.querySelector(".pop-menu");

            if (!menu) return;

            const opening =
                menuButton.getAttribute("aria-expanded") !== "true";

            closeMenus(wrap);

            menuButton.setAttribute("aria-expanded", String(opening));
            menu.toggleAttribute("hidden", !opening);

            return;
        }

        const copyButton = target.closest("[data-action='copy-course']");

        if (copyButton) {
            const courseUrl = new URL(
                copyButton.dataset.url,
                window.location.href
            ).href;

            try {
                await navigator.clipboard.writeText(courseUrl);
                copyButton.textContent = "Link copied!";

                window.setTimeout(() => {
                    copyButton.textContent = "Copy course link";
                }, 1600);

            } catch (error) {
                window.prompt("Copy this course link:", courseUrl);
            }

            return;
        }

        if (!target.closest(".pop-wrap")) {
            closeMenus();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeMenus();
        }
    });

    addCourse?.addEventListener("click", function (event) {
        event.preventDefault();
    });
});