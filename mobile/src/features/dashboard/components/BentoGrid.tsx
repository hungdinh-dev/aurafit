import React from 'react';
import { WebView } from 'react-native-webview';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react-native';

const htmlSource = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      <style>
        body { margin: 0; overflow: hidden; background-color: #0b0e14; }
        canvas { width: 100%; height: 100%; display: block; }
      </style>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    </head>
    <body>
      <script>
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(renderer.domElement);

        // Ambient and directional lighting matching Aura theme
        const ambientLight = new THREE.AmbientLight(0x1a2e26, 1.5);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xa7d0b4, 2, 50);
        pointLight.position.set(10, 10, 10);
        scene.add(pointLight);

        const directionalLight = new THREE.DirectionalLight(0x6366f1, 1.5);
        directionalLight.position.set(-5, 5, -5);
        scene.add(directionalLight);

        // Torus Knot Geometry representing scanning mesh
        const geometry = new THREE.TorusKnotGeometry(10, 3, 120, 16);
        const material = new THREE.MeshStandardMaterial({
          color: 0x34d399, // Emerald green glow
          roughness: 0.1,
          metalness: 0.9,
          wireframe: true // green wireframe grid look matching LiDAR scan
        });
        const torusKnot = new THREE.Mesh(geometry, material);
        torusKnot.scale.set(0.13, 0.13, 0.13);
        scene.add(torusKnot);

        camera.position.z = 4.8;

        function animate() {
          requestAnimationFrame(animate);
          torusKnot.rotation.x += 0.008;
          torusKnot.rotation.y += 0.015;
          torusKnot.rotation.z += 0.005;
          renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        });
      </script>
    </body>
  </html>
`;

export default function BentoGrid() {
  return (
    <VStack space="xl" className="px-6 py-12">
      {/* Title Header */}
      <VStack space="xs">
        <Heading size="xl" className="text-slate-100 font-bold tracking-tight">
          Evolution in Silence
        </Heading>
        <Text className="text-xs text-slate-400 font-light leading-relaxed">
          We believe in creating with you, not just for you. Every space is a reflection of shared vision and open dialogue — bringing depth, harmony, and character to the final design.
        </Text>
      </VStack>

      {/* Bento Grid Items */}
      <VStack space="lg">
        
        {/* Card 1: Gamified Progress */}
        <Box className="bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[170px] justify-between relative overflow-hidden">
          <VStack space="xs">
            <Text className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">
              01 / Identity
            </Text>
            <Heading size="md" className="text-slate-100 font-bold">
              Gamified Progress
            </Heading>
            <Text className="text-xs text-slate-400 leading-relaxed">
              Every breath, every lift, every recovery session contributes to your global Aura Level. Experience life as a continuous evolution.
            </Text>
          </VStack>

          <VStack space="xs" className="mt-6">
            <HStack className="justify-between">
              <Text className="text-[9px] text-indigo-400 font-bold tracking-wider">
                LEVEL 12 ARCHITECT
              </Text>
              <Text className="text-[9px] text-slate-400 font-bold tracking-wider">
                8,450 / 10,000 EXP
              </Text>
            </HStack>
            <Progress value={84.5} size="xs" className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
              <ProgressFilledTrack className="bg-indigo-500 rounded-full" />
            </Progress>
          </VStack>
        </Box>

        {/* Card 2: Vitality (Heart Age) */}
        <Box className="bg-slate-900 border border-slate-800 rounded-2xl p-6 items-center relative overflow-hidden">
          <Text className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mb-6">
            02 / Vitality
          </Text>

          {/* Heart Age Circle Display */}
          <Box className="relative w-36 h-36 items-center justify-center mb-6">
            {/* Outer dotted circle */}
            <Box className="absolute w-36 h-36 border border-slate-800 rounded-full border-dashed" />
            {/* Middle active border progress circle */}
            <Box className="absolute w-32 h-32 border-2 border-indigo-500 rounded-full opacity-60" />
            <Box className="absolute w-28 h-28 bg-slate-950 rounded-full items-center justify-center border border-slate-800">
              <Heading size="2xl" className="text-indigo-400 font-extrabold leading-none">24</Heading>
              <Text className="text-[8px] text-slate-400 uppercase tracking-widest mt-1">Heart Age</Text>
            </Box>
          </Box>

          <Text className="text-xs text-slate-450 text-center px-4 leading-relaxed">
            Biological age optimized through deep neural analysis and VO2max tracking.
          </Text>
        </Box>

        {/* Card 3: 3D Muscle Mapping with live WebGL WebView */}
        <Box className="bg-slate-900 border border-slate-800 rounded-2xl p-6 gap-6 overflow-hidden">
          <VStack space="xs">
            <Text className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">
              03 / Precision
            </Text>
            <Heading size="md" className="text-slate-100 font-bold">
              3D Muscle Mapping
            </Heading>
            <Text className="text-xs text-slate-400 leading-relaxed">
              Visualize your physique in absolute detail. Our LiDAR-driven mapping tracks muscular symmetry and hypertrophic growth with millimeter precision.
            </Text>

            <VStack space="xs" className="pt-2">
              <HStack space="sm" className="items-center">
                <CheckCircle2 size={13} className="text-indigo-450" />
                <Text className="text-xs text-slate-300">Real-time symmetry analysis</Text>
              </HStack>
              <HStack space="sm" className="items-center">
                <CheckCircle2 size={13} className="text-indigo-450" />
                <Text className="text-xs text-slate-300">Postural correction feedback</Text>
              </HStack>
            </VStack>
          </VStack>

          {/* 3D WebGL Canvas Container embedded via WebView */}
          <Box className="w-full h-72 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative">
            <WebView
              originWhitelist={['*']}
              source={{ html: htmlSource }}
              className="w-full h-full"
              style={{ backgroundColor: 'transparent' }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />

            {/* Radar Scanning Indicator overlay */}
            <HStack space="xs" className="absolute bottom-4 left-4 items-center bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-full">
              <Box className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <Text className="text-[8px] text-emerald-400 font-mono tracking-widest uppercase">
                WebGL Scanning Active
              </Text>
            </HStack>
          </Box>
        </Box>

      </VStack>
    </VStack>
  );
}
