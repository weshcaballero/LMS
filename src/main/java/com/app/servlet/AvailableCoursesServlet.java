
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

@WebServlet("/AvailableCoursesServlet")
public class AvailableCoursesServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        // Check if the user is logged in
        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("userId") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"Not logged in\"}");
            return;
        }

        int userId = (Integer) session.getAttribute("userId");

        // Get all courses and check enrollment status
        String sql = """
            SELECT
                c.course_id,
                c.course_code,
                c.course_title,
                c.description,
                EXISTS (
                    SELECT 1
                    FROM enrollments e
                    WHERE e.course_id = c.course_id
                    AND e.student_id = ?
                    AND e.status = 'active'
                ) AS enrolled
            FROM courses c
            ORDER BY c.course_title
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
                        .append("\"enrolled\":").append(result.getBoolean("enrolled"))
                        .append("}");

                    first = false;
                }

                json.append("]");
                response.getWriter().write(json.toString());
            }

        } catch (Exception e) {
            getServletContext().log("AvailableCoursesServlet error", e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\":\"Unable to load available courses\"}");
        }
    }

    private String escape(String value) {
        if (value == null) return "";

        return value.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");
    }
}
