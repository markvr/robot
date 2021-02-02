#!/usr/bin/python3

import sys
from adafruit_servokit import ServoKit

kit = ServoKit(channels=16)

channels = sys.argv[1].split(',')
angle = sys.argv[2]
for channel in channels:
  print("Setting channel " + str(channel) + " to angle " + str(angle))
  kit.servo[int(channel)].angle = int(angle)



