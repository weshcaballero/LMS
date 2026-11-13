
document.addEventListener("DOMContentLoaded", function () {

    // HOME PAGE ELEMENTS
    const dueSoonList = document.getElementById("dueSoonList");
    const dueSoonEmpty = document.getElementById("dueSoonEmpty");

    const homeMaterialList = document.getElementById("homeMaterialList");
    const homeMaterialsEmpty = document.getElementById("homeMaterialsEmpty");

    const enrolledTrackList = document.getElementById("enrolledTrackList");
    const enrolledTrackEmpty = document.getElementById("enrolledTrackEmpty");


    // FORMAT DATE
    function formatDate(dateValue) {

        if (!dateValue) {
            return "No date available";
        }

        const date = new Date(dateValue.replace(" ", "T"));

        if (isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    }


    // GET ACTIVE ENROLLED COURSES
    async function loadEnrolledTracks() {

        if (!enrolledTrackList) {
            return;
        }

        try {

            const response = await fetch("MyCoursesServlet");

            if (!response.ok) {
                throw new Error("Unable to load enrolled courses.");
            }

            const courses = await response.json();

            enrolledTrackList.innerHTML = "";

            const activeCourses = Array.isArray(courses)
                ? courses.filter(function (course) {
                    return course.status === "active";
                })
                : [];

            if (activeCourses.length === 0) {

                if (enrolledTrackEmpty) {
                    enrolledTrackEmpty.hidden = false;
                }

                return;
            }

            if (enrolledTrackEmpty) {
                enrolledTrackEmpty.hidden = true;
            }

            activeCourses.forEach(function (course) {

                const item = document.createElement("li");
                item.className = "track-item";

                const courseName = document.createElement("p");

                courseName.textContent =
                    `${course.courseCode} - ${course.courseTitle}`;

                const viewLink = document.createElement("a");

                viewLink.href = "courses.html";
                viewLink.textContent = "View to-do";

                item.appendChild(courseName);
                item.appendChild(viewLink);

                enrolledTrackList.appendChild(item);
            });

        } catch (error) {

            console.error("Enrolled tracks loading error:", error);

            enrolledTrackList.innerHTML = "";

            const errorItem = document.createElement("li");

            errorItem.textContent =
                "Unable to load enrolled courses. Please try again.";

            enrolledTrackList.appendChild(errorItem);
        }
    }


    // GET ASSIGNMENTS DUE WITHIN 7 DAYS
    async function loadDueSoon() {

        if (!dueSoonList) {
            return;
        }

        try {

            const response = await fetch("AssignmentServlet");

            if (!response.ok) {
                throw new Error("Unable to load upcoming assignments.");
            }

            const assignments = await response.json();

            dueSoonList.innerHTML = "";

            const now = new Date();

            const sevenDaysLater = new Date(now);
            sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

            const upcomingAssignments = Array.isArray(assignments)
                ? assignments.filter(function (assignment) {

                    if (!assignment.dueDate) {
                        return false;
                    }

                    const dueDate = new Date(
                        assignment.dueDate.replace(" ", "T")
                    );

                    return (
                        !isNaN(dueDate.getTime()) &&
                        dueDate >= now &&
                        dueDate <= sevenDaysLater
                    );

                }).sort(function (a, b) {

                    return new Date(
                        a.dueDate.replace(" ", "T")
                    ) - new Date(
                        b.dueDate.replace(" ", "T")
                    );

                })
                : [];

            if (upcomingAssignments.length === 0) {

                if (dueSoonEmpty) {
                    dueSoonEmpty.hidden = false;
                }

                return;
            }

            if (dueSoonEmpty) {
                dueSoonEmpty.hidden = true;
            }

            upcomingAssignments.forEach(function (assignment) {

                const item = document.createElement("li");
                item.className = "home-due-item";

                const title = document.createElement("strong");

                title.textContent =
                    assignment.assignmentTitle || "Untitled Assignment";

                const course = document.createElement("span");

                course.textContent =
                    `${assignment.courseCode || ""} - ${assignment.courseTitle || ""}`;

                const dueDate = document.createElement("span");
                dueDate.className = "date";

                dueDate.textContent =
                    "Due: " + formatDate(assignment.dueDate);

                item.appendChild(title);
                item.appendChild(course);
                item.appendChild(dueDate);

                dueSoonList.appendChild(item);
            });

        } catch (error) {

            console.error("Due soon loading error:", error);

            dueSoonList.innerHTML = "";

            const errorItem = document.createElement("li");

            errorItem.textContent =
                "Unable to load upcoming assignments. Please try again.";

            dueSoonList.appendChild(errorItem);
        }
    }


    // LOAD CLASS LEARNING TOOLS
    async function loadHomeMaterials() {

        if (!homeMaterialList) {
            return;
        }

        try {

            const response = await fetch("MaterialServlet");

            if (!response.ok) {
                throw new Error("Unable to load learning materials.");
            }

            const materials = await response.json();

            homeMaterialList.innerHTML = "";

            if (!Array.isArray(materials) || materials.length === 0) {

                if (homeMaterialsEmpty) {
                    homeMaterialsEmpty.hidden = false;
                }

                return;
            }

            if (homeMaterialsEmpty) {
                homeMaterialsEmpty.hidden = true;
            }

            materials.forEach(function (material) {

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

                homeMaterialList.appendChild(item);
            });

        } catch (error) {

            console.error("Home materials loading error:", error);

            homeMaterialList.innerHTML = "";

            const errorItem = document.createElement("li");

            errorItem.textContent =
                "Unable to load class learning tools. Please try again.";

            homeMaterialList.appendChild(errorItem);
        }
    }


    // INITIALIZE HOME PAGE
    loadEnrolledTracks();
    loadDueSoon();
    loadHomeMaterials();

});
