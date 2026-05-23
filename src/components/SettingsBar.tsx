type SettingsBarProps = {
  title?: string;
};

export function SettingsBar({ title = "Café Pomodoro" }: SettingsBarProps) {
  return (
    <div className="cafe-card flex items-center justify-between px-6 py-3">
      <h1 className="font-display text-xl font-semibold text-cafe-text">
        {title}
      </h1>
      <div className="flex items-center gap-3">
        {/* Placeholder for future settings controls */}
      </div>
    </div>
  );
}
