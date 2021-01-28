import time
from adafruit_servokit import ServoKit
from lib.Arm import Arm
import numpy as np
import asyncio
import math

class Robot:

  kit = ServoKit(channels=16, frequency=200)
  delay = 0.01
  incrementAngle = 0.5

  open = 40
  closed = 100

  # Horizontal = 0
  # Vertical up = +90
  # Vertical down = -90

  lowerLength = 170.0
  upperLength = 170.0
  headLength = 120.0
  platformHeight = 70.0
  
  # Angle & Servo Settings
  # Servos face different ways, and have different effective/useful ranges in the arm.
  # We need a way to translate an arm angle that is intuitive/useful for us, into 
  # the actual angle for the servo.  The most intuitive way to think about the angles for a servo is
  # to treat it as a corner in a triangle, then:
  #  0   is closed
  #  90  is a right angle
  #  180 is fully open

  arms = {
    "turntable"  : Arm("turntable", [0], 0, 180, 0, inverse = True),
    "lower" : Arm("lower", [1,2], 0, 125, 0, inverse = True), # Raw angles: 90 = vertical, less (<90) = up/back, more (>90) = down/forward
    "upper" : Arm("upper", [3], 0, 110, 0), # Raw angles: 90 = right angles to lower, less (<90) = down, more (>90) = up  
    "head"  : Arm("head", [4], 0, 180, -90, inverse = True), # Raw angles: 90 = straight line, less (<90) = up, more (>90) = down
    "mouth"  : Arm("mouth", [5], 0, 180, 0) 
  }


  def move(self, arm, angle):
    arm = self.arms[arm]
    for servo in arm.servos:
      output = angle + arm.offset
      if arm.inverse:
        output = 180 - output
      print("Moving {servo} to {output}".format(servo=servo, output=output))
      self.kit.servo[servo].angle = output

  
  
  def slowSetWrapper(self, data):
    asyncio.run(self.slowSet(data))
  
  async def slowSet(self, data):
    actions = []
    for key, value in data.items():
        actions.append(self.asyncMove(key, float(value)))
    await asyncio.gather(*actions)
  
  async def asyncMove(self, arm, position, startDelay = 0):
    await asyncio.sleep(startDelay) 
    arm = self.arms[arm]
    start = int(round(self.kit.servo[arm.servos[0]].angle))
    end = position + arm.offset
    if arm.inverse:
      end = 180 - end
    
    increment = -1 * self.incrementAngle if start >= end else self.incrementAngle
    print("SetOne: Start: {start}, end {end}, increment {increment}".format(start=start,end=end, increment=increment))
    for i in np.arange(start, end, increment):
      for servo in arm.servos:
        self.kit.servo[servo].angle = i
      await asyncio.sleep(self.delay) 
    for servo in arm.servos:      
      self.kit.servo[servo].angle = end

  def setPosition(self, length, height):
    angles = self._calculateAngles(length, height)
    self.move("lower", angles['lower'])
    self.move("upper", angles['upper'])
    self.move("head", angles['head'])


  # Private Methods

  def _calculateAngles(self, length, height):
    hypotenuseLength = math.sqrt(length ** 2 + (height + self.headLength) ** 2)
    print(hypotenuseLength)

    a1 = math.degrees(math.acos( (self.lowerLength ** 2 + hypotenuseLength ** 2 - self.upperLength ** 2) / (2 * self.lowerLength * hypotenuseLength) ))
    a2 = math.degrees(math.atan( (height + self.headLength) / length))
    a = a1 + a2

    b = math.degrees(math.acos( (self.lowerLength ** 2 + self.upperLength ** 2 - hypotenuseLength ** 2) / (2 * self.lowerLength * self.upperLength) ))

    c1 = math.degrees(math.acos( (self.upperLength ** 2 + hypotenuseLength ** 2 - self.lowerLength ** 2) / (2 * self.upperLength * hypotenuseLength) ))
    c2 = 90 - a2
    c = c1 + c2

    vals = {
      "c1" : c1,
      "c2" : c2,
      "lower" : a,
      "upper" : b,
      "head" : c - 25,
      "hypotenuseLength" : hypotenuseLength
    }
    print(vals)
    return(vals)
    

    

    
