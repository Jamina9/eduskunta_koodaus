
import os

from flask import Flask, render_template_string
import shutil

app = Flask(__name__)

os.makedirs(app.static_folder, exist_ok=True)
shutil.copy(
    r"C:\Users\jamin\Downloads\eduskunta.png",
    os.path.join(app.static_folder, "eduskunta.png"),
)

IMAGE_FILE = "eduskunta.png"

PAGE = """<!DOCTYPE html>
<html lang="fi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Salikartta</title>
  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      background: #f6f3fa;
      color: #222;
      font-family: "Segoe Print", "Comic Sans MS", "Trebuchet MS", sans-serif;
    }

    .page {
      max-width: 760px;
      margin: 0 auto;
      padding: 28px 16px 48px;
    }

    /* Title with a pink cloud-like border */
    .title-wrap {
      position: relative;
      width: min(92%, 380px);
      aspect-ratio: 10 / 3;
      margin: 0 auto 28px;
    }
    .title-wrap svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .title-wrap path {
      fill: #fff;
      stroke: #ff5fa8;
      stroke-width: 5;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
    }
    .title-wrap h1 {
      position: absolute;
      inset: 0;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: clamp(1.8rem, 6vw, 2.6rem);
      font-weight: 600;
    }

    /* Large image area */
    .image-box {
      width: 100%;
      aspect-ratio: 16 / 9;
      border: 2px solid #333;
      border-radius: 18px;
      background: #fff;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: clamp(1.1rem, 3.5vw, 1.6rem);
      padding: 12px;
    }
    .image-box img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    /* Three buttons with captions */
    .buttons {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-top: 28px;
    }
    .item {
      flex: 1;
      text-align: center;
    }
    .btn {
      width: 100%;
      padding: 14px 8px;
      border: 2px solid #333;
      border-radius: 12px;
      background: #fff;
      color: #222;
      font: inherit;
      font-size: 1.05rem;
      cursor: default;
    }
    .caption {
      margin-top: 10px;
      font-size: 0.95rem;
      color: #444;
    }

    @media (max-width: 560px) {
      .buttons { flex-direction: column; gap: 20px; }
    }
  </style>
</head>
<body>
  <main class="page">
    <div class="title-wrap">
      <svg viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
        <path d="M40 22 A38 38 0 0 1 104 22 A38 38 0 0 1 168 22
                 A38 38 0 0 1 232 22 A38 38 0 0 1 296 22 A38 38 0 0 1 360 22
                 A24 24 0 0 1 360 60 A24 24 0 0 1 360 98
                 A38 38 0 0 1 296 98 A38 38 0 0 1 232 98 A38 38 0 0 1 168 98
                 A38 38 0 0 1 104 98 A38 38 0 0 1 40 98
                 A24 24 0 0 1 40 60 A24 24 0 0 1 40 22 Z"/>
      </svg>
      <h1>Salikartta</h1>
    </div>

    <div class="image-box">
      <img src="{{ url_for('static', filename=image_file) }}" alt="Eduskunnan istumajärjestys">
    </div>

    <div class="buttons">
      <div class="item">
        <button class="btn" type="button">Kartta</button>
      </div>
      <div class="item">
        <button class="btn" type="button">Kansanedustajat</button>
      </div>
      <div class="item">
        <button class="btn" type="button">Suodatin</button>
      </div>
    </div>
  </main>
</body>
</html>
"""

@app.route("/")
def index():
    return render_template_string(PAGE, image_file=IMAGE_FILE)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
