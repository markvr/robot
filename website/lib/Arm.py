class Arm:
  def __init__(self, name, servos, min, max, offset, inverse = False):
    self.name = name
    self.servos = servos
    self.min = min
    self.max = max
    self.offset = offset
    self.inverse = inverse

  
