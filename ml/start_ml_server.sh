#!/bin/bash

# Start the ML recommendation server

echo "Starting CodeFit ML Recommendation Server..."
echo "Make sure you have installed the required packages:"
echo "pip install -r requirements.txt"
echo ""

# Check if Python is available
if command -v python3 &>/dev/null; then
    PYTHON_CMD=python3
elif command -v python &>/dev/null; then
    PYTHON_CMD=python
else
    echo "Error: Python not found. Please install Python 3.7 or later."
    exit 1
fi

# Check if the recommender.py file exists
if [ ! -f "recommender.py" ]; then
    echo "Error: recommender.py not found in the current directory."
    echo "Please make sure you are running this script from the ml/ directory."
    exit 1
fi

# Check if requirements.txt exists and remind user to install dependencies
if [ -f "requirements.txt" ]; then
    echo "Checking for required packages..."
    $PYTHON_CMD -c "
import pkg_resources
import sys
required = {line.strip() for line in open('requirements.txt')}
installed = {pkg.key for pkg in pkg_resources.working_set}
missing = required - installed
if missing:
    print('Missing packages: ' + ', '.join(missing))
    print('Please install required packages: pip install -r requirements.txt')
    sys.exit(1)
else:
    print('All required packages are installed.')
"
    if [ $? -ne 0 ]; then
        echo "Would you like to install the missing packages now? (y/n)"
        read -r answer
        if [ "$answer" = "y" ]; then
            $PYTHON_CMD -m pip install -r requirements.txt
        else
            echo "Please install the required packages before running the server."
            exit 1
        fi
    fi
fi

# Start the server
echo "Starting ML server on http://localhost:5000"
$PYTHON_CMD recommender.py

echo "Server stopped."
