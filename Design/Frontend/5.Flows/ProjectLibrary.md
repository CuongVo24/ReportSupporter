# FLOW — Project Library and Recovery

1. `/` lists All/Recent/Trash/Recovery and provides local search.
2. Create or select a project → `/workspace/[projectId]`; duplicate creates a new local ID.
3. Trash is reversible and never auto-purged. Permanent delete requires confirmation.
4. Recovery Center exposes corrupt draft, orphan snapshot and autosave failure records with local download/dismiss actions.
5. Backup is user-initiated `.rsproject`; import validates checksum and assigns a new ID on collision.
6. Storage warnings appear at 80%/90%; persistent storage is requested only after a user backup action.
