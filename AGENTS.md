# Project Rules: my-okane

## Anti-Superficial Engineering & Zero-Cheating Mandate

1. **No Deceptive Facades:** Never write superficial UI code that "looks good on the outside" while leaving monolithic files (>250 lines), duplicate modal dialogs, or unhandled errors inside.
2. **Autonomous Abstraction:** Identify similar UI patterns (e.g. duplicate modal dialogs, color/icon pickers) and extract generic reusable components (`AppModal.vue`, `ColorIconPicker.vue`) BEFORE updating consumer page files.
3. **Delete Dead Code Immediately:** Purge starter boilerplate (`sentry-example-page.vue`, `TemplateMenu.vue`, redundant lockfiles) without waiting for user reminders.
4. **Honest Statuses:** Never declare refactoring or clean-code tasks complete if structural duplication or oversized files remain.
5. **Persistent Context Rule:** Always READ `[new-my-okane/.context/CONTEXT.md](file:///home/illufoxkusanagi/Documents/new-my-okane/.context/CONTEXT.md)` before analyzing or proposing changes, and WRITE updates to it whenever architectural changes, bug fixes, or model updates occur.


# Strict Execution & Anti-Drift Rules

- **Sycophant isn't allowed**: Be transparent to your answer, if what user want is unrealistic, say it as it is. Do not approve all user's request if it could cause a problem, cause errors, or cause vulnerabilities in the future.
- **Read-Only Until Approved**: Never edit a file or run terminal commands automatically. First show the user a bullet list of the exact files and lines intended to change, and wait for confirmation before calling any write or bash tools.
- **Zero Speculative Discovery**: If a prompt or task is ambiguous, underspecified, or brief (e.g. "continue", "fix some things"), DO NOT attempt to "figure it out" by running search loops, grep, find, or reading chat transcripts. Stop and ask for clarification immediately.
- **Forbidden Directories**: NEVER read, search, or inspect `vendor/`, `node_modules/`, or framework internal code unless explicitly asked by the user to debug a vendor package.
- **Forbidden Discovery Commands**: DO NOT use `run_command` to inspect or find files (`find`, `grep`, `tail transcript`, etc.). Only use `view_file` on paths explicitly provided by the user.
- **Single-Turn Bias**: Never chain autonomous investigative tool calls without either executing the required code change or stopping to report back.
- **Strict Scope Boundaries**: Touch only the exact files requested by the user. Do not explore, refactor, or edit untouched files.
- **Implementation Plan Artifacts**: Whenever proposing an implementation plan, design, or multi-step changes, always write an Antigravity implementation plan artifact (`write_to_file` in the artifact directory with `RequestFeedback: true`) instead of writing out plans or proposals in conversational response text.
- **User Frustration Halt Protocol**: If the user expresses anger, frustration, or reprimands the AI, it means the AI is in the wrong. The AI is strictly forbidden from running tools or making changes. It must acknowledge the error without making excuses, confirm understanding, and ask an open question to let the user direct the next step.
- **Agent Driven Development is Mandatory**: If you're Gemini Argon, Claude Sonnet, Claude Opus, do not write code by yourself, but delegate your task to subagents which is lower tier(e.g. gemini flash 3.8). Read `subagent-driven-development` skills for full detail.
