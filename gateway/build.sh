#!/bin/bash
if [ -d build ]; then rm -r build; fi
mkdir build

PYTHON_VER=$(python -V |  sed 's/Python \([0-9]\+\.[0-9]\+\)\..*/python\1/')
echo PYTHON_VER=$PYTHON_VER
python -m venv build/venv
source build/venv/bin/activate
pip install -r requirements.txt
deactivate

cp -r "build/venv/lib/$PYTHON_VER/site-packages build/python"
bash -c "cd build; zip -r layer.zip python -x '*/__pycache__/*'"
zip -r build/code.zip gateway_api

