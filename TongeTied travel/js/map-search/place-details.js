window.PlaceDetails = {
    currentPlace: null,
    
    show(place) {
        this.currentPlace = place;
        const currentLang = localStorage.getItem('language') || 'ru';
        const userLocation = window.MapPanel.userLocation;
        
        const distance = userLocation ? 
            window.MapSearchEngine.calculateDistance(
                userLocation.lat, userLocation.lng,
                place.lat, place.lon
            ).toFixed(1) : null;
        
        const detailsHTML = `
            <div class="place-details-content">
                <h3>${place.name[currentLang] || place.name.en || place.name}</h3>
                <div class="place-meta">
                    <span class="place-category ${place.category}">
                        <i class="fas fa-${this.getCategoryIcon(place.category)}"></i>
                        ${window.translations[`category_${place.category}`] || place.category}
                    </span>
                    ${distance ? `<span class="place-distance"><i class="fas fa-walking"></i> ${distance} км</span>` : ''}
                </div>
                <div class="place-address">
                    <i class="fas fa-map-marker-alt"></i>
                    ${place.address || place.address?.city || ''}
                </div>
                <div class="place-actions">
                    <button class="btn-save" id="savePlaceBtn">
                        <i class="fas fa-heart"></i>
                        Сохранить
                    </button>
                    <button class="btn-directions" id="getDirectionsBtn">
                        <i class="fas fa-directions"></i>
                        Маршрут
                    </button>
                </div>
            </div>
        `;
        
        const container = document.getElementById('mapSidebar') || document.getElementById('panelPlaceDetails');
        if (container) {
            container.innerHTML = detailsHTML;
            container.style.display = 'block';
            
            this.bindEvents(place);
        }
    },
    
    getCategoryIcon(category) {
        const icons = {
            hospital: 'hospital',
            hotel: 'bed',
            restaurant: 'utensils',
            attraction: 'mountain',
            pharmacy: 'pills',
            police: 'shield-alt',
            embassy: 'flag'
        };
        return icons[category] || 'map-marker';
    },
    
    bindEvents(place) {
        document.getElementById('savePlaceBtn')?.addEventListener('click', () => {
            window.SavedPlaces.save({
                ...place,
                id: `${place.lat}-${place.lon}-${Date.now()}`
            });
        });
        
        document.getElementById('getDirectionsBtn')?.addEventListener('click', () => {
            this.showDirections(place);
        });
    },
    
    showDirections(place) {
        const url = `https://www.openstreetmap.org/directions?from=&to=${place.lat},${place.lon}`;
        window.open(url, '_blank');
    }
};