import React from 'react';
import { WebView } from 'react-native-webview';
import Animated, { SharedValue } from 'react-native-reanimated';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react-native';
import { useThemeStore } from '@/src/theme/themeStore';
import ScrollReveal from '@/src/components/ScrollReveal';

const getHtmlSource = (theme: 'light' | 'dark') => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      <style>
        body { margin: 0; overflow: hidden; background-color: ${theme === 'dark' ? '#111A17' : '#E3EFE8'}; }
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
        const ambientLight = new THREE.AmbientLight(${theme === 'dark' ? '0x1a2e26' : '0xdcece3'}, 1.5);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(${theme === 'dark' ? '0x8eb69b' : '0x163832'}, 2, 50);
        pointLight.position.set(10, 10, 10);
        scene.add(pointLight);

        const directionalLight = new THREE.DirectionalLight(${theme === 'dark' ? '0x8eb69b' : '0x163832'}, 1.5);
        directionalLight.position.set(-5, 5, -5);
        scene.add(directionalLight);

        // Torus Knot Geometry representing scanning mesh
        const geometry = new THREE.TorusKnotGeometry(10, 3, 120, 16);
        const material = new THREE.MeshStandardMaterial({
          color: ${theme === 'dark' ? '0x8eb69b' : '0x163832'}, // Primary soft green vs secondary deep forest green
          roughness: 0.1,
          metalness: 0.9,
          wireframe: true // wireframe grid look matching LiDAR scan
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

interface BentoGridProps {
  scrollY: SharedValue<number>;
}

export default function BentoGrid({ scrollY }: BentoGridProps) {
  const { theme } = useThemeStore();

  return (
    <VStack space="xl" className="px-6 py-12 bg-brand-light-bg dark:bg-brand-dark-bg">
      {/* Title Header wrapped in ScrollReveal */}
      <ScrollReveal scrollY={scrollY} delay={0}>
        <VStack space="xs">
          <Heading size="xl" className="text-brand-light-text dark:text-brand-dark-text font-bold tracking-tight">
            Evolution in Silence
          </Heading>
          <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted font-light leading-relaxed">
            We believe in creating with you, not just for you. Every space is a reflection of shared vision and open dialogue — bringing depth, harmony, and character to the final design.
          </Text>
        </VStack>
      </ScrollReveal>

      {/* Bento Grid Items */}
      <VStack space="lg">
        
        {/* Card 1: Gamified Progress */}
        <ScrollReveal scrollY={scrollY} delay={100}>
          <Box className="bg-brand-light-card dark:bg-brand-dark-card border border-brand-light-border dark:border-brand-dark-border rounded-2xl p-6 min-h-[170px] justify-between relative overflow-hidden">
            <VStack space="xs">
              <Text className="text-[9px] text-brand-primary font-bold uppercase tracking-widest">
                01 / Identity
              </Text>
              <Heading size="md" className="text-brand-light-text dark:text-brand-dark-text font-bold">
                Gamified Progress
              </Heading>
              <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted leading-relaxed">
                Every breath, every lift, every recovery session contributes to your global Aura Level. Experience life as a continuous evolution.
              </Text>
            </VStack>

            <VStack space="xs" className="mt-6">
              <HStack className="justify-between">
                <Text className="text-[9px] text-brand-primary font-bold tracking-wider">
                  LEVEL 12 ARCHITECT
                </Text>
                <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold tracking-wider">
                  8,450 / 10,000 EXP
                </Text>
              </HStack>
              <Progress value={84.5} size="xs" className="w-full bg-brand-light-bg dark:bg-brand-dark-bg h-1.5 rounded-full overflow-hidden border border-brand-light-border/40 dark:border-brand-dark-border/40">
                <ProgressFilledTrack className="bg-brand-primary rounded-full" />
              </Progress>
            </VStack>
          </Box>
        </ScrollReveal>

        {/* Card 2: Vitality (Heart Age) */}
        <ScrollReveal scrollY={scrollY} delay={200}>
          <Box className="bg-brand-light-card dark:bg-brand-dark-card border border-brand-light-border dark:border-brand-dark-border rounded-2xl p-6 items-center relative overflow-hidden">
            <Text className="text-[9px] text-brand-primary font-bold uppercase tracking-widest mb-6">
              02 / Vitality
            </Text>

            {/* Heart Age Circle Display */}
            <Box className="relative w-36 h-36 items-center justify-center mb-6">
              {/* Outer dotted circle */}
              <Box className="absolute w-36 h-36 border border-brand-light-border dark:border-brand-dark-border rounded-full border-dashed" />
              {/* Middle active border progress circle */}
              <Box className="absolute w-32 h-32 border-2 border-brand-primary rounded-full opacity-60" />
              <Box className="absolute w-28 h-28 bg-brand-light-bg dark:bg-brand-dark-bg rounded-full items-center justify-center border border-brand-light-border dark:border-brand-dark-border">
                <Heading size="2xl" className="text-brand-primary font-extrabold leading-none">24</Heading>
                <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-widest mt-1">Heart Age</Text>
              </Box>
            </Box>

            <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted text-center px-4 leading-relaxed">
              Biological age optimized through deep neural analysis and VO2max tracking.
            </Text>
          </Box>
        </ScrollReveal>

        {/* Card 3: 3D Muscle Mapping with live WebGL WebView */}
        <ScrollReveal scrollY={scrollY} delay={300}>
          <Box className="bg-brand-light-card dark:bg-brand-dark-card border border-brand-light-border dark:border-brand-dark-border rounded-2xl p-6 gap-6 overflow-hidden">
            <VStack space="xs">
              <Text className="text-[9px] text-brand-primary font-bold uppercase tracking-widest">
                03 / Precision
              </Text>
              <Heading size="md" className="text-brand-light-text dark:text-brand-dark-text font-bold">
                3D Muscle Mapping
              </Heading>
              <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted leading-relaxed">
                Visualize your physique in absolute detail. Our LiDAR-driven mapping tracks muscular symmetry and hypertrophic growth with millimeter precision.
              </Text>

              <VStack space="xs" className="pt-2">
                <HStack space="sm" className="items-center">
                  <CheckCircle2 size={13} className="text-brand-primary" />
                  <Text className="text-xs text-brand-light-text dark:text-brand-dark-text">Real-time symmetry analysis</Text>
                </HStack>
                <HStack space="sm" className="items-center">
                  <CheckCircle2 size={13} className="text-brand-primary" />
                  <Text className="text-xs text-brand-light-text dark:text-brand-dark-text">Postural correction feedback</Text>
                </HStack>
              </VStack>
            </VStack>

            {/* 3D WebGL Canvas Container embedded via WebView */}
            <Box className="w-full h-72 rounded-xl overflow-hidden border border-brand-light-border dark:border-brand-dark-border bg-brand-light-card dark:bg-brand-dark-card relative">
              <WebView
                originWhitelist={['*']}
                source={{ html: getHtmlSource(theme) }}
                className="w-full h-full"
                style={{ backgroundColor: 'transparent' }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />

              {/* Radar Scanning Indicator overlay */}
              <HStack space="xs" className="absolute bottom-4 left-4 items-center bg-brand-light-card/90 dark:bg-brand-dark-card/80 border border-brand-light-border dark:border-brand-dark-border px-3 py-1 rounded-full">
                <Box className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
                <Text className="text-[8px] text-brand-primary font-mono tracking-widest uppercase">
                  WebGL Scanning Active
                </Text>
              </HStack>
            </Box>
          </Box>
        </ScrollReveal>

      </VStack>
    </VStack>
  );
}
