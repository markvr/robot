from io import BytesIO
from time import sleep
from picamera import PiCamera

camera = PiCamera()
camera.resolution = (1024, 768)
sleep(2)
stream = BytesIO()
camera.capture(stream, format='jpeg')
 response = app.make_response(buf.getvalue())