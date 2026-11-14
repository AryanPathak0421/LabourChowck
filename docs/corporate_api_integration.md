# Corporate API Integration Guide

This document tracks all new APIs built for the Corporate Panel.

## 1. Analytics, Reporting & Banners
### Get Corporate Banners
**Endpoint**: `GET /api/v1/corporate/banners`
**Description**: Fetches the list of active banners designated for the Corporate Panel.
**Response**:
```json
{
  "success": true,
  "data": {
    "banners": [
      {
        "_id": "60d5ec...",
        "imageUrl": "https://...",
        "targetUrl": "https://...",
        "isActive": true
      }
    ]
  }
}
```

### View Analytics
**Endpoint**: `GET /api/v1/corporate/analytics`
**Description**: Fetches timeseries data for attendance and total spend for the corporate dashboard/analytics page.
**Response**:
```json
{
  "success": true,
  "data": {
    "attendanceTrends": [
      { "date": "2026-07-20", "present": 5, "absent": 1 }
    ],
    "totalSpend": 150000
  }
}
```

### View Vendor's Labour Attendance
**Endpoint**: `GET /api/v1/corporate/vendor-attendance`
**Description**: Fetches attendance records grouped by the vendor (contractor). Automatically filters out direct labour. Defaults to today's date, or accepts a `?date=YYYY-MM-DD` query parameter.
**Response**:
```json
{
  "success": true,
  "data": {
    "vendors": [
      {
        "vendor": {
          "_id": "60d5ec...",
          "fullName": "Rahul Contractor",
          "phone": "9876543210",
          "businessName": "Rahul Builders"
        },
        "summary": {
          "totalCrew": 10,
          "present": 8,
          "absent": 2
        },
        "attendanceRecords": [
          {
            "_id": "...",
            "labourId": { "_id": "...", "fullName": "Worker A", "phone": "..." },
            "status": "present",
            "shiftDate": "2026-07-27T00:00:00.000Z",
            "billableUnits": 1
          }
        ]
      }
    ]
  }
}
```

## 2. Payments & Billing Module
### Init Payment
**Endpoint**: `POST /api/v1/payments/init`
**Description**: Initiates a payment for an invoice. (Razorpay integration).
**Body**:
```json
{
  "amount": 15000,
  "purpose": "INVOICE",
  "invoiceId": "60d5ecb8b3924b001f31f9b1"
}
```
**Response**: Standard Razorpay order response with `paymentTransactionId`.

### Verify Payment
**Endpoint**: `POST /api/v1/payments/verify`
**Description**: Verifies the Razorpay payment signature and marks the invoice as Paid.
**Body**:
```json
{
  "razorpayOrderId": "order_H...",
  "razorpayPaymentId": "pay_H...",
  "razorpaySignature": "..."
}
```

### View Transactions
**Endpoint**: `GET /api/v1/corporate/transactions`
**Description**: Fetches historical invoice payment ledger.
**Response**:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "_id": "...",
        "amount": 15000,
        "purpose": "INVOICE",
        "status": "CAPTURED",
        "invoiceId": { "invoiceNumber": "INV-1234", ... },
        "createdAt": "2026-07-21T10:00:00.000Z"
      }
    ]
  }
}
```

## 3. Complaints & Support Module
### Create Complaint
**Endpoint**: `POST /api/v1/corporate/complaints`
**Description**: Create a support ticket or complaint.
**Body**:
```json
{
  "title": "Worker did not show up",
  "description": "The assigned worker did not show up today.",
  "assignmentId": "60d5ecb8b3924b001f31f9b1",
  "projectId": "60d5ecb8b3924b001f31f9b2"
}
```

### View Complaints
**Endpoint**: `GET /api/v1/corporate/complaints`
**Description**: Fetches historical complaints and their status.
**Response**:
```json
{
  "success": true,
  "data": {
    "complaints": [
      {
        "_id": "...",
        "title": "...",
        "status": "OPEN",
        "adminRemarks": "",
        "createdAt": "..."
      }
    ]
  }
}
```

## 4. Feedback & Ratings Module
### Rate Assignment
**Endpoint**: `POST /api/v1/corporate/assignments/:assignmentId/rate`
**Description**: Rate the assigned labour/vendor after a request/shift is completed.
**Body**:
```json
{
  "rating": 5,
  "comment": "Excellent work and on time."
}
```
**Response**:
```json
{
  "success": true,
  "message": "Rating submitted successfully",
  "data": {
    "review": {
      "_id": "...",
      "assignmentId": "...",
      "reviewerId": "...",
      "revieweeId": "...",
      "rating": 5,
      "comment": "Excellent work and on time."
    }
  }
}
```

## 5. Vendor Booking Flow
### Search / List Vendors
**Endpoint**: `GET /api/v1/corporate/vendors`
**Description**: Fetch a list of verified vendors/contractors to route specific workforce requests to them.
**Response**:
```json
{
  "success": true,
  "data": {
    "vendors": [
      {
        "_id": "60d5ec...",
        "fullName": "Rahul Contractor",
        "phone": "9876543210",
        "contractorProfile": {
          "businessName": "Rahul Builders",
          "city": "Mumbai",
          "state": "Maharashtra"
        }
      }
    ]
  }
}
```

### Create Direct Request (Workforce Booking)
When creating a workforce request (`POST /api/v1/workforce/request` or via corporate project booking), you can now pass `preferredVendorId` in the body payload to directly assign the request to a chosen vendor.

**Body Payload Addition**:
```json
{
  "...": "...",
  "preferredVendorId": "60d5ec..."
}
```
