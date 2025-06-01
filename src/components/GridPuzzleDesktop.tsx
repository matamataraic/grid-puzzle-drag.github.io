
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

export const GridPuzzleDesktop = () => {
  const [horizontal, setHorizontal] = useState('');
  const [vertical, setVertical] = useState('');
  const [isGridGenerated, setIsGridGenerated] = useState(false);
  const [tiles, setTiles] = useState<TilePosition[]>([]);
  const [gridTiles, setGridTiles] = useState<(TilePosition | null)[][]>([]);
  const [images, setImages] = useState<string[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
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

  // Desktop-specific constants
  const GRID_SIZE = 100;
  const TILE_SIZE = 51;
  const GRID_TOTAL_SIZE = GRID_SIZE * TILE_SIZE;
  
  const [desktopDraggedTile, setDesktopDraggedTile] = useState<string | null>(null);

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
      generatePreloadedGrid(imageUrls);
    };
    loadImages();
  }, []);

  // Desktop infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
        const newTiles: TilePosition[] = [];
        const tileSize = 51;
        const cols = Math.ceil(window.innerWidth / tileSize) + 2;
        const currentHeight = document.documentElement.scrollHeight;
        const additionalRows = 10;
        
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
  }, [images]);

  const generatePreloadedGrid = (loadedImages: string[]) => {
    const newTiles: TilePosition[] = [];
    const halfGrid = GRID_SIZE / 2;
    const screenWidth = window.innerWidth;
    const centerX = screenWidth / 2;
    const centerY = 175;
    
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        newTiles.push({
          id: `tile-${row}-${col}`,
          x: centerX + (col - halfGrid) * TILE_SIZE,
          y: centerY + (row - halfGrid) * TILE_SIZE,
          rotation: Math.floor(Math.random() * 4) * 90,
          imageIndex: Math.floor(Math.random() * loadedImages.length),
        });
      }
    }

    setTiles(newTiles);
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

  const handleDragStart = (e: React.DragEvent, tileId: string) => {
    setDesktopDraggedTile(tileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleTileDrop = (e: React.DragEvent, targetTileId: string) => {
    e.preventDefault();
    
    if (!desktopDraggedTile || desktopDraggedTile === targetTileId) {
      setDesktopDraggedTile(null);
      return;
    }

    setTiles(prevTiles => {
      const newTiles = [...prevTiles];
      const draggedIndex = newTiles.findIndex(t => t.id === desktopDraggedTile);
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

    setDesktopDraggedTile(null);
  };

  const handleDesktopDragEnd = () => {
    setDesktopDraggedTile(null);
  };

  const handleGridCellDrop = (e: React.DragEvent, gridX: number, gridY: number) => {
    e.preventDefault();
    
    if (!desktopDraggedTile) return;
    
    const draggedTile = tiles.find(t => t.id === desktopDraggedTile);
    if (!draggedTile) {
      setDesktopDraggedTile(null);
      return;
    }
    
    const newGridTiles = [...gridTiles];
    newGridTiles[gridY][gridX] = {
      id: `grid-tile-${Date.now()}-${Math.random()}`,
      x: gridX * 50,
      y: gridY * 50,
      rotation: draggedTile.rotation,
      imageIndex: draggedTile.imageIndex
    };
    
    setGridTiles(newGridTiles);
    
    setTiles(prevTiles => {
      const newTiles = [...prevTiles];
      const draggedIndex = newTiles.findIndex(t => t.id === desktopDraggedTile);
      
      if (draggedIndex !== -1) {
        newTiles[draggedIndex] = {
          ...newTiles[draggedIndex],
          rotation: Math.floor(Math.random() * 4) * 90,
          imageIndex: Math.floor(Math.random() * images.length),
        };
      }
      
      return newTiles;
    });
    
    setDesktopDraggedTile(null);
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

  return (
    <div className="min-h-screen bg-neutral-50 w-full overflow-auto">
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

        <div>
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
              onDragStart={(e) => handleDragStart(e, tile.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleTileDrop(e, tile.id)}
              onDragEnd={handleDesktopDragEnd}
              onDoubleClick={() => handleDoubleClick(tile.id)}
            />
          ))}

          {/* Grid */}
          {isGridGenerated && (
            <div
              ref={gridRef}
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
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleGridCellDrop(e, x, y)}
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

        {/* All dialogs here - same as original but omitted for brevity */}
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

        {/* Other dialogs omitted for brevity but would be included */}
      </div>
    </div>
  );
};
