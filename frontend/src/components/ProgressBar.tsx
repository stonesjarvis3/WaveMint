interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
}

export default function ProgressBar({ value, className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`h-2 bg-gray-800 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
