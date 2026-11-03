
(function () {
  'use strict';

  // DEMO_MODE lets you click through the pages while the Java servlet does not exist yet.
  // It does NOT check a real password. Anyone can change JavaScript in their browser,
  // so the real login check must always happen in LoginServlet (Java + MySQL).
  // When LoginServlet is ready, set this to false.
  var DEMO_MODE = false;
  var AFTER_LOGIN_PAGE = 'home.html';

  var form = document.querySelector('.auth-card');
  if (!form) return;

  var email = document.getElementById('email');
  var password = document.getElementById('password');
  var errorBox = form.querySelector('.auth-error');
  var button = form.querySelector('.auth-btn');
  var buttonText = button.textContent;

  function showError(message, field) {
    errorBox.textContent = message;
    errorBox.hidden = false;
    email.removeAttribute('aria-invalid');
    password.removeAttribute('aria-invalid');
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      field.focus();
    }
  }

  function clearError() {
    errorBox.hidden = true;
    email.removeAttribute('aria-invalid');
    password.removeAttribute('aria-invalid');
  }

  function resetButton() {
    button.disabled = false;
    button.textContent = buttonText;
  }

  // When the servlet rejects a login, it can send the user back to login.html?error=invalid
  if (new URLSearchParams(window.location.search).get('error') === 'invalid') {
    showError('Email or password is incorrect. Try again.');
  }

  email.addEventListener('input', clearError);
  password.addEventListener('input', clearError);

  form.addEventListener('submit', function (event) {
    var emailValue = email.value.trim();

    if (emailValue === '') {
      event.preventDefault();
      showError('Please enter your email.', email);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      event.preventDefault();
      showError('Please enter a valid email address.', email);
      return;
    }
    if (password.value === '') {
      event.preventDefault();
      showError('Please enter your password.', password);
      return;
    }

    email.value = emailValue;
    clearError();

    // Stop the student from clicking LOGIN twice
    button.disabled = true;
    button.textContent = 'LOGGING IN...';

    if (DEMO_MODE) {
      event.preventDefault();
      window.setTimeout(function () {
        window.location.href = AFTER_LOGIN_PAGE;
      }, 600);
    }
  });

  // If the student comes back with the browser's Back button, make the button usable again
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) resetButton();
  });
})();