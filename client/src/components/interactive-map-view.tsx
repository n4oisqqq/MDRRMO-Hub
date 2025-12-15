import { useRef, useCallback, useState, useEffect } from "react";
import { MapPinned, Move, ZoomIn, ZoomOut } from "lucide-react";
import {
  MapDrawingToolbar,
  DrawingControlsPanel,
  MapLegend,
  type MapFeature,
  type DrawingMode,
} from "./map-drawing-tools";

const DEFAULT_CENTER = { lat: 13.03826, lng: 123.44719 };
const MIN_ZOOM = 1;
const MAX_ZOOM = 18;
const ZOOM_STEP = 0.5;

interface InteractiveMapViewProps {
  mapFeatures: MapFeature[];
  setMapFeatures: React.Dispatch<React.SetStateAction<MapFeature[]>>;
  drawingMode: DrawingMode;
  setDrawingMode: (mode: DrawingMode) => void;
  tempCoordinates: { lat: number; lng: number }[];
  setTempCoordinates: React.Dispatch<React.SetStateAction<{ lat: number; lng: number }[]>>;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  selectedFillColor: string;
  setSelectedFillColor: (color: string) => void;
  selectedWeight: number;
  setSelectedWeight: (weight: number) => void;
  featureTitle: string;
  setFeatureTitle: (title: string) => void;
  featureDescription: string;
  setFeatureDescription: (desc: string) => void;
  showLegend: boolean;
  setShowLegend: (show: boolean) => void;
  onSaveFeature: (feature: MapFeature) => void;
  onDeleteFeature: (id: string) => void;
  onClearAll: () => void;
  mouseCoords: { lat: number; lng: number };
  setMouseCoords: (coords: { lat: number; lng: number }) => void;
}

export function InteractiveMapView({
  mapFeatures,
  setMapFeatures,
  drawingMode,
  setDrawingMode,
  tempCoordinates,
  setTempCoordinates,
  selectedColor,
  setSelectedColor,
  selectedFillColor,
  setSelectedFillColor,
  selectedWeight,
  setSelectedWeight,
  featureTitle,
  setFeatureTitle,
  featureDescription,
  setFeatureDescription,
  showLegend,
  setShowLegend,
  onSaveFeature,
  onDeleteFeature,
  onClearAll,
  mouseCoords,
  setMouseCoords,
}: InteractiveMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomLevel, setZoomLevel] = useState(14);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  // Convert lat/lng to tile coordinates
  const latLngToTile = useCallback((lat: number, lng: number, zoom: number) => {
    const latRad = lat * Math.PI / 180;
    const n = Math.pow(2, zoom);
    const x = (lng + 180) / 360 * n;
    const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;
    return { x, y };
  }, []);

  // Convert tile coordinates to lat/lng
  const tileToLatLng = useCallback((x: number, y: number, zoom: number) => {
    const n = Math.pow(2, zoom);
    const lng = x / n * 360 - 180;
    const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n)));
    const lat = latRad * 180 / Math.PI;
    return { lat, lng };
  }, []);

  // Convert lat/lng to pixel coordinates
  const latLngToPixel = useCallback((lat: number, lng: number, zoom: number, rect: DOMRect) => {
    const centerTile = latLngToTile(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, zoom);
    const pointTile = latLngToTile(lat, lng, zoom);

    // Calculate pixel position relative to center
    const tileSize = 256;
    const x = (pointTile.x - centerTile.x) * tileSize + rect.width / 2 + offset.x;
    const y = (pointTile.y - centerTile.y) * tileSize + rect.height / 2 + offset.y;

    return { x, y };
  }, [offset, latLngToTile]);

  // Convert pixel coordinates to lat/lng
  const pixelToLatLng = useCallback((x: number, y: number, zoom: number, rect: DOMRect) => {
    const centerTile = latLngToTile(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, zoom);

    // Adjust for offset and center
    const tileSize = 256;
    const adjustedX = x - offset.x;
    const adjustedY = y - offset.y;

    const tileX = (adjustedX - rect.width / 2) / tileSize + centerTile.x;
    const tileY = (adjustedY - rect.height / 2) / tileSize + centerTile.y;

    return tileToLatLng(tileX, tileY, zoom);
  }, [offset, latLngToTile, tileToLatLng]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!mapRef.current) return;
      const rect = mapRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const coords = pixelToLatLng(x, y, zoomLevel, rect);
      setMouseCoords(coords);

      // Handle panning
      if (panStart && isPanning) {
        const deltaX = e.clientX - panStart.x;
        const deltaY = e.clientY - panStart.y;
        setOffset(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    },
    [pixelToLatLng, setMouseCoords, panStart, isPanning, zoomLevel]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle click or Ctrl+Left click
        e.preventDefault();
        setPanStart({ x: e.clientX, y: e.clientY });
        setIsPanning(true);
      } else if (drawingMode === "select" && !isPanning) {
        // Feature selection logic
        if (!mapRef.current) return;
        const rect = mapRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const clickedCoord = pixelToLatLng(x, y, zoomLevel, rect);

        // Find closest feature within tolerance
        const tolerance = 10;
        let closestFeature: MapFeature | null = null;
        let minDistance = Infinity;

        mapFeatures.forEach(feature => {
          if (feature.type === "marker") {
            const { x: fx, y: fy } = latLngToPixel(feature.coordinates[0].lat, feature.coordinates[0].lng, zoomLevel, rect);
            const distance = Math.sqrt(Math.pow(fx - x, 2) + Math.pow(fy - y, 2));
            if (distance < tolerance && distance < minDistance) {
              minDistance = distance;
              closestFeature = feature;
            }
          }
        });

        setSelectedFeature(closestFeature ? closestFeature.id : null);
      }
    },
    [drawingMode, pixelToLatLng, latLngToPixel, mapFeatures, isPanning, zoomLevel]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
    }
  }, [isPanning]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (!mapRef.current) return;

      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoomLevel(prev => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
    },
    []
  );

  const handleMapClick = useCallback(
    (e: React.MouseEvent) => {
      if (!mapRef.current || !drawingMode || isPanning) return;

      const rect = mapRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const coord = pixelToLatLng(x, y, zoomLevel, rect);

      if (drawingMode === "marker") {
        const newFeature: MapFeature = {
          id: `marker-${Date.now()}`,
          type: "marker",
          coordinates: [coord],
          title: featureTitle || "New Marker",
          description: featureDescription,
          color: selectedColor,
        };
        setMapFeatures((prev) => [...prev, newFeature]);
        onSaveFeature(newFeature);
        setDrawingMode(null);
        setFeatureTitle("");
        setFeatureDescription("");
      } else if (drawingMode === "polygon" || drawingMode === "line") {
        setTempCoordinates((prev) => [...prev, coord]);
      }
    },
    [
      drawingMode,
      featureTitle,
      featureDescription,
      selectedColor,
      pixelToLatLng,
      setMapFeatures,
      onSaveFeature,
      setDrawingMode,
      setFeatureTitle,
      setFeatureDescription,
      setTempCoordinates,
      isPanning,
      zoomLevel
    ]
  );

  const finishDrawing = useCallback(() => {
    if (tempCoordinates.length === 0) return;

    if (drawingMode === "polygon" && tempCoordinates.length >= 3) {
      const newFeature: MapFeature = {
        id: `polygon-${Date.now()}`,
        type: "polygon",
        coordinates: [...tempCoordinates],
        title: featureTitle || "New Polygon",
        description: featureDescription,
        color: selectedColor,
        fillColor: selectedFillColor,
      };
      setMapFeatures((prev) => [...prev, newFeature]);
      onSaveFeature(newFeature);
    } else if (drawingMode === "line" && tempCoordinates.length >= 2) {
      const newFeature: MapFeature = {
        id: `line-${Date.now()}`,
        type: "line",
        coordinates: [...tempCoordinates],
        title: featureTitle || "New Line",
        description: featureDescription,
        color: selectedColor,
        weight: selectedWeight,
      };
      setMapFeatures((prev) => [...prev, newFeature]);
      onSaveFeature(newFeature);
    }

    setTempCoordinates([]);
    setDrawingMode(null);
    setFeatureTitle("");
    setFeatureDescription("");
  }, [
    drawingMode,
    tempCoordinates,
    featureTitle,
    featureDescription,
    selectedColor,
    selectedFillColor,
    selectedWeight,
    setMapFeatures,
    onSaveFeature,
    setTempCoordinates,
    setDrawingMode,
    setFeatureTitle,
    setFeatureDescription,
  ]);

  const cancelDrawing = useCallback(() => {
    setDrawingMode(null);
    setTempCoordinates([]);
  }, [setDrawingMode, setTempCoordinates]);

  const exportAsImage = useCallback(() => {
    if (!canvasRef.current || !mapRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = mapRef.current.clientWidth;
    canvas.height = mapRef.current.clientHeight;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#1A1E32");
    gradient.addColorStop(0.5, "#0E2148");
    gradient.addColorStop(1, "#1A1E32");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;

    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const rect = mapRef.current.getBoundingClientRect();

    mapFeatures.forEach((feature) => {
      if (feature.type === "marker" && feature.coordinates.length > 0) {
        const coord = feature.coordinates[0];
        const { x, y } = latLngToPixel(coord.lat, coord.lng, zoomLevel, rect);

        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = feature.color;
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (feature.type === "polygon" && feature.coordinates.length >= 3) {
        ctx.beginPath();
        const first = latLngToPixel(feature.coordinates[0].lat, feature.coordinates[0].lng, zoomLevel, rect);
        ctx.moveTo(first.x, first.y);

        for (let i = 1; i < feature.coordinates.length; i++) {
          const point = latLngToPixel(feature.coordinates[i].lat, feature.coordinates[i].lng, zoomLevel, rect);
          ctx.lineTo(point.x, point.y);
        }

        ctx.closePath();
        ctx.fillStyle = feature.fillColor || feature.color + "40";
        ctx.fill();
        ctx.strokeStyle = feature.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (feature.type === "line" && feature.coordinates.length >= 2) {
        ctx.beginPath();
        const first = latLngToPixel(feature.coordinates[0].lat, feature.coordinates[0].lng, zoomLevel, rect);
        ctx.moveTo(first.x, first.y);

        for (let i = 1; i < feature.coordinates.length; i++) {
          const point = latLngToPixel(feature.coordinates[i].lat, feature.coordinates[i].lng, zoomLevel, rect);
          ctx.lineTo(point.x, point.y);
        }

        ctx.strokeStyle = feature.color;
        ctx.lineWidth = feature.weight || 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      }
    });

    const link = document.createElement("a");
    link.download = `map-export-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }, [mapFeatures, latLngToPixel, zoomLevel]);

  const resetView = useCallback(() => {
    setZoomLevel(14);
    setOffset({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
  }, []);

  // Generate ESRI World Imagery tile URLs
  const getTileUrl = useCallback((x: number, y: number, z: number) => {
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
  }, []);

  // Calculate visible tiles
  const getVisibleTiles = useCallback(() => {
    if (!mapRef.current) return [];

    const rect = mapRef.current.getBoundingClientRect();
    const tileSize = 256;
    const tilesPerRow = Math.ceil(rect.width / tileSize) + 2;
    const tilesPerCol = Math.ceil(rect.height / tileSize) + 2;

    const centerTile = latLngToTile(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, zoomLevel);
    const startCol = Math.floor(centerTile.x - tilesPerRow / 2);
    const startRow = Math.floor(centerTile.y - tilesPerCol / 2);

    const tiles = [];
    for (let x = 0; x < tilesPerRow; x++) {
      for (let y = 0; y < tilesPerCol; y++) {
        const tileX = startCol + x;
        const tileY = startRow + y;
        const wrapX = ((tileX % Math.pow(2, zoomLevel)) + Math.pow(2, zoomLevel)) % Math.pow(2, zoomLevel);
        const wrapY = tileY;

        if (wrapY >= 0 && wrapY < Math.pow(2, zoomLevel)) {
          tiles.push({
            x: tileX,
            y: tileY,
            url: getTileUrl(wrapX, wrapY, zoomLevel),
            left: (x - tilesPerRow / 2) * tileSize + rect.width / 2 + offset.x,
            top: (y - tilesPerCol / 2) * tileSize + rect.height / 2 + offset.y
          });
        }
      }
    }

    return tiles;
  }, [zoomLevel, offset, latLngToTile, getTileUrl]);

  const visibleTiles = getVisibleTiles();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseUp]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="hidden" />

      <MapDrawingToolbar
        drawingMode={drawingMode}
        setDrawingMode={setDrawingMode}
        onExport={exportAsImage}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetView={resetView}
      />

      <DrawingControlsPanel
        drawingMode={drawingMode}
        onCancel={cancelDrawing}
        featureTitle={featureTitle}
        setFeatureTitle={setFeatureTitle}
        featureDescription={featureDescription}
        setFeatureDescription={setFeatureDescription}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        selectedFillColor={selectedFillColor}
        setSelectedFillColor={setSelectedFillColor}
        selectedWeight={selectedWeight}
        setSelectedWeight={setSelectedWeight}
        tempCoordinates={tempCoordinates}
        onFinish={finishDrawing}
      />

      <div
        ref={mapRef}
        className="w-full h-full cursor-crosshair relative overflow-hidden"
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          background: "#7fbfff",
        }}
        data-testid="interactive-map-canvas"
      >
        {/* ESRI World Imagery Tiles */}
        {visibleTiles.map((tile, index) => (
          <img
            key={`${tile.x}-${tile.y}-${zoomLevel}-${index}`}
            src={tile.url}
            alt=""
            className="absolute"
            style={{
              left: `${tile.left}px`,
              top: `${tile.top}px`,
              width: "256px",
              height: "256px",
              imageRendering: "pixelated",
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ))}

        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            onClick={zoomIn}
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
          <button
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            onClick={zoomOut}
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
          <button
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            onClick={resetView}
            title="Reset View"
          >
            <Move size={20} />
          </button>
        </div>

        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`,
          }}
        >
          {mapFeatures.map((feature) => {
            if (!mapRef.current) return null;
            const rect = mapRef.current.getBoundingClientRect();

            if (feature.type === "polygon" && feature.coordinates.length >= 3) {
              const points = feature.coordinates
                .map((coord) => {
                  const { x, y } = latLngToPixel(coord.lat, coord.lng, zoomLevel, rect);
                  return `${x},${y}`;
                })
                .join(" ");

              return (
                <polygon
                  key={feature.id}
                  points={points}
                  fill={feature.fillColor || feature.color + "40"}
                  stroke={feature.color}
                  strokeWidth="2"
                  className={selectedFeature === feature.id ? "stroke-2" : ""}
                />
              );
            }

            if (feature.type === "line" && feature.coordinates.length >= 2) {
              const points = feature.coordinates
                .map((coord) => {
                  const { x, y } = latLngToPixel(coord.lat, coord.lng, zoomLevel, rect);
                  return `${x},${y}`;
                })
                .join(" ");

              return (
                <polyline
                  key={feature.id}
                  points={points}
                  fill="none"
                  stroke={feature.color}
                  strokeWidth={feature.weight || 3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={selectedFeature === feature.id ? "stroke-2" : ""}
                />
              );
            }

            return null;
          })}

          {tempCoordinates.length > 0 && mapRef.current && (() => {
            const rect = mapRef.current.getBoundingClientRect();
            const points = tempCoordinates
              .map((coord) => {
                const { x, y } = latLngToPixel(coord.lat, coord.lng, zoomLevel, rect);
                return `${x},${y}`;
              })
              .join(" ");

            return (
              <>
                {drawingMode === "polygon" && tempCoordinates.length >= 2 && (
                  <polygon
                    points={points}
                    fill={selectedFillColor}
                    stroke={selectedColor}
                    strokeWidth="2"
                    fillOpacity="0.3"
                  />
                )}
                {drawingMode === "line" && tempCoordinates.length >= 1 && (
                  <polyline
                    points={points}
                    fill="none"
                    stroke={selectedColor}
                    strokeWidth={selectedWeight}
                  />
                )}
                {tempCoordinates.map((coord, index) => {
                  const { x, y } = latLngToPixel(coord.lat, coord.lng, zoomLevel, rect);
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="6"
                      fill={selectedColor}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                  );
                })}
              </>
            );
          })()}
        </svg>

        {mapFeatures
          .filter((f) => f.type === "marker")
          .map((feature) => {
            if (!mapRef.current) return null;
            const rect = mapRef.current.getBoundingClientRect();
            const { x, y } = latLngToPixel(feature.coordinates[0].lat, feature.coordinates[0].lng, zoomLevel, rect);

            return (
              <div
                key={feature.id}
                className={`absolute transform -translate-x-1/2 -translate-y-full pointer-events-auto ${selectedFeature === feature.id ? 'scale-110' : ''} transition-transform`}
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                }}
              >
                <div className="relative group">
                  <MapPinned
                    className="w-8 h-8 drop-shadow-lg cursor-pointer"
                    style={{ 
                      color: feature.color,
                      filter: selectedFeature === feature.id ? 'drop-shadow(0 0 8px white)' : 'none'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFeature(feature.id);
                    }}
                  />
                  <div
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      background: "rgba(14, 33, 72, 0.95)",
                      color: "#E3D095",
                      border: "1px solid rgba(121, 101, 193, 0.4)",
                      minWidth: "150px",
                      maxWidth: "300px",
                      wordWrap: "break-word"
                    }}
                  >
                    <div className="font-bold truncate">{feature.title}</div>
                    {feature.description && (
                      <div className="mt-1 text-xs">{feature.description}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Zoom level indicator */}
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg">
            Zoom: {zoomLevel.toFixed(1)}x
          </div>
      </div>

      <MapLegend
        mapFeatures={mapFeatures}
        showLegend={showLegend}
        setShowLegend={setShowLegend}
        onClearAll={onClearAll}
        onDeleteFeature={onDeleteFeature}
        selectedFeature={selectedFeature}
        onSelectFeature={setSelectedFeature}
      />
    </div>
  );
}