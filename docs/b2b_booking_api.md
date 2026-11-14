# B2B (Corporate to Vendor) Multi-Service Booking Flow API Documentation

This document outlines the API endpoints involved in the end-to-end booking flow between a Corporate user and a Vendor.

## 1. Corporate Searches for Vendors (Inventory Aware)

**Endpoint:** `GET /api/v1/corporate/vendors`

**Description:** 
Fetches a list of verified vendors. If `lines`, `startDate`, and `endDate` are provided, it filters the vendors and ONLY returns those who have enough **available (unassigned)** crew members to fulfill the exact requested quantities for the given dates.

**Query Parameters:**
- `lines` (optional): JSON stringified array of `{ categoryId, quantity }`.
- `startDate` (optional): ISO date string.
- `endDate` (optional): ISO date string.
- `lat` (optional): Latitude of the project site.
- `lng` (optional): Longitude of the project site.

*Note: If `lat` and `lng` are provided, the API will filter vendors based on the Admin-configured `b2bBroadcastRadius` (default: 50km).*

**Example Request:**
```http
GET /api/v1/corporate/vendors?lines=[{"categoryId":"60d5ecb8b392d7001533abc1","quantity":5}]&startDate=2026-08-01&endDate=2026-08-10
```

---

## 2. Corporate Creates Workforce Request

**Endpoint:** `POST /api/v1/workforce/request`

**Description:** 
Corporate creates a new workforce request. 
- If `preferredVendorId` is provided (Direct Request), the backend will strictly validate that the selected vendor has enough available inventory for the requested dates.
- **Bypass Admin Review:** Direct requests automatically bypass the `PENDING_REVIEW` stage, their status is set to `BROADCASTED`, and they instantly emit a `B2B_DIRECT_REQUEST` socket event to the vendor.

**Payload:**
```json
{
  "projectId": "60d5...123",
  "siteId": "60d5...456",
  "startDate": "2026-08-01",
  "endDate": "2026-08-10",
  "lines": [
    {
      "categoryId": "60d5ecb8b392d7001533abc1",
      "quantity": 5
    }
  ],
  "preferredVendorId": "60d5...789" // Optional
}
```

---

## 3. Vendor Accepts Job

**Endpoint:** `POST /api/v1/vendor/jobs/:requestId/accept`

**Description:** 
A vendor accepts a broadcasted or direct WorkforceRequest. The system validates inventory one last time. If successful, it automatically generates an `Allocation` document linking the Vendor to the Request.

**Response:**
```json
{
  "success": true,
  "data": {
    "allocation": {
      "_id": "60d5...abc",
      "requestId": "60d5...def",
      "vendorId": "60d5...789",
      "vendorAcceptedAt": "2026-07-27T10:00:00Z"
    }
  }
}
```

---

## 4. Vendor Assigns Crew

**Endpoint:** `POST /api/v1/vendor/jobs/:allocationId/assign-crew`

**Description:** 
The vendor assigns specific workers from their crew to fulfill the job. The backend validates that the assigned workers are not already busy on another project during the requested dates.

**Payload:**
```json
{
  "assignments": [
    {
      "labourId": "60d5...labour1",
      "categoryId": "60d5...category1"
    },
    {
      "labourId": "60d5...labour2",
      "categoryId": "60d5...category1"
    }
  ]
}
```

---

## 5. Vendor Replaces Crew Member

**Endpoint:** `POST /api/v1/vendor/jobs/:allocationId/replace-crew`

**Description:** 
If a worker doesn't show up or needs to be swapped out, the vendor can replace them. The backend cancels the old assignment and creates a new one, verifying that the new worker is available.

**Payload:**
```json
{
  "oldLabourId": "60d5...labour1",
  "newLabourId": "60d5...labour_new"
}
```

---

## 6. Corporate Views Their Requests

**Endpoint:** `GET /api/v1/workforce/my-requests`

**Description:** 
Corporate can fetch all their workforce requests, along with their current status (`PENDING_REVIEW`, `BROADCASTED`, `ACCEPTED`, etc.).

---

## 7. Vendor Views Direct Requests

**Endpoint:** `GET /api/v1/vendor/direct-requests`

**Description:** 
Fetches requests specifically targeted to this vendor (`preferredVendorId` == `vendor._id`) that are still in a pending or broadcasted state.

---

## 8. Vendor Views Active Jobs (Allocations)

**Endpoint:** `GET /api/v1/vendor/jobs`

**Description:** 
Fetches all jobs (Allocations) that the vendor has accepted.

---

## 9. Vendor Views Job Details

**Endpoint:** `GET /api/v1/vendor/jobs/:id`

**Description:** 
Fetches details of a specific accepted job, including the corporate client's details, project site, and the requested skill lines.

---

## 10. Execution (Attendance)

**Reference:** See `attendance_flow.md`

**Description:**
Once the crew is assigned, they report to the site. The Site Manager (Corporate) marks their daily attendance (`present`, `absent`, `half_day`) using the `POST /api/v1/attendance/mark` API. The `billableUnits` calculated here will form the basis of the final invoice.

---

## 12. Vendor Toggles Availability (Accepting Requests)

**Endpoint:** `PATCH /api/v1/vendor/toggle-availability`

**Description:** 
Vendor can toggle whether they want to receive B2B requests. If they turn this OFF (`false`), they will not appear in the Corporate's vendor search, and they will not receive general broadcasts.

**Payload:**
```json
{
  "isAccepting": false
}
```

---

## 13. Settlement & Invoicing (Future)

**Description:**
Invoices are generated periodically (e.g., weekly or at the end of the project) for the Corporate client. The invoice amount is calculated by aggregating the `billableUnits` from the `AttendanceRecord` of all assigned crew members multiplied by the daily wage rate of their respective categories.

---

## 12. Real-Time Socket Events

The B2B flow relies on WebSockets (`socket.io`) to deliver instant notifications between Corporates and Vendors.

- **`B2B_DIRECT_REQUEST`**: 
  - **Receiver:** Vendor
  - **Trigger:** When a Corporate creates a Direct Request (`preferredVendorId`), bypassing Admin.
  - **Payload:** `{ requestId, clientId }`

- **`B2B_GENERAL_BROADCAST`**: 
  - **Receiver:** All Eligible Vendors (in radius/inventory)
  - **Trigger:** Handled by a Cron job. Exactly **3 hours before** the shift starts (`startDate` + `shiftStart`), any admin-approved general request (`status: 'broadcasted'`) is emitted to the vendors.
  - **Payload:** `{ requestId, lines, startDate, shiftStart }`
  
- **`B2B_REQUEST_ACCEPTED`**:
  - **Receiver:** Corporate
  - **Trigger:** When the Vendor accepts the request and an `Allocation` is created.
  - **Payload:** `{ requestId, vendorId, allocationId }`

- **`B2B_CREW_ASSIGNED`**:
  - **Receiver:** Corporate
  - **Trigger:** When the Vendor assigns specific labourers to the active allocation.
  - **Payload:** `{ allocationId, requestId }`

- **`B2B_CREW_REPLACED`**:
  - **Receiver:** Corporate
  - **Trigger:** When the Vendor replaces an absent labourer with a new one.
  - **Payload:** `{ allocationId, requestId, oldLabourId, newLabourId }`
