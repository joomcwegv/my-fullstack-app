import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);

  // API endpoints
  const API_URL = process.env.REACT_APP_API_URL || 'https://your-render-backend.onrender.com';
  const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

  // Fetch location data from OpenStreetMap
  const fetchLocationInfo = async (lat, lng) => {
    try {
      const response = await fetch(
        `${NOMINATIM_URL}/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'MyFullstackApp/1.0 (my@email.com)'
          }
        }
      );
      
      if (!response.ok) throw new Error('Location service error');
      
      const result = await response.json();
      setLocationInfo({
        city: result.address?.city || result.address?.town || result.address?.village,
        country: result.address?.country,
      });
    } catch (err) {
      console.error("Location fetch error:", err);
      setError('Failed to get location details');
    }
  };

  // Get user's geolocation
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(coords);
          fetchLocationInfo(coords.lat, coords.lng);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError('Please enable location access');
        }
      );
    } else {
      setError('Geolocation not supported');
    }
  };

  // Fetch data from backend
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/hello`);
      
      // Check for JSON response
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON, got: ${text.substring(0, 100)}`);
      }
      
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      
      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
      setError(null);
      
      // Cache data
      localStorage.setItem('apiCache', JSON.stringify(result));
    } catch (err) {
      console.error("API fetch error:", err);
      
      // Try to use cached data
      const cached = localStorage.getItem('apiCache');
      if (cached) {
        setData(JSON.parse(cached));
        setError('Using cached data. ' + err.message);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserLocation();
    fetchData();
    
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <h1>My Fullstack App</h1>
      
      <div className="status-panel">
        <button onClick={fetchData} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
        {lastUpdated && (
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
        )}
      </div>

      <div className="response-container">
        {loading ? (
          <div className="loading">Loading data...</div>
        ) : error ? (
          <div className="error">
            <p>Error: {error}</p>
            <button onClick={fetchData}>Retry</button>
          </div>
        ) : (
          <>
            {data?.message && <div className="message">{data.message}</div>}
            
            <div className="time-info">
              <div>
                <h3>Server Time (UK)</h3>
                {data?.timestamp && new Date(data.timestamp).toLocaleString('en-GB', {
                  timeZone: 'Europe/London',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>

              {userLocation && (
                <div className="location-info">
                  <h3>Your Location</h3>
                  {locationInfo?.city && <p>City: {locationInfo.city}</p>}
                  {locationInfo?.country && <p>Country: {locationInfo.country}</p>}
                  <p>Coordinates: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</p>
                  
                  <div className="map-container">
                    {mapLoading && <div className="map-loader">Loading map...</div>}
                    <img 
                      src={`https://static-maps.yandex.ru/1.x/?ll=${userLocation.lng},${userLocation.lat}&z=10&size=300,150&l=map&pt=${userLocation.lng},${userLocation.lat},pm2blm`}
                      alt="Location map"
                      crossOrigin="anonymous"
                      onLoad={() => setMapLoading(false)}
                      style={{ display: mapLoading ? 'none' : 'block' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;