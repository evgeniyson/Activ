import type { LucideProps } from "lucide-react";
import { Aperture, Armchair, Bike, Box, Camera, Car, CircleDot, Cpu, Gamepad2, Gem, Headphones, Laptop, Monitor, Music, Plane, Shirt, Smartphone, Speaker, Tablet, Watch, Wrench } from "lucide-react";
import type { AssetCategory } from "@/types/domain";

const MAP: Record<AssetCategory, React.ComponentType<LucideProps>> = {
  smartphone: Smartphone,
  laptop: Laptop,
  tablet: Tablet,
  smartwatch: Watch,
  headphones: Headphones,
  camera: Camera,
  lens: Aperture,
  gaming_console: Gamepad2,
  gpu: Cpu,
  pc_component: Cpu,
  monitor: Monitor,
  drone: Plane,
  audio: Speaker,
  bicycle: Bike,
  e_scooter: Bike,
  watch: Watch,
  sneakers: Shirt,
  fashion: Shirt,
  bag: Box,
  instrument: Music,
  collectible: Gem,
  furniture: Armchair,
  appliance: Box,
  tool: Wrench,
  vehicle: Car,
  other: CircleDot,
};

export function CategoryIcon({ category, ...props }: { category: AssetCategory } & LucideProps) {
  const Icon = MAP[category] ?? CircleDot;
  return <Icon strokeWidth={1.75} aria-hidden="true" {...props} />;
}
