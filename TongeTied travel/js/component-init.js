// components-init.js
function initComponentsAfterPartials() {
    console.log('🚀 Инициализация компонентов после загрузки partials...');
    
    // Инициализируем Translator
    if (typeof Translator !== 'undefined') {
        try {
            const translator = new Translator();
            console.log('✅ Translator инициализирован');
        } catch (error) {
            console.error('❌ Ошибка инициализации Translator:', error);
        }
    }
    
    // Инициализируем MapPanel
    if (typeof MapPanel !== 'undefined') {
        try {
            const mapPanel = new MapPanel();
            console.log('✅ MapPanel инициализирован');
        } catch (error) {
            console.error('❌ Ошибка инициализации MapPanel:', error);
        }
    }
    
    // Инициализируем другие компоненты...
    // if (typeof PhraseGenerator !== 'undefined') { ... }
    
    return true;
}

document.addEventListener('DOMContentLoaded', initComponents);

// Экспортируем глобально
if (typeof window !== 'undefined') {
    window.initComponentsAfterPartials = initComponentsAfterPartials;
}

