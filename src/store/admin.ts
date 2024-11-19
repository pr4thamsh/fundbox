import { Admin } from "@/db/schema/admins";
import { atom } from "jotai";

export const adminAtom = atom<Admin | null>(null);
export const isLoadingAtom = atom(false);
