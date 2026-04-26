# =============================================================================
# PI SESSION BUILD LOGS - NEW TASKS QUEUE
# =============================================================================
# FILE: new_tasks.md
# LOCATION: /home/zerwiz/piwithstuff/.pi/build_logs/
# PURPOSE: Reviewer task queue where builder dispatches verification requests
# AUTOMATION: Builder writes task entries here for reviewer processing
# REVIEWER: Review agent picks up tasks from this queue for verification
# FORMAT: Each line contains timestamp, task ID, request reference, action
# =============================================================================

# Example format:
# [2026-04-17 08:30:00] TASK-0001 | review_requests.md:REQUEST-0001 | verify | description
# [2026-04-17 08:30:05] TASK-0002 | review_requests.md:REQUEST-0002 | verify | description
