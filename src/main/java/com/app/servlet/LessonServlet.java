
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

@WebServlet("/LessonServlet")
public class LessonServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("userId") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"Please log in first.\"}");
            return;
        }

        int studentId = (Integer) session.getAttribute("userId");

        String sql = """
            SELECT
                l.lesson_id,
                l.course_id,
                c.course_code,
                c.course_title,
                l.lesson_title,
                l.lesson_content,
                l.lesson_order,
                l.created_at
            FROM lessons l
            JOIN courses c ON l.course_id = c.course_id
            JOIN enrollments e ON e.course_id = c.course_id
            WHERE e.student_id = ?
              AND e.status = 'active'
            ORDER BY c.course_title, l.lesson_order ASC
            """;

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setInt(1, studentId);

            try (ResultSet rs = statement.executeQuery()) {

                StringBuilder json = new StringBuilder("[");
                boolean first = true;

                while (rs.next()) {

                    if (!first) {
                        json.append(",");
                    }

                    json.append("{")
                        .append("\"lessonId\":").append(rs.getInt("lesson_id")).append(",")
                        .append("\"courseId\":").append(rs.getInt("course_id")).append(",")
                        .append("\"courseCode\":\"")
                        .append(escapeJson(rs.getString("course_code"))).append("\",")
                        .append("\"courseTitle\":\"")
                        .append(escapeJson(rs.getString("course_title"))).append("\",")
                        .append("\"lessonTitle\":\"")
                        .append(escapeJson(rs.getString("lesson_title"))).append("\",")
                        .append("\"lessonContent\":\"")
                        .append(escapeJson(rs.getString("lesson_content"))).append("\",")
                        .append("\"lessonOrder\":").append(rs.getInt("lesson_order"))
                        .append("}");

                    first = false;
                }

                json.append("]");
                response.getWriter().write(json.toString());
            }

        } catch (Exception e) {

            e.printStackTrace();

            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\":\"Unable to load lessons.\"}");
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
