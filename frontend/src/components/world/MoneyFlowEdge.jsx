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

  const flowType = data?.flowType || data?.type || 'default';
  
  // Define distinct flow colors and dash speeds
  let strokeColor = '#475569';
  let particleColor = '#94a3b8';
  let strokeWidth = 1.2;
  let dashArray = '4,6';
  let animationDuration = '3s';

  if (flowType === 'tax') {
    strokeColor = '#10b981';
    particleColor = '#34d399';
    strokeWidth = 1.5;
    dashArray = '6,4';
    animationDuration = '2s';
  } else if (flowType === 'salary') {
    strokeColor = '#f59e0b';
    particleColor = '#fbbf24';
    strokeWidth = 1.5;
    dashArray = '5,5';
    animationDuration = '2.2s';
  } else if (flowType === 'infra' || flowType === 'infrastructure') {
    strokeColor = '#0284c7';
    particleColor = '#38bdf8';
    strokeWidth = 2.0;
    dashArray = '8,4';
    animationDuration = '1.8s';
  } else if (flowType === 'loan' || flowType === 'monetary_policy') {
    strokeColor = '#a855f7';
    particleColor = '#c084fc';
    strokeWidth = 1.8;
    dashArray = '6,6';
    animationDuration = '2.5s';
  } else if (flowType === 'consumption') {
    strokeColor = '#f43f5e';
    particleColor = '#fb7185';
    strokeWidth = 1.2;
    dashArray = '4,4';
    animationDuration = '3s';
  }

  const isPulseActive = data?.isPulseActive;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: isPulseActive ? particleColor : strokeColor,
          strokeWidth: isPulseActive ? strokeWidth * 1.6 : strokeWidth,
          opacity: isPulseActive ? 0.9 : 0.4,
          transition: 'all 0.3s ease-in-out',
        }}
      />
      {/* Animated Flow Overlay */}
      <path
        d={edgePath}
        fill="none"
        stroke={particleColor}
        strokeWidth={isPulseActive ? strokeWidth * 2.0 : strokeWidth * 1.2}
        strokeDasharray={dashArray}
        style={{
          opacity: isPulseActive ? 1.0 : 0.6,
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
