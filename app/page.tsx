import { Suspense } from "react";

import { TelemetryExplorer } from "@/components/TelemetryExplorer";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-[1560px] px-3 py-8 md:px-4 xl:px-5">
          <div className="timing-skeleton" />
        </div>
      }
    >
      <TelemetryExplorer />
    </Suspense>
  );
}
