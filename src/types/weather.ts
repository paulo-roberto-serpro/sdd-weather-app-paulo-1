export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  countryCode?: string;
  admin1?: string;
  timezone: string;
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  feelsLike: number | null;
  humidity: number | null;
  windSpeed: number | null;
  pressure: number | null;
  precipitation: number | null;
  conditionCode: number | null;
  conditionLabel: string;
}

export interface ForecastDay {
  date: string;
  minTemp: number | null;
  maxTemp: number | null;
  conditionCode: number | null;
  conditionLabel: string;
  precipitationProbability: number | null;
}

export interface WeatherData {
  city: City;
  current: CurrentWeather;
  forecast: ForecastDay[];
  fetchedAt: string;
  timezone: string;
}
