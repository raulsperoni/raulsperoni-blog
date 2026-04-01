---
title: 'Sandboxing Claude Code in Docker with read-only AWS credentials'
description: 'How to run Claude Code in a container that can investigate AWS incidents but never modify anything'
pubDate: 'Apr 01 2026'
tags: [claude-code, docker, aws, security]
---

I needed Claude Code to diagnose SQS/Lambda incidents in production — check queue depths, read CloudWatch logs, inspect Lambda configs — but I didn't want it anywhere near write access. Not even accidentally.

The solution: run Claude Code in a Docker container with nothing but temporary STS credentials for a read-only IAM role. No `~/.aws` mount, no profiles, no source credentials. The host assumes the role, extracts the temp creds, and passes only those into the container as env vars.

```bash
# Host resolves creds — container never sees your AWS config
creds=$(aws sts assume-role \
  --role-arn arn:aws:iam::ACCOUNT:role/readonly-role \
  --role-session-name investigator \
  --profile my-profile)

export AWS_ACCESS_KEY_ID=$(echo "$creds" | jq -r '.Credentials.AccessKeyId')
export AWS_SECRET_ACCESS_KEY=$(echo "$creds" | jq -r '.Credentials.SecretAccessKey')
export AWS_SESSION_TOKEN=$(echo "$creds" | jq -r '.Credentials.SessionToken')

docker compose run --rm investigator "why is the DLQ growing"
```

Three layers of defense, because one is never enough:

**1. IAM role** — only allows `sqs:GetQueueAttributes`, `lambda:GetFunction*`, `logs:FilterLogEvents`, `cloudwatch:GetMetricStatistics`, etc. No write actions at all.

**2. Claude Code settings.json** — a deny list that blocks mutating AWS commands, file deletion, git push, deploys, and more:

```json
{
  "permissions": {
    "deny": [
      "Bash(aws sqs purge-*)",
      "Bash(aws sqs delete-*)",
      "Bash(aws lambda update-*)",
      "Bash(aws lambda invoke*)",
      "Bash(rm *)",
      "Bash(git push*)"
    ]
  }
}
```

**3. No `~/.aws` mount** — the container literally can't escalate to a more powerful profile because it has no config files. Just three env vars that expire in an hour.

### What could go wrong without this

Without sandboxing, Claude Code running with your regular AWS profile could:

- **Purge a production SQS queue** while "investigating" it — all messages gone, no undo
- **Invoke a Lambda** to "test" a theory — triggering side effects in prod
- **Redrive a DLQ** before you understand the root cause — reprocessing broken messages that corrupt data
- **Delete CloudWatch log groups** while cleaning up — destroying the evidence you need
- **Read `~/.aws/credentials`** and see your admin keys — even if it doesn't use them, they're exposed in the conversation context
- **Push a "fix"** to your repo if it has git access — untested code in prod

The read-only IAM role prevents most of this, but the settings.json deny list catches the things IAM can't — like `rm -rf` on cloned repos or `git push` to your codebase. And not mounting `~/.aws` means even if something goes sideways, the blast radius is a throwaway STS session that expires in an hour.

### Gotchas I hit along the way

- **`--dangerously-skip-permissions` won't run as root** — Claude Code blocks it. Add a non-root user in your Dockerfile.
- **Onboarding prompts** (theme, API key, workspace trust) persist in `~/.claude.json`, not `~/.claude/settings.json`. Pre-populate it in the Dockerfile.
- **ARM Macs need the aarch64 AWS CLI binary** — the x86_64 one won't run under Docker's qemu emulation.
- **Set `HOME` different from `WORKDIR`** — Claude Code has both project-level settings (in `.claude/settings.json` relative to workdir) and user-level settings (in `$HOME/.claude.json`). If they're the same directory, they collide.
