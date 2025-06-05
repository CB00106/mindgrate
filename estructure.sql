-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.conversation_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role = ANY (ARRAY['user'::text, 'agent'::text])),
  sender_mindop_id uuid,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb,
  CONSTRAINT conversation_messages_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT conversation_messages_sender_mindop_id_fkey FOREIGN KEY (sender_mindop_id) REFERENCES public.mindops(id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mindop_id uuid NOT NULL,
  title text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT conversations_mindop_id_fkey FOREIGN KEY (mindop_id) REFERENCES public.mindops(id)
);
CREATE TABLE public.follow_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  requester_mindop_id uuid NOT NULL,
  target_mindop_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT follow_requests_pkey PRIMARY KEY (id),
  CONSTRAINT follow_requests_requester_mindop_id_fkey FOREIGN KEY (requester_mindop_id) REFERENCES public.mindops(id),
  CONSTRAINT follow_requests_target_mindop_id_fkey FOREIGN KEY (target_mindop_id) REFERENCES public.mindops(id)
);
CREATE TABLE public.mindop_collaboration_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  requester_mindop_id uuid NOT NULL,
  target_mindop_id uuid NOT NULL,
  requester_user_query text NOT NULL,
  status text NOT NULL DEFAULT 'pending_target_processing'::text CHECK (status = ANY (ARRAY['pending_target_processing'::text, 'processing_by_target'::text, 'target_processing_failed'::text, 'target_processing_complete'::text, 'response_received_by_requester'::text])),
  target_mindop_response text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb,
  CONSTRAINT mindop_collaboration_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT mindop_collaboration_tasks_requester_mindop_id_fkey FOREIGN KEY (requester_mindop_id) REFERENCES public.mindops(id),
  CONSTRAINT mindop_collaboration_tasks_target_mindop_id_fkey FOREIGN KEY (target_mindop_id) REFERENCES public.mindops(id)
);
CREATE TABLE public.mindop_document_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mindop_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  embedding USER-DEFINED NOT NULL,
  source_csv_name text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mindop_document_chunks_pkey PRIMARY KEY (id),
  CONSTRAINT mindop_document_chunks_mindop_id_fkey FOREIGN KEY (mindop_id) REFERENCES public.mindops(id),
  CONSTRAINT mindop_document_chunks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.mindops (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  mindop_name text NOT NULL,
  mindop_description text,
  CONSTRAINT mindops_pkey PRIMARY KEY (id),
  CONSTRAINT mindops_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);