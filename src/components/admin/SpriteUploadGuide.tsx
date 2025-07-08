import React from 'react';
import { Info, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SPRITE_UPLOAD_GUIDELINES } from '@/types/pet-animations';

export default function SpriteUploadGuide() {
  const downloadTemplate = () => {
    // Create a visual template showing the layout
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw grid
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      
      // Draw horizontal lines (between animations)
      for (let y = 0; y <= 256; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(128, y);
        ctx.stroke();
      }
      
      // Draw vertical lines (between frames)
      for (let x = 0; x <= 128; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 256);
        ctx.stroke();
      }
      
      // Add labels
      ctx.fillStyle = '#666';
      ctx.font = '10px Arial';
      const labels = ['Idle', 'Walk', 'Run', 'Jump', 'Eat', 'Happy', 'Sad', 'Sleep'];
      labels.forEach((label, index) => {
        ctx.fillText(label, 2, index * 32 + 12);
      });
      
      // Add frame numbers
      ctx.font = '8px Arial';
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 4; col++) {
          ctx.fillText(`F${col + 1}`, col * 32 + 2, row * 32 + 28);
        }
      }
    }
    
    // Download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pet-sprite-template.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Sprite Sheet Format Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Required Format:</h4>
          <p className="text-sm text-gray-700">{SPRITE_UPLOAD_GUIDELINES.format}</p>
          <p className="text-sm text-gray-700 mt-1">
            Standard size: <code className="bg-gray-100 px-1 rounded">{SPRITE_UPLOAD_GUIDELINES.standardSize}</code>
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Animation Layout (Top to Bottom):</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            {SPRITE_UPLOAD_GUIDELINES.animations.map((anim, index) => (
              <div key={index} className="flex items-center gap-2 text-sm py-1">
                <div 
                  className="w-6 h-6 border border-gray-300 flex items-center justify-center text-xs font-mono"
                  style={{ backgroundColor: `hsl(${index * 45}, 70%, 85%)` }}
                >
                  {index}
                </div>
                <span>{anim}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Important Notes:</h4>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {SPRITE_UPLOAD_GUIDELINES.notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>

        <div className="pt-2">
          <Button 
            onClick={downloadTemplate}
            variant="outline"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Template Grid
          </Button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Pro tip:</strong> Test your sprite sheet with a transparent background 
            to ensure smooth animations. Each frame should have the pet centered for best results.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}