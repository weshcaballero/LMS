
document.addEventListener("DOMContentLoaded", function () {

    console.log("DASHBOARD JS STARTED");

    // DASHBOARD ELEMENTS
    const assignmentList = document.getElementById("assignmentList");
    const assignmentsLoading = document.getElementById("assignmentsLoading");
    const assignmentsEmpty = document.getElementById("assignmentsEmpty");

    const enrolledCoursesElement = document.getElementById("enrolledCourses");

    const lessonList = document.getElementById("lessonList");
    const lessonsEmpty = document.getElementById("lessonsEmpty");

    const materialList = document.getElementById("materialList");
    const materialsEmpty = document.getElementById("materialsEmpty");

    const activityList = document.getElementById("activityList");
    const activitiesEmpty = document.getElementById("activitiesEmpty");


    // FORMAT DATE
    function formatDate(dateValue) {

        if (!dateValue) {
            return "No date available";
        }

        const date = new Date(
            String(dateValue).replace(" ", "T")
        );

        if (isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }


    // FETCH DATA
    async function fetchData(servletName) {

        console.log("Requesting:", servletName);

        const response = await fetch(servletName, {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "Accept": "application/json"
            },
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(
                servletName + " returned HTTP " + response.status
            );
        }

        const data = await response.json();

        console.log(servletName + " response:", data);

        return data;
    }


    // GET EXTERNAL LESSON LINK
    function getLessonUrl(lesson) {

        const title = (lesson.lessonTitle || "").toLowerCase();

        if (title.includes("html")) {
            return "https://www.w3schools.com/html/";
        }

        if (title.includes("css")) {
            return "https://www.w3schools.com/css/";
        }

        if (
            title.includes("javascript") ||
            title.includes("js")
        ) {
            return "https://www.w3schools.com/js/";
        }

        if (title.includes("java")) {
            return "https://www.w3schools.com/java/";
        }

        return "https://www.w3schools.com/";
    }


    // LOAD ASSIGNMENTS
    async function loadAssignments() {

        if (!assignmentList) {
            console.warn("assignmentList element not found.");
            return;
        }

        try {

            if (assignmentsEmpty) {
                assignmentsEmpty.hidden = true;
            }

            if (assignmentsLoading) {
                assignmentsLoading.textContent = "Loading assignments...";
            }

            const assignments = await fetchData("AssignmentServlet");

            assignmentList.innerHTML = "";

            if (!Array.isArray(assignments) || assignments.length === 0) {

                if (assignmentsEmpty) {
                    assignmentsEmpty.hidden = false;
                }

                return;
            }

            assignments.forEach(function (assignment) {

                const item = document.createElement("li");
                item.className = "assignment";

                const icon = document.createElement("span");
                icon.className = "assignment-icon";

                icon.innerHTML = `
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="3" y="2" width="18" height="20"
                            rx="4" fill="#111"/>
                        <path d="M8 8h8M8 12h8M8 16h5"
                            stroke="#fff"
                            stroke-width="2"
                            stroke-linecap="round"/>
                    </svg>
                `;

                const textContainer = document.createElement("div");
                textContainer.className = "assignment-text";

                const title = document.createElement("strong");

                title.textContent =
                    assignment.assignmentTitle || "Untitled Assignment";

                const course = document.createElement("span");

                course.textContent =
                    `${assignment.courseCode || ""} - ${assignment.courseTitle || ""}`;

                const date = document.createElement("span");
                date.className = "date";

                date.textContent =
                    "Due: " + formatDate(assignment.dueDate);

                textContainer.appendChild(title);
                textContainer.appendChild(course);
                textContainer.appendChild(date);

                item.appendChild(icon);
                item.appendChild(textContainer);

                assignmentList.appendChild(item);
            });

            if (assignmentsEmpty) {
                assignmentsEmpty.hidden = true;
            }

        } catch (error) {

            console.error("Assignment loading error:", error);

            assignmentList.innerHTML = "";

            const errorItem = document.createElement("li");

            errorItem.className = "assignment";

            errorItem.textContent =
                "Unable to load assignments. Please try again.";

            assignmentList.appendChild(errorItem);
        }
    }


    // LOAD ACTIVE ENROLLED COURSES
    async function loadEnrolledCourses() {

        if (!enrolledCoursesElement) {
            console.warn("enrolledCourses element not found.");
            return;
        }

        try {

            enrolledCoursesElement.textContent =
                "Loading your enrolled courses...";

            const courses = await fetchData("MyCoursesServlet");

            if (!Array.isArray(courses)) {
                throw new Error("Invalid course response.");
            }

            const activeCourses = courses.filter(function (course) {

                return String(course.status).toLowerCase() === "active";

            });

            if (activeCourses.length === 0) {

                enrolledCoursesElement.textContent =
                    "You are not enrolled in any courses yet.";

                return;
            }

            const courseNames = activeCourses.map(function (course) {

                return `${course.courseCode} - ${course.courseTitle}`;

            });

            enrolledCoursesElement.textContent =
                "You're enrolled in: " + courseNames.join(", ");

        } catch (error) {

            console.error("Course loading error:", error);

            enrolledCoursesElement.textContent =
                "Unable to load your enrolled courses.";
        }
    }


    // LOAD LESSONS
    async function loadLessons() {

        if (!lessonList) {
            console.warn("lessonList element not found.");
            return;
        }

        try {

            if (lessonsEmpty) {
                lessonsEmpty.hidden = true;
            }

            const lessons = await fetchData("LessonServlet");

            lessonList.innerHTML = "";

            if (!Array.isArray(lessons) || lessons.length === 0) {

                if (lessonsEmpty) {
                    lessonsEmpty.hidden = false;
                }

                return;
            }

            const groupedLessons = new Map();

            lessons.forEach(function (lesson) {

                const courseId = lesson.courseId;

                if (!groupedLessons.has(courseId)) {

                    groupedLessons.set(courseId, {
                        courseCode: lesson.courseCode,
                        courseTitle: lesson.courseTitle,
                        lessons: []
                    });
                }

                groupedLessons.get(courseId).lessons.push(lesson);
            });

            groupedLessons.forEach(function (course) {

                const courseItem = document.createElement("li");
                courseItem.className = "lesson-course-group";

                const courseHeading = document.createElement("strong");

                courseHeading.textContent =
                    `${course.courseCode} - ${course.courseTitle}`;

                courseItem.appendChild(courseHeading);

                const courseLessonList = document.createElement("ul");

                courseLessonList.className = "course-lesson-list";

                course.lessons.forEach(function (lesson) {

                    const lessonItem = document.createElement("li");

                    lessonItem.className = "lesson-link-item";

                    const lessonLink = document.createElement("a");

                    lessonLink.href = getLessonUrl(lesson);

                    lessonLink.textContent =
                        lesson.lessonTitle || "Untitled Lesson";

                    lessonLink.target = "_blank";
                    lessonLink.rel = "noopener noreferrer";

                    lessonItem.appendChild(lessonLink);

                    courseLessonList.appendChild(lessonItem);
                });

                courseItem.appendChild(courseLessonList);

                lessonList.appendChild(courseItem);
            });

            if (lessonsEmpty) {
                lessonsEmpty.hidden = true;
            }

        } catch (error) {

            console.error("Lesson loading error:", error);

            lessonList.innerHTML = "";

            const errorItem = document.createElement("li");

            errorItem.textContent =
                "Unable to load lessons. Please try again.";

            lessonList.appendChild(errorItem);
        }
    }


    // CREATE MATERIAL ELEMENT
    function createMaterialElement(material) {

        const item = document.createElement("li");

        item.className = "home-material-item";

        const title = document.createElement("strong");

        title.textContent =
            material.materialTitle || "Untitled Material";

        const course = document.createElement("span");

        course.textContent =
            `${material.courseCode || ""} - ${material.courseTitle || ""}`;

        item.appendChild(title);
        item.appendChild(course);

        if (material.description) {

            const description = document.createElement("p");

            description.textContent = material.description;

            item.appendChild(description);
        }

        if (material.filePath && material.filePath.trim() !== "") {

            const filePath = material.filePath.trim();

            const safePath =
                !/^\s*(javascript|data|vbscript):/i.test(filePath);

            if (safePath) {

                const fileLink = document.createElement("a");

                fileLink.href = filePath;

                fileLink.textContent =
                    material.fileName || "Open learning material";

                fileLink.target = "_blank";
                fileLink.rel = "noopener noreferrer";

                item.appendChild(fileLink);
            }

        } else if (material.fileName) {

            const fileName = document.createElement("span");

            fileName.textContent = material.fileName;

            item.appendChild(fileName);
        }

        return item;
    }


    // LOAD LEARNING MATERIALS
    async function loadMaterials() {

        if (!materialList) {
            console.warn("materialList element not found.");
            return;
        }

        try {

            if (materialsEmpty) {
                materialsEmpty.hidden = true;
            }

            const materials = await fetchData("MaterialServlet");

            materialList.innerHTML = "";

            if (!Array.isArray(materials) || materials.length === 0) {

                if (materialsEmpty) {
                    materialsEmpty.hidden = false;
                }

                return;
            }

            materials.forEach(function (material) {

                materialList.appendChild(
                    createMaterialElement(material)
                );
            });

            if (materialsEmpty) {
                materialsEmpty.hidden = true;
            }

        } catch (error) {

            console.error("Material loading error:", error);

            materialList.innerHTML = "";

            const errorItem = document.createElement("li");

            errorItem.textContent =
                "Unable to load learning materials. Please try again.";

            materialList.appendChild(errorItem);
        }
    }


    // CREATE ACTIVITY ELEMENT
    function createActivityElement(activity) {

        const item = document.createElement("li");

        item.className = "dashboard-activity";

        const title = document.createElement("strong");

        title.textContent =
            activity.assignmentTitle || "Untitled Assignment";

        const course = document.createElement("span");

        course.textContent =
            `${activity.courseCode || ""} - ${activity.courseTitle || ""}`;

        const submittedDate = document.createElement("span");

        submittedDate.textContent =
            "Submitted: " + formatDate(activity.submittedAt);

        const status = document.createElement("span");

        status.className = "activity-status";

        const statusText = activity.status || "pending";

        status.textContent =
            "Status: " +
            statusText.charAt(0).toUpperCase() +
            statusText.slice(1);

        item.appendChild(title);
        item.appendChild(course);
        item.appendChild(submittedDate);
        item.appendChild(status);

        if (activity.score !== null && activity.score !== undefined) {

            const score = document.createElement("span");

            score.textContent = `Score: ${activity.score}`;

            item.appendChild(score);
        }

        if (activity.feedback && activity.feedback.trim() !== "") {

            const feedback = document.createElement("p");

            feedback.textContent =
                "Teacher feedback: " + activity.feedback;

            item.appendChild(feedback);
        }

        return item;
    }


    // LOAD STUDENT ACTIVITIES
    async function loadActivities() {

        if (!activityList) {
            console.warn("activityList element not found.");
            return;
        }

        try {

            if (activitiesEmpty) {
                activitiesEmpty.hidden = true;
            }

            const activities = await fetchData("ActivityServlet");

            activityList.innerHTML = "";

            if (!Array.isArray(activities) || activities.length === 0) {

                if (activitiesEmpty) {
                    activitiesEmpty.hidden = false;
                }

                return;
            }

            activities.forEach(function (activity) {

                activityList.appendChild(
                    createActivityElement(activity)
                );
            });

            if (activitiesEmpty) {
                activitiesEmpty.hidden = true;
            }

        } catch (error) {

            console.error("Activity loading error:", error);

            activityList.innerHTML = "";

            const errorItem = document.createElement("li");

            errorItem.textContent =
                "Unable to load activities. Please try again.";

            activityList.appendChild(errorItem);
        }
    }


    // INITIALIZE DASHBOARD
    console.log("Starting dashboard requests...");

    loadAssignments();
    loadEnrolledCourses();
    loadLessons();
    loadMaterials();
    loadActivities();

    console.log("Dashboard initialization finished.");

});