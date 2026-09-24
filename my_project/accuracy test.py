
# LogisticRegression
# Flash Flood Prediction - Demo Accuracy Test

import pandas as pd
import numpy as np
import os

# ============================================================
# LOAD CSV FROM SAME FOLDER AS THIS PYTHON FILE
# ============================================================

file_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "india_flash_flood_10000.csv"
)

print("CSV location:")
print(file_path)

# Check if file exists
if not os.path.exists(file_path):
    print("\nERROR: CSV FILE NOT FOUND!")
    print("\nMake sure your folder looks like this:")
    print("""
    my_project/
    |
    |-- accuracy test.py
    |
    |-- india_flash_flood_10000.csv
    """)
    exit()

# Load CSV
df = pd.read_csv(file_path)

print("\nCSV loaded successfully!")

# ============================================================
# BASIC INFORMATION
# ============================================================

print("\nNumber of rows:", len(df))
print("Number of columns:", len(df.columns))

print("\nColumn names:")
print(df.columns.tolist())

# ============================================================
# CHECK NULL VALUES
# ============================================================

null = df.isnull().sum()

print("\nNull values:")
print(null)

# Fill missing values
df = df.fillna(0)

# ============================================================
# CHECK DATA
# ============================================================

print("\nFirst 5 rows:")
print(df.head())

print("\nLast 5 rows:")
print(df.tail())

# ============================================================
# SELECT INPUT AND TARGET
# ============================================================

target_column = "flood_next_3h"

# Check target exists
if target_column not in df.columns:
    print("\nERROR:")
    print("Column 'flood_next_3h' was not found.")
    print("\nAvailable columns are:")
    print(df.columns.tolist())
    exit()

# X = input features
x = df.drop(columns=[target_column])

# Remove text columns
x = x.select_dtypes(include=[np.number])

# y = target
y = df[target_column]

print("\nTarget column:", target_column)

print("\nTarget distribution:")
print(y.value_counts())

# ============================================================
# TRAIN TEST SPLIT
# ============================================================

from sklearn.model_selection import train_test_split

x_train, x_test, y_train, y_test = train_test_split(
    x,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("\nTraining data:", x_train.shape)
print("Testing data:", x_test.shape)

# ============================================================
# STANDARDIZATION
# ============================================================

from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()

x_train = scaler.fit_transform(x_train)

x_test = scaler.transform(x_test)

# ============================================================
# LOGISTIC REGRESSION
# ============================================================

from sklearn.linear_model import LogisticRegression

model = LogisticRegression(
    max_iter=10000
)

model.fit(
    x_train,
    y_train
)

# ============================================================
# PREDICTION
# ============================================================

y_pred = model.predict(x_test)

print("\nPredicted values:")
print(y_pred)

# ============================================================
# FLOOD PROBABILITY
# ============================================================

y_probability = model.predict_proba(x_test)[:, 1]

print("\nFirst 20 flood probabilities:")

for i in range(min(20, len(y_probability))):

    print(
        f"Actual: {y_test.iloc[i]} | "
        f"Predicted: {y_pred[i]} | "
        f"Flood Probability: {y_probability[i] * 100:.2f}%"
    )

# ============================================================
# METRICS
# ============================================================

from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    classification_report,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)

# Accuracy
accuracy = accuracy_score(
    y_test,
    y_pred
)

# Precision
precision = precision_score(
    y_test,
    y_pred,
    zero_division=0
)

# Recall
recall = recall_score(
    y_test,
    y_pred,
    zero_division=0
)

# F1
f1 = f1_score(
    y_test,
    y_pred,
    zero_division=0
)

# ROC-AUC
roc_auc = roc_auc_score(
    y_test,
    y_probability
)

# ============================================================
# RESULTS
# ============================================================

print("\n==============================================")
print("       FLASH FLOOD MODEL RESULTS")
print("==============================================")

print(
    "Accuracy:",
    round(accuracy * 100, 2),
    "%"
)

print(
    "Precision:",
    round(precision * 100, 2),
    "%"
)

print(
    "Recall:",
    round(recall * 100, 2),
    "%"
)

print(
    "F1 Score:",
    round(f1 * 100, 2),
    "%"
)

print(
    "ROC-AUC:",
    round(roc_auc, 4)
)

# ============================================================
# CONFUSION MATRIX
# ============================================================

print("\nConfusion Matrix:")

cm = confusion_matrix(
    y_test,
    y_pred
)

print(cm)

# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        y_pred,
        target_names=[
            "No Flood",
            "Flood"
        ],
        zero_division=0
    )
)

# ============================================================
# FINAL
# ============================================================

print("\n==============================================")
print("MODEL TRAINING COMPLETE")
print("==============================================")

print("Dataset:")
print("india_flash_flood_10000.csv")

print("Model:")
print("Logistic Regression")

print("Target:")
print("flood_next_3h")

print("==============================================")








# ============================================================
# THRESHOLD ANALYSIS
# ============================================================

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)

print("\n==============================================")
print("       FLOOD WARNING THRESHOLD ANALYSIS")
print("==============================================")

thresholds = [
    0.20,
    0.25,
    0.30,
    0.35,
    0.40,
    0.45,
    0.50,
    0.55,
    0.60,
    0.65,
    0.70
]

print(
    "\nThreshold | Accuracy | Precision | Recall | F1"
)

print("-" * 55)

for threshold in thresholds:

    # Convert probability into prediction
    y_threshold_pred = (
        y_probability >= threshold
    ).astype(int)

    accuracy = accuracy_score(
        y_test,
        y_threshold_pred
    )

    precision = precision_score(
        y_test,
        y_threshold_pred,
        zero_division=0
    )

    recall = recall_score(
        y_test,
        y_threshold_pred,
        zero_division=0
    )

    f1 = f1_score(
        y_test,
        y_threshold_pred,
        zero_division=0
    )

    print(
        f"{threshold:8.2f} | "
        f"{accuracy:8.3f} | "
        f"{precision:9.3f} | "
        f"{recall:6.3f} | "
        f"{f1:6.3f}"
    )


# ============================================================
# DETAILED RESULTS FOR 30% THRESHOLD
# ============================================================

threshold = 0.30

y_threshold_pred = (
    y_probability >= threshold
).astype(int)

print("\n==============================================")
print("RESULTS AT 30% FLOOD PROBABILITY")
print("==============================================")

print(
    "Accuracy:",
    round(
        accuracy_score(
            y_test,
            y_threshold_pred
        ) * 100,
        2
    ),
    "%"
)

print(
    "Precision:",
    round(
        precision_score(
            y_test,
            y_threshold_pred,
            zero_division=0
        ) * 100,
        2
    ),
    "%"
)

print(
    "Recall:",
    round(
        recall_score(
            y_test,
            y_threshold_pred,
            zero_division=0
        ) * 100,
        2
    ),
    "%"
)

print(
    "F1 Score:",
    round(
        f1_score(
            y_test,
            y_threshold_pred,
            zero_division=0
        ) * 100,
        2
    ),
    "%"
)

print("\nConfusion Matrix:")

print(
    confusion_matrix(
        y_test,
        y_threshold_pred
    )
)

print("==============================================")

