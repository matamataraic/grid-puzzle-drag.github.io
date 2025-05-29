
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
    // Calculate header height
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    // Generate static grid of tiles that fills the entire available space
    const generateStaticGrid = () => {
      const tileSize = 51; // 50px tile + 1px white border
      const footerHeight = 104; // Actual footer height (py-8 = 32px top/bottom + content)
      const availableWidth = window.innerWidth;
      const availableHeight = window.innerHeight - headerHeight - footerHeight;
      
      const cols = Math.floor(availableWidth / tileSize);
      const rows = Math.floor(availableHeight / tileSize);
      
      setGridDimensions({ cols, rows });
      
      const tiles: StaticTile[] = [];
      let index = 0;
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          tiles.push({
            id: `static-tile-${index}`,
            gridX: col,
            gridY: row,
            rotation: Math.floor(Math.random() * 4) * 90,
            imageIndex: Math.floor(Math.random() * images.length),
          });
          index++;
        }
      }
      setStaticTiles(tiles);
    };

    if (headerHeight > 0) {
      generateStaticGrid();
    }
    
    // Regenerate on window resize
    const handleResize = () => {
      if (headerHeight > 0) {
        generateStaticGrid();
      }
    };
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [headerHeight]);

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
        // Swap positions
        const draggedGridX = newTiles[draggedIndex].gridX;
        const draggedGridY = newTiles[draggedIndex].gridY;
        
        newTiles[draggedIndex].gridX = newTiles[targetIndex].gridX;
        newTiles[draggedIndex].gridY = newTiles[targetIndex].gridY;
        
        newTiles[targetIndex].gridX = draggedGridX;
        newTiles[targetIndex].gridY = draggedGridY;
        
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
    <div className="min-h-screen flex flex-col">
      {/* Header Image - Full Width */}
      <div className="w-full" ref={headerRef}>
        <img
          src="https://i.imgur.com/fubvRXX.jpeg"
          alt="Game Instructions"
          className="w-full h-auto block object-contain"
        />
      </div>

      {/* Static Grid Space - Full Width */}
      <div className="w-full flex-1 relative bg-black">
        {staticTiles.map((tile) => (
          <div
            key={tile.id}
            className={`absolute cursor-pointer transition-all duration-200 hover:scale-105 border border-white ${
              draggedTile === tile.id ? 'opacity-50 scale-110' : ''
            }`}
            style={{
              left: `${tile.gridX * 51}px`,
              top: `${tile.gridY * 51}px`,
              width: '50px',
              height: '50px',
              backgroundColor: 'black',
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

      {/* Footer Button - Blank Strip */}
      <div className="w-full bg-background py-8 flex justify-center">
        <Button 
          onClick={handleDesignClick}
          className="px-8 py-4 text-lg font-semibold"
        >
          design!
        </Button>
      </div>
    </div>
  );
};

export default Landing;
