export async function getWeather(req, res) {
  const city = req.query.city || "Dehradun";

  if (process.env.OPENWEATHER_API_KEY) {
    try {
      const url =
        `https://api.openweathermap.org/data/2.5/weather` +
        `?q=${encodeURIComponent(city)}` +
        `&units=metric` +
        `&appid=${process.env.OPENWEATHER_API_KEY}`;

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();

        return res.json({
          condition: data.weather?.[0]?.description || "Unknown",
          temperature: Math.round(data.main?.temp ?? 0),
          humidity: data.main?.humidity ?? 0,
          rainfall: data.rain?.["1h"] ?? 0,
          windSpeed: Math.round((data.wind?.speed ?? 0) * 3.6),
          source: "OpenWeather",
        });
      }
    } catch (error) {
      console.error("Weather API error:", error.message);
    }
  }

  res.json({
    condition: "Partly cloudy",
    temperature: 24,
    humidity: 72,
    rainfall: 12,
    windSpeed: 9,
    source: "Demo data",
  });
}
