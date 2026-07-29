import sqlite3
import json

conn = sqlite3.connect("projeto/backend/db.sqlite3")
cursor = conn.cursor()

# Get list of tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables in DB:", tables)

# Let's inspect rows in finances_account and finances_transaction
for table in ['finances_account', 'finances_transaction']:
    try:
        cursor.execute(f"SELECT * FROM {table} LIMIT 5;")
        rows = cursor.fetchall()
        print(f"\nRows in {table}:")
        for r in rows:
            print(r)
    except Exception as e:
        print(f"Error reading {table}: {e}")

conn.close()
