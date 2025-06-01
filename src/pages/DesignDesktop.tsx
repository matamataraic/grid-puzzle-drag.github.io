
import { useState } from "react";
import { GridPuzzleDesktop } from "@/components/GridPuzzleDesktop";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

const DesignDesktop = () => {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <>
      <GridPuzzleDesktop />
      
      <Dialog open={showIntro} onOpenChange={setShowIntro}>
        <DialogContent className="w-[90vw] h-[90vh] p-0 overflow-hidden border bg-background shadow-lg flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Game Instructions</DialogTitle>
            <DialogDescription>Learn how to play the game</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col h-full pt-12">
            <img
              src="https://i.imgur.com/fubvRXX.jpeg"
              alt="Game Instructions"
              className="w-full h-auto block object-contain"
            />
            <video 
              playsInline
              autoPlay 
              muted 
              loop 
              className="w-full flex-1 object-cover" 
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

export default DesignDesktop;
