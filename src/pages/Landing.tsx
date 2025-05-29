
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const navigate = useNavigate();

  const handleDesignClick = () => {
    navigate("/design");
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

      {/* Video Space - Full Width */}
      <div className="w-full flex-1">
        <video 
          playsInline
          autoPlay 
          muted 
          loop 
          className="w-full h-full object-cover" 
          src="https://i.imgur.com/XnMKUGn.mp4"
        >
          Your browser does not support the video tag.
        </video>
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
