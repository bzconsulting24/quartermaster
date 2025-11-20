import { useEffect, useState } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye } from 'lucide-react';
import { COLORS } from '../data/uiConstants';

type WeatherData = {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
  icon: string;
};

const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async (location: string) => {
      try {
        // Using wttr.in - free weather API, no key required
        const response = await fetch(`https://wttr.in/${location}?format=j1`);

        if (!response.ok) throw new Error('Weather fetch failed');

        const data = await response.json();
        const current = data.current_condition[0];

        setWeather({
          temperature: parseInt(current.temp_C),
          condition: current.weatherDesc[0].value,
          humidity: parseInt(current.humidity),
          windSpeed: parseInt(current.windspeedKmph),
          location: data.nearest_area[0].areaName[0].value,
          icon: current.weatherCode
        });
        setLoading(false);
      } catch (err) {
        console.error('Weather error:', err);
        setError('Unable to load weather');
        setLoading(false);
      }
    };

    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Use coordinates from geolocation
          const { latitude, longitude } = position.coords;
          fetchWeather(`${latitude},${longitude}`);
        },
        (err) => {
          console.log('Geolocation denied or failed, using Manila as fallback:', err);
          // Fallback to Manila if geolocation fails
          fetchWeather('Manila');
        }
      );
    } else {
      // Fallback if geolocation not supported
      console.log('Geolocation not supported, using Manila as fallback');
      fetchWeather('Manila');
    }
  }, []);

  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes('rain') || lower.includes('drizzle')) return <CloudRain size={32} color={COLORS.navyDark} />;
    if (lower.includes('cloud') || lower.includes('overcast')) return <Cloud size={32} color={COLORS.navyDark} />;
    if (lower.includes('sun') || lower.includes('clear')) return <Sun size={32} color={COLORS.gold} />;
    return <Cloud size={32} color={COLORS.navyDark} />;
  };

  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        textAlign: 'center',
        color: '#6B7280'
      }}>
        Loading weather...
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        textAlign: 'center',
        color: '#6B7280'
      }}>
        {error || 'Weather unavailable'}
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: '600',
        color: COLORS.navyDark,
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: `2px solid ${COLORS.gold}`
      }}>
        Weather - {weather.location}
      </h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '12px',
          background: `${COLORS.navyLight}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {getWeatherIcon(weather.condition)}
        </div>

        <div>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: COLORS.navyDark, lineHeight: 1 }}>
            {weather.temperature}°C
          </div>
          <div style={{ fontSize: '16px', color: '#6B7280', marginTop: '4px' }}>
            {weather.condition}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{
          padding: '12px',
          background: '#F9FAFB',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Droplets size={18} color={COLORS.navyDark} />
          <div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>Humidity</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: COLORS.navyDark }}>
              {weather.humidity}%
            </div>
          </div>
        </div>

        <div style={{
          padding: '12px',
          background: '#F9FAFB',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Wind size={18} color={COLORS.navyDark} />
          <div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>Wind Speed</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: COLORS.navyDark }}>
              {weather.windSpeed} km/h
            </div>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: `${COLORS.gold}15`,
        borderRadius: '6px',
        fontSize: '13px',
        color: '#6B7280',
        textAlign: 'center'
      }}>
        <Eye size={14} style={{ display: 'inline', marginRight: '6px' }} />
        Real-time weather data
      </div>
    </div>
  );
};

export default WeatherWidget;
