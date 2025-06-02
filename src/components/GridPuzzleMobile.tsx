import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Info, RotateCcw, Save, Eye } from 'lucide-react';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface TilePosition { 
  id: string;
  x: number;
  y: number;
  rotation: number;
  imageIndex: number;
}

interface OrderFormData {
  name: string;
  address: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
}

export const GridPuzzleMobile = () => {
  const [horizontal, setHorizontal] = useState('');
  const [vertical, setVertical] = useState('');
  const [isGridGenerated, setIsGridGenerated] = useState(false);
  const [tiles, setTiles] = useState<TilePosition[]>([]);
  const [gridTiles, setGridTiles] = useState<(TilePosition | null)[][]>([]);
  const [images, setImages] = useState<string[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const tilesContainerRef = useRef<HTMLDivElement>(null);
  const [imageCounts, setImageCounts] = useState({ S0: 0, S1: 0, S2: 0 });
  const [showInfo, setShowInfo] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showFieldsWarning, setShowFieldsWarning] = useState(false);
  const [orderType, setOrderType] = useState<"regular" | "magnetic">("regular");
  const [orderForm, setOrderForm] = useState<OrderFormData>({
    name: '',
    address: '',
    postalCode: '',
    country: '',
    phone: '',
    email: '',
  });
  const [showPreview, setShowPreview] = useState(false);
  const [previewImages] = useState({
    S0: 'https://i.imgur.com/kn42XZf.jpeg',
    S1: {
      0: 'https://i.imgur.com/1DqOSQE.jpeg',
      90: 'https://i.imgur.com/PjLVbJo.jpeg',
      180: 'https://i.imgur.com/1DqOSQE.jpeg',
      270: 'https://i.imgur.com/PjLVbJo.jpeg'
    },
    S2: {
      0: 'https://i.imgur.com/vE81a6V.jpeg',
      90: 'https://i.imgur.com/tsLaZSJ.jpeg',
      180: 'https://i.imgur.com/CC9hB30.jpeg',
      270: 'https://i.imgur.com/jfTdo1q.jpeg'
    }
  });

  // Mobile-specific state
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0, scale: 1 });

  // Mobile grid constants
  const TILE_SIZE = 51;

  // Touch drag states
  const [touchDragActive, setTouchDragActive] = useState(false);
  const [draggedTile, setDraggedTile] = useState<string | null>(null);
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null);
  const [draggedTileData, setDraggedTileData] = useState<TilePosition | null>(null);

  useEffect(() => {
    const counts = { S0: 0, S1: 0, S2: 0 };
    gridTiles.forEach(row => {
      row.forEach(tile => {
        if (tile) {
          counts[`S${tile.imageIndex}` as keyof typeof counts]++;
        }
      });
    });
    setImageCounts(counts);
  }, [gridTiles]);

  useEffect(() => {
    const loadImages = async () => {
      const imageUrls = [
        'https://i.imgur.com/RSSS8zt.png',
        'https://i.imgur.com/6xIAB8j.png',
        'https://i.imgur.com/eRSAL3Z.png'
      ];
      setImages(imageUrls);
      generatePreloadedGridMobile(imageUrls);
    };
    loadImages();
  }, []);

  // Generate simple 50x50 background grid for mobile
  const generatePreloadedGridMobile = (loadedImages: string[]) => {
    const newTiles: TilePosition[] = [];
    
    // Simple center positioning
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Generate 50x50 grid (25 tiles in each direction from center)
    let index = 0;
    for (let row = 0; row < 50; row++) {
      for (let col = 0; col < 50; col++) {
        newTiles.push({
          id: `tile-${index}`,
          x: centerX + (col - 25) * TILE_SIZE,
          y: centerY + (row - 25) * TILE_SIZE,
          rotation: Math.floor(Math.random() * 4) * 90,
          imageIndex: Math.floor(Math.random() * loadedImages.length),
        });
        index++;
      }
    }

    setTiles(newTiles);
    
    // No transforms
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  };

  // Calculate pan boundaries with buffer zone
  const getPanBoundaries = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const bufferDistance = 10 * TILE_SIZE; // 10 tiles in each direction
    
    // Background grid is 50x50 centered, so boundaries are:
    const gridHalfWidth = (50 * TILE_SIZE) / 2;
    const gridHalfHeight = (50 * TILE_SIZE) / 2;
    
    // Allow panning to buffer zone edges
    const minX = -(gridHalfWidth + bufferDistance - screenWidth / 2);
    const maxX = gridHalfWidth + bufferDistance - screenWidth / 2;
    const minY = -(gridHalfHeight + bufferDistance - screenHeight / 2);
    const maxY = gridHalfHeight + bufferDistance - screenHeight / 2;
    
    return { minX, maxX, minY, maxY };
  };

  // Mobile touch handlers for separate pan and zoom gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      // Cancel any ongoing tile drag when two fingers detected
      setTouchDragActive(false);
      setDraggedTile(null);
      setTouchPosition(null);
      setDraggedTileData(null);
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      setLastTouch({
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
        scale: distance
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      // Calculate distance change for zoom detection
      const distanceChange = Math.abs(distance - lastTouch.scale);
      const centerMovement = Math.sqrt(
        Math.pow(centerX - lastTouch.x, 2) + 
        Math.pow(centerY - lastTouch.y, 2)
      );

      // More responsive thresholds - prioritize zoom for clear pinch gestures
      const zoomThreshold = 8; // Clear pinch distance change to trigger zoom
      const panThreshold = 2;  // Lower threshold for responsive panning

      if (distanceChange > zoomThreshold) {
        // ZOOM: Clear pinching gesture detected
        const minScale = 0.3; // Maximum zoom out as requested
        const maxScale = 1.0; // Maximum zoom in (loaded page scale) as requested

        const newScale = Math.max(minScale, Math.min(maxScale, scale * (distance / lastTouch.scale)));
        setScale(newScale);
      } else if (centerMovement > panThreshold) {
        // PAN: Two fingers moving together - prioritize pan for most gestures
        const deltaX = centerX - lastTouch.x;
        const deltaY = centerY - lastTouch.y;

        // Calculate potential new position
        const potentialX = translateX + deltaX;
        const potentialY = translateY + deltaY;

        // Apply boundary constraints
        const boundaries = getPanBoundaries();
        const boundedX = Math.max(boundaries.minX, Math.min(boundaries.maxX, potentialX));
        const boundedY = Math.max(boundaries.minY, Math.min(boundaries.maxY, potentialY));

        setTranslateX(boundedX);
        setTranslateY(boundedY);
      }

      setLastTouch({ x: centerX, y: centerY, scale: distance });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      // Reset touch state when no longer using two fingers
      setLastTouch({ x: 0, y: 0, scale: 1 });
    }
  };

  const handleStart = () => {
    const h = parseInt(horizontal);
    const v = parseInt(vertical);
    if (isNaN(h) || isNaN(v) || h <= 0 || v <= 0) return;

    if (isGridGenerated && gridTiles.length > 0) {
      const oldGrid = [...gridTiles];
      const newGrid = Array(v).fill(null).map((_, rowIndex) => 
        Array(h).fill(null).map((_, colIndex) => {
          if (rowIndex < oldGrid.length && colIndex < oldGrid[0].length) {
            return oldGrid[rowIndex][colIndex];
          }
          return null;
        })
      );
      setGridTiles(newGrid);
    } else {
      const newGrid = Array(v).fill(null).map(() => Array(h).fill(null));
      setGridTiles(newGrid);
    }

    setIsGridGenerated(true);
  };

  const handleRestart = () => {
    setHorizontal('');
    setVertical('');
    setIsGridGenerated(false);
    setGridTiles([]);
    setImageCounts({ S0: 0, S1: 0, S2: 0 });
  };

  const handleOrderClick = () => {
    const hasEmptyGridCell = gridTiles.some(row => 
      row.some(cell => cell === null)
    );
    
    if (hasEmptyGridCell) {
      setShowWarning(true);
    } else {
      setShowOrder(true);
    }
  };

  const handleSave = async () => {
    if (!gridRef.current) return;
    
    try {
      const canvas = await html2canvas(gridRef.current);
      const image = canvas.toDataURL();
      const link = document.createElement('a');
      link.download = 'grid-puzzle.png';
      link.href = image;
      link.click();
    } catch (error) {
      console.error('Error saving image:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 z-30 h-[140px]">
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-bold mb-4">configurar</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Š</span>
              <input
                type="number"
                value={horizontal}
                onChange={(e) => setHorizontal(e.target.value)}
                className="w-12 h-8 text-center border border-gray-300 rounded text-sm"
                min="1"
              />
            </div>
            <span className="text-lg">×</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">V</span>
              <input
                type="number"
                value={vertical}
                onChange={(e) => setVertical(e.target.value)}
                className="w-12 h-8 text-center border border-gray-300 rounded text-sm"
                min="1"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setShowInfo(true)}
              className="px-4 py-2 bg-neutral-900 text-white rounded-md text-sm font-medium"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={handleStart}
              className="px-4 py-2 bg-neutral-900 text-white rounded-md text-sm font-medium"
            >
              Start
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-neutral-900 text-white rounded-md text-sm font-medium"
            >
              Rndm
            </button>
            <button
              onClick={handleRestart}
              className="px-4 py-2 bg-neutral-900 text-white rounded-md text-sm font-medium"
            >
              Clear
            </button>
            <button
              onClick={handleRestart}
              className="px-4 py-2 bg-neutral-900 text-white rounded-md text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-[140px] pb-[120px] h-screen overflow-hidden">
        <div 
          className="relative w-full h-full touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
            transformOrigin: 'center center'
          }}
        >
          {/* Background tiles */}
          <div ref={tilesContainerRef} className="absolute inset-0 pointer-events-none">
            {tiles.map((tile) => (
              <div
                key={tile.id}
                className="absolute w-[50px] h-[50px] border border-gray-300 pointer-events-auto cursor-pointer"
                style={{
                  left: tile.x - 25,
                  top: tile.y - 25,
                  transform: `rotate(${tile.rotation}deg)`,
                  backgroundImage: `url(${images[tile.imageIndex]})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            ))}
          </div>

          {/* Main grid */}
          {isGridGenerated && (
            <div 
              ref={gridRef}
              className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${parseInt(horizontal) || 1}, 50px)`,
                gridTemplateRows: `repeat(${parseInt(vertical) || 1}, 50px)`,
                gap: '1px',
                backgroundColor: '#d1d5db',
                padding: '1px',
              }}
            >
              {gridTiles.map((row, rowIndex) =>
                row.map((tile, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={cn(
                      "w-[50px] h-[50px] bg-white border border-gray-300 relative",
                      "cursor-pointer hover:bg-gray-100"
                    )}
                    style={
                      tile
                        ? {
                            backgroundImage: `url(${images[tile.imageIndex]})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            transform: `rotate(${tile.rotation}deg)`,
                          }
                        : {}
                    }
                  />
                ))
              )}
            </div>
          )}

          {/* Dragged tile */}
          {touchDragActive && draggedTileData && touchPosition && (
            <div
              className="absolute w-[50px] h-[50px] border border-gray-300 pointer-events-none z-40"
              style={{
                left: touchPosition.x - 25,
                top: touchPosition.y - 25,
                transform: `rotate(${draggedTileData.rotation}deg)`,
                backgroundImage: `url(${images[draggedTileData.imageIndex]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-[5px] left-0 right-0 flex flex-col items-center gap-1 pb-10 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={handleOrderClick}
            className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
          >
            Order
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-start gap-10 mt-2.5">
          <div className="flex flex-col items-center">
            <div className="flex gap-2">
              <span className="text-sm font-medium">S0:</span>
              <span className="text-sm">{imageCounts.S0}</span>
              <span className="text-sm">x 7€</span>
            </div>
            <span className="text-sm">{(imageCounts.S0 * 7)}€</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex gap-2">
              <span className="text-sm font-medium">S1:</span>
              <span className="text-sm">{imageCounts.S1}</span>
              <span className="text-sm">x 12€</span>
            </div>
            <span className="text-sm">{(imageCounts.S1 * 12)}€</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex gap-2">
              <span className="text-sm font-medium">S2:</span>
              <span className="text-sm">{imageCounts.S2}</span>
              <span className="text-sm">x 12€</span>
            </div>
            <span className="text-sm">{(imageCounts.S2 * 12)}€</span>
          </div>
        </div>

        <div className="text-sm mt-2.5 flex items-center gap-4">
          <span>
            {horizontal && vertical && `${parseInt(horizontal) * 15} x ${parseInt(vertical) * 15} cm`}
          </span>
          <span className="font-bold">
            {((imageCounts.S0 * 7) + (imageCounts.S1 * 12) + (imageCounts.S2 * 12)).toFixed(2)}€
          </span>
        </div>
      </div>
    </div>
  );
};