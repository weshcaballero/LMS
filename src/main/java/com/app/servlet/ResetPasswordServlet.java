
package com.app.servlet;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import org.mindrot.jbcrypt.BCrypt;

import com.app.config.DBConnection;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/ResetPasswordServlet")
public class ResetPasswordServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doPost(HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");

        String token = request.getParameter("token");
        String newPassword = request.getParameter("newPassword");
        String confirmPassword = request.getParameter("confirmPassword");

        if (token == null || token.isBlank()
                || newPassword == null
                || confirmPassword == null
                || !newPassword.equals(confirmPassword)
                || newPassword.length() < 8) {

            response.sendRedirect(
                "reset-password.html?error=invalid"
            );
            return;
        }

        try (Connection connection = DBConnection.getConnection()) {

            connection.setAutoCommit(false);

            try {
                String tokenHash = hashToken(token);
                int userId = -1;

                String findToken = """
                    SELECT user_id
                    FROM password_resets
                    WHERE token_hash = ?
                    AND used_at IS NULL
                    AND expires_at > CURRENT_TIMESTAMP
                    FOR UPDATE
                    """;

                try (PreparedStatement statement =
                        connection.prepareStatement(findToken)) {

                    statement.setString(1, tokenHash);

                    try (ResultSet result = statement.executeQuery()) {
                        if (result.next()) {
                            userId = result.getInt("user_id");
                        }
                    }
                }

                if (userId == -1) {
                    connection.rollback();

                    response.sendRedirect(
                        "reset-password.html?error=expired"
                    );
                    return;
                }

                // Hash the new password using BCrypt.
                String hashedPassword = BCrypt.hashpw(
                    newPassword,
                    BCrypt.gensalt()
                );

                String updatePassword = """
                    UPDATE users
                    SET password = ?
                    WHERE user_id = ?
                    """;

                try (PreparedStatement statement =
                        connection.prepareStatement(updatePassword)) {

                    statement.setString(1, hashedPassword);
                    statement.setInt(2, userId);
                    statement.executeUpdate();
                }

                // Mark the reset token as used.
                String markUsed = """
                    UPDATE password_resets
                    SET used_at = CURRENT_TIMESTAMP
                    WHERE token_hash = ?
                    AND used_at IS NULL
                    """;

                try (PreparedStatement statement =
                        connection.prepareStatement(markUsed)) {

                    statement.setString(1, tokenHash);
                    statement.executeUpdate();
                }

                connection.commit();

                response.sendRedirect(
                    "login.html?passwordReset=success"
                );

            } catch (Exception e) {
                connection.rollback();
                throw e;
            }

        } catch (Exception e) {
            getServletContext().log(
                "Password reset failed.", e
            );

            response.sendRedirect(
                "reset-password.html?error=failed"
            );
        }
    }

    private String hashToken(String token) throws Exception {

        MessageDigest digest = MessageDigest.getInstance("SHA-256");

        byte[] hashedBytes = digest.digest(
            token.getBytes(StandardCharsets.UTF_8)
        );

        StringBuilder hex = new StringBuilder();

        for (byte b : hashedBytes) {
            hex.append(String.format("%02x", b));
        }

        return hex.toString();
    }
}
