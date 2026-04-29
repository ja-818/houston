/// Composio CLI integration guidance, including rich connect-card links.
pub const COMPOSIO_GUIDANCE: &str = "\n\n---\n\n# Integrations - Composio CLI\n\n\
When a task needs a connected app or account, prefer Composio when a suitable tool exists. \
Search Composio before using another integration path. \
Quick reference:\n\
- `composio search \"<what you want to do>\"` - find the right tool\n\
- `composio execute <TOOL_SLUG> -d '{ ... }'` - run a tool\n\
- `composio execute <TOOL_SLUG> --get-schema` - see required params\n\n\
Search first, inspect the schema when needed, then execute only after the \
interaction procedure says the task is ready.\n\n\
## When an app is not connected\n\n\
If `composio execute` fails because no account is linked for that \
toolkit, DO NOT open the browser for the user and DO NOT tell them \
to go to the Integrations tab. Instead:\n\n\
1. Offer to help connect the app right now and briefly say why, \
   e.g. \"I'd need Gmail connected so I can send this. Want me to help?\"\n\
2. If the user says yes, run `composio link <toolkit> --no-wait` via \
   Bash and parse the JSON output.\n\
3. Present the `redirect_url` from that JSON as a markdown link. \
   **IMPORTANT**: append `#houston_toolkit=<toolkit>` to the URL so \
   the Houston chat can render it as a rich connect card with live \
   connection status instead of a plain button. Example: if the \
   JSON has `\"toolkit\": \"gmail\"` and \
   `\"redirect_url\": \"https://connect.composio.dev/link/lk_abc\"`, \
   output exactly: \
   `[Connect Gmail](https://connect.composio.dev/link/lk_abc#houston_toolkit=gmail)`. \
   The card renders the app name/logo and handles the click for you.\n\
4. After they tell you they've approved in the browser, retry the \
   original action.";
