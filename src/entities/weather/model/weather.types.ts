export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface WeatherLocation extends Coordinates {
  id: string;
  name: string;
  country: string;
  timezone: string;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  observedAt: string;
}
