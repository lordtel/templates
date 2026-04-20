// Minimal in-app photo editor.
// Crops any source image to a fixed 4:5 portrait with pan/zoom,
// optional 90° rotation, and a subtle enhance toggle.
// Returns a JPEG data URL sized to `outputWidth` (default 1000×1250).

const RATIO = 4 / 5;
const OUTPUT_WIDTH = 1000;
const OUTPUT_HEIGHT = Math.round(OUTPUT_WIDTH / RATIO);

export function openImageEditor(sourceDataUrl) {
  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.className = "img-editor";
    modal.innerHTML = `
      <div class="img-editor-panel" role="dialog" aria-label="Crop photo">
        <header class="img-editor-head">
          <h2>Frame your photo</h2>
          <p>Drag to position · pinch or slider to zoom</p>
        </header>
        <div class="img-editor-frame" id="ie-frame">
          <canvas id="ie-canvas"></canvas>
          <div class="img-editor-grid" aria-hidden="true"></div>
        </div>
        <div class="img-editor-controls">
          <input type="range" id="ie-zoom" min="1" max="3" step="0.01" value="1" aria-label="Zoom" />
          <div class="img-editor-row">
            <button type="button" class="btn ghost small" id="ie-rotate">Rotate</button>
            <button type="button" class="btn ghost small" id="ie-enhance" aria-pressed="false">Enhance</button>
            <button type="button" class="btn ghost small" id="ie-reset">Reset</button>
          </div>
        </div>
        <div class="img-editor-actions">
          <button type="button" class="btn ghost" id="ie-cancel">Cancel</button>
          <button type="button" class="btn" id="ie-apply">Use photo</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.body.classList.add("no-scroll");

    const frame = modal.querySelector("#ie-frame");
    const canvas = modal.querySelector("#ie-canvas");
    const ctx = canvas.getContext("2d");
    const zoomSlider = modal.querySelector("#ie-zoom");
    const rotateBtn = modal.querySelector("#ie-rotate");
    const enhanceBtn = modal.querySelector("#ie-enhance");
    const resetBtn = modal.querySelector("#ie-reset");
    const applyBtn = modal.querySelector("#ie-apply");
    const cancelBtn = modal.querySelector("#ie-cancel");

    const state = {
      img: null,
      rotation: 0,
      zoom: 1,
      baseScale: 1,
      tx: 0,
      ty: 0,
      enhance: false,
    };

    const cleanup = () => {
      document.body.classList.remove("no-scroll");
      modal.remove();
    };

    const sizeCanvas = () => {
      const w = frame.clientWidth;
      const h = Math.round(w / RATIO);
      canvas.width = w;
      canvas.height = h;
      canvas.style.height = h + "px";
    };

    const computeBaseScale = () => {
      if (!state.img) return 1;
      const rotated = state.rotation % 180 !== 0;
      const iw = rotated ? state.img.height : state.img.width;
      const ih = rotated ? state.img.width : state.img.height;
      // Scale so the source fills the canvas (cover behavior)
      return Math.max(canvas.width / iw, canvas.height / ih);
    };

    const clampOffsets = () => {
      if (!state.img) return;
      const rotated = state.rotation % 180 !== 0;
      const iw = (rotated ? state.img.height : state.img.width) * state.baseScale * state.zoom;
      const ih = (rotated ? state.img.width : state.img.height) * state.baseScale * state.zoom;
      const maxX = Math.max(0, (iw - canvas.width) / 2);
      const maxY = Math.max(0, (ih - canvas.height) / 2);
      state.tx = Math.max(-maxX, Math.min(maxX, state.tx));
      state.ty = Math.max(-maxY, Math.min(maxY, state.ty));
    };

    const paint = () => {
      if (!state.img) return;
      ctx.save();
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.filter = state.enhance
        ? "brightness(1.04) contrast(1.1) saturate(1.18)"
        : "none";
      ctx.translate(canvas.width / 2 + state.tx, canvas.height / 2 + state.ty);
      ctx.rotate((state.rotation * Math.PI) / 180);
      const s = state.baseScale * state.zoom;
      ctx.scale(s, s);
      ctx.drawImage(state.img, -state.img.width / 2, -state.img.height / 2);
      ctx.restore();
    };

    const refresh = () => {
      state.baseScale = computeBaseScale();
      clampOffsets();
      paint();
    };

    // Pan + pinch
    const pointers = new Map();
    let pinchStartDist = 0;
    let pinchStartZoom = 1;

    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    frame.addEventListener("pointerdown", (e) => {
      frame.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [p1, p2] = [...pointers.values()];
        pinchStartDist = dist(p1, p2);
        pinchStartZoom = state.zoom;
      }
    });

    frame.addEventListener("pointermove", (e) => {
      if (!pointers.has(e.pointerId)) return;
      const prev = pointers.get(e.pointerId);
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 1) {
        state.tx += dx;
        state.ty += dy;
        clampOffsets();
        paint();
      } else if (pointers.size === 2) {
        const [p1, p2] = [...pointers.values()];
        const d = dist(p1, p2);
        if (pinchStartDist > 0) {
          const newZoom = clamp(pinchStartZoom * (d / pinchStartDist), 1, 3);
          state.zoom = newZoom;
          zoomSlider.value = String(newZoom);
          refresh();
        }
      }
    });

    const endPointer = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchStartDist = 0;
    };
    frame.addEventListener("pointerup", endPointer);
    frame.addEventListener("pointercancel", endPointer);

    zoomSlider.addEventListener("input", () => {
      state.zoom = Number(zoomSlider.value);
      refresh();
    });

    rotateBtn.addEventListener("click", () => {
      state.rotation = (state.rotation + 90) % 360;
      state.tx = 0;
      state.ty = 0;
      refresh();
    });

    enhanceBtn.addEventListener("click", () => {
      state.enhance = !state.enhance;
      enhanceBtn.setAttribute("aria-pressed", state.enhance ? "true" : "false");
      enhanceBtn.classList.toggle("on", state.enhance);
      paint();
    });

    resetBtn.addEventListener("click", () => {
      state.rotation = 0;
      state.zoom = 1;
      state.tx = 0;
      state.ty = 0;
      state.enhance = false;
      zoomSlider.value = "1";
      enhanceBtn.classList.remove("on");
      enhanceBtn.setAttribute("aria-pressed", "false");
      refresh();
    });

    cancelBtn.addEventListener("click", () => {
      cleanup();
      resolve(null);
    });

    applyBtn.addEventListener("click", () => {
      const out = exportImage(state);
      cleanup();
      resolve(out);
    });

    // Load the source
    const img = new Image();
    img.onload = () => {
      state.img = img;
      sizeCanvas();
      refresh();
    };
    img.onerror = () => {
      cleanup();
      resolve(null);
    };
    img.src = sourceDataUrl;

    // Rerender on resize (rotation, viewport change)
    window.addEventListener("resize", refresh);
  });
}

function exportImage(state) {
  const out = document.createElement("canvas");
  out.width = OUTPUT_WIDTH;
  out.height = OUTPUT_HEIGHT;
  const octx = out.getContext("2d");

  // Scale the preview math to the output dimensions
  const previewCanvas = document.querySelector("#ie-canvas");
  const ratio = out.width / previewCanvas.width;

  octx.fillStyle = "#000";
  octx.fillRect(0, 0, out.width, out.height);
  octx.filter = state.enhance
    ? "brightness(1.04) contrast(1.1) saturate(1.18)"
    : "none";
  octx.translate(out.width / 2 + state.tx * ratio, out.height / 2 + state.ty * ratio);
  octx.rotate((state.rotation * Math.PI) / 180);
  const s = state.baseScale * state.zoom * ratio;
  octx.scale(s, s);
  octx.drawImage(state.img, -state.img.width / 2, -state.img.height / 2);

  return out.toDataURL("image/jpeg", 0.88);
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}
