export type AdminDashboardData = {
    users: { total: number; active: number; inactive: number; new7Days: number; new30Days: number };
    workspaces: {
        total: number;
        active: number;
        inactive: number;
        recent: { id: string; name: string; createdAt: string }[];
    };
    transactions: { total: number };
    pendingInvitations: number;
    categories: { global: number; custom: number };
    activity: Array<{ date: string; transactions: number; users: number }>;
};
