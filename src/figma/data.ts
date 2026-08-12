// ─── Page routing ───────────────────────────────────────────────────────────
export type Page =
  | "home" | "search" | "favorites" | "forecast" | "analytics"
  | "map" | "airquality" | "alerts" | "comparison" | "historical"
  | "travel" | "activities" | "notifications" | "profile" | "settings";

// ─── City ───────────────────────────────────────────────────────────────────
export interface City {
  id: string; name: string; country: string; flag: string;
  temp: number; feelsLike: number; condition: string; emoji: string;
  high: number; low: number; humidity: number; wind: number; windDir: string;
  aqi: number; uv: number; pressure: number; visibility: number;
  lat: string; lon: string; tz: string;
}

export const CITIES: City[] = [
  { id:"tbilisi",  name:"Tbilisi",   country:"Georgia",    flag:"🇬🇪", temp:34, feelsLike:37, condition:"Sunny",         emoji:"☀️",  high:36, low:22, humidity:42, wind:12, windDir:"NE", aqi:85,  uv:8,  pressure:1013, visibility:10, lat:"41.69°N", lon:"44.83°E", tz:"UTC+4" },
  { id:"yerevan",  name:"Yerevan",   country:"Armenia",    flag:"🇦🇲", temp:36, feelsLike:40, condition:"Hot & Sunny",   emoji:"🌤️", high:38, low:23, humidity:28, wind:8,  windDir:"W",  aqi:62,  uv:9,  pressure:938,  visibility:12, lat:"40.18°N", lon:"44.51°E", tz:"UTC+4" },
  { id:"baku",     name:"Baku",      country:"Azerbaijan", flag:"🇦🇿", temp:33, feelsLike:36, condition:"Sunny",         emoji:"☀️",  high:35, low:26, humidity:58, wind:18, windDir:"E",  aqi:95,  uv:7,  pressure:1016, visibility:8,  lat:"40.41°N", lon:"49.87°E", tz:"UTC+4" },
  { id:"istanbul", name:"Istanbul",  country:"Turkey",     flag:"🇹🇷", temp:29, feelsLike:31, condition:"Partly Cloudy", emoji:"⛅",  high:31, low:21, humidity:65, wind:22, windDir:"SW", aqi:78,  uv:6,  pressure:1018, visibility:14, lat:"41.01°N", lon:"28.95°E", tz:"UTC+3" },
  { id:"moscow",   name:"Moscow",    country:"Russia",     flag:"🇷🇺", temp:22, feelsLike:21, condition:"Cloudy",        emoji:"☁️",  high:24, low:15, humidity:72, wind:14, windDir:"NW", aqi:42,  uv:4,  pressure:1009, visibility:9,  lat:"55.75°N", lon:"37.62°E", tz:"UTC+3" },
  { id:"dubai",    name:"Dubai",     country:"UAE",        flag:"🇦🇪", temp:42, feelsLike:48, condition:"Hazy & Hot",    emoji:"🌫️", high:44, low:32, humidity:55, wind:16, windDir:"NW", aqi:112, uv:10, pressure:1002, visibility:6,  lat:"25.20°N", lon:"55.27°E", tz:"UTC+4" },
  { id:"paris",    name:"Paris",     country:"France",     flag:"🇫🇷", temp:24, feelsLike:23, condition:"Sunny",         emoji:"☀️",  high:26, low:16, humidity:55, wind:12, windDir:"SW", aqi:55,  uv:5,  pressure:1022, visibility:16, lat:"48.86°N", lon:"2.35°E",  tz:"UTC+2" },
  { id:"london",   name:"London",    country:"UK",         flag:"🇬🇧", temp:18, feelsLike:17, condition:"Overcast",      emoji:"☁️",  high:20, low:13, humidity:80, wind:20, windDir:"W",  aqi:38,  uv:3,  pressure:1015, visibility:12, lat:"51.51°N", lon:"0.13°W",  tz:"UTC+1" },
];

// ─── Hourly forecast (24h) ───────────────────────────────────────────────────
export const HOURLY = [
  { hour:"00:00", temp:23, emoji:"🌙", rain:0,  wind:7,  humidity:65, feels:22, pressure:1014 },
  { hour:"01:00", temp:22, emoji:"🌙", rain:0,  wind:6,  humidity:67, feels:21, pressure:1014 },
  { hour:"02:00", temp:22, emoji:"🌙", rain:0,  wind:6,  humidity:68, feels:20, pressure:1013 },
  { hour:"03:00", temp:21, emoji:"🌙", rain:0,  wind:5,  humidity:70, feels:20, pressure:1013 },
  { hour:"04:00", temp:20, emoji:"🌙", rain:0,  wind:5,  humidity:71, feels:19, pressure:1013 },
  { hour:"05:00", temp:21, emoji:"🌅", rain:0,  wind:6,  humidity:70, feels:20, pressure:1013 },
  { hour:"06:00", temp:22, emoji:"🌅", rain:0,  wind:7,  humidity:68, feels:21, pressure:1013 },
  { hour:"07:00", temp:24, emoji:"⛅",  rain:0,  wind:8,  humidity:65, feels:23, pressure:1013 },
  { hour:"08:00", temp:26, emoji:"☀️", rain:0,  wind:9,  humidity:60, feels:25, pressure:1013 },
  { hour:"09:00", temp:28, emoji:"☀️", rain:0,  wind:10, humidity:55, feels:27, pressure:1013 },
  { hour:"10:00", temp:30, emoji:"☀️", rain:0,  wind:11, humidity:50, feels:30, pressure:1013 },
  { hour:"11:00", temp:32, emoji:"☀️", rain:0,  wind:12, humidity:46, feels:33, pressure:1013 },
  { hour:"12:00", temp:34, emoji:"☀️", rain:0,  wind:13, humidity:43, feels:36, pressure:1013 },
  { hour:"13:00", temp:35, emoji:"☀️", rain:0,  wind:14, humidity:41, feels:38, pressure:1012 },
  { hour:"14:00", temp:36, emoji:"☀️", rain:0,  wind:12, humidity:40, feels:39, pressure:1012 },
  { hour:"15:00", temp:36, emoji:"☀️", rain:0,  wind:11, humidity:40, feels:38, pressure:1012 },
  { hour:"16:00", temp:35, emoji:"☀️", rain:0,  wind:10, humidity:41, feels:37, pressure:1012 },
  { hour:"17:00", temp:33, emoji:"🌤️", rain:0,  wind:9,  humidity:43, feels:35, pressure:1012 },
  { hour:"18:00", temp:31, emoji:"🌤️", rain:0,  wind:8,  humidity:47, feels:32, pressure:1013 },
  { hour:"19:00", temp:29, emoji:"🌤️", rain:0,  wind:7,  humidity:52, feels:29, pressure:1013 },
  { hour:"20:00", temp:27, emoji:"🌙", rain:0,  wind:7,  humidity:56, feels:26, pressure:1013 },
  { hour:"21:00", temp:26, emoji:"🌙", rain:0,  wind:6,  humidity:59, feels:25, pressure:1014 },
  { hour:"22:00", temp:25, emoji:"🌙", rain:0,  wind:6,  humidity:62, feels:24, pressure:1014 },
  { hour:"23:00", temp:24, emoji:"🌙", rain:0,  wind:7,  humidity:63, feels:23, pressure:1014 },
];

// ─── 30-day forecast (Jul 17 → Aug 15) ──────────────────────────────────────
export const FORECAST_30 = [
  { date:"Jul 17", day:"Thu", high:36, low:22, emoji:"☀️",  condition:"Sunny",         rain:5,  wind:12, humidity:42, uv:8  },
  { date:"Jul 18", day:"Fri", high:35, low:21, emoji:"☀️",  condition:"Sunny",         rain:10, wind:11, humidity:44, uv:8  },
  { date:"Jul 19", day:"Sat", high:32, low:20, emoji:"⛅",  condition:"Partly Cloudy", rain:25, wind:14, humidity:50, uv:7  },
  { date:"Jul 20", day:"Sun", high:29, low:19, emoji:"☁️",  condition:"Cloudy",        rain:45, wind:16, humidity:60, uv:5  },
  { date:"Jul 21", day:"Mon", high:27, low:18, emoji:"🌧️", condition:"Light Rain",    rain:70, wind:18, humidity:72, uv:4  },
  { date:"Jul 22", day:"Tue", high:31, low:20, emoji:"⛅",  condition:"Partly Cloudy", rain:30, wind:13, humidity:55, uv:6  },
  { date:"Jul 23", day:"Wed", high:34, low:22, emoji:"☀️",  condition:"Sunny",         rain:8,  wind:11, humidity:45, uv:8  },
  { date:"Jul 24", day:"Thu", high:35, low:22, emoji:"☀️",  condition:"Sunny",         rain:5,  wind:10, humidity:43, uv:8  },
  { date:"Jul 25", day:"Fri", high:36, low:23, emoji:"☀️",  condition:"Hot & Sunny",   rain:3,  wind:9,  humidity:40, uv:9  },
  { date:"Jul 26", day:"Sat", high:37, low:24, emoji:"☀️",  condition:"Hot",           rain:2,  wind:8,  humidity:38, uv:9  },
  { date:"Jul 27", day:"Sun", high:35, low:23, emoji:"🌤️", condition:"Mostly Sunny",  rain:10, wind:11, humidity:42, uv:8  },
  { date:"Jul 28", day:"Mon", high:32, low:21, emoji:"⛅",  condition:"Partly Cloudy", rain:20, wind:13, humidity:50, uv:7  },
  { date:"Jul 29", day:"Tue", high:30, low:20, emoji:"☁️",  condition:"Cloudy",        rain:40, wind:15, humidity:62, uv:5  },
  { date:"Jul 30", day:"Wed", high:28, low:19, emoji:"🌧️", condition:"Showers",       rain:65, wind:17, humidity:70, uv:4  },
  { date:"Jul 31", day:"Thu", high:30, low:20, emoji:"⛅",  condition:"Partly Cloudy", rain:30, wind:14, humidity:58, uv:6  },
  { date:"Aug 01", day:"Fri", high:33, low:21, emoji:"🌤️", condition:"Mostly Sunny",  rain:10, wind:11, humidity:48, uv:7  },
  { date:"Aug 02", day:"Sat", high:35, low:22, emoji:"☀️",  condition:"Sunny",         rain:5,  wind:10, humidity:43, uv:8  },
  { date:"Aug 03", day:"Sun", high:34, low:22, emoji:"☀️",  condition:"Sunny",         rain:5,  wind:10, humidity:44, uv:8  },
  { date:"Aug 04", day:"Mon", high:33, low:21, emoji:"🌤️", condition:"Mostly Sunny",  rain:12, wind:12, humidity:47, uv:7  },
  { date:"Aug 05", day:"Tue", high:31, low:20, emoji:"⛅",  condition:"Partly Cloudy", rain:22, wind:14, humidity:54, uv:6  },
  { date:"Aug 06", day:"Wed", high:29, low:19, emoji:"☁️",  condition:"Cloudy",        rain:38, wind:16, humidity:65, uv:5  },
  { date:"Aug 07", day:"Thu", high:27, low:18, emoji:"🌧️", condition:"Rain",          rain:75, wind:20, humidity:78, uv:3  },
  { date:"Aug 08", day:"Fri", high:28, low:18, emoji:"🌧️", condition:"Showers",       rain:60, wind:18, humidity:74, uv:4  },
  { date:"Aug 09", day:"Sat", high:30, low:19, emoji:"⛅",  condition:"Partly Cloudy", rain:35, wind:14, humidity:60, uv:6  },
  { date:"Aug 10", day:"Sun", high:32, low:21, emoji:"🌤️", condition:"Mostly Sunny",  rain:15, wind:11, humidity:50, uv:7  },
  { date:"Aug 11", day:"Mon", high:34, low:22, emoji:"☀️",  condition:"Sunny",         rain:5,  wind:10, humidity:44, uv:8  },
  { date:"Aug 12", day:"Tue", high:35, low:22, emoji:"☀️",  condition:"Sunny",         rain:3,  wind:9,  humidity:42, uv:8  },
  { date:"Aug 13", day:"Wed", high:36, low:23, emoji:"☀️",  condition:"Hot & Sunny",   rain:2,  wind:8,  humidity:40, uv:9  },
  { date:"Aug 14", day:"Thu", high:35, low:23, emoji:"☀️",  condition:"Sunny",         rain:5,  wind:9,  humidity:41, uv:8  },
  { date:"Aug 15", day:"Fri", high:34, low:22, emoji:"🌤️", condition:"Mostly Sunny",  rain:10, wind:10, humidity:44, uv:8  },
];

// ─── Analytics weekly data ───────────────────────────────────────────────────
export const ANALYTICS_WEEKLY = {
  temperature: [
    { day:"Mon", avg:30, high:34, low:20 },
    { day:"Tue", avg:29, high:33, low:19 },
    { day:"Wed", avg:28, high:31, low:18 },
    { day:"Thu", avg:32, high:36, low:22 },
    { day:"Fri", avg:33, high:36, low:21 },
    { day:"Sat", avg:31, high:34, low:20 },
    { day:"Sun", avg:30, high:33, low:20 },
  ],
  humidity: [
    { day:"Mon", avg:52, min:38, max:70 },
    { day:"Tue", avg:55, min:40, max:72 },
    { day:"Wed", avg:62, min:45, max:78 },
    { day:"Thu", avg:42, min:32, max:60 },
    { day:"Fri", avg:43, min:33, max:58 },
    { day:"Sat", avg:50, min:38, max:65 },
    { day:"Sun", avg:48, min:36, max:62 },
  ],
  wind: [
    { day:"Mon", avg:14, max:22, min:7  },
    { day:"Tue", avg:13, max:20, min:6  },
    { day:"Wed", avg:16, max:24, min:8  },
    { day:"Thu", avg:12, max:18, min:6  },
    { day:"Fri", avg:11, max:16, min:5  },
    { day:"Sat", avg:13, max:20, min:7  },
    { day:"Sun", avg:12, max:19, min:6  },
  ],
  pressure: [
    { day:"Mon", val:1011 },
    { day:"Tue", val:1009 },
    { day:"Wed", val:1007 },
    { day:"Thu", val:1013 },
    { day:"Fri", val:1014 },
    { day:"Sat", val:1015 },
    { day:"Sun", val:1014 },
  ],
  uv: [
    { day:"Mon", val:7, peak:9  },
    { day:"Tue", val:6, peak:8  },
    { day:"Wed", val:5, peak:7  },
    { day:"Thu", val:8, peak:10 },
    { day:"Fri", val:8, peak:10 },
    { day:"Sat", val:7, peak:9  },
    { day:"Sun", val:7, peak:9  },
  ],
  rainfall: [
    { day:"Mon", val:0   },
    { day:"Tue", val:0   },
    { day:"Wed", val:3.2 },
    { day:"Thu", val:0   },
    { day:"Fri", val:0   },
    { day:"Sat", val:0.5 },
    { day:"Sun", val:0   },
  ],
};

// ─── Historical data ─────────────────────────────────────────────────────────
export const HISTORICAL_YESTERDAY = [
  { hour:"06:00", temp:21, humidity:70, wind:6  },
  { hour:"09:00", temp:25, humidity:62, wind:9  },
  { hour:"12:00", temp:31, humidity:50, wind:12 },
  { hour:"15:00", temp:34, humidity:42, wind:13 },
  { hour:"18:00", temp:30, humidity:48, wind:9  },
  { hour:"21:00", temp:25, humidity:58, wind:7  },
];

export const HISTORICAL_30 = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 5, 17 + i); // June 17 – Jul 16
  const baseHigh = 28 + Math.round(Math.sin(i * 0.4) * 5 + Math.random() * 3);
  const baseLow  = 16 + Math.round(Math.sin(i * 0.3) * 3 + Math.random() * 2);
  return {
    date: `${date.toLocaleDateString("en", { month:"short", day:"numeric" })}`,
    high: baseHigh,
    low:  baseLow,
    rain: Math.random() > 0.7 ? Math.round(Math.random() * 12) : 0,
    humidity: 45 + Math.round(Math.random() * 30),
  };
});

// ─── Alerts ──────────────────────────────────────────────────────────────────
export const ALERTS = [
  { id:"a1", type:"Heat Warning",  severity:"high",   emoji:"🌡️", active:true,  title:"Extreme Heat Warning", desc:"Temperatures exceeding 37°C expected. Stay hydrated and avoid direct sun 11:00–16:00.", issued:"Jul 17, 06:00", expires:"Jul 17, 22:00", area:"Tbilisi City" },
  { id:"a2", type:"UV Alert",      severity:"medium", emoji:"☀️",  active:true,  title:"High UV Index Alert",  desc:"UV Index reaching 8 (Very High). Apply SPF 50+ sunscreen. Protective clothing advised.", issued:"Jul 17, 07:00", expires:"Jul 17, 20:00", area:"Eastern Georgia" },
  { id:"a3", type:"Wind Advisory", severity:"low",    emoji:"💨",  active:true,  title:"Wind Advisory",        desc:"Gusts up to 35 km/h from NE in the afternoon. Secure outdoor items.", issued:"Jul 17, 09:00", expires:"Jul 17, 18:00", area:"Greater Tbilisi" },
  { id:"a4", type:"Heavy Rain",    severity:"high",   emoji:"🌧️", active:false, title:"Heavy Rain Warning",   desc:"50–70mm rainfall expected over 6 hours. Flash flooding possible in low-lying areas.", issued:"Jul 14, 18:00", expires:"Jul 15, 06:00", area:"Mtkvari Basin" },
  { id:"a5", type:"Storm",         severity:"high",   emoji:"⛈️", active:false, title:"Thunderstorm Alert",   desc:"Severe thunderstorms with lightning and hail up to 2cm. Avoid travel if possible.", issued:"Jul 10, 14:00", expires:"Jul 10, 22:00", area:"Greater Tbilisi" },
  { id:"a6", type:"Flood",         severity:"medium", emoji:"🌊",  active:false, title:"Flood Watch",          desc:"River levels rising near Mtkvari. Flood watch in effect for low-lying riverside areas.", issued:"Jul 08, 10:00", expires:"Jul 09, 18:00", area:"Tbilisi Riverside" },
];

// ─── Notifications ───────────────────────────────────────────────────────────
export const NOTIFICATIONS = [
  { id:"n1", type:"alert",   emoji:"🌡️", title:"Heat Warning Active",      body:"Extreme heat expected until 22:00 tonight. Stay cool.",                          time:"10 min ago", read:false },
  { id:"n2", type:"alert",   emoji:"☀️",  title:"UV Index Now Very High",   body:"UV reached 8. Apply sunscreen before going outdoors.",                          time:"35 min ago", read:false },
  { id:"n3", type:"tip",     emoji:"💡",  title:"Best time for outdoor run", body:"6:00–7:30 AM tomorrow looks great — 21°C, light wind, UV 2.",                  time:"2h ago",     read:false },
  { id:"n4", type:"daily",   emoji:"📅",  title:"Daily Forecast Ready",     body:"Tbilisi today: 36°C high, sunny all day. Perfect for rooftop dining.",          time:"6h ago",     read:true  },
  { id:"n5", type:"rain",    emoji:"🌧️", title:"Rain expected Friday",      body:"70% chance of rain Mon Jul 21. Don't forget an umbrella!",                     time:"Yesterday",  read:true  },
  { id:"n6", type:"tip",     emoji:"🌅",  title:"Golden Hour at 20:07",     body:"Perfect photography conditions tonight 20:07–20:47.",                           time:"Yesterday",  read:true  },
  { id:"n7", type:"daily",   emoji:"📅",  title:"Weekly Summary",           body:"This week: avg 31°C, 2 rainy days. Next week trending warmer.",                 time:"Mon, Jul 13", read:true },
  { id:"n8", type:"alert",   emoji:"⛈️", title:"Storm Warning Lifted",     body:"The thunderstorm warning for Tbilisi has been cancelled. All clear.",           time:"Jul 10",     read:true  },
];

// ─── Activities ──────────────────────────────────────────────────────────────
export const ACTIVITIES = [
  { id:"walking",     label:"Walking",      emoji:"🚶", score:72, status:"Good",      color:"#a3e635", reasons:["Warm & sunny",    "Light 12 km/h wind",     "Low rain chance"],    tips:["Best: 6–9 AM or after 7 PM","Carry water","Wear light colors"]        },
  { id:"running",     label:"Running",      emoji:"🏃", score:55, status:"Fair",      color:"#f59e0b", reasons:["High temp 36°C",   "UV Index 8 Very High",   "Humidity 42%"],       tips:["Run before 8 AM","Hydrate every 15 min","Avoid peak UV 11–16"]       },
  { id:"cycling",     label:"Cycling",      emoji:"🚴", score:68, status:"Good",      color:"#a3e635", reasons:["Light headwind",   "Dry roads",              "Good visibility"],    tips:["Wear sunscreen","Hydration pack recommended","Early morning best"]     },
  { id:"hiking",      label:"Hiking",       emoji:"🥾", score:45, status:"Caution",   color:"#f97316", reasons:["36°C peak heat",   "UV 8 Very High",         "Exposed trails"],     tips:["Start before 7 AM","Carry 3L+ water","Wide-brim hat essential"]       },
  { id:"camping",     label:"Camping",      emoji:"🏕️", score:80, status:"Excellent", color:"#22c55e", reasons:["Warm 22°C nights", "No rain forecast",       "Clear skies"],        tips:["Perfect sleeping weather","Light sleeping bag","Star-gazing tonight"]  },
  { id:"photography", label:"Photography",  emoji:"📷", score:92, status:"Excellent", color:"#22c55e", reasons:["Golden hour 20:07","Crystal clear air",       "Dramatic light"],     tips:["Sunset: 20:47","Blue hour: 21:00","Magic hour starts at 20:07"]       },
  { id:"beach",       label:"Beach/River",  emoji:"🏊", score:78, status:"Good",      color:"#4a9eff", reasons:["Hot 36°C day",     "Mtkvari cool water",     "Low wind"],           tips:["Kura River spots open","Apply SPF 50+","Best 10 AM – 6 PM"]           },
];

// ─── Travel planner ──────────────────────────────────────────────────────────
export const TRAVEL_CALENDAR = FORECAST_30.map((d, i) => ({
  ...d,
  outdoorScore: Math.max(0, 100 - d.rain - (Math.max(0, d.high - 35) * 5) - (Math.max(0, 8 - 10) * 2)),
  beachScore:   Math.max(0, Math.min(100, d.high * 2 - d.rain - 10)),
  hikingScore:  Math.max(0, 100 - d.rain * 1.5 - Math.max(0, d.high - 32) * 4),
  travelScore:  Math.max(0, 95 - d.rain * 0.8 - Math.max(0, d.high - 36) * 3),
}));

// ─── Air quality pollutants ──────────────────────────────────────────────────
export const POLLUTANTS = [
  { id:"pm25",  label:"PM 2.5", val:18.4, unit:"μg/m³", limit:35,  color:"#f59e0b", desc:"Fine particles — respiratory risk"     },
  { id:"pm10",  label:"PM 10",  val:32.1, unit:"μg/m³", limit:70,  color:"#f7921e", desc:"Coarse particles — minor irritation"   },
  { id:"no2",   label:"NO₂",    val:24.5, unit:"μg/m³", limit:100, color:"#4a9eff", desc:"Nitrogen dioxide — traffic-related"    },
  { id:"o3",    label:"O₃",     val:68.2, unit:"μg/m³", limit:120, color:"#a3e635", desc:"Ground-level ozone — UV-driven"        },
  { id:"co",    label:"CO",     val:0.8,  unit:"mg/m³",  limit:10,  color:"#22c55e", desc:"Carbon monoxide — combustion product"  },
  { id:"so2",   label:"SO₂",    val:3.2,  unit:"μg/m³", limit:50,  color:"#7a8ba8", desc:"Sulfur dioxide — industrial source"    },
];

// ─── Map cities (lat/lon scaled to SVG viewport 900×520) ───────────────────
export const MAP_CITIES = [
  { name:"Tbilisi",   x:574, y:210, temp:34, rain:5,  wind:12, emoji:"☀️",  active:true  },
  { name:"Batumi",    x:430, y:218, temp:28, rain:40, wind:18, emoji:"⛅",  active:false },
  { name:"Kutaisi",   x:470, y:185, temp:31, rain:20, wind:14, emoji:"🌤️", active:false },
  { name:"Rustavi",   x:598, y:225, temp:35, rain:4,  wind:10, emoji:"☀️",  active:false },
  { name:"Gori",      x:515, y:205, temp:33, rain:8,  wind:12, emoji:"☀️",  active:false },
  { name:"Yerevan",   x:558, y:310, temp:36, rain:2,  wind:8,  emoji:"☀️",  active:false },
  { name:"Baku",      x:750, y:295, temp:33, rain:5,  wind:18, emoji:"☀️",  active:false },
  { name:"Istanbul",  x:148, y:255, temp:29, rain:18, wind:22, emoji:"⛅",  active:false },
  { name:"Trabzon",   x:390, y:248, temp:26, rain:35, wind:15, emoji:"🌧️", active:false },
  { name:"Sochi",     x:422, y:122, temp:27, rain:28, wind:12, emoji:"⛅",  active:false },
];
