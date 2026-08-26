'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useMapStore } from '@/stores/map-store';
import { useNavigationStore } from '@/stores/navigation-store';
import { campusShapes } from '@/data/shapes';
import { MAP_SATELLITE_PATH, MAP_WIDTH, MAP_HEIGHT } from '@/lib/constants';

// BIT Coordinates for Globe
const BIT_LAT = 11.4967;
const BIT_LNG = 77.2764;

export default function ThreeMap3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { viewMode, theme, selectPlace, selectedPlaceId, setViewMode } = useMapStore();
  const { isActive: isNavActive, nodeCoordinates } = useNavigationStore();
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const isDark = theme === 'dark';
    scene.background = new THREE.Color(isDark ? 0x050814 : 0xe0e7ff);
    scene.fog = new THREE.FogExp2(isDark ? 0x050814 : 0xe0e7ff, 0.0003);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      1,
      10000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.panSpeed = 1.4;
    controls.minDistance = 100;
    controls.maxDistance = 8000;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't go below ground

    // Lighting
    const ambientLight = new THREE.AmbientLight(
      isDark ? 0x4f46e5 : 0xffffff,
      isDark ? 1.2 : 1.8
    );
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(
      isDark ? 0x818cf8 : 0xffffff,
      isDark ? 1.5 : 2.2
    );
    sunLight.position.set(1000, 2000, 1000);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Starfield for Dark Theme
    if (isDark) {
      const starGeometry = new THREE.BufferGeometry();
      const starCount = 1500;
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount * 3; i += 3) {
        starPositions[i] = (Math.random() - 0.5) * 8000;
        starPositions[i + 1] = Math.random() * 4000 + 500;
        starPositions[i + 2] = (Math.random() - 0.5) * 8000;
      }
      starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2.5,
        transparent: true,
        opacity: 0.8,
      });
      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);
    }

    const interactiveObjects: THREE.Mesh[] = [];

    // ==========================================
    // 1. CAMPUS 3D VIEW
    // ==========================================
    if (viewMode === '3d-satellite') {
      camera.position.set(0, 1400, 1800);
      controls.target.set(0, 0, 0);

      // Satellite Ground Mesh
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(MAP_SATELLITE_PATH, (satelliteTex) => {
        satelliteTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const planeGeo = new THREE.PlaneGeometry(MAP_WIDTH, MAP_HEIGHT);
        const planeMat = new THREE.MeshStandardMaterial({
          map: satelliteTex,
          roughness: 0.8,
          metalness: 0.1,
        });
        const ground = new THREE.Mesh(planeGeo, planeMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);
      });

      // 3D Extruded Buildings from campusShapes
      campusShapes.forEach((shape) => {
        const shape3D = new THREE.Shape();
        const pts = shape.points.map(([x, y]) => [
          x - MAP_WIDTH / 2,
          -(y - MAP_HEIGHT / 2),
        ]);

        if (pts.length > 0) {
          shape3D.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length; i++) {
            shape3D.lineTo(pts[i][0], pts[i][1]);
          }
          shape3D.closePath();

          const extrudeSettings = {
            depth: shape.height3D,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 1,
            bevelSize: 1.5,
            bevelThickness: 1.5,
          };

          const geometry = new THREE.ExtrudeGeometry(shape3D, extrudeSettings);
          const isSelected = selectedPlaceId === shape.id;

          const material = new THREE.MeshStandardMaterial({
            color: isSelected
              ? 0x7b68ee
              : isDark
              ? 0x1e293b
              : 0xffffff,
            roughness: 0.3,
            metalness: isDark ? 0.4 : 0.1,
            transparent: true,
            opacity: 0.92,
            emissive: isSelected ? 0x7b68ee : isDark ? 0x0f172a : 0x000000,
            emissiveIntensity: isSelected ? 0.6 : 0.2,
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.rotation.x = -Math.PI / 2;
          mesh.position.y = 0;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData = { id: shape.id, name: shape.name };

          // Building Edge Wireframe Glow
          const edges = new THREE.EdgesGeometry(geometry);
          const lineMat = new THREE.LineBasicMaterial({
            color: isSelected ? 0xffffff : isDark ? 0x818cf8 : 0x7b68ee,
            linewidth: 1.5,
          });
          const wireframe = new THREE.LineSegments(edges, lineMat);
          mesh.add(wireframe);

          scene.add(mesh);
          interactiveObjects.push(mesh);
        }
      });

      // 3D Route Line if active
      if (isNavActive && nodeCoordinates.length >= 2) {
        const points3D = nodeCoordinates.map((node) => {
          const x = node.x - MAP_WIDTH / 2;
          const z = node.y - MAP_HEIGHT / 2;
          return new THREE.Vector3(x, 25, z);
        });

        const curve = new THREE.CatmullRomCurve3(points3D);
        const tubeGeo = new THREE.TubeGeometry(curve, 100, 6, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({
          color: 0x7b68ee,
          wireframe: false,
        });
        const routeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        scene.add(routeMesh);
      }
    }

    // ==========================================
    // 2. 3D EARTH GLOBE VIEW
    // ==========================================
    else if (viewMode === '3d-globe') {
      camera.position.set(0, 0, 800);
      controls.target.set(0, 0, 0);
      controls.minDistance = 450;
      controls.maxDistance = 2000;

      // Earth Sphere
      const earthRadius = 300;
      const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
      const textureLoader = new THREE.TextureLoader();

      // High quality procedural / canvas earth texture
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d')!;
      // Ocean gradient
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
      oceanGrad.addColorStop(0, isDark ? '#040b1e' : '#0284c7');
      oceanGrad.addColorStop(1, isDark ? '#020617' : '#0369a1');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, 2048, 1024);

      // Continents sketch
      ctx.fillStyle = isDark ? '#1e293b' : '#22c55e';
      ctx.beginPath();
      // Asia & India
      ctx.ellipse(1400, 480, 260, 200, 0, 0, Math.PI * 2);
      ctx.fill();
      // Europe & Africa
      ctx.beginPath();
      ctx.ellipse(1050, 450, 200, 250, 0, 0, Math.PI * 2);
      ctx.fill();
      // Americas
      ctx.beginPath();
      ctx.ellipse(500, 450, 180, 320, 0, 0, Math.PI * 2);
      ctx.fill();

      const earthTex = new THREE.CanvasTexture(canvas);
      const earthMat = new THREE.MeshStandardMaterial({
        map: earthTex,
        roughness: 0.7,
        metalness: 0.1,
      });
      const earthMesh = new THREE.Mesh(earthGeo, earthMat);
      scene.add(earthMesh);

      // Atmosphere Glow
      const atmosGeo = new THREE.SphereGeometry(earthRadius * 1.04, 64, 64);
      const atmosMat = new THREE.MeshBasicMaterial({
        color: 0x7b68ee,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
      });
      const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
      scene.add(atmosphere);

      // BIT Pin on Earth Sphere
      const phi = (90 - BIT_LAT) * (Math.PI / 180);
      const theta = (BIT_LNG + 180) * (Math.PI / 180);
      const pinX = -(earthRadius * Math.sin(phi) * Math.cos(theta));
      const pinZ = earthRadius * Math.sin(phi) * Math.sin(theta);
      const pinY = earthRadius * Math.cos(phi);

      const markerGeo = new THREE.SphereGeometry(8, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const bitMarker = new THREE.Mesh(markerGeo, markerMat);
      bitMarker.position.set(pinX, pinY, pinZ);
      scene.add(bitMarker);

      // Pulsing Ring
      const ringGeo = new THREE.RingGeometry(12, 18, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x7b68ee,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(pinX * 1.02, pinY * 1.02, pinZ * 1.02);
      ring.lookAt(pinX * 2, pinY * 2, pinZ * 2);
      scene.add(ring);
    }

    // ==========================================
    // Raycasting for Interactivity
    // ==========================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        container.style.cursor = 'pointer';
        setTooltip({
          name: hit.userData.name || 'Building',
          x: e.clientX,
          y: e.clientY,
        });
      } else {
        container.style.cursor = 'grab';
        setTooltip(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        if (hit.userData.id) {
          selectPlace(hit.userData.id);
        }
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);

    // ==========================================
    // Render Loop & Resize
    // ==========================================
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleClick);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [viewMode, theme, selectedPlaceId, isNavActive, nodeCoordinates, selectPlace]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating 3D Tooltip */}
      {tooltip && (
        <div
          className="fixed pointer-events-none px-3 py-1.5 bg-slate-900/90 text-white text-xs font-bold rounded-lg border border-primary shadow-xl backdrop-blur-sm z-50 transform -translate-x-1/2 -translate-y-12"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.name}
        </div>
      )}

      {/* 3D Mode Navigation Toolbar */}
      <div className="absolute top-24 left-6 z-40 flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl">
        <button
          type="button"
          onClick={() => setViewMode('2d')}
          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition-colors"
        >
          ← Exit 3D (2D Map)
        </button>
        <button
          type="button"
          onClick={() => setViewMode(viewMode === '3d-satellite' ? '3d-globe' : '3d-satellite')}
          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary hover:bg-primary-hover text-white transition-colors shadow"
        >
          {viewMode === '3d-satellite' ? '🌍 View Earth Globe' : '🏛️ View 3D Campus'}
        </button>
      </div>
    </div>
  );
}
