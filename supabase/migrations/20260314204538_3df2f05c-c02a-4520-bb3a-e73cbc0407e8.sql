-- Add lifetime counter column
ALTER TABLE profiles ADD COLUMN free_apps_used integer DEFAULT 0;

-- Trigger function: increment when application exits draft (non-ko)
CREATE OR REPLACE FUNCTION increment_free_apps_used()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE profiles
  SET free_apps_used = free_apps_used + 1
  WHERE user_id = NEW.user_id
    AND (is_pro = false OR is_pro IS NULL);
  RETURN NEW;
END;
$$;

-- Trigger: fires when status changes from 'draft' to something else (not ko)
CREATE TRIGGER trg_increment_free_apps
AFTER UPDATE ON applications
FOR EACH ROW
WHEN (OLD.status = 'draft' AND NEW.status != 'draft' AND NEW.status != 'ko')
EXECUTE FUNCTION increment_free_apps_used();

-- Trigger function: decrement when application marked as ko
CREATE OR REPLACE FUNCTION decrement_free_apps_on_ko()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'ko' AND OLD.status != 'ko' THEN
    UPDATE profiles
    SET free_apps_used = GREATEST(free_apps_used - 1, 0)
    WHERE user_id = NEW.user_id
      AND (is_pro = false OR is_pro IS NULL);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_decrement_on_ko
AFTER UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION decrement_free_apps_on_ko();

-- Grandfathering: set free_apps_used for existing users
UPDATE profiles p
SET free_apps_used = sub.cnt
FROM (
  SELECT user_id, COUNT(*) as cnt
  FROM applications
  WHERE status NOT IN ('ko', 'draft')
  GROUP BY user_id
) sub
WHERE p.user_id = sub.user_id AND (p.is_pro = false OR p.is_pro IS NULL);