console.log('Script loading...');

const video = document.getElementById('video');
const identityEl = document.getElementById('identity');
const confidenceEl = document.getElementById('confidence');
const expressionsEl = document.getElementById('expressions');
const timestampEl = document.getElementById('timestamp');
const resultPanel = document.querySelector('.results-panel');
const statusIndicator = document.querySelector('.status-indicator');
const faceImageEl = document.getElementById('faceImage');
const addFaceBtn = document.querySelector('.btn-primary');
const settingsBtn = document.querySelector('.btn-secondary');
const emotionBars = document.querySelector('.emotion-bars');

// Check if all required elements exist
if (!video) console.error('Video element not found');
if (!identityEl) console.error('Identity element not found');
if (!confidenceEl) console.error('Confidence element not found');
if (!expressionsEl) console.error('Expressions element not found');
if (!timestampEl) console.error('Timestamp element not found');
if (!resultPanel) console.error('Results panel not found');
if (!statusIndicator) console.error('Status indicator not found');
if (!faceImageEl) console.error('Face image element not found');
if (!addFaceBtn) console.error('Add face button not found');
if (!settingsBtn) console.error('Settings button not found');
if (!emotionBars) console.error('Emotion bars not found');

console.log('Loading face-api models...');

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(startVideo).catch(error => {
  console.error('Error loading models:', error);
  document.querySelector('.status-text').textContent = 'Error loading models';
  document.querySelector('.status-indicator').className = 'status-indicator error';
});

function startVideo() {
  console.log('Starting video...');
  document.querySelector('.status-text').textContent = 'Initializing camera...';
  
  navigator.mediaDevices.getUserMedia({ 
    video: { 
      width: 720, 
      height: 560,
      facingMode: 'user'
    } 
  })
    .then(stream => {
      video.srcObject = stream;
      console.log('Camera initialized successfully');
      document.querySelector('.status-text').textContent = 'Searching for faces...';
    })
    .catch(err => {
      console.error("Camera error: ", err);
      document.querySelector('.status-text').textContent = 'Camera access denied';
      document.querySelector('.status-indicator').className = 'status-indicator error';
    });
}

// Update face preview image
function updateFacePreview(imageData) {
  if (imageData) {
    faceImageEl.src = imageData;
    faceImageEl.classList.remove('error');
  } else {
    faceImageEl.src = '';
    faceImageEl.classList.add('error');
  }
}

function updateEmotionBars(expressions) {
  if (!expressions) {
    emotionBars.innerHTML = '';
    return;
  }

  const sortedEmotions = Object.entries(expressions)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);  // Get top 3 emotions

  emotionBars.innerHTML = sortedEmotions.map(([emotion, value]) => `
    <div class="emotion-bar">
      <span class="emotion-label">${emotion.charAt(0).toUpperCase() + emotion.slice(1)}</span>
      <div class="bar-container">
        <div class="bar-fill" style="width: ${(value * 100).toFixed(1)}%"></div>
      </div>
      <span>${(value * 100).toFixed(1)}%</span>
    </div>
  `).join('');
}

video.addEventListener('play', async () => {
  console.log('Video started playing');
  const canvas = faceapi.createCanvasFromMedia(video);
  document.querySelector('.video-container').append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  try {
    console.log('Loading labeled images...');
    const labeledFaceDescriptors = await loadLabeledImages();
    console.log('Labeled images loaded:', labeledFaceDescriptors.length);
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5);

    setInterval(async () => {
      // Check if detection is active
      const detectionActive = !document.getElementById('toggleDetection') || 
                              !document.getElementById('toggleDetection').innerHTML.includes('eye-slash');
      
      if (!detectionActive) return;
      
      try {
        const detections = await faceapi
          .detectAllFaces(video)
          .withFaceLandmarks()
          .withFaceExpressions()
          .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        if (resizedDetections.length > 0) {
          statusIndicator.className = "status-indicator recognized";
          const bestMatch = faceMatcher.findBestMatch(resizedDetections[0].descriptor);
          const expressions = resizedDetections[0].expressions;
          const topExpression = Object.entries(expressions).reduce((a, b) => a[1] > b[1] ? a : b)[0];

          identityEl.textContent = bestMatch.label;
          confidenceEl.textContent = bestMatch.distance ? (100 - bestMatch.distance * 100).toFixed(1) + "%" : "--";
          expressionsEl.textContent = topExpression.charAt(0).toUpperCase() + topExpression.slice(1);
          timestampEl.textContent = new Date().toLocaleString();
          
          // Update emotion bars with real data
          updateEmotionBars(expressions);

          // Capture face preview
          const box = resizedDetections[0].detection.box;
          const faceCanvas = document.createElement('canvas');
          faceCanvas.width = box.width;
          faceCanvas.height = box.height;
          faceCanvas
            .getContext('2d')
            .drawImage(video, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);
          updateFacePreview(faceCanvas.toDataURL());

          resultPanel.classList.add("active");

          new faceapi.draw.DrawBox(box, { label: bestMatch.label }).draw(canvas);
        } else {
          statusIndicator.className = "status-indicator detecting";
          identityEl.textContent = "Unknown";
          confidenceEl.textContent = "--";
          expressionsEl.textContent = "--";
          updateEmotionBars(null);
          updateFacePreview(null);
        }
      } catch (error) {
        console.error('Detection error:', error);
      }
    }, 200);
  } catch (error) {
    console.error('Error setting up face recognition:', error);
    document.querySelector('.status-text').textContent = 'Setup failed';
    document.querySelector('.status-indicator').className = 'status-indicator error';
  }
});

async function loadLabeledImages() {
  const labels = ['Arpit', 'Bhagyashree', 'Tanushree','Darshan','FB Sayyad','ketan','Sushma']; 
  return Promise.all(
    labels.map(async label => {
      const descriptions = [];
      for (let i = 1; i <= 4; i++) {
        const img = await tryLoadImage(label, i);
        if (!img) continue;

        const detection = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          descriptions.push(detection.descriptor);
        }
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}

async function tryLoadImage(label, i) {
  const exts = ['.jpg', '.jpeg'];
  for (const ext of exts) {
    try {
      return await faceapi.fetchImage(`/labeled_images/${label}/${i}${ext}`);
    } catch (error) {
      console.log(`Failed to load /labeled_images/${label}/${i}${ext}:`, error.message);
    }
  }
  return null;
}

// Add Face functionality
addFaceBtn.addEventListener('click', async () => {
  const name = prompt('Enter the name for the new face:');
  if (!name) return;

  try {
    const detection = await faceapi
      .detectSingleFace(video)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      alert('No face detected. Please make sure your face is clearly visible.');
      return;
    }

    // Here you would typically save the face data
    // For now, we'll just show a success message
    alert(`Face data for ${name} captured successfully!`);
    
  } catch (error) {
    console.error('Error adding face:', error);
    alert('Error adding face. Please try again.');
  }
});

// Settings functionality
settingsBtn.addEventListener('click', () => {
  const settingsMenu = document.createElement('div');
  settingsMenu.className = 'settings-menu';
  settingsMenu.innerHTML = `
    <div class="settings-content">
      <h3>Settings</h3>
      <div class="setting-item">
        <label>Detection Interval</label>
        <select id="detectionInterval">
          <option value="100">Fast (100ms)</option>
          <option value="200" selected>Normal (200ms)</option>
          <option value="500">Slow (500ms)</option>
        </select>
      </div>
      <div class="setting-item">
        <label>Detection Confidence</label>
        <input type="range" min="0" max="100" value="50" id="confidenceThreshold">
      </div>
      <button class="btn btn-secondary" onclick="this.parentElement.parentElement.remove()">Close</button>
    </div>
  `;
  document.body.appendChild(settingsMenu);
});

// Video control functionality
document.addEventListener('DOMContentLoaded', () => {
  const togglePauseBtn = document.getElementById('togglePause');
  const takeSnapshotBtn = document.getElementById('takeSnapshot');
  const toggleFullscreenBtn = document.getElementById('toggleFullscreen');
  const toggleDetectionBtn = document.getElementById('toggleDetection');
  
  let detectionActive = true;
  
  if (togglePauseBtn) {
    togglePauseBtn.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        togglePauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      } else {
        video.pause();
        togglePauseBtn.innerHTML = '<i class="fas fa-play"></i>';
      }
    });
  }
  
  if (takeSnapshotBtn) {
    takeSnapshotBtn.addEventListener('click', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      
      const link = document.createElement('a');
      link.download = `snapshot-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  }
  
  if (toggleFullscreenBtn) {
    toggleFullscreenBtn.addEventListener('click', () => {
      const videoContainer = document.querySelector('.video-container');
      if (!document.fullscreenElement) {
        videoContainer.requestFullscreen();
        toggleFullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
      } else {
        document.exitFullscreen();
        toggleFullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
      }
    });
  }
  
  if (toggleDetectionBtn) {
    toggleDetectionBtn.addEventListener('click', () => {
      detectionActive = !detectionActive;
      if (detectionActive) {
        toggleDetectionBtn.innerHTML = '<i class="fas fa-eye"></i>';
        document.querySelector('.status-text').textContent = 'Searching for faces...';
      } else {
        toggleDetectionBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
        document.querySelector('.status-text').textContent = 'Detection paused';
        // Clear canvas
        const canvas = document.querySelector('canvas');
        if (canvas) {
          canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    });
  }
});
