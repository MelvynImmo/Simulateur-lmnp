import { createSimulation } from "@/app/simulations/new/actions";
import SimulationForm from "@/components/SimulationForm";

export default function NewSimulationPage() {
  return <SimulationForm mode="create" action={createSimulation} />;
}
