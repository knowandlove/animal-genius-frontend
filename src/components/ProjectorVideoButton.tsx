import { Play, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectorVideoButtonProps {
  videoId: string;
  title?: string;
  className?: string;
}

export function ProjectorVideoButton({ 
  videoId, 
  title = "Student Video",
  className = "" 
}: ProjectorVideoButtonProps) {
  
  const openProjectorWindow = () => {
    // Calculate window size (16:9 aspect ratio)
    const width = 1024;
    const height = 576;
    
    // Center the window on screen
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    // Create the Vimeo embed URL
    const embedUrl = `https://player.vimeo.com/video/${videoId}?color=829B79&title=0&byline=0&portrait=0&autoplay=1`;
    
    // Open the window with specific features
    const popupWindow = window.open(
      '',
      'projectorVideo',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,directories=no,status=no`
    );
    
    if (popupWindow) {
      // Write a simple HTML page with the video embed
      popupWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title} - Projector View</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background: #000;
              overflow: hidden;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
            }
            iframe {
              width: 100%;
              height: 100vh;
              border: none;
            }
            .header {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              background: rgba(0,0,0,0.8);
              color: white;
              padding: 10px 20px;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 14px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              z-index: 10;
            }
            .tip {
              opacity: 0.8;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <strong>${title}</strong>
              <span class="tip"> • Drag this window to your projector screen</span>
            </div>
            <button onclick="document.querySelector('.header').style.display='none'" style="background: transparent; border: 1px solid white; color: white; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
              Hide Header
            </button>
          </div>
          <iframe
            src="${embedUrl}"
            allow="autoplay; fullscreen; picture-in-picture"
            allowfullscreen
          ></iframe>
        </body>
        </html>
      `);
      popupWindow.document.close();
    }
  };
  
  return (
    <Button
      onClick={openProjectorWindow}
      variant="outline"
      size="default"
      className={`inline-flex items-center gap-2 font-normal ${className}`}
    >
      <Play className="w-4 h-4" />
      Play Student Video
      <ExternalLink className="w-4 h-4 opacity-60" />
    </Button>
  );
}