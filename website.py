from flask import Flask, request, make_response, redirect
from lib.Robot import Robot
import logging
import string
import random
from collections import deque
import time
from picamera import PiCamera
from io import BytesIO

log = logging.getLogger("werkzeug")
log.disabled = True

app = Flask(__name__)

robot = Robot()

camera = PiCamera()
camera.resolution = (1920, 1080)

# Queue for incoming requests.
requestQ = deque([])

@app.route('/')
def root():
    return redirect("/static/index.html", code=302)

@app.route("/api/set", methods=["POST"])
def set():
    """Sets the arms to the given positions.

    If called with '?slow' then moves arms slowly and returns when complete,
    otherwise sets servos directly and returns immediately.

    Queues incoming requests, and executes one request at a time.

    Request body must be JSON as: {
      limb : value,
      ....
    }
    e.g. {
      "head": "45",
      ...
    }

    """
    reqId = getRandomString()
    requestQ.append(reqId)
    print("Added " + reqId + " to Q")
    while requestQ[0] != reqId:
        print(reqId + " is waiting, Q is " + str(list(requestQ)))
        time.sleep(0.5)
    print("Running " + reqId)
    try:
        data = request.json

        if "slow" in request.args:
            robot.slowSetWrapper(data)
        else:
            for key, value in data.items():
                robot.move(key, float(value))
        return "ok"
    finally:
        id = requestQ.popleft()
        print("Ended " + id)

@app.route("/api/image.jpg")
def getImage():
    stream = BytesIO()
    camera.capture(stream, format='jpeg')
    response = make_response(stream.getvalue())
    response.headers['content-type'] = 'image/jpeg'
    return response

def getRandomString():
    letters = string.ascii_lowercase
    return "".join(random.choice(letters) for i in range(10))