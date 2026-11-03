
document.addEventListener("DOMContentLoaded", async function () {
    try {
        const response = await fetch("UserInfoServlet");

        if (!response.ok) {
            throw new Error("Unable to get user information. Status: " + response.status);
        }

        const user = await response.json();

        // Update the name in Home and Dashboard
        const nameElement = document.getElementById("userName");

        if (nameElement) {
            nameElement.textContent = user.userName;
        }

        // Update the Home greeting
        const greeting = document.querySelector(".greeting");

        if (greeting) {
            greeting.textContent = "Hi, " + user.userName + "!";
        }

        // Update avatar initials
        const avatar = document.getElementById("userAvatar");

        if (avatar) {
            const initials = user.userName
                .trim()
                .split(/\s+/)
                .map(name => name.charAt(0))
                .slice(0, 2)
                .join("");

            avatar.textContent = initials;
        }

    } catch (error) {
        console.error("User information error:", error);
    }
});
