/**
 * Scout Mailer – main JavaScript
 * Mobile-first; add any interactivity here.
 */
(function () {
  'use strict';

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
})();
