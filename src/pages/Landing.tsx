
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface StaticTile {
  id: string;
  x: number;
  y: number;
  rotation: number;
  imageIndex: number;
}

const Landing = () => {
  const navigate = useNavigate();
  const [staticTiles, setStaticTiles] = useState<StaticTile[]>([]);
  
  const images = [
    'https://i.imgur.com/RSSS8zt.png',
    'https://i.imgur.com/6xIAB8j.png',
    'https://i.imgur.com/eRSAL3Z.png'
  ];

  useEffect(() => {
    // Generate static grid of tiles that covers the video area
    const generateStaticGrid = () => {
      const tiles: StaticTile[] = [];
      const tileSize = 51;
      const cols = Math.floor(window.innerWidth / tileSize);
      const rows = Math.floor((window.innerHeight * 0.6) / tileSize); // Approximate video area height
      
      let index = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          tiles.push({
            id: `static-tile-${index}`,
            x: col * tileSize,
            y: row * tileSize,
            rotation: Math.floor(Math.random() * 4) * 90,
            imageIndex: Math.floor(Math.random() * images.length),
          });
          index++;
        }
      }
      setStaticTiles(tiles);
    };

    generateStaticGrid();
    
    // Regenerate on window resize
    const handleResize = () => generateStaticGrid();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Image - Full Width */}
      <div className="w-full">
        <img
          src="https://i.imgur.com/fubvRXX.jpeg"
          alt="Game Instructions"
          className="w-full h-auto block object-contain"
        />
      </div>

      {/* Static Grid Space - Full Width */}
      <div className="w-full flex-1 relative overflow-hidden bg-black">
        {staticTiles.map((tile) => (
          <div
            key={tile.id}
            className="absolute cursor-pointer transition-transform duration-200 hover:scale-105"
            style={{
              left: `${tile.x}px`,
              top: `${tile.y}px`,
              width: '50px',
              height: '50px',
              transform: `rotate(${tile.rotation}deg)`,
            }}
            onClick={() => handleTileClick(tile.id)}
          >
            <img
              src={images[tile.imageIndex]}
              alt={`Tile ${tile.imageIndex}`}
              className="w-full h-full object-cover border border-white/20"
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
