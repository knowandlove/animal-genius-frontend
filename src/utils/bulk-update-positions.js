// Script to bulk update item positions
// This will update all positions from the exported data

const positions = {
  "explorer": {
    "meerkat": {
      "x": 51,
      "y": 26,
      "scale": 0.45,
      "rotation": 0
    },
    "panda": {
      "x": 51,
      "y": 26,
      "scale": 0.45,
      "rotation": 0
    },
    "owl": {
      "x": 51,
      "y": 26,
      "scale": 0.45,
      "rotation": 0
    },
    "beaver": {
      "x": 51,
      "y": 26,
      "scale": 0.45,
      "rotation": 0
    },
    "elephant": {
      "x": 51,
      "y": 26,
      "scale": 0.45,
      "rotation": 0
    },
    "otter": {
      "x": 51,
      "y": 26,
      "scale": 0.45,
      "rotation": 0
    },
    "parrot": {
      "x": 51,
      "y": 26,
      "scale": 0.45,
      "rotation": 0
    },
    "border-collie": {
      "x": 51,
      "y": 26,
      "scale": 0.45,
      "rotation": 0
    }
  },
  "safari": {
    "meerkat": {
      "x": 51,
      "y": 26,
      "scale": 0.5,
      "rotation": -5
    },
    "panda": {
      "x": 51,
      "y": 26,
      "scale": 0.5,
      "rotation": -5
    },
    "owl": {
      "x": 51,
      "y": 26,
      "scale": 0.5,
      "rotation": -5
    },
    "beaver": {
      "x": 51,
      "y": 26,
      "scale": 0.5,
      "rotation": -5
    },
    "elephant": {
      "x": 51,
      "y": 26,
      "scale": 0.5,
      "rotation": -5
    },
    "otter": {
      "x": 51,
      "y": 26,
      "scale": 0.5,
      "rotation": -5
    },
    "parrot": {
      "x": 51,
      "y": 26,
      "scale": 0.5,
      "rotation": -5
    },
    "border-collie": {
      "x": 51,
      "y": 26,
      "scale": 0.5,
      "rotation": -5
    }
  },
  "greenblinds": {
    "meerkat": {
      "x": 51,
      "y": 32,
      "scale": 0.4,
      "rotation": 0
    },
    "panda": {
      "x": 51,
      "y": 32,
      "scale": 0.4,
      "rotation": 0
    },
    "owl": {
      "x": 51,
      "y": 32,
      "scale": 0.4,
      "rotation": 0
    },
    "beaver": {
      "x": 51,
      "y": 32,
      "scale": 0.4,
      "rotation": 0
    },
    "elephant": {
      "x": 51,
      "y": 32,
      "scale": 0.4,
      "rotation": 0
    },
    "otter": {
      "x": 51,
      "y": 32,
      "scale": 0.4,
      "rotation": 0
    },
    "parrot": {
      "x": 51,
      "y": 32,
      "scale": 0.4,
      "rotation": 0
    },
    "border-collie": {
      "x": 51,
      "y": 32,
      "scale": 0.4,
      "rotation": 0
    }
  },
  "hearts": {
    "meerkat": {
      "x": 52,
      "y": 32,
      "scale": 0.45,
      "rotation": 0
    },
    "panda": {
      "x": 52,
      "y": 32,
      "scale": 0.45,
      "rotation": 0
    },
    "owl": {
      "x": 52,
      "y": 32,
      "scale": 0.45,
      "rotation": 0
    },
    "beaver": {
      "x": 52,
      "y": 32,
      "scale": 0.45,
      "rotation": 0
    },
    "elephant": {
      "x": 52,
      "y": 32,
      "scale": 0.45,
      "rotation": 0
    },
    "otter": {
      "x": 52,
      "y": 32,
      "scale": 0.45,
      "rotation": 0
    },
    "parrot": {
      "x": 52,
      "y": 32,
      "scale": 0.45,
      "rotation": 0
    },
    "border-collie": {
      "x": 52,
      "y": 32,
      "scale": 0.45,
      "rotation": 0
    }
  },
  "bow_tie": {
    "meerkat": {
      "x": 51,
      "y": 40,
      "scale": 0.4,
      "rotation": 0
    },
    "panda": {
      "x": 51,
      "y": 40,
      "scale": 0.4,
      "rotation": 0
    },
    "owl": {
      "x": 51,
      "y": 40,
      "scale": 0.4,
      "rotation": 0
    },
    "beaver": {
      "x": 51,
      "y": 40,
      "scale": 0.4,
      "rotation": 0
    },
    "elephant": {
      "x": 51,
      "y": 40,
      "scale": 0.4,
      "rotation": 0
    },
    "otter": {
      "x": 51,
      "y": 40,
      "scale": 0.4,
      "rotation": 0
    },
    "parrot": {
      "x": 51,
      "y": 40,
      "scale": 0.4,
      "rotation": 0
    },
    "border-collie": {
      "x": 51,
      "y": 40,
      "scale": 0.4,
      "rotation": 0
    }
  },
  "necklace": {
    "meerkat": {
      "x": 52,
      "y": 40,
      "scale": 0.5,
      "rotation": 0
    },
    "panda": {
      "x": 52,
      "y": 40,
      "scale": 0.5,
      "rotation": 0
    },
    "owl": {
      "x": 52,
      "y": 40,
      "scale": 0.5,
      "rotation": 0
    },
    "beaver": {
      "x": 52,
      "y": 40,
      "scale": 0.5,
      "rotation": 0
    },
    "elephant": {
      "x": 52,
      "y": 40,
      "scale": 0.5,
      "rotation": 0
    },
    "otter": {
      "x": 52,
      "y": 40,
      "scale": 0.5,
      "rotation": 0
    },
    "parrot": {
      "x": 52,
      "y": 40,
      "scale": 0.5,
      "rotation": 0
    },
    "border-collie": {
      "x": 52,
      "y": 40,
      "scale": 0.5,
      "rotation": 0
    }
  }
};

async function updateAllPositions() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.error('No auth token found. Please log in as a teacher first.');
    return;
  }

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  console.log('Starting bulk position update...');

  // Loop through all items
  for (const [itemId, animalPositions] of Object.entries(positions)) {
    console.log(`\nUpdating positions for item: ${itemId}`);
    
    // Loop through all animals for this item
    for (const [animalType, position] of Object.entries(animalPositions)) {
      try {
        const response = await fetch('/api/admin/item-positions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            item_id: itemId,
            animal_type: animalType,
            position_x: position.x,
            position_y: position.y,
            scale: Math.round(position.scale * 100), // Convert to percentage
            rotation: position.rotation
          })
        });

        if (response.ok) {
          successCount++;
          console.log(`✓ Updated ${itemId} on ${animalType}`);
        } else {
          errorCount++;
          const error = await response.text();
          errors.push(`${itemId} on ${animalType}: ${error}`);
          console.error(`✗ Failed to update ${itemId} on ${animalType}: ${error}`);
        }
      } catch (error) {
        errorCount++;
        errors.push(`${itemId} on ${animalType}: ${error.message}`);
        console.error(`✗ Error updating ${itemId} on ${animalType}:`, error);
      }

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  console.log('\n========== Update Complete ==========');
  console.log(`✓ Successfully updated: ${successCount} positions`);
  console.log(`✗ Failed updates: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(err => console.log(`  - ${err}`));
  }

  return { successCount, errorCount, errors };
}

// Function to verify all positions were saved
async function verifyPositions() {
  const token = localStorage.getItem('authToken');
  try {
    const response = await fetch('/api/admin/item-positions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const savedPositions = await response.json();
    console.log('Total positions in database:', savedPositions.length);
    return savedPositions;
  } catch (error) {
    console.error('Failed to verify positions:', error);
    return null;
  }
}

// Export functions to window for easy console access
window.updateAllPositions = updateAllPositions;
window.verifyPositions = verifyPositions;

console.log('Position update script loaded!');
console.log('Run updateAllPositions() to update all positions');
console.log('Run verifyPositions() to check saved positions');
