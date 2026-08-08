import React, { memo } from 'react';
import { BaseEdge, getBezierPath } from '@xyflow/react';

function MoneyFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data = {},
  markerEnd,
}) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Unified single subtle blue color scheme for all strings / edge lines
  const strokeColor = '#0284c7';
  const particleColor = '#38bdf8';
  const strokeWidth = 1.4;
  const dashArray = '6,4';
  const animationDuration = '2.2s';

  const isPulseActive = data?.isPulseActive;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: isPulseActive ? '#38bdf8' : strokeColor,
          strokeWidth: isPulseActive ? strokeWidth * 1.6 : strokeWidth,
          opacity: isPulseActive ? 0.9 : 0.45,
          transition: 'all 0.3s ease-in-out',
        }}
      />
      {/* Animated Single-Color Blue Flow Overlay */}
      <path
        d={edgePath}
        fill="none"
        stroke={particleColor}
        strokeWidth={isPulseActive ? strokeWidth * 2.0 : strokeWidth * 1.2}
        strokeDasharray={dashArray}
        style={{
          opacity: isPulseActive ? 1.0 : 0.65,
          animation: `flowDash ${animationDuration} linear infinite`,
        }}
      />
      <style>{`
        @keyframes flowDash {
          from {
            strokeDashoffset: 40;
          }
          to {
            strokeDashoffset: 0;
          }
        }
      `}</style>
    </>
  );
}

export default memo(MoneyFlowEdge);
