# UPlate Dashboard — Feedbacks API

Endpoints powering the dashboard's **Feedback** page. The dashboard lists user-submitted feedback and lets admins mark items as handled / unhandled.

All endpoints are namespaced under a school path segment (e.g., `/purdue`). Admin endpoints require an `key` query parameter matching the configured admin key.

---

## Conventions

| Convention        | Value                                                        |
| ----------------- | ------------------------------------------------------------ |
| Content-Type      | `application/json`                                           |
| Admin auth        | `?key=<adminKey>` query string                               |
| ID format         | Server-generated string                                      |
| Timestamp format  | ISO-8601 string (`timestampString`)                          |
| Success responses | `200`                                                        |
| Error responses   | `401` (bad key), `404` (not found), `500` (server error)     |

---

## Feedbacks

### `GET /:school/feedbacks`

List all feedback for the school. Used by the dashboard on page load to populate the Feedback view.

| Query Param | Required | Description           |
| ----------- | -------- | --------------------- |
| `key`       | yes      | Admin key             |

**Example** `GET /purdue/feedbacks?key=boilerfueladmin`

**Response** `200`
```json
[
  {
    "id": "feedback-1",
    "schoolId": "purdue",
    "type": "Bug",
    "message": "The calorie total is wrong when I add two of the same item.",
    "timestampString": "2026-05-24T18:32:10.000Z",
    "email": "student@purdue.edu",
    "handled": false
  }
]
```

### `POST /:school/admin/feedbacks/markHandled/:id`

Mark a single feedback item as handled.

| Query Param | Required | Description |
| ----------- | -------- | ----------- |
| `key`       | yes      | Admin key   |

**Example** `POST /purdue/admin/feedbacks/markHandled/feedback-1?key=boilerfueladmin`

**Body** — empty JSON object
```json
{}
```

**Response** `200` — the full updated feedback object
```json
{
  "id": "feedback-1",
  "schoolId": "purdue",
  "type": "Bug",
  "message": "The calorie total is wrong when I add two of the same item.",
  "timestampString": "2026-05-24T18:32:10.000Z",
  "email": "student@purdue.edu",
  "handled": true
}
```

### `POST /:school/admin/feedbacks/unmarkHandled/:id`

Revert a feedback item back to unhandled.

| Query Param | Required | Description |
| ----------- | -------- | ----------- |
| `key`       | yes      | Admin key   |

**Example** `POST /purdue/admin/feedbacks/unmarkHandled/feedback-1?key=boilerfueladmin`

**Body** — empty JSON object
```json
{}
```

**Response** `200` — the full updated feedback object
```json
{
  "id": "feedback-1",
  "schoolId": "purdue",
  "type": "Bug",
  "message": "The calorie total is wrong when I add two of the same item.",
  "timestampString": "2026-05-24T18:32:10.000Z",
  "email": "student@purdue.edu",
  "handled": false
}
```

---

## Data Models

### Feedback
| Field             | Type         | Required | Notes                                                  |
| ----------------- | ------------ | -------- | ------------------------------------------------------ |
| `id`              | string       | auto     | Server-generated                                       |
| `schoolId`        | string       | yes      | Matches the `:school` path segment                     |
| `type`            | FeedbackType | yes      | See enum below                                         |
| `message`         | string       | yes      | Free-form text from the user                           |
| `timestampString` | string       | yes      | ISO-8601 timestamp of submission                       |
| `email`           | string       | yes      | Reply-to address for the submitter                     |
| `handled`         | boolean      | no       | Defaults to `false`. Toggled by admin endpoints above. |

### FeedbackType (enum)

One of the following string values:

| Value          | Meaning                              |
| -------------- | ------------------------------------ |
| `"Bug"`        | Something is broken                  |
| `"Suggestion"` | Feature or improvement request       |
| `"Question"`   | User is asking for help / info       |
| `"Compliment"` | Positive feedback                    |
| `"Other"`      | Catch-all                            |

---

## Notes for the Backend

- `GET /:school/feedbacks` should return items in any order — the dashboard sorts client-side by `timestampString` (newest first).
- The `markHandled` / `unmarkHandled` responses must include the full updated object; the dashboard replaces its local copy with the response (not just the `handled` flag).
- Feedback creation (the user-facing submission endpoint) is **not** part of this dashboard surface and is intentionally omitted here.
