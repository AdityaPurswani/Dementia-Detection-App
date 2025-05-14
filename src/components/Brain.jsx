import React, { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload, useGLTF } from "@react-three/drei";
import CanvasLoader from "./Loader";

const Brain = ({ isMobile }) => {
  const brainModel = useGLTF("brain.glb"); // Ensure correct path to model

  return (
    <mesh>
      {/* Lighting configuration for a professional look */}
      <hemisphereLight intensity={1} groundColor="black" />
      <spotLight
        position={[15, 20, 15]}
        angle={0.5}
        penumbra={1}
        intensity={2}
        castShadow
        shadow-mapSize={1024}
      />
      <pointLight intensity={1.5} position={[0, 10, 10]} />
      <primitive
        object={brainModel.scene}
        scale={isMobile ? 0.25 : 0.35} // Scaling for mobile and desktop
        position={isMobile ? [0, -2, 0] : [0, -2, 0]} // Adjust position for visibility
        rotation={[0, Math.PI / 4, 0]} // Rotate slightly for dynamic look
      />
    </mesh>
  );
};

const BrainCanvas = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    setIsMobile(mediaQuery.matches);

    const handleMediaQueryChange = (event) => setIsMobile(event.matches);

    mediaQuery.addEventListener("change", handleMediaQueryChange);
    return () => mediaQuery.removeEventListener("change", handleMediaQueryChange);
  }, []);

  return (
    <Canvas
      frameloop="demand"
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 2, 12], fov: 30 }} // Adjust camera for full-frame view
      gl={{ preserveDrawingBuffer: true }}
    >
      <Suspense fallback={<CanvasLoader />}>
        <OrbitControls
          autoRotate
          enableZoom={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 3}
        />
        <Brain isMobile={isMobile} />
      </Suspense>
      <Preload all />
    </Canvas>
  );
};

export default BrainCanvas;
