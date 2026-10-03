/* Dhamma Books catalogue installation support v1.0.0 */
(function () {
  'use strict';

  const panel = document.getElementById('db-app-install');
  const button = document.getElementById('db-app-install-button');
  const guide = document.getElementById('db-app-install-guide');
  const status = document.getElementById('db-app-install-status');
  if (!panel || !button || !guide || !status) return;

  const standalone = window.matchMedia('(display-mode: standalone)');
  let installPrompt = null;
  let installed = false;

  function updatePanel() {
    panel.hidden = installed || standalone.matches || window.navigator.standalone === true;
    button.hidden = panel.hidden;
  }

  function showGuide(message) {
    guide.open = true;
    status.textContent = message || '';
    guide.querySelector('summary').focus();
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    if (panel.hidden) return;
    event.preventDefault();
    installPrompt = event;
    status.textContent = '';
  });

  window.addEventListener('appinstalled', function () {
    installed = true;
    installPrompt = null;
    updatePanel();
  });

  button.addEventListener('click', async function () {
    if (!installPrompt) {
      showGuide();
      return;
    }

    const prompt = installPrompt;
    installPrompt = null;
    button.disabled = true;
    status.textContent = '';
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') {
        guide.open = false;
        status.textContent = 'Follow your browser’s installation instructions. / 请按照浏览器的提示完成安装。';
      } else {
        showGuide('You can install later from your browser menu. / 您可以稍后从浏览器菜单安装。');
      }
    } catch (error) {
      showGuide('Use your browser menu to install the app. / 请使用浏览器菜单安装应用。');
    } finally {
      button.disabled = false;
    }
  });

  if (typeof standalone.addEventListener === 'function') {
    standalone.addEventListener('change', updatePanel);
  } else if (typeof standalone.addListener === 'function') {
    standalone.addListener(updatePanel);
  }
  updatePanel();
}());
