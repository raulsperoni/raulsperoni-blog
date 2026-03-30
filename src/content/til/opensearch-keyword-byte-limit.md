---
title: 'OpenSearch .keyword sub-fields have a hard 32,766-byte limit'
description: 'If a document exceeds 32,766 bytes in a keyword field, OpenSearch rejects indexing with a non-retriable error'
pubDate: 'Mar 30 2026'
tags: [opensearch, elasticsearch, indexing]
---

I was indexing legal documents in OpenSearch and started getting errors like this:

```
type=illegal_argument_exception, reason=Document contains at least one immense term
in field="content.keyword" (whose UTF8 encoding is longer than the max length 32766)
```

The problem: the mapping had `content` as a `text` field with a `keyword` sub-field added almost by default — easy to miss. Any document whose content exceeds 32,766 bytes fails to index, and since the error is marked `retriable: False`, SQS retries won't help — they just hit the DLQ.

The fix depends on whether you actually need exact matching on that field:

**If you don't need exact matching** (most common for large content fields): remove the `keyword` sub-field entirely.

**If you need it but want to avoid failures**, add `ignore_above`:

```json
"keyword": {
  "type": "keyword",
  "ignore_above": 32766
}
```

**If you're truncating in code**, leave ~66 bytes of buffer — encode to UTF-8, slice at 32,700 bytes, then decode with `errors='ignore'`.

The limit is the same in Elasticsearch.
