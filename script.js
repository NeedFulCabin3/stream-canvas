const video = document.getElementById('webcam');
const canvas = document.getElementById('outputCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const startBtn = document.getElementById('startBtn');
const toleranceInput = document.getElementById('tolerance');
const smoothnessInput = document.getElementById('smoothness');
const tolValue = document.getElementById('tolValue');
const smoothValue = document.getElementById('smoothValue');
const keyColorInput = document.getElementById('keyColor');
const bgSelect = document.getElementById('bgSelect');
const bgColorInput = document.getElementById('bgColor');
const bgFileInput = document.getElementById('bgFile');
const keyModeRadios = document.getElementsByName('keyMode');

const bgColorGroup = document.getElementById('bgColorGroup');
const bgImageGroup = document.getElementById('bgImageGroup');

let bgImage = null;
let targetRGB = { r: 0, g: 255, b: 0 };
let isStreaming = false;

startBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 }
    });
    video.srcObject = stream;
    video.play();
  } catch (err) {
    alert('Could not access webcam: ' + err.message);
  }
});

video.addEventListener('loadedmetadata', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  isStreaming = true;
  requestAnimationFrame(processFrame);
});

toleranceInput.addEventListener('input', (e) => tolValue.textContent = e.target.value);
smoothnessInput.addEventListener('input', (e) => smoothValue.textContent = e.target.value);

keyColorInput.addEventListener('input', (e) => {
  targetRGB = hexToRgb(e.target.value);
});

keyModeRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    if (e.target.value === 'green') {
      targetRGB = { r: 0, g: 255, b: 0 };
    } else {
      targetRGB = hexToRgb(keyColorInput.value);
    }
  });
});

bgSelect.addEventListener('change', (e) => {
  bgColorGroup.classList.add('hidden');
  bgImageGroup.classList.add('hidden');

  if (e.target.value === 'color') {
    bgColorGroup.classList.remove('hidden');
  } else if (e.target.value === 'image') {
    bgImageGroup.classList.remove('hidden');
  }
});

bgFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const img = new Image();
    img.onload = () => { bgImage = img; };
    img.src = URL.createObjectURL(file);
  }
});

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 255, b: 0 };
}

function processFrame() {
  if (!isStreaming) return;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = frame.data;
  const len = data.length;

  const tol = parseFloat(toleranceInput.value);
  const smooth = parseFloat(smoothnessInput.value);
  const mode = document.querySelector('input[name="keyMode"]:checked').value;

  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    let diff = 0;

    if (mode === 'green') {
      // Fast green chroma key check
      const greenDominance = g - Math.max(r, b);
      diff = greenDominance > 0 ? 100 - greenDominance : 200;
    } else {
      // Color distance algorithm for custom color pick
      diff = Math.sqrt(
        (r - targetRGB.r) ** 2 +
        (g - targetRGB.g) ** 2 +
        (b - targetRGB.b) ** 2
      );
    }

    if (diff < tol) {
      data[i + 3] = 0;
    } else if (diff < tol + smooth && smooth > 0) {
      const alpha = ((diff - tol) / smooth) * 255;
      data[i + 3] = alpha;
    }
  }

  ctx.putImageData(frame, 0, 0);

  // Composite background overlay
  const bgType = bgSelect.value;
  if (bgType !== 'transparent') {
    ctx.globalCompositeOperation = 'destination-over';

    if (bgType === 'color') {
      ctx.fillStyle = bgColorInput.value;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (bgType === 'image' && bgImage) {
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  requestAnimationFrame(processFrame);
}