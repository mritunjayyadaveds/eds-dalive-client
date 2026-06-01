# Approval Workflow Setup Guide

## Overview

This workflow adds a publish approval process to your DA.live EDS project:
- **Authors (User A)** can edit content but cannot publish directly. They use "Request Publish" in the sidekick.
- **Approvers (User B)** receive requests via the "Approvals" dashboard in sidekick and can approve/reject + publish.

## How It Works

1. Author edits a page in DA.live
2. Author clicks "Request Publish" in the sidekick (standard Publish button is hidden)
3. A row is added to the `/approval-requests` sheet with status "pending"
4. Approver opens the "Approvals" button in their sidekick
5. Approver sees pending requests with page path, author, comment, and date
6. Approver clicks "Approve & Publish" → page is published to preview + live
7. Or approver clicks "Reject" → request is marked as rejected

## DA.live Permission Setup

### Step 1: Configure Org Permissions

In DA.live (https://da.live), go to your org settings:

1. Navigate to your org: `mritunjayyadaveds`
2. Go to **Settings** → **Permissions**

### Step 2: Set Up Author Role

For users who should be **Authors** (can edit, cannot publish):
- Grant them **"edit"** permission on the repository
- They will see the "Request Publish" button instead of the standard Publish

### Step 3: Set Up Approver Role

For users who should be **Approvers** (can approve and publish):
- Grant them **"admin"** or **"write"** permission on the repository
- They will see the "Approvals" dashboard with a badge showing pending count

## File Structure

```
tools/sidekick/
├── config.json                    # Sidekick config with plugin registration
├── plugins/
│   ├── workflow-config.json       # Workflow settings and role definitions
│   ├── workflow-utils.js          # Shared API utilities
│   ├── request-publish.js         # Author's "Request Publish" plugin
│   └── approval-dashboard.js     # Approver's dashboard plugin
```

## Approval Sheet

The workflow uses `/approval-requests` as a DA.live spreadsheet to track requests.
Columns: `path`, `author`, `status`, `requestedAt`, `comment`, `approvedBy`, `approvedAt`

## Customization

### Change who can approve
Edit `workflow-utils.js` → `getUserRole()` function to modify role detection logic.

### Add email notifications
Extend `submitPublishRequest()` in `workflow-utils.js` to call a webhook/API that sends emails.

### Change the approval sheet location
Update `APPROVAL_SHEET_PATH` in `workflow-utils.js` and `approvalSheet` in `workflow-config.json`.
