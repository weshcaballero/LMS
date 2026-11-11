package com.app.servlet;

import java.io.IOException;
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
import jakarta.servlet.http.HttpSession;

@WebServlet("/LoginServlet")
public class LoginServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doPost(HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        String email = request.getParameter("email");
        String password = request.getParameter("password");

        System.out.println("LOGIN SERVLET WAS CALLED");

        if (email == null || password == null ||
                email.isBlank() || password.isEmpty()) {

            response.sendRedirect("login.html?error=invalid");
            return;
        }

        String sql = """
                SELECT user_id, full_name, email, password, role
                FROM users
                WHERE email = ?
                """;

        try (Connection connection = DBConnection.getConnection();
                PreparedStatement statement =
                    connection.prepareStatement(sql)) {

            statement.setString(1, email.trim());

            try (ResultSet result = statement.executeQuery()) {

                if (result.next()) {

                    String storedPassword = result.getString("password");

                    if (BCrypt.checkpw(password, storedPassword)) {

                        String fullName = result.getString("full_name");
                        String role = result.getString("role");

                        HttpSession session = request.getSession(true);
                        session.setAttribute("userId",
                                result.getInt("user_id"));
                        session.setAttribute("userName", fullName);
                        session.setAttribute("userEmail",
                                result.getString("email"));
                        session.setAttribute("userRole", role);

                        System.out.println("SESSION ID: " + session.getId());
                        System.out.println("LOGGED IN USER: " + session.getAttribute("userName"));

                        switch (role.toLowerCase()) {
                            case "teacher":
                                response.sendRedirect(
                                        "teacher-dashboard.html");
                                break;

                            case "admin":
                                response.sendRedirect(
                                        "admin-dashboard.html");
                                break;

                            default:
                                response.sendRedirect(
                                        "home.html");
                                break;
                        }

                        return;
                    }
                }
            }

            response.sendRedirect("login.html?error=invalid");

        } catch (Exception e) {
            throw new ServletException(
                    "Login authentication failed.", e);
        }
    }
}
