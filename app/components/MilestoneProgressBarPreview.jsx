import React from 'react';
import { Text, Badge, Tooltip } from '@shopify/polaris';

/**
 * MilestoneProgressBarPreview Component
 * 
 * Displays a horizontal progress bar with milestone indicators for the cart drawer preview.
 * Shows customer progress towards rewards with visual feedback.
 */

const ICON_MAP = {
  gift: '🎁',
  truck: '🚚',
  star: '⭐',
  discount: '🏷️',
  trophy: '🏆',
  heart: '❤️',
};

export default function MilestoneProgressBarPreview({ 
  milestones = [],
  currentValue = 0,
  valueType = 'amount', // 'amount' or 'quantity'
  barColor = '#93D3FF',
  backgroundColor = '#e5e7eb',
}) {
  if (!milestones || milestones.length === 0) {
    return null;
  }

  const getMilestoneState = (milestone, index) => {
    const targetValue = milestone.targetValue;
    const previousValue = index > 0 ? milestones[index - 1].targetValue : 0;

    if (currentValue >= targetValue) {
      return 'completed';
    } else if (currentValue > previousValue) {
      return 'active';
    } else {
      return 'locked';
    }
  };

  const calculateProgress = (milestone, index) => {
    const targetValue = milestone.targetValue;
    const previousValue = index > 0 ? milestones[index - 1].targetValue : 0;
    const segmentRange = targetValue - previousValue;
    const valueInSegment = Math.max(0, currentValue - previousValue);
    return Math.min(100, (valueInSegment / segmentRange) * 100);
  };

  const getTooltipText = (state, milestone, index) => {
    const remaining = milestone.targetValue - currentValue;
    const prefix = valueType === 'amount' ? '₹' : '';
    const suffix = valueType === 'quantity' ? ' items' : '';

    switch (state) {
      case 'locked':
        return `Add ${prefix}${remaining}${suffix} more to unlock`;
      case 'active':
        return `You're ${prefix}${remaining}${suffix} away!`;
      case 'completed':
        return `✓ ${milestone.label} unlocked!`;
      default:
        return '';
    }
  };

  return (
    <div style={{ 
      padding: '16px 12px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
    }}>
      {/* Progress Text */}
      <div style={{ marginBottom: '12px', textAlign: 'center' }}>
        <Text variant="bodySm" as="p" tone="subdued">
          {valueType === 'amount' ? `₹${currentValue}` : `${currentValue} items`} of {valueType === 'amount' ? `₹${milestones[milestones.length - 1].targetValue}` : `${milestones[milestones.length - 1].targetValue} items`}
        </Text>
      </div>

      {/* Milestone Progress Bar */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '40px',
      }}>
        {milestones.map((milestone, index) => {
          const state = getMilestoneState(milestone, index);
          const progress = calculateProgress(milestone, index);
          const isFirst = index === 0;
          const isLast = index === milestones.length - 1;

          return (
            <React.Fragment key={milestone.id}>
              {/* Connecting Line (before milestone) */}
              {!isFirst && (
                <div style={{
                  flex: 1,
                  height: '4px',
                  backgroundColor: backgroundColor,
                  position: 'relative',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  margin: '0 -4px',
                }}>
                  {/* Filled portion of line */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: state === 'active' ? `${progress}%` : state === 'completed' ? '100%' : '0%',
                    backgroundColor: barColor,
                    transition: 'width 0.5s ease-in-out',
                    borderRadius: '2px',
                  }} />
                </div>
              )}

              {/* Milestone Icon Container */}
              <div style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 2,
              }}>
                <Tooltip content={getTooltipText(state, milestone, index)}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    backgroundColor: state === 'completed' 
                      ? '#dcfce7' 
                      : state === 'active' 
                        ? '#dbeafe' 
                        : '#f3f4f6',
                    border: `3px solid ${
                      state === 'completed' 
                        ? '#86efac' 
                        : state === 'active' 
                          ? barColor 
                          : '#d1d5db'
                    }`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    boxShadow: state === 'active' 
                      ? '0 0 0 4px rgba(147, 211, 255, 0.2)' 
                      : 'none',
                  }}>
                    {state === 'completed' ? '✓' : ICON_MAP[milestone.icon] || '🎁'}
                  </div>
                </Tooltip>

                {/* Milestone Label */}
                <div style={{
                  marginTop: '8px',
                  textAlign: 'center',
                }}>
                  <Text 
                    variant="bodySm" 
                    as="p" 
                    fontWeight={state === 'active' ? 'semibold' : 'regular'}
                    tone={state === 'locked' ? 'subdued' : 'base'}
                  >
                    {milestone.label}
                  </Text>
                  {state === 'active' && (
                    <Badge tone="info" size="small">
                      {Math.round(progress)}%
                    </Badge>
                  )}
                  {state === 'completed' && (
                    <Badge tone="success" size="small">
                      ✓ Done
                    </Badge>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Reward Message */}
      {(() => {
        const nextMilestone = milestones.find(m => m.targetValue > currentValue);
        const allCompleted = milestones.every(m => currentValue >= m.targetValue);

        if (allCompleted) {
          return (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              backgroundColor: '#dcfce7',
              borderRadius: '6px',
              textAlign: 'center',
            }}>
              <Text variant="bodySm" as="p" fontWeight="semibold">
                🎉 All rewards unlocked!
              </Text>
            </div>
          );
        } else if (nextMilestone) {
          const remaining = nextMilestone.targetValue - currentValue;
          return (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              backgroundColor: '#f0f9ff',
              borderRadius: '6px',
              textAlign: 'center',
            }}>
              <Text variant="bodySm" as="p">
                {valueType === 'amount' 
                  ? `Add ₹${remaining} more to unlock ${nextMilestone.label}` 
                  : `Add ${remaining} more items to unlock ${nextMilestone.label}`}
              </Text>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}

// Example mock data for testing
export const MOCK_MILESTONES = [
  {
    id: "tier-1",
    targetType: "amount",
    targetValue: 300,
    rewardType: "product",
    label: "₹300",
    icon: "gift"
  },
  {
    id: "tier-2",
    targetType: "amount",
    targetValue: 600,
    rewardType: "free_shipping",
    label: "₹600",
    icon: "truck"
  },
  {
    id: "tier-3",
    targetType: "amount",
    targetValue: 1000,
    rewardType: "discount",
    label: "₹1000",
    icon: "star"
  }
];
