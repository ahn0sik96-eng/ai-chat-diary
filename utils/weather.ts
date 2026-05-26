import * as Location from 'expo-location';

export interface WeatherData {
  temp: number;
  feelsLike: number;
  description: string;
  city: string;
  isRainy: boolean;
  isHot: boolean;
  isCold: boolean;
}

export async function getWeather(): Promise<WeatherData | null> {
  const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    const { latitude, longitude } = loc.coords;

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=kr`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const temp = Math.round(data.main.temp);

    return {
      temp,
      feelsLike: Math.round(data.main.feels_like),
      description: data.weather[0].description,
      city: data.name,
      isRainy: ['Rain', 'Drizzle', 'Thunderstorm'].includes(data.weather[0].main),
      isHot: temp >= 28,
      isCold: temp <= 8,
    };
  } catch {
    return null;
  }
}

// Soft Contextualization: 수치 대신 감성 언어로 변환 (spec §2-A)
export function weatherToContext(w: WeatherData): string | null {
  if (w.isRainy) return '오늘 비 왔는데';
  if (w.isHot && w.temp >= 33) return '오늘 진짜 찜통이었는데';
  if (w.isHot) return '오늘 많이 더웠는데';
  if (w.isCold) return '오늘 엄청 쌀쌀했는데';
  return null;
}
