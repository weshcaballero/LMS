
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

@WebServlet("/EnrollmentServlet")
public class EnrollmentServlet extends HttpServlet {

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
            response.getWriter().write(
                "{\"success\":false,\"message\":\"Please log in first.\"}"
            );
            return;
        }

        String role = (String) session.getAttribute("userRole");

        if (role == null || !role.equalsIgnoreCase("student")) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write(
                "{\"success\":false,\"message\":\"Students only.\"}"
            );
            return;
        }

        int userId = (Integer) session.getAttribute("userId");

        String courseIdValue = request.getParameter("courseId");
        String action = request.getParameter("action");

        if (courseIdValue == null || action == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write(
                "{\"success\":false,\"message\":\"Missing parameters.\"}"
            );
            return;
        }

        int courseId;

        try {
            courseId = Integer.parseInt(courseIdValue);
        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write(
                "{\"success\":false,\"message\":\"Invalid course ID.\"}"
            );
            return;
        }

        if (courseId <= 0) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write(
                "{\"success\":false,\"message\":\"Invalid course ID.\"}"
            );
            return;
        }

        try (Connection connection = DBConnection.getConnection()) {

            connection.setAutoCommit(false);

            try {

                if ("enroll".equalsIgnoreCase(action)) {

                    String courseTitle;
                    String courseCode;

                    // Check course and get its details
                    String courseSql = """
                        SELECT course_title, course_code
                        FROM courses
                        WHERE course_id = ?
                        """;

                    try (PreparedStatement statement =
                            connection.prepareStatement(courseSql)) {

                        statement.setInt(1, courseId);

                        try (ResultSet result = statement.executeQuery()) {

                            if (!result.next()) {
                                connection.rollback();

                                response.setStatus(
                                    HttpServletResponse.SC_NOT_FOUND
                                );

                                response.getWriter().write(
                                    "{\"success\":false,\"message\":\"Course not found.\"}"
                                );
                                return;
                            }

                            courseTitle = result.getString("course_title");
                            courseCode = result.getString("course_code");
                        }
                    }

                    // Check existing enrollment status
                    boolean alreadyActive = false;

                    String checkSql = """
                        SELECT status
                        FROM enrollments
                        WHERE student_id = ?
                        AND course_id = ?
                        FOR UPDATE
                        """;

                    try (PreparedStatement statement =
                            connection.prepareStatement(checkSql)) {

                        statement.setInt(1, userId);
                        statement.setInt(2, courseId);

                        try (ResultSet result = statement.executeQuery()) {
                            if (result.next()) {
                                alreadyActive = "active".equalsIgnoreCase(
                                    result.getString("status")
                                );
                            }
                        }
                    }

                    // Enroll or reactivate
                    String enrollSql = """
                        INSERT INTO enrollments
                            (student_id, course_id, status)
                        VALUES (?, ?, 'active')
                        ON DUPLICATE KEY UPDATE status = 'active'
                        """;

                    try (PreparedStatement statement =
                            connection.prepareStatement(enrollSql)) {

                        statement.setInt(1, userId);
                        statement.setInt(2, courseId);
                        statement.executeUpdate();
                    }

                    // Create notification only for new/reactivated enrollment
                    if (!alreadyActive) {

                        String notificationSql = """
                            INSERT INTO notifications
                                (user_id, course_id, title, message,
                                 notification_type, is_read)
                            VALUES (?, ?, ?, ?, ?, 0)
                            """;

                        try (PreparedStatement statement =
                                connection.prepareStatement(notificationSql)) {

                            statement.setInt(1, userId);
                            statement.setInt(2, courseId);
                            statement.setString(
                                3, "Course Enrollment Successful"
                            );
                            statement.setString(
                                4,
                                "You have successfully enrolled in "
                                + courseTitle + " (" + courseCode + ")."
                            );
                            statement.setString(5, "enrollment");

                            statement.executeUpdate();
                        }
                    }

                    connection.commit();

                    response.getWriter().write(
                        "{\"success\":true,\"message\":\"Successfully enrolled.\"}"
                    );

                } else if ("unenroll".equalsIgnoreCase(action)) {

                    String sql = """
                        UPDATE enrollments
                        SET status = 'inactive'
                        WHERE student_id = ?
                        AND course_id = ?
                        """;

                    try (PreparedStatement statement =
                            connection.prepareStatement(sql)) {

                        statement.setInt(1, userId);
                        statement.setInt(2, courseId);
                        statement.executeUpdate();
                    }

                    connection.commit();

                    response.getWriter().write(
                        "{\"success\":true,\"message\":\"Successfully unenrolled.\"}"
                    );

                } else {

                    connection.rollback();

                    response.setStatus(
                        HttpServletResponse.SC_BAD_REQUEST
                    );

                    response.getWriter().write(
                        "{\"success\":false,\"message\":\"Invalid action.\"}"
                    );
                }

            } catch (Exception e) {
                connection.rollback();
                throw e;
            }

        } catch (Exception e) {

            getServletContext().log("EnrollmentServlet error", e);

            response.setStatus(
                HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );

            response.getWriter().write(
                "{\"success\":false,\"message\":\"Enrollment operation failed.\"}"
            );
        }
    }
}
