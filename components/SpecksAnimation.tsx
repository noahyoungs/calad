"use client";

import { useEffect, useRef, useState } from "react";
import { debounce } from 'lodash';

export function SpecksAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [opacity, setOpacity] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const specksRef = useRef<Array<{
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to fill container
    function resizeCanvas() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initSpecks();
    }

    function initSpecks() {
      if (!canvas) return;
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear existing animation frame if any
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      const newSpecks = [];
      // Fewer specks for better performance
      for (let i = 0; i < 80; i++) {
        newSpecks.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: (Math.random() * 4),
          speedX: (Math.random() - 0.5) * 0.02, // Slightly slower movement
          speedY: (Math.random() - 0.5) * 0.02,
          opacity: Math.random() * 0.2 + 0.8, 
        });
      }
      
      specksRef.current = newSpecks;
      
      // Start animation only after specks are initialized
      startAnimation();
    }

    function startAnimation() {
      drawSpecks();
    }

    function drawSpecks() {
      if (!ctx || !canvas) return;
      const width = canvas.width;
      const height = canvas.height;

      // Clear the canvas with transparent background
      ctx.clearRect(0, 0, width, height);

      specksRef.current.forEach((speck) => {
        // Update position
        speck.x += speck.speedX;
        speck.y += speck.speedY;

        // Wrap around edges
        if (speck.x < 0) speck.x = width;
        if (speck.x > width) speck.x = 0;
        if (speck.y < 0) speck.y = height;
        if (speck.y > height) speck.y = 0;

        // Draw with subtle glow effect using the requested color
        const gradient = ctx.createRadialGradient(
          speck.x,
          speck.y,
          0,
          speck.x,
          speck.y,
          speck.size * 1.5
        );
        gradient.addColorStop(0, `rgba(249, 210, 40, 100)`); // f9d228 with higher opacity
        gradient.addColorStop(1, "rgba(249, 210, 40, 0)"); // f9d228 faded out

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(speck.x, speck.y, speck.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(drawSpecks);
    }

    // Simple, lightweight debounce for resize
    const debouncedResize = debounce(resizeCanvas, 300);

    // Initial setup
    resizeCanvas();

    // Handle window resize with debounce
    window.addEventListener("resize", debouncedResize);

    // Add fade-in effect
    setTimeout(() => {
      setOpacity(1);
    }, 100);

    // Cleanup
    return () => {
      window.removeEventListener("resize", debouncedResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Fixed blue background that's always visible */}
      <div 
        className="fixed top-0 left-0 w-full h-full z-0"
        style={{ backgroundColor: "#7f8ee2" }}
      />
      
      {/* Canvas for specks animation that fades in */}
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full z-10"
        style={{ 
          opacity: opacity,
          transition: "opacity 0.8s ease-in-out"
        }}
      />
    </>
  );
} 