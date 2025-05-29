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
    const updateGrid = () => {
      if (headerRef.current) {
        const headerHeight = headerRef.current.offsetHeight;
        setHeaderHeight(headerHeight);

        const footerHeight = 100; // Approximate footer height
        const availableHeight = window.innerHeight - headerHeight - footerHeight;
        const availableWidth = window.innerWidth;

        // Calculate grid dimensions with 1px grout
        const tileSize = 51; // 50px tile + 1px grout
        const cols = Math.floor(availableWidth / tileSize);
        const rows = Math.floor(availableHeight / tileSize);

        setGridDimensions({ cols, rows });

        // Calculate center position for the central grout
        const centerCol = Math.floor(cols / 2);
        const centerRow = Math.floor(rows / 2);

        // Calculate starting position to center the grid
        const totalGridWidth = cols * tileSize - 1; // -1 because last tile doesn't need grout
        const totalGridHeight = rows * tileSize - 1;
        const startX = (availableWidth - totalGridWidth) / 2;
        const startY = headerHeight + (availableHeight - totalGridHeight) / 2;

        // Generate tiles for the grid using a systematic approach to prevent overlapping
        const newTiles: StaticTile[] = [];
        const occupiedPositions = new Set<string>();

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            // Skip the center position for the grout
            if (row === centerRow && col === centerCol) {
              continue;
            }

            const x = Math.round(startX + col * tileSize);
            const y = Math.round(startY + row * tileSize);
            const positionKey = `${x}-${y}`;

            // Only add tile if position is not occupied
            if (!occupiedPositions.has(positionKey)) {
              occupiedPositions.add(positionKey);

              newTiles.push({
                id: `tile-${row}-${col}`,
                gridX: x,
                gridY: y,
                rotation: Math.floor(Math.random() * 4) * 90,
                imageIndex: Math.floor(Math.random() * images.length),
              });
            }
          }
        }

        setStaticTiles(newTiles);
      }
    };

    updateGrid();
    window.addEventListener('resize', updateGrid);
    return () => window.removeEventListener('resize', updateGrid);
  }, [images]);

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
    <div className="min-h-screen flex flex-col">
      {/* Header Image - Full Width */}
      <div className="w-full pt-[10px]" ref={headerRef}>
        <img
          src="https://i.imgur.com/fubvRXX.jpeg"
          alt="Game Instructions"
          className="w-full h-auto block object-contain"
        />
      </div>

      {/* Static Grid Space - Full Width */}
      <div className="w-full flex-1 relative bg-white overflow-hidden">
        {staticTiles.map((tile) => (
          <div
            key={tile.id}
            className={`absolute cursor-pointer transition-all duration-200 hover:scale-105 ${
              draggedTile === tile.id ? 'opacity-50 scale-110' : ''
            }`}
            style={{
              left: `${tile.gridX}px`,
              top: `${tile.gridY}px`,
              width: '50px',
              height: '50px',
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