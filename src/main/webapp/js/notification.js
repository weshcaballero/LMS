
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

        if (markAllButton) {
            markAllButton.hidden = !hasUnread;
        }
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
                const notification = document.createElement("div");
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
    }

    async function markNotificationsAsRead() {
        const unreadNotifications = notifications.filter(
            item => !item.isRead
        );

        if (unreadNotifications.length === 0) {
            return true;
        }

        const formData = new URLSearchParams();

        unreadNotifications.forEach(item => {
            formData.append("notificationId", item.notificationId);
        });

        try {
            const response = await fetch("MarkNotificationsReadServlet", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: formData.toString()
            });

            if (!response.ok) {
                throw new Error("Unable to mark notifications as read.");
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error("Database update failed.");
            }

            unreadNotifications.forEach(item => {
                item.isRead = true;
            });

            renderNotifications();

            return true;

        } catch (error) {
            console.error("Mark as Read Error:", error);
            return false;
        }
    }

    async function loadNotifications(markAsRead = false) {
        list.innerHTML =
            '<p class="notification-empty">Loading notifications...</p>';

        try {
            const response = await fetch("NotificationServlet", {
                credentials: "same-origin"
            });

            if (!response.ok) {
                throw new Error("Failed to load notifications.");
            }

            notifications = await response.json();

            renderNotifications();

            if (markAsRead) {
                await markNotificationsAsRead();
            }

        } catch (error) {
            console.error("Notification Error:", error);

            list.innerHTML =
                '<p class="notification-empty">Unable to load notifications.</p>';
        }
    }

    function openMenu() {
        menu.hidden = false;
        bell.setAttribute("aria-expanded", "true");

        loadNotifications(true);
    }

    function closeMenu() {
        menu.hidden = true;
        bell.setAttribute("aria-expanded", "false");
    }

    // nilagnat ngani...
    bell.addEventListener("click", function (event) {
        event.stopPropagation();

        if (menu.hidden) {
            openMenu();
        } else {
            closeMenu();
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (event) {
        if (!dropdown.contains(event.target)) {
            closeMenu();
        }
    });

    // Close dropdown using Escape
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeMenu();
        }
    });

    // Mark all notifications as read
    markAllButton?.addEventListener("click", function () {
        markNotificationsAsRead();
    });

    // Refresh notifications after successful enrollment
    document.addEventListener("notifications:refresh", function () {
        loadNotifications();
    });

    // Initial notification load
    loadNotifications();
});
