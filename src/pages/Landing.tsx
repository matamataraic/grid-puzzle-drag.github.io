
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
  const headerRef = useRef<HTMLDivElement>(null);
  
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
        const isMobile = window.innerWidth <= 768;
        const tileSize = isMobile ? 61 : 51; // 60px tiles + 1px grout on mobile
        const footerHeight = isMobile ? 80 : 104; // Adequate footer on mobile
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

    // Single calculation after a delay to ensure DOM is ready
    const timer = setTimeout(calculateAndGenerate, 200);
    
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
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', calculateAndGenerate);
    };
  }, []);

  const handleDesignClick = () => {
    navigate("/design");
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

  return (
    <div 
      className="h-screen flex flex-col overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* Header Image - Responsive */}
      <div className="w-full flex-shrink-0 px-2 pt-2 md:px-4 md:pt-[20px]" ref={headerRef}>
        <img
          src="https://i.imgur.com/fubvRXX.jpeg"
          alt="Game Instructions"
          className="w-full h-auto max-h-[15vh] md:max-h-none object-contain"
        />
      </div>

      {/* Static Grid Space - Flexible */}
      <div className="w-full flex-1 relative bg-white overflow-hidden min-h-0">
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
              boxSizing: 'border-box'
            }}
            draggable
            onDragStart={(e) => handleDragStart(e, tile.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, tile.id)}
            onDragEnd={handleDragEnd}
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

      {/* Footer Button - Always visible */}
      <div className="w-full flex-shrink-0 bg-white py-4 md:py-8 flex justify-center border-t border-gray-200 z-50 relative">
        <Button 
          onClick={handleDesignClick}
          className="px-8 py-3 md:px-8 md:py-4 text-lg md:text-lg font-semibold bg-black text-white hover:bg-gray-800 z-50"
        >
          design!
        </Button>
      </div>
    </div>
  );
};

export default Landing;
