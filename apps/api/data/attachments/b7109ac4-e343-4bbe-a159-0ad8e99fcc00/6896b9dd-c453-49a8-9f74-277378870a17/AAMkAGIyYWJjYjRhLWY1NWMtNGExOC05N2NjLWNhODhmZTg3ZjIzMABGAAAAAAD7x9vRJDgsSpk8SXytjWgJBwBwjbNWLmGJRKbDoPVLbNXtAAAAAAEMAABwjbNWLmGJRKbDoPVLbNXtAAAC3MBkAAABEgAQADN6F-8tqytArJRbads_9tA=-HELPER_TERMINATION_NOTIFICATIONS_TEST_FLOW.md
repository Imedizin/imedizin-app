# Helper Termination Notifications - Manual Testing Flow

## Overview
This document outlines the manual testing flow for Helper Termination Notifications in the Helper App (juhi-app). The flow covers the complete termination process from initiation to notification receipt and document download.

---

## Prerequisites
- Helper App installed and running
- Valid helper account with active status
- Helper should NOT have an existing termination request
- Test environment with backend API accessible

---

## Testing Flow

### Phase 1: Initiate Termination Request

#### Step 1.1: Navigate to Profile Screen
1. Open the Helper App
2. Log in with a valid helper account
3. Navigate to the **Profile Tab** (bottom navigation)
4. Verify the Profile screen displays correctly

#### Step 1.2: Access Termination Option
1. On the Profile screen, locate the **"Terminate Contract..."** option
   - Should display with a red document-outline icon
   - Text should be: "Terminate Contract..."
2. Tap on the termination option
3. Verify navigation to **TerminationFormStepScreen**

---

### Phase 2: Fill Termination Form

#### Step 2.1: Review Termination Information
1. Verify the **Termination Agreement** collapsible section is visible
2. Expand the section to read the termination description
3. Verify all required information is displayed

#### Step 2.2: Select Termination Date
1. Locate the **Termination Date** field
2. Tap to open date picker
3. **Validation Checks:**
   - Minimum date: Should be at least 14 days in the future
   - Maximum date: Should be no more than 2 months in the future
   - Try selecting a date less than 14 days → Should show validation error
   - Try selecting a date more than 2 months → Should show validation error
4. Select a valid termination date (e.g., 15-30 days from today)
5. Verify the selected date is displayed correctly

#### Step 2.3: Select Termination Reason
1. Locate the **Reason** dropdown field
2. Tap to open reason selection
3. Verify reason categories are displayed:
   - **Internal Reasons:**
     - Dissatisfied (Order Supply)
     - Dissatisfied (Tasks)
     - Dissatisfied (Clients)
     - Dissatisfied (Support)
     - Dissatisfied (Payment)
   - **External Reasons:**
     - Time Availability (School)
     - Time Availability (Vocational Training)
     - Time Availability (Studies)
     - Time Availability (FSJ, FÖJ, BFD etc.)
     - Time Availability (Other)
     - Private Circumstances
     - Terminated Buy JUHI
     - Move to Another City
     - New H. No more Interest
   - **Unclear Reasons:**
     - Long Inactivity
     - Other
4. Select a reason from the list
5. If "Other" is selected, verify an additional text field appears
6. Fill in "Other Reason" text if applicable

#### Step 2.4: Add Details
1. Locate the **Short Explanation** field (multiline text)
2. Enter optional details about the termination
3. Verify text input works correctly

#### Step 2.5: Submit Form
1. Review all entered information
2. Tap the **"Sign Termination Agreement"** button
3. Verify a confirmation modal appears with:
   - Message asking to confirm termination on the selected date
   - Warning that the step cannot be reversed
   - Selected termination date displayed in bold
4. Confirm the action
5. Verify navigation to **TerminationSignatureStepScreen**

---

### Phase 3: Sign Termination Agreement

#### Step 3.1: Review Termination Document
1. Verify the termination document draft is displayed
2. Verify the termination date is shown correctly
3. Review the document content

#### Step 3.2: Sign the Document
1. Locate the signature area
2. Sign the termination agreement
3. Verify signature is captured correctly
4. Tap **OK/Confirm** to submit

#### Step 3.3: Verify Submission
1. Verify a success toast message appears:
   - Title: "Termination Confirmed Successfully"
   - Message: "Your Termination Process is now Done"
2. Verify navigation to **TerminationDownloadStepScreen**
3. Verify the termination request is saved in the backend

---

### Phase 4: Receive Termination Confirmed Notification

#### Step 4.1: Verify Notification Creation (Backend)
1. Check backend logs/API to verify:
   - `TERMINATION_CONFIRMED` notification (type 19) was created
   - Notification is associated with the helper's ID
   - Notification contains termination date in data field
   - Push notification was sent (if push notifications are enabled)

#### Step 4.2: Check Notification in App
1. Navigate to **Notifications Tab** (bottom navigation)
2. Verify a new notification appears in the list
3. **Verify Notification Details:**
   - **Icon:** Checkbox icon (green/primary color)
   - **Title:** "Kündigung abgeschlossen" (Termination completed)
   - **Message:** "Du hast deine Kündigung zum [terminationDate] erfolgreich abgeschlossen. Alle weiteren Infos und Dokumente findest du hier."
   - **Status:** Should show "NEW" badge (unread)
   - **Timestamp:** Should show time ago (e.g., "2 minutes ago")

#### Step 4.3: Verify Notification Badge
1. Check if notification badge/count appears on the Notifications tab icon
2. Verify the count includes the new termination notification

---

### Phase 5: Interact with Notification

#### Step 5.1: Tap Notification
1. Tap on the **TERMINATION_CONFIRMED** notification
2. Verify navigation to **TerminationDownloadStepScreen** (Profile Tab)
3. Verify the notification is marked as read (NEW badge disappears)

#### Step 5.2: Verify Navigation Behavior
1. If notification is tapped from Notifications screen:
   - Should navigate to Profile Tab → TerminationDownloadStepScreen
2. If app is opened from push notification:
   - Should navigate directly to TerminationDownloadStepScreen

---

### Phase 6: Download Termination Document

#### Step 6.1: View Termination Download Screen
1. Verify the screen displays:
   - Termination date prominently displayed
   - Collapsible info sections with termination details
   - Download button for termination document

#### Step 6.2: Review Termination Information
1. Expand each collapsible info section:
   - **Meet Client Visits:** Information about completing visits until termination date
   - **Termination Date:** Confirmation of termination date
   - Other relevant information sections
2. Verify all information is accurate and matches the submitted data

#### Step 6.3: Download Termination Document
1. Tap the **"Termination Agreement and Employment Reference"** download button
2. Verify:
   - Loading indicator appears during download
   - Document downloads successfully
   - PDF viewer opens with the termination document
   - Success toast appears:
     - Title: "Termination Document Download"
     - Message: "Termination Document Download Success"
3. Verify the downloaded PDF contains:
   - Helper's signature
   - Termination date
   - All termination details
   - Proper formatting

---

### Phase 7: Verify Profile Screen Update

#### Step 7.1: Check Profile Screen
1. Navigate back to **Profile Tab** → Profile Screen
2. Verify the termination option has changed:
   - **Icon:** Changed from red document-outline to green checkbox
   - **Text:** Changed to "Termination Agreement Signed"
   - **Color:** Changed to primary/green color
3. Tap the termination option
4. Verify it navigates to **TerminationDownloadStepScreen** (not form screen)

---

### Phase 8: Additional Verification Tests

#### Step 8.1: Prevent Duplicate Termination
1. Try to initiate another termination request
2. Verify:
   - Backend returns error: "Helper has already a termination and can not create new one"
   - User cannot create a second termination request

#### Step 8.2: Verify Notification Persistence
1. Close and reopen the app
2. Navigate to Notifications
3. Verify the TERMINATION_CONFIRMED notification is still present
4. Verify it's marked as read (if previously tapped)

#### Step 8.3: Test Notification List Behavior
1. Scroll through notifications list
2. Verify TERMINATION_CONFIRMED notification appears in chronological order
3. Verify pagination works if there are many notifications
4. Verify pull-to-refresh updates the list

#### Step 8.4: Verify Vacation Lock (if applicable)
1. If termination period has begun (`didTerminationPeriodBegin` is true):
   - Try to request a vacation
   - Verify vacation is locked with appropriate modal message
   - Verify "VacationLockedDueTerminationModal" content is displayed

---

## Expected Backend Behavior

### API Endpoints Used:
1. **POST** `/helperTermination` - Creates termination request
2. **GET** `/helperTermination/document` - Gets termination document draft
3. **GET** `/documents/termination` - Gets final termination document
4. **GET** `/notifications` - Retrieves notifications list
5. **POST** `/notifications/read` - Marks notifications as read

### Notification Creation:
- Notification type: `19` (TERMINATION_CONFIRMED)
- Notification data should include: `{ terminationDate: "YYYY-MM-DD" }`
- Push notification should be sent (if enabled)
- Notification should be saved to database

---

## Test Data Requirements

### Valid Termination Dates:
- Minimum: Today + 14 days
- Maximum: Today + 60 days (2 months)
- Example: If today is 2024-01-15, valid range is 2024-01-29 to 2024-03-15

### Test Scenarios:
1. **Happy Path:** Complete termination flow with valid data
2. **Invalid Date:** Try dates outside valid range
3. **Missing Fields:** Try submitting without required fields
4. **Duplicate Termination:** Try creating second termination
5. **Notification Delivery:** Verify notification appears and is clickable
6. **Document Download:** Verify PDF generation and download

---

## Success Criteria

✅ Helper can initiate termination from Profile screen  
✅ Termination form validates date (14 days - 2 months)  
✅ Helper can select reason and add details  
✅ Helper can sign termination agreement  
✅ TERMINATION_CONFIRMED notification is created and sent  
✅ Notification appears in Notifications list with correct icon and message  
✅ Tapping notification navigates to download screen  
✅ Termination document can be downloaded successfully  
✅ Profile screen updates to show termination is signed  
✅ Duplicate terminations are prevented  
✅ All navigation flows work correctly  

---

## Known Issues / Edge Cases to Test

1. **Network Failure:** Test behavior when network fails during submission
2. **App Backgrounding:** Test notification behavior when app is in background
3. **Multiple Devices:** Test notification sync across devices (if applicable)
4. **Date Edge Cases:** Test exactly 14 days, exactly 60 days, leap years
5. **Long Text:** Test with very long details/other reason text
6. **Special Characters:** Test with special characters in text fields

---

## Notes

- The notification is sent immediately after the helper signs the termination agreement
- The notification icon is a checkbox (indicating completion)
- The notification navigates to the download screen, not back to the form
- Once termination is signed, the Profile screen shows it as completed
- Helper cannot create multiple termination requests








