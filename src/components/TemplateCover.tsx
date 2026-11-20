import { CoverTone } from '../types/store';

interface TemplateCoverProps {
  eyebrow: string;
  title: string;
  tone: CoverTone;
  compact?: boolean;
  className?: string;
}

const TONE_BACKGROUNDS: Record<CoverTone, string> = {
  operations:
    'radial-gradient(circle at 85% 10%, rgba(232,208,138,0.34), transparent 38%), linear-gradient(140deg, #17130a 0%, #0a0a0a 72%)',
  sales:
    'radial-gradient(circle at 20% 20%, rgba(201,162,75,0.36), transparent 36%), linear-gradient(140deg, #1c160d 0%, #0a0a0a 72%)',
  delivery:
    'radial-gradient(circle at 85% 85%, rgba(156,122,46,0.42), transparent 38%), linear-gradient(140deg, #17130a 0%, #0a0a0a 72%)',
};

export function TemplateCover({
  eyebrow,
  title,
  tone,
  compact = false,
  className = '',
}: TemplateCoverProps) {
  return (
    <div
      className={`flex flex-col justify-end text-[#e8d08a] select-none ${
        compact ? 'p-2.5' : 'p-6 sm:p-7'
      } ${className}`}
      style={{ background: TONE_BACKGROUNDS[tone] }}
    >
      <span
        className={`uppercase font-semibold tracking-[0.22em] text-[#e8d08a]/90 ${
          compact ? 'text-[8px] mb-0.5' : 'text-[11px] mb-1.5'
        }`}
      >
        {eyebrow}
      </span>
      <strong
        className={`font-display font-semibold leading-[0.88] tracking-normal text-[#e8d08a] ${
          compact ? 'text-sm' : 'text-4xl sm:text-[42px]'
        }`}
      >
        {title}
      </strong>
    </div>
  );
}
