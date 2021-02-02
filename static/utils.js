function delay(t) {
  log("Starting delay of: " + t)
  return new Promise(function (resolve) {
      setTimeout(resolve, t);
  });
}

Promise.prototype.delay = function (t) {
  return this.then(function () {
      return delay(t);
  });
}

function log(msg) {
  console.log(msg)
}

function logDebug(msg) {
  if (settings.debugLog) {
    log(msg)
  }
}

Math.degrees = function (radians) {
  return radians * 180 / Math.PI;
}

Math.radians = function (radians) {
  return radians * Math.PI / 180;
}