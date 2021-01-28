var sliders = [
  { "name": "lower", "orientation": "vertical", "type": "angle" },
  { "name": "upper", "orientation": "vertical", "type": "angle" },
  { "name": "head", "orientation": "vertical", "type": "angle" },
  { "name": "turntable", "orientation": "horizontal", "type": "angle" },
  { "name": "length", "orientation": "horizontal", "type": "length" },
  { "name": "height", "orientation": "vertical", "type": "length" },
]

var $lower = $("#lowerValue");
var $upper = $("#upperValue");
var $head = $("#headValue");
var $turntable = $("#turntableValue");
var $length = $("#lengthValue");
var $height = $("#heightValue");

var updateTimer;
var selectedElement = false;


[$length, $height].forEach((el) => el.change(() => {
  calculateAngles();
  postAll(true)
}));

[$lower, $upper, $head, $turntable].forEach((el) => el.change(() => postAll(true)));


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
  var valueEl = $("#" + name + "Value")[0]
  var slider = this
  updateTimer = setInterval(() => {
    incrementValue(valueEl, slider.get())
    if (type == "length") {
      calculateAngles();
    }
    postAll(false)

  }, 100)
}

function stopsliderUpdate() {
  clearInterval(updateTimer)
  this.set(0)
}


function startJoystickUpdate() {
  var lengthValueEl = $("#lengthValue")[0]
  var heightValueEl = $("#heightValue")[0]
  updateTimer = setInterval(() => {
    var cx = selectedElement.getAttributeNS(null, "cx");
    var cy = selectedElement.getAttributeNS(null, "cy");
    log("cx = " + cx + ", " + "cy = " + cy)
    incrementValue(lengthValueEl, (cx - 100) / 10)
    incrementValue(heightValueEl, (100 - cy) / 10)
    calculateAngles();
    postAll(false)
  }, 100)
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

function incrementValue(element, increment) {
  element.value = (parseFloat(element.value) + parseFloat(increment)).toFixed(1)
}

function postAll(slow = false) {
  if (settings.postEnabled == false) return;
  var endpoint = slow ? "slow-set" : "set"
  var data = {
    "lower": $lower.val(),
    "upper": $upper.val(),
    "head": $head.val(),
    "turntable": $turntable.val()
  }
  $.post({
    "url": "/api/" + endpoint,
    "dataType": "json",
    "contentType": "application/json",
    "data": JSON.stringify(data)
  })
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

  $.post({
    "url": "/api/set",
    "dataType": "json",
    "contentType": "application/json",
    "data": JSON.stringify(data)
  })
}

function action(action, position) {
  var turntable = position.turntable
  var length = position.length
  var height = calculatePickupHeight(length)
  
  if (action == "pickup") {
    openMouth()
  }
  $turntable.val(turntable)
  $height.val(settings.safeHeight)
  $length.val(length)
  calculateAngles()
  postAll(true)
  delay(2000)
    .then(() => {
      $height.val(height)
      calculateAngles()
      postAll(true)
    })
    .delay(4000)
    .then(() => {
      // action == "pickup" ? closeMouth() : openMouth()
    })
    .delay(1000)
    .then(() => {
      $height.val(settings.safeHeight)
      calculateAngles()
      postAll(true)
    })

}

function calculateAngles() {
  var length = parseFloat($length.val())
  var height = parseFloat($height.val())

  hypotenuseLength = Math.sqrt(length ** 2 + (height + settings.headLength) ** 2)

  var a1 = Math.degrees(Math.acos((settings.lowerLength ** 2 + hypotenuseLength ** 2 - settings.upperLength ** 2) / (2 * settings.lowerLength * hypotenuseLength)))
  var a2 = Math.degrees(Math.atan((height + settings.headLength) / length))
  var a = a1 + a2
  $lower.val(a.toFixed(1))

  var b = Math.degrees(Math.acos((settings.lowerLength ** 2 + settings.upperLength ** 2 - hypotenuseLength ** 2) / (2 * settings.lowerLength * settings.upperLength)))
  $upper.val(b.toFixed(1))

  var c1 = Math.degrees(Math.acos((settings.upperLength ** 2 + hypotenuseLength ** 2 - settings.lowerLength ** 2) / (2 * settings.upperLength * hypotenuseLength)))
  var c2 = 90 - a2
  var c = c1 + c2 + settings.headOffset
  $head.val(c.toFixed(1))
}

function calculatePickupHeight(length) {
  var gradient = (settings.farPickupHeight - settings.nearPickupHeight) / (settings.maxLength - settings.minlength)
  var offset = settings.nearPickupHeight - gradient * settings.minlength
  var height = length * gradient + offset
  log("Pickup height: " + height)
  return height;
  
}


function makeDraggable(evt) {
  var svg = evt.target;
  var centerx = 100
  var centery = 100
  var centerradius = 70

  svg.addEventListener('mousedown', startDrag);
  svg.addEventListener('mousemove', drag);
  svg.addEventListener('mouseup', endDrag);

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
    selectedElement.setAttributeNS(null, "cx", centerx);
    selectedElement.setAttributeNS(null, "cy", centery);
    stopJoystickUpdate();
    selectedElement = null;
  }
}

