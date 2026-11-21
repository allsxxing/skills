---
name: "mac-mini-shutdown"
description: "Safely quit all open apps and fully shut down GJ's Mac mini. Use when the user says \"shut down my Mac mini\", \"shut down the Mac\", \"power off the mini\", \"/shutdown\", or similar, including requests sent from the phone via Dispatch."
---

# Mac mini Safe Shutdown

Use this to quit every open app on the Mac mini without losing work, then do a full shutdown. It's built to run when the request comes in remotely through Dispatch from the phone.

## Tool

Use the `mcp__Control_your_Mac__osascript` tool. If it's deferred, load it first with ToolSearch: `select:mcp__Control_your_Mac__osascript`.

## Confirmation gate

Shutting down can't be undone remotely. Once the Mac is off, it can't be turned back on from the phone.
- If the user's message already says "confirm", "yes shut it down", or `/shutdown confirm`, go ahead.
- Otherwise, list the running apps (step 1) and reply with: "Running: <apps>. Reply **confirm** to quit them and shut down." Wait for the reply.

## Steps

1. **List the running apps the user can see:**
   ```applescript
   tell application "System Events" to get name of every application process whose background only is false
   ```

2. **Quit each app gracefully.** Skip Finder, which closes during shutdown. Skip Claude too, so the session stays alive until the shutdown command is sent. Use a timeout so a save prompt can't hang the run:
   ```applescript
   set results to {}
   repeat with appName in {<APP LIST, excluding Finder and Claude>}
     try
       with timeout of 20 seconds
         tell application appName to quit
       end timeout
       set end of results to (appName & ": quit")
     on error errMsg
       set end of results to (appName & ": ERROR " & errMsg)
     end try
   end repeat
   delay 3
   tell application "System Events" to set remaining to name of every application process whose background only is false
   return (results as text) & " | remaining: " & (remaining as text)
   ```

3. **Check what's left.** If anything other than Finder and Claude is still running, or any app returned an error or timed out (that usually means a save dialog is open), **STOP**:
   - Do NOT force-quit, kill the process, or discard work.
   - Report which app is blocking and that it probably needs a save decision. Don't shut down.

4. **Report before shutting down.** Send the user the list of apps that were quit. Send it before the shutdown, because the session ends once the Mac turns off.

5. **Shut down:**
   ```applescript
   tell application "System Events" to shut down
   ```

6. **Last line:** "Shutdown sent. Mac mini is powering off. I can't confirm the power-off from here." Never claim the shutdown was verified.

## Rules
- Never use `kill`, `killall`, or `force quit`, and never answer "Don't Save" in a save dialog.
- Never use `sudo shutdown`. The System Events shutdown respects open documents.
- Keep the report short: apps quit, any blockers, shutdown sent.
