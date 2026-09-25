import pandas as pd
import numpy as np
import os
import json
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Save the weights in the backend for the Node.js server to use
BACKEND_CONFIG_DIR = os.path.join(BASE_DIR, "..", "backend", "config")
MODEL_WEIGHTS_FILE = os.path.join(BACKEND_CONFIG_DIR, "model_weights.json")

FEATURES = [
    "rainfall_15min_mm", "rainfall_1h_mm", "rainfall_3h_mm",
    "rainfall_6h_mm", "rainfall_12h_mm", "rainfall_24h_mm",
    "rainfall_72h_mm", "forecast_rainfall_1h_mm", "forecast_rainfall_3h_mm",
    "forecast_rainfall_6h_mm", "soil_moisture_pct", "soil_moisture_change_3h_pct",
    "water_level_m", "water_level_change_1h_m", "temperature_c",
    "humidity_pct", "latitude", "longitude", "elevation_m",
    "slope_degree", "catchment_area_km2", "distance_to_river_km",
    "historical_flood_frequency", "historical_landslide_frequency",
    "flood_susceptibility_score", "landslide_susceptibility_score",
    "sensor_data_available", "data_quality_score"
]

def generate_training_dataset():
    N_SAMPLES = 5000
    df = pd.DataFrame(index=range(N_SAMPLES), columns=FEATURES)
    
    df["rainfall_1h_mm"] = np.random.exponential(scale=10, size=N_SAMPLES)
    df["rainfall_1h_mm"] = np.clip(df["rainfall_1h_mm"], 0, 150)
    df["rainfall_15min_mm"] = df["rainfall_1h_mm"] * np.random.uniform(0.1, 0.4, N_SAMPLES)
    df["rainfall_3h_mm"] = df["rainfall_1h_mm"] * np.random.uniform(1.2, 3.0, N_SAMPLES)
    df["rainfall_6h_mm"] = df["rainfall_3h_mm"] * np.random.uniform(1.1, 2.0, N_SAMPLES)
    df["rainfall_12h_mm"] = df["rainfall_6h_mm"] * np.random.uniform(1.1, 1.8, N_SAMPLES)
    df["rainfall_24h_mm"] = df["rainfall_12h_mm"] * np.random.uniform(1.1, 1.5, N_SAMPLES)
    df["rainfall_72h_mm"] = df["rainfall_24h_mm"] * np.random.uniform(1.1, 1.8, N_SAMPLES)

    df["forecast_rainfall_1h_mm"] = df["rainfall_1h_mm"] * np.random.uniform(0.5, 1.5, N_SAMPLES)
    df["forecast_rainfall_3h_mm"] = df["forecast_rainfall_1h_mm"] * np.random.uniform(1.5, 3.0, N_SAMPLES)
    df["forecast_rainfall_6h_mm"] = df["forecast_rainfall_3h_mm"] * np.random.uniform(1.2, 2.5, N_SAMPLES)

    df["water_level_m"] = np.random.normal(loc=5.0, scale=2.0, size=N_SAMPLES)
    rain_effect = df["rainfall_1h_mm"] / 100.0
    df["water_level_change_1h_m"] = np.random.normal(loc=0.0, scale=0.1, size=N_SAMPLES) + rain_effect
    
    df["soil_moisture_pct"] = np.clip(np.random.normal(loc=60.0, scale=15.0, size=N_SAMPLES) + (rain_effect * 50), 10, 99)
    df["soil_moisture_change_3h_pct"] = np.random.uniform(-5, 15, N_SAMPLES)

    df["temperature_c"] = np.random.uniform(22, 35, N_SAMPLES)
    df["humidity_pct"] = np.random.uniform(60, 98, N_SAMPLES)
    df["latitude"] = np.random.uniform(25.5, 27.5, N_SAMPLES)
    df["longitude"] = np.random.uniform(90.0, 95.0, N_SAMPLES)
    df["elevation_m"] = np.random.uniform(50, 1500, N_SAMPLES)
    df["slope_degree"] = np.random.uniform(5, 45, N_SAMPLES)
    df["catchment_area_km2"] = np.random.uniform(10, 500, N_SAMPLES)
    df["distance_to_river_km"] = np.random.uniform(0.1, 10.0, N_SAMPLES)
    
    df["historical_flood_frequency"] = np.random.randint(0, 10, N_SAMPLES)
    df["historical_landslide_frequency"] = np.random.randint(0, 5, N_SAMPLES)
    df["flood_susceptibility_score"] = np.random.uniform(0.3, 0.9, N_SAMPLES)
    df["landslide_susceptibility_score"] = np.random.uniform(0.1, 0.8, N_SAMPLES)
    
    df["sensor_data_available"] = np.random.choice([0, 1], size=N_SAMPLES, p=[0.1, 0.9])
    df["data_quality_score"] = np.random.uniform(0.7, 1.0, N_SAMPLES)
    
    return df

def add_continuous_targets(df):
    flood_risk = []
    landslide_risk = []
    
    for _, row in df.iterrows():
        f_score = 0
        if row['rainfall_1h_mm'] > 50: f_score += 0.4
        elif row['rainfall_1h_mm'] > 25: f_score += 0.2
        
        if row['soil_moisture_pct'] > 85 and row['rainfall_24h_mm'] > 80: f_score += 0.3
        
        if row['water_level_change_1h_m'] > 0.40: f_score += 0.4
        elif row['water_level_change_1h_m'] > 0.20: f_score += 0.2
            
        if row['slope_degree'] > 30 and row['rainfall_3h_mm'] > 60: f_score += 0.2
            
        f_prob = np.clip(f_score + np.random.uniform(-0.05, 0.05), 0, 1)
        flood_risk.append(f_prob)
        
        l_score = 0
        if row['slope_degree'] > 30: l_score += 0.3
        elif row['slope_degree'] > 15: l_score += 0.1
        
        if row['soil_moisture_pct'] > 80: l_score += 0.3
        if row['rainfall_24h_mm'] > 100: l_score += 0.3
        
        l_prob = np.clip(l_score + np.random.uniform(-0.05, 0.05), 0, 1)
        landslide_risk.append(l_prob)
            
    df['flood_risk_index'] = flood_risk
    df['landslide_risk_index'] = landslide_risk
    return df

def train_linear_model():
    df = generate_training_dataset()
    df = add_continuous_targets(df)
    
    X = df[FEATURES]
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train Flood Model
    y_flood = df['flood_risk_index']
    X_train_f, X_test_f, y_train_f, y_test_f = train_test_split(X_scaled, y_flood, test_size=0.2, random_state=42)
    model_flood = LinearRegression()
    model_flood.fit(X_train_f, y_train_f)
    
    pred_f = model_flood.predict(X_test_f)
    print("Flood Linear Regression Metrics:")
    print(f"MAE: {mean_absolute_error(y_test_f, pred_f):.4f}")
    print(f"RMSE: {np.sqrt(mean_squared_error(y_test_f, pred_f)):.4f}")
    print(f"R2: {r2_score(y_test_f, pred_f):.4f}")
    
    # Train Landslide Model
    y_landslide = df['landslide_risk_index']
    X_train_l, X_test_l, y_train_l, y_test_l = train_test_split(X_scaled, y_landslide, test_size=0.2, random_state=42)
    model_landslide = LinearRegression()
    model_landslide.fit(X_train_l, y_train_l)
    
    pred_l = model_landslide.predict(X_test_l)
    print("\nLandslide Linear Regression Metrics:")
    print(f"MAE: {mean_absolute_error(y_test_l, pred_l):.4f}")
    print(f"RMSE: {np.sqrt(mean_squared_error(y_test_l, pred_l)):.4f}")
    print(f"R2: {r2_score(y_test_l, pred_l):.4f}")
    
    # Export weights for Node.js
    os.makedirs(BACKEND_CONFIG_DIR, exist_ok=True)

    if scaler.mean_ is None or scaler.scale_ is None:
        raise RuntimeError("Scaler was not fitted. Training failed before export.")
    if model_flood.coef_ is None or model_landslide.coef_ is None:
        raise RuntimeError("Model coefficients are missing. Training failed before export.")

    weights = {
        "features": FEATURES,
        "scaler": {
            "mean": np.asarray(scaler.mean_, dtype=float).tolist(),
            "scale": np.asarray(scaler.scale_, dtype=float).tolist()
        },
        "flood_model": {
            "coefficients": np.asarray(model_flood.coef_, dtype=float).tolist(),
            "intercept": float(model_flood.intercept_)
        },
        "landslide_model": {
            "coefficients": np.asarray(model_landslide.coef_, dtype=float).tolist(),
            "intercept": float(model_landslide.intercept_)
        }
    }
    
    with open(MODEL_WEIGHTS_FILE, "w") as f:
        json.dump(weights, f, indent=2)
        
    print(f"\nSaved model weights to {MODEL_WEIGHTS_FILE}")

if __name__ == "__main__":
    train_linear_model()
