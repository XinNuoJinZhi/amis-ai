import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useColors } from '../../../../theme';
import type { StepState } from '../hooks/useTaskPhase';

interface Props {
  steps: StepState[];
}

/**
 * v0 风四步进度条 —— 横向，每步一个圆点 + 标签，点之间用连线
 */
export default function StepProgress({ steps }: Props) {
  const c = useColors();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 0,
        padding: '4px 8px',
      }}
    >
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const next = steps[idx + 1];
        // 连线颜色：前一步完成 && 后一步至少开始 running，就亮起来
        const lineActive =
          step.status === 'done' &&
          (next?.status === 'done' || next?.status === 'running' || next?.status === 'failed');

        return (
          <div
            key={step.key}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              flex: isLast ? 'initial' : 1,
              minWidth: 0,
            }}
          >
            <StepDot step={step} />
            {!isLast && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  marginTop: 11,
                  minWidth: 24,
                  background: lineActive ? c.accentCyan : c.borderSubtle,
                  transition: 'background 220ms ease',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepDot({ step }: { step: StepState }) {
  const c = useColors();

  const palette = (() => {
    switch (step.status) {
      case 'done':
        return { bg: c.accentCyan, border: c.accentCyan, fg: c.primaryContrast, label: c.text };
      case 'running':
        return { bg: 'transparent', border: c.accentCyan, fg: c.accentCyan, label: c.text };
      case 'failed':
        return {
          bg: 'transparent',
          border: c.destructive,
          fg: c.destructive,
          label: c.destructive,
        };
      default:
        return {
          bg: 'transparent',
          border: c.border,
          fg: c.textSubtle,
          label: c.textMuted,
        };
    }
  })();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        minWidth: 100,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: `1.5px solid ${palette.border}`,
          background: palette.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: palette.fg,
          transition: 'all 220ms ease',
        }}
      >
        {step.status === 'done' && <CheckOutlined style={{ fontSize: 11 }} />}
        {step.status === 'failed' && <CloseOutlined style={{ fontSize: 11 }} />}
        {step.status === 'running' && (
          <>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: c.accentCyan,
              }}
            />
            <span
              style={{
                position: 'absolute',
                inset: -4,
                borderRadius: '50%',
                background: c.accentCyan,
                opacity: 0.35,
                animation: 'v0-pulse-ring 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
          </>
        )}
        {step.status === 'pending' && (
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: c.textSubtle,
            }}
          />
        )}
      </div>
      <div
        style={{
          fontSize: 12,
          color: palette.label,
          fontWeight: step.status === 'done' || step.status === 'running' ? 500 : 400,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          transition: 'color 220ms ease',
        }}
      >
        {step.label}
      </div>
      {step.status === 'failed' && step.hint && (
        <div
          style={{
            fontSize: 11,
            color: c.destructive,
            maxWidth: 160,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          {step.hint}
        </div>
      )}
    </div>
  );
}
