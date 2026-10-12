// main.js — wiring, event handlers, view switching.

const views = document.querySelectorAll('.view');
const navLinks = document.querySelectorAll('.nav-link');

// Show one view, hide the others, and mark the matching nav link as current.
function showView(name) {
  views.forEach((view) => { view.hidden = view.dataset.view !== name; });
  navLinks.forEach((link) => {
    const isCurrent = link.dataset.target === name;
    if (isCurrent) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  history.replaceState(null, '', `#${name}`);
}

navLinks.forEach((link) => {
  link.addEventListener('click', () => showView(link.dataset.target));
});

const initial = location.hash.slice(1);
showView(['today', 'trips', 'info'].includes(initial) ? initial : 'today');
