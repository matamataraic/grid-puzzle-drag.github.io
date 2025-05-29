
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

  return (
    <>
      <GridPuzzle />
      
      <Dialog open={showIntro} onOpenChange={setShowIntro}>
        <DialogContent className="w-fit h-fit p-0 overflow-hidden max-w-[90vw] max-h-[90vh] border-0 shadow-none bg-transparent">
          <DialogHeader className="sr-only">
            <DialogTitle>Game Instructions</DialogTitle>
            <DialogDescription>Learn how to play the game</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col">
            <img
              src="https://i.imgur.com/fubvRXX.jpeg"
              alt="Game Instructions"
              className="w-full h-auto block"
            />
            <video 
              playsInline
              autoPlay 
              muted 
              loop 
              className="w-full h-auto block" 
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
