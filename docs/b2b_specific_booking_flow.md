# B2B Specific Vendor Search & Direct Booking Flow

This document details the newly added flow that allows Corporate clients to search for specific vendors based on their exact labour requirements, view pricing upfront, and send a direct booking request (Instant or Scheduled).

## 1. Corporate Searches for Specific Vendors

**Endpoint:** `POST /api/v1/corporate/vendors/search`

**Description:** 
Searches for vendors who are within the admin-configured `b2bBroadcastRadius` from the specified `(lat, lng)` and have the exact required number of labourers available for the requested dates. It also returns an estimated price calculation based on global `PricingRate`s.

**Payload:**
```json
{
  "lines": [
    {
      "categoryId": "60d5ecb8b392d7001533abc1",
      "quantity": 2
    },
    {
      "categoryId": "60d5ecb8b392d7001533abc2",
      "quantity": 1
    }
  ],
  "startDate": "2026-08-01",
  "endDate": "2026-08-10",
  "lat": 12.345678,
  "lng": 78.910111
}
```

**Response (`vendors` array items):**
```json
{
  "_id": "60d5...",
  "fullName": "Vendor Name",
  "businessName": "Vendor Construction Co.",
  "rating": 4.5,
  "distance": 12.4, // in km
  "availableCrewSize": 5, // total workers matching requirements
  "priceDetails": {
    "perDayCost": 1500,     // Total cost for 1 day for all requested lines (incl. GST)
    "totalDays": 10,        // Inclusive days between startDate and endDate
    "estimatedTotal": 15000 // perDayCost * totalDays
  }
}
```

---

## 2. Corporate Creates a Direct Booking Request

**Endpoint:** `POST /api/v1/workforce/request`

**Description:** 
Creates a booking request directly assigned to the selected vendor. Supports both `instant` and `schedule` modes.

**Payload:**
```json
{
  "projectId": "60d5...",
  "siteId": "60d5...",
  "bookingMode": "instant", // OR "schedule"
  "scheduleTime": "14:00",  // Used if mode is schedule, optional
  "startDate": "2026-08-01", // Required if mode is schedule
  "endDate": "2026-08-10",
  "shiftStart": "09:00",
  "lines": [
    {
      "categoryId": "60d5ecb8b392d7001533abc1",
      "quantity": 2
    }
  ],
  "preferredVendorId": "60d5..." // Required for direct vendor booking
}
```

**Booking Modes Logic:**
- **Instant (`bookingMode: "instant"`):**
  - The backend ignores the passed `startDate` and automatically forces it to **today**.
  - A **1-hour buffer** is added to the current time to calculate the `shiftStart` automatically, giving the vendor time to prepare.
- **Schedule (`bookingMode: "schedule"`):**
  - Uses the exact `startDate`, `endDate`, and `shiftStart` passed by the client.

**Direct Booking Behavior:**
Because `preferredVendorId` is provided, the system does **not** put this request into `PENDING_REVIEW` for the Admin. Instead:
1. The status is instantly set to `BROADCASTED`.
2. A WebSocket event (`B2B_DIRECT_REQUEST`) is emitted in real-time to the specific vendor's app, notifying them of the incoming job.
