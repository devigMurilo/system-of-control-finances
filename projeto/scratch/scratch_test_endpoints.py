import requests

try:
    print("Testing GET /api/dashboard/...")
    r = requests.get("http://localhost:8000/api/dashboard/")
    print("Status:", r.status_code)
    print("Response:", r.json())
except Exception as e:
    print("Error:", e)

try:
    print("\nTesting POST /openfinance/extratos/ without auth...")
    r = requests.post("http://localhost:8000/openfinance/extratos/", json={
        "payer_cpf_cnpj": "12442717484",
        "account_hash": "dummy_hash",
        "today": True
    })
    print("Status:", r.status_code)
    print("Response:", r.text)
except Exception as e:
    print("Error:", e)
