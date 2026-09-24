
"""
SIH 2026
Synthetic Indian Himalayan Flash-Flood Prediction Dataset

IMPORTANT:
This creates SYNTHETIC/DEMO data.
It must NOT be represented as real historical weather observations.

Output:
    india_flash_flood_5000.csv

Target:
    flood_next_3h

The target represents whether a flash flood is assumed to occur
within the next 3 hours based on the synthetic hazard-generation
process.

For the production system, replace the synthetic weather/event
variables with real observations and verified event labels.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# ============================================================
# CONFIGURATION
# ============================================================

SEED = 2026
N_ROWS = 10000

np.random.seed(SEED)

# ============================================================
# INDIAN HILLY / HIMALAYAN LOCATIONS
# ============================================================

locations = [
    # State, District, Location ID, Lat, Lon,
    # Elevation, Slope, Catchment, River Distance,
    # Flood susceptibility, Landslide susceptibility

    ("Uttarakhand", "Uttarkashi", "UK_UTT_001",
     30.73, 78.45, 2100, 34, 95, 0.8, 0.88, 0.92),

    ("Uttarakhand", "Rudraprayag", "UK_RUD_001",
     30.28, 79.07, 1850, 32, 82, 0.7, 0.86, 0.89),

    ("Uttarakhand", "Chamoli", "UK_CHA_001",
     30.40, 79.32, 2200, 36, 105, 0.9, 0.89, 0.94),

    ("Uttarakhand", "Pithoragarh", "UK_PIT_001",
     29.58, 80.22, 1750, 38, 76, 0.6, 0.84, 0.91),

    ("Uttarakhand", "Dehradun", "UK_DEH_001",
     30.32, 78.03, 950, 18, 130, 2.0, 0.64, 0.62),

    ("Himachal Pradesh", "Kullu", "HP_KUL_001",
     31.96, 77.11, 1900, 35, 88, 0.7, 0.86, 0.91),

    ("Himachal Pradesh", "Mandi", "HP_MAN_001",
     31.71, 76.93, 1200, 29, 110, 0.9, 0.80, 0.84),

    ("Himachal Pradesh", "Kinnaur", "HP_KIN_001",
     31.58, 78.48, 2650, 42, 1.2, 0.5, 0.78, 0.95),

    ("Himachal Pradesh", "Chamba", "HP_CHA_001",
     32.55, 76.13, 1500, 33, 92, 0.8, 0.82, 0.88),

    ("Himachal Pradesh", "Shimla", "HP_SHI_001",
     31.10, 77.17, 2100, 31, 70, 1.5, 0.76, 0.87),

    ("Sikkim", "Gangtok", "SK_GAN_001",
     27.33, 88.61, 1650, 39, 65, 0.7, 0.84, 0.94),

    ("Sikkim", "Mangan", "SK_MAN_001",
     27.51, 88.53, 2000, 43, 0.6, 0.5, 0.91, 0.97),

    ("Sikkim", "Gyalshing", "SK_GYA_001",
     27.28, 88.26, 1400, 35, 78, 0.8, 0.81, 0.91),

    ("Arunachal Pradesh", "West Kameng", "AR_WK_001",
     27.35, 92.42, 1800, 31, 140, 0.8, 0.79, 0.84),

    ("Arunachal Pradesh", "Tawang", "AR_TAW_001",
     27.59, 91.87, 2900, 36, 115, 0.7, 0.73, 0.89),

    ("Arunachal Pradesh", "East Siang", "AR_ES_001",
     28.06, 95.33, 650, 21, 190, 0.5, 0.87, 0.70),

    ("Jammu & Kashmir", "Kishtwar", "JK_KIS_001",
     33.31, 75.77, 1800, 34, 100, 0.8, 0.78, 0.87),

    ("Jammu & Kashmir", "Ramban", "JK_RAM_001",
     33.24, 75.25, 1200, 32, 70, 0.7, 0.79, 0.91),

    ("Jammu & Kashmir", "Doda", "JK_DOD_001",
     33.15, 75.55, 1500, 29, 85, 0.9, 0.75, 0.86),

    ("West Bengal", "Darjeeling", "WB_DAR_001",
     27.04, 88.26, 2100, 33, 72, 0.7, 0.80, 0.90),

    ("West Bengal", "Kalimpong", "WB_KAL_001",
     27.06, 88.47, 1250, 35, 66, 0.6, 0.78, 0.92),
]

# ============================================================
# WEATHER GENERATION FUNCTIONS
# ============================================================

def generate_rainfall(state):
    """
    Generate monsoon-dominated rainfall.
    Values are synthetic and intended for ML pipeline testing.
    """

    # Most observations should be normal/moderate.
    # A smaller proportion represents heavy/extreme rainfall.

    regime = np.random.choice(
        ["dry", "normal", "heavy", "extreme"],
        p=[0.28, 0.47, 0.20, 0.05]
    )

    if regime == "dry":
        r1 = np.random.gamma(1.2, 1.0)
        intensity = 0.7

    elif regime == "normal":
        r1 = np.random.gamma(2.0, 4.0)
        intensity = 1.0

    elif regime == "heavy":
        r1 = np.random.gamma(3.0, 10.0)
        intensity = 1.4

    else:
        # Cloudburst / extreme precipitation regime
        r1 = np.random.gamma(4.0, 18.0)
        intensity = 2.0

    rainfall_15m = max(0, r1 * np.random.uniform(0.15, 0.45))

    rainfall_1h = max(
        rainfall_15m,
        r1 * np.random.uniform(0.9, 1.4)
    )

    rainfall_3h = rainfall_1h * np.random.uniform(1.5, 3.0)

    rainfall_6h = rainfall_3h * np.random.uniform(1.4, 2.2)

    rainfall_12h = rainfall_6h * np.random.uniform(1.3, 1.9)

    rainfall_24h = rainfall_12h * np.random.uniform(1.3, 2.0)

    rainfall_72h = rainfall_24h * np.random.uniform(1.5, 3.0)

    # Future forecast is correlated with current rainfall,
    # but contains uncertainty.
    forecast_1h = max(
        0,
        rainfall_1h * np.random.uniform(0.45, 1.30)
        + np.random.normal(0, 4)
    )

    forecast_3h = max(
        0,
        rainfall_3h * np.random.uniform(0.50, 1.25)
        + np.random.normal(0, 7)
    )

    forecast_6h = max(
        0,
        rainfall_6h * np.random.uniform(0.50, 1.20)
        + np.random.normal(0, 10)
    )

    return {
        "rainfall_15min_mm": rainfall_15m,
        "rainfall_1h_mm": rainfall_1h,
        "rainfall_3h_mm": rainfall_3h,
        "rainfall_6h_mm": rainfall_6h,
        "rainfall_12h_mm": rainfall_12h,
        "rainfall_24h_mm": rainfall_24h,
        "rainfall_72h_mm": rainfall_72h,
        "forecast_rainfall_1h_mm": forecast_1h,
        "forecast_rainfall_3h_mm": forecast_3h,
        "forecast_rainfall_6h_mm": forecast_6h,
    }


# ============================================================
# CREATE DATA
# ============================================================

rows = []

start_date = datetime(2019, 6, 1)

for i in range(N_ROWS):

    location = locations[np.random.randint(len(locations))]

    (
        state,
        district,
        location_id,
        lat,
        lon,
        elevation,
        slope,
        catchment,
        river_distance,
        flood_susceptibility,
        landslide_susceptibility
    ) = location

    # Random timestamp across monsoon-heavy period
    timestamp = start_date + timedelta(
        hours=int(np.random.randint(0, 7 * 24 * 365))
    )

    # Keep dates broadly within monsoon months for realism
    month = np.random.choice(
        [6, 7, 8, 9],
        p=[0.18, 0.38, 0.34, 0.10]
    )

    year = np.random.randint(2019, 2026)
    day = np.random.randint(1, 28)
    hour = np.random.choice(
        [0, 3, 6, 9, 12, 15, 18, 21]
    )

    timestamp = datetime(year, month, day, hour)

    rainfall = generate_rainfall(state)

    # --------------------------------------------------------
    # Soil moisture
    # --------------------------------------------------------

    base_soil = np.random.uniform(30, 65)

    rainfall_effect = min(
        30,
        rainfall["rainfall_72h_mm"] / 12
    )

    soil_moisture = np.clip(
        base_soil + rainfall_effect + np.random.normal(0, 5),
        15,
        99
    )

    soil_change = np.random.normal(
        rainfall["rainfall_3h_mm"] / 100,
        0.8
    )

    # --------------------------------------------------------
    # Water level
    # --------------------------------------------------------

    normal_water_level = np.random.uniform(1.0, 4.5)

    water_rise = (
        rainfall["rainfall_1h_mm"] / 80
        * np.random.uniform(0.3, 1.2)
        * flood_susceptibility
    )

    water_level = max(
        0.2,
        normal_water_level + water_rise
    )

    water_level_change = max(
        -0.3,
        water_rise + np.random.normal(0, 0.08)
    )

    # --------------------------------------------------------
    # Temperature
    # --------------------------------------------------------

    temperature = np.random.normal(
        18 if elevation > 2000 else 23,
        3
    )

    temperature = np.clip(temperature, 5, 35)

    # --------------------------------------------------------
    # Humidity
    # --------------------------------------------------------

    humidity = np.clip(
        65
        + rainfall["rainfall_24h_mm"] / 15
        + np.random.normal(0, 5),
        35,
        99
    )

    # --------------------------------------------------------
    # Historical event indicators
    #
    # Higher values = more historically vulnerable location.
    # These are synthetic frequency indicators.
    # --------------------------------------------------------

    historical_flood_frequency = round(
        np.random.poisson(
            3 + flood_susceptibility * 5
        ),
        0
    )

    historical_landslide_frequency = round(
        np.random.poisson(
            2 + landslide_susceptibility * 6
        ),
        0
    )

    # --------------------------------------------------------
    # Sensor availability
    # --------------------------------------------------------

    sensor_available = np.random.choice(
        [0, 1],
        p=[0.18, 0.82]
    )

    if sensor_available:

        data_quality = np.clip(
            np.random.normal(0.95, 0.04),
            0.70,
            1.00
        )

    else:

        data_quality = np.clip(
            np.random.normal(0.82, 0.08),
            0.50,
            0.95
        )

    # ========================================================
    # SYNTHETIC LATENT HAZARD MODEL
    #
    # IMPORTANT:
    # This is ONLY for generating a demo target.
    #
    # In the real project, this must be replaced with actual
    # historical event labels.
    # ========================================================

    rainfall_signal = (
        0.28 * min(rainfall["rainfall_1h_mm"] / 80, 1)
        +
        0.25 * min(rainfall["rainfall_3h_mm"] / 150, 1)
        +
        0.15 * min(rainfall["rainfall_24h_mm"] / 300, 1)
    )

    saturation_signal = (
        0.12 * soil_moisture / 100
    )

    river_signal = (
        0.08 * min(water_level_change / 1.0, 1)
    )

    terrain_signal = (
        0.07 * flood_susceptibility
        +
        0.05 * min(slope / 45, 1)
    )

    forecast_signal = (
        0.10 * min(
            rainfall["forecast_rainfall_3h_mm"] / 150,
            1
        )
    )

    hazard_score = (
        rainfall_signal
        + saturation_signal
        + river_signal
        + terrain_signal
        + forecast_signal
    )

    # Add stochastic uncertainty.
    hazard_score += np.random.normal(0, 0.06)

    # Convert score into probability.
    probability = 1 / (
        1 + np.exp(-10 * (hazard_score - 0.48))
    )

    # Random event realization.
    flood_next_3h = int(
        np.random.random() < probability
    )

    # ========================================================
    # STORE ROW
    # ========================================================

    row = {
        "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),

        "state": state,
        "district": district,
        "location_id": location_id,

        "latitude": round(lat, 5),
        "longitude": round(lon, 5),

        "elevation_m": round(elevation, 1),
        "slope_degree": round(slope, 2),
        "catchment_area_km2": round(catchment, 2),
        "distance_to_river_km": round(river_distance, 2),

        **{
            k: round(v, 2)
            for k, v in rainfall.items()
        },

        "soil_moisture_pct": round(
            soil_moisture, 2
        ),

        "soil_moisture_change_3h_pct": round(
            soil_change, 2
        ),

        "water_level_m": round(
            water_level, 2
        ),

        "water_level_change_1h_m": round(
            water_level_change, 3
        ),

        "temperature_c": round(
            temperature, 2
        ),

        "humidity_pct": round(
            humidity, 2
        ),

        "historical_flood_frequency": int(
            historical_flood_frequency
        ),

        "historical_landslide_frequency": int(
            historical_landslide_frequency
        ),

        "flood_susceptibility_score": round(
            flood_susceptibility, 3
        ),

        "landslide_susceptibility_score": round(
            landslide_susceptibility, 3
        ),

        "sensor_data_available": int(
            sensor_available
        ),

        "data_quality_score": round(
            data_quality, 3
        ),

        # TARGET
        "flood_next_3h": flood_next_3h,
    }

    rows.append(row)


# ============================================================
# CREATE DATAFRAME
# ============================================================

df = pd.DataFrame(rows)

# Sort chronologically within location
df = df.sort_values(
    ["location_id", "timestamp"]
).reset_index(drop=True)

# ============================================================
# SAVE
# ============================================================

output_file = "india_flash_flood_5000.csv"

df.to_csv(
    output_file,
    index=False
)

print("=" * 70)
print("DATASET CREATED")
print("=" * 70)

print(f"Rows: {len(df)}")
print(f"Columns: {len(df.columns)}")
print(f"Output: {output_file}")

print("\nTarget distribution:")
print(df["flood_next_3h"].value_counts())

print("\nTarget percentage:")
print(
    df["flood_next_3h"]
    .value_counts(normalize=True)
    .mul(100)
    .round(2)
)

print("\nStates:")
print(df["state"].value_counts())

print("\nPreview:")
print(df.head(10).to_string())

print("\nIMPORTANT:")
print("This dataset is SYNTHETIC/DEMO data.")
print("Do not claim these are actual historical observations.")

