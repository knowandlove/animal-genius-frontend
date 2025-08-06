import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarSkeletonProps {
  className?: string;
  width?: number;
  height?: number;
}

export function AvatarSkeleton({ 
  className, 
  width = 350, 
  height = 450 
}: AvatarSkeletonProps) {
  return (
    <div 
      className={cn("relative animate-pulse", className)}
      style={{ width, height }}
    >
      {/* Body */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-3/5 bg-gray-200 rounded-t-full" />
      
      {/* Head */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-1/2 h-1/3 bg-gray-200 rounded-full" />
      
      {/* Arms */}
      <div className="absolute top-1/2 left-1/4 w-1/6 h-1/3 bg-gray-200 rounded-full transform -rotate-12" />
      <div className="absolute top-1/2 right-1/4 w-1/6 h-1/3 bg-gray-200 rounded-full transform rotate-12" />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header skeleton */}
      <div className="bg-white shadow-sm px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-[400px,1fr] gap-8">
          {/* Avatar section skeleton */}
          <div className="flex flex-col items-start justify-center h-full py-4">
            <AvatarSkeleton />
            <div className="mt-10 ml-24 h-10 w-40 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Right side content skeleton */}
          <div className="flex flex-col gap-6">
            {/* Welcome section skeleton */}
            <div className="flex justify-between items-start">
              <div>
                <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-6 w-96 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-14 w-32 bg-yellow-200 rounded-full animate-pulse" />
            </div>

            {/* Cards grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white/90 backdrop-blur rounded-lg p-6 h-48">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-gray-200 rounded-2xl animate-pulse mb-4" />
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>

            {/* Achievements skeleton */}
            <div className="bg-white/90 backdrop-blur rounded-lg p-6">
              <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-4 mx-auto" />
              <div className="flex gap-3 flex-wrap justify-center">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="w-14 h-14 bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StoreSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="bg-white rounded-lg p-4 shadow">
          <div className="w-full h-32 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-3" />
          <div className="flex justify-between items-center">
            <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CustomizerSkeleton() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
      </div>
      
      {/* Tab navigation */}
      <div className="grid grid-cols-4 gap-1 p-1 mb-4 bg-gray-100 rounded-lg">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>

      {/* Content grid */}
      <div className="bg-white rounded-lg flex-1 p-4">
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}