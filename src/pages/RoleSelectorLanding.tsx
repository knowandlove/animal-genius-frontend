import React from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { GraduationCap, Users } from 'lucide-react';
import { getAssetUrl } from '@/utils/cloud-assets';

export default function RoleSelectorLanding() {
  const [, setLocation] = useLocation();

  // List of all 8 animal types with their image paths
  const animals = [
    { name: 'Meerkat', fileName: 'meerkat.png' },
    { name: 'Panda', fileName: 'panda.png' },
    { name: 'Owl', fileName: 'owl.png' },
    { name: 'Beaver', fileName: 'beaver.png' },
    { name: 'Elephant', fileName: 'elephant.png' },
    { name: 'Otter', fileName: 'otter.png' },
    { name: 'Parrot', fileName: 'parrot.png' },
    { name: 'Border Collie', fileName: 'collie.png' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-bold text-gray-800 mb-4"
          >
            Welcome to Classtopia
          </motion.h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Teacher Card */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card 
              className="h-full hover:shadow-xl transition-all cursor-pointer bg-white/90 backdrop-blur border-0"
              onClick={() => setLocation('/login')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-12 h-12 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">I'm a Teacher</CardTitle>
                <CardDescription className="text-base mt-2">
                  Access your dashboard, manage classes, and view student analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white h-12 text-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation('/login');
                  }}
                >
                  Teacher Login
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Student Card */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card 
              className="h-full hover:shadow-xl transition-all cursor-pointer bg-white/90 backdrop-blur border-0"
              onClick={() => setLocation('/go')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-12 h-12 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">I'm a Student</CardTitle>
                <CardDescription className="text-base mt-2">
                  Enter your passport code to access your dashboard and take quizzes
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-12 text-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation('/go');
                  }}
                >
                  Student Login
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Animal head avatars at the bottom */}
        <div className="mt-12 flex justify-center gap-4 flex-wrap">
          {animals.map((animal, i) => (
            <motion.div
              key={animal.name}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
              className="relative"
            >
              <motion.div
                animate={{ y: [-3, 3, -3] }}
                transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
              >
                <img 
                  src={getAssetUrl(`/images/${animal.fileName}`)}
                  alt={animal.name}
                  className="w-20 h-20 object-contain"
                />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}