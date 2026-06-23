import { Workspace } from "@/components/Workspace";

export default function Home() {
  // Workspace-first route: the editor IS the landing surface (TechnicalStack §1).
  return <Workspace />;
}
