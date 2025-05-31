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

export const GridPuzzle = () => {
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
  const [headerImage, setHeaderImage] = useState('https://i.imgur.com/uYx6gJV.jpeg');
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

  // Mobile detection
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  };

  // State for mobile zoom and pan
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0, scale: 1 });
  const [hasGeneratedZoomTiles, setHasGeneratedZoomTiles] = useState(false);
  
  // Touch drag states
  const [touchDragActive, setTouchDragActive] = useState(false);
  const [draggedTile, setDraggedTile] = useState<string | null>(null);
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null);
  const [draggedTileData, setDraggedTileData] = useState<TilePosition | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch device
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
  }, []);

  useEffect(() => {
    // Only add scroll functionality for desktop
    if (!isMobile()) {
      const handleScroll = () => {
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
          const newTiles: TilePosition[] = [];
          const tileSize = 51;
          const cols = Math.ceil(window.innerWidth / tileSize) + 2;
          const currentHeight = document.documentElement.scrollHeight;
          const additionalRows = 10;
          
          // Generate full-width rows of tiles when scrolling
          for (let row = 0; row < additionalRows; row++) {
            for (let col = 0; col < cols; col++) {
              newTiles.push({
                id: `tile-${Date.now()}-${row}-${col}`,
                x: col * tileSize - tileSize,
                y: currentHeight + (row * tileSize),
                rotation: Math.floor(Math.random() * 4) * 90,
                imageIndex: Math.floor(Math.random() * images.length),
              });
            }
          }
          
          setTiles(prev => [...prev, ...newTiles]);
          document.documentElement.style.minHeight = `${document.documentElement.scrollHeight + (additionalRows * tileSize)}px`;
        }
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [images]);

  // Mobile touch handlers for zoom and pan
  const handleTouchStart = (e) => {
    if (!isMobile()) return;
    
    // Two-finger interactions for zoom/pan
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
    // Single finger interactions are handled by tile touch events
  };

  const handleTouchMove = (e) => {
    if (!isMobile()) return;
    
    // Only process two-finger interactions for zoom/pan
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

      // Scale - limit zoom in to 1.0 (original size), allow zoom out to 0.3
      const newScale = Math.max(0.3, Math.min(1.0, scale * (distance / lastTouch.scale)));
      setScale(newScale);

      // Pan
      const deltaX = centerX - lastTouch.x;
      const deltaY = centerY - lastTouch.y;
      setTranslateX(prev => prev + deltaX);
      setTranslateY(prev => prev + deltaY);

      setLastTouch({ x: centerX, y: centerY, scale: distance });

      // Generate new tiles when zoomed out significantly (only once)
      if (newScale < 0.6 && !hasGeneratedZoomTiles) {
        generateMoreTilesForZoom();
        setHasGeneratedZoomTiles(true);
      }
      
      // Reset zoom tiles flag when zooming back in
      if (newScale > 0.8 && hasGeneratedZoomTiles) {
        setHasGeneratedZoomTiles(false);
        // Clean up zoom tiles to prevent memory buildup
        setTiles(prev => prev.filter(tile => !tile.id.includes('zoom-tile')));
      }
    }
  };

  const generateMoreTilesForZoom = () => {
    const newTiles: TilePosition[] = [];
    const tileSize = 51;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Calculate grid bounds based on current view and scale
    const viewportCols = Math.ceil(screenWidth / tileSize / scale) + 5;
    const viewportRows = Math.ceil(screenHeight / tileSize / scale) + 5;
    
    // Generate tiles in a larger area around the current view
    const startCol = Math.floor(-translateX / tileSize / scale) - viewportCols;
    const endCol = Math.floor(-translateX / tileSize / scale) + viewportCols;
    const startRow = Math.floor(-translateY / tileSize / scale) - viewportRows;
    const endRow = Math.floor(-translateY / tileSize / scale) + viewportRows;
    
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        // Check if tile already exists at this position
        const existingTile = tiles.find(t => 
          Math.abs(t.x - col * tileSize) < 1 && Math.abs(t.y - row * tileSize) < 1
        );
        
        if (!existingTile) {
          newTiles.push({
            id: `zoom-tile-${Date.now()}-${row}-${col}-${Math.random()}`,
            x: col * tileSize,
            y: row * tileSize,
            rotation: Math.floor(Math.random() * 4) * 90,
            imageIndex: Math.floor(Math.random() * images.length),
          });
        }
      }
    }
    
    if (newTiles.length > 0) {
      setTiles(prev => [...prev, ...newTiles]);
    }
  };

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
      generateRandomTiles(imageUrls);
    };
    loadImages();
  }, []);

  const generateRandomTiles = (loadedImages: string[]) => {
    const newTiles: TilePosition[] = [];
    
    const tileSize = 51; // 50px + 1px spacing
    const cols = Math.ceil(window.innerWidth / tileSize) + 2; // Extra columns for edge coverage
    const rows = Math.ceil(window.innerHeight / tileSize) + 4; // Extra rows for scrolling

    let index = 0;

    // Generate tiles to cover the entire screen width from left to right
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        newTiles.push({
          id: `tile-${index}`,
          x: col * tileSize - tileSize, // Start slightly off-screen left
          y: row * tileSize,
          rotation: Math.floor(Math.random() * 4) * 90,
          imageIndex: Math.floor(Math.random() * loadedImages.length),
        });
        index++;
      }
    }

    setTiles(newTiles);
  };

  // Native touch event listeners for background tiles
  useEffect(() => {
    if (!isTouchDevice || !tilesContainerRef.current) return;

    const container = tilesContainerRef.current;

    const handleNativeTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return; // Only single finger
      
      const target = e.target as HTMLElement;
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
      if (e.touches.length !== 1) return; // Only single finger
      
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
      
      // Check if dropped on background tile
      const backgroundTileContainer = elementBelow?.closest('[data-tile-id]');
      const backgroundTileId = backgroundTileContainer?.getAttribute('data-tile-id');
      
      // Check if dropped on grid
      const gridContainer = elementBelow?.closest('[data-grid-container]');
      
      if (backgroundTileId && backgroundTileId !== draggedTile) {
        // Swap with another background tile
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
        // Drop on grid - use existing grid drop logic
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
          
          // Replace with new random tile
          const newTile: TilePosition = {
            id: `tile-${Date.now()}`,
            x: draggedTileData.x,
            y: draggedTileData.y,
            rotation: Math.floor(Math.random() * 4) * 90,
            imageIndex: Math.floor(Math.random() * images.length),
          };
          
          setTiles(prev => prev.filter(t => t.id !== draggedTile).concat([newTile]));
        } else {
          // Replace with new random tile if dropped outside valid grid
          const draggedTileData = tiles.find(t => t.id === draggedTile);
          if (draggedTileData) {
            const newTile: TilePosition = {
              id: `tile-${Date.now()}`,
              x: draggedTileData.x,
              y: draggedTileData.y,
              rotation: Math.floor(Math.random() * 4) * 90,
              imageIndex: Math.floor(Math.random() * images.length),
            };
            
            setTiles(prev => prev.filter(t => t.id !== draggedTile).concat([newTile]));
          }
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
  }, [isTouchDevice, touchDragActive, draggedTile, tiles, gridTiles, horizontal, vertical, images.length]);

  const centerGridOnScreen = (cols: number, rows: number) => {
    if (isMobile()) {
      const gridWidth = cols * 50;
      const gridHeight = rows * 50;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Calculate center position
      const centerX = (screenWidth - gridWidth) / 2;
      const centerY = (screenHeight - gridHeight) / 2;
      
      // Set translation to center the grid
      setTranslateX(-centerX);
      setTranslateY(-centerY);
      setScale(1);
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
    
    // Center the grid on screen
    centerGridOnScreen(h, v);
    
    setIsGridGenerated(true);
  };

  const handleRestart = () => {
    setHorizontal('');
    setVertical('');
    setIsGridGenerated(false);
    setGridTiles([]);
    setImageCounts({ S0: 0, S1: 0, S2: 0 });
  };

  const handleDragEnd = (
    event: any,
    info: any,
    tileId: string,
  ) => {
    if (!gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const x = event.clientX - gridRect.left;
    const y = event.clientY - gridRect.top;

    const cellX = Math.floor(x / 50);
    const cellY = Math.floor(y / 50);

    const draggedTile = tiles.find(t => t.id === tileId);

    if (
      draggedTile &&
      cellX >= 0 &&
      cellX < parseInt(horizontal) &&
      cellY >= 0 &&
      cellY < parseInt(vertical)
    ) {
      const updatedGrid = [...gridTiles];
      
      // Always place the dragged tile in the target cell, preserving its rotation
      updatedGrid[cellY][cellX] = { 
        id: `grid-tile-${cellY}-${cellX}`, // Give it a new ID for the grid
        x: cellX * 50, // Grid position
        y: cellY * 50, // Grid position
        rotation: draggedTile.rotation, // Preserve the rotation from the background tile
        imageIndex: draggedTile.imageIndex // Preserve the image from the background tile
      };
      
      setGridTiles(updatedGrid);
      
      // Remove the dragged tile from floating tiles and replace it with a new random one
      const newTile: TilePosition = {
        id: `tile-${Date.now()}`,
        x: draggedTile.x,
        y: draggedTile.y,
        rotation: Math.floor(Math.random() * 4) * 90,
        imageIndex: Math.floor(Math.random() * images.length),
      };
      
      setTiles(prev => prev.filter(t => t.id !== tileId).concat([newTile]));
    } else {
      // If dropped outside the grid, replace the original tile with a new random one
      if (draggedTile) {
        const newTile: TilePosition = {
          id: `tile-${Date.now()}`,
          x: draggedTile.x,
          y: draggedTile.y,
          rotation: Math.floor(Math.random() * 4) * 90,
          imageIndex: Math.floor(Math.random() * images.length),
        };
        
        setTiles(prev => prev.filter(t => t.id !== tileId).concat([newTile]));
      }
    }
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
      setTiles(prev => prev.filter(t => t.id !== tileId));
      
      const newTile: TilePosition = {
        id: `tile-${Date.now()}`,
        x: tile.x,
        y: tile.y,
        rotation: Math.floor(Math.random() * 4) * 90,
        imageIndex: Math.floor(Math.random() * images.length),
      };
      setTiles(prev => [...prev, newTile]);
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

  const handleRandom = () => {
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
    
    // Center the grid on screen
    centerGridOnScreen(randomH, randomV);
  };

  const handleSave = async () => {
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

  const getCurrentDateTime = () => {
    const date = new Date();
    return `${getCurrentDate()} ${date.toLocaleTimeString('hr-HR', { 
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\./g, '')}`;
  };

  const handleOrderClick = () => {
    const hasEmptyCells = gridTiles.some(row => row.some(cell => cell === null));
    if (hasEmptyCells) {
      setShowWarning(true);
    } else {
      setShowOrder(true);
    }
  };

  return (
    <div 
      className={`min-h-screen bg-neutral-50 w-full ${isMobile() ? 'overflow-hidden' : 'overflow-auto'}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      style={{
        touchAction: isMobile() ? 'none' : 'auto',
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
          style={{
            transform: isMobile() ? `translate(${translateX}px, ${translateY}px) scale(${scale})` : 'none',
            transformOrigin: 'center center',
            position: isMobile() ? 'fixed' : 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        >
          {/* Background tiles */}
          {tiles.map((tile) => (
            <img
              key={tile.id}
              src={images[tile.imageIndex]}
              className={cn(
                'absolute w-[50px] h-[50px] cursor-move',
                'hover:shadow-lg transition-shadow'
              )}
              style={{
                left: tile.x,
                top: tile.y,
                transform: `rotate(${tile.rotation}deg)`,
                zIndex: 1,
                opacity: 0.08
              }}
              draggable
              onClick={() => handleTileClick(tile.id)}
              onDragEnd={(event) => {
                const info = { point: { x: event.clientX, y: event.clientY } };
                handleDragEnd(event, info, tile.id);
              }}
              onDoubleClick={() => handleDoubleClick(tile.id)}
            />
          ))}

          {/* Grid - positioned to be centered in viewport */}
          {isGridGenerated && (
            <div
              ref={gridRef}
              className="relative border border-BLACK bg-white z-10"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${horizontal}, 50px)`,
                gridTemplateRows: `repeat(${vertical}, 50px)`,
                position: 'absolute',
                left: isMobile() ? `calc(50vw - ${(parseInt(horizontal) * 50) / 2}px)` : 'calc(50% - calc(var(--grid-width) / 2))',
                top: isMobile() ? `calc(50vh - ${(parseInt(vertical) * 50) / 2}px)` : '175px',
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

        <Dialog open={showInfo} onOpenChange={setShowInfo}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>info</DialogTitle>
              <DialogDescription className="text-left space-y-2">
                <p>eco friendly pločice 15x15cm s 3d uzorkom izrađene od smjese recikliranog papira</p>
                <p>***svaka*** pločica je handmade i zbog toga jedinstvena i drukčija od prethodne</p>
                <p>odabir običnih pločica - lijepljenje na podlogu (podloga se ne isporučuje; prijedlog: hamer papir, ljepenka, slikarsko platno)</p>
                <p>ili pločica s čičak trakom - međusobno povezivanje i mogućnost naknadne izmjene / dopune kompozicije po želji</p>
                <p>•••      </p>
                <p>S0 prazna pločica</p>
                <p>S1 pločica s ravnim linijama</p>
                <p>S2 pločica sa zaobljenim linijama</p>
                <p>•••      </p>
                <p>• zadaj broj polja u širinu (š) i visinu (v) (jedno polje 15x15cm), klikni "start"</p>
                <p>• "Rndm" za slučajno postavljanje kompozicije</p>
                <p>• crno polje = prazno polje</p>
                <p>• stvori svoju kompoziciju povlačenjem odabrane pločice na odabrano polje ili dvostrukim klikom na pločicu popuni prvo prazno polje</p>
                <p>• promijeni orijentaciju pločice jednim klikom</p>
                <p>• ukloni pločicu dvostrukim klikom</p>
                <p>• "clear" zadrži raspored polja, pobriši pločice</p>
                <p>• "restart" kreni od nule</p>
                <p>• -OKO- za pregled kompozicije</p>
                <p>• "order" pokreni narudžbu</p>
                <p>• -DISKETA- za pohranu trenutne kompozicije</p>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <Dialog open={showWarning} onOpenChange={setShowWarning}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upozorenje</DialogTitle>
              <DialogDescription className="text-left space-y-2">
                <p>Neka polja nisu popunjena</p>
                <p>(crno polje - prazno polje)</p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-4">
              <button
                onClick={() => setShowWarning(false)}
                className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
              >
                Nazad
              </button>
              <button
                onClick={() => {
                  setShowWarning(false);
                  setShowOrder(true);
                }}
                className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
              >
                Ok
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showFieldsWarning} onOpenChange={setShowFieldsWarning}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upozorenje</DialogTitle>
              <DialogDescription>
                Molimo popunite sva polja
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                onClick={() => setShowFieldsWarning(false)}
                className="px-6 py-2 bg-neutral-900 text-white rounded-md font-medium"
              >
                Ok
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showOrder} onOpenChange={setShowOrder}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{getOrderTitle()}</DialogTitle>
              <DialogDescription className="text-left space-y-4">
                <p>Ispunjavanjem ove forme generira se mail za narudžbu. nakon zaprimanja, na mail ćemo Vam poslati račun. obavijestit ćemo Vas o vidljivoj uplati nakon čega je rok isporuke dva tjedna</p>
                
                <RadioGroup value={orderType} onValueChange={(value) => setOrderType(value as "regular" | "magnetic")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="regular" id="regular" />
                    <Label htmlFor="regular">
                      {getOrderTitle()} - {((imageCounts.S0 * 7) + (imageCounts.S1 * 12) + (imageCounts.S2 * 12)).toFixed(2)}€
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="magnetic" id="magnetic" />
                    <Label htmlFor="magnetic">
                      {getOrderTitle()}  ˇ  - (pločice s čičak trakom za mogućnost mijenjanja kompozicije po želji) - {((imageCounts.S0 * 7) + (imageCounts.S1 * 12) + (imageCounts.S2 * 12) + (imageCounts.S0 + imageCounts.S1 + imageCounts.S2) * 3).toFixed(2)}€
                    </Label>
                  </div>
                </RadioGroup>

                <div className="space-y-2">
                  <p>S0: {imageCounts.S0} x 7€ = {imageCounts.S0 * 7}€</p>
                  <p>S1: {imageCounts.S1} x 12€ = {imageCounts.S1 * 12}€</p>
                  <p>S2: {imageCounts.S2} x 12€ = {imageCounts.S2 * 12}€</p>
                  {orderType === "magnetic" && (
                    <p>čičak dodatak: {(imageCounts.S0 + imageCounts.S1 + imageCounts.S2) * 3}€</p>
                  )}
                  <p>Dimenzije: {horizontal && vertical ? `${parseInt(horizontal) * 15} x ${parseInt(vertical) * 15} cm` : ''}</p>
                  <p className="font-bold">
                    Ukupno: {(
                      (imageCounts.S0 * 7) + 
                      (imageCounts.S1 * 12) + 
                      (imageCounts.S2 * 12) + 
                      (orderType === "magnetic" ? (imageCounts.S0 + imageCounts.S1 + imageCounts.S2) * 3 : 0)
                    ).toFixed(2)}€
                  </p>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Ime i prezime"
                    value={orderForm.name}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Ulica stanovanja"
                    value={orderForm.address}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Poštanski broj i grad"
                    value={orderForm.postalCode}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, postalCode: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Država"
                    value={orderForm.country}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-md"
                  />
                  <input
                    type="tel"
                    placeholder="Telefon"
                    value={orderForm.phone}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-md"
                  />
                  <input
                    type="email"
                    placeholder="E-mail"
                    value={orderForm.email}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-md"
                  />
                </div>

                <button
                  onClick={handleSubmitOrder}
                  className="w-full px-6 py-2 bg-neutral-900 text-white rounded-md font-medium mt-4"
                >
                  Pošalji
                </button>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-fit max-h-[90vh] p-6 overflow-auto">
            <DialogHeader>
              <DialogTitle>Preview</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center items-center p-4">
              <div 
                className="relative border border-gray-300 shadow-lg"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${horizontal}, 50px)`,
                  gridTemplateRows: `repeat(${vertical}, 50px)`,
                  minWidth: 'min-content',
                }}
              >
                {gridTiles.map((row, y) =>
                  row.map((tile, x) => (
                    <div
                      key={`${y}-${x}`}
                      className="w-[50px] h-[50px]"
                      style={{ backgroundColor: 'BLACK' }}
                    >
                      {tile && (
                        <img
                          src={
                            tile.imageIndex === 0
                              ? previewImages.S0
                              : tile.imageIndex === 1
                              ? previewImages.S1[tile.rotation as keyof typeof previewImages.S1]
                              : previewImages.S2[tile.rotation as keyof typeof previewImages.S2]
                          }
                          className="w-full h-full object-cover"
                          alt={`Preview tile ${y}-${x}`}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
