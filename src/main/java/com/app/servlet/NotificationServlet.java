
package com.app.servlet;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Timestamp;

import com.app.config.DBConnection;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/NotificationServlet")
public class NotificationServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("userId") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"Not logged in\"}");
            return;
        }

        int userId = (Integer) session.getAttribute("userId");

        String sql = """
                SELECT
                    notification_id,
                    title,
                    message,
                    notification_type,
                    is_read,
                    created_at
                FROM notifications
                WHERE user_id = ?
                ORDER BY created_at DESC
                """;

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setInt(1, userId);

            try (ResultSet result = statement.executeQuery()) {

                StringBuilder json = new StringBuilder("[");
                boolean first = true;

                while (result.next()) {

                    if (!first) {
                        json.append(",");
                    }

                    int notificationId =
                            result.getInt("notification_id");

                    String title = result.getString("title");
                    String message = result.getString("message");
                    String type =
                            result.getString("notification_type");

                    boolean isRead =
                            result.getBoolean("is_read");

                    Timestamp createdAt =
                            result.getTimestamp("created_at");

                    json.append("{")
                        .append("\"notificationId\":")
                        .append(notificationId)
                        .append(",\"title\":\"")
                        .append(escapeJson(title))
                        .append("\",\"message\":\"")
                        .append(escapeJson(message))
                        .append("\",\"type\":\"")
                        .append(escapeJson(type))
                        .append("\",\"isRead\":")
                        .append(isRead)
                        .append(",\"createdAt\":\"")
                        .append(createdAt.toString())
                        .append("\"")
                        .append("}");

                    first = false;
                }

                json.append("]");

                response.getWriter().write(json.toString());
            }

        } catch (Exception e) {

            getServletContext().log(
                    "NotificationServlet error", e);

            response.setStatus(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR);

            response.getWriter().write(
                    "{\"error\":\"Unable to load notifications\"}");
        }
    }

    private String escapeJson(String value) {

        if (value == null) {
            return "";
        }

        return value.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");
    }
}
