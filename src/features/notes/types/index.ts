export type NoteCategory = 'GENERAL' | 'BUDGET' | 'INVESTMENT' | 'TAX' | 'EXPENSE';
export type NotePriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Note {
    id: string;
    workspaceId: string;
    userId: string;
    title: string;
    content: string;
    category: NoteCategory;
    priority: NotePriority;
    amount: number | null;
    isCompleted: boolean;
    isPinned: boolean;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        name: string | null;
        email: string;
    };
}

export interface CreateNoteInput {
    title: string;
    content: string;
    category?: NoteCategory;
    priority?: NotePriority;
    amount?: number | null;
    isPinned?: boolean;
}

export interface UpdateNoteInput {
    id: string;
    title?: string;
    content?: string;
    category?: NoteCategory;
    priority?: NotePriority;
    amount?: number | null;
    isCompleted?: boolean;
    isPinned?: boolean;
    deletedAt?: string | null;
}

export interface NotesListResponse {
    notes: Note[];
    summary: {
        total: number;
        completed: number;
        pending: number;
        archived: number;
        totalAmount: number;
    };
}

export interface NoteResponse {
    note: Note;
}

export type NoteStatusFilter = 'ALL' | 'PENDING' | 'COMPLETED' | 'ARCHIVED';
export type NoteCategoryFilter = 'ALL' | NoteCategory;
export type NoteSortBy = 'createdAt' | 'updatedAt' | 'title' | 'priority' | 'amount';
export type NoteSortDir = 'asc' | 'desc';

export interface NoteFilters {
    search?: string;
    status?: NoteStatusFilter;
    category?: NoteCategoryFilter;
    sortBy?: NoteSortBy;
    sortDir?: NoteSortDir;
}
