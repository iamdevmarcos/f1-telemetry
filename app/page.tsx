import { Suspense } from "react";

import { TelemetryExplorer } from "@/components/TelemetryExplorer";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-8">
          <div className="timing-skeleton" />
        </div>
      }
    >
      <TelemetryExplorer />
    </Suspense>
  );
}
