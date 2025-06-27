let video = document.getElementById("video");
let outputCanvas = document.getElementById("output");
let ctx = outputCanvas.getContext("2d");

let cap, src, dst, bg;
let isBgCaptured = false;

window.onOpenCvReady = function () {
  console.log("OpenCV.js loaded");

  navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
    video.srcObject = stream;
    video.play();

    video.onloadedmetadata = () => {
      outputCanvas.width = video.videoWidth;
      outputCanvas.height = video.videoHeight;

      cap = new cv.VideoCapture(video);
      src = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
      dst = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
      bg = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);

      // Wait 1 second to capture background
      setTimeout(() => {
        cap.read(bg);
        console.log(" Background captured");
        isBgCaptured = true;
        processVideo();
      }, 1000);
    };
  }).catch(err => {
    console.error(" Webcam access error:", err);
  });
};

function processVideo() {
  let hsv = new cv.Mat();
  let mask = new cv.Mat();
  let maskInv = new cv.Mat();
  let bgPart = new cv.Mat();
  let fgPart = new cv.Mat();

  const FPS = 30;

  function loop() {
    if (!isBgCaptured) return;

    cap.read(src);

    // Convert to HSV
    cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

    // Pink/magenta range (tweak as needed)
    let low = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [130, 30, 30, 0]);
    let high = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [170, 255, 255, 255]);
    cv.inRange(hsv, low, high, mask);

    // Get non-cloak area
    cv.bitwise_not(mask, maskInv);

    // Replace cloak with background
    cv.bitwise_and(bg, bg, bgPart, mask);
    cv.bitwise_and(src, src, fgPart, maskInv);
    cv.addWeighted(bgPart, 1, fgPart, 1, 0, dst);

    // Show result
    cv.imshow("output", dst);

    setTimeout(loop, 1000 / FPS);

    low.delete(); high.delete();
  }

  loop();
}
