
document.addEventListener("DOMContentLoaded", async function () {
    const courseList = document.getElementById("courseList");
    const searchInput = document.getElementById("courseQuery");
    const noResults = document.getElementById("noResults");
    const loadingMessage = document.getElementById("coursesLoading");

    if (!courseList) return;

    let courses = [];

    // Search and filter courses
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

    // Close all open course menus
    function closeMenus(except = null) {
        document.querySelectorAll("[data-menu][aria-expanded='true']")
            .forEach(button => {
                const wrap = button.closest(".pop-wrap");

                if (wrap === except) return;

                button.setAttribute("aria-expanded", "false");

                const menu = wrap?.querySelector(".pop-menu");

                if (menu) menu.setAttribute("hidden", "");
            });
    }

    // Render all courses
    function renderCourses() {
        courseList.querySelectorAll(".my-course, .empty-courses")
            .forEach(element => element.remove());

        if (noResults) noResults.hidden = true;

        if (courses.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "empty-courses";
            emptyMessage.textContent =
                "There are no courses available at the moment.";

            courseList.appendChild(emptyMessage);
            return;
        }

        const query = searchInput?.value.trim().toLowerCase() || "";

        // Filter and sort courses:
        // Enrolled courses appear first, on the left.
        // Not enrolled courses appear after them.
        const filteredCourses = courses
            .filter(course => {
                const searchableText = `
                    ${course.courseTitle || ""}
                    ${course.courseCode || ""}
                    ${course.description || ""}
                `.toLowerCase();

                return searchableText.includes(query);
            })
            .sort((a, b) => {
                const aEnrolled = a.enrolled === true;
                const bEnrolled = b.enrolled === true;

                if (aEnrolled && !bEnrolled) return -1;
                if (!aEnrolled && bEnrolled) return 1;

                return 0;
            });

        filteredCourses.forEach(course => {
            const card = document.createElement("article");
            card.className = "my-course";

            const isEnrolled = course.enrolled === true;

            // Make enrolled course card clickable
            if (isEnrolled) {
                card.classList.add("active-course");
                card.setAttribute("role", "link");
                card.setAttribute("tabindex", "0");
                card.setAttribute(
                    "aria-label",
                    "Open " + (course.courseTitle || "course") + " dashboard"
                );

                card.addEventListener("click", function (event) {
                    if (event.target.closest(
                        ".pop-wrap, .enrollment-button"
                    )) return;

                    window.location.href = "dashboard-student.html";
                });

                card.addEventListener("keydown", function (event) {
                    if (event.target !== card) return;

                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        window.location.href = "dashboard-student.html";
                    }
                });

            } else {
                card.classList.add("inactive-course");
            }

            // Course header
            const head = document.createElement("div");
            head.className = "my-course-head";

            const courseLink = document.createElement("a");
            courseLink.className = "my-course-link";
            courseLink.href = isEnrolled ? "dashboard-student.html" : "#";

            if (!isEnrolled) {
                courseLink.addEventListener("click", function (event) {
                    event.preventDefault();
                });
            }

            const title = document.createElement("h3");
            title.className = "my-course-title";
            title.textContent = course.courseTitle || "Untitled Course";

            const code = document.createElement("p");
            code.className = "my-course-batch";
            code.textContent = course.courseCode || "No course code";

            courseLink.append(title, code);

            const avatar = document.createElement("div");
            avatar.className = "my-course-avatar";

            avatar.innerHTML = `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 3 2.5 8 12 13l9.5-5L12 3z"/>
                    <path d="M6 10v5c3.5 3 8.5 3 12 0v-5"/>
                    <path d="M21.5 8v7"/>
                </svg>
            `;

            head.append(courseLink, avatar);

            // Course body
            const body = document.createElement("div");
            body.className = "my-course-body";

            const description = document.createElement("p");
            description.textContent =
                course.description || "No course description available.";

            const status = document.createElement("p");
            status.className = "course-status";
            status.textContent = isEnrolled
                ? "Status: Enrolled"
                : "Status: Not Enrolled";

            if (!isEnrolled) {
                status.classList.add("inactive");
            }

            body.append(description, status);

            // Course footer
            const foot = document.createElement("div");
            foot.className = "my-course-foot";

            // Enrollment button
            const enrollmentButton = document.createElement("button");
            enrollmentButton.type = "button";
            enrollmentButton.className = "enrollment-button";

            enrollmentButton.dataset.action =
                isEnrolled ? "unenroll" : "enroll";

            enrollmentButton.textContent =
                isEnrolled ? "Unenroll" : "Enroll";

            enrollmentButton.classList.add(
                isEnrolled ? "unenroll-button" : "enroll-button"
            );

            enrollmentButton.addEventListener("click", async function () {
                const action = enrollmentButton.dataset.action;

                if (action === "unenroll") {
                    const confirmed = window.confirm(
                        `Are you sure you want to unenroll from ${course.courseTitle}?`
                    );

                    if (!confirmed) return;
                }

                enrollmentButton.disabled = true;
                enrollmentButton.textContent = "Please wait...";

                try {
                    const response = await fetch("EnrollmentServlet", {
                        method: "POST",
                        credentials: "same-origin",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded"
                        },
                        body: new URLSearchParams({
                            courseId: course.courseId,
                            action: action
                        })
                    });

                    const result = await response.json();

                    if (!response.ok || !result.success) {
                        throw new Error(
                            result.message || "Enrollment operation failed."
                        );
                    }

                    // Update course enrollment status
                    course.enrolled = action === "enroll";

                    // Refresh course cards and sorting
                    renderCourses();
                    filterCourses();

                    // Refresh notification indicator and list
                    document.dispatchEvent(
                        new Event("notifications:refresh")
                    );

                    alert(result.message);

                } catch (error) {
                    console.error("Enrollment Error:", error);

                    alert(error.message || "Something went wrong.");

                    enrollmentButton.disabled = false;
                    enrollmentButton.textContent =
                        action === "enroll" ? "Enroll" : "Unenroll";
                }
            });

            // Three-dot menu
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

            foot.append(enrollmentButton, popWrap);

            // Assemble card
            card.append(head, body, foot);
            courseList.appendChild(card);
        });
    }

    // Load all available courses
    try {
        const response = await fetch("AvailableCoursesServlet", {
            method: "GET",
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error(
                "Unable to load courses. Status: " + response.status
            );
        }

        courses = await response.json();

        if (!Array.isArray(courses)) {
            throw new Error("Invalid course data received.");
        }

        renderCourses();
        filterCourses();

    } catch (error) {
        console.error("My Courses Error:", error);

        const errorMessage = document.createElement("p");
        errorMessage.className = "empty-courses";
        errorMessage.textContent =
            "Unable to load courses. Please refresh the page.";

        courseList.appendChild(errorMessage);

    } finally {
        // Always hide loading message after loading attempt
        if (loadingMessage) {
            loadingMessage.hidden = true;
        }
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

        const copyButton = target.closest(
            "[data-action='copy-course']"
        );

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
});
