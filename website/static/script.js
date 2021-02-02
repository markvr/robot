var sliders = [
  { "name": "lower", "orientation": "vertical", "type": "angle" },
  { "name": "upper", "orientation": "vertical", "type": "angle" },
  { "name": "head", "orientation": "vertical", "type": "angle" },
  { "name": "turntable", "orientation": "horizontal", "type": "angle" },
  { "name": "length", "orientation": "horizontal", "type": "length" },
  { "name": "height", "orientation": "vertical", "type": "length" },
]

const Change = {
  "ANGLE": 1,
  "COORDS": 2
};

const Speed = {
  "NONE" : "none",
  "FAST": "fast",
  "SLOW": "slow"
}

var storage = window.localStorage
const STORAGE_KEY = "values"

var lastChangeBy = Change.ANGLE;

var $lower = $("#lowerValue");
var $upper = $("#upperValue");
var $head = $("#headValue");
var $turntable = $("#turntableValue");
var $length = $("#lengthValue");
var $height = $("#heightValue");

var updateTimer;
var selectedElement = false;

var savedValues = storage.getItem(STORAGE_KEY);
if (savedValues && confirm("Load saved values?")) {
  var data = JSON.parse(savedValues)
  $lower.val(data.lower);
  $upper.val(data.upper);
  $head.val(data.head)
  $turntable.val(data.turntable);
  calculateCoords();
} else {
  home(Speed.FAST);
}


[$length, $height].forEach((el) => el.change(() => {
  calculateAngles();
  postAll(Speed.SLOW)
}));

[$lower, $upper, $head, $turntable].forEach((el) => el.change(() => {
  calculateCoords();
  postAll(Speed.SLOW)
}));


sliders.forEach(limb => {
  var slider = noUiSlider.create($("#" + limb.name)[0], {
    start: [0],
    orientation: limb.orientation,
    direction: limb.orientation == "vertical" ? "rtl" : "ltr",
    step: 0.1,
    range: {
      'min': -5,
      'max': 5
    },
    name: limb.name,
    type: limb.type
  })
  slider.on("start", startSliderUpdate)
  slider.on("end", stopsliderUpdate)
});


function startSliderUpdate() {
  var name = this.options.name
  var type = this.options.type;
  var $valueEl = $("#" + name + "Value")
  var slider = this
  updateTimer = setInterval(() => {
    incrementValue($valueEl, slider.get())
    if (type == "length") {
      calculateAngles();
    } else {
      calculateCoords();
    }
    postAll(Speed.FAST)

  }, settings.updatePause)
}

function stopsliderUpdate() {
  clearInterval(updateTimer)
  this.set(0)
}


function startJoystickUpdate() {
  var $lengthValueEl = $("#lengthValue")
  var $heightValueEl = $("#heightValue")
  updateTimer = setInterval(() => {
    var cx = selectedElement.getAttributeNS(null, "cx");
    var cy = selectedElement.getAttributeNS(null, "cy");
    log("cx = " + cx + ", " + "cy = " + cy)
    incrementValue($lengthValueEl, (cx - 100) / 10)
    incrementValue($heightValueEl, (100 - cy) / 10)
    calculateAngles();
    postAll(Speed.FAST)
  }, settings.updatePause)
}

function stopJoystickUpdate() {
  clearInterval(updateTimer)
}


function pickup(position) {
  action("pickup", position)
}

function drop(position) {
  action("drop", position)
}

function move(position) {

}

function incrementValue($element, increment) {
  var newValue = parseFloat($element.val()) + parseFloat(increment);
  const maxValue = $element.data("max");
  const minValue = 0;
  if (newValue > maxValue) {
    throw ("Value " + newValue + " exceeds max value of " + maxValue);
  } else if (newValue < minValue) {
    throw ("Value " + newValue + " is less than min value of " + minValue);
  } else {
    $element.val(newValue.toFixed(1))
  }
}

function postAll(speed = Speed.FAST) {

  var data = JSON.stringify({
    "lower": $lower.val(),
    "upper": $upper.val(),
    "head": $head.val(),
    "turntable": $turntable.val()
  })
  storage.setItem(STORAGE_KEY, data)

  if (settings.postEnabled == true) {
    return $.post({
      "url": "/api/set?" + speed,
      "dataType": "json",
      "contentType": "application/json",
      "data": data
    })
  }
}

function openMouth() {
  postSingle('mouth', settings.mouthOpen)
}

function closeMouth() {
  postSingle('mouth', settings.mouthClosed)
}

function postSingle(limb, value) {
  if (settings.postEnabled == false) return;
  var data = {}
  data[limb] = value

  return $.post({
    "url": "/api/set",
    "dataType": "json",
    "contentType": "application/json",
    "data": JSON.stringify(data)
  })
}

function action(action, position) {
  var turntable = position.turntable;
  var length = position.length;
  var height = settings.pickupHeight;
  if (action == "drop") {
    height = height + 6
  }
  if (action == "pickup") {
    openMouth()
  }
  $turntable.val(turntable)
  $height.val(settings.safeHeight)
  $length.val(length)
  calculateAngles()
  postAll(Speed.SLOW)
  delay(2000)
    .then(() => {
      $height.val(height)
      calculateAngles()
      postAll(Speed.SLOW)
    })
    .delay(3000)
    .then(() => {
      action == "pickup" ? closeMouth() : openMouth()
    })
    .delay(1000)
    .then(() => {
      $height.val(settings.safeHeight)
      calculateAngles()
      postAll(Speed.SLOW)
    })

}

function home(speed = Speed.FAST) {
  $lower.val(settings.startLower);
  $upper.val(settings.startUpper);
  $head.val(settings.startHead)
  $turntable.val(settings.startTurntable);
  calculateCoords();
  postAll(speed);

}

function calculateAngles() {
  var length = parseFloat($length.val())
  var height = parseFloat($height.val())

  const lowerLength = settings.lowerLength;
  const upperLength = settings.upperLength;

  const hypotenuseLength = Math.sqrt(length ** 2 + height ** 2)

  var a1 = Math.degrees(Math.acos((lowerLength ** 2 + hypotenuseLength ** 2 - upperLength ** 2) / (2 * lowerLength * hypotenuseLength)))
  var a2 = Math.degrees(Math.atan(height / length))
  var a = a1 + a2
  $lower.val(a.toFixed(1))

  var b = Math.degrees(Math.acos((lowerLength ** 2 + upperLength ** 2 - hypotenuseLength ** 2) / (2 * lowerLength * upperLength)))
  $upper.val(b.toFixed(1))

  var c1 = Math.degrees(Math.acos((upperLength ** 2 + hypotenuseLength ** 2 - lowerLength ** 2) / (2 * upperLength * hypotenuseLength)))
  var c2 = 90 - a2
  var c = c1 + c2

  if (lastChangeBy === Change.ANGLE) {
    // If we have set the head angle manually, save the offset
    // between the manual value and vertical ("c") so we can reapply 
    // it and keep the offset constant as we move.
    $head.data("offset", $head.val() - c);
  }

  c = Math.min(c + $head.data("offset"), $head.data("max"));
  $head.val(c.toFixed(1))
  setMaxCoords()
  lastChangeBy = Change.COORDS;
}

function setMaxCoords() {
  const lowerLength = settings.lowerLength;
  const upperLength = settings.upperLength;

  var length = parseFloat($length.val())
  var height = parseFloat($height.val())


  var maxhypotenuse = lowerLength + upperLength;
  logDebug("maxHyp: " + maxhypotenuse)
  var maxLength = Math.sqrt(maxhypotenuse ** 2 - height ** 2)
  logDebug("maxLength: " + maxLength)
  $length.data("max", maxLength)
  var maxHeight = Math.sqrt(maxhypotenuse ** 2 - (length) ** 2);
  logDebug("maxHeight: " + maxHeight)
  $height.data("max", maxHeight)
  logDebug("")
}


function calculateCoords() {
  var lowerAngle = Math.radians(parseFloat($lower.val()))
  var upperAngle = Math.radians(parseFloat($upper.val()))

  const lowerLength = settings.lowerLength;
  const upperLength = settings.upperLength;

  var b2 = upperAngle + lowerAngle - Math.PI / 2
  var x1 = lowerLength * Math.cos(lowerAngle)
  var x2 = upperLength * Math.sin(b2)
  var x = x1 + x2
  $length.val(x.toFixed(1))
  log("x = " + x)

  var y1 = lowerLength * Math.sin(lowerAngle)
  var y2 = upperLength * Math.cos(b2)
  var y = y1 - y2
  $height.val(y.toFixed(1))
  log("y = " + y)
  setMaxCoords()
  lastChangeBy = Change.ANGLE;

}



function makeDraggable(evt) {
  var svg = evt.target;
  var centerx = 100
  var centery = 100
  var centerradius = 70

  svg.addEventListener('mousedown', startDrag);
  svg.addEventListener('mousemove', drag);
  svg.addEventListener('mouseup', endDrag);
  window.addEventListener("mouseup", endDrag)

  function getMousePosition(evt) {
    var CTM = svg.getScreenCTM();
    return {
      x: (evt.clientX - CTM.e) / CTM.a,
      y: (evt.clientY - CTM.f) / CTM.d
    };
  }

  function startDrag(evt) {
    if (evt.target.classList.contains('draggable')) {
      selectedElement = evt.target;
      offset = getMousePosition(evt);
      offset.x -= parseFloat(selectedElement.getAttributeNS(null, "cx"));
      offset.y -= parseFloat(selectedElement.getAttributeNS(null, "cy"));
      startJoystickUpdate();
    }

  }

  function drag(evt) {
    if (selectedElement) {
      evt.preventDefault();
      var coord = getMousePosition(evt);
      var cx = coord.x - offset.x
      var cy = coord.y - offset.y
      var radius = Math.sqrt((cx - centerx) ** 2 + (cy - centery) ** 2)
      log("Moving to (" + cx + ", " + cy + "), r=" + radius)
      if (radius < centerradius) {
        selectedElement.setAttributeNS(null, "cx", cx);
        selectedElement.setAttributeNS(null, "cy", cy);
      }
    }
  }

  function endDrag(evt) {
    if (selectedElement) {
      selectedElement.setAttributeNS(null, "cx", centerx);
      selectedElement.setAttributeNS(null, "cy", centery);
      stopJoystickUpdate();
      selectedElement = null;
    }
  }
}

