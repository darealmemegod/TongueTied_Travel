window.MapPanel = {
    map: null,
    userLocation: null,
    isOpen: false,
    
    init() {
        this.bindEvents();
        
        document.addEventListener('DOMContentLoaded', () => {
            this.initMap();
        });
    },
    
    initMap() {
        const mapContainer = document.getElementById('panelMap');
        if (!mapContainer) return;
        
        this.map = L.map('panelMap').setView([55.7558, 37.6173], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);
        
        window.MapSearchEngine.init(this.map);
        this.addUserLocationControl();
        this.loadSavedPlaces();
    },
    
    bindEvents() {
        document.getElementById('openMapPanel')?.addEventListener('click', () => {
            this.open();
        });
        
        document.getElementById('closeMapPanel')?.addEventListener('click', () => {
            this.close();
        });
        
        document.querySelectorAll('.map-open-btn').forEach(btn => {
            btn.addEventListener('click', () => this.open());
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    },
    
    open() {
        const panel = document.getElementById('mapPanel');
        if (!panel) return;
        
        panel.style.display = 'block';
        setTimeout(() => {
            panel.classList.add('active');
            this.isOpen = true;
            if (this.map) {
                this.map.invalidateSize();
            }
        }, 10);
    },
    
    close() {
        const panel = document.getElementById('mapPanel');
        if (!panel) return;
        
        panel.classList.remove('active');
        setTimeout(() => {
            panel.style.display = 'none';
            this.isOpen = false;
        }, 400);
    },
    
    addUserLocationControl() {
        const locateBtn = document.getElementById('panelLocateMe') || document.getElementById('locateMe');
        if (locateBtn) {
            locateBtn.addEventListener('click', () => {
                this.locateUser();
            });
        }
    },
    
    locateUser() {
        if (!navigator.geolocation) {
            alert('Геолокация не поддерживается вашим браузером');
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                this.map.setView([this.userLocation.lat, this.userLocation.lng], 15);
                
                L.marker([this.userLocation.lat, this.userLocation.lng])
                    .addTo(this.map)
                    .bindPopup('Вы здесь')
                    .openPopup();
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Не удалось определить местоположение');
            }
        );
    },
    
    loadSavedPlaces() {
        window.SavedPlaces.updateUI();
    }
};