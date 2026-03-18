"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceLink,
  forceX,
  forceY,
} from "d3-force";
import useStore from "@/store";

// ── Node type visual config ──
const TYPE_CONFIG = {
  question: { color: "#64B5F6", symbol: "?" },
  pressure: { color: "#FF8A65", symbol: "!" },
  idea: { color: "#81C784", symbol: "✦" },
  blocker: { color: "#E57373", symbol: "×" },
  reasoning: { color: "#BA68C8", symbol: "∴" },
  emotion: { color: "#FFB74D", symbol: "♡" },
  thought: { color: "#90A4AE", symbol: "·" },
  insight: { color: "#64FFDA", symbol: "◆" },
  assumption: { color: "#CE93D8", symbol: "~" },
  goal: { color: "#4FC3F7", symbol: "→" },
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export default function Canvas() {
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const simNodesRef = useRef([]);
  const simLinksRef = useRef([]);
  const frameRef = useRef(null);
  const dragRef = useRef(null);
  const hoverRef = useRef(null);
  const panRef = useRef({ x: 0, y: 0, startX: 0, startY: 0, panning: false });
  const timeRef = useRef(0);
  const [tooltip, setTooltip] = useState(null);

  const nodes = useStore((s) => s.nodes);
  const connections = useStore((s) => s.connections);
  const enterFocus = useStore((s) => s.enterFocus);
  const updateNodePosition = useStore((s) => s.updateNodePosition);
  const resolveNode = useStore((s) => s.resolveNode);
  const removeNode = useStore((s) => s.removeNode);

  // ── Sync store nodes with d3 simulation ──
  useEffect(() => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    // Merge new nodes into simulation, preserve existing positions
    const existingMap = new Map(simNodesRef.current.map((n) => [n.id, n]));
    const newSimNodes = nodes.map((n) => {
      const existing = existingMap.get(n.id);
      if (existing) {
        // Update data but keep physics position
        return { ...existing, ...n, x: existing.x, y: existing.y, vx: existing.vx, vy: existing.vy };
      }
      return {
        ...n,
        x: n.position_x || cx + (Math.random() - 0.5) * 200,
        y: n.position_y || cy + (Math.random() - 0.5) * 200,
        radius: Math.min(16 + (n.text?.length || 0) * 0.3, 36),
      };
    });

    const newSimLinks = connections.map((c) => ({
      ...c,
      source: c.source_node_id,
      target: c.target_node_id,
    }));

    simNodesRef.current = newSimNodes;
    simLinksRef.current = newSimLinks;

    // Restart or create simulation
    if (simRef.current) {
      simRef.current.nodes(newSimNodes);
      simRef.current
        .force("link")
        ?.links(newSimLinks);
      simRef.current.alpha(0.3).restart();
    } else {
      simRef.current = forceSimulation(newSimNodes)
        .force("charge", forceManyBody().strength(-120).distanceMax(300))
        .force("center", forceCenter(cx, cy).strength(0.02))
        .force("collision", forceCollide().radius((d) => (d.radius || 24) + 8))
        .force(
          "link",
          forceLink(newSimLinks)
            .id((d) => d.id)
            .distance(140)
            .strength((d) => (d.strength || 0.5) * 0.3)
        )
        .force("x", forceX(cx).strength(0.005))
        .force("y", forceY(cy).strength(0.005))
        .alphaDecay(0.008)
        .velocityDecay(0.25);
    }
  }, [nodes, connections]);

  // ── Render loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      // ── Background particles ──
      ctx.save();
      for (let i = 0; i < 40; i++) {
        const px = ((Math.sin(t * 0.1 + i * 7.3) + 1) / 2) * w;
        const py = ((Math.cos(t * 0.08 + i * 11.1) + 1) / 2) * h;
        const o = 0.03 + 0.02 * Math.sin(t * 0.5 + i);
        ctx.beginPath();
        ctx.arc(px, py, 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(120,140,200,${o})`;
        ctx.fill();
      }
      ctx.restore();

      const sNodes = simNodesRef.current;
      const sLinks = simLinksRef.current;

      // ── Draw connections ──
      for (const link of sLinks) {
        const src = typeof link.source === "object" ? link.source : sNodes.find((n) => n.id === link.source);
        const tgt = typeof link.target === "object" ? link.target : sNodes.find((n) => n.id === link.target);
        if (!src || !tgt) continue;

        const srcCfg = TYPE_CONFIG[src.node_type] || TYPE_CONFIG.thought;
        const tgtCfg = TYPE_CONFIG[tgt.node_type] || TYPE_CONFIG.thought;
        const strength = link.strength || 0.5;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);

        // Curved links
        const mx = (src.x + tgt.x) / 2;
        const my = (src.y + tgt.y) / 2;
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const cx2 = mx - dy * 0.1;
        const cy2 = my + dx * 0.1;
        ctx.quadraticCurveTo(cx2, cy2, tgt.x, tgt.y);

        ctx.strokeStyle = `rgba(100,140,200,${0.06 + strength * 0.12})`;
        ctx.lineWidth = 0.5 + strength * 1.2;
        if (strength < 0.3) ctx.setLineDash([3, 6]);
        ctx.stroke();
        ctx.restore();
      }

      // ── Draw nodes ──
      for (const node of sNodes) {
        const cfg = TYPE_CONFIG[node.node_type] || TYPE_CONFIG.thought;
        const rgb = hexToRgb(cfg.color);
        const r = node.radius || 24;
        const isHover = hoverRef.current === node.id;
        const isHook = node.is_hook;
        const isResolved = node.is_resolved;

        // Breathing
        const breathe = 1 + Math.sin(t * 1.5 + node.x * 0.01) * 0.04;
        const drawR = r * breathe * (isHover ? 1.12 : 1);

        // Resolved nodes are dimmer
        const baseAlpha = isResolved ? 0.25 : 1;

        // Glow
        ctx.save();
        if (isHook || isHover) {
          ctx.shadowColor = cfg.color;
          ctx.shadowBlur = isHook ? 30 : 20;
        }

        // Outer glow ring for hooks
        if (isHook && !isResolved) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, drawR * 1.6, 0, Math.PI * 2);
          const pulseAlpha = 0.08 + Math.sin(t * 2) * 0.06;
          ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${pulseAlpha})`;
          ctx.fill();
        }

        // Blocker pulse
        if (node.node_type === "blocker" && !isResolved) {
          const pulseR = drawR * (1.3 + Math.sin(t * 3) * 0.2);
          ctx.beginPath();
          ctx.arc(node.x, node.y, pulseR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.04)`;
          ctx.fill();
        }

        // Core orb
        ctx.beginPath();
        ctx.arc(node.x, node.y, drawR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${0.06 * baseAlpha})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${(isHover ? 0.7 : 0.3) * baseAlpha})`;
        ctx.lineWidth = isHover ? 1.5 : 0.8;
        ctx.stroke();

        // Type symbol
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${0.6 * baseAlpha})`;
        ctx.font = `${drawR * 0.5}px "Newsreader", Georgia, serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(cfg.symbol, node.x, node.y);

        // Hook label
        if (isHook && !isResolved && !isHover) {
          ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.5)`;
          ctx.font = `8px "DM Mono", monospace`;
          ctx.fillText("HOOK", node.x, node.y + drawR + 14);
        }

        // Resolved check
        if (isResolved) {
          ctx.fillStyle = `rgba(129,199,132,0.4)`;
          ctx.font = `${drawR * 0.5}px sans-serif`;
          ctx.fillText("✓", node.x, node.y - drawR - 8);
        }

        ctx.restore();

        // Label on hover
        if (isHover) {
          const text = node.text || "";
          const displayText = text.length > 60 ? text.substring(0, 57) + "..." : text;
          const labelY = node.y + drawR + 24;

          // Background
          ctx.save();
          ctx.font = `12px "Newsreader", Georgia, serif`;
          const metrics = ctx.measureText(displayText);
          const tw = Math.min(metrics.width + 20, 220);

          ctx.fillStyle = "rgba(10,12,20,0.92)";
          ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`;
          ctx.lineWidth = 1;
          const rx = node.x - tw / 2;
          const ry = labelY - 6;
          ctx.beginPath();
          ctx.roundRect(rx, ry, tw, 42, 8);
          ctx.fill();
          ctx.stroke();

          // Type label
          ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.5)`;
          ctx.font = `9px "DM Mono", monospace`;
          ctx.letterSpacing = "1.5px";
          ctx.fillText(node.node_type.toUpperCase(), node.x, labelY + 4);

          // Text
          ctx.fillStyle = `rgba(210,215,230,0.85)`;
          ctx.font = `12px "Newsreader", Georgia, serif`;
          ctx.fillText(displayText, node.x, labelY + 20);
          ctx.restore();
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ── Hit test ──
  const hitTest = useCallback((mx, my) => {
    const sNodes = simNodesRef.current;
    for (let i = sNodes.length - 1; i >= 0; i--) {
      const n = sNodes[i];
      const dx = mx - n.x;
      const dy = my - n.y;
      const r = (n.radius || 24) * 1.3;
      if (dx * dx + dy * dy < r * r) return n;
    }
    return null;
  }, []);

  // ── Mouse handlers ──
  const handleMouseMove = useCallback(
    (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (dragRef.current) {
        const node = dragRef.current;
        node.fx = mx;
        node.fy = my;
        updateNodePosition(node.id, mx, my);
        return;
      }

      const hit = hitTest(mx, my);
      hoverRef.current = hit?.id || null;
      canvasRef.current.style.cursor = hit ? "pointer" : "default";
    },
    [hitTest, updateNodePosition]
  );

  const handleMouseDown = useCallback(
    (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hit = hitTest(mx, my);

      if (hit) {
        dragRef.current = hit;
        hit.fx = mx;
        hit.fy = my;
        if (simRef.current) simRef.current.alphaTarget(0.3).restart();
      }
    },
    [hitTest]
  );

  const handleMouseUp = useCallback(() => {
    if (dragRef.current) {
      dragRef.current.fx = null;
      dragRef.current.fy = null;
      dragRef.current = null;
      if (simRef.current) simRef.current.alphaTarget(0);
    }
  }, []);

  const handleDoubleClick = useCallback(
    (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hit = hitTest(mx, my);
      if (hit) enterFocus(hit);
    },
    [hitTest, enterFocus]
  );

  // Context menu for node operations
  const [contextMenu, setContextMenu] = useState(null);

  const handleContextMenu = useCallback(
    (e) => {
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hit = hitTest(mx, my);
      if (hit) {
        setContextMenu({ x: e.clientX, y: e.clientY, node: hit });
      } else {
        setContextMenu(null);
      }
    },
    [hitTest]
  );

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      />

      {/* Context menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-void-light/95 backdrop-blur-xl border border-white/[0.06] rounded-lg
                       py-1 min-w-[160px] shadow-2xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                enterFocus(contextMenu.node);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left font-display text-sm text-white/70
                         hover:bg-white/[0.04] transition-colors"
            >
              ◉ Focus on this
            </button>
            <button
              onClick={() => {
                resolveNode(contextMenu.node.id);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left font-display text-sm text-accent-green/70
                         hover:bg-white/[0.04] transition-colors"
            >
              ✓ Mark resolved
            </button>
            <div className="border-t border-white/[0.04] my-1" />
            <button
              onClick={() => {
                removeNode(contextMenu.node.id);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left font-display text-sm text-accent-red/70
                         hover:bg-white/[0.04] transition-colors"
            >
              × Remove
            </button>
          </div>
        </>
      )}
    </>
  );
}
