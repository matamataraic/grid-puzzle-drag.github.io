
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
        <DialogContent className="w-[85vw] h-[85vh] md:w-[25vw] md:h-[85vh] p-0 overflow-hidden max-w-[85vw] max-h-[85vh] md:max-w-[25vw] md:max-h-[85vh] top-[5vh] translate-y-0 flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Game Instructions</DialogTitle>
            <DialogDescription>Learn how to play the game</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto flex flex-col">
            <img
              src="https://i.imgur.com/fubvRXX.jpeg"
              alt="Game Instructions"
              className="w-full object-contain mt-2"
            />
            <div className="flex justify-center items-center p-2 flex-1">
              <video 
                playsInline
                autoPlay 
                muted 
                loop 
                className="w-full h-auto rounded-md shadow-md max-h-full object-contain" 
                src="https://i.imgur.com/XnMKUGn.mp4"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Index;
