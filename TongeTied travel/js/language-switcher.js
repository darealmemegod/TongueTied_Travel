// js/language-switcher.js

// ===== ГЛОБАЛЬНЫЕ ОБЪЯВЛЕНИЯ =====
// Создаем функцию смены языка в самом начале
if (!window.changeInterfaceLanguage) {
    console.log('⚡ Создаю функцию changeInterfaceLanguage в глобальной области...');
    window.changeInterfaceLanguage = async function(langCode) {
        console.log(`🔄 changeInterfaceLanguage вызван с кодом: ${langCode}`);
        
        try {
            // Сохраняем язык
            window.currentInterfaceLanguage = langCode;
            localStorage.setItem('language', langCode);
            localStorage.setItem('preferredLanguage', langCode);
            
            // Обновляем атрибут lang у html
            document.documentElement.lang = langCode;
            
            // Обновляем отображение
            if (window.updateInterfaceLanguage && typeof window.updateInterfaceLanguage === 'function') {
                console.log('🔄 Вызываю updateInterfaceLanguage...');
                window.updateInterfaceLanguage();
            } else {
                console.log('⚠️ updateInterfaceLanguage не найден, перезагружаю страницу...');
                setTimeout(() => window.location.reload(), 300);
            }
            
            // Обновляем UI переключателя
            updateLanguageButton(langCode);
            
        } catch (error) {
            console.error('❌ Ошибка в changeInterfaceLanguage:', error);
            localStorage.setItem('language', langCode);
            setTimeout(() => window.location.reload(), 300);
        }
    };
}

// Вспомогательная функция для обновления кнопки языка
function updateLanguageButton(langCode) {
    const currentLanguageText = document.getElementById('currentLanguage');
    const currentFlag = document.querySelector('.language-btn .language-flag');
    
    if (!currentLanguageText && !currentFlag) return;
    
    const languages = {
        'en': { name: 'English', flag: '🇺🇸' },
        'ru': { name: 'Русский', flag: '🇷🇺' },
        'es': { name: 'Español', flag: '🇪🇸' },
        'fr': { name: 'Français', flag: '🇫🇷' },
        'it': { name: 'Italiano', flag: '🇮🇹' },
        'de': { name: 'Deutsch', flag: '🇩🇪' },
        'zh': { name: '中文', flag: '🇨🇳' },
        'ja': { name: '日本語', flag: '🇯🇵' },
        'ko': { name: '한국어', flag: '🇰🇷' },
        'hi': { name: 'हिन्दी', flag: '🇮🇳' },
        'pt': { name: 'Português', flag: '🇵🇹' }
    };
    
    const lang = languages[langCode] || languages['ru'];
    
    if (currentLanguageText) {
        currentLanguageText.textContent = lang.name;
    }
    if (currentFlag) {
        currentFlag.textContent = lang.flag;
    }
}

// ===== ОСНОВНОЙ КОД =====
document.addEventListener('partialsLoaded', function() {
    console.log('🌐 Language switcher loading after partials...');
    
    // Небольшая задержка для гарантии что DOM обновлен
    setTimeout(() => {
        initLanguageSwitcher();
    }, 200);
});

function initLanguageSwitcher() {
    const languageBtn = document.getElementById('languageBtn');
    const languageDropdown = document.getElementById('languageDropdown');
    
    if (!languageBtn || !languageDropdown) {
        console.warn('⚠️ Language switcher elements not found');
        
        // Пробуем еще раз через секунду
        setTimeout(() => {
            const retryBtn = document.getElementById('languageBtn');
            const retryDropdown = document.getElementById('languageDropdown');
            if (retryBtn && retryDropdown) {
                console.log('🔄 Повторная инициализация language switcher...');
                initLanguageSwitcher();
            }
        }, 1000);
        return;
    }
    
    // Проверяем, не был ли уже инициализирован
    if (languageBtn.hasAttribute('data-initialized')) {
        console.log('⚠️ Language switcher уже инициализирован');
        return;
    }
    
    languageBtn.setAttribute('data-initialized', 'true');
    console.log('✅ Language switcher elements found');
    
    // Заполняем выпадающий список языками
    populateLanguageDropdown();
    
    // Обработчик клика на кнопку
    languageBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🟢 Language button clicked');
        
        // Переключаем видимость
        if (languageDropdown.style.display === 'block') {
            languageDropdown.style.display = 'none';
            languageBtn.setAttribute('aria-expanded', 'false');
            console.log('🔽 Dropdown closed');
        } else {
            languageDropdown.style.display = 'block';
            languageBtn.setAttribute('aria-expanded', 'true');
            console.log('🔼 Dropdown opened');
        }
    });
    
    // Закрытие при клике вне
    document.addEventListener('click', function(e) {
        if (!languageBtn.contains(e.target) && !languageDropdown.contains(e.target)) {
            languageDropdown.style.display = 'none';
            languageBtn.setAttribute('aria-expanded', 'false');
        }
    });
    
    // Закрытие при нажатии Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            languageDropdown.style.display = 'none';
            languageBtn.setAttribute('aria-expanded', 'false');
        }
    });
    
    // Обновляем кнопку текущим языком
    const currentLang = localStorage.getItem('language') || 'ru';
    updateLanguageButton(currentLang);
    
    console.log('✅ Language switcher ready');
}

function populateLanguageDropdown() {
    const languageDropdown = document.getElementById('languageDropdown');
    
    if (!languageDropdown) return;
    
    // Список языков (используем emoji флаги)
    const languages = [
        { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
        { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
        { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
        { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
        { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
        { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
        { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
        { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
        { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
        { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' }
    ];
    
    // Очищаем и заполняем
    languageDropdown.innerHTML = '';
    
    const currentLang = localStorage.getItem('language') || 'ru';
    
    languages.forEach(lang => {
        const option = document.createElement('button');
        option.className = 'language-option';
        option.setAttribute('data-lang', lang.code);
        option.setAttribute('role', 'menuitem');
        option.setAttribute('aria-label', `Select ${lang.nativeName} language`);
        
        option.innerHTML = `
            <span class="language-flag">${lang.flag}</span>
            <span class="language-name">${lang.nativeName}</span>
            ${lang.code === currentLang ? '<i class="fas fa-check checkmark"></i>' : ''}
        `;
        
        // Обработчик выбора языка
        option.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log(`🎯 Выбран язык: ${lang.code} (${lang.nativeName})`);
            
            // Закрываем dropdown
            languageDropdown.style.display = 'none';
            document.getElementById('languageBtn').setAttribute('aria-expanded', 'false');
            
            // Обновляем отображение в dropdown
            document.querySelectorAll('.language-option').forEach(opt => {
                opt.classList.remove('selected');
                opt.querySelector('.checkmark')?.remove();
            });
            
            this.classList.add('selected');
            this.insertAdjacentHTML('beforeend', '<i class="fas fa-check checkmark"></i>');
            
            // ОБНОВЛЯЕМ КНОПКУ СРАЗУ
            const currentLanguageText = document.getElementById('currentLanguage');
            const currentFlag = document.querySelector('.language-btn .language-flag');
            
            if (currentLanguageText) {
                currentLanguageText.textContent = lang.nativeName;
            }
            if (currentFlag) {
                currentFlag.textContent = lang.flag;
            }
            
            // ВЫЗЫВАЕМ ФУНКЦИЮ СМЕНЫ ЯЗЫКА
            console.log(`🔄 Вызываю changeInterfaceLanguage('${lang.code}')...`);
            
            if (window.changeInterfaceLanguage && typeof window.changeInterfaceLanguage === 'function') {
                window.changeInterfaceLanguage(lang.code);
            } else {
                console.error('❌ changeInterfaceLanguage не найдена! Использую fallback...');
                
                // Fallback: сохраняем язык и перезагружаем
                localStorage.setItem('language', lang.code);
                localStorage.setItem('preferredLanguage', lang.code);
                
                // Пробуем вызвать другие возможные функции
                if (window.updateInterfaceLanguage) {
                    window.currentInterfaceLanguage = lang.code;
                    window.updateInterfaceLanguage();
                } else {
                    // Перезагружаем страницу
                    console.log('🔄 Перезагружаю страницу...');
                    setTimeout(() => window.location.reload(), 300);
                }
            }
        });
        
        // Помечаем текущий язык
        if (lang.code === currentLang) {
            option.classList.add('selected');
        }
        
        languageDropdown.appendChild(option);
    });
    
    console.log(`✅ Added ${languages.length} languages to dropdown`);
}

// Дополнительная инициализация при полной загрузке DOM (с проверкой)
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM полностью загружен');
    
    // Ждем немного для гарантии что элементы загрузились
    setTimeout(() => {
        const languageBtn = document.getElementById('languageBtn');
        if (languageBtn) {
            console.log('🎯 Найден languageBtn, проверяю инициализацию...');
            
            if (!languageBtn.hasAttribute('data-initialized')) {
                console.log('🔄 Инициализирую language switcher...');
                initLanguageSwitcher();
            }
        } else {
            console.log('⏳ languageBtn еще не загружен, жду partialsLoaded...');
        }
    }, 500);
});

// Экспортируем функцию для ручного вызова
window.initLanguageSwitcher = initLanguageSwitcher;

// Функция для ручной проверки и инициализации
window.forceInitLanguageSwitcher = function() {
    console.log('🔧 Принудительная инициализация language switcher...');
    initLanguageSwitcher();
};