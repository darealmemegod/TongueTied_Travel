// ===== STATISTICS ANIMATION =====

// Инициализация статистики
function initStatistics() {
    // Создаём observer для отслеживания появления секции статистики
    const statsSection = document.getElementById('stats');
    if (!statsSection) return;
    
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStatistics();
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    observer.observe(statsSection);
}

// Анимация статистики
function animateStatistics() {
    // Анимируем статистику с задержками
    setTimeout(() => animateCounter('stat1', 72, '%'), 200);
    setTimeout(() => animateCounter('stat2', 3, 'x'), 600);
    setTimeout(() => animateCounter('stat3', 58, '%'), 1000);
    
    // Особый случай для времени (с десятичной частью)
    setTimeout(() => animateTimeStat('stat4', 2.5, 'ч'), 1400);
}

// Анимация счётчика времени (с десятичной частью)
function animateTimeStat(elementId, finalValue, suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let currentValue = 0;
    const increment = finalValue / 50; // Анимируем за 50 шагов
    const duration = 1000; // 1 секунда
    
    const interval = setInterval(() => {
        currentValue += increment;
        if (currentValue >= finalValue) {
            element.textContent = finalValue.toFixed(1) + suffix;
            clearInterval(interval);
        } else {
            element.textContent = currentValue.toFixed(1) + suffix;
        }
    }, duration / 50);
}

// Функция для сброса статистики (для демонстрации)
function resetStatistics() {
    document.getElementById('stat1').textContent = '0%';
    document.getElementById('stat2').textContent = '0x';
    document.getElementById('stat3').textContent = '0%';
    document.getElementById('stat4').textContent = '0ч';
}

// Функция для обновления статистики на основе пользовательских данных
function updateUserStatistics(stats) {
    // В реальном приложении здесь была бы логика обновления статистики
    // на основе данных пользователя (сколько фраз сгенерировано и т.д.)
    console.log('Updating user statistics:', stats);
}

// Создание статистики использования
function createUsageStatistics() {
    const stats = {
        phrasesGenerated: localStorage.getItem('phrasesGenerated') || 0,
        phrasesSaved: localStorage.getItem('phrasesSaved') || 0,
        languagesUsed: JSON.parse(localStorage.getItem('languagesUsed') || '[]'),
        lastVisit: localStorage.getItem('lastVisit') || new Date().toISOString()
    };
    
    return stats;
}

// Сохранение статистики использования
function saveUsageStatistics(action, data = {}) {
    try {
        let stats = JSON.parse(localStorage.getItem('usageStatistics') || '{}');
        
        switch(action) {
            case 'phrase_generated':
                stats.phrasesGenerated = (stats.phrasesGenerated || 0) + 1;
                if (data.language) {
                    stats.languagesUsed = stats.languagesUsed || [];
                    if (!stats.languagesUsed.includes(data.language)) {
                        stats.languagesUsed.push(data.language);
                    }
                }
                break;
                
            case 'phrase_saved':
                stats.phrasesSaved = (stats.phrasesSaved || 0) + 1;
                break;
                
            case 'phrase_spoken':
                stats.phrasesSpoken = (stats.phrasesSpoken || 0) + 1;
                break;
        }
        
        stats.lastVisit = new Date().toISOString();
        localStorage.setItem('usageStatistics', JSON.stringify(stats));
        
        return stats;
    } catch (error) {
        console.error('Error saving usage statistics:', error);
        return null;
    }
}

// Получение статистики использования
function getUsageStatistics() {
    try {
        return JSON.parse(localStorage.getItem('usageStatistics') || '{}');
    } catch (error) {
        console.error('Error getting usage statistics:', error);
        return {};
    }
}

// Отображение статистики использования (для отладки)
function displayUsageStatistics() {
    const stats = getUsageStatistics();
    console.log('Usage Statistics:', stats);
    
    // Можно добавить отображение в интерфейсе
    const statsDisplay = document.getElementById('usageStatsDisplay');
    if (statsDisplay) {
        statsDisplay.innerHTML = `
            <h3>Ваша статистика</h3>
            <p>Фраз сгенерировано: ${stats.phrasesGenerated || 0}</p>
            <p>Фраз сохранено: ${stats.phrasesSaved || 0}</p>
            <p>Языков использовано: ${(stats.languagesUsed || []).length}</p>
        `;
    }
}

// Экспортируем функции
window.initStatistics = initStatistics;
window.resetStatistics = resetStatistics;
window.updateUserStatistics = updateUserStatistics;
window.createUsageStatistics = createUsageStatistics;
window.saveUsageStatistics = saveUsageStatistics;
window.getUsageStatistics = getUsageStatistics;
window.displayUsageStatistics = displayUsageStatistics;
window.animateTimeStat = animateTimeStat;