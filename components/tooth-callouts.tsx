"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { formatToothIdentity, MAX_SELECTED_TEETH } from "@/lib/tooth-identity";
import { cn } from "@/lib/utils";

export type ToothScreenAnchor = { x: number; y: number };

type CalloutZone = "top" | "bottom" | "right" | "left";

const world = new THREE.Vector3();
const box = new THREE.Box3();

export function ToothAnchorTracker({
  selected,
  anchorsRef,
}: {
  selected: number[];
  anchorsRef: MutableRefObject<Map<number, ToothScreenAnchor>>;
}) {
  const { camera, scene, gl } = useThree();
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  useFrame(() => {
    const wanted = new Set(selectedRef.current);
    const anchors = anchorsRef.current;
    for (const fdi of [...anchors.keys()]) {
      if (!wanted.has(fdi)) anchors.delete(fdi);
    }
    if (wanted.size === 0) return;

    const width = gl.domElement.clientWidth;
    const height = gl.domElement.clientHeight;
    if (width < 1 || height < 1) return;

    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const match = /^tooth_(\d+)$/.exec(object.name);
      if (!match) return;
      const fdi = Number.parseInt(match[1], 10);
      if (!wanted.has(fdi)) return;
      if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
      const bounds = object.geometry.boundingBox;
      if (!bounds) return;
      box.copy(bounds);
      box.getCenter(world);
      world.applyMatrix4(object.matrixWorld);
      world.project(camera);
      if (world.z > 1) {
        anchors.delete(fdi);
        return;
      }
      anchors.set(fdi, {
        x: (world.x * 0.5 + 0.5) * width,
        y: (-world.y * 0.5 + 0.5) * height,
      });
    });
  });

  return null;
}

function zoneForIndex(index: number): CalloutZone {
  if (index < 4) return "top";
  if (index < 8) return "bottom";
  if (index < 12) return "right";
  return "left";
}

type PlacedCallout = {
  fdi: number;
  zone: CalloutZone;
  label: HTMLDivElement;
  anchor: ToothScreenAnchor;
};

function packAlong(
  items: PlacedCallout[],
  axis: "x" | "y",
  origin: number,
  span: number,
  gap: number,
) {
  const ranked = [...items].sort((a, b) =>
    axis === "x" ? a.anchor.x - b.anchor.x : a.anchor.y - b.anchor.y,
  );
  const sizes = ranked.map((item) =>
    axis === "x" ? item.label.offsetWidth : item.label.offsetHeight,
  );
  const total = sizes.reduce((sum, size) => sum + size, 0) + gap * Math.max(0, ranked.length - 1);
  let cursor = origin + Math.max(0, (span - total) / 2);
  return ranked.map((item, slot) => {
    const size = sizes[slot] ?? 0;
    const start = cursor;
    cursor += size + gap;
    return { ...item, slot, start, size };
  });
}

function leaderPath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  zone: CalloutZone,
  slot: number,
) {
  const gutter = 6 + slot * 7;
  if (zone === "top" || zone === "bottom") {
    const railY = zone === "top" ? fromY + gutter : fromY - gutter;
    if (Math.abs(fromX - toX) < 5) {
      return `M ${fromX} ${fromY} L ${toX} ${toY}`;
    }
    return `M ${fromX} ${fromY} L ${fromX} ${railY} L ${toX} ${railY} L ${toX} ${toY}`;
  }
  const railX = zone === "left" ? fromX + gutter : fromX - gutter;
  if (Math.abs(fromY - toY) < 6) {
    return `M ${fromX} ${fromY} L ${toX} ${toY}`;
  }
  return `M ${fromX} ${fromY} L ${railX} ${fromY} L ${railX} ${toY} L ${toX} ${toY}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const EDGE_X = 4;
const EDGE_Y = 4;

export function ToothCalloutOverlay({
  selected,
  anchorsRef,
}: {
  selected: number[];
  anchorsRef: MutableRefObject<Map<number, ToothScreenAnchor>>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const labelRefs = useRef(new Map<number, HTMLDivElement>());
  const visible = selected.slice(0, MAX_SELECTED_TEETH);
  const selectedKey = visible.join(",");

  useEffect(() => {
    let frame = 0;
    const selectedFdis = selectedKey
      ? selectedKey.split(",").map((part) => Number.parseInt(part, 10))
      : [];

    const paint = () => {
      const root = rootRef.current;
      const svg = svgRef.current;
      if (!root || !svg) {
        frame = requestAnimationFrame(paint);
        return;
      }

      const width = root.clientWidth;
      const height = root.clientHeight;
      const grouped: Record<CalloutZone, PlacedCallout[]> = {
        top: [],
        bottom: [],
        right: [],
        left: [],
      };

      selectedFdis.forEach((fdi, index) => {
        const label = labelRefs.current.get(fdi);
        const anchor = anchorsRef.current.get(fdi);
        if (!label) return;
        if (!anchor) {
          label.style.visibility = "hidden";
          return;
        }
        grouped[zoneForIndex(index)].push({ fdi, zone: zoneForIndex(index), label, anchor });
      });

      const hasSides = grouped.left.length > 0 || grouped.right.length > 0;
      const hasEnds = grouped.top.length > 0 || grouped.bottom.length > 0;
      const xPad = hasSides ? 118 : 8;
      const yPad = hasEnds ? 28 : 8;
      const gap = 4;
      const parts: string[] = [];

      const place = (
        items: PlacedCallout[],
        zone: CalloutZone,
      ) => {
        if (items.length === 0) return;
        const packed =
          zone === "top" || zone === "bottom"
            ? packAlong(items, "x", xPad, Math.max(0, width - xPad * 2), gap)
            : packAlong(items, "y", yPad, Math.max(0, height - yPad * 2), gap);

        for (const item of packed) {
          const { label, anchor, slot, size } = item;
          const start =
            zone === "top" || zone === "bottom"
              ? clamp(item.start, EDGE_X, Math.max(EDGE_X, width - size - EDGE_X))
              : clamp(item.start, EDGE_Y, Math.max(EDGE_Y, height - size - EDGE_Y));
          label.style.visibility = "visible";
          label.style.position = "absolute";
          if (zone === "top") {
            label.style.left = `${start}px`;
            label.style.top = `${EDGE_Y}px`;
            label.style.right = "auto";
            label.style.bottom = "auto";
          } else if (zone === "bottom") {
            label.style.left = `${start}px`;
            label.style.top = "auto";
            label.style.right = "auto";
            label.style.bottom = `${EDGE_Y}px`;
          } else if (zone === "right") {
            label.style.left = "auto";
            label.style.right = `${EDGE_X}px`;
            label.style.top = `${start}px`;
            label.style.bottom = "auto";
          } else {
            label.style.left = `${EDGE_X}px`;
            label.style.right = "auto";
            label.style.top = `${start}px`;
            label.style.bottom = "auto";
          }

          const fromX = clamp(
            zone === "left"
              ? EDGE_X + label.offsetWidth
              : zone === "right"
                ? width - EDGE_X - label.offsetWidth
                : start + size / 2,
            0,
            width,
          );
          const fromY = clamp(
            zone === "top"
              ? EDGE_Y + label.offsetHeight
              : zone === "bottom"
                ? height - EDGE_Y - label.offsetHeight
                : start + label.offsetHeight / 2,
            0,
            height,
          );
          const toX = clamp(anchor.x, 8, width - 8);
          const toY = clamp(anchor.y, 8, height - 8);
          const path = leaderPath(fromX, fromY, toX, toY, zone, slot);
          parts.push(
            `<path d="${path}" fill="none" stroke="#0b1a3a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />`,
            `<path d="${path}" fill="none" stroke="#ffffff" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" />`,
            `<circle cx="${toX}" cy="${toY}" r="2.2" fill="#ffffff" stroke="#0b1a3a" stroke-width="0.9" />`,
          );
        }
      };

      place(grouped.top, "top");
      place(grouped.bottom, "bottom");
      place(grouped.right, "right");
      place(grouped.left, "left");

      svg.innerHTML = parts.join("");
      frame = requestAnimationFrame(paint);
    };

    frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [anchorsRef, selectedKey]);

  if (visible.length === 0) return null;

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      role="status"
      aria-live="polite"
    >
      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full overflow-hidden"
        aria-hidden
      />
      {visible.map((fdi, index) => {
        const tooth = formatToothIdentity(fdi);
        if (!tooth) return null;
        const zone = zoneForIndex(index);
        return (
          <CalloutChip
            key={tooth.fdi}
            tooth={tooth}
            align={zone === "left" ? "left" : zone === "right" ? "right" : "center"}
            onNode={(node) => {
              if (node) labelRefs.current.set(tooth.fdi, node);
              else labelRefs.current.delete(tooth.fdi);
            }}
          />
        );
      })}
    </div>
  );
}

function CalloutChip({
  tooth,
  align,
  onNode,
}: {
  tooth: NonNullable<ReturnType<typeof formatToothIdentity>>;
  align: "left" | "right" | "center";
  onNode: (node: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={onNode}
      className={cn(
        "invisible absolute min-w-0 rounded-md border border-white/35 bg-[#01113a]/82 px-1 py-0.5 shadow-[0_4px_12px_rgba(1,17,58,0.4)] backdrop-blur-md",
        align === "left" && "w-[6.75rem] text-right",
        align === "right" && "w-[6.75rem] text-left",
        align === "center" && "max-w-[6.25rem] text-center",
      )}
    >
      <p className="truncate text-[8px] font-semibold leading-none text-white">
        {tooth.name}
      </p>
      <p className="mt-px text-[7px] leading-none tracking-wide text-cyan-100/85">
        {tooth.numbers}
      </p>
    </div>
  );
}

export function capToothSelection(selected: number[], fdi: number) {
  if (selected.length < MAX_SELECTED_TEETH) return [...selected, fdi];
  return [...selected.slice(1), fdi];
}
