#!/bin/bash

# Test email sending endpoint
echo "Testing email send endpoint..."
echo ""

curl -X POST http://localhost:3000/api/emails/send \
  -H "Content-Type: application/json" \
  -d '{
    "mailboxId": "304626f7-7d6f-4c9c-8d4a-fb48a13dab3e",
    "subject": "Test Email - '$(date +%Y%m%d-%H%M%S)'",
    "to": [
      {
        "emailAddress": "abdullahomar@imedizin.com",
        "displayName": "Abdullah Omar"
      }
    ],
    "bodyText": "This is a test email sent via the API.",
    "bodyHtml": "<p>This is a <strong>test email</strong> sent via the API.</p>"
  }' | jq '.'

echo ""
echo "Check the server logs for detailed error messages if this failed."
