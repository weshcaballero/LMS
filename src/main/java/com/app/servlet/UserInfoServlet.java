
package com.app.servlet;

import java.io.IOException;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/UserInfoServlet")
public class UserInfoServlet extends HttpServlet {

        private static final long serialVersionUID = 1L;

        @Override
        protected void doGet(HttpServletRequest request,
                HttpServletResponse response)
                throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("userName") == null) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"error\":\"Not logged in\"}");
                return;
        }

        String userName = (String) session.getAttribute("userName");
        String email = (String) session.getAttribute("userEmail");

        String safeName = userName == null ? "" :
                userName.replace("\\", "\\\\")
                        .replace("\"", "\\\"");

        String safeEmail = email == null ? "" :
                email.replace("\\", "\\\\")
                        .replace("\"", "\\\"");

        String json = "{\"userName\":\"" + safeName +
                "\",\"email\":\"" + safeEmail + "\"}";

                response.getWriter().write(json);
        }
}
