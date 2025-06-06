
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";

interface StaticTile {
  id: string;
  gridX: number;
  gridY: number;
  rotation: number;
  imageIndex: number;
}

const Landing = () => {
  const navigate = useNavigate();
  const [staticTiles, setStaticTiles] = useState<StaticTile[]>([]);
  const [gridDimensions, setGridDimensions] = useState({ cols: 0, rows: 0 });
  const [headerHeight, setHeaderHeight] = useState(0);
  const [draggedTile, setDraggedTile] = useState<string | null>(null);
  const [touchDragActive, setTouchDragActive] = useState<boolean>(false);
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null);
  const [draggedTileData, setDraggedTileData] = useState<StaticTile | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tilesContainerRef = useRef<HTMLDivElement>(null);
  
  const images = [
    'https://i.imgur.com/RSSS8zt.png',
    'https://i.imgur.com/6xIAB8j.png',
    'https://i.imgur.com/eRSAL3Z.png'
  ];

  useEffect(() => {
    // Calculate header height and generate grid
    const calculateAndGenerate = () => {
      if (headerRef.current) {
        const newHeaderHeight = headerRef.current.offsetHeight;
        setHeaderHeight(newHeaderHeight);
        
        // Generate grid immediately after getting header height
        const isMobileDevice = window.innerWidth <= 768;
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        setIsTouchDevice(isTouch);
        const tileSize = isMobileDevice ? 61 : 51; // 60px tiles + 1px grout on mobile
        const footerHeight = isMobileDevice ? 64 : 80; // Fixed footer height
        const availableWidth = window.innerWidth;
        const availableHeight = window.innerHeight - newHeaderHeight - footerHeight;
        
        // Start from center and build outward to ensure center grout stays centered
        const centerX = availableWidth / 2;
        const centerY = availableHeight / 2;
        
        // Calculate how many tiles can fit on each side of center
        const maxColsLeft = Math.floor(centerX / tileSize);
        const maxColsRight = Math.floor(centerX / tileSize);
        const maxRows = Math.floor(availableHeight / tileSize);
        
        // Create center column first
        const tiles: StaticTile[] = [];
        let index = 0;
        
        // Center grout line is exactly at centerX - 0.5
        const centerGroutX = centerX - 0.5;
        
        // Calculate vertical start position to center the grid vertically
        const totalGridHeight = maxRows * tileSize;
        const startY = (availableHeight - totalGridHeight) / 2;
        
        for (let row = 0; row < maxRows; row++) {
          const y = row * tileSize + startY + 0.5;
          
          // Build tiles to the right of center grout (starting immediately after grout)
          for (let col = 0; col < maxColsRight; col++) {
            const x = centerGroutX + 0.5 + (col * tileSize);
            if (x + tileSize <= availableWidth) {
              tiles.push({
                id: `static-tile-${index}`,
                gridX: x,
                gridY: y,
                rotation: Math.floor(Math.random() * 4) * 90,
                imageIndex: Math.floor(Math.random() * images.length),
              });
              index++;
            }
          }
          
          // Build tiles to the left of center grout
          for (let col = 1; col <= maxColsLeft; col++) {
            const x = centerGroutX + 0.5 - (col * tileSize);
            if (x >= 0) {
              tiles.push({
                id: `static-tile-${index}`,
                gridX: x,
                gridY: y,
                rotation: Math.floor(Math.random() * 4) * 90,
                imageIndex: Math.floor(Math.random() * images.length),
              });
              index++;
            }
          }
        }
        
        const totalCols = maxColsLeft + maxColsRight;
        
        setGridDimensions({ cols: totalCols, rows: maxRows });
        setStaticTiles(tiles);
      }
    };

    // Mobile-specific timing handling
    const isMobile = window.innerWidth <= 768;
    const delay = isMobile ? 1200 : 800;
    
    let stabilizationTimer: NodeJS.Timeout;
    let measurementCount = 0;
    let lastViewportHeight = 0;
    
    const checkViewportStabilization = () => {
      const currentHeight = window.innerHeight;
      
      if (currentHeight === lastViewportHeight) {
        measurementCount++;
        if (measurementCount >= 3) {
          // Viewport has been stable for 3 measurements, proceed
          calculateAndGenerate();
          return;
        }
      } else {
        measurementCount = 0;
        lastViewportHeight = currentHeight;
      }
      
      stabilizationTimer = setTimeout(checkViewportStabilization, 100);
    };
    
    // Use longer delay for mobile, then check viewport stabilization
    const timer = setTimeout(() => {
      if (isMobile) {
        lastViewportHeight = window.innerHeight;
        checkViewportStabilization();
      } else {
        calculateAndGenerate();
      }
    }, delay);
    
    // Regenerate on window resize with debounce
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(calculateAndGenerate, 150);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(calculateAndGenerate, 200);
    });
    
    return () => {
      clearTimeout(timer);
      clearTimeout(stabilizationTimer);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', calculateAndGenerate);
    };
  }, []);

  // Add native touch event listeners for active touch handling
  useEffect(() => {
    if (!isTouchDevice || !tilesContainerRef.current) return;

    const container = tilesContainerRef.current;

    const handleNativeTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const tileId = target.closest('[data-tile-id]')?.getAttribute('data-tile-id');
      if (tileId) {
        console.log('Native touch start fired for tile:', tileId);
        const tileData = staticTiles.find(t => t.id === tileId);
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
      console.log('Native touch move fired, drag active:', touchDragActive, 'dragged tile:', draggedTile);
      if (touchDragActive && draggedTile) {
        e.preventDefault();
        const touch = e.touches[0];
        setTouchPosition({ x: touch.clientX, y: touch.clientY });
      }
    };

    const handleNativeTouchEnd = (e: TouchEvent) => {
      console.log('Native touch end fired, drag active:', touchDragActive, 'dragged tile:', draggedTile);
      
      if (!touchDragActive || !draggedTile) {
        setTouchDragActive(false);
        setDraggedTile(null);
        return;
      }

      const touch = e.changedTouches[0];
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      console.log('Element below finger:', elementBelow);
      
      // Look for tile container using closest() to handle images inside tiles
      const tileContainer = elementBelow?.closest('[data-tile-id]');
      const targetTileId = tileContainer?.getAttribute('data-tile-id');
      console.log('Target tile ID:', targetTileId, 'Dragged tile ID:', draggedTile);
      
      if (targetTileId && targetTileId !== draggedTile) {
        console.log('Performing tile swap');
        setStaticTiles(prevTiles => {
          const newTiles = [...prevTiles];
          const draggedIndex = newTiles.findIndex(t => t.id === draggedTile);
          const targetIndex = newTiles.findIndex(t => t.id === targetTileId);
          
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
  }, [isTouchDevice, touchDragActive, draggedTile, images.length, staticTiles]);

  const handleDesignClick = () => {
    // Detect if device is mobile/touch
    const isMobileDevice = window.innerWidth <= 768;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Redirect to appropriate design page
    if (isMobileDevice || isTouchDevice) {
      navigate("/design/mobile");
    } else {
      navigate("/design/desktop");
    }
  };

  const handleTileClick = (tileId: string) => {
    setStaticTiles(prev => prev.map(tile => 
      tile.id === tileId 
        ? { ...tile, rotation: (tile.rotation + 90) % 360 }
        : tile
    ));
  };

  const handleDragStart = (e: React.DragEvent, tileId: string) => {
    setDraggedTile(tileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTileId: string) => {
    e.preventDefault();
    
    if (!draggedTile || draggedTile === targetTileId) {
      setDraggedTile(null);
      return;
    }

    setStaticTiles(prev => {
      const newTiles = [...prev];
      const draggedIndex = newTiles.findIndex(t => t.id === draggedTile);
      const targetIndex = newTiles.findIndex(t => t.id === targetTileId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Store the dragged tile's image properties
        const draggedImageIndex = newTiles[draggedIndex].imageIndex;
        const draggedRotation = newTiles[draggedIndex].rotation;
        
        // Move the dragged tile's image to the target position
        newTiles[targetIndex] = {
          ...newTiles[targetIndex],
          imageIndex: draggedImageIndex,
          rotation: draggedRotation,
        };
        
        // Replace the dragged tile with a new random one
        newTiles[draggedIndex] = {
          ...newTiles[draggedIndex],
          rotation: Math.floor(Math.random() * 4) * 90,
          imageIndex: Math.floor(Math.random() * images.length),
        };
      }
      
      return newTiles;
    });
    
    setDraggedTile(null);
  };

  const handleDragEnd = () => {
    setDraggedTile(null);
  };

  // Touch event handlers for mobile with debug logging
  const handleTouchStart = (e: React.TouchEvent, tileId: string) => {
    console.log('Touch start fired for tile:', tileId);
    setTouchDragActive(true);
    setDraggedTile(tileId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    console.log('Touch move fired, drag active:', touchDragActive, 'dragged tile:', draggedTile);
    if (!touchDragActive || !draggedTile) return;
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    console.log('Touch end fired, drag active:', touchDragActive, 'dragged tile:', draggedTile);
    
    // Clear timeout
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }

    if (!touchDragActive || !draggedTile) {
      setTouchDragActive(false);
      setDraggedTile(null);
      return;
    }

    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    console.log('Element below finger:', elementBelow);
    
    if (elementBelow && elementBelow.getAttribute('data-tile-id')) {
      const targetTileId = elementBelow.getAttribute('data-tile-id');
      console.log('Target tile ID:', targetTileId, 'Dragged tile ID:', draggedTile);
      
      if (targetTileId && targetTileId !== draggedTile) {
        console.log('Performing tile swap');
        // Perform the swap
        setStaticTiles(prevTiles => {
          const newTiles = [...prevTiles];
          const draggedIndex = newTiles.findIndex(t => t.id === draggedTile);
          const targetIndex = newTiles.findIndex(t => t.id === targetTileId);
          
          if (draggedIndex !== -1 && targetIndex !== -1) {
            // Store the dragged tile's image properties
            const draggedImageIndex = newTiles[draggedIndex].imageIndex;
            const draggedRotation = newTiles[draggedIndex].rotation;
            
            // Move the dragged tile's image to the target position
            newTiles[targetIndex] = {
              ...newTiles[targetIndex],
              imageIndex: draggedImageIndex,
              rotation: draggedRotation,
            };
            
            // Replace the dragged tile with a new random one
            newTiles[draggedIndex] = {
              ...newTiles[draggedIndex],
              rotation: Math.floor(Math.random() * 4) * 90,
              imageIndex: Math.floor(Math.random() * images.length),
            };
          }
          
          return newTiles;
        });
      }
    }

    setDraggedTile(null);
    setTouchDragActive(false);
  };

  return (
    <div 
      className="h-screen flex flex-col"
      style={{ 
        touchAction: 'pan-none',
        overflow: 'hidden',
        height: '100dvh'
      }}
    >
      {/* Header Image - Responsive */}
      <div className="w-full flex-shrink-0 px-2 pt-2 md:px-4 md:pt-[20px]" ref={headerRef}>
        <img
          src="https://i.imgur.com/fubvRXX.jpeg"
          alt="Game Instructions"
          className="w-full h-auto max-h-[15vh] md:max-h-none object-contain"
        />
      </div>

      {/* Static Grid Space - Flexible with bottom padding for footer */}
      <div 
        ref={tilesContainerRef}
        className="w-full flex-1 relative bg-white overflow-hidden min-h-0 pb-16 md:pb-20"
      >
        {staticTiles.map((tile) => (
          <div
            key={tile.id}
            className={`absolute cursor-pointer transition-all duration-200 hover:scale-105 ${
              draggedTile === tile.id ? 'opacity-50 scale-110' : ''
            }`}
            style={{
              left: `${tile.gridX}px`,
              top: `${tile.gridY}px`,
              width: window.innerWidth <= 768 ? '60px' : '50px',
              height: window.innerWidth <= 768 ? '60px' : '50px',
              border: '1px solid white',
              boxSizing: 'border-box',
              touchAction: 'manipulation'
            }}
            data-tile-id={tile.id}
            draggable={!isTouchDevice}
            onDragStart={!isTouchDevice ? (e) => handleDragStart(e, tile.id) : undefined}
            onDragOver={!isTouchDevice ? handleDragOver : undefined}
            onDrop={!isTouchDevice ? (e) => handleDrop(e, tile.id) : undefined}
            onDragEnd={!isTouchDevice ? handleDragEnd : undefined}

            onClick={() => handleTileClick(tile.id)}
          >
            <img
              src={images[tile.imageIndex]}
              alt={`Tile ${tile.imageIndex}`}
              className="w-full h-full object-cover"
              style={{
                transform: `rotate(${tile.rotation}deg)`,
              }}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Floating tile during touch drag */}
      {touchDragActive && draggedTileData && touchPosition && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: touchPosition.x - 30,
            top: touchPosition.y - 30,
            width: '60px',
            height: '60px',
            transform: 'scale(1.1)',
            opacity: 0.8,
          }}
        >
          <img
            src={images[draggedTileData.imageIndex]}
            alt="Dragging tile"
            className="w-full h-full object-cover rounded"
            style={{
              transform: `rotate(${draggedTileData.rotation}deg)`,
            }}
          />
        </div>
      )}

      {/* Footer Button - Always visible */}
      <div className="w-full h-16 md:h-20 flex-shrink-0 bg-white flex items-center justify-center fixed bottom-0 left-0 right-0 z-50">
        <Button 
          onClick={handleDesignClick}
          className="px-8 py-3 text-lg font-semibold bg-black text-white hover:bg-gray-800"
        >
          design!
        </Button>
      </div>
    </div>
  );
};

export default Landing;
