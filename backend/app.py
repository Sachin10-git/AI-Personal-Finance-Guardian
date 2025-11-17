# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import joblib
import os
import mysql.connector
import time

app = Flask(__name__)
CORS(app)

# ---------------------------
# MODEL LOADING
# ---------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "isolation_forest_paysim.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "scaler_paysim.pkl")

try:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    MODEL_READY = True
except Exception as e:
    MODEL_READY = False
    print("⚠ WARNING: Model/Scaler could not be loaded:", e)


# ---------------------------
# MYSQL CONNECTION
# ---------------------------
def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Sachin10@mysql",
        database="fraud_guardian"
    )


# ---------------------------
# TYPE ENCODER (Matches PAYSIM dataset)
# ---------------------------
def encode_type(t):
    if not t:
        return 3  # PAYMENT default
    key = str(t).upper().replace(" ", "").replace("_", "")
    mapping = {
        "CASHIN": 0,
        "CASHOUT": 1,
        "DEBIT": 2,
        "PAYMENT": 3,
        "TRANSFER": 4
    }
    return mapping.get(key, 3)


# ---------------------------
# SAFE FLOAT CONVERTER
# ---------------------------
def safe_num(x):
    try:
        return float(x)
    except:
        return None


# ---------------------------
# POST /predict
# ---------------------------
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json or {}

        required = [
            "step", "type", "amount",
            "oldbalanceOrg", "newbalanceOrig",
            "oldbalanceDest", "newbalanceDest"
        ]

        # Validate required fields
        for r in required:
            if r not in data:
                return jsonify({"error": f"Missing field '{r}'"}), 400

        # Normalize numeric fields
        step = safe_num(data.get("step"))
        amount = safe_num(data.get("amount"))
        oldbalanceOrg = safe_num(data.get("oldbalanceOrg"))
        newbalanceOrig = safe_num(data.get("newbalanceOrig"))
        oldbalanceDest = safe_num(data.get("oldbalanceDest"))
        newbalanceDest = safe_num(data.get("newbalanceDest"))

        for name, val in [
            ("step", step),
            ("amount", amount),
            ("oldbalanceOrg", oldbalanceOrg),
            ("newbalanceOrig", newbalanceOrig),
            ("oldbalanceDest", oldbalanceDest),
            ("newbalanceDest", newbalanceDest)
        ]:
            if val is None or np.isnan(val):
                return jsonify({"error": f"Invalid numeric value for '{name}'"}), 400

        # Encode transaction type
        t_encoded = encode_type(data.get("type"))

        # Prepare model input
        features = np.array([[
            step, t_encoded, amount,
            oldbalanceOrg, newbalanceOrig,
            oldbalanceDest, newbalanceDest
        ]])

        # ---------------------------
        # PREDICT (if model available)
        # ---------------------------
        if MODEL_READY:
            scaled = scaler.transform(features)
            pred_raw = int(model.predict(scaled)[0])  # -1 or 1
            score = float(model.decision_function(scaled)[0])
            anomaly_flag = 1 if pred_raw == -1 else 0
            status = "Suspicious" if anomaly_flag == 1 else "Normal"
        else:
            anomaly_flag = 0
            score = None
            status = "Unknown"

        # ---------------------------
        # SAVE TO DATABASE
        # ---------------------------
        timestamp_ms = int(time.time() * 1000)

        db = get_db()
        cursor = db.cursor()

        q = """
            INSERT INTO transactions
            (status, amount, score, time, step, type,
             oldbalanceOrg, newbalanceOrig, oldbalanceDest, newbalanceDest)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """

        cursor.execute(q, (
            status,
            amount,
            score,
            timestamp_ms,
            int(step),
            str(data.get("type")),
            oldbalanceOrg,
            newbalanceOrig,
            oldbalanceDest,
            newbalanceDest
        ))

        db.commit()
        new_id = cursor.lastrowid
        cursor.close()
        db.close()

        return jsonify({
            "id": new_id,
            "status": status,
            "anomaly": anomaly_flag,
            "anomaly_score": score,
            "time": timestamp_ms
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------
# GET /history
# ---------------------------
@app.route("/history", methods=["GET"])
def history():
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, status, amount, score, time, step, type,
                   oldbalanceOrg, newbalanceOrig, oldbalanceDest, newbalanceDest
            FROM transactions
            ORDER BY id DESC
        """)
        rows = cursor.fetchall()
        cursor.close()
        db.close()
        return jsonify(rows)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------
# GET /alerts
# ---------------------------
@app.route("/alerts", methods=["GET"])
def alerts():
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, status, amount, score, time, type
            FROM transactions
            WHERE status='Suspicious'
            ORDER BY id DESC
        """)
        rows = cursor.fetchall()
        cursor.close()
        db.close()
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------
# GET /latest
# ---------------------------
@app.route("/latest", methods=["GET"])
def latest():
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT *
            FROM transactions
            ORDER BY id DESC
            LIMIT 1
        """)
        row = cursor.fetchone()
        cursor.close()
        db.close()
        return jsonify(row or {})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------
# DELETE /clear-history
# ---------------------------
@app.route("/clear-history", methods=["DELETE"])
def clear_history():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("DELETE FROM transactions")
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"message": "History cleared"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------
# START SERVER
# ---------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
