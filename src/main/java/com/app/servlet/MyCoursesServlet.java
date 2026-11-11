package com.app.servlet;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import com.app.config.DBConnection;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/MyCoursesServlet")
public class MyCoursesServlet extends HttpServlet {
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
                c.course_id,
                c.course_code,
                c.course_title,
                c.description,
                e.enrolled_at,
                e.status
            FROM enrollments e
            JOIN courses c ON e.course_id = c.course_id
            WHERE e.student_id = ?
            ORDER BY e.enrolled_at DESC
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

                    json.append("{")
                        .append("\"courseId\":").append(result.getInt("course_id")).append(",")
                        .append("\"courseCode\":\"").append(escape(result.getString("course_code"))).append("\",")
                        .append("\"courseTitle\":\"").append(escape(result.getString("course_title"))).append("\",")
                        .append("\"description\":\"").append(escape(result.getString("description"))).append("\",")
                        .append("\"status\":\"").append(escape(result.getString("status"))).append("\"")
                        .append("}");

                    first = false;
                }

                json.append("]");
                response.getWriter().write(json.toString());
            }

        } catch (Exception e) {
            throw new ServletException("Unable to retrieve enrolled courses.", e);
        }
    }

    private String escape(String value) {
        if (value == null) return "";

        return value.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r");
    }
}
