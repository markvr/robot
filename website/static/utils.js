function delay(t) {
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

Math.degrees = function (radians) {
  return radians * 180 / Math.PI;
}