
import { useEffect, useState } from "react";
import { GridPuzzle } from "@/components/GridPuzzle";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

const Index = () => {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // Check if we've shown the intro before
    const hasSeenIntro = localStorage.getItem("hasSeenIntro");
    if (hasSeenIntro) {
      setShowIntro(false);
    } else {
      // Set a flag in localStorage so we only show it once
      localStorage.setItem("hasSeenIntro", "true");
    }
  }, []);

  return (
    <>
      <GridPuzzle />
      
      <Dialog open={showIntro} onOpenChange={setShowIntro}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold mb-2">Welcome to Grid Puzzle!</DialogTitle>
            <DialogDescription className="text-base">
              Watch how to play the game:
            </DialogDescription>
          </DialogHeader>
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
