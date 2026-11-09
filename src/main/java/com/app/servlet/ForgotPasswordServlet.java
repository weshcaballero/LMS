
package com.app.servlet;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Base64;

import com.app.config.DBConnection;
import com.app.service.EmailService;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/ForgotPasswordServlet")
public class ForgotPasswordServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doPost(HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");

        String email = request.getParameter("email");

        // Always show the same response to protect account privacy.
        String redirect = "forgot-password.html?sent=1";

        if (email == null || email.trim().isEmpty()) {
            response.sendRedirect(redirect);
            return;
        }

        email = email.trim();

        try (Connection connection = DBConnection.getConnection()) {

            int userId = -1;

            String findUser = """
                SELECT user_id
                FROM users
                WHERE email = ?
                """;

            try (PreparedStatement statement =
                    connection.prepareStatement(findUser)) {

                statement.setString(1, email);

                try (ResultSet result = statement.executeQuery()) {
                    if (result.next()) {
                        userId = result.getInt("user_id");
                    }
                }
            }

            // Do not reveal whether the email exists.
            if (userId == -1) {
                response.sendRedirect(redirect);
                return;
            }

            // Generate a secure random token.
            byte[] randomBytes = new byte[32];
            new SecureRandom().nextBytes(randomBytes);

            String token = Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(randomBytes);

            // Store only the SHA-256 hash.
            String tokenHash = hashToken(token);

            // Invalidate previous unused reset tokens.
            String invalidateSQL = """
                UPDATE password_resets
                SET used_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
                AND used_at IS NULL
                """;

            try (PreparedStatement statement =
                    connection.prepareStatement(invalidateSQL)) {

                statement.setInt(1, userId);
                statement.executeUpdate();
            }

            // Save the new token with a 15-minute expiration.
            String insertSQL = """
                INSERT INTO password_resets
                (user_id, token_hash, expires_at)
                VALUES (?, ?, ?)
                """;

            try (PreparedStatement statement =
                    connection.prepareStatement(insertSQL)) {

                statement.setInt(1, userId);
                statement.setString(2, tokenHash);
                statement.setTimestamp(
                    3,
                    Timestamp.valueOf(
                        LocalDateTime.now().plusMinutes(15)
                    )
                );

                statement.executeUpdate();
            }

            // Build the reset link.
            String resetLink = request.getScheme()
                    + "://"
                    + request.getServerName()
                    + ":"
                    + request.getServerPort()
                    + request.getContextPath()
                    + "/reset-password.html?token="
                    + token;

            try {
                EmailService.sendResetEmail(email, resetLink);

            } catch (Exception emailError) {

                // Invalidate the token if sending the email fails.
                String cleanupSQL = """
                    UPDATE password_resets
                    SET used_at = CURRENT_TIMESTAMP
                    WHERE token_hash = ?
                    """;

                try (PreparedStatement statement =
                        connection.prepareStatement(cleanupSQL)) {

                    statement.setString(1, tokenHash);
                    statement.executeUpdate();
                }

                throw emailError;
            }

        } catch (Exception e) {
            getServletContext().log(
                "Forgot password request failed.", e
            );
        }

        response.sendRedirect(redirect);
    }

    private String hashToken(String token) throws Exception {

        MessageDigest digest = MessageDigest.getInstance("SHA-256");

        byte[] hashedBytes = digest.digest(
            token.getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );

        StringBuilder hex = new StringBuilder();

        for (byte b : hashedBytes) {
            hex.append(String.format("%02x", b));
        }

        return hex.toString();
    }
}
