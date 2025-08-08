import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);

  // Получаем информацию о местоположении по координатам
  const fetchLocationInfo = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const result = await response.json();
      setLocationInfo({
        city: result.address?.city || result.address?.town,
        country: result.address?.country,
      });
    } catch (err) {
      console.error("Ошибка получения данных о местоположении:", err);
    }
  };

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
        (err) => console.error("Ошибка геолокации:", err)
      );
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hello');
      if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
      setData(await response.json());
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserLocation();
    fetchData();
    const interval = setInterval(fetchData, 30000); // Обновление каждые 30 сек
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <h1>Мое React-приложение</h1>
      
      <div className="status-panel">
        <button onClick={fetchData} disabled={loading}>
          {loading ? 'Обновление...' : 'Обновить данные'}
        </button>
        <span>Последнее обновление: {lastUpdated?.toLocaleTimeString()}</span>
      </div>

      <div className="response-container">
        {loading ? (
          <div className="loading">Загрузка данных...</div>
        ) : error ? (
          <div className="error">
            <p>Ошибка: {error}</p>
            <button onClick={fetchData}>Повторить</button>
          </div>
        ) : (
          <>
            <div className="message">{data?.message}</div>
            
            <div className="time-info">
              <div>
                <h3>Серверное время (Великобритания)</h3>
                {new Date(data?.timestamp).toLocaleString('en-GB', {
                  timeZone: 'Europe/London',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>

              {userLocation && (
                <div>
                  <h3>Ваше местоположение</h3>
                  {locationInfo?.city && <p>Город: {locationInfo.city}</p>}
                  {locationInfo?.country && <p>Страна: {locationInfo.country}</p>}
                  <p>Координаты: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</p>
                  
                  <div className="map-container">
                    <img 
                      src={`https://static-maps.yandex.ru/1.x/?ll=${userLocation.lng},${userLocation.lat}&z=10&size=300,150&l=map&pt=${userLocation.lng},${userLocation.lat},pm2blm`}
                      alt="Карта местоположения"
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