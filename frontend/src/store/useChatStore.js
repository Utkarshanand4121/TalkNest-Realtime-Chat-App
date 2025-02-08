import toast from "react-hot-toast";
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore.js";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");

      console.log("Full API response:", res.data);

      // Extract only the array from `res.data.data`
      set({ users: res.data.data || [] });
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(error.response?.data?.message || "Failed to load users");
      set({ users: [] });
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);

      console.log("API Response:", res?.data);

      if (!Array.isArray(res?.data?.data)) {
        console.error("Error: Expected an array but got", res?.data?.data);
        set({ messages: [] });
        return;
      }

      // Ensure all messages have a senderId
      const messages = res.data.data.map((msg) => ({
        ...msg,
        senderId: msg.senderId || "UNKNOWN", // Defaulting to avoid undefined
      }));

      set({ messages });
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error(error.response?.data?.message || "Failed to load messages");
      set({ messages: [] });
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();

    // Ensure messages is an array
    if (!Array.isArray(messages)) {
      console.error("Error: messages is not an array, resetting it.");
      set({ messages: [] });
    }

    if (!selectedUser?._id) {
      console.error("Error: No selected user.");
      toast.error("No user selected.");
      return;
    }

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      if (!res?.data?.data) {
        console.error("Error: No message data received.");
        toast.error("Failed to send message.");
        return;
      }

      console.log("API Response:", res?.data?.data); // Debugging log

      set((state) => ({
        messages: [...(state.messages || []), res.data.data], // Ensure array
      }));
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error.response?.data?.message || "Failed to send message.");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;
      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
