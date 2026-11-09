
package com.app.service;

import java.util.Properties;

import jakarta.mail.Authenticator;
import jakarta.mail.Message;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

public class EmailService {

    public static void sendResetEmail(String recipient, String resetLink)
            throws Exception {

        String senderEmail = System.getenv("LMS_EMAIL");
        String appPassword = System.getenv("LMS_APP_PASSWORD");

        if (senderEmail == null || appPassword == null) {
            throw new IllegalStateException(
                "Gmail environment variables are not configured."
            );
        }

        Properties properties = new Properties();

        properties.put("mail.smtp.host", "smtp.gmail.com");
        properties.put("mail.smtp.port", "587");
        properties.put("mail.smtp.auth", "true");
        properties.put("mail.smtp.starttls.enable", "true");

        Session session = Session.getInstance(
            properties,
            new Authenticator() {
                @Override
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(
                        senderEmail,
                        appPassword.replace(" ", "")
                    );
                }
            }
        );

        Message message = new MimeMessage(session);

        message.setFrom(new InternetAddress(senderEmail));
        message.setRecipients(
            Message.RecipientType.TO,
            InternetAddress.parse(recipient)
        );

        message.setSubject("LMS Password Reset");

        String emailContent = """
            <html>
            <body>
                <h2>Password Reset Request</h2>

                <p>We received a request to reset your LMS password.</p>

                <p>Click the button below to create a new password:</p>

                <p>
                    <a href="%s"
                        style="background-color:#2563eb;
                        color:white;
                        padding:12px 20px;
                        text-decoration:none;
                        border-radius:5px;">
                        Reset My Password
                    </a>
                </p>

                <p>This link will expire in 15 minutes.</p>

                <p>If you did not request this, you can ignore this email.</p>
            </body>
            </html>
            """.formatted(resetLink);

        message.setContent(emailContent, "text/html; charset=UTF-8");

        Transport.send(message);
    }
}
