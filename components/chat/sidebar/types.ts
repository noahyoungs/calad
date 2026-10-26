export type TimePeriod =
  | "Today"
  | "Yesterday"
  | "Last 7 Days"
  | "Last 30 Days"
  | "Older";

export interface ChatSidebarProps {
  userId: string;
  initialConversations: any[];
  userEmail?: string;
  toggleSidebar: () => void;
  sidebarOpen: boolean;
}

export interface GroupedConversations {
  [key: string]: any[];
}

// Sort time periods for consistent ordering
export const sortTimePeriods = (a: string, b: string): number => {
  const order: { [key: string]: number } = {
    Today: 1,
    Yesterday: 2,
    "Last 7 Days": 3,
    "Last 30 Days": 4,
    Older: 5,
  };

  return order[a] - order[b];
};

// Helper function to determine time period for a conversation
export const getTimePeriod = (date: string): TimePeriod => {
  const now = new Date();
  const conversationDate = new Date(date);

  // Reset hours to compare just dates
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const lastMonth = new Date(today);
  lastMonth.setDate(lastMonth.getDate() - 30);

  if (conversationDate >= today) {
    return "Today";
  } else if (conversationDate >= yesterday) {
    return "Yesterday";
  } else if (conversationDate >= lastWeek) {
    return "Last 7 Days";
  } else if (conversationDate >= lastMonth) {
    return "Last 30 Days";
  } else {
    return "Older";
  }
};
