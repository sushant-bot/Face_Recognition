🧠 Web-Based Face Recognition System
A sleek, browser-powered face recognition system built with Python, JavaScript, and WebRTC. Capture, detect, and recognize faces directly through a web interface—powered by OpenCV and modern frontend tech.

🌐 “Your browser just got smarter.”

📁 Project Structure
bash
Copy
Edit
├── labeled_images/      # Training images (organized by labels)
├── models/              # Trained face recognition models
├── index.html           # Web interface
├── script.js            # Frontend logic (Webcam, AJAX)
├── server.py            # Flask-based Python backend
├── start_server.bat     # Script to launch server (Windows)
💡 Features
✅ Face capture via browser webcam
✅ Real-time recognition using webcam stream
✅ Fast and lightweight backend using Flask
✅ Easy to extend with more labels/images
✅ Clean modular code – frontend & backend separation

🚀 Getting Started
1. Clone the Repository
bash
Copy
Edit
git clone https://github.com/sushant-bot/Face_Recognition.git
cd Face_Recognition
2. Install Python Dependencies
bash
Copy
Edit
pip install flask opencv-python numpy
3. Add Training Images
Place labeled images in labeled_images/ folder.

Each subfolder should be named after the person (label).

Copy
Edit
labeled_images/
├── Sushant/
│   ├── 1.jpg
│   └── 2.jpg
├── Elon/
│   └── 1.jpg
4. Start the Server
bash
Copy
Edit
# Option 1: Via terminal
python server.py

# Option 2: Windows users can double-click
start_server.bat
5. Open in Browser
bash
Copy
Edit
http://localhost:5000
📸 Grant webcam access to start recognition.

🖼️ Screenshots
Homepage UI	Face Detected

🛠️ Future Improvements
🎭 Emotion & age detection

🔐 Add user authentication

🧠 Switch to Deep Learning models (e.g., FaceNet)

☁️ Deploy on Render/Heroku with webcam support

📲 PWA (Progressive Web App) for mobile use

🧑‍💻 Developed By
Sushant Chavan
🔗 GitHub | 📧 Reach Out

📄 License
Licensed under MIT. Contributions and forks welcome!

