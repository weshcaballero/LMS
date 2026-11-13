
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

@WebServlet("/AssignmentServlet")
public class AssignmentServlet extends HttpServlet {

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
                a.assignment_id,
                a.course_id,
                c.course_code,
                c.course_title,
                a.assignment_title,
                a.instructions,
                a.due_date,
                a.max_score
            FROM assignments a
            JOIN courses c
                ON a.course_id = c.course_id
            JOIN enrollments e
                ON e.course_id = a.course_id
            WHERE e.student_id = ?
              AND e.status = 'active'
            ORDER BY a.due_date ASC
            """;

        StringBuilder json = new StringBuilder("[");
        boolean first = true;

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setInt(1, studentId);

            try (ResultSet rs = statement.executeQuery()) {

                while (rs.next()) {

                    if (!first) {
                        json.append(",");
                    }

                    json.append("{")
                        .append("\"assignmentId\":")
                        .append(rs.getInt("assignment_id"))
                        .append(",\"courseId\":")
                        .append(rs.getInt("course_id"))
                        .append(",\"courseCode\":\"")
                        .append(escape(rs.getString("course_code")))
                        .append("\",\"courseTitle\":\"")
                        .append(escape(rs.getString("course_title")))
                        .append("\",\"assignmentTitle\":\"")
                        .append(escape(rs.getString("assignment_title")))
                        .append("\",\"instructions\":\"")
                        .append(escape(rs.getString("instructions")))
                        .append("\",\"dueDate\":\"")
                        .append(escape(rs.getString("due_date")))
                        .append("\",\"maxScore\":");

                    if (rs.getBigDecimal("max_score") == null) {
                        json.append("null");
                    } else {
                        json.append(rs.getBigDecimal("max_score").toPlainString());
                    }

                    json.append("}");

                    first = false;
                }
            }

            json.append("]");
            response.getWriter().write(json.toString());

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\":\"Unable to load assignments.\"}");
        }
    }

    private String escape(String value) {
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
