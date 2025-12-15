import { useState, useCallback, useRef } from "react";
import {
  MapPinned,
  Square,
  Ruler,
  Download,
  X,
  Trash2,
  Layers,
  Scan,
  SquarePen,
  MousePointer,
} from "lucide-react";

export type MapFeature = {
  id: string;
  type: "marker" | "polygon" | "line";
  coordinates: { lat: number; lng: number }[];
  title: string;
  description?: string;
  color: string;
  fillColor?: string;
  weight?: number;
};

export type DrawingMode = "marker" | "polygon" | "line" | "measure-distance" | "measure-area" | "select" | null;

interface MapDrawingToolsProps {
  drawingMode: DrawingMode;
  setDrawingMode: (mode: DrawingMode) => void;
  tempCoordinates: { lat: number; lng: number }[];
  setTempCoordinates: (coords: { lat: number; lng: number }[]) => void;
  mapFeatures: MapFeature[];
  setMapFeatures: (features: MapFeature[]) => void;
  onSaveFeature: (feature: MapFeature) => void;
  onDeleteFeature: (id: string) => void;
  onClearAll: () => void;
  showLegend: boolean;
  setShowLegend: (show: boolean) => void;
}

export function MapDrawingToolbar({
  drawingMode,
  setDrawingMode,
  onExport,
}: {
  drawingMode: DrawingMode;
  setDrawingMode: (mode: DrawingMode) => void;
  onExport: () => void;
}) {
  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      <button
        onClick={() => setDrawingMode("marker")}
        className={`p-3 rounded-full transition-all hover-elevate ${drawingMode === "marker" ? "ring-2 ring-white" : ""}`}
        style={{
          background: "rgba(14, 33, 72, 0.9)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(121, 101, 193, 0.4)",
          color: "#E3D095",
        }}
        title="Add Marker"
        data-testid="button-add-marker"
      >
        <MapPinned className="w-5 h-5" />
      </button>
      <button
        onClick={() => setDrawingMode("polygon")}
        className={`p-3 rounded-full transition-all hover-elevate ${drawingMode === "polygon" ? "ring-2 ring-white" : ""}`}
        style={{
          background: "rgba(14, 33, 72, 0.9)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(121, 101, 193, 0.4)",
          color: "#E3D095",
        }}
        title="Draw Polygon"
        data-testid="button-draw-polygon"
      >
        <Square className="w-5 h-5" />
      </button>
      <button
        onClick={() => setDrawingMode("line")}
        className={`p-3 rounded-full transition-all hover-elevate ${drawingMode === "line" ? "ring-2 ring-white" : ""}`}
        style={{
          background: "rgba(14, 33, 72, 0.9)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(121, 101, 193, 0.4)",
          color: "#E3D095",
        }}
        title="Draw Line"
        data-testid="button-draw-line"
      >
        <Ruler className="w-5 h-5" />
      </button>

      {/* Measurement Tools */}
      <button
        onClick={() => setDrawingMode("measure-distance")}
        className={`p-3 rounded-full transition-all hover-elevate ${drawingMode === "measure-distance" ? "ring-2 ring-white" : ""}`}
        style={{
          background: "rgba(14, 33, 72, 0.9)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(121, 101, 193, 0.4)",
          color: "#E3D095",
        }}
        title="Measure Distance"
        data-testid="button-measure-distance"
      >
        <Scan className="w-5 h-5" />
      </button>
      <button
        onClick={() => setDrawingMode("measure-area")}
        className={`p-3 rounded-full transition-all hover-elevate ${drawingMode === "measure-area" ? "ring-2 ring-white" : ""}`}
        style={{
          background: "rgba(14, 33, 72, 0.9)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(121, 101, 193, 0.4)",
          color: "#E3D095",
        }}
        title="Measure Area"
        data-testid="button-measure-area"
      >
        <SquarePen className="w-5 h-5" />
      </button>

      {/* Selection Tool */}
      <button
        onClick={() => setDrawingMode("select")}
        className={`p-3 rounded-full transition-all hover-elevate ${drawingMode === "select" ? "ring-2 ring-white" : ""}`}
        style={{
          background: "rgba(14, 33, 72, 0.9)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(121, 101, 193, 0.4)",
          color: "#E3D095",
        }}
        title="Select Item"
        data-testid="button-select-item"
      >
        <MousePointer className="w-5 h-5" />
      </button>

      <button
        onClick={onExport}
        className="p-3 rounded-full transition-all hover-elevate"
        style={{
          background: "rgba(14, 33, 72, 0.9)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(121, 101, 193, 0.4)",
          color: "#E3D095",
        }}
        title="Export as Image"
        data-testid="button-export-image"
      >
        <Download className="w-5 h-5" />
      </button>
    </div>
  );
}

export function DrawingControlsPanel({
  drawingMode,
  onCancel,
  featureTitle,
  setFeatureTitle,
  featureDescription,
  setFeatureDescription,
  selectedColor,
  setSelectedColor,
  selectedFillColor,
  setSelectedFillColor,
  selectedWeight,
  setSelectedWeight,
  tempCoordinates,
  onFinish,
  calculateDistance,
  calculateArea,
}: {
  drawingMode: DrawingMode;
  onCancel: () => void;
  featureTitle: string;
  setFeatureTitle: (title: string) => void;
  featureDescription: string;
  setFeatureDescription: (desc: string) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  selectedFillColor: string;
  setSelectedFillColor: (color: string) => void;
  selectedWeight: number;
  setSelectedWeight: (weight: number) => void;
  tempCoordinates: { lat: number; lng: number }[];
  onFinish: () => void;
  calculateDistance?: (coords: { lat: number; lng: number }[]) => number;
  calculateArea?: (coords: { lat: number; lng: number }[]) => number;
}) {
  if (!drawingMode || drawingMode === null) return null;

  // Special handling for measurement modes
  if (drawingMode === "measure-distance" || drawingMode === "measure-area") {
    return (
      <div
        className="absolute top-20 right-4 z-10 p-4 rounded-xl w-80"
        style={{
          background: "rgba(14, 33, 72, 0.95)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(121, 101, 193, 0.4)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold" style={{ color: "#E3D095" }}>
            {drawingMode === "measure-distance"
              ? "Measure Distance"
              : "Measure Area"}
          </h4>
          <button
            onClick={onCancel}
            className="p-1 rounded"
            style={{ color: "#E3D095" }}
            data-testid="button-cancel-measurement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="text-sm" style={{ color: "rgba(227, 208, 149, 0.7)" }}>
            {drawingMode === "measure-distance"
              ? "Click on the map to add points. Double-click to finish."
              : "Click on the map to define polygon vertices. Double-click to finish."}
          </div>

          {tempCoordinates.length > 0 && (
            <div className="p-3 rounded-lg" style={{ background: "rgba(0, 163, 141, 0.15)" }}>
              <div className="text-xs font-medium" style={{ color: "#00A38D" }}>
                {drawingMode === "measure-distance"
                  ? `Distance: ${calculateDistance ? calculateDistance(tempCoordinates).toFixed(2) : '0.00'} km`
                  : `Area: ${calculateArea ? calculateArea(tempCoordinates).toFixed(2) : '0.00'} km²`}
              </div>
              <div className="text-xs mt-1" style={{ color: "rgba(227, 208, 149, 0.7)" }}>
                Points: {tempCoordinates.length}
              </div>
            </div>
          )}

          <button
            onClick={onFinish}
            disabled={tempCoordinates.length < (drawingMode === "measure-distance" ? 2 : 3)}
            className="w-full py-2 rounded-lg font-medium disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #00A38D, #00A38DCC)",
              color: "white",
            }}
            data-testid="button-finish-measurement"
          >
            Finish Measurement
          </button>
        </div>
      </div>
    );
  }

  // Regular drawing mode controls
  return (
    <div
      className="absolute top-20 right-4 z-10 p-4 rounded-xl w-80"
      style={{
        background: "rgba(14, 33, 72, 0.95)",
        backdropFilter: "blur(15px)",
        border: "1px solid rgba(121, 101, 193, 0.4)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold" style={{ color: "#E3D095" }}>
          {drawingMode === "marker"
            ? "Add Marker"
            : drawingMode === "polygon"
              ? "Draw Polygon"
              : "Draw Line"}
        </h4>
        <button
          onClick={onCancel}
          className="p-1 rounded"
          style={{ color: "#E3D095" }}
          data-testid="button-cancel-drawing"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label
            className="block text-xs mb-1"
            style={{ color: "rgba(227, 208, 149, 0.7)" }}
          >
            Title
          </label>
          <input
            type="text"
            value={featureTitle}
            onChange={(e) => setFeatureTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(121, 101, 193, 0.3)",
              color: "#E3D095",
            }}
            placeholder="Enter title"
            data-testid="input-feature-title"
          />
        </div>

        <div>
          <label
            className="block text-xs mb-1"
            style={{ color: "rgba(227, 208, 149, 0.7)" }}
          >
            Description
          </label>
          <textarea
            value={featureDescription}
            onChange={(e) => setFeatureDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(121, 101, 193, 0.3)",
              color: "#E3D095",
            }}
            placeholder="Enter description"
            rows={2}
            data-testid="input-feature-description"
          />
        </div>

        <div>
          <label
            className="block text-xs mb-1"
            style={{ color: "rgba(227, 208, 149, 0.7)" }}
          >
            Color
          </label>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="w-full h-10 rounded-lg"
            data-testid="input-feature-color"
          />
        </div>

        {drawingMode === "polygon" && (
          <div>
            <label
              className="block text-xs mb-1"
              style={{ color: "rgba(227, 208, 149, 0.7)" }}
            >
              Fill Color
            </label>
            <input
              type="color"
              value={selectedFillColor}
              onChange={(e) => setSelectedFillColor(e.target.value)}
              className="w-full h-10 rounded-lg"
              data-testid="input-feature-fill-color"
            />
          </div>
        )}

        {drawingMode === "line" && (
          <div>
            <label
              className="block text-xs mb-1"
              style={{ color: "rgba(227, 208, 149, 0.7)" }}
            >
              Line Weight
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={selectedWeight}
              onChange={(e) => setSelectedWeight(parseInt(e.target.value))}
              className="w-full"
              data-testid="input-line-weight"
            />
            <div
              className="text-xs text-center mt-1"
              style={{ color: "rgba(227, 208, 149, 0.7)" }}
            >
              {selectedWeight}px
            </div>
          </div>
        )}

        {drawingMode === "polygon" && tempCoordinates.length > 0 && (
          <div className="pt-2">
            <button
              onClick={onFinish}
              disabled={tempCoordinates.length < 3}
              className="w-full py-2 rounded-lg font-medium disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #00A38D, #00A38DCC)",
                color: "white",
              }}
              data-testid="button-finish-polygon"
            >
              Finish Polygon ({tempCoordinates.length} points)
            </button>
          </div>
        )}

        {drawingMode === "line" && tempCoordinates.length > 0 && (
          <div className="pt-2">
            <button
              onClick={onFinish}
              disabled={tempCoordinates.length < 2}
              className="w-full py-2 rounded-lg font-medium disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #00A38D, #00A38DCC)",
                color: "white",
              }}
              data-testid="button-finish-line"
            >
              Finish Line ({tempCoordinates.length} points)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function MapLegend({
  mapFeatures,
  showLegend,
  setShowLegend,
  onClearAll,
  onDeleteFeature,
  selectedFeature,
  onSelectFeature,
}: {
  mapFeatures: MapFeature[];
  showLegend: boolean;
  setShowLegend: (show: boolean) => void;
  onClearAll: () => void;
  onDeleteFeature: (id: string) => void;
  selectedFeature?: string | null;
  onSelectFeature?: (id: string | null) => void;
}) {
  if (!showLegend) {
    return (
      <button
        onClick={() => setShowLegend(true)}
        className="absolute bottom-4 left-4 p-2 rounded-full"
        style={{
          background: "rgba(14, 33, 72, 0.95)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(121, 101, 193, 0.4)",
          color: "#E3D095",
        }}
        title="Show Legend"
        data-testid="button-show-legend"
      >
        <Layers className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div
      className="absolute bottom-4 left-4 p-4 rounded-xl min-w-[200px] max-w-[280px]"
      style={{
        background: "rgba(14, 33, 72, 0.95)",
        backdropFilter: "blur(15px)",
        border: "1px solid rgba(121, 101, 193, 0.4)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold" style={{ color: "#E3D095" }}>
          Features Legend
        </h4>
        <button
          onClick={() => setShowLegend(false)}
          className="p-1 rounded"
          style={{ color: "#E3D095" }}
          data-testid="button-hide-legend"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3">
        {mapFeatures.length > 0 ? (
          <>
            {mapFeatures.filter((f) => f.type === "marker").length > 0 && (
              <div>
                <div
                  className="text-xs font-medium mb-1"
                  style={{ color: "rgba(227, 208, 149, 0.8)" }}
                >
                  Markers
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {mapFeatures
                    .filter((f) => f.type === "marker")
                    .map((feature) => (
                      <div
                        key={feature.id}
                        className={`flex items-center gap-2 text-xs p-1 rounded cursor-pointer ${selectedFeature === feature.id ? 'bg-blue-500/20' : ''}`}
                        onClick={() => onSelectFeature?.(feature.id)}
                      >
                        <div
                          className="w-3 h-3 rounded-full border border-white"
                          style={{ backgroundColor: feature.color }}
                        />
                        <span
                          className="truncate flex-1"
                          style={{ color: "rgba(227, 208, 149, 0.7)" }}
                        >
                          {feature.title}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteFeature(feature.id);
                          }}
                          className="p-1 rounded opacity-60 hover:opacity-100"
                          style={{ color: "#DC3545" }}
                          data-testid={`button-delete-marker-${feature.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
            {mapFeatures.filter((f) => f.type === "polygon").length > 0 && (
              <div>
                <div
                  className="text-xs font-medium mb-1"
                  style={{ color: "rgba(227, 208, 149, 0.8)" }}
                >
                  Polygons
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {mapFeatures
                    .filter((f) => f.type === "polygon")
                    .map((feature) => (
                      <div
                        key={feature.id}
                        className={`flex items-center gap-2 text-xs p-1 rounded cursor-pointer ${selectedFeature === feature.id ? 'bg-blue-500/20' : ''}`}
                        onClick={() => onSelectFeature?.(feature.id)}
                      >
                        <div
                          className="w-3 h-3 border border-white"
                          style={{ backgroundColor: feature.fillColor }}
                        />
                        <span
                          className="truncate flex-1"
                          style={{ color: "rgba(227, 208, 149, 0.7)" }}
                        >
                          {feature.title}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteFeature(feature.id);
                          }}
                          className="p-1 rounded opacity-60 hover:opacity-100"
                          style={{ color: "#DC3545" }}
                          data-testid={`button-delete-polygon-${feature.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
            {mapFeatures.filter((f) => f.type === "line").length > 0 && (
              <div>
                <div
                  className="text-xs font-medium mb-1"
                  style={{ color: "rgba(227, 208, 149, 0.8)" }}
                >
                  Lines
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {mapFeatures
                    .filter((f) => f.type === "line")
                    .map((feature) => (
                      <div
                        key={feature.id}
                        className={`flex items-center gap-2 text-xs p-1 rounded cursor-pointer ${selectedFeature === feature.id ? 'bg-blue-500/20' : ''}`}
                        onClick={() => onSelectFeature?.(feature.id)}
                      >
                        <div
                          className="w-4 h-1"
                          style={{ backgroundColor: feature.color }}
                        />
                        <span
                          className="truncate flex-1"
                          style={{ color: "rgba(227, 208, 149, 0.7)" }}
                        >
                          {feature.title}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteFeature(feature.id);
                          }}
                          className="p-1 rounded opacity-60 hover:opacity-100"
                          style={{ color: "#DC3545" }}
                          data-testid={`button-delete-line-${feature.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            className="text-xs"
            style={{ color: "rgba(227, 208, 149, 0.6)" }}
          >
            No features added yet
          </div>
        )}
      </div>
      {mapFeatures.length > 0 && (
        <button
          onClick={onClearAll}
          className="mt-3 w-full py-1 rounded text-xs flex items-center justify-center gap-1"
          style={{
            background: "rgba(220, 53, 69, 0.2)",
            color: "#DC3545",
          }}
          data-testid="button-clear-all-features"
        >
          <Trash2 className="w-3 h-3" />
          Clear All
        </button>
      )}
    </div>
  );
}

export function useMapDrawing() {
  const [drawingMode, setDrawingMode] = useState<DrawingMode>(null);
  const [tempCoordinates, setTempCoordinates] = useState<{ lat: number; lng: number }[]>([]);
  const [selectedColor, setSelectedColor] = useState("#FF0000");
  const [selectedFillColor, setSelectedFillColor] = useState("#FF000040");
  const [selectedWeight, setSelectedWeight] = useState(3);
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureDescription, setFeatureDescription] = useState("");
  const [showLegend, setShowLegend] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cancelDrawing = useCallback(() => {
    setDrawingMode(null);
    setTempCoordinates([]);
  }, []);

  const resetDrawingState = useCallback(() => {
    setFeatureTitle("");
    setFeatureDescription("");
    setTempCoordinates([]);
    setDrawingMode(null);
  }, []);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((coords: { lat: number; lng: number }[]) => {
    if (coords.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < coords.length; i++) {
      const lat1 = coords[i-1].lat;
      const lng1 = coords[i-1].lng;
      const lat2 = coords[i].lat;
      const lng2 = coords[i].lng;

      // Haversine formula
      const R = 6371; // Earth radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      totalDistance += distance;
    }

    return totalDistance;
  }, []);

  // Calculate area of polygon using Shoelace formula
  const calculateArea = useCallback((coords: { lat: number; lng: number }[]) => {
    if (coords.length < 3) return 0;

    let area = 0;
    const n = coords.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coords[i].lng * coords[j].lat;
      area -= coords[j].lng * coords[i].lat;
    }

    area = Math.abs(area) / 2.0;

    // Convert to square kilometers (approximate)
    const earthRadius = 6371; // km
    return area * earthRadius * earthRadius;
  }, []);

  return {
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
    canvasRef,
    cancelDrawing,
    resetDrawingState,
    calculateDistance,
    calculateArea,
  };
}