function onOpenCvReady() {
  console.log("✅ OpenCV.js loaded");

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

      // 👇 Slight delay to let video settle
      setTimeout(() => {
        cap.read(bg);
        console.log("✅ Background captured.");
        isBgCaptured = true;
        processVideo();
      }, 1000); // reduce to 1 second for testing
    };
  }).catch(err => {
    console.error("Webcam error:", err);
  });
}
