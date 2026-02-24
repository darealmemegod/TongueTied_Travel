window.MapSearchEngine = {
    map: null,
    markersLayer: null,
    currentCategory: null,
    
    init(mapInstance) {
        this.map = mapInstance;
        this.markersLayer = L.layerGroup().addTo(this.map);
        this.bindEvents();
    },
    
    bindEvents() {
        document.getElementById('executeSearch')?.addEventListener('click', () => this.search());
        document.getElementById('mapSearchInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.search();
        });
        
        document.querySelectorAll('.quick-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.searchByCategory(category);
            });
        });
        
        document.getElementById('clearSearch')?.addEventListener('click', () => {
            this.clearSearch();
        });
    },
    
    async search() {
        const input = document.getElementById('mapSearchInput');
        const query = input.value.trim();
        if (!query) return;
        
        const results = await window.MapGeocoder.forward(query);
        this.displayResults(results);
        window.SearchHistory.add(query, results[0]);
    },
    
    async searchByCategory(category) {
        this.currentCategory = category;
        this.clearMarkers();
        
        const center = this.map.getCenter();
        const radius = 5000;
        
        const pois = window.POIData.getByCategory(category);
        const filteredPOIs = pois.filter(poi => {
            const distance = this.calculateDistance(
                center.lat, center.lng,
                poi.lat, poi.lon
            );
            return distance <= radius;
        });
        
        this.displayPOIs(filteredPOIs);
    },
    
    displayResults(results) {
        this.clearMarkers();
        
        results.forEach(result => {
            const marker = L.marker([result.lat, result.lon])
                .addTo(this.markersLayer)
                .bindPopup(`
                    <strong>${result.name}</strong><br>
                    ${result.address.road ? result.address.road + '<br>' : ''}
                    ${result.address.city || ''}
                `);
            
            marker.on('click', () => {
                window.PlaceDetails.show(result);
            });
        });
        
        if (results.length > 0) {
            const firstResult = results[0];
            this.map.setView([firstResult.lat, firstResult.lon], 15);
        }
    },
    
    displayPOIs(pois) {
        pois.forEach(poi => {
            const icon = this.getIconForCategory(poi.category);
            const marker = L.marker([poi.lat, poi.lon], { icon })
                .addTo(this.markersLayer)
                .bindPopup(`
                    <strong>${poi.name[currentLang] || poi.name.en}</strong><br>
                    <em>${window.translations[`category_${poi.category}`] || poi.category}</em>
                `);
            
            marker.on('click', () => {
                window.PlaceDetails.show(poi);
            });
        });
    },
    
    getIconForCategory(category) {
        const colors = {
            hospital: '#dc2626',
            hotel: '#2563eb',
            restaurant: '#059669',
            attraction: '#d97706',
            pharmacy: '#7c3aed',
            police: '#4b5563',
            embassy: '#0284c7'
        };
        
        return L.divIcon({
            html: `<div style="
                background: ${colors[category] || '#666'};
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 2px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 12px;
            ">${this.getCategoryIcon(category)}</div>`,
            className: 'custom-marker',
            iconSize: [24, 24]
        });
    },
    
    getCategoryIcon(category) {
        const icons = {
            hospital: '🏥',
            hotel: '🏨',
            restaurant: '🍴',
            attraction: '🏛️',
            pharmacy: '💊',
            police: '👮',
            embassy: '🏢'
        };
        return icons[category] || '📍';
    },
    
    clearMarkers() {
        if (this.markersLayer) {
            this.markersLayer.clearLayers();
        }
    },
    
    clearSearch() {
        document.getElementById('mapSearchInput').value = '';
        this.clearMarkers();
        window.Autocomplete.hide();
    },
    
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }
};