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

export interface CollaborationTask {
  id: string;
  requester_mindop_id: string;
  target_mindop_id: string;
  requester_user_query: string;
  status: 'pending_target_processing' | 'processing_by_target' | 'target_processing_failed' | 'target_processing_complete' | 'response_received_by_requester';
  target_mindop_response?: string | null;
  created_at: string;
  updated_at: string;
  metadata?: any;
  // Relaciones opcionales para mostrar información adicional
  requester_mindop?: {
    id: string;
    mindop_name: string;
    user_id: string;
  };
  target_mindop?: {
    id: string;
    mindop_name: string;
    user_id: string;
  };
}

export interface CreateCollaborationTaskData {
  requester_mindop_id: string;
  target_mindop_id: string;
  query: string;
}

export interface CollaborationTasksContextType {
  tasks: CollaborationTask[];
  loading: boolean;
  error: string | null;
  createTask: (data: CreateCollaborationTaskData) => Promise<CollaborationTask>;
  getTasksByRequester: (mindopId: string) => Promise<CollaborationTask[]>;
  getTasksByTarget: (mindopId: string) => Promise<CollaborationTask[]>;
  processTask: (taskId: string) => Promise<void>;
  refetch: () => Promise<void>;
}
