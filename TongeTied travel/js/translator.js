class Translator {
  constructor() {
    this.translateBtn = document.getElementById('translateBtn');
    this.targetLanguageBtn = document.getElementById('targetLanguageBtn');
    this.userInput = document.getElementById('userPhraseInput');
    this.voiceInputBtn = document.getElementById('voiceInputBtn');
    this.clearInputBtn = document.getElementById('clearInputBtn');
    this.pasteBtn = document.getElementById('pasteBtn');
    this.charCount = document.getElementById('charCount');
    this.voiceStatus = document.getElementById('voiceStatus');
    this.textTab = document.getElementById('textTab');
    this.voiceTab = document.getElementById('voiceTab');
    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.voiceRecordBtn = document.getElementById('voiceRecordBtn');
    this.voiceResult = document.getElementById('voiceResult');

    this.targetLanguageMenu = document.getElementById('targetLanguageMenu');
    this.langOptions = document.querySelectorAll('.lang-option');

    this.translationResult = document.getElementById('translationResult');
    this.phraseOriginal = document.getElementById('phraseOriginal');
    this.phraseTranslation = document.getElementById('phraseTranslation');
    this.phraseTranscription = document.getElementById('phraseTranscription');
    this.resultFlag = document.getElementById('resultFlag');
    this.resultLangName = document.getElementById('resultLangName');
    this.speakPhraseBtn = document.getElementById('speakPhraseBtn');
    this.copyPhraseBtn = document.getElementById('copyPhraseBtn');
    this.savePhraseBtn = document.getElementById('savePhraseBtn');
    this.sharePhraseBtn = document.getElementById('sharePhraseBtn');
    this.loadingIndicator = document.getElementById('loadingIndicator');

    this.phraseChips = document.querySelectorAll('.phrase-chip');

    this.languageMap = {
      en: { name: 'English', targetCode: 'en-US', flag: '🇬🇧' },
      es: { name: 'Español', targetCode: 'es-ES', flag: '🇪🇸' },
      fr: { name: 'Français', targetCode: 'fr-FR', flag: '🇫🇷' },
      it: { name: 'Italiano', targetCode: 'it-IT', flag: '🇮🇹' },
      zh: { name: '中文', targetCode: 'zh-CN', flag: '🇨🇳' },
      ja: { name: '日本語', targetCode: 'ja-JP', flag: '🇯🇵' },
      ko: { name: '한국어', targetCode: 'ko-KR', flag: '🇰🇷' },
      ru: { name: 'Русский', targetCode: 'ru-RU', flag: '🇷🇺' },
    };

    this.selectedLanguage = 'en';
    this.isRecording = false;
    this.recognition = null;
    this.speechSynthesis = window.speechSynthesis;

    if (!this.translateBtn || !this.targetLanguageBtn || !this.userInput) return;

    this.init();
  }

  init() {
    this.bindEvents();
    this.setupVoiceRecognition();
    this.updateCharCount();
    this.updateTranslateButton();
    this.applySelectedLanguageUI();
  }

  bindEvents() {
    this.userInput?.addEventListener('input', () => {
      this.updateCharCount();
      this.updateTranslateButton();
    });

    this.clearInputBtn?.addEventListener('click', () => this.clearInput());

    this.pasteBtn?.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        this.userInput.value = text;
        this.updateCharCount();
        this.updateTranslateButton();
      } catch {
        this.toast('Не удалось вставить из буфера', 'error');
      }
    });

    this.tabBtns?.forEach(btn => {
      btn.addEventListener('click', e => this.switchTab(e.currentTarget.dataset.tab));
    });

    this.voiceInputBtn?.addEventListener('click', () => this.toggleVoiceRecording());
    this.voiceRecordBtn?.addEventListener('click', () => this.toggleVoiceRecording());

    this.targetLanguageBtn?.addEventListener('click', e => {
      e.stopPropagation();
      this.targetLanguageMenu?.classList.toggle('show');
    });

    this.langOptions?.forEach(option => {
      option.addEventListener('click', e => {
        const lang = e.currentTarget.dataset.lang;
        this.selectLanguage(lang);
        this.targetLanguageMenu?.classList.remove('show');
      });
    });

    document.addEventListener('click', e => {
      if (!this.targetLanguageBtn?.contains(e.target) && !this.targetLanguageMenu?.contains(e.target)) {
        this.targetLanguageMenu?.classList.remove('show');
      }
    });

    this.translateBtn?.addEventListener('click', () => this.translate());

    this.userInput?.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.translate();
      }
    });

    this.phraseChips?.forEach(chip => {
      chip.addEventListener('click', e => {
        const text = e.currentTarget.dataset.text || e.currentTarget.textContent;
        this.userInput.value = text;
        this.updateCharCount();
        this.updateTranslateButton();
        this.switchTab('text');
        this.userInput.focus();
      });
    });

    this.speakPhraseBtn?.addEventListener('click', () => this.speakTranslation());
    this.copyPhraseBtn?.addEventListener('click', () => this.copyTranslation());
    this.savePhraseBtn?.addEventListener('click', () => this.saveTranslation());
    this.sharePhraseBtn?.addEventListener('click', () => this.shareTranslation());
  }

  switchTab(tabName) {
    this.tabBtns?.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));

    if (this.textTab) {
      const on = tabName === 'text';
      this.textTab.classList.toggle('active', on);
      this.textTab.style.display = on ? 'block' : 'none';
    }

    if (this.voiceTab) {
      const on = tabName === 'voice';
      this.voiceTab.classList.toggle('active', on);
      this.voiceTab.style.display = on ? 'block' : 'none';
    }

    if (tabName === 'text') setTimeout(() => this.userInput?.focus(), 50);
  }

  updateCharCount() {
    if (!this.charCount || !this.userInput) return;
    this.charCount.textContent = String(this.userInput.value.length);
  }

  updateTranslateButton() {
    if (!this.translateBtn || !this.userInput) return;
    this.translateBtn.disabled = this.userInput.value.trim().length === 0;
  }

  selectLanguage(langCode) {
    if (!this.languageMap[langCode]) return;
    this.selectedLanguage = langCode;
    this.applySelectedLanguageUI();
  }

  applySelectedLanguageUI() {
    const info = this.languageMap[this.selectedLanguage];
    const slot = this.targetLanguageBtn?.querySelector('.selected-language');
    if (slot && info) {
      slot.innerHTML = `<span class="flag">${info.flag}</span><span class="name">${info.name}</span>`;
    }
  }

  setupVoiceRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      this.voiceInputBtn && (this.voiceInputBtn.style.display = 'none');
      this.voiceRecordBtn && (this.voiceRecordBtn.style.display = 'none');
      document.querySelector('[data-tab="voice"]')?.style.setProperty('display', 'none');
      return;
    }

    this.recognition = new SR();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'ru-RU';

    this.recognition.onstart = () => {
      this.isRecording = true;
      this.updateVoiceUI(true);
    };

    this.recognition.onresult = event => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      this.userInput.value = transcript;
      this.updateCharCount();
      this.updateTranslateButton();
      this.voiceResult && (this.voiceResult.textContent = transcript);
      this.voiceResult && (this.voiceResult.style.display = 'block');
      this.switchTab('text');
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      this.updateVoiceUI(false);
    };

    this.recognition.onerror = () => {
      this.isRecording = false;
      this.updateVoiceUI(false);
      this.toast('Ошибка распознавания речи', 'error');
    };
  }

  updateVoiceUI(isRecording) {
    if (this.voiceStatus) this.voiceStatus.style.display = isRecording ? 'flex' : 'none';

    if (this.voiceInputBtn) {
      this.voiceInputBtn.classList.toggle('listening', isRecording);
      this.voiceInputBtn.innerHTML = isRecording ? '<i class="fas fa-stop"></i>' : '<i class="fas fa-microphone"></i><span>Голосовой ввод</span>';
    }

    if (this.voiceRecordBtn) {
      this.voiceRecordBtn.classList.toggle('recording', isRecording);
      this.voiceRecordBtn.innerHTML = isRecording
        ? '<i class="fas fa-stop"></i> Остановить запись'
        : '<i class="fas fa-microphone"></i> Начать запись';
    }
  }

  toggleVoiceRecording() {
    if (!this.recognition) return this.toast('Голосовой ввод не поддерживается', 'error');

    if (this.isRecording) return this.recognition.stop();

    try {
      this.recognition.lang = 'ru-RU';
      this.recognition.start();
      this.switchTab('voice');
    } catch {
      this.toast('Не удалось начать запись', 'error');
    }
  }

  clearInput() {
    this.userInput.value = '';
    this.updateCharCount();
    this.updateTranslateButton();
    this.voiceResult && (this.voiceResult.textContent = '');
    this.voiceResult && (this.voiceResult.style.display = 'none');
    this.translationResult && (this.translationResult.style.display = 'none');
    this.userInput.focus();
  }

  async translate() {
    const text = this.userInput.value.trim();
    if (!text) return;

    this.showLoading(true);

    try {
      const translation = await this.getMyMemoryTranslation(text, this.selectedLanguage);
      const transcription = await this.generateTranscription(translation, this.selectedLanguage);
      this.showResult(text, translation, transcription);
    } catch {
      this.toast('Не удалось выполнить перевод. Проверьте интернет.', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async getMyMemoryTranslation(text, targetLang) {
    const sourceLang = this.detectLanguage(text);
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Translation failed');
    const data = await res.json();
    const t = data?.responseData?.translatedText;
    if (!t) throw new Error('No translation');
    return t;
  }

  detectLanguage(text) {
    if (/[а-яА-ЯЁё]/.test(text)) return 'ru';
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
    if (/[\u3040-\u30FF]/.test(text)) return 'ja';
    if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
    return 'en';
  }

  async generateTranscription(text, langCode) {
    const prefixes = {
      en: 'Произношение:',
      es: 'Произношение:',
      fr: 'Произношение:',
      it: 'Произношение:',
      zh: 'Произношение (пиньинь):',
      ja: 'Произношение (ромадзи):',
      ko: 'Произношение (ромаджа):',
      ru: 'Произношение:'
    };
    return `${prefixes[langCode] || 'Произношение:'} ${text}`;
  }

  showResult(original, translation, transcription) {
    if (!this.translationResult) return;

    this.phraseOriginal && (this.phraseOriginal.textContent = original);
    this.phraseTranslation && (this.phraseTranslation.textContent = translation);
    this.phraseTranscription && (this.phraseTranscription.textContent = transcription);

    const info = this.languageMap[this.selectedLanguage];
    if (info) {
      this.resultFlag && (this.resultFlag.textContent = info.flag);
      this.resultLangName && (this.resultLangName.textContent = info.name);
    }

    this.translationResult.style.display = 'block';
    setTimeout(() => this.translationResult.classList.add('show'), 10);
  }

  showLoading(show) {
    if (this.loadingIndicator) this.loadingIndicator.style.display = show ? 'flex' : 'none';
    if (!this.translateBtn) return;
    this.translateBtn.disabled = show;
  }

  speakTranslation() {
    const text = this.phraseTranslation?.textContent;
    if (!text || !this.speechSynthesis) return this.toast('Озвучивание не поддерживается', 'error');

    const utter = new SpeechSynthesisUtterance(text);
    const info = this.languageMap[this.selectedLanguage];
    utter.lang = info?.targetCode || 'en-US';
    utter.rate = 0.9;

    this.speechSynthesis.cancel();
    this.speechSynthesis.speak(utter);
  }

  async copyTranslation() {
    const text = this.phraseTranslation?.textContent;
    if (!text) return this.toast('Нет текста для копирования', 'error');
    try {
      await navigator.clipboard.writeText(text);
      this.toast('Скопировано', 'success');
    } catch {
      this.toast('Не удалось скопировать', 'error');
    }
  }

  saveTranslation() {
    const original = this.phraseOriginal?.textContent;
    const translation = this.phraseTranslation?.textContent;
    if (!original || !translation) return this.toast('Нет данных для сохранения', 'error');

    const key = 'tongueTiedSavedPhrases';
    const saved = JSON.parse(localStorage.getItem(key) || '[]');

    const exists = saved.some(p => p.original === original && p.language === this.selectedLanguage);
    if (exists) return this.toast('Уже сохранено', 'info');

    const info = this.languageMap[this.selectedLanguage];
    saved.unshift({
      id: Date.now(),
      original,
      translation,
      language: this.selectedLanguage,
      languageName: info?.name,
      flag: info?.flag,
      timestamp: new Date().toISOString()
    });

    localStorage.setItem(key, JSON.stringify(saved.slice(0, 50)));
    this.toast('Сохранено', 'success');
  }

  async shareTranslation() {
    const original = this.phraseOriginal?.textContent;
    const translation = this.phraseTranslation?.textContent;
    if (!original || !translation) return this.toast('Нет данных для отправки', 'error');

    const info = this.languageMap[this.selectedLanguage];
    const text = `${info?.flag || '🌐'} ${original} → ${translation}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'TongueTied Travel', text, url: window.location.href });
      } catch {}
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      this.toast('Скопировано для отправки', 'success');
    } catch {
      this.toast('Не удалось подготовить отправку', 'error');
    }
  }

  toast(message, type = 'info') {
    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = `
      position:fixed;top:90px;right:24px;z-index:99999;
      padding:10px 14px;border-radius:12px;color:#fff;
      background:${type === 'success' ? 'var(--accent-teal)' : type === 'error' ? 'var(--accent-orange)' : 'var(--primary-blue)'};
      box-shadow:0 10px 24px rgba(0,0,0,.18);
      max-width:320px;font-weight:500;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }
}

function initTranslatorAfterPartials() {
  const root = document.getElementById('translator-panel');
  if (!root) return;

  if (root.dataset.initialized === 'true') return;
  root.dataset.initialized = 'true';

  window.TranslatorInstance = new Translator();
}

document.addEventListener('partialsLoaded', initTranslatorAfterPartials);
document.addEventListener('languageChanged', () => {
  // optional: could refresh translator labels if needed
});
