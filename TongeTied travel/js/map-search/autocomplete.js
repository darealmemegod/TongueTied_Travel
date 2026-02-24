window.Autocomplete = {
    debounceTimer: null,
    
    init() {
        const input = document.getElementById('mapSearchInput');
        if (!input) return;
        
        input.addEventListener('input', (e) => {
            this.handleInput(e.target.value);
        });
        
        input.addEventListener('focus', () => {
            this.showHistory();
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.autocomplete-dropdown') && !e.target.closest('.search-input-wrapper')) {
                this.hide();
            }
        });
    },
    
    handleInput(value) {
        clearTimeout(this.debounceTimer);
        
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
        container.innerHTML = history.map(item => `
            <div class="search-result-item" data-search="${item.query}">
                <div class="search-result-title">${item.query}</div>
                <div class="search-result-address">${item.address || ''}</div>
            </div>
        `).join('');
        
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
        resultsList.innerHTML = results.map(result => `
            <div class="search-result-item" data-lat="${result.lat}" data-lon="${result.lon}">
                <div class="search-result-title">${result.name}</div>
                <div class="search-result-address">
                    ${result.address.road ? result.address.road + ', ' : ''}
                    ${result.address.city || ''}
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('#searchResultsList .search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const lat = parseFloat(item.dataset.lat);
                const lon = parseFloat(item.dataset.lon);
                
                window.MapSearchEngine.clearMarkers();
                const marker = L.marker([lat, lon])
                    .addTo(window.MapSearchEngine.markersLayer)
                    .bindPopup(result.name)
                    .openPopup();
                
                window.MapSearchEngine.map.setView([lat, lon], 15);
                window.SearchHistory.add(query, results.find(r => r.lat === lat && r.lon === lon));
                this.hide();
            });
        });
        
        this.show();
    },
    
    show() {
        const dropdown = document.getElementById('autocompleteResults');
        if (dropdown) {
            dropdown.style.display = 'block';
        }
    },
    
    hide() {
        const dropdown = document.getElementById('autocompleteResults');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }
};