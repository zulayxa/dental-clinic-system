"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { JawScene } from "@/components/dental-chart-scene";
import {
  capToothSelection,
  ToothAnchorTracker,
  ToothCalloutOverlay,
} from "@/components/tooth-callouts";
import { cn } from "@/lib/utils";

const VIEWER_BG = "transparent";

function clearViewerSurface(host: HTMLElement | null) {
  if (!host) return;
  host.style.background = VIEWER_BG;
  const canvas = host.querySelector("canvas");
  if (!(canvas instanceof HTMLCanvasElement)) return;
  canvas.style.background = VIEWER_BG;
  canvas.style.backgroundColor = VIEWER_BG;
}

type DentalJaw3DProps = {
  selected: number[];
  onChange?: (teeth: number[]) => void;
  name?: string;
  readOnly?: boolean;
  fill?: boolean;
};

export function DentalJaw3D({
  selected,
  onChange,
  name = "chartedTeeth",
  readOnly = false,
  fill = false,
}: DentalJaw3DProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [identified, setIdentified] = useState<number | null>(null);
  const [contextEpoch, setContextEpoch] = useState(0);
  const dragRef = useRef({ x: 0, y: 0, moved: false });
  const hostRef = useRef<HTMLDivElement>(null);
  const anchorsRef = useRef(new Map<number, { x: number; y: number }>());

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    clearViewerSurface(host);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      setContextEpoch((epoch) => epoch + 1);
    };
    const onContextRestored = () => {
      clearViewerSurface(host);
    };

    host.addEventListener("webglcontextlost", onContextLost, true);
    host.addEventListener("webglcontextrestored", onContextRestored, true);

    const observer = new MutationObserver(() => clearViewerSurface(host));
    observer.observe(host, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => {
      host.removeEventListener("webglcontextlost", onContextLost, true);
      host.removeEventListener("webglcontextrestored", onContextRestored, true);
      observer.disconnect();
    };
  }, [contextEpoch]);

  function toggleTooth(fdi: number) {
    if (readOnly) return;
    const alreadySelected = selected.includes(fdi);
    if (alreadySelected) {
      onChange?.(selected.filter((tooth) => tooth !== fdi));
      setIdentified(null);
      return;
    }
    onChange?.(capToothSelection(selected, fdi));
    setIdentified(fdi);
  }

  return (
    <section
      aria-label="3D interactive dental chart"
      className={cn(
        "overflow-hidden rounded-2xl border border-cyan-300/20 bg-transparent shadow-[0_0_48px_rgba(34,211,238,0.16)]",
        fill && "flex h-full min-h-0 w-full flex-col",
      )}
    >
      <input type="hidden" name={name} value={selected.join(",")} />

      <div
        ref={hostRef}
        className={cn(
          "relative h-full w-full select-none bg-transparent",
          "cursor-grab active:cursor-grabbing",
          hovered ? "cursor-pointer" : null,
          fill ? "min-h-0 flex-1" : "h-[400px] sm:h-[500px] lg:h-[560px]",
        )}
        onPointerDown={(event) => {
          dragRef.current = { x: event.clientX, y: event.clientY, moved: false };
        }}
        onPointerMove={(event) => {
          const dx = event.clientX - dragRef.current.x;
          const dy = event.clientY - dragRef.current.y;
          if (Math.hypot(dx, dy) > 7) dragRef.current.moved = true;
        }}
      >
        <Canvas
          key={`dental-jaw-webgl-${contextEpoch}`}
          shadows
          camera={{ position: [0, 0.22, 7.5], fov: 30 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            premultipliedAlpha: true,
            powerPreference: "high-performance",
          }}
          resize={{ debounce: 0, offsetSize: true }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block",
            background: "transparent",
            touchAction: "none",
          }}
          onCreated={(state) => {
            state.gl.setClearColor(0x000000, 0);
            state.scene.background = null;
            state.gl.domElement.style.background = "transparent";
            state.gl.domElement.style.backgroundColor = "transparent";
            state.gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            const parent = state.gl.domElement.parentElement;
            const width = parent?.clientWidth ?? state.gl.domElement.clientWidth;
            const height = parent?.clientHeight ?? state.gl.domElement.clientHeight;
            if (width > 0 && height > 0) {
              state.gl.setSize(width, height, false);
              state.setSize(width, height);
            }
            clearViewerSurface(hostRef.current);
          }}
          onPointerMissed={() => setHovered(null)}
        >
          <Suspense fallback={null}>
            <Environment preset="studio" background={false} environmentIntensity={0.46} />
            <JawScene
              selected={selected}
              identified={identified}
              readOnly={readOnly}
              onToggle={toggleTooth}
              onIdentify={setIdentified}
              onHover={setHovered}
              dragRef={dragRef}
            />
            <ToothAnchorTracker selected={selected} anchorsRef={anchorsRef} />
          </Suspense>
          <OrbitControls
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.72}
            minDistance={3.4}
            maxDistance={11}
            minPolarAngle={0.18}
            maxPolarAngle={Math.PI - 0.2}
            target={[0, 0, 0.35]}
            makeDefault
            mouseButtons={{
              LEFT: THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.DOLLY,
              RIGHT: THREE.MOUSE.ROTATE,
            }}
          />
        </Canvas>
        <ToothCalloutOverlay selected={selected} anchorsRef={anchorsRef} />
      </div>
    </section>
  );
}
