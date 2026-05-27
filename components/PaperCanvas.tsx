import React, { useMemo } from 'react';
import { Canvas, Rect, Path, Skia, Line } from '@shopify/react-native-skia';
import { DrawingStroke } from '../utils/storage';

const PAPER_BG = '#FAF9F6';
const LINE_COLOR = 'rgba(0,0,0,0.055)';
const LINE_SPACING = 28;

interface Props {
  width: number;
  height: number;
  strokes: DrawingStroke[];
  currentSvgPath?: string | null;
  currentTool?: DrawingStroke['tool'];
  currentColor?: string;
  snapGuideX?: number | null;
  snapGuideY?: number | null;
}

export default function PaperCanvas({
  width, height, strokes, currentSvgPath,
  currentTool = 'pencil', currentColor = '#444',
  snapGuideX, snapGuideY,
}: Props) {
  // Horizontal ruled lines for paper texture
  const ruledLines = useMemo(() => {
    const pts: { y: number }[] = [];
    for (let y = LINE_SPACING; y < height; y += LINE_SPACING) pts.push({ y });
    return pts;
  }, [height]);

  // Convert stored stroke SVG paths to SkPath objects
  const skStrokes = useMemo(() => strokes.map(s => ({
    ...s,
    path: Skia.Path.MakeFromSVGString(s.svgPath) ?? Skia.Path.Make(),
  })), [strokes]);

  // Active drawing path
  const currentSkPath = useMemo(() => {
    if (!currentSvgPath) return null;
    return Skia.Path.MakeFromSVGString(currentSvgPath);
  }, [currentSvgPath]);

  function toolProps(tool: DrawingStroke['tool']) {
    switch (tool) {
      case 'highlighter': return { strokeWidth: 20, opacity: 0.45, blendMode: 'multiply' as const };
      case 'tape':        return { strokeWidth: 14, opacity: 0.55, blendMode: 'srcOver' as const };
      default:            return { strokeWidth: 2.5, opacity: 1,    blendMode: 'srcOver' as const };
    }
  }

  return (
    <Canvas style={{ position: 'absolute', width, height }}>
      {/* Paper background */}
      <Rect x={0} y={0} width={width} height={height} color={PAPER_BG} />

      {/* Ruled lines */}
      {ruledLines.map(({ y }) => (
        <Line key={y} p1={{ x: 16, y }} p2={{ x: width - 16, y }}
          color={LINE_COLOR} strokeWidth={0.5} />
      ))}

      {/* Saved drawing strokes */}
      {skStrokes.map((s, i) => {
        const tp = toolProps(s.tool);
        return (
          <Path
            key={i}
            path={s.path}
            color={s.color}
            style="stroke"
            strokeWidth={s.strokeWidth}
            strokeCap="round"
            strokeJoin="round"
            blendMode={tp.blendMode}
            opacity={tp.opacity}
          />
        );
      })}

      {/* Live drawing stroke */}
      {currentSkPath && (() => {
        const tp = toolProps(currentTool);
        return (
          <Path
            path={currentSkPath}
            color={currentColor}
            style="stroke"
            strokeWidth={tp.strokeWidth}
            strokeCap="round"
            strokeJoin="round"
            blendMode={tp.blendMode}
            opacity={tp.opacity}
          />
        );
      })()}

      {/* Alignment snap guide lines */}
      {snapGuideX != null && (
        <Line
          p1={{ x: snapGuideX, y: 0 }}
          p2={{ x: snapGuideX, y: height }}
          color="rgba(80,120,255,0.5)"
          strokeWidth={1.5}
        />
      )}
      {snapGuideY != null && (
        <Line
          p1={{ x: 0, y: snapGuideY }}
          p2={{ x: width, y: snapGuideY }}
          color="rgba(80,120,255,0.5)"
          strokeWidth={1.5}
        />
      )}
    </Canvas>
  );
}
