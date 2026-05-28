import type { SceneConfig } from "@/types/scene";
import type { ThemeId } from "@/types/theme";

type CafeSceneProps = {
  scene: SceneConfig;
  themeId: ThemeId;
  children: React.ReactNode;
};

export function CafeScene({ scene, themeId, children }: CafeSceneProps) {
  return (
    <div
      data-theme={themeId}
      className={`relative min-h-screen w-full ${scene.background.className} border-scallop-top border-scallop-bottom`}
    >
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col p-6 pt-16">
        {children}
      </div>
    </div>
  );
}
