package com.app.servlet;

import java.io.IOException;
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
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        processRequest(request, response);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        processRequest(request, response);
    }

    private void processRequest(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        // Kukunin ang mga pinasa mula sa login form
        String email = request.getParameter("email");
        String role = request.getParameter("role");

        // Magse-set ng session variables para sa dashboard UI
        HttpSession session = request.getSession();
        session.setAttribute("userInitials", "PS");
        session.setAttribute("userRole", role);

        // Awtomatikong idi-redirect depende sa piniling role sa dropdown
        if ("teacher".equalsIgnoreCase(role)) {
            response.sendRedirect("teacher-dashboard.html");
        } else if ("admin".equalsIgnoreCase(role)) {
            response.sendRedirect("admin-dashboard.html");
        } else {
            response.sendRedirect("student-dashboard.html");
        }
    }
}