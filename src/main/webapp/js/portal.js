/* ==========================================================
   portal.js: behavior shared by the student pages
   Used by: home.html, student-dashboard.html
   - notification bell and account menu
   - three-dot menus (Mark as done, Copy meeting link)
   - JOIN button
   - New announcement window
   Everything here only changes the page. Saving to MySQL
   will be added later with fetch() calls to your servlets.
   ========================================================== */
(function () {
  'use strict';

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }
  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  /* ---------- Small message at the bottom of the screen ---------- */

  var toastBox = document.createElement('div');
  toastBox.className = 'toast';
  toastBox.setAttribute('role', 'status');
  toastBox.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastBox);

  var toastTimer;
  function showToast(message) {
    toastBox.textContent = message;
    toastBox.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastBox.classList.remove('show');
    }, 3000);
  }

  /* ---------- Pop-ups (bell panel and three-dot menus) ----------
     Only one can be open at a time. Click outside or press Escape to close. */

  var openPopup = null; // { button, panel }
  var accountMenu = $('.user-menu');

  function closePopup(returnFocus) {
    if (!openPopup) return;
    openPopup.panel.hidden = true;
    openPopup.button.setAttribute('aria-expanded', 'false');
    if (returnFocus) openPopup.button.focus();
    openPopup = null;
  }

  function closeAccountMenu() {
    if (accountMenu) accountMenu.removeAttribute('open');
  }

  function setupPopup(button, panel, onOpen) {
    button.addEventListener('click', function (event) {
      event.stopPropagation();
      var wasOpen = openPopup && openPopup.button === button;
      closePopup(false);
      closeAccountMenu();
      if (!wasOpen) {
        panel.hidden = false;
        button.setAttribute('aria-expanded', 'true');
        openPopup = { button: button, panel: panel };
        if (onOpen) onOpen();
      }
    });
  }

  document.addEventListener('click', function (event) {
    if (!event.target.closest('.notif, .pop-wrap')) closePopup(false);
    if (accountMenu && !event.target.closest('.user-menu')) closeAccountMenu();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    closePopup(true);
    if (accountMenu && accountMenu.hasAttribute('open')) {
      closeAccountMenu();
      $('summary', accountMenu).focus();
    }
  });

  if (accountMenu) {
    accountMenu.addEventListener('toggle', function () {
      if (accountMenu.open) closePopup(false);
    });
  }

  /* ---------- Notification bell ---------- */

  var bell = $('#bellBtn');
  var notifPanel = $('#notifPanel');
  var markRead = $('#markRead');

  function updateBell() {
    var unread = $all('.notif-item.unread').length;
    var dot = $('.bell-dot', bell);
    if (unread === 0 && dot) dot.remove();
    bell.setAttribute('aria-label', unread > 0 ? 'Notifications (' + unread + ' unread)' : 'Notifications');
  }

  if (bell && notifPanel) {
    setupPopup(bell, notifPanel);
    updateBell();

    if (markRead) {
      markRead.addEventListener('click', function () {
        $all('.notif-item.unread').forEach(function (item) {
          item.classList.remove('unread');
        });
        updateBell();
      });
    }
  }

  /* ---------- Three-dot menus ---------- */

  $all('[data-menu]').forEach(function (button) {
    var menu = button.nextElementSibling;
    if (menu) setupPopup(button, menu);
  });

  var joinButton = $('#joinBtn');

  function getMeetingUrl() {
    var url = joinButton ? (joinButton.getAttribute('data-meet-url') || '').trim() : '';
    if (!url) return '';
    try {
      var parsed = new URL(url);
      // Only normal web links are allowed
      return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : '';
    } catch (error) {
      return '';
    }
  }

  document.addEventListener('click', function (event) {
    var item = event.target.closest('.pop-menu [data-action]');
    if (!item) return;
    var action = item.getAttribute('data-action');

    if (action === 'toggle-done') {
      var card = item.closest('.assignment');
      var done = card.classList.toggle('done');
      item.textContent = done ? 'Mark as not done' : 'Mark as done';
      // Later: send this change to a servlet with fetch() so MySQL remembers it
      showToast(done ? 'Marked as done.' : 'Marked as not done.');
    }

    if (action === 'copy-meet') {
      var url = getMeetingUrl();
      if (!url) {
        showToast('There is no meeting link yet.');
      } else if (!navigator.clipboard) {
        showToast('Copying is not available in this browser.');
      } else {
        navigator.clipboard.writeText(url).then(function () {
          showToast('Meeting link copied.');
        }, function () {
          showToast('Could not copy the link.');
        });
      }
    }

    closePopup(false);
  });

  /* ---------- JOIN button ---------- */

  if (joinButton) {
    joinButton.addEventListener('click', function (event) {
      event.preventDefault();
      var url = getMeetingUrl();
      if (!url) {
        showToast('Your teacher has not shared a meeting link yet.');
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }

  /* ---------- New announcement window ---------- */

  var announceButton = $('#announceBtn');
  var dialog = $('#announceDialog');

  if (announceButton && dialog) {
    var announceForm = $('#announceForm');
    var announceError = $('#announceError');
    var titleInput = $('#annTitle');
    var messageInput = $('#annMessage');

    announceButton.addEventListener('click', function () {
      if (typeof dialog.showModal !== 'function') {
        showToast('This browser cannot open the announcement window.');
        return;
      }
      closePopup(false);
      dialog.showModal();
      titleInput.focus();
    });

    $('#announceCancel').addEventListener('click', function () {
      dialog.close();
    });

    // Clicking the dark area outside the window closes it
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener('close', function () {
      announceForm.reset();
      announceError.hidden = true;
    });

    announceForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var title = titleInput.value.trim();
      var message = messageInput.value.trim();

      if (title === '' || message === '') {
        announceError.textContent = 'Please write a title and a message.';
        announceError.hidden = false;
        (title === '' ? titleInput : messageInput).focus();
        return;
      }

      // Later: new FormData(announceForm) sent to an AnnouncementServlet with fetch()
      dialog.close();
      showToast('Announcement posted.');
    });
  }
})();