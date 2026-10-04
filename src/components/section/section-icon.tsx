import {
  Bed,
  Bus,
  Car,
  LifeBuoy,
  Package,
  Plane,
  ShieldCheck,
  Smartphone,
  Ticket,
  TrainFront,
  type LucideIcon,
} from "lucide-react";

import type { SectionIcon as SectionIconKey } from "@/core/sections/sections";

const ICONS: Record<SectionIconKey, LucideIcon> = {
  ticket: Ticket,
  bed: Bed,
  car: Car,
  plane: Plane,
  train: TrainFront,
  bus: Bus,
  package: Package,
  shield: ShieldCheck,
  smartphone: Smartphone,
  "life-buoy": LifeBuoy,
};

export function SectionIcon({
  icon,
  className,
}: {
  icon: SectionIconKey;
  className?: string;
}) {
  const Icon = ICONS[icon];
  return <Icon aria-hidden="true" className={className ?? "h-5 w-5"} />;
}
