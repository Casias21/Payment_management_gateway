from flask import Flask, request, jsonify
import time
import random
import threading
from collections import deque
import os

app = Flask(__name__)

# --- Rate Limiter Configuration (2 TPS) ---
# This is a simple sliding window log for demonstration
# In a real scenario, a more robust distributed rate limiter would be used.
REQUEST_LIMIT = 2 # requests per second
WINDOW_SIZE_SECONDS = 1
request_timestamps = deque()
lock = threading.Lock()

def check_rate_limit():
    global request_timestamps
    current_time = time.time()

    with lock:
        # Remove timestamps older than the window
        while request_timestamps and request_timestamps[0] <= current_time - WINDOW_SIZE_SECONDS:
            request_timestamps.popleft()

        # Check if current requests exceed the limit
        if len(request_timestamps) >= REQUEST_LIMIT:
            return False # Rate limit exceeded
        else:
            request_timestamps.append(current_time)
            return True # Request allowed

# --- Mock Provider Logic ---
SUCCESS_RATE_PERCENT = int(os.getenv('MOCK_PROVIDER_SUCCESS_RATE', '70')) # 70% success by default
TRANSIENT_FAILURE_RATE_PERCENT = int(os.getenv('MOCK_PROVIDER_TRANSIENT_RATE', '20')) # 20% transient failure
PERMANENT_FAILURE_RATE_PERCENT = int(os.getenv('MOCK_PROVIDER_PERMANENT_RATE', '10')) # 10% permanent failure
LATENCY_MS_MIN = int(os.getenv('MOCK_PROVIDER_LATENCY_MIN', '200'))
LATENCY_MS_MAX = int(os.getenv('MOCK_PROVIDER_LATENCY_MAX', '1000'))

@app.route('/process-payment', methods=['POST'])
def process_payment():
    if not check_rate_limit():
        print("Mock Provider: Rate limit exceeded. Denying request.")
        return jsonify({"status": "RETRYING", "message": "Rate limit exceeded. Try again."}), 429 # Too Many Requests

    data = request.get_json()
    payment_id = data.get('id', 'N/A')
    print(f"Mock Provider: Received request for payment ID: {payment_id}")

    # Simulate latency
    latency = random.randint(LATENCY_MS_MIN, LATENCY_MS_MAX) / 1000.0
    time.sleep(latency)
    print(f"Mock Provider: Payment {payment_id} - Simulated latency: {latency*1000:.2f}ms")

    # Simulate different outcomes based on configured rates
    outcome = random.randint(1, 100)
    if outcome <= SUCCESS_RATE_PERCENT:
        print(f"Mock Provider: Payment {payment_id} - Simulating success (COMPLETED)")
        return jsonify({"status": "COMPLETED", "message": "Payment successful"}), 200
    elif outcome <= SUCCESS_RATE_PERCENT + TRANSIENT_FAILURE_RATE_PERCENT:
        print(f"Mock Provider: Payment {payment_id} - Simulating transient failure (RETRYING)")
        return jsonify({"status": "RETRYING", "message": "Transient error, please retry"}), 503 # Service Unavailable
    else:
        print(f"Mock Provider: Payment {payment_id} - Simulating permanent failure (FAILED)")
        return jsonify({"status": "FAILED", "message": "Permanent rejection"}), 400 # Bad Request

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

