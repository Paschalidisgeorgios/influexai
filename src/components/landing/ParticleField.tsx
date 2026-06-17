"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type ParticleCloudProps = {
  count: number;
};

function ParticleCloud({ count }: ParticleCloudProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const scrollRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);

  const { basePositions, velocities } = useMemo(() => {
    const base = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = 1.2 + Math.random() * 3.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      base[i3] = radius * Math.sin(phi) * Math.cos(theta);
      base[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.65;
      base[i3 + 2] = radius * Math.cos(phi) * 0.35 - 1.5;

      vel[i3] = (Math.random() - 0.5) * 0.004;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.004;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.002;
    }

    return { basePositions: base, velocities: vel };
  }, [count]);

  const positions = useMemo(
    () => new Float32Array(basePositions),
    [basePositions]
  );

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        scrollRef.current = self.progress;
      },
    });

    const onMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      trigger.kill();
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    if (!points) return;

    const attr = points.geometry.attributes.position as THREE.BufferAttribute;
    const array = attr.array as Float32Array;
    const scroll = scrollRef.current;
    const spread = 1 + scroll * 2.2;
    const mx = mouseRef.current.x * 3.2;
    const my = mouseRef.current.y * 2;
    timeRef.current += delta;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      velocities[i3] += Math.sin(timeRef.current + i * 0.08) * 0.00008;
      velocities[i3 + 1] += Math.cos(timeRef.current + i * 0.06) * 0.00008;

      let x = basePositions[i3] * spread + velocities[i3] * 120;
      let y = basePositions[i3 + 1] * spread + velocities[i3 + 1] * 120;
      let z = basePositions[i3 + 2] * spread + velocities[i3 + 2] * 80;

      const dx = x - mx;
      const dy = y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1.4) {
        const force = (1.4 - dist) * 0.035;
        x += dx * force;
        y += dy * force;
      }

      array[i3] = x;
      array[i3 + 1] = y;
      array[i3 + 2] = z;
    }

    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#b4ff00"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function ParticleField() {
  const [count, setCount] = useState(800);

  useEffect(() => {
    const update = () => {
      setCount(window.innerWidth < 768 ? 400 : 800);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <ParticleCloud count={count} />
      </Canvas>
    </div>
  );
}
