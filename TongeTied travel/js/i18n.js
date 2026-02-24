// ===== INTERNATIONALIZATION (i18n) - ИСПРАВЛЕННЫЙ =====

// Глобальные переменные
if (typeof window.currentInterfaceLanguage === 'undefined') {
    window.currentInterfaceLanguage = 'ru';
}

// Инициализация
async function initI18n() {
    console.log('🌐 Инициализация i18n...');
    
    try {
        // Проверяем, загружены ли переводы
        if (!window.TRANSLATIONS) {
            console.error('❌ TRANSLATIONS не загружен!');
            
            // Если используем all-translations.js, он уже должен быть загружен
            // Если нет, создаем заглушку
            if (!window.loadTranslation) {
                window.loadTranslation = async function(langCode) {
                    console.warn(`⚠️ Используем заглушку для языка: ${langCode}`);
                    return {};
                };
            }
            
            // Пробуем загрузить русский
            await window.loadTranslation('ru');
        }
        
        // Инициализируем селектор языка
        initLanguageSelector();
        
        // Обновляем интерфейс
        updateInterfaceLanguage();
        
        console.log('✅ i18n инициализирован, язык:', window.currentInterfaceLanguage);
        
    } catch (error) {
        console.error('❌ Ошибка инициализации i18n:', error);
    }
}

// Обновление текста интерфейса
function updateInterfaceLanguage() {
    const lang = window.currentInterfaceLanguage;
    const translations = window.TRANSLATIONS?.[lang] || window.TRANSLATIONS?.ru || {};
    
    if (Object.keys(translations).length === 0) {
        console.warn(`Нет переводов для ${lang}, используем ключи как есть`);
        return;
    }
    
    // Обновляем элементы с data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translations[key];
            } else {
                el.textContent = translations[key];
            }
            updated++;
        }
    });
    
    // Обновляем элементы с data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[key]) {
            el.placeholder = translations[key];
            updated++;
        }
    });
    
    console.log(`✅ Обновлено ${updated} элементов для языка ${lang}`);
}

// Обновление UI элементов языка
function updateLanguageUI(langCode) {
    const langNames = {
        'en': 'English',
        'ru': 'Русский',
        'es': 'Español',
        'fr': 'Français',
        'it': 'Italiano',
        'de': 'Deutsch',
        'ja': '日本語',
        'ko': '한국어',
        'zh': '中文',
        'hi': 'हिन्दी',
        'pt': 'Português'
    };
    
    const currentLangEl = document.getElementById('currentLanguage');
    if (currentLangEl) {
        currentLangEl.textContent = langNames[langCode] || langCode;
    }
}

// Определение языка браузера
function detectBrowserLanguage() {
    try {
        const browserLang = navigator.language.split('-')[0];
        
        // Проверяем, поддерживается ли язык браузера
        if (window.SUPPORTED_LANGUAGES) {
            const supportedLang = window.SUPPORTED_LANGUAGES.find(lang => lang.code === browserLang);
            if (supportedLang) {
                return browserLang;
            }
        }
        
        // Если файл есть, используем язык браузера
        if (window.TRANSLATIONS && window.TRANSLATIONS[browserLang]) {
            return browserLang;
        }
        
    } catch (error) {
        console.error('Ошибка определения языка браузера:', error);
    }
    
    return 'ru'; // По умолчанию русский
}

// Инициализация селектора языка
function initLanguageSelector() {
    const languageBtn = document.getElementById('languageBtn');
    const languageDropdown = document.getElementById('languageDropdown');
    
    if (!languageBtn || !languageDropdown) {
        console.warn('Элементы выбора языка не найдены');
        return;
    }
    
    // Очищаем старые опции
    languageDropdown.innerHTML = '';
    
    // Заполняем выпадающий список языков
    if (window.SUPPORTED_LANGUAGES) {
        window.SUPPORTED_LANGUAGES.forEach(lang => {
            const option = document.createElement('button');
            option.className = 'language-option';
            option.setAttribute('data-lang', lang.code);
            option.innerHTML = `
                <span class="flag">${lang.flag}</span>
                <span>${lang.nativeName}</span>
                ${lang.code === window.currentInterfaceLanguage ? '<i class="fas fa-check"></i>' : ''}
            `;
            
            option.addEventListener('click', async () => {
                try {
                    // Загружаем перевод если ещё не загружен
                    if (!window.TRANSLATIONS[lang.code]) {
                        await window.loadTranslation(lang.code);
                    }
                    
                    // Обновляем текущий язык
                    window.currentInterfaceLanguage = lang.code;
                    
                    // Обновляем отображение
                    updateInterfaceLanguage();
                    
                    // Обновляем UI элементы
                    updateLanguageUI(lang.code);
                    
                    // Закрываем дропдаун
                    languageDropdown.classList.remove('show');
                    
                } catch (error) {
                    console.error('Ошибка смены языка:', error);
                }
            });
            
            languageDropdown.appendChild(option);
        });
    } else {
        // Если SUPPORTED_LANGUAGES нет, создаём базовые
        const languages = [
            { code: 'en', flag: '🇬🇧', nativeName: 'English' },
            { code: 'ru', flag: '🇷🇺', nativeName: 'Русский' },
            { code: 'es', flag: '🇪🇸', nativeName: 'Español' }
        ];
        
        languages.forEach(lang => {
            const option = document.createElement('button');
            option.className = 'language-option';
            option.setAttribute('data-lang', lang.code);
            option.innerHTML = `
                <span class="flag">${lang.flag}</span>
                <span>${lang.nativeName}</span>
                ${lang.code === window.currentInterfaceLanguage ? '<i class="fas fa-check"></i>' : ''}
            `;
            
            option.addEventListener('click', async () => {
                try {
                    // Загружаем перевод если ещё не загружен
                    if (!window.TRANSLATIONS[lang.code]) {
                        await window.loadTranslation(lang.code);
                    }
                    
                    // Обновляем текущий язык
                    window.currentInterfaceLanguage = lang.code;
                    
                    // Обновляем отображение
                    updateInterfaceLanguage();
                    
                    // Обновляем UI элементы
                    updateLanguageUI(lang.code);
                    
                    languageDropdown.classList.remove('show');
                    
                } catch (error) {
                    console.error('Ошибка смены языка:', error);
                }
            });
            
            languageDropdown.appendChild(option);
        });
    }
    
    // Переключение выпадающего списка
    languageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        languageDropdown.classList.toggle('show');
    });
    
    // Закрытие при клике снаружи
    document.addEventListener('click', (e) => {
        if (!languageBtn.contains(e.target) && !languageDropdown.contains(e.target)) {
            languageDropdown.classList.remove('show');
        }
    });
}

// Получение перевода по ключу
function getTranslation(key) {
    if (!window.TRANSLATIONS || typeof window.TRANSLATIONS !== 'object') {
        console.warn('⚠️ TRANSLATIONS не инициализирован');
        return key;
    }
    
    if (!key || typeof key !== 'string') {
        console.warn('⚠️ Неверный ключ перевода:', key);
        return key;
    }
    
    // Пытаемся получить перевод на текущем языке
    const currentLang = window.currentInterfaceLanguage || 'ru';
    if (window.TRANSLATIONS[currentLang] && 
        window.TRANSLATIONS[currentLang][key]) {
        return window.TRANSLATIONS[currentLang][key];
    }
    
    // Если нет, пробуем английский
    if (window.TRANSLATIONS.en && window.TRANSLATIONS.en[key]) {
        console.log(`📝 Используем английский перевод для: ${key}`);
        return window.TRANSLATIONS.en[key];
    }
    
    // Если нет, пробуем русский
    if (window.TRANSLATIONS.ru && window.TRANSLATIONS.ru[key]) {
        console.log(`📝 Используем русский перевод для: ${key}`);
        return window.TRANSLATIONS.ru[key];
    }
    
    // Если нет перевода вообще, возвращаем ключ
    console.warn(`❌ Перевод не найден для ключа: ${key}`);
    return key;
}

// Добавляем SUPPORTED_LANGUAGES если их нет
if (typeof window.SUPPORTED_LANGUAGES === 'undefined') {
    window.SUPPORTED_LANGUAGES = [
        { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
        { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr' },
        { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
        { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
        { code: 'it', name: 'Italian', nativeName: 'Italiano', dir: 'ltr' },
        { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
        { code: 'zh', name: 'Chinese', nativeName: '中文', dir: 'ltr' },
        { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
        { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr' },
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
        { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' }
    ];
}

// Экспортируем функции
window.initI18n = initI18n;
window.getTranslation = getTranslation;

// Простая функция смены языка для использования извне
window.changeInterfaceLanguage = async function(langCode) {
    console.log(`🔄 Смена языка на: ${langCode}`);
    
    try {
        // Загружаем перевод если ещё не загружен
        if (!window.TRANSLATIONS || !window.TRANSLATIONS[langCode]) {
            if (window.loadTranslation) {
                await window.loadTranslation(langCode);
            } else {
                console.error('❌ Функция loadTranslation не найдена!');
                return;
            }
        }
        
        // Обновляем текущий язык
        window.currentInterfaceLanguage = langCode;
        
        // Обновляем отображение
        updateInterfaceLanguage();
        
        // Обновляем UI элементы
        updateLanguageUI(langCode);
        
    } catch (error) {
        console.error('Ошибка смены языка:', error);
    }
};

// Вызываем инициализацию при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Небольшая задержка для полной загрузки страницы
    setTimeout(() => {
        initI18n();
    }, 100);
});

// Дебаг-функция для проверки переводов
window.debugTranslations = function() {
    console.log('=== ДЕБАГ ПЕРЕВОДОВ ===');
    console.log('Текущий язык:', window.currentInterfaceLanguage);
    console.log('Загруженные языки:', Object.keys(window.TRANSLATIONS || {}));
    console.log('SUPPORTED_LANGUAGES:', window.SUPPORTED_LANGUAGES);
    
    // Проверяем несколько ключей
    const testKeys = ['hero_title', 'start_journey', 'translator_title'];
    testKeys.forEach(key => {
        const translation = getTranslation(key);
        console.log(`${key}:`, translation);
    });
};