import { create } from "zustand";
export const useChatStore = create((set) => ({
    rooms: [],
    activeRoomId: null,
    messagesByRoom: {},
    connectedUsersByRoom: {},
    roomCountsByRoomId: {},
    typingByRoom: {},
    quiz: { active: false, hintsUsed: 0, leaderboard: [] },
    setRooms: (rooms) => set({ rooms, activeRoomId: rooms[0]?.id ?? null }),
    addRoom: (room) => set((state) => ({ rooms: [...state.rooms, room] })),
    updateRoom: (room) => set((state) => ({ rooms: state.rooms.map((r) => (r.id === room.id ? room : r)) })),
    removeRoom: (roomId) => set((state) => ({
        rooms: state.rooms.filter((r) => r.id !== roomId),
        activeRoomId: state.activeRoomId === roomId ? (state.rooms[0]?.id ?? null) : state.activeRoomId
    })),
    setActiveRoom: (roomId) => set({ activeRoomId: roomId }),
    setMessages: (roomId, messages) => set((state) => ({ messagesByRoom: { ...state.messagesByRoom, [roomId]: messages } })),
    appendMessage: (message) => set((state) => ({
        messagesByRoom: {
            ...state.messagesByRoom,
            [message.roomId]: [...(state.messagesByRoom[message.roomId] ?? []), message]
        }
    })),
    patchMessage: (message) => set((state) => ({
        messagesByRoom: {
            ...state.messagesByRoom,
            [message.roomId]: (state.messagesByRoom[message.roomId] ?? []).map((item) => item.id === message.id ? message : item)
        }
    })),
    removeMessage: (roomId, messageId) => set((state) => ({
        messagesByRoom: {
            ...state.messagesByRoom,
            [roomId]: (state.messagesByRoom[roomId] ?? []).filter((item) => item.id !== messageId)
        }
    })),
    setConnectedUsers: (roomId, users) => set((state) => ({ connectedUsersByRoom: { ...state.connectedUsersByRoom, [roomId]: users } })),
    setRoomCount: (roomId, count) => set((state) => ({ roomCountsByRoomId: { ...state.roomCountsByRoomId, [roomId]: count } })),
    setTyping: (roomId, usernames) => set((state) => ({ typingByRoom: { ...state.typingByRoom, [roomId]: usernames } })),
    setLeaderboard: (entries) => set((state) => ({ quiz: { ...state.quiz, leaderboard: entries } })),
    setQuizQuestion: (roomId, questionId, question, hint, category, difficulty) => set((state) => ({
        quiz: {
            ...state.quiz,
            active: true,
            quizRoomId: roomId,
            questionId,
            question,
            hint,
            category,
            difficulty,
            hintsUsed: 0,
            lastWinner: undefined,
            timeoutAnswer: undefined,
            closeAnswer: false
        }
    })),
    setQuizHint: (hint, hintsUsed) => set((state) => ({
        quiz: { ...state.quiz, hint, hintsUsed: hintsUsed ?? state.quiz.hintsUsed }
    })),
    setQuizWinner: (winner) => set((state) => ({ quiz: { ...state.quiz, active: false, lastWinner: winner } })),
    setQuizTimeout: (answer) => set((state) => ({ quiz: { ...state.quiz, active: false, timeoutAnswer: answer } })),
    setQuizEnded: () => set((state) => ({ quiz: { ...state.quiz, active: false, quizRoomId: undefined, questionId: undefined, question: undefined, hint: undefined } })),
    setQuizCloseAnswer: (close) => set((state) => ({ quiz: { ...state.quiz, closeAnswer: close } }))
}));
