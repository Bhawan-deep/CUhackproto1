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

  // Light purple color scheme for all strings / edge connection lines
  const strokeColor = '#8b5cf6';
  const particleColor = '#c084fc';
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
          stroke: isPulseActive ? '#d8b4fe' : strokeColor,
          strokeWidth: isPulseActive ? strokeWidth * 1.6 : strokeWidth,
          opacity: isPulseActive ? 0.95 : 0.5,
          transition: 'all 0.3s ease-in-out',
        }}
      />
      {/* Animated Light Purple Flow Overlay */}
      <path
        d={edgePath}
        fill="none"
        stroke={isPulseActive ? '#f472b6' : particleColor}
        strokeWidth={isPulseActive ? strokeWidth * 2.0 : strokeWidth * 1.2}
        strokeDasharray={dashArray}
        style={{
          opacity: isPulseActive ? 1.0 : 0.75,
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
