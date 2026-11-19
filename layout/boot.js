/* O painel emite este evento após validar a sessão e aplicar o catálogo de acessos. */
(() => {
  function load(file) {
    const url = '/layout/' + file;
    return new Promise((resolve, reject) => {
      const style = file.endsWith('.css');
      const element = document.createElement(style ? 'link' : 'script');
      element.onload = resolve;
      element.onerror = () => reject(new Error('Falha ao carregar ' + file));
      if (style) {
        element.rel = 'stylesheet';
        element.href = url;
      } else {
        element.src = url;
      }
      document.head.append(element);
    });
  }

  async function activate() {
    const identity = String(BCAUTH.user.id);
    await Promise.all([
      load('integral-preferences.js'), load('studio-catalogue.js'),
      load('integral.css'), load('studio.css'), load('studio-experience.css')
    ]);
    if (!BCAUTH.user || String(BCAUTH.user.id) !== identity) return;
    const preferences = BCReviewPreferences.create(localStorage, identity);
    window.BCReviewPreferenceStore = preferences;
    document.documentElement.dataset.reviewTheme = preferences.theme;
    document.documentElement.dataset.reviewBrand = preferences.brand;
    for (const script of ['integral-charts.js', 'studio-composition.js', 'integral.js', 'studio-snapshot.js', 'studio-experience.js']) {
      await load(script);
    }
  }

  let identity;
  window.addEventListener('bc-sessao-validada', () => {
    const current = String(BCAUTH.user.id);
    if (identity === current) return;
    if (identity !== undefined) {
      location.reload();
      return;
    }
    identity = current;
    activate().catch(error => console.error('Falha ao iniciar o novo layout.', error));
  });
})();
