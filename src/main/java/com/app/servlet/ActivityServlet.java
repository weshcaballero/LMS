
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

@WebServlet("/ActivityServlet")
public class ActivityServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request,
                         HttpServletResponse response)
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
                s.submission_id,
                s.assignment_id,
                a.assignment_title,
                c.course_code,
                c.course_title,
                s.submission_text,
                s.submitted_at,
                s.status,
                s.score,
                s.feedback
            FROM submissions s
            JOIN assignments a
                ON s.assignment_id = a.assignment_id
            JOIN courses c
                ON a.course_id = c.course_id
            JOIN enrollments e
                ON e.course_id = c.course_id
                AND e.student_id = s.student_id
            WHERE s.student_id = ?
              AND e.status = 'active'
              AND s.submitted_at IS NOT NULL
            ORDER BY s.submitted_at DESC
            """;

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setInt(1, studentId);

            try (ResultSet resultSet = statement.executeQuery()) {

                StringBuilder json = new StringBuilder("[");
                boolean first = true;

                while (resultSet.next()) {

                    if (!first) {
                        json.append(",");
                    }

                    first = false;

                    json.append("{")
                        .append("\"submissionId\":")
                        .append(resultSet.getInt("submission_id"))
                        .append(",\"assignmentId\":")
                        .append(resultSet.getInt("assignment_id"))
                        .append(",\"assignmentTitle\":\"")
                        .append(escapeJson(resultSet.getString("assignment_title")))
                        .append("\",\"courseCode\":\"")
                        .append(escapeJson(resultSet.getString("course_code")))
                        .append("\",\"courseTitle\":\"")
                        .append(escapeJson(resultSet.getString("course_title")))
                        .append("\",\"submissionText\":\"")
                        .append(escapeJson(resultSet.getString("submission_text")))
                        .append("\",\"submittedAt\":\"")
                        .append(escapeJson(resultSet.getString("submitted_at")))
                        .append("\",\"status\":\"")
                        .append(escapeJson(resultSet.getString("status")))
                        .append("\",\"score\":");

                    if (resultSet.getObject("score") == null) {
                        json.append("null");
                    } else {
                        json.append(resultSet.getBigDecimal("score"));
                    }

                    json.append(",\"feedback\":\"")
                        .append(escapeJson(resultSet.getString("feedback")))
                        .append("\"}");
                }

                json.append("]");
                response.getWriter().write(json.toString());
            }

        } catch (Exception e) {
            e.printStackTrace();

            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write(
                "{\"error\":\"Unable to load student activities.\"}"
            );
        }
    }

    private String escapeJson(String value) {

        if (value == null) {
            return "";
        }

        return value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t");
    }
}
