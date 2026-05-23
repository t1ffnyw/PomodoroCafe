import type { SceneConfig } from "@/types/scene";

type CafeSceneProps = {
  scene: SceneConfig;
  children: React.ReactNode;
};

export function CafeScene({ scene, children }: CafeSceneProps) {
  return (
    <div
      className={`relative min-h-screen w-full ${scene.background.className} border-scallop-top border-scallop-bottom`}
    >
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col p-6 pt-10">
        {children}
      </div>
    </div>
  );
}
