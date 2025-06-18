import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ColorPreview() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">New Color Palette Preview</h1>
        <p className="text-muted-foreground">Modern Ocean Blue & Coral Theme</p>
      </div>

      {/* Current Palette */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Current Active Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="w-full h-16 bg-primary rounded-lg"></div>
            <p className="text-sm font-medium">Primary (Ocean Blue)</p>
            <p className="text-xs text-muted-foreground">#2563EB</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-16 bg-secondary rounded-lg"></div>
            <p className="text-sm font-medium">Secondary (Coral)</p>
            <p className="text-xs text-muted-foreground">#FF6B6B</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-16 bg-accent rounded-lg"></div>
            <p className="text-sm font-medium">Accent (Emerald)</p>
            <p className="text-xs text-muted-foreground">#10B981</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-16 bg-muted rounded-lg border"></div>
            <p className="text-sm font-medium">Muted (Light Gray)</p>
            <p className="text-xs text-muted-foreground">#F1F5F9</p>
          </div>
        </div>
      </Card>

      {/* Component Examples */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Component Examples</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="destructive">Destructive Button</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>Default Badge</Badge>
            <Badge variant="secondary">Secondary Badge</Badge>
            <Badge variant="outline">Outline Badge</Badge>
            <Badge variant="destructive">Destructive Badge</Badge>
          </div>
        </div>
      </Card>

      {/* Alternative Palettes */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Alternative Color Options</h2>
        <div className="grid gap-6">
          
          {/* Brand Colors Applied */}
          <div className="border-l-4 border-primary pl-4">
            <h3 className="font-semibold mb-2">✓ Active Brand Colors (Style Guide)</h3>
            <div className="flex gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-primary"></div>
              <div className="w-8 h-8 rounded bg-secondary"></div>
              <div className="w-8 h-8 rounded bg-accent"></div>
            </div>
            <p className="text-sm text-muted-foreground">Matching your visual brand identity</p>
          </div>

          {/* Gaming Colors */}
          <div className="border-l-4 border-accent pl-4">
            <h3 className="font-semibold mb-2">Gaming Interface Colors</h3>
            <div className="flex gap-2 mb-2">
              <div className="w-8 h-8 rounded game-primary"></div>
              <div className="w-8 h-8 rounded game-success"></div>
              <div className="w-8 h-8 rounded game-warning"></div>
            </div>
            <p className="text-sm text-muted-foreground">Cohesive gaming experience using brand palette</p>
          </div>
        </div>
      </Card>

      {/* Animal Gradients */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Updated Animal Gradients</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <div className="w-full h-16 meerkat-gradient rounded-lg"></div>
            <p className="text-sm font-medium">Meerkat</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-16 panda-gradient rounded-lg"></div>
            <p className="text-sm font-medium">Panda</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-16 owl-gradient rounded-lg"></div>
            <p className="text-sm font-medium">Owl</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-16 beaver-gradient rounded-lg"></div>
            <p className="text-sm font-medium">Beaver</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-16 elephant-gradient rounded-lg"></div>
            <p className="text-sm font-medium">Elephant</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-16 otter-gradient rounded-lg"></div>
            <p className="text-sm font-medium">Otter</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-16 parrot-gradient rounded-lg"></div>
            <p className="text-sm font-medium">Parrot</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-16 border-collie-gradient rounded-lg"></div>
            <p className="text-sm font-medium">Border Collie</p>
          </div>
        </div>
      </Card>

      {/* Background Options */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Background Options</h2>
        <div className="grid gap-4">
          
          {/* Current Background */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">✓ Current: Brand Color Accents</h3>
            <div className="h-24 rounded border bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-16 h-16 bg-primary/10 rounded-full blur-xl"></div>
              <div className="absolute bottom-0 right-0 w-12 h-12 bg-secondary/10 rounded-full blur-lg"></div>
              <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-accent/5 rounded-full blur-md"></div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">✓ Active: Subtle brand color orbs in background</p>
          </div>

          {/* Option 1: Simple Gradient */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Option 1: Soft Layers</h3>
            <div className="h-24 rounded border bg-gradient-to-br from-white via-slate-50 to-slate-100"></div>
            <p className="text-sm text-muted-foreground mt-2">Three-layer gradient for depth</p>
          </div>

          {/* Option 2: Brand Color Orbs */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Option 2: Brand Color Accents</h3>
            <div className="h-24 rounded border bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-16 h-16 bg-primary/10 rounded-full blur-xl"></div>
              <div className="absolute bottom-0 right-0 w-12 h-12 bg-secondary/10 rounded-full blur-lg"></div>
              <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-accent/5 rounded-full blur-md"></div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Subtle brand color orbs in background</p>
          </div>

          {/* Option 3: Geometric Pattern */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Option 3: Subtle Pattern</h3>
            <div className="h-24 rounded border bg-white" style={{
              backgroundImage: `linear-gradient(135deg, transparent 25%, #f1f5f9 25%, #f1f5f9 50%, transparent 50%, transparent 75%, #f1f5f9 75%)`,
              backgroundSize: '60px 60px'
            }}></div>
            <p className="text-sm text-muted-foreground mt-2">Geometric pattern for texture</p>
          </div>

          {/* Option 4: Dots */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Option 4: Minimal Dots</h3>
            <div className="h-24 rounded border bg-white" style={{
              backgroundImage: `radial-gradient(circle, #e2e8f0 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }}></div>
            <p className="text-sm text-muted-foreground mt-2">Minimal dot pattern</p>
          </div>

          {/* Option 5: Organic Waves */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Option 5: Organic Waves</h3>
            <div className="h-24 rounded border overflow-hidden relative bg-white">
              <div className="absolute inset-0" style={{
                background: `linear-gradient(45deg, transparent 30%, hsl(var(--primary))/0.05 30%, hsl(var(--primary))/0.05 70%, transparent 70%),
                            linear-gradient(-45deg, transparent 30%, hsl(var(--secondary))/0.03 30%, hsl(var(--secondary))/0.03 70%, transparent 70%)`,
                backgroundSize: '80px 80px'
              }}></div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Organic flowing pattern</p>
          </div>

          {/* Option 6: Hexagon Grid */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Option 6: Hexagon Grid</h3>
            <div className="h-24 rounded border bg-white" style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, hsl(var(--muted)) 2px, transparent 2px)`,
              backgroundSize: '30px 26px'
            }}></div>
            <p className="text-sm text-muted-foreground mt-2">Structured hexagon pattern</p>
          </div>

          {/* Option 7: Gaming Theme */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Option 7: Gaming Environment</h3>
            <div className="h-24 rounded border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
              <div className="absolute inset-0" style={{
                background: `radial-gradient(circle at 20% 80%, hsl(var(--accent))/0.2 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, hsl(var(--primary))/0.15 0%, transparent 50%),
                            radial-gradient(circle at 40% 40%, hsl(var(--secondary))/0.1 0%, transparent 50%)`
              }}></div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Dark gaming atmosphere with brand accents</p>
          </div>

          {/* Option 8: Mesh Gradient */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Option 8: Mesh Gradient</h3>
            <div className="h-24 rounded border bg-gradient-to-br from-primary/5 via-white to-secondary/5 relative">
              <div className="absolute inset-0 bg-gradient-to-tl from-accent/3 via-transparent to-primary/3"></div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Multi-layered mesh gradients</p>
          </div>

        </div>
        
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm"><strong>Current:</strong> Soft layers background is now active. The layered gradients create a gentle, professional appearance with subtle brand color hints.</p>
        </div>
      </Card>
    </div>
  );
}