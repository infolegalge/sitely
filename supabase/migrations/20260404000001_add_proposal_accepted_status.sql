-- Add 'proposal_accepted' to the projects status CHECK constraint
-- This status represents: client accepted proposal, awaiting payment confirmation

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN (
    'lead_new',
    'lead_negotiating',
    'proposal_sent',
    'proposal_accepted',
    'active_collecting',
    'active_designing',
    'active_developing',
    'active_review',
    'completed',
    'cancelled',
    'lost'
  ));
