// features.js - функциональность карты и ИИ-помощника

// Карта дружелюбных мест
function initMapFeatures() {
    // Кнопка открытия карты
    const openMapBtn = document.querySelector('.map-open-btn');
    const downloadMapBtn = document.querySelector('.map-download-btn');
    
    if (openMapBtn) {
        openMapBtn.addEventListener('click', () => {
            // В реальном приложении здесь будет открытие полноценной карты
            alert('В полной версии приложения откроется интерактивная карта с дружелюбными местами');
            announceToScreenReader('Карта дружелюбных мест. В разработке');
        });
    }
    
    if (downloadMapBtn) {
        downloadMapBtn.addEventListener('click', () => {
            alert('Карта будет доступна для скачивания в полной версии приложения');
            announceToScreenReader('Скачивание оффлайн-карты. В разработке');
        });
    }
    
    // Интерактивные точки на превью карты
    const mapPoints = document.querySelectorAll('.map-point');
    mapPoints.forEach(point => {
        point.addEventListener('click', () => {
            const type = point.dataset.type;
            const typeNames = {
                'restaurant': 'Ресторан с меню на нескольких языках',
                'hotel': 'Отель с многоязычным персоналом',
                'pharmacy': 'Аптека с международными названиями',
                'hospital': 'Больница с англоговорящими врачами'
            };
            
            alert(`Вы выбрали: ${typeNames[type] || 'Место'}\nВ полной версии откроется подробная информация`);
            
            // Анимация выбора
            point.style.transform = 'scale(1.2)';
            point.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
            
            setTimeout(() => {
                point.style.transform = '';
                point.style.boxShadow = '';
            }, 300);
        });
    });
}

// ИИ-помощник
function initAIAssistant() {
    const startAIBtn = document.querySelector('.ai-start-btn');
    const tryDemoBtn = document.querySelector('.ai-try-btn');
    const aiSendBtn = document.querySelector('.ai-send-btn');
    const aiInput = document.querySelector('.ai-input input');
    
    // Демо-вопросы для ИИ
    const demoQuestions = [
        "Как сказать 'Где ближайшая аптека?' на испанском?",
        "Как вежливо отказаться от дополнительных услуг в отеле?",
        "Как спросить 'Это блюдо содержит орехи?' на японском?",
        "Как объяснить аллергию на морепродукты в ресторане?",
        "Как попросить помощи при потере багажа в аэропорту?"
    ];
    
    if (tryDemoBtn) {
        tryDemoBtn.addEventListener('click', () => {
            const randomQuestion = demoQuestions[Math.floor(Math.random() * demoQuestions.length)];
            
            // Добавляем вопрос в чат
            addAIMessage(randomQuestion, 'user');
            
            // Генерируем ответ
            setTimeout(() => {
                generateAIResponse(randomQuestion);
            }, 1000);
            
            announceToScreenReader('Демо-режим ИИ помощника запущен');
        });
    }
    
    if (startAIBtn) {
        startAIBtn.addEventListener('click', () => {
            alert('ИИ-помощник доступен в полной версии приложения');
            announceToScreenReader('ИИ помощник. В разработке');
        });
    }
    
    if (aiSendBtn && aiInput) {
        aiSendBtn.addEventListener('click', sendAIMessage);
        aiInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendAIMessage();
            }
        });
    }
    
    function sendAIMessage() {
        const message = aiInput.value.trim();
        if (!message) return;
        
        addAIMessage(message, 'user');
        aiInput.value = '';
        
        // Эмуляция ответа ИИ
        setTimeout(() => {
            generateAIResponse(message);
        }, 1500);
    }
    
    function addAIMessage(text, sender) {
        const chat = document.querySelector('.ai-chat');
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${sender}`;
        messageDiv.innerHTML = `<div class="message-text">${text}</div>`;
        
        chat.appendChild(messageDiv);
        chat.scrollTop = chat.scrollHeight;
        
        // Оповещение для screen readers
        if (sender === 'user') {
            announceToScreenReader(`Вы: ${text}`);
        }
    }
    
    function generateAIResponse(question) {
        const responses = {
            "аптека": `En español: "¿Dónde está la farmacia más cercana?" (¿Дóндэ эстá ла фармас́я мáс серка́на?). Произнесите с вежливой интонацией.`,
            "отель": `"Disculpe, no necesito servicios adicionales, gracias" (Диску́лпэ, но несес́то сербис́ос адис́оналес, грас́яс). Добавьте улыбку для вежливости.`,
            "аллергия": `"Tengo alergia a los mariscos" (Тэ́нго алэрх́я а лос мар́искос). Можно показать на карточке аллергий для надёжности.`,
            "багаж": `"He perdido mi equipaje, ¿puede ayudarme?" (Э перд́идо ми экипа́хе, ¿пуэ́дэ аюда́рмэ?). Обратитесь к стойке Lost & Found.`,
            "блюдо": `"¿Este plato contiene nueces?" (¿Э́стэ пла́то конт́енэ нуэ́сэс?). Можно показать на меню или спросить официанта.`
        };
        
        let response = "Извините, я пока учусь. В полной версии я смогу перевести это лучше!";
        
        // Простой поиск по ключевым словам
        for (const [keyword, answer] of Object.entries(responses)) {
            if (question.toLowerCase().includes(keyword)) {
                response = answer;
                break;
            }
        }
        
        addAIMessage(response, 'incoming');
        announceToScreenReader(`ИИ помощник: ${response.substring(0, 100)}...`);
    }
}

// Скачивание PDF карточек
function initPDFDownloads() {
    const downloadBtns = document.querySelectorAll('.download-btn');
    
    downloadBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const pdfName = btn.dataset.pdf || 'card.pdf';
            
            // Визуальная обратная связь
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> <span>Скачивается...</span>';
            btn.disabled = true;
            
            // Эмуляция скачивания
            setTimeout(() => {
                alert(`Карточка "${pdfName}" будет скачана в полной версии приложения`);
                
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                
                announceToScreenReader('Карточка подготовлена к скачиванию');
            }, 800);
        });
    });
}

// Анимация статистики
function animateStats() {
    const statElements = {
        'stat1': { target: 72, suffix: '%' },
        'stat2': { target: 3, suffix: 'x' },
        'stat3': { target: 58, suffix: '%' },
        'stat4': { target: 2.5, suffix: 'ч' }
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                for (const [id, data] of Object.entries(statElements)) {
                    animateCounter(id, data.target, data.suffix);
                }
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    const statsSection = document.getElementById('stats');
    if (statsSection) {
        observer.observe(statsSection);
    }
}

function animateCounter(elementId, target, suffix) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let current = 0;
    const increment = target / 50;
    const duration = 1500;
    const stepTime = duration / 50;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + suffix;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current) + suffix;
        }
    }, stepTime);
}

document.addEventListener('partialsLoaded', () => {
    const openMapBtn = document.querySelector('.map-open-btn');
    if (openMapBtn) {
        openMapBtn.addEventListener('click', () => {
            console.log('🟡 Кнопка карты нажата, открываю через MapPanel...');
            
            // Проверяем и инициализируем MapPanel если нужно
            if (window.mapPanel) {
                console.log('✅ MapPanel найден, вызываю open()');
                window.mapPanel.open();
            } else {
                console.error('❌ MapPanel не найден!');
                // Резервный вариант
                const panel = document.getElementById('mapPanel');
                if (panel) {
                    panel.classList.add('active');
                    panel.setAttribute('aria-hidden', 'false');
                    console.log('Панель открыта (резервный метод)');
                }
            }
        });
    } else {
        console.warn('Кнопка .map-open-btn не найдена');
    }
});

document.addEventListener('click', e => {
    if (e.target.closest('#closeMapPanel')) {
        const panel = document.getElementById('mapPanel');
        if (panel) {
            panel.classList.remove('active');
            panel.setAttribute('aria-hidden', 'true');
            console.log('Панель закрыта');
        }
    }
});

// Инициализация всех фич
function initFeatures() {
    animateStats();
    initMapFeatures();
    initAIAssistant();
    initPDFDownloads();
    
    console.log('🚀 Фичи инициализированы');
}

// Экспортируем для использования
window.initFeatures = initFeatures;

// Автозапуск
document.addEventListener('DOMContentLoaded', initFeatures);