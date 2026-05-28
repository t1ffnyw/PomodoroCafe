import { motion } from "framer-motion";
import type { AppTheme, ThemeId } from "@/types/theme";
import { allThemes } from "@/config/themes";

type ThemePickerProps = {
  themeId: ThemeId;
  onSelect: (id: ThemeId) => void;
  onClose: () => void;
};

function ThemePreviewCard({
  theme,
  isActive,
  onSelect,
}: {
  theme: AppTheme;
  isActive: boolean;
  onSelect: () => void;
}) {
  const drinkSrc = theme.scene.drink.layers[0]?.src ?? "";
  const bgClass = theme.scene.background.className;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-center gap-2 rounded-xl p-2 transition-all ${
        isActive
          ? "ring-2 ring-cafe-matcha ring-offset-2"
          : "hover:bg-cafe-sage-light/50"
      }`}
      aria-pressed={isActive}
      aria-label={`${theme.label} theme`}
    >
      <div
        data-theme={theme.id}
        className={`h-16 w-20 overflow-hidden rounded-lg border border-cafe-sage/40 ${bgClass}`}
      >
        <img
          src={drinkSrc}
          alt=""
          className="mx-auto mt-2 h-10 w-10 object-contain pixelated"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
      <span className="font-body text-xs font-semibold text-cafe-text">
        {theme.label}
      </span>
    </button>
  );
}

export function ThemePicker({ themeId, onSelect, onClose }: ThemePickerProps) {
  function handleSelect(id: ThemeId) {
    onSelect(id);
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="popup w-auto"
    >
      <h3 className="mb-3 font-display text-base font-semibold text-cafe-text">
        Choose Theme
      </h3>
      <div className="flex gap-3">
        {allThemes.map((theme) => (
          <ThemePreviewCard
            key={theme.id}
            theme={theme}
            isActive={themeId === theme.id}
            onSelect={() => handleSelect(theme.id)}
          />
        ))}
      </div>
    </motion.div>
  );
}
