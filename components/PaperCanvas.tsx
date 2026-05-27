import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Line, Rect } from 'react-native-svg';
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
  const ruledLineYs = useMemo(() => {
    const ys: number[] = [];
    for (let y = LINE_SPACING; y < height; y += LINE_SPACING) ys.push(y);
    return ys;
  }, [height]);

  function toolProps(tool: DrawingStroke['tool']) {
    switch (tool) {
      case 'highlighter': return { strokeWidth: 20, opacity: 0.45 };
      case 'tape':        return { strokeWidth: 14, opacity: 0.55 };
      default:            return { strokeWidth: 2.5, opacity: 1 };
    }
  }

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: PAPER_BG }]} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {/* Paper background */}
        <Rect x={0} y={0} width={width} height={height} fill={PAPER_BG} />

        {/* Ruled lines */}
        {ruledLineYs.map(y => (
          <Line
            key={y}
            x1={16} y1={y} x2={width - 16} y2={y}
            stroke={LINE_COLOR} strokeWidth={0.5}
          />
        ))}

        {/* Saved drawing strokes */}
        {strokes.map((s, i) => {
          const tp = toolProps(s.tool);
          return (
            <Path
              key={i}
              d={s.svgPath}
              stroke={s.color}
              strokeWidth={s.strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={tp.opacity}
            />
          );
        })}

        {/* Live drawing stroke */}
        {currentSvgPath && (() => {
          const tp = toolProps(currentTool);
          return (
            <Path
              d={currentSvgPath}
              stroke={currentColor}
              strokeWidth={tp.strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={tp.opacity}
            />
          );
        })()}

        {/* Alignment snap guide lines */}
        {snapGuideX != null && (
          <Line
            x1={snapGuideX} y1={0} x2={snapGuideX} y2={height}
            stroke="rgba(80,120,255,0.5)" strokeWidth={1.5}
          />
        )}
        {snapGuideY != null && (
          <Line
            x1={0} y1={snapGuideY} x2={width} y2={snapGuideY}
            stroke="rgba(80,120,255,0.5)" strokeWidth={1.5}
          />
        )}
      </Svg>
    </View>
  );
}
