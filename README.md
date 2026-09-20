# Chroma Stream Canvas

Real-time, client-side webcam background keying and composite rendering using HTML5 Canvas pixel manipulation and custom Euclidean distance calculations.

---

## Overview

Most web-based video background swapping tools require heavy Machine Learning frameworks like TensorFlow.js or MediaPipe. While those models work well for general segmentation, they drag down frame rates on low-end hardware and bring in massive bundle sizes.

`chroma-stream-canvas` handles real-time background subtraction directly inside the main thread using standard HTML5 Canvas 2D contexts. By reading raw frame buffers (`ImageData`) directly from a `<video>` stream and applying linear color distance checks against target RGB vectors, it removes or swaps backgrounds on live video with minimal performance loss.

---

## How It Works

The processing pipeline runs inside a recursive `requestAnimationFrame` render loop:

1. **Stream Capture**: The browser's MediaDevices API requests a 640x480 webcam feed and streams it into a hidden HTML5 `<video>` element.
2. **Buffer Extraction**: Each loop iteration draws the active video frame to an off-screen canvas buffer and extracts its pixel data via `getImageData()`.
3. **Chroma Key Processing**: The system iterates across the 32-bit RGBA pixel array ($4 \text{ values per pixel}$) and evaluates target color similarity:
   * **Green Screen Mode**: Measures green dominance using $G - \max(R, B)$.
   * **Custom Color Mode**: Calculates 3D Euclidean distance in RGB color space:
     $$\Delta C = \sqrt{(R_1 - R_2)^2 + (G_1 - G_2)^2 + (B_1 - B_2)^2}$$
4. **Alpha Channel & Feathering**: Pixels falling below the tolerance threshold have their alpha channel zeroed out ($A = 0$). Pixels within the smoothness range are assigned a linear alpha slope to prevent harsh jagged edges.
5. **Composite Layering**: Canvas global composite operations (`destination-over`) inject a custom background color or uploaded image behind the keyed subject before repainting the frame buffer.

---

## Key Features

* **Dual Keying Engine**: Fast green-screen extraction mode along with an Euclidean distance picker for arbitrary background colors.
* **Alpha Feathering**: Configurable edge smoothing to blend subject borders gracefully into new backdrops.
* **Background Swapping**: Render over transparent checkerboards, custom solid hex values, or uploaded static images.
* **Zero External Dependencies**: Built entirely with Vanilla JavaScript, standard CSS3, and standard HTML5 Web APIs.

---

## Tech Stack Breakdown

* **HTML5 Markup**: Structure housing the video element, output canvas, and control panel.
* **CSS3 Styling**: Flexbox layouts, dark theme styling, and CSS grid checkerboard patterns for previewing transparency.
* **JavaScript (ES6+)**: WebRTC (`getUserMedia`), Canvas 2D Context API (`getImageData`, `putImageData`), and linear math operations.

---

## Prerequisites & Web-Based Quick Start

You don't need to clone this repository locally or set up a complex Node build pipeline. You can run and modify everything inside your browser.

### Option A: GitHub Codespaces (Browser-based)
1. Press `.` on your keyboard while viewing this repo, or click **Code** > **Codespaces** > **Create codespace on main**.
2. Install the **Live Preview** extension in VS Code Web.
3. Right-click `index.html` and choose **Live Preview: Show Preview**.

### Option B: Local Browser Run
1. Download or clone the files (`index.html`, `style.css`, `script.js`).
2. Open `index.html` directly in any modern browser (Chrome, Firefox, Safari, Edge).
3. Grant camera permissions when prompted.

---

## Project Structure

```text
chroma-stream-canvas/
├── .github/
│   └── workflows/
│       └── code-quality.yml   # Workflow for static code checking
├── .gitignore                # Rules for excluding unwanted runtime files
├── LICENSE                   # Open-source license file (MIT)
├── README.md                 # Project documentation
├── index.html                # App interface and control layout
├── script.js                 # Pixel loop, matrix calculations, and canvas compositing
└── style.css                 # Interface styling and transparent grid patterns
```

## Roadmap

[ ] Add Web Worker support to offload getImageData pixel parsing from the main UI thread.

[ ] Implement WebGL shader pipelines to perform chroma keying on the GPU for 1080p+ streams.

[ ] Add HSV/HSL color space tolerance modes to reduce sensitivity to lighting variations.
