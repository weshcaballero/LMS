
document.addEventListener("DOMContentLoaded", function () {

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

        const date = new Date(dateValue.replace(" ", "T"));

        if (isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }


    // CREATE ASSIGNMENT ELEMENT
    function createAssignmentElement(assignment) {

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
        date.textContent = `Due: ${formatDate(assignment.dueDate)}`;

        textContainer.appendChild(title);
        textContainer.appendChild(course);
        textContainer.appendChild(date);

        item.appendChild(icon);
        item.appendChild(textContainer);

        return item;
    }


    // LOAD ASSIGNMENTS
    async function loadAssignments() {

        if (!assignmentList) {
            return;
        }

        try {

            const response = await fetch("AssignmentServlet");

            if (!response.ok) {
                throw new Error("Unable to load assignments.");
            }

            const assignments = await response.json();

            assignmentList.innerHTML = "";

            if (!Array.isArray(assignments) || assignments.length === 0) {

                if (assignmentsEmpty) {
                    assignmentsEmpty.hidden = false;
                }

                return;
            }

            if (assignmentsEmpty) {
                assignmentsEmpty.hidden = true;
            }

            assignments.forEach(function (assignment) {
                assignmentList.appendChild(
                    createAssignmentElement(assignment)
                );
            });

        } catch (error) {

            console.error("Assignment loading error:", error);

            if (assignmentsLoading) {
                assignmentsLoading.textContent =
                    "Unable to load assignments. Please try again.";
            }
        }
    }


    // LOAD ACTIVE ENROLLED COURSES
    async function loadEnrolledCourses() {

        if (!enrolledCoursesElement) {
            return;
        }

        try {

            const response = await fetch("MyCoursesServlet");

            if (!response.ok) {
                throw new Error("Unable to load enrolled courses.");
            }

            const courses = await response.json();

            const activeCourses = courses.filter(function (course) {
                return course.status === "active";
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
            return;
        }

        try {

            const response = await fetch("LessonServlet");

            if (!response.ok) {
                throw new Error("Unable to load lessons.");
            }

            const lessons = await response.json();

            lessonList.innerHTML = "";

            if (!Array.isArray(lessons) || lessons.length === 0) {

                if (lessonsEmpty) {
                    lessonsEmpty.hidden = false;
                }

                return;
            }

            if (lessonsEmpty) {
                lessonsEmpty.hidden = true;
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

                    const details = document.createElement("details");
                    details.className = "dashboard-lesson";

                    const summary = document.createElement("summary");
                    summary.textContent = lesson.lessonTitle;

                    const content = document.createElement("p");

                    content.textContent =
                        lesson.lessonContent || "No lesson content available.";

                    details.appendChild(summary);
                    details.appendChild(content);

                    lessonItem.appendChild(details);
                    courseLessonList.appendChild(lessonItem);
                });

                courseItem.appendChild(courseLessonList);
                lessonList.appendChild(courseItem);
            });

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

        const materialTitle = document.createElement("strong");

        materialTitle.textContent =
            material.materialTitle || "Untitled Material";

        const course = document.createElement("span");

        course.textContent =
            `${material.courseCode || ""} - ${material.courseTitle || ""}`;

        const description = document.createElement("p");

        description.textContent =
            material.description || "No description available.";

        item.appendChild(materialTitle);
        item.appendChild(course);
        item.appendChild(description);

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
            return;
        }

        try {

            const response = await fetch("MaterialServlet");

            if (!response.ok) {
                throw new Error("Unable to load learning materials.");
            }

            const materials = await response.json();

            materialList.innerHTML = "";

            if (!Array.isArray(materials) || materials.length === 0) {

                if (materialsEmpty) {
                    materialsEmpty.hidden = false;
                }

                return;
            }

            if (materialsEmpty) {
                materialsEmpty.hidden = true;
            }

            const groupedMaterials = new Map();

            materials.forEach(function (material) {

                const courseId = material.courseId;

                if (!groupedMaterials.has(courseId)) {

                    groupedMaterials.set(courseId, {
                        courseCode: material.courseCode,
                        courseTitle: material.courseTitle,
                        materials: []
                    });
                }

                groupedMaterials.get(courseId).materials.push(material);
            });

            groupedMaterials.forEach(function (course) {

                const courseItem = document.createElement("li");
                courseItem.className = "material-course-group";

                const courseHeading = document.createElement("strong");

                courseHeading.textContent =
                    `${course.courseCode} - ${course.courseTitle}`;

                courseItem.appendChild(courseHeading);

                const courseMaterialList = document.createElement("ul");

                courseMaterialList.className = "course-material-list";

                course.materials.forEach(function (material) {

                    courseMaterialList.appendChild(
                        createMaterialElement(material)
                    );
                });

                courseItem.appendChild(courseMaterialList);
                materialList.appendChild(courseItem);
            });

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
            `Submitted: ${formatDate(activity.submittedAt)}`;

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

            feedback.textContent = `Teacher feedback: ${activity.feedback}`;

            item.appendChild(feedback);
        }

        return item;
    }


    // LOAD STUDENT ACTIVITIES
    async function loadActivities() {

        if (!activityList) {
            return;
        }

        try {

            const response = await fetch("ActivityServlet");

            if (!response.ok) {
                throw new Error("Unable to load activities.");
            }

            const activities = await response.json();

            activityList.innerHTML = "";

            if (!Array.isArray(activities) || activities.length === 0) {

                if (activitiesEmpty) {
                    activitiesEmpty.hidden = false;
                }

                return;
            }

            if (activitiesEmpty) {
                activitiesEmpty.hidden = true;
            }

            activities.forEach(function (activity) {

                activityList.appendChild(
                    createActivityElement(activity)
                );
            });

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
    loadAssignments();
    loadEnrolledCourses();
    loadLessons();
    loadMaterials();
    loadActivities();

});
