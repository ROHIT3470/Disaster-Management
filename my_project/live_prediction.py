import os
import sys
import time
import pickle
from datetime import datetime
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(BASE_DIR, "flash_flood_model.pkl")

# List of target CSV datasets in the project folder
TARGET_CSVS = [
    "Forecast Rainfall Data.csv",
    "Assam river water level Forecast_2026_2030.csv",
    "GPM_3IMERGDF_07_regional.csv",
    "Historical Rainfall Data.csv",
    "Assam river water level historical_2021_2025.csv"
]

# Delay per row (seconds) to simulate live streaming telemetry
PREDICTION_DELAY = 0.15 
ALERT_PROBABILITY_THRESHOLD = 0.20  # Detailed alert card generated if probability >= 20%

if not os.path.exists(MODEL_FILE):
    print("\n[ERROR] flash_flood_model.pkl not found.")
    print("Please run 'train_model.py' first to build and save the model package.")
    sys.exit(1)

try:
    with open(MODEL_FILE, "rb") as file:
        package = pickle.load(file)

    model = package["model"]
    scaler = package["scaler"]
    FEATURES = package["features"]
    MODEL_THRESHOLD = package.get("threshold", 0.30)
except Exception as e:
    print(f"\n[ERROR] Could not load model file: {e}")
    sys.exit(1)

print("\n" + "=" * 65)
print("       FLASH FLOOD AI CSV DATA MONITOR & HAZARD EVALUATOR")
print("=" * 65)
print(f"AI Model Status    : Loaded ({len(FEATURES)} hydrological features)")
print(f"Warning Threshold  : {MODEL_THRESHOLD * 100:.0f}% probability")
print(f"Display Mode       : Full Table Summary + Risk Alert Cards (>= {ALERT_PROBABILITY_THRESHOLD * 100:.0f}%)")
print("Press CTRL+C at any time to stop monitoring.\n")

def get_risk(probability):
    """Translates float probability into risk category and emoji indicator."""
    if probability < 0.20:
        return "LOW", "🟢"
    elif probability < 0.30:
        return "WATCH", "🟡"
    elif probability < 0.50:
        return "WARNING", "🟠"
    elif probability < 0.70:
        return "HIGH RISK", "🔴"
    else:
        return "EXTREME RISK", "🚨"

def rainfall_level(value):
    """Classifies hourly rainfall intensity."""
    if value >= 100: return "EXTREME"
    elif value >= 50: return "VERY HIGH"
    elif value >= 25: return "HIGH"
    elif value >= 10: return "MODERATE"
    else: return "LOW"

def soil_level(value):
    """Classifies soil moisture saturation level."""
    if value >= 90: return "CRITICAL"
    elif value >= 80: return "VERY HIGH"
    elif value >= 65: return "HIGH"
    elif value >= 40: return "MODERATE"
    else: return "LOW"

def water_level_status(value):
    """Classifies hourly river water level change in meters."""
    if value >= 0.50: return "RISING RAPIDLY"
    elif value >= 0.25: return "RISING"
    elif value > 0: return "RISING SLOWLY"
    else: return "STABLE"

def slope_level(value):
    """Classifies steepness of regional terrain."""
    if value >= 35: return "VERY HIGH"
    elif value >= 25: return "HIGH RISK"
    elif value >= 15: return "MODERATE"
    else: return "LOW"

def estimate_escalation(probability, rainfall, water_change):
    """Estimates time window until potential flood escalation."""
    if probability >= 0.75 or (probability >= 0.60 and rainfall >= 75 and water_change >= 0.40):
        return "1-2 hours"
    elif probability >= 0.50 or (probability >= 0.40 and rainfall >= 50):
        return "2-4 hours"
    elif probability >= 0.30:
        return "4-8 hours"
    elif probability >= 0.20:
        return "8-12 hours"
    else:
        return "No immediate escalation"

def calculate_priority(probability, slope, water_change, soil):
    """Calculates response priority level for disaster management teams."""
    score = 0
    if probability >= 0.70: score += 4
    elif probability >= 0.50: score += 3
    elif probability >= 0.30: score += 2
    elif probability >= 0.20: score += 1

    if slope >= 35: score += 2
    elif slope >= 25: score += 1

    if water_change >= 0.50: score += 2
    elif water_change >= 0.25: score += 1

    if soil >= 90: score += 2
    elif soil >= 80: score += 1

    if score >= 7: return "CRITICAL"
    elif score >= 5: return "HIGH"
    elif score >= 3: return "MEDIUM"
    else: return "LOW"

def find_primary_factors(mapped_row):
    """Identifies key hazard drivers contributing to elevated risk."""
    factors = []
    rainfall = mapped_row.get("rainfall_1h_mm", 0)
    soil = mapped_row.get("soil_moisture_pct", 0)
    water = mapped_row.get("water_level_change_1h_m", 0)
    slope = mapped_row.get("slope_degree", 0)
    forecast = mapped_row.get("forecast_rainfall_3h_mm", 0)

    if rainfall >= 50: factors.append("Extreme current rainfall")
    if forecast >= 75: factors.append("Heavy forecast rainfall accumulation")
    if soil >= 80: factors.append("High soil saturation")
    if water >= 0.25: factors.append("Rapid river water level rise")
    if slope >= 25: factors.append("Steep mountain terrain")

    if not factors:
        factors.append("Sustained hydrological baseline")
    return factors

def load_csv_smart(filepath):
    """
    Robustly parses meteorological and hydrological CSV files.
    Auto-detects header row position and bypasses metadata text comments.
    """
    if not os.path.exists(filepath):
        return pd.DataFrame()

    encodings = ['utf-8', 'latin1', 'cp1252']
    
    # 1. Attempt standard load first
    for enc in encodings:
        try:
            df = pd.read_csv(filepath, encoding=enc, comment='#', on_bad_lines='skip')
            if not df.empty and len(df.columns) > 1:
                return df
        except Exception:
            continue

    # 2. Scan top 50 lines to find exact table header row index
    header_idx = None
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            lines = [f.readline() for _ in range(50)]
        
        keywords = ['date', 'time', 'rain', 'precip', 'water', 'level', 'station', 'lat', 'lon', 'val', 'year', 'district']
        for idx, line in enumerate(lines):
            line_str = line.lower()
            if ',' in line_str and any(kw in line_str for kw in keywords):
                header_idx = idx
                break
    except Exception:
        pass

    if header_idx is not None:
        for enc in encodings:
            try:
                df = pd.read_csv(
                    filepath,
                    skiprows=header_idx,
                    encoding=enc,
                    comment='#',
                    on_bad_lines='skip',
                    engine='python'
                )
                if not df.empty and len(df.columns) > 1:
                    return df
            except Exception:
                continue

    return pd.DataFrame()

def map_csv_row_to_features(raw_row):
    """
    Maps arbitrary CSV columns into the 28 numerical features required by the AI.
    """
    mapped = {}

    # Display Metadata
    mapped["timestamp"] = str(raw_row.get("Date", raw_row.get("time", raw_row.get("timestamp", raw_row.get("YEAR", datetime.now().strftime("%Y-%m-%d"))))))
    mapped["state"] = str(raw_row.get("State", "Assam"))
    mapped["district"] = str(raw_row.get("District", raw_row.get("district", "Assam Region")))
    mapped["location_id"] = str(raw_row.get("Station", raw_row.get("station_id", raw_row.get("STATION", "ST_01"))))

    def get_num(names, default=0.0):
        for name in names:
            for k in raw_row.keys():
                if name.lower() in str(k).lower():
                    val = raw_row[k]
                    if pd.notna(val):
                        try:
                            return float(val)
                        except (ValueError, TypeError):
                            continue
        return default

    # Rainfall Extraction
    rain = get_num(["rain", "precip", "precipitation", "val", "rf"], default=0.0)
    mapped["rainfall_15min_mm"] = rain * 0.25
    mapped["rainfall_1h_mm"] = rain
    mapped["rainfall_3h_mm"] = rain * 2.5
    mapped["rainfall_6h_mm"] = rain * 4.0
    mapped["rainfall_12h_mm"] = rain * 6.0
    mapped["rainfall_24h_mm"] = rain * 10.0
    mapped["rainfall_72h_mm"] = rain * 20.0

    forecast_rain = get_num(["forecast_rain", "forecast", "future_rain"], default=rain)
    mapped["forecast_rainfall_1h_mm"] = forecast_rain
    mapped["forecast_rainfall_3h_mm"] = forecast_rain * 3.0
    mapped["forecast_rainfall_6h_mm"] = forecast_rain * 5.0

    # Water Level Extraction
    water_level = get_num(["water_level", "water", "level", "stage", "val"], default=5.0)
    water_change = get_num(["change", "diff", "rise"], default=0.0)
    if water_change == 0.0 and rain > 0:
        water_change = (rain / 120.0) + np.random.uniform(-0.02, 0.06)

    mapped["water_level_m"] = water_level
    mapped["water_level_change_1h_m"] = water_change

    # Geography & Soil Parameters
    mapped["latitude"] = get_num(["lat", "latitude"], default=26.20)
    mapped["longitude"] = get_num(["lon", "longitude"], default=92.93)
    mapped["elevation_m"] = get_num(["elevation", "elev"], default=150.0)
    mapped["slope_degree"] = get_num(["slope"], default=18.0)
    mapped["catchment_area_km2"] = get_num(["catchment", "area"], default=50.0)
    mapped["distance_to_river_km"] = get_num(["distance", "river_dist"], default=1.0)

    mapped["soil_moisture_pct"] = get_num(["soil", "moisture"], default=min(45.0 + (rain * 1.5), 98.0))
    mapped["soil_moisture_change_3h_pct"] = get_num(["soil_change"], default=2.0)

    mapped["temperature_c"] = get_num(["temp", "temperature"], default=28.0)
    mapped["humidity_pct"] = get_num(["humidity", "hum"], default=85.0)

    mapped["historical_flood_frequency"] = get_num(["hist_flood"], default=5.0)
    mapped["historical_landslide_frequency"] = get_num(["hist_landslide"], default=2.0)
    mapped["flood_susceptibility_score"] = get_num(["flood_susceptibility"], default=0.75)
    mapped["landslide_susceptibility_score"] = get_num(["landslide_susceptibility"], default=0.50)

    mapped["sensor_data_available"] = 1.0
    mapped["data_quality_score"] = 0.95

    return mapped

def process_single_row(mapped_row):
    """Feeds mapped features into model, returns risk dictionary."""
    input_df = pd.DataFrame(
        [[mapped_row.get(feat, 0.0) for feat in FEATURES]],
        columns=FEATURES
    )

    try:
        input_scaled = scaler.transform(input_df)
        prob = model.predict_proba(input_scaled)[0][1]
    except Exception as e:
        return None, f"Inference Error: {e}"

    risk, icon = get_risk(prob)
    priority = calculate_priority(prob, mapped_row["slope_degree"], mapped_row["water_level_change_1h_m"], mapped_row["soil_moisture_pct"])
    escalation = estimate_escalation(prob, mapped_row["rainfall_1h_mm"], mapped_row["water_level_change_1h_m"])
    factors = find_primary_factors(mapped_row)

    res = {
        "probability": prob,
        "probability_pct": prob * 100.0,
        "risk": risk,
        "icon": icon,
        "priority": priority,
        "escalation": escalation,
        "factors": factors,
        "mapped": mapped_row
    }
    return res, None

def display_alert_card(res):
    """Prints formatted warning card for elevated risk rows."""
    m = res["mapped"]
    print("\n" + "█" * 65)
    print(f"       {res['icon']} FLASH FLOOD ALERT: {res['risk']} ({res['probability_pct']:.2f}%)")
    print("█" * 65)
    print(f"Response Priority : {res['priority']}")
    print(f"Est. Escalation   : {res['escalation']}")
    print("-" * 65)
    print(f"Rainfall (1h)     : {m['rainfall_1h_mm']:.2f} mm ({rainfall_level(m['rainfall_1h_mm'])})")
    print(f"Soil Saturation   : {m['soil_moisture_pct']:.2f}% ({soil_level(m['soil_moisture_pct'])})")
    print(f"Water Rise (1h)   : {m['water_level_change_1h_m']:.2f} m ({water_level_status(m['water_level_change_1h_m'])})")
    print(f"Terrain Slope     : {m['slope_degree']:.2f}° ({slope_level(m['slope_degree'])})")
    print("-" * 65)
    print(f"Location          : {m.get('district', 'N/A')}, {m.get('state', 'Assam')}")
    print(f"Station / ID      : {m.get('location_id', 'N/A')}")
    print(f"Timestamp         : {m.get('timestamp', 'N/A')}")
    print("-" * 65)
    print("Primary Factors:")
    for f in res["factors"]:
        print(f"  ✓ {f}")

    if res["probability"] >= 0.70:
        print("\n🚨 RECOMMENDED ACTION: Immediate emergency response & local evacuation!")
    elif res["probability"] >= 0.50:
        print("\n🔴 RECOMMENDED ACTION: Issue public flood warning & prepare response units.")
    elif res["probability"] >= 0.30:
        print("\n🟠 RECOMMENDED ACTION: High alert monitoring & river gauge check.")
    else:
        print("\n🟡 RECOMMENDED ACTION: Flood watch active. Continue telemetry monitoring.")
    print("█" * 65 + "\n")

def process_csv_dataset(filename):
    """Processes target CSV dataset row by row and prints evaluation table."""
    filepath = os.path.join(BASE_DIR, filename)
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Processing Dataset: {filename}")
    
    df = load_csv_smart(filepath)
    if df.empty:
        print(f"  └─ [WARNING] Could not parse rows from {filename}. Check file integrity.")
        return

    total_rows = len(df)
    print(f"  └─ Successfully loaded {total_rows} records. Evaluating risk...\n")

    # Table Header
    print(f"{'Row':<6} | {'Timestamp / ID':<22} | {'Rain(1h)':<10} | {'WaterRise':<10} | {'Flood Prob':<12} | {'Risk Status':<12}")
    print("-" * 82)

    alert_count = 0
    for row_num, (_, row) in enumerate(df.iterrows(), start=1):
        raw_dict = row.to_dict()
        mapped_data = map_csv_row_to_features(raw_dict)
        res, err = process_single_row(mapped_data)

        if err or res is None:
            print(f"{row_num:<6} | ERROR: {err or 'Inference failed for this row'}")
            continue

        prob_str = f"{res['probability_pct']:.2f}%"
        rain_str = f"{mapped_data['rainfall_1h_mm']:.2f} mm"
        water_str = f"{mapped_data['water_level_change_1h_m']:.2f} m"
        id_str = str(mapped_data.get('timestamp', mapped_data.get('location_id', 'Row')))[:22]

        print(f"{row_num:<6} | {id_str:<22} | {rain_str:<10} | {water_str:<10} | {prob_str:<12} | {res['icon']} {res['risk']}")

        if res["probability"] >= ALERT_PROBABILITY_THRESHOLD:
            display_alert_card(res)
            alert_count += 1

        time.sleep(PREDICTION_DELAY)

    print("-" * 82)
    print(f"Summary for {filename}: {total_rows} rows analyzed | {alert_count} Elevated Alerts Triggered.\n")

if __name__ == "__main__":
    print("Scanning directory for hydrological CSV datasets...")
    found_files = []
    for fname in TARGET_CSVS:
        fpath = os.path.join(BASE_DIR, fname)
        if os.path.exists(fpath):
            found_files.append(fname)
            print(f"  ✓ Found target file: {fname}")
        else:
            print(f"  ✗ File missing: {fname}")

    if not found_files:
        print("\n[ERROR] No target CSV files found in directory.")
        sys.exit(1)

    print("\nStarting batch evaluation on all available target datasets...\n")
    try:
        for fname in found_files:
            process_csv_dataset(fname)
    except KeyboardInterrupt:
        print("\n[HALTED] Batch prediction halted by user.")

    print("\n=================================================")
    print("       CSV BATCH EVALUATION COMPLETED")
    print("=================================================\n")