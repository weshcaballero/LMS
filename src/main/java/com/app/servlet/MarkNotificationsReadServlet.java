
package com.app.servlet;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;

import com.app.config.DBConnection;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/MarkNotificationsReadServlet")
public class MarkNotificationsReadServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doPost(HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("userId") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"success\":false}");
            return;
        }

        int userId = (Integer) session.getAttribute("userId");

        String[] notificationIds =
                request.getParameterValues("notificationId");

        if (notificationIds == null || notificationIds.length == 0) {
            response.getWriter().write("{\"success\":true}");
            return;
        }

        String sql = """
                UPDATE notifications
                SET is_read = 1
                WHERE user_id = ?
                AND notification_id = ?
                """;

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            for (String id : notificationIds) {
                try {
                    int notificationId = Integer.parseInt(id);

                    if (notificationId > 0) {
                        statement.setInt(1, userId);
                        statement.setInt(2, notificationId);
                        statement.addBatch();
                    }

                } catch (NumberFormatException e) {
                    // Ignore invalid notification IDs.
                }
            }

            statement.executeBatch();

            response.getWriter().write("{\"success\":true}");

        } catch (Exception e) {

            getServletContext().log(
                    "MarkNotificationsReadServlet error", e);

            response.setStatus(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR);

            response.getWriter().write("{\"success\":false}");
        }
    }
}
