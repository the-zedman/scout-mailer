/**
 * Admin Users page: list, edit, delete (cookie-based session).
 */
(function () {
  'use strict';

  var users = [];
  var tableWrap = document.getElementById('users-table-wrap');
  var tbody = document.getElementById('users-tbody');
  var loadingEl = document.getElementById('users-loading');
  var errorEl = document.getElementById('users-error');
  var editModal = document.getElementById('edit-modal');
  var editForm = document.getElementById('edit-form');
  var editClose = document.getElementById('edit-modal-close');
  var editError = document.getElementById('edit-error');
  var editTargetEmail = document.getElementById('edit-target-email');

  function checkAdmin() {
    var user = null;
    try {
      var raw = sessionStorage.getItem('scout-mailer-user');
      user = raw ? JSON.parse(raw) : null;
    } catch (_) {}
    if (!user || user.role !== 'Admin') {
      window.location.href = '/';
      return false;
    }
    return true;
  }

  function showError(msg, asHtml) {
    if (errorEl) {
      if (asHtml) errorEl.innerHTML = msg || ''; else errorEl.textContent = msg || '';
      errorEl.classList.toggle('hidden', !msg);
    }
  }

  function loadUsers() {
    if (!checkAdmin()) return;
    showError('');
    loadingEl.classList.remove('hidden');
    if (tableWrap) tableWrap.classList.add('hidden');
    fetch('/api/users/list', { credentials: 'include' })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        }).catch(function () {
          return { ok: res.ok, data: {} };
        });
      })
      .then(function (result) {
        loadingEl.classList.add('hidden');
        if (result.ok && result.data.users) {
          users = result.data.users;
          renderTable();
          if (tableWrap) tableWrap.classList.remove('hidden');
        } else if (result.data.error === 'Admin only' || result.status === 403) {
          showError('Session expired or you don\'t have permission. Please <a href="/" class="font-medium underline">log in again from the home page</a>.', true);
        } else {
          showError(result.data.error || 'Failed to load users.');
        }
      })
      .catch(function () {
        loadingEl.classList.add('hidden');
        showError('Network error.');
      });
  }

  function renderTable() {
    if (!tbody) return;
    tbody.innerHTML = '';
    users.forEach(function (u) {
      var tr = document.createElement('tr');
      tr.className = 'bg-white hover:bg-slate-50';
      tr.innerHTML =
        '<td class="px-4 py-3 text-slate-900 sm:px-6">' + escapeHtml(u.firstName || '') + '</td>' +
        '<td class="px-4 py-3 text-slate-900 sm:px-6">' + escapeHtml(u.lastName || '') + '</td>' +
        '<td class="px-4 py-3 text-slate-900 sm:px-6">' + escapeHtml(u.email || '') + '</td>' +
        '<td class="px-4 py-3 text-slate-900 sm:px-6">' + escapeHtml(u.role || 'Author') + '</td>' +
        '<td class="px-4 py-3 sm:px-6">' +
        '<button type="button" class="edit-user mr-2 rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand" data-email="' + escapeAttr(u.email) + '" title="Edit">✏️</button>' +
        '<button type="button" class="delete-user rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600" data-email="' + escapeAttr(u.email) + '" title="Delete">🗑️</button>' +
        '</td>';
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.edit-user').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openEdit(btn.getAttribute('data-email'));
      });
    });
    tbody.querySelectorAll('.delete-user').forEach(function (btn) {
      btn.addEventListener('click', function () {
        deleteUser(btn.getAttribute('data-email'));
      });
    });
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }
  function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;');
  }

  function openEdit(email) {
    var u = users.find(function (x) { return (x.email || '').toLowerCase() === (email || '').toLowerCase(); });
    if (!u) return;
    editTargetEmail.value = u.email;
    document.getElementById('edit-first').value = u.firstName || '';
    document.getElementById('edit-last').value = u.lastName || '';
    document.getElementById('edit-email').value = u.email || '';
    document.getElementById('edit-role').value = u.role || 'Author';
    editError.classList.add('hidden');
    editError.textContent = '';
    if (editModal) editModal.classList.remove('hidden');
  }

  function closeEditModal() {
    if (editModal) editModal.classList.add('hidden');
  }

  if (editClose) editClose.addEventListener('click', closeEditModal);
  if (editModal && editModal.querySelector('.fixed.inset-0.bg-slate-900')) {
    editModal.querySelector('.fixed.inset-0.bg-slate-900').addEventListener('click', closeEditModal);
  }

  if (editForm) {
    editForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var targetEmail = editTargetEmail.value;
      var body = {
        targetEmail: targetEmail,
        firstName: document.getElementById('edit-first').value.trim(),
        lastName: document.getElementById('edit-last').value.trim(),
        email: document.getElementById('edit-email').value.trim(),
        role: document.getElementById('edit-role').value,
      };
      editError.classList.add('hidden');
      fetch('/api/users/update', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }).catch(function () { return { ok: res.ok, data: {} }; }); })
        .then(function (result) {
          if (result.ok && result.data.success) {
            closeEditModal();
            if (result.data.users && Array.isArray(result.data.users)) {
              users = result.data.users;
              renderTable();
              if (tableWrap) tableWrap.classList.remove('hidden');
            } else {
              loadUsers();
            }
            return;
          }
          editError.textContent = (result.data && result.data.error) || 'Update failed';
          editError.classList.remove('hidden');
        })
        .catch(function () {
          editError.textContent = 'Network error.';
          editError.classList.remove('hidden');
        });
    });
  }

  function deleteUser(email) {
    if (!confirm('Delete user “' + email + '”? This cannot be undone.')) return;
    fetch('/api/users/delete', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetEmail: email }),
    })
      .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }).catch(function () { return { ok: res.ok, data: {} }; }); })
      .then(function (result) {
        if (result.ok && result.data.success) {
          loadUsers();
          return;
        }
        showError(result.data.error || 'Delete failed.');
      })
      .catch(function () {
        showError('Network error.');
      });
  }

  loadUsers();
})();
