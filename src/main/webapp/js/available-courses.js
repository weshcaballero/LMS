
document.addEventListener("DOMContentLoaded", async function () {
    const courseList = document.getElementById("availableCourseList");
    const searchInput = document.getElementById("courseQuery");
    const noResults = document.getElementById("noResults");

    if (!courseList) return;

    let courses = [];

    function renderCourses() {
        const query = searchInput?.value.trim().toLowerCase() || "";

        const filteredCourses = courses.filter(course => {
            const searchableText = `
                ${course.courseTitle || ""}
                ${course.courseCode || ""}
                ${course.description || ""}
            `.toLowerCase();

            return searchableText.includes(query);
        });

        courseList.replaceChildren();

        if (filteredCourses.length === 0) {
            if (noResults) {
                noResults.hidden = courses.length === 0;
            }

            if (courses.length === 0) {
                const emptyMessage = document.createElement("p");
                emptyMessage.className = "empty-courses";
                emptyMessage.textContent =
                    "There are no available courses at the moment.";

                courseList.appendChild(emptyMessage);
            }

            return;
        }

        if (noResults) noResults.hidden = true;

        filteredCourses.forEach(course => {
            const card = document.createElement("article");
            card.className = "my-course";

            // Course header
            const head = document.createElement("div");
            head.className = "my-course-head";

            const courseInfo = document.createElement("div");
            courseInfo.className = "my-course-link";

            const title = document.createElement("h3");
            title.className = "my-course-title";
            title.textContent = course.courseTitle || "Untitled Course";

            const code = document.createElement("p");
            code.className = "my-course-batch";
            code.textContent = course.courseCode || "No course code";

            courseInfo.append(title, code);

            const avatar = document.createElement("div");
            avatar.className = "my-course-avatar";

            avatar.innerHTML = `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 3 2.5 8 12 13l9.5-5L12 3z"/>
                    <path d="M6 10v5c3.5 3 8.5 3 12 0v-5"/>
                    <path d="M21.5 8v7"/>
                </svg>
            `;

            head.append(courseInfo, avatar);

            // Course body
            const body = document.createElement("div");
            body.className = "my-course-body";

            const description = document.createElement("p");
            description.textContent =
                course.description || "No course description available.";

            const status = document.createElement("p");
            status.textContent = "Available Course";

            body.append(description, status);

            // Enrollment status
            const foot = document.createElement("div");
            foot.className = "my-course-foot";

            const label = document.createElement("span");
            label.className = "course-availability";

            if (course.enrolled === true) {
                label.textContent = "Enrolled";
                label.classList.add("enrolled");
            } else {
                label.textContent = "Not yet enrolled";
            }

            foot.appendChild(label);

            card.append(head, body, foot);
            courseList.appendChild(card);
        });
    }

    searchInput?.addEventListener("input", renderCourses);

    try {
        const response = await fetch("AvailableCoursesServlet", {
            method: "GET",
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error(
                "Unable to load available courses. Status: " + response.status
            );
        }

        courses = await response.json();

        if (!Array.isArray(courses)) {
            throw new Error("Invalid course data received.");
        }

        renderCourses();

    } catch (error) {
        console.error("Available Courses Error:", error);

        courseList.replaceChildren();

        const errorMessage = document.createElement("p");
        errorMessage.className = "empty-courses";
        errorMessage.textContent =
            "Unable to load available courses. Please refresh the page.";

        courseList.appendChild(errorMessage);
    }
});
