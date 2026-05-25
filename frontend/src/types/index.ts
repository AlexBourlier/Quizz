export type Role = "admin" | "moderator" | "user";

export type User = {
  id: string;
  username: string;
  email: string;
  role: Role;
  avatar?: string | null;
};

export type Room = {
  id: string;
  name: string;
  type: "public" | "private" | "restricted";
};

export type Message = {
  id: string;
  content: string;
  roomId: string;
  userId: string;
  createdAt: string;
  editedAt?: string | null;
  user: {
    id: string;
    username: string;
    avatar?: string | null;
  };
  reactions: Array<{ id: string; emoji: string; userId: string }>;
};

export type LeaderboardEntry = {
  id: string;
  score: number;
  wins: number;
  user: {
    id: string;
    username: string;
    avatar?: string | null;
  };
};
