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

  // Mobile grid constants - viewport-based approach
  const TILE_SIZE = 51;
  
  // Fixed 10 tile buffer
  const bufferTiles = 10;

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

  // Generate background grid based on viewport + 10 tile buffer
  const generatePreloadedGridMobile = (loadedImages: string[]) => {
    const newTiles: TilePosition[] = [];
    
    // Calculate viewport in tiles
    const viewportWidthTiles = Math.ceil(window.innerWidth / TILE_SIZE);
    const viewportHeightTiles = Math.ceil(window.innerHeight / TILE_SIZE);
    
    // Add 10 tiles buffer in each direction
    const gridWidth = viewportWidthTiles + 20;
    const gridHeight = viewportHeightTiles + 20;
    
    // Position tiles starting at (0,0) - no centering
    let index = 0;
    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        newTiles.push({
          id: `tile-${index}`,
          x: col * TILE_SIZE,
          y: row * TILE_SIZE,
          rotation: Math.floor(Math.random() * 4) * 90,
          imageIndex: Math.floor(Math.random() * loadedImages.length),
        });
        index++;
      }
    }

    setTiles(newTiles);
    setScale(1);
    
    // Initial translation to show buffer tiles - center the view on buffer area
    const initialX = -(bufferTiles * TILE_SIZE);
    const initialY = -(bufferTiles * TILE_SIZE);
    setTranslateX(initialX);
    setTranslateY(initialY);
  };

  // Mobile touch handlers for separate pan and zoom gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
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

  // Calculate pan boundaries based on background grid size
  const getPanBoundaries = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Calculate background grid dimensions
    const viewportWidthTiles = Math.ceil(screenWidth / TILE_SIZE);
    const viewportHeightTiles = Math.ceil(screenHeight / TILE_SIZE);
    const gridWidth = viewportWidthTiles + 20; // +20 for 10 tiles buffer each side
    const gridHeight = viewportHeightTiles + 20;
    
    // Total grid size in pixels
    const totalGridWidth = gridWidth * TILE_SIZE;
    const totalGridHeight = gridHeight * TILE_SIZE;
    
    // Tiles positioned from (0,0) to (totalGridWidth, totalGridHeight)
    // Pan boundaries allow viewing entire grid area
    const minX = -(totalGridWidth - screenWidth); // Can pan to see rightmost tiles
    const maxX = 0; // Can pan to see leftmost tiles  
    const minY = -(totalGridHeight - screenHeight); // Can pan to see bottom tiles
    const maxY = 0; // Can pan to see top tiles
    
    return { minX, maxX, minY, maxY };
  };

  

  // Native touch handlers for tile dragging
  useEffect(() => {
    if (!tilesContainerRef.current) return;

    const container = tilesContainerRef.current;

    const handleNativeTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;

      const target = e.target as HTMLElement;

      if (target.closest('button') || target.closest('input') || target.closest('[role="button"]')) {
        return;
      }

      const tileElement = target.closest('[data-tile-id]');
      const tileId = tileElement?.getAttribute('data-tile-id');

      if (tileId && !touchDragActive) {
        const tileData = tiles.find(t => t.id === tileId);
        if (tileData) {
          setTouchDragActive(true);
          setDraggedTile(tileId);
          setDraggedTileData(tileData);
          const touch = e.touches[0];
          setTouchPosition({ x: touch.clientX, y: touch.clientY });
        }
      }
    };

    const handleNativeTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;

      if (touchDragActive && draggedTile) {
        e.preventDefault();
        const touch = e.touches[0];
        setTouchPosition({ x: touch.clientX, y: touch.clientY });
      }
    };

    const handleNativeTouchEnd = (e: TouchEvent) => {
      if (!touchDragActive || !draggedTile) {
        setTouchDragActive(false);
        setDraggedTile(null);
        setTouchPosition(null);
        setDraggedTileData(null);
        return;
      }

      const touch = e.changedTouches[0];
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);

      const backgroundTileContainer = elementBelow?.closest('[data-tile-id]');
      const backgroundTileId = backgroundTileContainer?.getAttribute('data-tile-id');

      const gridContainer = elementBelow?.closest('[data-grid-container]');

      if (backgroundTileId && backgroundTileId !== draggedTile) {
        // Swap tiles
        setTiles(prevTiles => {
          const newTiles = [...prevTiles];
          const draggedIndex = newTiles.findIndex(t => t.id === draggedTile);
          const targetIndex = newTiles.findIndex(t => t.id === backgroundTileId);

          if (draggedIndex !== -1 && targetIndex !== -1) {
            const draggedImageIndex = newTiles[draggedIndex].imageIndex;
            const draggedRotation = newTiles[draggedIndex].rotation;

            newTiles[targetIndex] = {
              ...newTiles[targetIndex],
              imageIndex: draggedImageIndex,
              rotation: draggedRotation,
            };

            newTiles[draggedIndex] = {
              ...newTiles[draggedIndex],
              rotation: Math.floor(Math.random() * 4) * 90,
              imageIndex: Math.floor(Math.random() * images.length),
            };
          }

          return newTiles;
        });
      } else if (gridContainer && gridRef.current) {
        // Drop on grid
        const gridRect = gridRef.current.getBoundingClientRect();
        const x = touch.clientX - gridRect.left;
        const y = touch.clientY - gridRect.top;
        const cellX = Math.floor(x / 50);
        const cellY = Math.floor(y / 50);

        const draggedTileData = tiles.find(t => t.id === draggedTile);

        if (
          draggedTileData &&
          cellX >= 0 &&
          cellX < parseInt(horizontal) &&
          cellY >= 0 &&
          cellY < parseInt(vertical)
        ) {
          const updatedGrid = [...gridTiles];
          updatedGrid[cellY][cellX] = { 
            id: `grid-tile-${cellY}-${cellX}`,
            x: cellX * 50,
            y: cellY * 50,
            rotation: draggedTileData.rotation,
            imageIndex: draggedTileData.imageIndex
          };

          setGridTiles(updatedGrid);

          setTiles(prev => prev.map(t => 
            t.id === draggedTile 
              ? { ...t, rotation: Math.floor(Math.random() * 4) * 90, imageIndex: Math.floor(Math.random() * images.length) }
              : t
          ));
        } else {
          setTiles(prev => prev.map(t => 
            t.id === draggedTile 
              ? { ...t, rotation: Math.floor(Math.random() * 4) * 90, imageIndex: Math.floor(Math.random() * images.length) }
              : t
          ));
        }
      }

      setDraggedTile(null);
      setTouchDragActive(false);
      setTouchPosition(null);
      setDraggedTileData(null);
    };

    container.addEventListener('touchstart', handleNativeTouchStart, { passive: false });
    container.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    container.addEventListener('touchend', handleNativeTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleNativeTouchStart);
      container.removeEventListener('touchmove', handleNativeTouchMove);
      container.removeEventListener('touchend', handleNativeTouchEnd);
    };
  }, [touchDragActive, draggedTile, tiles, gridTiles, horizontal, vertical, images.length]);

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

  const handleRotate = (y: number, x: number) => {
    const updatedGrid = [...gridTiles];
    if (updatedGrid[y][x]) {
      updatedGrid[y][x] = {
        ...updatedGrid[y][x]!,
        rotation: (updatedGrid[y][x]!.rotation + 90) % 360,
      };
      setGridTiles(updatedGrid);
    }
  };

  const handleTileClick = (tileId: string) => {
    setTiles(prev => prev.map(tile => 
      tile.id === tileId 
        ? { ...tile, rotation: (tile.rotation + 90) % 360 }
        : tile
    ));
  };

  const handleDoubleClick = (tileId: string) => {
    let placed = false;
    const updatedGrid = [...gridTiles];
    const tile = tiles.find((t) => t.id === tileId);

    if (!tile) return;

    for (let y = 0; y < updatedGrid.length && !placed; y++) {
      for (let x = 0; x < updatedGrid[y].length && !placed; x++) {
        if (updatedGrid[y][x] === null) {
          updatedGrid[y][x] = { ...tile };
          placed = true;
        }
      }
    }

    if (placed) {
      setGridTiles(updatedGrid);

      setTiles(prev => prev.map(t => 
        t.id === tileId 
          ? { ...t, rotation: Math.floor(Math.random() * 4) * 90, imageIndex: Math.floor(Math.random() * images.length) }
          : t
      ));
    }
  };

  const handleGridDoubleClick = (y: number, x: number) => {
    const updatedGrid = [...gridTiles];
    updatedGrid[y][x] = null;
    setGridTiles(updatedGrid);
  };

  const handleClear = () => {
    const newGrid = Array(parseInt(vertical))
      .fill(null)
      .map(() => Array(parseInt(horizontal)).fill(null));
    setGridTiles(newGrid);
  };

  const handleRandom = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const randomH = Math.floor(Math.random() * 9) + 2;
    const randomV = Math.floor(Math.random() * 9) + 2;
    setHorizontal(randomH.toString());
    setVertical(randomV.toString());

    const newGrid = Array(randomV).fill(null).map(() => 
      Array(randomH).fill(null).map(() => ({
        id: `tile-${Date.now()}-${Math.random()}`,
        x: 0,
        y: 0,
        rotation: Math.floor(Math.random() * 4) * 90,
        imageIndex: Math.floor(Math.random() * images.length),
      }))
    );

    setGridTiles(newGrid);
    setIsGridGenerated(true);
  };

  const handleSave = async () => {
    // Same save logic as desktop
    if (gridRef.current) {
      try {
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '-9999px';
        document.body.appendChild(tempContainer);

        const gridCopy = document.createElement('div');
        gridCopy.style.display = 'grid';
        gridCopy.style.gridTemplateColumns = `repeat(${horizontal}, 50px)`;
        gridCopy.style.gridTemplateRows = `repeat(${vertical}, 50px)`;
        gridCopy.style.width = `${parseInt(horizontal) * 50}px`;
        gridCopy.style.height = `${parseInt(vertical) * 50}px`;
        gridCopy.style.border = '1px solid white';
        gridCopy.style.backgroundColor = 'black';

        gridTiles.forEach((row, y) => {
          row.forEach((tile, x) => {
            const cell = document.createElement('div');
            cell.style.width = '50px';
            cell.style.height = '50px';
            cell.style.border = '1px solid white';
            cell.style.backgroundColor = 'black';

            if (tile) {
              const img = document.createElement('img');
              img.src = images[tile.imageIndex];
              img.style.width = '100%';
              img.style.height = '100%';
              img.style.objectFit = 'cover';
              img.style.transform = `rotate(${tile.rotation}deg)`;
              cell.appendChild(img);
            }

            gridCopy.appendChild(cell);
          });
        });

        tempContainer.appendChild(gridCopy);

        await Promise.all(
          Array.from(gridCopy.getElementsByTagName('img')).map(
            img => new Promise((resolve) => {
              if (img.complete) resolve(true);
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
            })
          )
        );

        const canvas = await html2canvas(gridCopy, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: 'black',
          scale: 2,
          logging: false,
          imageTimeout: 0,
          removeContainer: false
        });

        document.body.removeChild(tempContainer);

        const image = canvas.toDataURL('image/jpeg', 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = `${getOrderTitle()}.jpg`;
        link.click();
      } catch (error) {
        console.error('Error saving image:', error);
      }
    }
  };

  const handleSubmitOrder = () => {
    const areAllFieldsFilled = Object.values(orderForm).every(value => value.trim() !== '');
    if (!areAllFieldsFilled) {
      setShowFieldsWarning(true);
      return;
    }

    const subject = getOrderTitle();
    const totalS0 = imageCounts.S0 * 7;
    const totalS1 = imageCounts.S1 * 12;
    const totalS2 = imageCounts.S2 * 12;
    const magneticCost = orderType === "magnetic" ? (imageCounts.S0 + imageCounts.S1 + imageCounts.S2) * 3 : 0;
    const grandTotal = totalS0 + totalS1 + totalS2 + magneticCost;

    const body = `
    Ime i prezime: ${orderForm.name}
    Ulica stanovanja: ${orderForm.address}
    Poštanski broj i grad: ${orderForm.postalCode}
    Država: ${orderForm.country}
    Telefon: ${orderForm.phone}
    E-mail: ${orderForm.email}

    Narudžba:
    S0: ${imageCounts.S0} x 7€ = ${totalS0}€
    S1: ${imageCounts.S1} x 12€ = ${totalS1}€
    S2: ${imageCounts.S2} x 12€ = ${totalS2}€
    ${orderType === "magnetic" ? `čičak dodatak: ${magneticCost}€` : ''}

    Dimenzije: ${horizontal && vertical ? `${parseInt(horizontal) * 15} x ${parseInt(vertical) * 15} cm` : ''}
    Ukupno: ${grandTotal.toFixed(2)}€
    `;

    const mailtoLink = `mailto:comingsoon@planerai.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const getOrderTitle = () => {
    return `Kompozicija S0${imageCounts.S0} S1${imageCounts.S1} S2${imageCounts.S2} ${getCurrentDate()}`;
  };

  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString('hr-HR', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\./g, '');
  };

  const handleOrderClick = () => {
    const hasEmptyCells = gridTiles.some(row => row.some(cell => cell === null));
    if (hasEmptyCells) {
      setShowWarning(true);
    } else {
      setShowOrder(true);
    }
  };

  // Use all tiles since we only generate viewport-sized grid

  return (
    <div 
      className="min-h-screen bg-neutral-50 w-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      style={{
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      <div className="fixed top-0 left-0 right-0 h-[155px] bg-neutral-50 z-[5]" />
      <div className="fixed bottom-0 left-0 right-0 h-[195px] bg-neutral-50 z-[5]" />

      <div className="flex flex-col items-center pt-[20px] relative">
        <a 
          href="https://www.instagram.com/planerai/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="fixed top-[10px] z-[50]"
        >
          <img 
            src="https://i.imgur.com/uYx6gJV.jpeg" 
            alt="Header"
            className="w-[200px]"
          />
        </a>

        <div className="flex items-center gap-2 fixed top-[45px] z-20">
          <label className="text-sm font-medium">Š</label>
          <input
            type="text"
            maxLength={2}
            value={horizontal}
            onChange={(e) => setHorizontal(e.target.value.replace(/\D/g, ''))}
            className="w-16 h-8 text-center border border-neutral-300 rounded-md"
          />
          <span className="text-sm font-medium">×</span>
          <label className="text-sm font-medium">V</label>
          <input
            type="text"
            maxLength={2}
            value={vertical}
            onChange={(e) => setVertical(e.target.value.replace(/\D/g, ''))}
            className="w-16 h-8 text-center border border-neutral-300 rounded-md"
          />
        </div>

        <div className="fixed top-[95px] z-20 flex items-center gap-2">
          <button
            onClick={() => setShowInfo(true)}
            className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={handleStart}
            className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
          >
            Start
          </button>

          <button
            onClick={handleRandom}
            className="px-4 py-2 bg-neutral-900 text-white rounded-md font-medium"
          >
            Rndm
          </button>

          <button
            onClick={handleClear}
            className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
          >
            Clear
          </button>

          <button
            onClick={handleRestart}
            className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div
          ref={tilesContainerRef}
          style={{
            transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
            transformOrigin: 'center center',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        >
          {/* Background tiles - viewport-sized grid */}
          {tiles.map((tile) => (
            <img
              key={tile.id}
              data-tile-id={tile.id}
              src={images[tile.imageIndex]}
              className={cn(
                'absolute w-[50px] h-[50px] cursor-move'
              )}
              style={{
                left: tile.x,
                top: tile.y,
                transform: `rotate(${tile.rotation}deg)`,
                zIndex: 1,
                opacity: 0.08
              }}
              onClick={() => handleTileClick(tile.id)}
              onDoubleClick={() => handleDoubleClick(tile.id)}
            />
          ))}

          {/* Grid */}
          {isGridGenerated && (
            <div
              ref={gridRef}
              data-grid-container="true"
              className="fixed border border-BLACK bg-white z-10"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${horizontal}, 50px)`,
                gridTemplateRows: `repeat(${vertical}, 50px)`,
                left: `${(window.innerWidth - (parseInt(horizontal) * 50)) / 2}px`,
                top: '175px',
                borderWidth: '1px',
                borderColor: 'white'
              }}
            >
              {gridTiles.map((row, y) =>
                row.map((tile, x) => (
                  <div
                    key={`${y}-${x}`}
                    className="border border-white w-[50px] h-[50px]"
                    style={{ backgroundColor: 'BLACK' }}
                    onDoubleClick={() => handleGridDoubleClick(y, x)}
                  >
                    {tile && (
                      <img
                        src={images[tile.imageIndex]}
                        className="w-full h-full object-cover cursor-pointer"
                        style={{ transform: `rotate(${tile.rotation}deg)` }}
                        onClick={() => handleRotate(y, x)}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Floating tile during touch drag */}
        {touchDragActive && draggedTileData && touchPosition && (
          <div
            className="fixed pointer-events-none z-50"
            style={{
              left: touchPosition.x - 25,
              top: touchPosition.y - 25,
              width: '50px',
              height: '50px',
              transform: 'scale(1.1)',
              opacity: 0.8,
            }}
          >
            <img
              src={images[draggedTileData.imageIndex]}
              alt="Dragging tile"
              className="w-full h-full object-cover"
              style={{
                transform: `rotate(${draggedTileData.rotation}deg)`,
              }}
            />
          </div>
        )}

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

        {/* All dialogs - same as desktop but included for mobile */}
        {/* Dialogs omitted for brevity but would include all the same dialogs */}
      </div>
    </div>
  );
};