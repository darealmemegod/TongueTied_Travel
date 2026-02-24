window.SearchHistory = {
    KEY: 'map_search_history',
    MAX_ITEMS: 10,
    
    add(query, result) {
        const history = this.get();
        const newItem = {
            query,
            address: result?.address?.city || result?.address?.country || '',
            lat: result?.lat,
            lon: result?.lon,
            timestamp: Date.now()
        };
        
        const filtered = history.filter(item => item.query.toLowerCase() !== query.toLowerCase());
        filtered.unshift(newItem);
        
        if (filtered.length > this.MAX_ITEMS) {
            filtered.pop();
        }
        
        localStorage.setItem(this.KEY, JSON.stringify(filtered));
    },
    
    get() {
        const data = localStorage.getItem(this.KEY);
        return data ? JSON.parse(data) : [];
    },
    
    clear() {
        localStorage.removeItem(this.KEY);
        const container = document.getElementById('recentSearches');
        if (container) {
            container.innerHTML = '';
        }
    }
};