import React, { useEffect } from 'react';
import { useStoreItems } from '@/contexts/StoreDataContext';

export default function RiveDebugPanel() {
  const storeItems = useStoreItems();
  
  useEffect(() => {
    if (storeItems) {
      const riveItems = storeItems.filter((item: any) => item.asset_type === 'rive');
      console.log('=== RIVE DEBUG ===');
      console.log('Total store items:', storeItems.length);
      console.log('Rive items found:', riveItems.length);
      console.log('Rive items:', riveItems);
      
      riveItems.forEach((item: any) => {
        console.log(`Rive Item: ${item.name}`);
        console.log('- asset_type:', item.asset_type);
        console.log('- imageUrl:', item.imageUrl);
        console.log('- riveUrl:', item.riveUrl);
        console.log('- Full item:', item);
      });
    }
  }, [storeItems]);
  
  const riveItems = storeItems?.filter((item: any) => item.asset_type === 'rive') || [];
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg max-w-sm">
      <h3 className="font-bold mb-2">Rive Debug Panel</h3>
      <div className="text-xs space-y-1">
        <div>Store Items: {storeItems?.length || 0}</div>
        <div>Rive Items: {riveItems.length}</div>
        {riveItems.map((item: any) => (
          <div key={item.id} className="border-t pt-1 mt-1">
            <div className="font-semibold">{item.name}</div>
            <div>Type: {item.asset_type}</div>
            <div>Has imageUrl: {item.imageUrl ? 'Yes' : 'No'}</div>
            <div>Has riveUrl: {item.riveUrl ? 'Yes' : 'No'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
