import { useState } from 'react';
import { AnimalType, AvatarCustomization } from '@shared/game-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AnimalAvatar } from './AnimalAvatar';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface AvatarCustomizerProps {
  animal: AnimalType;
  initialCustomization?: AvatarCustomization;
  onSave: (customization: AvatarCustomization) => void;
  onCancel?: () => void;
}

export function AvatarCustomizer({ 
  animal, 
  initialCustomization = {},
  onSave,
  onCancel
}: AvatarCustomizerProps) {
  const [customization, setCustomization] = useState<AvatarCustomization>(initialCustomization);

  const accessoryOptions = {
    glasses: [
      { id: 'none', label: 'No Glasses', value: undefined },
      { id: 'round', label: 'Round', value: 'round' as const },
      { id: 'square', label: 'Square', value: 'square' as const },
      { id: 'star', label: 'Star', value: 'star' as const }
    ],
    hat: [
      { id: 'none', label: 'No Hat', value: undefined },
      { id: 'cap', label: 'Cap', value: 'cap' as const },
      { id: 'party', label: 'Party', value: 'party' as const },
      { id: 'crown', label: 'Crown', value: 'crown' as const }
    ],
    neckItem: [
      { id: 'none', label: 'Nothing', value: undefined },
      { id: 'bowtie', label: 'Bowtie', value: 'bowtie' as const },
      { id: 'scarf', label: 'Scarf', value: 'scarf' as const },
      { id: 'necklace', label: 'Necklace', value: 'necklace' as const }
    ]
  };

  const handleAccessoryChange = (
    category: keyof AvatarCustomization, 
    value: string | undefined
  ) => {
    setCustomization(prev => {
      const updated = { ...prev };
      if (value === undefined) {
        delete updated[category];
      } else {
        updated[category] = value as any;
      }
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Customize Your Avatar</h3>
        <motion.div
          key={JSON.stringify(customization)}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="inline-block"
        >
          <AnimalAvatar 
            animal={animal} 
            customization={customization}
            size="xl"
          />
        </motion.div>
      </div>

      {/* Customization Options */}
      <div className="space-y-4">
        {/* Glasses */}
        <div>
          <h4 className="text-sm font-medium mb-2">Glasses</h4>
          <div className="grid grid-cols-4 gap-2">
            {accessoryOptions.glasses.map(option => (
              <Card
                key={option.id}
                className={`p-3 cursor-pointer transition-all ${
                  customization.glasses === option.value 
                    ? 'border-primary bg-primary/10' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleAccessoryChange('glasses', option.value)}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">
                    {option.value === 'round' && '🥽'}
                    {option.value === 'square' && '🤓'}
                    {option.value === 'star' && '✨'}
                    {!option.value && '—'}
                  </div>
                  <p className="text-xs">{option.label}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Hat */}
        <div>
          <h4 className="text-sm font-medium mb-2">Hat</h4>
          <div className="grid grid-cols-4 gap-2">
            {accessoryOptions.hat.map(option => (
              <Card
                key={option.id}
                className={`p-3 cursor-pointer transition-all ${
                  customization.hat === option.value 
                    ? 'border-primary bg-primary/10' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleAccessoryChange('hat', option.value)}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">
                    {option.value === 'cap' && '🧢'}
                    {option.value === 'party' && '🎉'}
                    {option.value === 'crown' && '👑'}
                    {!option.value && '—'}
                  </div>
                  <p className="text-xs">{option.label}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Neck Item */}
        <div>
          <h4 className="text-sm font-medium mb-2">Neck Item</h4>
          <div className="grid grid-cols-4 gap-2">
            {accessoryOptions.neckItem.map(option => (
              <Card
                key={option.id}
                className={`p-3 cursor-pointer transition-all ${
                  customization.neckItem === option.value 
                    ? 'border-primary bg-primary/10' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleAccessoryChange('neckItem', option.value)}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">
                    {option.value === 'bowtie' && '🎀'}
                    {option.value === 'scarf' && '🧣'}
                    {option.value === 'necklace' && '📿'}
                    {!option.value && '—'}
                  </div>
                  <p className="text-xs">{option.label}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        )}
        <Button
          onClick={() => onSave(customization)}
          className="flex-1"
        >
          <Check className="w-4 h-4 mr-2" />
          Save Avatar
        </Button>
      </div>
    </div>
  );
}