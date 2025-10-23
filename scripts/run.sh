#!/bin/bash
cd "$(dirname "$0")/.."

if ! command -v python3 &> /dev/null; then
    echo "Error: Python3 not found. Install Python 3.10+"
    exit 1
fi

python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
required_version="3.10"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "Error: Python 3.10 or higher required. Current version: $python_version"
    exit 1
fi

if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
    if [ $? -ne 0 ]; then
        echo "Error: Failed to create virtual environment."
        exit 1
    fi
fi

echo "Activating virtual environment..."
source .venv/bin/activate
if [ $? -ne 0 ]; then
    echo "Error: Failed to activate virtual environment."
    exit 1
fi

echo "Updating pip..."
python -m pip install --upgrade pip
if [ $? -ne 0 ]; then
    echo "Warning: Failed to update pip, continuing with current version."
fi

echo "Installing dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies."
    exit 1
fi

echo "Starting application..."
python3 -m src.main

echo "Application finished."
