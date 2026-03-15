
-- Epic 12: Event Tracking table
CREATE TABLE public.user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_name text NOT NULL,
  event_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- RLS: no user access, only service_role
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No user access to user_events"
ON public.user_events
FOR ALL
TO public
USING (false);
