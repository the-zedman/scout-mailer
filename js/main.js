/**
 * Scout Mailer – main JavaScript
 * Mobile-first; auth modal, login, create account, session.
 */
(function () {
  'use strict';

  var SESSION_KEY = 'scout-mailer-user';

  // Smooth scroll for in-page links (works on mobile and desktop)
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ----- Auth modal -----
  var modal = document.getElementById('auth-modal');
  var trigger = document.getElementById('auth-trigger');
  var closeBtn = document.getElementById('auth-modal-close');
  var backdrop = modal && modal.querySelector('.fixed.inset-0.bg-slate-900');
  var loginForm = document.getElementById('auth-login-form');
  var registerForm = document.getElementById('auth-register-form');
  var loginError = document.getElementById('auth-login-error');
  var registerError = document.getElementById('auth-register-error');
  var modalTitle = document.getElementById('auth-modal-title');
  var toggleModeBtn = document.getElementById('auth-toggle-mode');
  var authUserEl = document.getElementById('auth-user');
  var authLoggedInBlock = document.getElementById('auth-logged-in');
  var authAdminLink = document.getElementById('auth-admin-link');
  var logoutBtn = document.getElementById('auth-logout');

  function openModal(showRegister) {
    if (!modal) return;
    showRegister = !!showRegister;
    modal.classList.remove('hidden');
    if (showRegister) {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
      modalTitle.textContent = 'Create account';
      toggleModeBtn.textContent = 'Log in';
      registerError.classList.add('hidden');
    } else {
      registerForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
      modalTitle.textContent = 'Log in';
      toggleModeBtn.textContent = 'Create new account';
      loginError.classList.add('hidden');
    }
  }

  function closeModal() {
    if (modal) modal.classList.add('hidden');
  }

  if (trigger) trigger.addEventListener('click', function () {
    var user = getSessionUser();
    if (user) return;
    openModal(false);
  });

  if (logoutBtn) logoutBtn.addEventListener('click', function () {
    fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(function () {});
    clearSession();
    updateAuthUI();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  if (toggleModeBtn) toggleModeBtn.addEventListener('click', function () {
    var isRegister = !registerForm.classList.contains('hidden');
    openModal(!isRegister);
  });

  function getSessionUser() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function setSessionUser(user) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch (_) {}
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (_) {}
  }

  function updateAuthUI() {
    var user = getSessionUser();
    if (!authUserEl || !trigger) return;
    if (user) {
      authUserEl.textContent = (user.firstName || user.email) + ' (' + (user.role || 'Author') + ')';
      if (authLoggedInBlock) authLoggedInBlock.classList.remove('hidden');
      trigger.classList.add('hidden');
      if (authAdminLink) authAdminLink.classList.toggle('hidden', user.role !== 'Admin');
    } else {
      if (authLoggedInBlock) authLoggedInBlock.classList.add('hidden');
      if (authAdminLink) authAdminLink.classList.add('hidden');
      trigger.classList.remove('hidden');
      trigger.textContent = 'Login';
    }
  }

  function apiPost(path, body) {
    return fetch(path, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, status: res.status, data: data };
      }).catch(function () {
        return { ok: res.ok, status: res.status, data: {} };
      });
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('login-email').value.trim();
      var password = document.getElementById('login-password').value;
      loginError.classList.add('hidden');
      loginError.textContent = '';
      apiPost('/api/login', { email: email, password: password }).then(function (result) {
        if (result.ok && result.data.success && result.data.user) {
          setSessionUser(result.data.user);
          updateAuthUI();
          closeModal();
          loginForm.reset();
          return;
        }
        loginError.textContent = (result.data && result.data.error) || 'Login failed';
        loginError.classList.remove('hidden');
      }).catch(function () {
        loginError.textContent = 'Network error. Try again.';
        loginError.classList.remove('hidden');
      });
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstName = document.getElementById('register-first').value.trim();
      var lastName = document.getElementById('register-last').value.trim();
      var email = document.getElementById('register-email').value.trim();
      var password = document.getElementById('register-password').value;
      registerError.classList.add('hidden');
      registerError.textContent = '';
      apiPost('/api/register', {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
      }).then(function (result) {
        if (result.ok && result.data.success && result.data.user) {
          setSessionUser(result.data.user);
          updateAuthUI();
          closeModal();
          registerForm.reset();
          return;
        }
        registerError.textContent = (result.data && result.data.error) || 'Registration failed';
        registerError.classList.remove('hidden');
      }).catch(function () {
        registerError.textContent = 'Network error. Try again.';
        registerError.classList.remove('hidden');
      });
    });
  }

  updateAuthUI();
})();
