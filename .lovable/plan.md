
The build error says: `Could not find a matching package for 'npm:stripe@17.7.0'` in `cancel-subscription/index.ts:1`. This blocks ALL edge functions from deploying — including `parse-cv` and `ai-tailor` used during CV upload/paste. That's why production fails.

Let me check the actual import.
