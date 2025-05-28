export interface Mindop {
  id: string;
  user_id: string;
  created_at: string;
  mindop_name: string;
  mindop_description?: string | null;
}

export interface CreateMindopData {
  mindop_name: string;
  mindop_description?: string;
}

export interface UpdateMindopData {
  mindop_name?: string;
  mindop_description?: string;
}

export interface MindopsContextType {
  mindops: Mindop[];
  loading: boolean;
  error: string | null;
  addMindop: (data: CreateMindopData) => Promise<Mindop>;
  updateMindop: (id: string, data: UpdateMindopData) => Promise<Mindop>;
  deleteMindop: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export interface FollowRequest {
  id: string;
  requester_mindop_id: string;
  target_mindop_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CreateFollowRequestData {
  requester_mindop_id: string;
  target_mindop_id: string;
}
