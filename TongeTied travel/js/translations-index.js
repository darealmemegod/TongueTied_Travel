// js/translations-index.js
window.ALL_TRANSLATIONS = {};

// Загрузчик переводов
window.loadTranslation = async function(langCode) {
    switch(langCode) {
        case 'de':
            if (!window.TRANSLATIONS_DE) {
                await import('./translations/de.js');
            }
            return window.TRANSLATIONS_DE;
        case 'en':
            if (!window.TRANSLATIONS_EN) {
                await import('./translations/en.js');
            }
            return window.TRANSLATIONS_EN;
        case 'es':
            if (!window.TRANSLATIONS_ES) {
                await import('./translations/es.js');
            }
            return window.TRANSLATIONS_ES;
        case 'fr':
            if (!window.TRANSLATIONS_FR) {
                await import('./translations/fr.js');
            }
            return window.TRANSLATIONS_FR;
        case 'hi':
            if (!window.TRANSLATIONS_HI) {
                await import('./translations/hi.js');
            }
            return window.TRANSLATIONS_HI;
        case 'it':
            if (!window.TRANSLATIONS_IT) {
                await import('./translations/it.js');
            }
            return window.TRANSLATIONS_IT;
        case 'ja':
            if (!window.TRANSLATIONS_JA) {
                await import('./translations/ja.js');
            }
            return window.TRANSLATIONS_JA;
        case 'ko':
            if (!window.TRANSLATIONS_KO) {
                await import('./translations/ko.js');
            }
            return window.TRANSLATIONS_KO;
        case 'pt':
            if (!window.TRANSLATIONS_PT) {
                await import('./translations/pt.js');
            }
            return window.TRANSLATIONS_PT;
        case 'ru':
            if (!window.TRANSLATIONS_RU) {
                await import('./translations/ru.js');
            }
            return window.TRANSLATIONS_RU;
        case 'zh':
            if (!window.TRANSLATIONS_ZH) {
                await import('./translations/zh.js');
            }
            return window.TRANSLATIONS_ZH;
        default:
            if (!window.TRANSLATIONS_EN) {
                await import('./translations/en.js');
            }
            return window.TRANSLATIONS_EN;
    }
};