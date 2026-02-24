window.MapGeocoder = {
    async forward(searchQuery) {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=10&addressdetails=1`;
            const response = await fetch(url);
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
                importance: result.importance
            }));
        } catch (error) {
            console.error('Geocoding error:', error);
            return [];
        }
    },

    async reverse(lat, lon) {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
            const response = await fetch(url);
            const result = await response.json();
            
            return {
                name: result.display_name,
                address: {
                    road: result.address?.road || '',
                    city: result.address?.city || result.address?.town || '',
                    country: result.address?.country || ''
                }
            };
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return null;
        }
    }
};