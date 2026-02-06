# Notification System – Channels vs Transports

## Purpose

This document defines how notifications are categorized and delivered in the system.
It establishes a **clear separation between notification channels and delivery transports** to keep the architecture flexible, maintainable, and user-centric.

---

## Core Definitions

### Notification Channel

A **notification channel** describes **where the user receives the notification**.
Channels are **user-visible** and **configurable by the user**.

**Examples:**

* In-app
* Email
* Push notification
* SMS

> Users choose channels.
> Channels do **not** describe how messages are delivered technically.

---

### Notification Transport (Delivery Mechanism)

A **transport** describes **how a notification is delivered** to a channel.
Transports are **implementation details** and **not user-visible**.

**Examples:**

* WebSocket (e.g. Socket.IO)
* HTTP (REST)
* Polling
* Third-party providers (FCM, email providers, SMS gateways)

> Engineers choose transports.
> Transports can change without affecting channels.

---

## Channel vs Transport Mapping

| Channel | Possible Transports                   |
| ------- | ------------------------------------- |
| In-app  | WebSocket (Socket.IO), Polling        |
| Email   | SMTP, Email API (SendGrid, SES, etc.) |
| Push    | FCM, APNs                             |
| SMS     | Twilio, WhatsApp API                  |

---

## In-App Notifications

**In-app notifications** are notifications shown inside the application UI, such as:

* Notification center (bell icon)
* Toasts / snackbars
* Real-time badges or counters

### Transport for In-App (current)

* **WebSocket (Socket.IO)** – used for real-time delivery (e.g. `email.received`). Bi-directional; good for live updates.

Other options (e.g. polling) could be used as fallback; the in-app **channel** is independent of the transport.

> WebSocket is a **transport**, not a channel. The **in-app channel** is where the user sees the notification.

---

## Why WebSocket Is Not a Channel

* They are **not user-visible**
* Users cannot configure or disable them directly
* They are interchangeable without changing product behavior
* They solve *delivery*, not *destination*

Correct terminology:

```
Channel: In-app
Transport: WebSocket (Socket.IO)
```

---

## Architectural Benefits of This Separation

1. **Flexibility**
   Transports can be replaced without changing business logic.

2. **User-Centric Design**
   Users configure channels, not technical details.

3. **Scalability**
   Multiple transports can serve the same channel.

4. **Clear Ownership**

   * Product owns channels
   * Engineering owns transports

---

## Example Data Model

### Channel Enum

```ts
enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
}
```

### Transport Enum

```ts
enum NotificationTransport {
  WEBSOCKET = 'websocket',
  HTTP = 'http',
  POLLING = 'polling',
}
```

---

## Example Flow

**Event:** Order shipped

1. Notification is created
2. User preferences are checked
3. Enabled channels are selected:

   * In-app
   * Email
4. Each channel uses its configured transport:

   * In-app → WebSocket
   * Email → Email provider API

---

## Terminology Clarification

> "WebSocket channel" may be used informally to describe a socket topic or room.
> This is **transport-level language** and should not be confused with **notification channels**.

---

## Summary

* **Channels = where the user sees the notification**
* **Transports = how the notification is delivered**
* WebSocket (Socket.IO) is the **transport** used for in-app real-time
* In-app is a **channel**
* Keep these concepts separate to avoid architectural coupling
