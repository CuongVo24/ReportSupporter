import type { ReportProjectBundle } from "@/types";
import { takeSnapshot } from "@/modules/write/snapshots";

export async function snapshotBeforeCommand(bundle: ReportProjectBundle, command: string): Promise<void> {
  await takeSnapshot(bundle, `Before ${command}`);
}
