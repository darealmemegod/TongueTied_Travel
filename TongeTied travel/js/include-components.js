window.IncludeComponents = {
  async loadAll() {
    await this.waitForDOM();

    const nodes = Array.from(document.querySelectorAll('[data-include]'));
    await Promise.allSettled(nodes.map((node) => this.loadIntoNode(node)));

    await Promise.allSettled(nodes.map((node) => this.loadIntoNode(node)));
    window.__partialsLoaded = true;
    document.dispatchEvent(new Event('partialsLoaded'));


    document.dispatchEvent(new Event('partialsLoaded'));
  },

  async loadNestedIncludes(root = document) {
    const nodes = Array.from(root.querySelectorAll('[data-include]'));
    if (!nodes.length) return;

    await Promise.allSettled(
      nodes.map(async (node) => {
        const url = node.getAttribute('data-include');
        if (!url) return;
        if (node.dataset.included === '1') return;

        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);

          node.innerHTML = await res.text();
          node.dataset.included = '1';
          console.log(`✅ nested include loaded: ${url}`);

          await this.loadNestedIncludes(node);
        } catch (e) {
          console.error(`❌ nested include failed: ${url}`, e);
          node.innerHTML = `
            <div class="component-error" style="padding:20px;text-align:center;">
              <i class="fas fa-exclamation-triangle"></i>
              <p>Не удалось загрузить компонент</p>
              <small>${url}</small>
            </div>
          `;
        }
      })
    );
  },

  async loadIntoNode(node) {
    const url = node.getAttribute('data-include');
    if (!url) return;

    try {
        console.log('[Include] loading:', url);

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);

        node.innerHTML = await res.text();
        node.dataset.included = '1';

        console.log('[Include] loaded:', url);

        await this.loadNestedIncludes(node);
      } catch (e) {
        console.error('[Include] failed:', url, e);
        node.innerHTML = `
        <div class="component-error" style="padding:20px;text-align:center;">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Не удалось загрузить компонент</p>
          <small>${url}</small>
        </div>
        `;
    }
  },


  waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      } else {
        resolve();
      }
    });
  }
};
