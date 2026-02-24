// Main Map Search Module - объединяет все компоненты карты
window.MapSearch = {
    // Основные переменные
    map: null,
    userLocation: null,
    currentLanguage: 'ru',
    markersLayer: null,
    searchHistory: [],
    savedPlaces: [],
    
    // Инициализация
    init() {
        console.log('Initializing Map Search Module...');

            if (this.map) {
                console.warn('Карта уже инициализирована, пропускаем');
                return;
            }
            console.log('Initializing Map Search Module...');
        
        // Получаем текущий язык
        this.currentLanguage = localStorage.getItem('language') || 'ru';
        
        // Инициализируем карту
        this.initMap();
        
        // Инициализируем все модули
        this.initGeocoder();
        this.initSearchEngine();
        this.initAutocomplete();
        this.initSearchHistory();
        this.initSavedPlaces();
        this.initPlaceDetails();
        this.initMapPanel();
        this.initPOIData();
        
        // Загружаем данные
        this.loadData();
        
        // Биндим события
        this.bindEvents();
        
        console.log('Map Search Module initialized successfully');
    },
    
    // Инициализация карты
    initMap() {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error('Map container #map not found');
            return;
        }
        
        // Создаем карту с центром в Москве по умолчанию
        this.map = L.map('map').setView([55.7558, 37.6173], 13);
        
        // Добавляем OpenStreetMap слой
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);
        
        // Создаем слой для маркеров
        this.markersLayer = L.layerGroup().addTo(this.map);
        
        // Добавляем обработчик кликов по карте
        this.map.on('click', (e) => {
            this.onMapClick(e);
        });
        
        // Добавляем обработчик движения карты
        this.map.on('moveend', () => {
            this.updateCoordinates();
        });
        
        console.log('Map initialized');
    },
    
    // Инициализация геокодера
    initGeocoder() {
        window.MapGeocoder = {
            async forward(searchQuery) {
                try {
                    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=10&addressdetails=1&accept-language=${MapSearch.currentLanguage}`;
                    const response = await fetch(url);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const results = await response.json();
                    
                    return results.map(result => ({
                        name: result.display_name,
                        lat: parseFloat(result.lat),
                        lon: parseFloat(result.lon),
                        address: {
                            road: result.address?.road || '',
                            city: result.address?.city || result.address?.town || '',
                            country: result.address?.country || ''
                        },
                        type: result.type,
                        category: this.detectCategory(result),
                        importance: result.importance,
                        osm_id: result.osm_id
                    }));
                } catch (error) {
                    console.error('Geocoding error:', error);
                    MapSearch.showNotification('Ошибка поиска. Проверьте подключение к интернету.', 'error');
                    return [];
                }
            },
            
            async reverse(lat, lon) {
                try {
                    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=${MapSearch.currentLanguage}`;
                    const response = await fetch(url);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    
                    return {
                        name: result.display_name,
                        address: {
                            road: result.address?.road || '',
                            city: result.address?.city || result.address?.town || '',
                            country: result.address?.country || ''
                        },
                        type: result.type
                    };
                } catch (error) {
                    console.error('Reverse geocoding error:', error);
                    return null;
                }
            },
            
            detectCategory(result) {
                const type = result.type;
                const classType = result.class;
                
                if (type === 'hotel' || type === 'hostel' || classType === 'tourism') return 'hotel';
                if (type === 'restaurant' || type === 'cafe' || type === 'fast_food') return 'restaurant';
                if (type === 'hospital' || type === 'clinic') return 'hospital';
                if (type === 'pharmacy') return 'pharmacy';
                if (type === 'police') return 'police';
                if (type === 'attraction' || type === 'museum' || type === 'monument') return 'attraction';
                if (type === 'embassy') return 'embassy';
                
                return 'other';
            }
        };
        
        console.log('Geocoder initialized');
    },
    
    // Инициализация поискового движка
    initSearchEngine() {
        window.MapSearchEngine = {
            map: null,
            markersLayer: null,
            currentCategory: null,
            
            init(mapInstance) {
                this.map = mapInstance;
                this.markersLayer = MapSearch.markersLayer;
                this.bindEvents();
            },
            
            bindEvents() {
                // Основной поиск
                document.getElementById('executeSearch')?.addEventListener('click', () => this.search());
                document.getElementById('mapSearchInput')?.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.search();
                });
                
                // Быстрые категории
                document.querySelectorAll('.quick-category').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const category = e.currentTarget.dataset.category;
                        this.searchByCategory(category);
                    });
                });
                
                // Очистка поиска
                document.getElementById('clearSearch')?.addEventListener('click', () => {
                    this.clearSearch();
                });
                
                // Голосовой поиск
                document.getElementById('voiceSearch')?.addEventListener('click', () => {
                    this.startVoiceSearch();
                });
            },
            
            async search() {
                const input = document.getElementById('mapSearchInput');
                const query = input.value.trim();
                
                if (!query) {
                    MapSearch.showNotification('Введите поисковый запрос', 'warning');
                    return;
                }
                
                // Показываем индикатор загрузки
                const searchBtn = document.getElementById('executeSearch');
                const originalHTML = searchBtn.innerHTML;
                searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                searchBtn.disabled = true;
                
                try {
                    const results = await window.MapGeocoder.forward(query);
                    
                    if (results.length === 0) {
                        MapSearch.showNotification('Ничего не найдено', 'info');
                        return;
                    }
                    
                    this.displayResults(results);
                    
                    // Сохраняем в историю
                    if (results[0]) {
                        window.SearchHistory.add(query, results[0]);
                    }
                    
                    // Обновляем статистику
                    MapSearch.updateStatistics();
                    
                } catch (error) {
                    console.error('Search error:', error);
                } finally {
                    // Восстанавливаем кнопку
                    searchBtn.innerHTML = originalHTML;
                    searchBtn.disabled = false;
                }
            },
            
            async searchByCategory(category) {
                this.currentCategory = category;
                this.clearMarkers();
                
                const center = this.map.getCenter();
                const radius = 5000; // 5 км
                
                // Получаем POI данной категории
                const pois = window.POIData.getByCategory(category);
                
                // Фильтруем по расстоянию
                const filteredPOIs = pois.filter(poi => {
                    const distance = MapSearch.calculateDistance(
                        center.lat, center.lng,
                        poi.lat, poi.lon
                    );
                    return distance <= radius;
                });
                
                this.displayPOIs(filteredPOIs);
                
                // Обновляем статистику
                MapSearch.updateStatistics();
                
                // Показываем уведомление
                const categoryName = MapSearch.getCategoryName(category);
                MapSearch.showNotification(`Найдено ${filteredPOIs.length} ${categoryName}`, 'success');
            },
            
            displayResults(results) {
                this.clearMarkers();
                
                results.forEach(result => {
                    const icon = MapSearch.getIconForPlace(result);
                    const marker = L.marker([result.lat, result.lon], { icon })
                        .addTo(this.markersLayer)
                        .bindPopup(`
                            <div class="popup-content">
                                <strong>${result.name}</strong><br>
                                ${result.address.road ? result.address.road + '<br>' : ''}
                                ${result.address.city || ''}
                                <div class="popup-actions">
                                    <button class="popup-btn save" onclick="window.PlaceDetails.savePlace(${result.lat}, ${result.lon})">
                                        <i class="fas fa-heart"></i>
                                    </button>
                                    <button class="popup-btn route" onclick="window.PlaceDetails.getDirections(${result.lat}, ${result.lon})">
                                        <i class="fas fa-directions"></i>
                                    </button>
                                </div>
                            </div>
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
                    const icon = MapSearch.getIconForCategory(poi.category);
                    const marker = L.marker([poi.lat, poi.lon], { icon })
                        .addTo(this.markersLayer)
                        .bindPopup(`
                            <div class="popup-content">
                                <strong>${poi.name[MapSearch.currentLanguage] || poi.name.en}</strong><br>
                                <em>${MapSearch.getCategoryName(poi.category)}</em>
                                ${poi.address ? '<br>' + poi.address : ''}
                                <div class="popup-actions">
                                    <button class="popup-btn save" onclick="window.SavedPlaces.savePlace(${JSON.stringify(poi).replace(/"/g, '&quot;')})">
                                        <i class="fas fa-heart"></i>
                                    </button>
                                </div>
                            </div>
                        `);
                    
                    marker.on('click', () => {
                        window.PlaceDetails.show(poi);
                    });
                });
            },
            
            clearMarkers() {
                if (this.markersLayer) {
                    this.markersLayer.clearLayers();
                }
            },
            
            clearSearch() {
                const input = document.getElementById('mapSearchInput');
                input.value = '';
                this.clearMarkers();
                window.Autocomplete.hide();
                MapSearch.showNotification('Поиск очищен', 'info');
            },
            
            startVoiceSearch() {
                if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                    MapSearch.showNotification('Голосовой поиск не поддерживается вашим браузером', 'warning');
                    return;
                }
                
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                recognition.lang = MapSearch.currentLanguage === 'ru' ? 'ru-RU' : 'en-US';
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;
                
                recognition.start();
                
                // Показываем индикатор
                const voiceBtn = document.getElementById('voiceSearch');
                voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                voiceBtn.style.color = 'var(--danger)';
                
                recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    document.getElementById('mapSearchInput').value = transcript;
                    this.search();
                };
                
                recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    MapSearch.showNotification('Ошибка распознавания речи', 'error');
                };
                
                recognition.onend = () => {
                    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                    voiceBtn.style.color = '';
                };
            }
        };
        
        // Инициализируем движок с картой
        window.MapSearchEngine.init(this.map);
        
        console.log('Search Engine initialized');
    },
    
    // Инициализация автодополнения
    initAutocomplete() {
        window.Autocomplete = {
            debounceTimer: null,
            currentQuery: '',
            
            init() {
                const input = document.getElementById('mapSearchInput');
                if (!input) return;
                
                input.addEventListener('input', (e) => {
                    this.handleInput(e.target.value);
                });
                
                input.addEventListener('focus', () => {
                    this.showHistory();
                });
                
                input.addEventListener('blur', () => {
                    setTimeout(() => this.hide(), 200);
                });
                
                document.addEventListener('click', (e) => {
                    if (!e.target.closest('.autocomplete-dropdown') && !e.target.closest('.search-input-wrapper')) {
                        this.hide();
                    }
                });
                
                // Очистка всей истории
                document.getElementById('clearAllHistory')?.addEventListener('click', () => {
                    window.SearchHistory.clear();
                    this.showHistory();
                });
            },
            
            handleInput(value) {
                clearTimeout(this.debounceTimer);
                this.currentQuery = value;
                
                if (value.length < 3) {
                    this.showHistory();
                    return;
                }
                
                this.debounceTimer = setTimeout(async () => {
                    const results = await window.MapGeocoder.forward(value);
                    this.showResults(results, value);
                }, 300);
            },
            
            showHistory() {
                const history = window.SearchHistory.get();
                const container = document.getElementById('recentSearches');
                const section = document.getElementById('recentSearchesSection');
                
                if (!history.length) {
                    section.style.display = 'none';
                    return;
                }
                
                section.style.display = 'block';
                container.innerHTML = history.slice(0, 5).map(item => `
                    <div class="search-result-item" data-search="${item.query}">
                        <div class="search-result-title">
                            <i class="fas fa-history"></i>
                            ${item.query}
                        </div>
                        <div class="search-result-address">${item.address || ''}</div>
                        <div class="search-result-time">${MapSearch.formatTimeAgo(item.timestamp)}</div>
                    </div>
                `).join('');
                
                // Добавляем обработчики
                document.querySelectorAll('.search-result-item[data-search]').forEach(item => {
                    item.addEventListener('click', () => {
                        const query = item.dataset.search;
                        document.getElementById('mapSearchInput').value = query;
                        window.MapSearchEngine.search();
                        this.hide();
                    });
                });
                
                this.show();
            },
            
            showResults(results, query) {
                const resultsList = document.getElementById('searchResultsList');
                const section = document.getElementById('searchResultsSection');
                
                if (!results.length) {
                    section.style.display = 'none';
                    return;
                }
                
                section.style.display = 'block';
                resultsList.innerHTML = results.slice(0, 8).map(result => `
                    <div class="search-result-item" data-lat="${result.lat}" data-lon="${result.lon}">
                        <div class="search-result-title">
                            <i class="fas fa-map-marker-alt"></i>
                            ${result.name}
                        </div>
                        <div class="search-result-address">
                            ${result.address.road ? result.address.road + ', ' : ''}
                            ${result.address.city || ''}
                        </div>
                        <div class="search-result-type">${result.type}</div>
                    </div>
                `).join('');
                
                // Добавляем обработчики
                document.querySelectorAll('#searchResultsList .search-result-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const lat = parseFloat(item.dataset.lat);
                        const lon = parseFloat(item.dataset.lon);
                        
                        window.MapSearchEngine.clearMarkers();
                        
                        const result = results.find(r => r.lat === lat && r.lon === lon);
                        if (result) {
                            const icon = MapSearch.getIconForPlace(result);
                            const marker = L.marker([lat, lon], { icon })
                                .addTo(window.MapSearchEngine.markersLayer)
                                .bindPopup(result.name)
                                .openPopup();
                            
                            window.MapSearchEngine.map.setView([lat, lon], 15);
                            window.SearchHistory.add(query, result);
                            
                            // Показываем детали
                            window.PlaceDetails.show(result);
                        }
                        
                        this.hide();
                    });
                });
                
                this.show();
            },
            
            show() {
                const dropdown = document.getElementById('autocompleteResults');
                if (dropdown) {
                    dropdown.classList.add('active');
                }
            },
            
            hide() {
                const dropdown = document.getElementById('autocompleteResults');
                if (dropdown) {
                    dropdown.classList.remove('active');
                }
            }
        };
        
        window.Autocomplete.init();
        console.log('Autocomplete initialized');
    },
    
    // Инициализация истории поиска
    initSearchHistory() {
        window.SearchHistory = {
            KEY: 'map_search_history',
            MAX_ITEMS: 15,
            
            add(query, result) {
                const history = this.get();
                const newItem = {
                    id: Date.now(),
                    query,
                    address: result?.address?.city || result?.address?.country || '',
                    lat: result?.lat,
                    lon: result?.lon,
                    category: result?.category,
                    timestamp: Date.now()
                };
                
                // Удаляем дубликаты
                const filtered = history.filter(item => item.query.toLowerCase() !== query.toLowerCase());
                filtered.unshift(newItem);
                
                // Ограничиваем размер истории
                if (filtered.length > this.MAX_ITEMS) {
                    filtered.length = this.MAX_ITEMS;
                }
                
                localStorage.setItem(this.KEY, JSON.stringify(filtered));
                
                // Обновляем UI если открыто автодополнение
                if (document.getElementById('autocompleteResults')?.classList.contains('active')) {
                    window.Autocomplete.showHistory();
                }
            },
            
            get() {
                try {
                    const data = localStorage.getItem(this.KEY);
                    return data ? JSON.parse(data) : [];
                } catch (e) {
                    console.error('Error reading search history:', e);
                    return [];
                }
            },
            
            clear() {
                localStorage.removeItem(this.KEY);
                MapSearch.showNotification('История поиска очищена', 'success');
            },
            
            removeItem(id) {
                const history = this.get();
                const filtered = history.filter(item => item.id !== id);
                localStorage.setItem(this.KEY, JSON.stringify(filtered));
            }
        };
        
        console.log('Search History initialized');
    },
    
    // Инициализация сохраненных мест
    initSavedPlaces() {
        window.SavedPlaces = {
            KEY: 'saved_places',
            
            save(place) {
                try {
                    const saved = this.getAll();
                    
                    // Проверяем, не сохранено ли уже это место
                    const exists = saved.some(p => 
                        p.lat === place.lat && p.lon === place.lon
                    );
                    
                    if (exists) {
                        MapSearch.showNotification('Место уже сохранено', 'info');
                        return false;
                    }
                    
                    // Добавляем ID и timestamp
                    const placeWithMeta = {
                        ...place,
                        id: `place_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        savedAt: Date.now()
                    };
                    
                    saved.push(placeWithMeta);
                    localStorage.setItem(this.KEY, JSON.stringify(saved));
                    
                    MapSearch.showNotification('Место сохранено в избранное', 'success');
                    this.updateUI();
                    return true;
                    
                } catch (error) {
                    console.error('Error saving place:', error);
                    MapSearch.showNotification('Ошибка при сохранении', 'error');
                    return false;
                }
            },
            
            remove(placeId) {
                try {
                    const saved = this.getAll();
                    const filtered = saved.filter(p => p.id !== placeId);
                    localStorage.setItem(this.KEY, JSON.stringify(filtered));
                    
                    MapSearch.showNotification('Место удалено из избранного', 'info');
                    this.updateUI();
                    
                } catch (error) {
                    console.error('Error removing place:', error);
                    MapSearch.showNotification('Ошибка при удалении', 'error');
                }
            },
            
            getAll() {
                try {
                    const data = localStorage.getItem(this.KEY);
                    return data ? JSON.parse(data) : [];
                } catch (e) {
                    console.error('Error reading saved places:', e);
                    return [];
                }
            },
            
            updateUI() {
                // Обновляем список в сайдбаре
                const container = document.getElementById('savedPlacesList');
                if (!container) return;
                
                const saved = this.getAll();
                const currentLang = MapSearch.currentLanguage;
                
                if (!saved.length) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-heart"></i>
                            <p>Нет сохранённых мест</p>
                            <small>Сохраняйте интересные места, кликая на сердечко</small>
                        </div>
                    `;
                    return;
                }
                
                container.innerHTML = saved.map(place => `
                    <div class="saved-place-item" data-id="${place.id}">
                        <div class="place-info">
                            <h4>${place.name?.[currentLang] || place.name?.en || place.name || 'Неизвестное место'}</h4>
                            <p class="place-type">
                                <span class="category-badge ${place.category || 'other'}">
                                    ${MapSearch.getCategoryName(place.category || 'other')}
                                </span>
                            </p>
                            <p class="place-address">${place.address || ''}</p>
                            <p class="place-time">${MapSearch.formatTimeAgo(place.savedAt)}</p>
                        </div>
                        <button class="remove-saved" title="Удалить">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('');
                
                // Добавляем обработчики удаления
                container.querySelectorAll('.remove-saved').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const item = e.target.closest('.saved-place-item');
                        const placeId = item.dataset.id;
                        this.remove(placeId);
                    });
                });
                
                // Добавляем обработчики клика по месту
                container.querySelectorAll('.saved-place-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const placeId = item.dataset.id;
                        const place = saved.find(p => p.id === placeId);
                        if (place) {
                            window.PlaceDetails.show(place);
                            MapSearch.map.setView([place.lat, place.lon], 15);
                        }
                    });
                });
            },
            
            // Метод для кнопки "Сохранить"
            savePlace(place) {
                return this.save(place);
            }
        };
        
        console.log('Saved Places initialized');
    },
    
    // Инициализация деталей места
    initPlaceDetails() {
        window.PlaceDetails = {
            currentPlace: null,
            
            show(place) {
                this.currentPlace = place;
                const userLocation = MapSearch.userLocation;
                
                // Рассчитываем расстояние если есть местоположение пользователя
                let distance = null;
                if (userLocation && place.lat && place.lon) {
                    distance = MapSearch.calculateDistance(
                        userLocation.lat, userLocation.lng,
                        place.lat, place.lon
                    ).toFixed(1);
                }
                
                // Создаем HTML для деталей
                const detailsHTML = `
                    <div class="place-details-content">
                        <h3>${place.name?.[MapSearch.currentLanguage] || place.name?.en || place.name || 'Неизвестное место'}</h3>
                        <div class="place-meta">
                            ${place.category ? `
                                <span class="place-category ${place.category}">
                                    <i class="fas fa-${MapSearch.getCategoryIcon(place.category)}"></i>
                                    ${MapSearch.getCategoryName(place.category)}
                                </span>
                            ` : ''}
                            ${distance ? `
                                <span class="place-distance">
                                    <i class="fas fa-walking"></i>
                                    ${distance} км от вас
                                </span>
                            ` : ''}
                        </div>
                        <div class="place-address">
                            <i class="fas fa-map-marker-alt"></i>
                            ${place.address || place.address?.city || 'Адрес не указан'}
                        </div>
                        <div class="place-description">
                            ${place.description || ''}
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
                
                // Показываем в сайдбаре основной карты
                const sidebar = document.getElementById('mapSidebar');
                if (sidebar) {
                    sidebar.innerHTML = detailsHTML;
                    sidebar.style.display = 'block';
                    this.bindEvents(place);
                }
                
                // Также обновляем панель деталей в расширенной панели карты
                const panelDetails = document.getElementById('panelPlaceDetails');
                if (panelDetails) {
                    panelDetails.innerHTML = detailsHTML;
                    panelDetails.style.display = 'block';
                    this.bindEvents(place);
                }
            },
            
            bindEvents(place) {
                // Кнопка сохранения
                document.getElementById('savePlaceBtn')?.addEventListener('click', () => {
                    window.SavedPlaces.save(place);
                });
                
                // Кнопка маршрута
                document.getElementById('getDirectionsBtn')?.addEventListener('click', () => {
                    this.getDirections(place);
                });
            },
            
            getDirections(place) {
                if (!place.lat || !place.lon) {
                    MapSearch.showNotification('Не удалось получить координаты места', 'error');
                    return;
                }
                
                // Открываем маршрут в OpenStreetMap
                const url = `https://www.openstreetmap.org/directions?from=&to=${place.lat},${place.lon}`;
                window.open(url, '_blank');
            },
            
            savePlace(lat, lon) {
                // Этот метод вызывается из попапа маркера
                const place = {
                    lat: lat,
                    lon: lon,
                    name: { [MapSearch.currentLanguage]: 'Выбранное место' },
                    address: 'Координаты: ' + lat + ', ' + lon
                };
                window.SavedPlaces.save(place);
            }
        };
        
        console.log('Place Details initialized');
    },
    
    // Инициализация панели карты
    initMapPanel() {
        window.MapPanel = {
            isOpen: false,
            panelMap: null,
            panelMarkersLayer: null,
            
            init() {
                this.bindEvents();
                
                // Инициализируем карту в панели при открытии
                document.getElementById('openMapPanel')?.addEventListener('click', () => {
                    this.open();
                    setTimeout(() => {
                        this.initPanelMap();
                    }, 100);
                });
                
                console.log('Map Panel initialized');
            },
            
            bindEvents() {
                // Закрытие панели
                document.getElementById('closeMapPanel')?.addEventListener('click', () => {
                    this.close();
                });
                
                // Закрытие по Esc
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && this.isOpen) {
                        this.close();
                    }
                });
                
                // Клик по фону для закрытия
                document.getElementById('mapPanel')?.addEventListener('click', (e) => {
                    if (e.target.id === 'mapPanel') {
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
                    document.body.style.overflow = 'hidden';
                    
                    // Загружаем сохраненные места
                    window.SavedPlaces.updateUI();
                    
                }, 10);
            },
            
            close() {
                const panel = document.getElementById('mapPanel');
                if (!panel) return;
                
                panel.classList.remove('active');
                setTimeout(() => {
                    panel.style.display = 'none';
                    this.isOpen = false;
                    document.body.style.overflow = '';
                }, 400);
            },
            
            initPanelMap() {
                const mapContainer = document.getElementById('panelMap');
                if (!mapContainer) return;
                
                // Если карта уже инициализирована, просто обновляем размер
                if (this.panelMap) {
                    this.panelMap.invalidateSize();
                    return;
                }
                
                // Создаем новую карту
                this.panelMap = L.map('panelMap').setView([55.7558, 37.6173], 13);
                
                // Добавляем слой OSM
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19
                }).addTo(this.panelMap);
                
                // Создаем слой для маркеров
                this.panelMarkersLayer = L.layerGroup().addTo(this.panelMap);
                
                // Добавляем обработчики
                this.panelMap.on('click', (e) => {
                    MapSearch.onMapClick(e, this.panelMap);
                });
                
                // Загружаем сохраненные места на карту
                this.loadSavedPlacesOnMap();
                
                // Инициализируем контролы
                this.initPanelControls();
            },
            
            initPanelControls() {
                // Кнопки зума
                document.getElementById('panelZoomIn')?.addEventListener('click', () => {
                    this.panelMap.zoomIn();
                });
                
                document.getElementById('panelZoomOut')?.addEventListener('click', () => {
                    this.panelMap.zoomOut();
                });
                
                // Кнопка определения местоположения
                document.getElementById('panelLocateMe')?.addEventListener('click', () => {
                    MapSearch.locateUser(this.panelMap);
                });
            },
            
            loadSavedPlacesOnMap() {
                const savedPlaces = window.SavedPlaces.getAll();
                
                savedPlaces.forEach(place => {
                    if (place.lat && place.lon) {
                        const icon = MapSearch.getIconForCategory(place.category || 'other');
                        const marker = L.marker([place.lat, place.lon], { icon })
                            .addTo(this.panelMarkersLayer)
                            .bindPopup(`
                                <div class="popup-content">
                                    <strong>${place.name?.[MapSearch.currentLanguage] || place.name?.en || place.name}</strong><br>
                                    ${place.address || ''}
                                </div>
                            `);
                        
                        marker.on('click', () => {
                            window.PlaceDetails.show(place);
                        });
                    }
                });
            }
        };
        
        window.MapPanel.init();
    },
    
    // Инициализация данных POI
    initPOIData() {
        window.POIData = {
            categories: ['hospital', 'hotel', 'restaurant', 'attraction', 'pharmacy', 'police', 'embassy'],
            
            getByCategory(category) {
                // Примерные данные - в реальном приложении можно заменить на API
                const sampleData = {
                    hospital: [
                        { 
                            id: 1, 
                            lat: 55.761, 
                            lon: 37.624, 
                            category: 'hospital', 
                            name: { 
                                en: 'City Hospital', 
                                ru: 'Городская больница',
                                es: 'Hospital de la Ciudad'
                            }, 
                            address: 'ул. Лечебная, 1, Москва',
                            description: 'Крупная городская больница с отделением скорой помощи'
                        },
                        { 
                            id: 2, 
                            lat: 55.751, 
                            lon: 37.614, 
                            category: 'hospital', 
                            name: { 
                                en: 'Emergency Center', 
                                ru: 'Центр неотложной помощи',
                                es: 'Centro de Emergencias'
                            }, 
                            address: 'ул. Скорая, 15, Москва',
                            description: 'Специализированный центр неотложной медицинской помощи'
                        }
                    ],
                    hotel: [
                        { 
                            id: 3, 
                            lat: 55.758, 
                            lon: 37.618, 
                            category: 'hotel', 
                            name: { 
                                en: 'Grand Hotel', 
                                ru: 'Гранд Отель',
                                es: 'Gran Hotel'
                            }, 
                            address: 'ул. Гостиничная, 10, Москва',
                            description: 'Пятизвездочный отель в центре города'
                        },
                        { 
                            id: 4, 
                            lat: 55.753, 
                            lon: 37.622, 
                            category: 'hotel', 
                            name: { 
                                en: 'Travel Inn', 
                                ru: 'Тревел Инн',
                                es: 'Posada del Viajero'
                            }, 
                            address: 'ул. Путешественников, 5, Москва',
                            description: 'Бюджетный отель для путешественников'
                        }
                    ],
                    restaurant: [
                        { 
                            id: 5, 
                            lat: 55.757, 
                            lon: 37.620, 
                            category: 'restaurant', 
                            name: { 
                                en: 'Italian Pizza', 
                                ru: 'Итальянская Пицца',
                                es: 'Pizza Italiana'
                            }, 
                            address: 'ул. Итальянская, 7, Москва',
                            description: 'Аутентичная итальянская пиццерия'
                        },
                        { 
                            id: 6, 
                            lat: 55.755, 
                            lon: 37.619, 
                            category: 'restaurant', 
                            name: { 
                                en: 'Sushi Bar', 
                                ru: 'Суши Бар',
                                es: 'Bar de Sushi'
                            }, 
                            address: 'ул. Японская, 3, Москва',
                            description: 'Японский ресторан с свежими суши'
                        }
                    ],
                    attraction: [
                        { 
                            id: 7, 
                            lat: 55.754, 
                            lon: 37.617, 
                            category: 'attraction', 
                            name: { 
                                en: 'Historic Museum', 
                                ru: 'Исторический музей',
                                es: 'Museo Histórico'
                            }, 
                            address: 'пл. Музейная, 1, Москва',
                            description: 'Крупнейший исторический музей города'
                        },
                        { 
                            id: 8, 
                            lat: 55.760, 
                            lon: 37.625, 
                            category: 'attraction', 
                            name: { 
                                en: 'City Park', 
                                ru: 'Городской парк',
                                es: 'Parque de la Ciudad'
                            }, 
                            address: 'ул. Парковая, 20, Москва',
                            description: 'Центральный парк для отдыха и прогулок'
                        }
                    ],
                    pharmacy: [
                        { 
                            id: 9, 
                            lat: 55.756, 
                            lon: 37.616, 
                            category: 'pharmacy', 
                            name: { 
                                en: '24/7 Pharmacy', 
                                ru: 'Круглосуточная аптека',
                                es: 'Farmacia 24/7'
                            }, 
                            address: 'ул. Аптечная, 4, Москва',
                            description: 'Круглосуточная аптека с широким ассортиментом'
                        },
                        { 
                            id: 10, 
                            lat: 55.752, 
                            lon: 37.621, 
                            category: 'pharmacy', 
                            name: { 
                                en: 'Health Pharmacy', 
                                ru: 'Аптека Здоровье',
                                es: 'Farmacia Salud'
                            }, 
                            address: 'ул. Здоровья, 8, Москва',
                            description: 'Сеть аптек с лекарствами и средствами ухода'
                        }
                    ],
                    police: [
                        { 
                            id: 11, 
                            lat: 55.759, 
                            lon: 37.615, 
                            category: 'police', 
                            name: { 
                                en: 'Police Station', 
                                ru: 'Полицейский участок',
                                es: 'Comisaría de Policía'
                            }, 
                            address: 'ул. Полицейская, 2, Москва',
                            description: 'Центральный полицейский участок'
                        }
                    ],
                    embassy: [
                        { 
                            id: 12, 
                            lat: 55.755, 
                            lon: 37.623, 
                            category: 'embassy', 
                            name: { 
                                en: 'US Embassy', 
                                ru: 'Посольство США',
                                es: 'Embajada de EE.UU.'
                            }, 
                            address: 'ул. Дипломатическая, 12, Москва',
                            description: 'Посольство Соединенных Штатов Америки'
                        }
                    ]
                };
                
                return category === 'all' 
                    ? Object.values(sampleData).flat()
                    : sampleData[category] || [];
            },
            
            getAll() {
                return this.getByCategory('all');
            }
        };
        
        console.log('POI Data initialized');
    },
    
    // Вспомогательные методы
    loadData() {
        // Загружаем историю поиска
        this.searchHistory = window.SearchHistory.get();
        
        // Загружаем сохраненные места
        this.savedPlaces = window.SavedPlaces.getAll();
        window.SavedPlaces.updateUI();
        
        // Обновляем статистику
        this.updateStatistics();
        
        console.log('Data loaded:', {
            historyItems: this.searchHistory.length,
            savedPlaces: this.savedPlaces.length
        });
    },
    
    bindEvents() {
        // Определение местоположения
        document.getElementById('locateMe')?.addEventListener('click', () => {
            this.locateUser();
        });
        
        // Зум карты
        document.getElementById('zoomIn')?.addEventListener('click', () => {
            this.map.zoomIn();
        });
        
        document.getElementById('zoomOut')?.addEventListener('click', () => {
            this.map.zoomOut();
        });
        
        // Переключение слоев карты
        document.getElementById('toggleLayers')?.addEventListener('click', () => {
            this.toggleMapLayers();
        });
        
        // Открытие панели карты
        document.querySelectorAll('.open-panel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.MapPanel.open();
            });
        });
        
        // Обновление языка
        document.addEventListener('languageChanged', (e) => {
            this.currentLanguage = e.detail.language;
            window.SavedPlaces.updateUI();
            this.updateStatistics();
        });
        
        console.log('Events bound');
    },
    
    // Определение местоположения пользователя
    locateUser(targetMap = null) {
        const map = targetMap || this.map;
        
        if (!navigator.geolocation) {
            this.showNotification('Геолокация не поддерживается вашим браузером', 'warning');
            return;
        }
        
        // Показываем индикатор загрузки
        const locateBtn = targetMap ? document.getElementById('panelLocateMe') : document.getElementById('locateMe');
        const originalHTML = locateBtn?.innerHTML;
        if (locateBtn) {
            locateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            locateBtn.disabled = true;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Центрируем карту
                map.setView([this.userLocation.lat, this.userLocation.lng], 15);
                
                // Добавляем маркер
                const userIcon = L.divIcon({
                    html: '<div class="user-location-marker"><i class="fas fa-circle"></i></div>',
                    className: 'user-location',
                    iconSize: [20, 20]
                });
                
                L.marker([this.userLocation.lat, this.userLocation.lng], { icon: userIcon })
                    .addTo(map)
                    .bindPopup('Вы здесь')
                    .openPopup();
                
                // Обновляем статистику
                this.updateStatistics();
                
                this.showNotification('Местоположение определено', 'success');
                
            },
            (error) => {
                console.error('Geolocation error:', error);
                let message = 'Не удалось определить местоположение';
                if (error.code === error.PERMISSION_DENIED) {
                    message = 'Разрешите доступ к геолокации в настройках браузера';
                } else if (error.code === error.TIMEOUT) {
                    message = 'Таймаут при определении местоположения';
                }
                this.showNotification(message, 'error');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        ).finally(() => {
            // Восстанавливаем кнопку
            if (locateBtn) {
                locateBtn.innerHTML = originalHTML;
                locateBtn.disabled = false;
            }
        });
    },
    
    // Обработчик клика по карте
    onMapClick(e, targetMap = null) {
        const map = targetMap || this.map;
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        // Добавляем временный маркер
        const tempMarker = L.marker([lat, lng], {
            icon: L.divIcon({
                html: '<div class="temp-marker"><i class="fas fa-map-pin"></i></div>',
                className: 'temp-marker-icon',
                iconSize: [30, 30]
            })
        }).addTo(map);
        
        // Открываем попап с действиями
        tempMarker.bindPopup(`
            <div class="map-click-popup">
                <h4>Координаты:</h4>
                <p>${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                <div class="popup-actions">
                    <button onclick="MapSearch.saveLocation(${lat}, ${lng})">
                        <i class="fas fa-heart"></i> Сохранить
                    </button>
                    <button onclick="MapSearch.getDirectionsTo(${lat}, ${lng})">
                        <i class="fas fa-directions"></i> Маршрут
                    </button>
                </div>
            </div>
        `).openPopup();
        
        // Удаляем маркер через 30 секунд
        setTimeout(() => {
            if (tempMarker && map.hasLayer(tempMarker)) {
                map.removeLayer(tempMarker);
            }
        }, 30000);
    },
    
    // Сохранение локации
    saveLocation(lat, lng) {
        const place = {
            lat: lat,
            lon: lng,
            name: { [this.currentLanguage]: 'Отмеченное место' },
            address: `Координаты: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            category: 'other'
        };
        
        window.SavedPlaces.save(place);
    },
    
    // Маршрут к координатам
    getDirectionsTo(lat, lng) {
        const url = `https://www.openstreetmap.org/directions?from=&to=${lat},${lng}`;
        window.open(url, '_blank');
    },
    
    // Переключение слоев карты
    toggleMapLayers() {
        // В простой версии просто меняем стиль карты
        const currentLayer = this.map._layers[Object.keys(this.map._layers)[0]];
        if (currentLayer && currentLayer._url && currentLayer._url.includes('openstreetmap')) {
            // Переключаем на другой стиль (пример)
            this.map.eachLayer((layer) => {
                if (layer._url) {
                    this.map.removeLayer(layer);
                }
            });
            
            L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenTopoMap contributors',
                maxZoom: 17
            }).addTo(this.map);
            
            this.showNotification('Переключено на топографическую карту', 'success');
        } else {
            // Возвращаем к стандартному OSM
            this.map.eachLayer((layer) => {
                if (layer._url) {
                    this.map.removeLayer(layer);
                }
            });
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(this.map);
            
            this.showNotification('Переключено на стандартную карту', 'success');
        }
    },
    
    // Обновление координат в интерфейсе
    updateCoordinates() {
        const center = this.map.getCenter();
        const coordsElement = document.getElementById('panelCoordinates');
        
        if (coordsElement) {
            coordsElement.innerHTML = `
                <i class="fas fa-map-marker-alt"></i>
                <span>${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}</span>
            `;
        }
    },
    
    // Обновление статистики
    updateStatistics() {
        const pointsCount = this.markersLayer ? this.markersLayer.getLayers().length : 0;
        const pointsElement = document.getElementById('pointsCount');
        
        if (pointsElement) {
            pointsElement.textContent = pointsCount;
        }
        
        // Обновляем расстояние до выбранного места
        const distanceElement = document.getElementById('distanceToPlace');
        if (distanceElement && this.userLocation && window.PlaceDetails.currentPlace) {
            const place = window.PlaceDetails.currentPlace;
            const distance = this.calculateDistance(
                this.userLocation.lat, this.userLocation.lng,
                place.lat, place.lon
            ).toFixed(1);
            distanceElement.textContent = `${distance} км`;
        }
    },
    
    // Вспомогательные методы
    
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Радиус Земли в км
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    },
    
    getIconForCategory(category) {
        const colors = {
            hospital: 'var(--hospital)',
            hotel: 'var(--hotel)',
            restaurant: 'var(--restaurant)',
            attraction: 'var(--attraction)',
            pharmacy: 'var(--pharmacy)',
            police: 'var(--police)',
            embassy: 'var(--embassy)',
            other: '#666'
        };
        
        const icons = {
            hospital: 'fa-hospital',
            hotel: 'fa-bed',
            restaurant: 'fa-utensils',
            attraction: 'fa-mountain',
            pharmacy: 'fa-pills',
            police: 'fa-shield-alt',
            embassy: 'fa-flag',
            other: 'fa-map-marker-alt'
        };
        
        return L.divIcon({
            html: `
                <div class="custom-marker" style="
                    background: ${colors[category] || colors.other};
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: 3px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 14px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">
                    <i class="fas ${icons[category] || icons.other}"></i>
                </div>
            `,
            className: 'custom-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });
    },
    
    getIconForPlace(place) {
        return this.getIconForCategory(place.category || 'other');
    },
    
    getCategoryIcon(category) {
        const icons = {
            hospital: 'hospital',
            hotel: 'bed',
            restaurant: 'utensils',
            attraction: 'mountain',
            pharmacy: 'pills',
            police: 'shield-alt',
            embassy: 'flag',
            other: 'map-marker-alt'
        };
        return icons[category] || 'map-marker-alt';
    },
    
    getCategoryName(category) {
        const names = {
            hospital: { ru: 'Больница', en: 'Hospital', es: 'Hospital' },
            hotel: { ru: 'Отель', en: 'Hotel', es: 'Hotel' },
            restaurant: { ru: 'Ресторан', en: 'Restaurant', es: 'Restaurante' },
            attraction: { ru: 'Достопримечательность', en: 'Attraction', es: 'Atracción' },
            pharmacy: { ru: 'Аптека', en: 'Pharmacy', es: 'Farmacia' },
            police: { ru: 'Полиция', en: 'Police', es: 'Policía' },
            embassy: { ru: 'Посольство', en: 'Embassy', es: 'Embajada' },
            other: { ru: 'Другое', en: 'Other', es: 'Otro' }
        };
        
        const categoryNames = names[category] || names.other;
        return categoryNames[this.currentLanguage] || categoryNames.en;
    },
    
    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'только что';
        if (minutes < 60) return `${minutes} мин назад`;
        if (hours < 24) return `${hours} ч назад`;
        if (days === 1) return 'вчера';
        if (days < 7) return `${days} дн назад`;
        
        return new Date(timestamp).toLocaleDateString(this.currentLanguage);
    },
    
    showNotification(message, type = 'info') {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Добавляем стили
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            padding: 12px 16px;
            box-shadow: var(--shadow-xl);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideInRight 0.3s ease-out;
            max-width: 350px;
            border-left: 4px solid ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : type === 'warning' ? 'var(--warning)' : 'var(--info)'};
        `;
        
        document.body.appendChild(notification);
        
        // Удаляем через 5 секунд
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
        
        // Добавляем стили для анимации если их нет
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
};