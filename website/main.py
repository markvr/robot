from flask import Flask
from flask import request
from lib.Robot import Robot
import logging

log = logging.getLogger("werkzeug")
log.disabled = True

app = Flask(__name__)

robot = Robot()


@app.route("/api/move", methods=["POST"])
def move():
    data = request.json
    print(data)
    robot.move(data["limb"], float(data["value"]))
    return "ok"


@app.route("/api/set", methods=["POST"])
def set():
    data = request.json
    print(data)
    for key, value in data.items():
        robot.move(key, float(value))
    return "ok"


@app.route("/api/slow-set", methods=["POST"])
def slowSet():
    data = request.json
    print(data)
    robot.slowSetWrapper(data)
    return "ok"


@app.route("/api/set-position", methods=["POST"])
def setPosition():
    data = request.json
    print(data)
    robot.setPosition(float(data["length"]), float(data["height"]))
    return "ok"
