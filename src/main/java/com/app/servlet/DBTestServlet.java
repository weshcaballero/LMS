package com.app.servlet;

import java.io.IOException;
import java.sql.Connection;

import com.app.config.DBConnection;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/DBTestServlet")
public class DBTestServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("text/plain");

        try (Connection connection = DBConnection.getConnection()) {
            response.getWriter().println("MySQL Connection Successful!");
        } catch (Exception e) {
            response.getWriter().println("MySQL Connection Failed!");
            e.printStackTrace();
        }
    }
}