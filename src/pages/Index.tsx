
import { useState } from "react";
import { GridPuzzle } from "@/components/GridPuzzle";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

const Index = () => {
  const [showIntro, setShowIntro] = useState(true);

  const handleCloseIntro = () => {
    setShowIntro(false);
  };

  return (
    <>
      <GridPuzzle />
      
      <Dialog open={showIntro} onOpenChange={handleCloseIntro}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Game Instructions</DialogTitle>
            <DialogDescription>Learn how to play the game</DialogDescription>
          </DialogHeader>
          <img
            src="https://i.imgur.com/fubvRXX.jpeg"
            alt="Game Instructions"
            className="w-full h-auto"
          />
          <div className="flex justify-center items-center p-2">
            <video 
              autoPlay 
              muted 
              loop 
              className="w-full rounded-md shadow-md" 
              src="https://i.imgur.com/XnMKUGn.mp4"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Index;
