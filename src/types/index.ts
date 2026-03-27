export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "MENTOR" | "ADMIN";
  avatar?: string | null;
  bio?: string | null;
  expertise?: string | null;
}

export interface MeetingWithParticipants {
  id: string;
  token: string;
  title: string;
  description?: string | null;
  scheduledAt: Date;
  duration: number;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  mentor: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    expertise?: string | null;
  };
  createdAt: Date;
}
