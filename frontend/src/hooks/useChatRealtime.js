import { useEffect } from "react";
import { disconnectSocket, getSocket } from "../sockets/chat.socket";
import { useAuthStore } from "../store/auth.store";
import { useChatStore } from "../store/chat.store";
import { useDmStore } from "../store/dm.store";
import { useNotificationStore } from "../store/notification.store";
export function useChatRealtime() {
    const activeRoomId = useChatStore((s) => s.activeRoomId);
    const setMessages = useChatStore((s) => s.setMessages);
    const appendMessage = useChatStore((s) => s.appendMessage);
    const patchMessage = useChatStore((s) => s.patchMessage);
    const removeMessage = useChatStore((s) => s.removeMessage);
    const setTyping = useChatStore((s) => s.setTyping);
    const setQuizQuestion = useChatStore((s) => s.setQuizQuestion);
    const setQuizHint = useChatStore((s) => s.setQuizHint);
    const setQuizWinner = useChatStore((s) => s.setQuizWinner);
    const setQuizTimeout = useChatStore((s) => s.setQuizTimeout);
    const setQuizEnded = useChatStore((s) => s.setQuizEnded);
    const setLeaderboard = useChatStore((s) => s.setLeaderboard);
    const setQuizCloseAnswer = useChatStore((s) => s.setQuizCloseAnswer);
    const setConnectedUsers = useChatStore((s) => s.setConnectedUsers);
    const setRoomCount = useChatStore((s) => s.setRoomCount);
    useEffect(() => {
        const socket = getSocket();
        if (!socket)
            return;
        socket.on("message:new", appendMessage);
        socket.on("message:updated", patchMessage);
        socket.on("message:deleted", ({ messageId }) => {
            if (!activeRoomId)
                return;
            removeMessage(activeRoomId, messageId);
        });
        socket.on("typing:update", ({ roomId, username, typing }) => {
            const store = useChatStore.getState();
            const current = store.typingByRoom[roomId] ?? [];
            const updated = typing
                ? Array.from(new Set([...current, username]))
                : current.filter((u) => u !== username);
            setTyping(roomId, updated);
        });
        socket.on("quiz:question", ({ roomId, question, hint, category, difficulty }) => {
            setQuizQuestion(roomId, question, hint, category, difficulty);
        });
        socket.on("quiz:hint", ({ hint, hintsUsed }) => {
            setQuizHint(hint, hintsUsed);
        });
        socket.on("quiz:winner", (data) => {
            setQuizWinner(data);
        });
        socket.on("quiz:timeout", ({ answer }) => {
            setQuizTimeout(answer);
        });
        socket.on("quiz:ended", () => setQuizEnded());
        socket.on("quiz:close-answer", () => {
            setQuizCloseAnswer(true);
            setTimeout(() => setQuizCloseAnswer(false), 2000);
        });
        socket.on("quiz:leaderboard", setLeaderboard);
        socket.on("room:users-updated", ({ roomId, users }) => {
            setConnectedUsers(roomId, users);
        });
        socket.on("room:count-updated", ({ roomId, count }) => {
            setRoomCount(roomId, count);
        });
        // Modération : actions subies par l'utilisateur courant
        socket.on("mod:banned", ({ reason }) => {
            useNotificationStore.getState().addToast("error", `Vous avez été banni : ${reason}`);
            useAuthStore.getState().logout().catch(() => undefined);
            disconnectSocket();
        });
        socket.on("mod:kicked", ({ roomId }) => {
            useChatStore.getState().setActiveRoom(useChatStore.getState().rooms[0]?.id ?? roomId);
            useNotificationStore.getState().addToast("warning", "Vous avez été expulsé du salon");
        });
        socket.on("mod:muted", ({ minutes }) => {
            useNotificationStore.getState().addToast("warning", `Vous êtes muet pendant ${minutes} minute(s).`);
        });
        // Promotion automatique de rôle
        socket.on("mod:promoted", ({ accessToken, refreshToken }) => {
            useAuthStore.getState().updateUserAndTokens(accessToken, refreshToken);
            useNotificationStore.getState().addToast("success", "Félicitations ! Vous avez été promu modérateur.");
        });
        // Messages privés entrants
        socket.on("dm:received", (msg) => {
            const currentUserId = useAuthStore.getState().user?.id;
            const otherUserId = msg.sender.id === currentUserId
                ? (msg.recipientId ?? "")
                : msg.sender.id;
            if (!otherUserId)
                return;
            const dm = useDmStore.getState();
            dm.appendDmMessage(otherUserId, msg);
            // Ajouter l'expéditeur aux contacts si inconnu
            if (msg.sender.id !== currentUserId) {
                dm.addContact({ id: msg.sender.id, username: msg.sender.username, color: msg.sender.color });
            }
            // Incrémenter non-lus sauf si la conversation est active en mode DM
            const isViewing = dm.dmMode && dm.activeDmUserId === otherUserId;
            if (!isViewing) {
                dm.incrementUnread(otherUserId);
                useNotificationStore.getState().addToast("info", `💬 ${msg.sender.username} : ${msg.content.slice(0, 60)}`);
            }
        });
        return () => {
            socket.off("message:new", appendMessage);
            socket.off("message:updated", patchMessage);
            socket.off("message:deleted");
            socket.off("typing:update");
            socket.off("quiz:question");
            socket.off("quiz:hint");
            socket.off("quiz:winner");
            socket.off("quiz:timeout");
            socket.off("quiz:ended");
            socket.off("quiz:close-answer");
            socket.off("quiz:leaderboard");
            socket.off("room:users-updated");
            socket.off("room:count-updated");
            socket.off("mod:banned");
            socket.off("mod:kicked");
            socket.off("mod:muted");
            socket.off("mod:promoted");
            socket.off("dm:received");
        };
    }, [activeRoomId, appendMessage, patchMessage, removeMessage, setConnectedUsers, setLeaderboard, setQuizCloseAnswer, setQuizEnded, setQuizHint, setQuizQuestion, setQuizTimeout, setQuizWinner, setRoomCount, setTyping]);
    useEffect(() => {
        if (!activeRoomId)
            return;
        const socket = getSocket();
        if (!socket)
            return;
        socket.emit("room:join", { roomId: activeRoomId }, (response) => {
            if (response.ok) {
                // Only reset if no live messages cached for this room yet in this session
                const existing = useChatStore.getState().messagesByRoom[activeRoomId];
                if (!existing)
                    setMessages(activeRoomId, []);
            }
        });
        return () => {
            socket.emit("room:leave", { roomId: activeRoomId });
        };
    }, [activeRoomId, setMessages]);
}
