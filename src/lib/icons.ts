import {
  Footprints, Languages, BookOpen, Dumbbell, Droplets, Coffee,
  Moon, Bike, Apple, Heart, Brain, PencilLine, Music, Code,
  Wallet, Briefcase, Sprout, Sun, Cigarette, Pizza, Wine,
  AlarmClock, Bath, Phone,
} from "lucide-vue-next";
import type { Component } from "vue";

export interface HabitIcon { value: string; name: string; icon: Component }

export const HABIT_ICONS: HabitIcon[] = [
  { value: "footprints", name: "Caminar", icon: Footprints },
  { value: "languages", name: "Idioma", icon: Languages },
  { value: "book", name: "Leer", icon: BookOpen },
  { value: "dumbbell", name: "Gimnasio", icon: Dumbbell },
  { value: "droplets", name: "Agua", icon: Droplets },
  { value: "coffee", name: "Café", icon: Coffee },
  { value: "moon", name: "Dormir", icon: Moon },
  { value: "bike", name: "Bici", icon: Bike },
  { value: "apple", name: "Comer sano", icon: Apple },
  { value: "heart", name: "Salud", icon: Heart },
  { value: "brain", name: "Mente", icon: Brain },
  { value: "pencil", name: "Escribir", icon: PencilLine },
  { value: "music", name: "Música", icon: Music },
  { value: "code", name: "Programar", icon: Code },
  { value: "wallet", name: "Ahorrar", icon: Wallet },
  { value: "briefcase", name: "Trabajo", icon: Briefcase },
  { value: "sprout", name: "Plantar", icon: Sprout },
  { value: "sun", name: "Sol", icon: Sun },
  { value: "no-smoke", name: "Sin fumar", icon: Cigarette },
  { value: "pizza", name: "Cocinar", icon: Pizza },
  { value: "wine", name: "Sin alcohol", icon: Wine },
  { value: "alarm", name: "Madrugar", icon: AlarmClock },
  { value: "bath", name: "Higiene", icon: Bath },
  { value: "phone", name: "Sin pantalla", icon: Phone },
];

export const DEFAULT_HABIT_ICON = "footprints";

export function iconFor(value: string | null): HabitIcon {
  return HABIT_ICONS.find((i) => i.value === value)
    ?? HABIT_ICONS.find((i) => i.value === DEFAULT_HABIT_ICON)!;
}
