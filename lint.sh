#!/bin/sh

flake8 *py pyplotdesigner/*py pyplotdesigner/*/*py
pylint --rcfile=setup.cfg *py pyplotdesigner/*py pyplotdesigner/*/*py

