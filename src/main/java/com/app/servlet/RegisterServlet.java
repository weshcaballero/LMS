package com.app.servlet;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

import org.mindrot.jbcrypt.BCrypt;

import com.app.config.DBConnection;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/RegisterServlet")
public class RegisterServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doPost(HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        String firstName = request.getParameter("first_name");
        String lastName = request.getParameter("last_name");
        String email = request.getParameter("email");
        String password = request.getParameter("password");
        String terms = request.getParameter("terms");

        if (firstName == null || lastName == null ||
                email == null || password == null ||
                terms == null ||
                firstName.isBlank() || lastName.isBlank() ||
                email.isBlank() || password.length() < 8) {

            response.sendRedirect("register.html?status=invalid");
            return;
        }

        String fullName = firstName.trim() + " " + lastName.trim();

        // Hash password using BCrypt
        String hashedPassword = BCrypt.hashpw(
                password,
                BCrypt.gensalt()
        );

        String sql = """
                INSERT INTO users (full_name, email, password, role)
                VALUES (?, ?, ?, ?)
                """;

        try (Connection connection = DBConnection.getConnection();
            PreparedStatement statement =
                    connection.prepareStatement(sql)) {

            statement.setString(1, fullName);
            statement.setString(2, email.trim());
            statement.setString(3, hashedPassword);
            statement.setString(4, "student");

            statement.executeUpdate();

            response.sendRedirect("login.html?status=registered");

        } catch (SQLException e) {

            if ("23000".equals(e.getSQLState())) {
                response.sendRedirect("register.html?status=exists");
            } else {
                throw new ServletException(
                        "Registration failed.", e
                );
            }

        } catch (Exception e) {
            throw new ServletException(
                    "Database connection failed.", e
            );
        }
    }
}