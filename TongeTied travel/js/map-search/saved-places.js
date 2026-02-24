window.SavedPlaces = {
    KEY: 'saved_places',
    
    save(place) {
        const saved = this.getAll();
        
        if (saved.some(p => p.id === place.id)) {
            return false;
        }
        
        saved.push({
            ...place,
            savedAt: Date.now()
        });
        
        localStorage.setItem(this.KEY, JSON.stringify(saved));
        this.updateUI();
        return true;
    },
    
    remove(placeId) {
        const saved = this.getAll();
        const filtered = saved.filter(p => p.id !== placeId);
        localStorage.setItem(this.KEY, JSON.stringify(filtered));
        this.updateUI();
    },
    
    getAll() {
        const data = localStorage.getItem(this.KEY);
        return data ? JSON.parse(data) : [];
    },
    
    updateUI() {
        const container = document.getElementById('savedPlacesList');
        if (!container) return;
        
        const saved = this.getAll();
        const currentLang = localStorage.getItem('language') || 'ru';
        
        if (!saved.length) {
            container.innerHTML = '<p class="empty-state">Нет сохранённых мест</p>';
            return;
        }
        
        container.innerHTML = saved.map(place => `
            <div class="saved-place-item" data-id="${place.id}">
                <div class="place-info">
                    <h4>${place.name[currentLang] || place.name.en}</h4>
                    <p class="place-type">${window.translations[`category_${place.category}`] || place.category}</p>
                    <p class="place-address">${place.address || ''}</p>
                </div>
                <button class="remove-saved" title="Удалить">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        container.querySelectorAll('.remove-saved').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.saved-place-item');
                const placeId = item.dataset.id;
                this.remove(placeId);
            });
        });
    }
};