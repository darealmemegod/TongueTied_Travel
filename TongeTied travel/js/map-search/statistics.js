// Статистика и расчеты расстояний
class Statistics {
    constructor() {
        this.startTime = Date.now();
        this.searchCount = 0;
        this.distanceTraveled = 0;
    
        
        this.init();
    }
    
    init() {
        console.log('📊 Инициализация статистики...');
        
        // Загружаем сохраненную статистику
        this.loadStatistics();
        
        // Начинаем отсчет времени
        this.startTime = Date.now();
        
        // Обновляем статистику каждую минуту
        this.updateInterval = setInterval(() => {
            this.updateTimeSpent();
        }, 60000);
        
        console.log('✅ Статистика инициализирована');
    }
    
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Радиус Земли в км
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    calculateDistanceToPlace(place) {
        if (!this.userLocation || !place) return null;
        
        return this.calculateDistance(
            this.userLocation.lat,
            this.userLocation.lng,
            place.lat,
            place.lng
        );
    }
    
    setUserLocation(lat, lng) {
        this.userLocation = { lat, lng };
        console.log('📍 Местоположение пользователя установлено');
    }
    
    addSearch() {
        this.statistics.totalSearches++;
        this.saveStatistics();
    }
    
    addDistance(distanceKm) {
        this.statistics.totalDistance += distanceKm;
        this.saveStatistics();
    }
    
    addSavedPlace() {
        this.statistics.placesSaved++;
        this.saveStatistics();
    }
    
    addRoute() {
        this.statistics.routesPlanned++;
        this.saveStatistics();
    }
    
    updateTimeSpent() {
        const minutes = Math.floor((Date.now() - this.startTime) / 60000);
        this.statistics.timeSpent = minutes;
        this.saveStatistics();
    }
    
    getStatistics() {
        return {
            ...this.statistics,
            averageDistance: this.statistics.totalSearches > 0 
                ? (this.statistics.totalDistance / this.statistics.totalSearches).toFixed(2)
                : 0
        };
    }
    
    getFormattedStatistics() {
        const stats = this.getStatistics();
        return `
            <div class="stats-container">
                <div class="stat-item">
                    <i class="fas fa-search"></i>
                    <span class="stat-label">Поисков:</span>
                    <span class="stat-value">${stats.totalSearches}</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-road"></i>
                    <span class="stat-label">Общее расстояние:</span>
                    <span class="stat-value">${stats.totalDistance.toFixed(1)} км</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-bookmark"></i>
                    <span class="stat-label">Сохранено мест:</span>
                    <span class="stat-value">${stats.placesSaved}</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-route"></i>
                    <span class="stat-label">Маршрутов:</span>
                    <span class="stat-value">${stats.routesPlanned}</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-clock"></i>
                    <span class="stat-label">Времени проведено:</span>
                    <span class="stat-value">${stats.timeSpent} мин</span>
                </div>
            </div>
        `;
    }
    
    saveStatistics() {
        try {
            localStorage.setItem('mapStatistics', JSON.stringify(this.statistics));
        } catch (error) {
            console.error('Ошибка сохранения статистики:', error);
        }
    }
    
    loadStatistics() {
        try {
            const saved = localStorage.getItem('mapStatistics');
            if (saved) {
                this.statistics = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        }
    }
    
    resetStatistics() {
        this.statistics = {
            totalSearches: 0,
            totalDistance: 0,
            placesSaved: 0,
            routesPlanned: 0,
            timeSpent: 0
        };
        this.saveStatistics();
    }
    
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Инициализация
function initStatistics(mapInstance) {
    if (!window.mapStatistics) {
        window.mapStatistics = new MapStatistics(mapInstance);
    }
    return window.mapStatistics;
}

// Экспорт
export { MapStatistics, initStatistics };

window.Statistics = Statistics;