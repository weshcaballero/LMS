
document.addEventListener("DOMContentLoaded", async function () {
    try {
        const response = await fetch("UserInfoServlet");

        if (!response.ok) {
            throw new Error(
                "Unable to get user information. Status: " + response.status
            );
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

        // Generate avatar initials
        const initials = user.userName
            .trim()
            .split(/\s+/)
            .map(name => name.charAt(0))
            .slice(0, 2)
            .join("");

        // Update avatar
        const avatar = document.getElementById("userAvatar");

        if (avatar) {
            avatar.textContent = initials;
        }

        // Update profile dropdown name
        const dropdownName =
            document.getElementById("dropdownUserName");

        if (dropdownName) {
            dropdownName.textContent = user.userName;
        }

        // Update profile dropdown email
        const dropdownEmail =
            document.getElementById("dropdownUserEmail");

        if (dropdownEmail) {
            dropdownEmail.textContent = user.email;
        }

    } catch (error) {
        console.error("User information error:", error);
    }
});
