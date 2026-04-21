---
title: 'Five Logstash gotchas that wedged me in production'
description: 'PQ on NFS, JDBC interval arithmetic, DLQ subdirs, queue.max_bytes math, trailing semicolons'
pubDate: 'Apr 21 2026'
tags: [logstash, jdbc, postgres, production]
---

Notes to future me after a week of cascading Logstash failures.

## PQ on EFS/NFS will wedge on you

Logstash's persistent queue uses `.lock` files and atomic `rename()` for checkpointing. Both go wrong on network filesystems: stale locks survive ungraceful task exits, and `rename()` can block forever in the kernel on metadata contention.

Thread dump from one wedge:

```
"Converge PipelineAction::Create<my-pipeline>" RUNNABLE, elapsed 1146s
  at sun.nio.fs.UnixNativeDispatcher.rename0   (native)
  at org.logstash.ackedqueue.io.FileCheckpointIO.write
  at org.logstash.execution.AbstractPipelineExt.openQueue
```

19 minutes stuck in a syscall the JVM can't interrupt. Move PQ to task-local storage and recover via `sql_last_value` plus a small overlap window.

## `:sql_last_value` substitutes as a string

Fine for implicit coercion:

```sql
WHERE col > :sql_last_value
```

Breaks on arithmetic:

```sql
WHERE col > :sql_last_value - INTERVAL '60 seconds'
-- ERROR: invalid input syntax for type interval: "2026-04-21 …"
```

Cast it:

```sql
WHERE col > (:sql_last_value)::timestamptz - INTERVAL '60 seconds'
```

Epoch sentinel checks (`:sql_last_value = '1970-01-01 …'`) stay uncasted.

## DLQ input needs per-pipeline subdirs to already exist

The DLQ *writer* creates `<path>/<pipeline_id>/` eagerly at pipeline start. The DLQ *input* doesn't — it calls `Files.newDirectoryStream` in its constructor and throws:

```
Error: DLQ sub-path /usr/share/logstash/data/dead_letter_queue/<pipeline_id> does not exist
Exception: Java::JavaNioFile::NoSuchFileException
```

No tolerance flag on the plugin. On fresh storage, pre-create from an entrypoint:

```bash
grep -B1 "path => '$DLQ_BASE'" "$DLQ_CONF" \
  | grep pipeline_id \
  | sed -E "s/.*pipeline_id => '([^']+)'.*/\1/" \
  | while read pid; do mkdir -p "$DLQ_BASE/$pid"; done
exec "$@"
```

## `queue.max_bytes` is a preflight disk check

Logstash sums it across every persisted-queue pipeline at startup and refuses to start if the total exceeds free disk:

```
Persistent queues require more disk space than is available:
- Total space required: 76gb
- Currently free space:  16gb
```

So `queue.max_bytes: 1900mb × 40 pipelines = 76 GB required`, even if actual usage is kilobytes. On Fargate (default 20 GB) this bites immediately. Size it to real burst capacity, not EFS-era headroom.

## Trailing `;` + `jdbc_paging_enabled` = syntax error

With paging enabled, Logstash wraps your statement:

```sql
SELECT count(*) AS "count" FROM (<your statement>) AS "t1"
```

A trailing `;` in the inner statement breaks that. Easy to miss when the query was developed in `psql` where the semicolon is habit.
