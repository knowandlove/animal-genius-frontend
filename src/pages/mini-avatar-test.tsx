import { MiniAvatar } from "@/components/mini-avatar/MiniAvatar";
import LayeredAvatar from "@/components/avatar-v2/LayeredAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const testAnimals = [
  { type: "border collie", equipped: { hat: "safari", glasses: "greenblinds", accessory: "necklace" } },
  { type: "dolphin", equipped: { hat: "explorer" } },
  { type: "elephant", equipped: { glasses: "hearts" } },
  { type: "owl", equipped: { accessory: "bow_tie" } },
];

const sizes = [24, 32, 40, 48, 64];

export default function MiniAvatarTest() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Mini Avatar Test - Head Crop vs Full Body</h1>
      
      {/* Head Crop Mode (Default) */}
      <Card>
        <CardHeader>
          <CardTitle>Head Crop Mode (Default)</CardTitle>
          <p className="text-sm text-muted-foreground">Shows zoomed-in view focusing on the head area</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {testAnimals.map((animal, idx) => (
              <div key={idx}>
                <h3 className="font-semibold mb-3 capitalize">{animal.type}</h3>
                <div className="flex items-center gap-4 flex-wrap">
                  {sizes.map(size => (
                    <div key={size} className="text-center">
                      <MiniAvatar 
                        animalType={animal.type}
                        equipped={animal.equipped}
                        size={size}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{size}px</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Full Body Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Full Body Mode</CardTitle>
          <p className="text-sm text-muted-foreground">Shows the complete avatar</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {testAnimals.map((animal, idx) => (
              <div key={idx}>
                <h3 className="font-semibold mb-3 capitalize">{animal.type}</h3>
                <div className="flex items-center gap-4 flex-wrap">
                  {sizes.map(size => (
                    <div key={size} className="text-center">
                      <MiniAvatar 
                        animalType={animal.type}
                        equipped={animal.equipped}
                        size={size}
                        showFullBody={true}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{size}px</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison in Context */}
      <Card>
        <CardHeader>
          <CardTitle>In Context - Student List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="p-3 border rounded-lg flex items-center gap-3 hover:bg-gray-50">
              <MiniAvatar animalType="border collie" equipped={{ hat: "safari", glasses: "greenblinds" }} size={40} />
              <div>
                <div className="font-medium">Blakely C</div>
                <div className="text-sm text-muted-foreground">Grade 5 • Border Collie</div>
              </div>
            </div>
            <div className="p-3 border rounded-lg flex items-center gap-3 hover:bg-gray-50">
              <MiniAvatar animalType="dolphin" equipped={{ hat: "explorer" }} size={40} />
              <div>
                <div className="font-medium">Sarah M</div>
                <div className="text-sm text-muted-foreground">Grade 6 • Dolphin</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fine Tuning Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Fine Tuning Preview</CardTitle>
          <p className="text-sm text-muted-foreground">Adjust zoom and offset to find the perfect crop</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <h4 className="text-sm font-medium mb-2">Current (2.5x, 0.75 offset)</h4>
              <MiniAvatar animalType="border collie" equipped={{ hat: "safari" }} size={64} />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-medium mb-2">Less Zoom (2x, 0.5 offset)</h4>
              <div className="inline-block rounded-full overflow-hidden ring-2 ring-gray-200 relative bg-gray-100" style={{ width: 64, height: 64 }}>
                <div className="absolute" style={{ width: 128, height: 128, top: -32, left: -32 }}>
                  <LayeredAvatar animalType="border collie" items={{ hat: "safari" }} width={128} height={128} animated={false} />
                </div>
              </div>
            </div>
            <div className="text-center">
              <h4 className="text-sm font-medium mb-2">More Zoom (3x, 1 offset)</h4>
              <div className="inline-block rounded-full overflow-hidden ring-2 ring-gray-200 relative bg-gray-100" style={{ width: 64, height: 64 }}>
                <div className="absolute" style={{ width: 192, height: 192, top: -64, left: -64 }}>
                  <LayeredAvatar animalType="border collie" items={{ hat: "safari" }} width={192} height={192} animated={false} />
                </div>
              </div>
            </div>
            <div className="text-center">
              <h4 className="text-sm font-medium mb-2">Full Body</h4>
              <MiniAvatar animalType="border collie" equipped={{ hat: "safari" }} size={64} showFullBody={true} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
