// ===== UTILITY FUNCTIONS =====

// Утилиты работают с глобальным объектом настроек, который создастся в main.js

// Функция для объявления screen reader
function announceToScreenReader(message) {
    // Создаём скрытый элемент для screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.classList.add('sr-only');
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Удаляем через некоторое время
    setTimeout(() => {
        if (announcement.parentNode) {
            document.body.removeChild(announcement);
        }
    }, 1000);
}

// Сохранение настроек в localStorage
function saveSettings(settings) {
    try {
        localStorage.setItem('tongueTiedSettings', JSON.stringify(settings));
        console.log('Настройки сохранены');
        return true;
    } catch (error) {
        console.error('Ошибка сохранения настроек:', error);
        return false;
    }
}

// Загрузка настроек из localStorage
function loadSettings() {
    try {
        const saved = localStorage.getItem('tongueTiedSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            console.log('Настройки загружены:', settings);
            return settings;
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
    
    // Настройки по умолчанию
    return {
        theme: 'dark',
        fontSize: 'medium',
        highContrast: false,
        language: 'ru',
        animations: true
    };
}

// Определение языка браузера
function detectBrowserLanguage() {
    const browserLang = navigator.language.split('-')[0];
    
    // Проверяем, поддерживается ли язык браузера
    const supportedLang = window.SUPPORTED_LANGUAGES?.find(lang => lang.code === browserLang);
    
    if (supportedLang && !localStorage.getItem('tongueTiedSettings')) {
        return browserLang;
    }
    
    return 'ru'; // По умолчанию русский
}

// Утилита для анимации счётчиков
function animateCounter(elementId, finalValue, suffix = '', duration = 2000) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let startValue = 0;
    const increment = finalValue / (duration / 16); // 60fps
    let currentValue = 0;
    
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= finalValue) {
            element.textContent = finalValue + suffix;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(currentValue) + suffix;
        }
    }, 16);
}

// Утилита для форматирования времени
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}ч ${minutes}м`;
    } else if (minutes > 0) {
        return `${minutes}м ${secs}с`;
    } else {
        return `${secs}с`;
    }
}

// Утилита для копирования текста в буфер обмена
function copyToClipboard(text) {
    return navigator.clipboard.writeText(text)
        .then(() => {
            announceToScreenReader('Текст скопирован в буфер обмена');
            return true;
        })
        .catch(err => {
            console.error('Ошибка при копировании:', err);
            announceToScreenReader('Ошибка при копировании');
            return false;
        });
}

// Утилита для воспроизведения речи
function speakText(text, lang = 'ru') {
    if (!('speechSynthesis' in window)) {
        alert('Ваш браузер не поддерживает озвучивание текста');
        return false;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    speechSynthesis.speak(utterance);
    return true;
}

// Утилита для плавного скролла
function smoothScrollTo(elementId, offset = 80) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

// Утилита для проверки поддержки функций
function checkFeatureSupport() {
    const features = {
        speechSynthesis: 'speechSynthesis' in window,
        clipboard: 'clipboard' in navigator && 'writeText' in navigator.clipboard,
        localStorage: 'localStorage' in window,
        intersectionObserver: 'IntersectionObserver' in window,
        cssVariables: CSS.supports('(--test: 0)')
    };
    
    return features;
}

// Утилита для debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Утилита для throttle
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Экспортируем утилиты
window.announceToScreenReader = announceToScreenReader;
window.saveSettings = saveSettings;
window.loadSettings = loadSettings;
window.detectBrowserLanguage = detectBrowserLanguage;
window.animateCounter = animateCounter;
window.formatTime = formatTime;
window.copyToClipboard = copyToClipboard;
window.speakText = speakText;
window.smoothScrollTo = smoothScrollTo;
window.checkFeatureSupport = checkFeatureSupport;
window.debounce = debounce;
window.throttle = throttle;