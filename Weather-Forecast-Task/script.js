// API Key
const API_KEY = "168771779c71f3d64106d8a88376808a";

// UI Element Selectors
const userTab = document.querySelector("[data-userWeather]");
const searchTab = document.querySelector("[data-searchWeather]");
const searchForm = document.querySelector("[data-searchForm]");
const userInfoContainer = document.querySelector(".userInfoContainer");
const grantAccessContainer = document.querySelector(".grantLocationContainer");
const loadingContainer = document.querySelector('.loadingContainer');
const notFound = document.querySelector('.errorContainer');
const errorBtn = document.querySelector('[data-errorButton]');
const errorText = document.querySelector('[data-errorText]');
const errorImage = document.querySelector('[data-errorImg]');
const searchInput = document.querySelector('[data-searchInput]');
const grantAccessButton = document.querySelector('[data-grantAccess]');
const forecastContainer = document.querySelector(".forecastContainer"); 
let currentUnit = "C"; // Default unit is Celsius

// 5-day forecast container

// Initial setup
let currentTab = userTab;
currentTab.classList.add("currentTab");
getFromSessionStorage();

// Tab switching logic
function switchTab(newTab) {
    notFound.classList.remove("active");
    if (currentTab !== newTab) {
        currentTab.classList.remove("currentTab");
        currentTab = newTab;
        currentTab.classList.add("currentTab");

        // Toggle between 'Search Weather' and 'Your Weather'
        if (!searchForm.classList.contains("active")) {
            searchForm.classList.add("active");
            userInfoContainer.classList.remove("active");
            grantAccessContainer.classList.remove("active");
        } else {
            searchForm.classList.remove("active");
            userInfoContainer.classList.remove("active");
            getFromSessionStorage();
        }
    }
}

// Event listeners for tab switching
userTab.addEventListener('click', () => switchTab(userTab));
searchTab.addEventListener('click', () => switchTab(searchTab));

// Retrieve coordinates from session storage or prompt for access
function getFromSessionStorage() {
    const localCoordinates = sessionStorage.getItem("userCoordinates");
    if (!localCoordinates) {
        grantAccessContainer.classList.add('active');
    } else {
        const coordinates = JSON.parse(localCoordinates);
        fetchWeatherInfo(coordinates);
    }
}

// Fetch current and 5-day forecast weather information using coordinates
async function fetchWeatherInfo(coordinates) {
    const { lat, lon } = coordinates;
    grantAccessContainer.classList.remove('active');
    loadingContainer.classList.add('active');

    try {
        const currentResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        if (!currentData.sys || !forecastData.city) throw new Error("Data not found");

        loadingContainer.classList.remove('active');
        userInfoContainer.classList.add('active');
        renderWeatherInfo(currentData);
        renderForecastInfo(forecastData);
    } catch (err) {
        displayError(err);
    }
}

// Render weather information on the UI
function renderWeatherInfo(weatherInfo) {
    const cityName = document.querySelector('[data-cityName]');
    const countryFlag = document.querySelector('[data-countryFlag]');
    const description = document.querySelector('[data-weatherDesc]');
    const weatherIcon = document.querySelector('[data-weatherIcon]');
    const temp = document.querySelector('[data-temp]');
    const minTemp = document.querySelector('[data-min-temp]');
    const maxTemp = document.querySelector('[data-max-temp]');
    const windspeed = document.querySelector('[data-windspeed]');
    const humidity = document.querySelector('[data-humidity]');
    const clouds = document.querySelector('[data-clouds]');

    cityName.innerText = weatherInfo.name;
    countryFlag.src = `https://flagcdn.com/144x108/${weatherInfo.sys.country.toLowerCase()}.png`;
    description.innerText = weatherInfo.weather[0].description;
    weatherIcon.src = `http://openweathermap.org/img/w/${weatherInfo.weather[0].icon}.png`;

    temp.innerText = `${weatherInfo.main.temp.toFixed(2)} °C`;
    minTemp.innerText = `Min: ${weatherInfo.main.temp_min.toFixed(2)} °C`;
    maxTemp.innerText = `Max: ${weatherInfo.main.temp_max.toFixed(2)} °C`;

    windspeed.innerText = `${weatherInfo.wind.speed.toFixed(2)} m/s`;
    humidity.innerText = `${weatherInfo.main.humidity.toFixed(2)} %`;
    clouds.innerText = `${weatherInfo.clouds.all.toFixed(2)} %`;
}


// Render 5-day forecast information on the UI
function renderForecastInfo(forecastData) {
    forecastContainer.innerHTML = ""; // Clear previous forecast data

    // Group the forecast data by day
    const dailyData = {};
    forecastData.list.forEach(item => {
        const date = item.dt_txt.split(" ")[0];
        if (!dailyData[date]) {
            dailyData[date] = [];
        }
        dailyData[date].push(item);
    });

    // Create forecast cards for each day
    Object.keys(dailyData).slice(0, 5).forEach(date => {
        const dayData = dailyData[date];
        const dayTemp = dayData.reduce((acc, cur) => acc + cur.main.temp, 0) / dayData.length;
        const dayDescription = dayData[0].weather[0].description;
        const dayIcon = dayData[0].weather[0].icon;

        const forecastCard = document.createElement("div");
        forecastCard.classList.add("forecastCard");
        forecastCard.innerHTML = `
            <p>${new Date(date).toLocaleDateString("en-US", { weekday: 'long' })}</p>
            <img src="http://openweathermap.org/img/w/${dayIcon}.png" alt="weather icon">
            <p>${dayDescription}</p>
            <p>${dayTemp.toFixed(2)} °C</p>
        `;
        forecastContainer.appendChild(forecastCard);
    });
}

// Request user's geolocation
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        grantAccessButton.style.display = 'none';
    }
}

// Show position and fetch weather info based on coordinates
function showPosition(position) {
    const userCoordinates = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
    };
    sessionStorage.setItem("userCoordinates", JSON.stringify(userCoordinates));
    fetchWeatherInfo(userCoordinates);
}

// Event listener for granting location access
grantAccessButton.addEventListener('click', getLocation);

// Handle search form submission
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (searchInput.value) {
        fetchSearchWeatherInfo(searchInput.value);
        searchInput.value = "";
    }
});

// Fetch current and 5-day forecast weather information based on city name
async function fetchSearchWeatherInfo(city) {
    loadingContainer.classList.add("active");
    userInfoContainer.classList.remove("active");
    grantAccessContainer.classList.remove("active");
    notFound.classList.remove("active");

    try {
        const currentResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
        const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`);

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        if (!currentData.sys || !forecastData.city) throw new Error("Data not found");

        loadingContainer.classList.remove('active');
        userInfoContainer.classList.add('active');
        renderWeatherInfo(currentData);
        renderForecastInfo(forecastData);
    } catch (err) {
        displayError(err);
    }
}

// Display error message
function displayError(err) {
    loadingContainer.classList.remove('active');
    notFound.classList.add('active');
    errorImage.style.display = 'none';
    errorText.innerText = `Error: ${err?.message || 'An error occurred'}`;
    errorBtn.style.display = 'block';
    errorBtn.addEventListener("click", getFromSessionStorage);
}


// temp toggle
document.addEventListener("DOMContentLoaded", () => {
    const tempElement = document.querySelector('[data-temp]');
    const minTempElement = document.querySelector('[data-min-temp]');
    const maxTempElement = document.querySelector('[data-max-temp]');
    const tempToggleButton = document.querySelector('[data-temp-toggle]');
  
    let isCelsius = true; // Track if the current display is in Celsius
  
    // Initial temperature values, these will be updated when the weather data is fetched
    let temperatureInCelsius = tempElement;
    let minTemperatureInCelsius = minTempElement;
    let maxTemperatureInCelsius = maxTempElement;
  
    // Function to fetch and store temperature values from the DOM elements
    function updateTemperatureValues() {
      // Extract the numeric part of the temperatures from the innerText
      temperatureInCelsius = parseFloat(tempElement.textContent);
      minTemperatureInCelsius = parseFloat(minTempElement.textContent.split(' ')[1]);
      maxTemperatureInCelsius = parseFloat(maxTempElement.textContent.split(' ')[1]);
    }
  
    function displayTemperature() {
      if (isCelsius) {
        tempElement.textContent = `${temperatureInCelsius.toFixed(1)} °C`;
        minTempElement.textContent = `Min: ${minTemperatureInCelsius.toFixed(1)} °C`;
        maxTempElement.textContent = `Max: ${maxTemperatureInCelsius.toFixed(1)} °C`;
        tempToggleButton.textContent = 'Convert to °F';
      } else {
        const tempInFahrenheit = (temperatureInCelsius * 9/5) + 32;
        const minTempInFahrenheit = (minTemperatureInCelsius * 9/5) + 32;
        const maxTempInFahrenheit = (maxTemperatureInCelsius * 9/5) + 32;
        tempElement.textContent = `${tempInFahrenheit.toFixed(1)} °F`;
        minTempElement.textContent = `Min: ${minTempInFahrenheit.toFixed(1)} °F`;
        maxTempElement.textContent = `Max: ${maxTempInFahrenheit.toFixed(1)} °F`;
        tempToggleButton.textContent = 'Convert to °C';
      }
    }
  
    tempToggleButton.addEventListener('click', () => {
      isCelsius = !isCelsius;
      displayTemperature();
    });
  
    // Initial display
    updateTemperatureValues();
    displayTemperature();
  });
  
  // Render weather information on the UI
  function renderWeatherInfo(weatherInfo) {
      const cityName = document.querySelector('[data-cityName]');
      const countryFlag = document.querySelector('[data-countryFlag]');
      const description = document.querySelector('[data-weatherDesc]');
      const weatherIcon = document.querySelector('[data-weatherIcon]');
      const temp = document.querySelector('[data-temp]');
      const minTemp = document.querySelector('[data-min-temp]');
      const maxTemp = document.querySelector('[data-max-temp]');
      const windspeed = document.querySelector('[data-windspeed]');
      const humidity = document.querySelector('[data-humidity]');
      const clouds = document.querySelector('[data-clouds]');
  
      cityName.innerText = weatherInfo.name;
      countryFlag.src = `https://flagcdn.com/144x108/${weatherInfo.sys.country.toLowerCase()}.png`;
      description.innerText = weatherInfo.weather[0].description;
      weatherIcon.src = `http://openweathermap.org/img/w/${weatherInfo.weather[0].icon}.png`;
  
      // Store temperatures for toggle functionality
      const temperatureInCelsius = weatherInfo.main.temp.toFixed(2);
      const minTemperatureInCelsius = weatherInfo.main.temp_min.toFixed(2);
      const maxTemperatureInCelsius = weatherInfo.main.temp_max.toFixed(2);
  
      temp.innerText = `${temperatureInCelsius} °C`;
      minTemp.innerText = `Min: ${minTemperatureInCelsius} °C`;
      maxTemp.innerText = `Max: ${maxTemperatureInCelsius} °C`;
  
      windspeed.innerText = `${weatherInfo.wind.speed.toFixed(2)} m/s`;
      humidity.innerText = `${weatherInfo.main.humidity.toFixed(2)} %`;
      clouds.innerText = `${weatherInfo.clouds.all.toFixed(2)} %`;
  
      // Update the toggle button script to use the current temperatures
      updateTemperatureValues();
  }
  


