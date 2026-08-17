export type UserRole = 'advisor' | 'student';

export type Profile = { id: string; email: string; name: string; role: UserRole };
export type Cohort = { id: string; name: string; course: string; term: string; weeklyLimit: number; joinCode?: string };
export type FocusTcc = { id: number; studentId: string; currentStage: string; progress: number; theme: string; area: string };
export type Delivery = { id: number; kind: string; version: number; status: string; dueAt?: string | null; fileName?: string | null };
export type Appointment = { id: number; studentId: string; studentEmail?: string; startsAt: string; status: string };
export type Message = { id: number; authorName?: string; authorRole?: string; body: string; createdAt: string; readAt?: string | null };

export type MeutccPayload = {
  needsJoin: boolean;
  email?: string;
  profile?: Profile;
  cohort?: Cohort;
  focusTcc?: FocusTcc | null;
  deliveries?: Delivery[];
  appointments?: Appointment[];
  messages?: Message[];
  references?: Array<{ id: number; type: string; title: string; note?: string }>;
  students?: Array<{ id: number; name?: string; progress: number; currentStage: string }>;
};
