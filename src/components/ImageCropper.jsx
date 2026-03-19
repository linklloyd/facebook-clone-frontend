import { useState, useRef, useCallback, useEffect } from "react";
import { FaTimes, FaCheck, FaSearchPlus, FaSearchMinus } from "react-icons/fa";

export default function ImageCropper({ image, onCrop, onCancel, shape = "circle" }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [img, setImg] = useState(null);
  const containerSize = shape === "circle" ? 300 : 500;
  const containerHeight = shape === "circle" ? 300 : 200;

  useEffect(() => {
    const i = new Image();
    i.onload = () => {
      setImg(i);
      // Center the image initially
      const scale = Math.max(containerSize / i.width, containerHeight / i.height);
      setZoom(scale);
    };
    i.src = typeof image === "string" ? image : URL.createObjectURL(image);
    return () => {
      if (typeof image !== "string") URL.revokeObjectURL(i.src);
    };
  }, [image]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    canvas.width = containerSize;
    canvas.height = containerHeight;

    // Clear
    ctx.clearRect(0, 0, containerSize, containerHeight);

    // Draw image
    const w = img.width * zoom;
    const h = img.height * zoom;
    const x = (containerSize - w) / 2 + offset.x;
    const y = (containerHeight - h) / 2 + offset.y;
    ctx.drawImage(img, x, y, w, h);

    // Draw overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";

    if (shape === "circle") {
      // Draw dark overlay with circle cutout
      ctx.beginPath();
      ctx.rect(0, 0, containerSize, containerHeight);
      ctx.arc(containerSize / 2, containerHeight / 2, containerSize / 2 - 10, 0, Math.PI * 2, true);
      ctx.fill();

      // Circle border
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(containerSize / 2, containerHeight / 2, containerSize / 2 - 10, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Rectangle crop guide for cover photos
      const margin = 10;
      ctx.beginPath();
      ctx.rect(0, 0, containerSize, containerHeight);
      ctx.rect(margin, margin, containerSize - margin * 2, containerHeight - margin * 2);
      ctx.fill("evenodd");

      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(margin, margin, containerSize - margin * 2, containerHeight - margin * 2);
    }
  }, [img, zoom, offset, containerSize, containerHeight, shape]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (e) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setDragging(false);

  const handleTouchStart = (e) => {
    const t = e.touches[0];
    setDragging(true);
    setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y });
  };

  const handleTouchMove = (e) => {
    if (!dragging) return;
    const t = e.touches[0];
    setOffset({
      x: t.clientX - dragStart.x,
      y: t.clientY - dragStart.y,
    });
  };

  const handleCrop = () => {
    if (!img) return;

    const outputCanvas = document.createElement("canvas");
    const size = shape === "circle" ? containerSize - 20 : containerSize - 20;
    const outH = shape === "circle" ? containerHeight - 20 : containerHeight - 20;

    outputCanvas.width = size;
    outputCanvas.height = outH;
    const ctx = outputCanvas.getContext("2d");

    if (shape === "circle") {
      // Clip to circle
      ctx.beginPath();
      ctx.arc(size / 2, outH / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
    }

    // Draw the image at the same position as preview
    const w = img.width * zoom;
    const h = img.height * zoom;
    const x = (containerSize - w) / 2 + offset.x - 10;
    const y = (containerHeight - h) / 2 + offset.y - 10;
    ctx.drawImage(img, x, y, w, h);

    outputCanvas.toBlob(
      (blob) => {
        if (blob) onCrop(blob);
      },
      "image/jpeg",
      0.9
    );
  };

  const minZoom = img
    ? Math.max(containerSize / img.width, containerHeight / img.height) * 0.5
    : 0.1;
  const maxZoom = img
    ? Math.max(containerSize / img.width, containerHeight / img.height) * 4
    : 5;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal cropper-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{shape === "circle" ? "Crop Profile Picture" : "Crop Cover Photo"}</h3>
          <button onClick={onCancel}><FaTimes /></button>
        </div>

        <div className="cropper-container">
          <canvas
            ref={canvasRef}
            style={{
              width: containerSize,
              height: containerHeight,
              cursor: dragging ? "grabbing" : "grab",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          />
        </div>

        <div className="cropper-controls">
          <FaSearchMinus />
          <input
            type="range"
            min={minZoom}
            max={maxZoom}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="zoom-slider"
          />
          <FaSearchPlus />
        </div>

        <p className="cropper-hint">Drag to reposition, use slider to zoom</p>

        <div className="cropper-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={handleCrop}>
            <FaCheck /> Apply
          </button>
        </div>
      </div>
    </div>
  );
}
