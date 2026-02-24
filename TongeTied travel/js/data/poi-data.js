window.POIData = {
    categories: ['hospital', 'hotel', 'restaurant', 'attraction', 'pharmacy', 'police', 'embassy'],
    
    getByCategory(category) {
        const sampleData = {
            hospital: [
                { id: 1, lat: 55.761, lon: 37.624, category: 'hospital', name: { en: 'City Hospital', ru: 'Городская больница' }, address: 'ул. Лечебная, 1' },
                { id: 2, lat: 55.751, lon: 37.614, category: 'hospital', name: { en: 'Emergency Center', ru: 'Центр неотложной помощи' }, address: 'ул. Скорая, 15' }
            ],
            hotel: [
                { id: 3, lat: 55.758, lon: 37.618, category: 'hotel', name: { en: 'Grand Hotel', ru: 'Гранд Отель' }, address: 'ул. Гостиничная, 10' },
                { id: 4, lat: 55.753, lon: 37.622, category: 'hotel', name: { en: 'Travel Inn', ru: 'Тревел Инн' }, address: 'ул. Путешественников, 5' }
            ],
            restaurant: [
                { id: 5, lat: 55.757, lon: 37.620, category: 'restaurant', name: { en: 'Italian Pizza', ru: 'Итальянская Пицца' }, address: 'ул. Итальянская, 7' },
                { id: 6, lat: 55.755, lon: 37.619, category: 'restaurant', name: { en: 'Sushi Bar', ru: 'Суши Бар' }, address: 'ул. Японская, 3' }
            ],
            attraction: [
                { id: 7, lat: 55.754, lon: 37.617, category: 'attraction', name: { en: 'Historic Museum', ru: 'Исторический музей' }, address: 'пл. Музейная, 1' },
                { id: 8, lat: 55.760, lon: 37.625, category: 'attraction', name: { en: 'City Park', ru: 'Городской парк' }, address: 'ул. Парковая, 20' }
            ],
            pharmacy: [
                { id: 9, lat: 55.756, lon: 37.616, category: 'pharmacy', name: { en: '24/7 Pharmacy', ru: 'Круглосуточная аптека' }, address: 'ул. Аптечная, 4' },
                { id: 10, lat: 55.752, lon: 37.621, category: 'pharmacy', name: { en: 'Health Pharmacy', ru: 'Аптека Здоровье' }, address: 'ул. Здоровья, 8' }
            ],
            police: [
                { id: 11, lat: 55.759, lon: 37.615, category: 'police', name: { en: 'Police Station', ru: 'Полицейский участок' }, address: 'ул. Полицейская, 2' }
            ],
            embassy: [
                { id: 12, lat: 55.755, lon: 37.623, category: 'embassy', name: { en: 'US Embassy', ru: 'Посольство США' }, address: 'ул. Дипломатическая, 12' }
            ]
        };
        
        return category === 'all' 
            ? Object.values(sampleData).flat()
            : sampleData[category] || [];
    },
    
    getAll() {
        return Object.values(this.getByCategory('all'));
    }
};