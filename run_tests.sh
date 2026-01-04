# Create venv if not exists
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

source .venv/bin/activate

echo "Upgrading build tools..."
pip install --upgrade pip setuptools wheel

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Running tests..."
# We set DATABASE_URL to memory for testing logic, but our code uses asyncpg which needs a real server usually.
# However, for the health check test, it doesn't hit DB.
# For register test, it might fail if no Postgres.
# Let's run just health check first.
PYTHONPATH=. pytest tests/unit/test_auth.py -k "health" -v
