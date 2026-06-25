# Contract Structure Rule - ReportSupporter

> Applies to all files under `Design/ContractForAI/`.

## 1. Folder Structure

Each delivery lane should follow this structure:

```text
{Lane}/
  month1/
    W1/
    W2/
    W3/
    W4/
  month2/
    W5/
    W6/
    W7/
    W8/
  month3/
    W9/
    W10/
    W11/
    W12/
  month4/          # Phase 4 — Frontend / UI Investment
    W13/
    W14/
    W15/
  break_task/
    week{N}_break/
    project_structure_break/
```

The initial lane is `Core`.

## 2. File Naming

Use lowercase snake case:

```text
{scope}_{short_description}_contract.md
```

Examples:

- `w1_project_bootstrap_contract.md`
- `w2_markdown_editor_contract.md`
- `w4_export_mvp_contract.md`
- `checker_issue_shape_addendum.md`

## 3. Contract Content

Each contract must include:

1. Micro-task target.
2. Scope.
3. Checklist.
4. Interfaces or files expected to change.
5. Risks and mitigations.
6. Verification plan.
7. Status.

## 4. Agent Protocol

Before creating or editing contracts:

1. Read this rule.
2. Place the contract in the correct month/week folder.
3. Keep task contracts scoped to one implementable unit.
4. Do not move, delete, or rename existing contracts without explicit approval.

## 5. Status Values

- `WAITING_FOR_APPROVAL`
- `READY_TO_IMPLEMENT`
- `IN_PROGRESS`
- `DONE`
- `BLOCKED`

