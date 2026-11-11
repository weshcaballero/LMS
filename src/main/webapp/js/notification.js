
document.addEventListener("DOMContentLoaded", function () {
    const dropdown = document.getElementById("notificationDropdown");
    const bell = document.getElementById("notificationBell");
    const menu = document.getElementById("notificationMenu");
    const dot = document.getElementById("notificationDot");
    const list = document.getElementById("notificationList");
    const markAllButton = document.getElementById("markAllRead");

    if (!dropdown || !bell || !menu || !dot || !list) {
        return;
    }

    let notifications = [];

    function updateUnreadIndicator() {
        const hasUnread = notifications.some(item => !item.isRead);
        dot.hidden = !hasUnread;
    }

    function renderNotifications() {
        list.replaceChildren();

        if (notifications.length === 0) {
            const empty = document.createElement("p");
            empty.className = "notification-empty";
            empty.textContent = "You're all caught up!";
            list.appendChild(empty);
        } else {
            notifications.forEach(item => {
                const notification = document.createElement("button");
                notification.type = "button";
                notification.className = "notification-item";

                if (!item.isRead) {
                    notification.classList.add("unread");
                }

                const content = document.createElement("div");
                content.className = "notification-content";

                const title = document.createElement("strong");
                title.textContent = item.title;

                const message = document.createElement("p");
                message.textContent = item.message;

                const date = document.createElement("span");
                date.className = "notification-date";
                date.textContent = new Date(
                    item.createdAt.replace(" ", "T")
                ).toLocaleString();

                content.append(title, message, date);
                notification.appendChild(content);

                list.appendChild(notification);
            });
        }

        updateUnreadIndicator();

        if (markAllButton) {
            markAllButton.hidden =
                !notifications.some(item => !item.isRead);
        }
    }

    async function loadNotifications() {
        list.innerHTML =
            '<p class="notification-empty">Loading notifications...</p>';

        try {
            const response = await fetch("NotificationServlet", {
                credentials: "same-origin"
            });

            if (!response.ok) {
                throw new Error("Failed to load notifications: " + response.status);
            }

            notifications = await response.json();
            renderNotifications();

        } catch (error) {
            console.error("Notification Error:", error);

            list.innerHTML =
                '<p class="notification-empty">Unable to load notifications.</p>';
        }
    }

    function openMenu() {
        menu.hidden = false;
        bell.setAttribute("aria-expanded", "true");
        loadNotifications();
    }

    function closeMenu() {
        menu.hidden = true;
        bell.setAttribute("aria-expanded", "false");
    }

    bell.addEventListener("click", function (event) {
        event.stopPropagation();

        if (menu.hidden) {
            openMenu();
        } else {
            closeMenu();
        }
    });

    document.addEventListener("click", function (event) {
        if (!dropdown.contains(event.target)) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeMenu();
        }
    });

    markAllButton?.addEventListener("click", function () {
        alert("Mark as read will be connected to the database next.");
    });

    loadNotifications();
});
