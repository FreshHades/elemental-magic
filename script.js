let video = document.getElementById("video");
let outputCanvas = document.getElementById("output");
let ctx = outputCanvas.getContext("2d");

let cap, src, dst, bg;
let isBgCaptured = false;

function onOpenCvReady() {
  console.log("OpenCV.js loaded and ready");
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

      // Capture the background after 3 seconds
      setTimeout(() => {
        cap.read(bg);
        isBgCaptured = true;
        console.log("✅ Background captured.");
        processVideo();
      }, 3000);
    };
  }).catch(err => {
    console.error("Error accessing webcam:", err);
  });
}

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

    // Convert to HSV color space
    cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

    // Define pink range in HSV
    let low = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [140, 50, 50, 0]);
    let high = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [170, 255, 255, 255]);
    cv.inRange(hsv, low, high, mask);

    // Invert mask to get everything except your cloak
    cv.bitwise_not(mask, maskInv);

    // Extract background part where cloak is
    cv.bitwise_and(bg, bg, bgPart, mask);

    // Extract current frame part without cloak
    cv.bitwise_and(src, src, fgPart, maskInv);

    // Merge both parts
    cv.addWeighted(bgPart, 1, fgPart, 1, 0, dst);

    // Display result on canvas
    cv.imshow("output", dst);

    // Loop at the desired FPS
    setTimeout(loop, 1000 / FPS);

    low.delete();
    high.delete();
  }

  loop();
}
