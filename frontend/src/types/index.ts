export type Role = "admin" | "moderator" | "user";

export type User = {
  id: string;
  username: string;
  email?: string;
  role: Role;
  color?: string | null;
  avatar?: string | null;
  pendingAvatar?: string | null;
  termsAcceptedAt?: string | null;
  emailVerifiedAt?: string | null;
  isSuspended?: boolean;
  isGuest?: boolean;
};

export type Room = {
  id: string;
  name: string;
  type: "public" | "private" | "restricted";
  rules?: string | null;
  ageLimit?: number | null;
  maxOccupants?: number | null;
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
    role?: string | null;
    color?: string | null;
    avatar?: string | null;
  };
  reactions: Array<{ id: string; emoji: string; userId: string }>;
};

export type ConnectedUser = {
  id: string;
  username: string;
  role: Role;
  isRoomMod?: boolean;
};

export type DmContact = {
  id: string;
  username: string;
  color?: string | null;
};

export type DmMessage = {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; username: string; color?: string | null };
  recipientId?: string;
};

export type SuggestionType   = "new_question" | "correction";
export type SuggestionStatus = "pending" | "accepted" | "rejected";

export type QuizSuggestion = {
  id:           string;
  type:         SuggestionType;
  submitterId:  string;
  questionId:   string | null;
  question:     string;
  answer:       string;
  category:     string;
  difficulty:   string;
  status:       SuggestionStatus;
  adminComment: string | null;
  createdAt:    string;
  submitter:    { id: string; username: string };
  reviewer:     { id: string; username: string } | null;
  originalQ:    { id: string; question: string; answer: string; category: string; difficulty: string } | null;
};

export type ContactStatus = "pending" | "accepted" | "rejected";

export type ContactRequest = {
  id: string;
  senderId: string;
  receiverId: string;
  status: ContactStatus;
  createdAt: string;
  sender: { id: string; username: string; color?: string | null };
};

export type BlockedUser = {
  id: string;
  blockedId: string;
  blocked: { id: string; username: string };
};

export type Report = {
  id: string;
  reporterId: string;
  reportedId: string;
  messageContent?: string | null;
  messageAt?: string | null;
  context: "chat" | "dm" | "user";
  reason?: string | null;
  createdAt: string;
  resolved: boolean;
  reporter: { id: string; username: string };
  reported: { id: string; username: string };
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

export type RoomModeratorInfo = {
  id: string;
  roomId: string;
  userId: string;
  user: { id: string; username: string; avatar?: string | null };
};

export type PendingAvatar = {
  id: string;
  username: string;
  avatar?: string | null;
  pendingAvatar: string;
};
