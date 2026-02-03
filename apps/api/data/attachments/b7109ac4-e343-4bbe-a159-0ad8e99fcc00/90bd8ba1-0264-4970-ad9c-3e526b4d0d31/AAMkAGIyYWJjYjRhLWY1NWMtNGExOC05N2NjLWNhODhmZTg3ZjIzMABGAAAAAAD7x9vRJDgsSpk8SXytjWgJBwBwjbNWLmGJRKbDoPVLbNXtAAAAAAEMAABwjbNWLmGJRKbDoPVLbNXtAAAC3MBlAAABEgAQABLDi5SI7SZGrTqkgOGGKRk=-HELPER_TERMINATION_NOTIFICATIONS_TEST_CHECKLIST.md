# Helper Termination Notifications - Quick Test Checklist

## Quick Reference Checklist

### ✅ Phase 1: Initiate Termination
- [ ] Login to Helper App
- [ ] Navigate to Profile Tab
- [ ] Verify "Terminate Contract..." option visible (red document icon)
- [ ] Tap termination option
- [ ] Verify navigation to Termination Form

### ✅ Phase 2: Fill Termination Form
- [ ] Review termination agreement information
- [ ] Select termination date (14-60 days from today)
  - [ ] Test: Date < 14 days → Should show error
  - [ ] Test: Date > 60 days → Should show error
  - [ ] Select valid date (15-30 days)
- [ ] Select termination reason from dropdown
  - [ ] Verify all reason categories visible
  - [ ] If "Other" selected, verify text field appears
- [ ] Add short explanation (optional)
- [ ] Tap "Sign Termination Agreement"
- [ ] Confirm in modal dialog
- [ ] Verify navigation to Signature screen

### ✅ Phase 3: Sign Termination
- [ ] Review termination document draft
- [ ] Verify termination date displayed correctly
- [ ] Sign the document
- [ ] Submit signature
- [ ] Verify success toast: "Termination Confirmed Successfully"
- [ ] Verify navigation to Download screen

### ✅ Phase 4: Verify Notification
- [ ] Navigate to Notifications Tab
- [ ] Verify new notification appears:
  - [ ] Icon: Checkbox (green)
  - [ ] Title: "Kündigung abgeschlossen"
  - [ ] Message: Contains termination date
  - [ ] Status: Shows "NEW" badge
- [ ] Verify notification badge count updated

### ✅ Phase 5: Interact with Notification
- [ ] Tap TERMINATION_CONFIRMED notification
- [ ] Verify navigation to TerminationDownloadStepScreen
- [ ] Verify notification marked as read (NEW badge gone)

### ✅ Phase 6: Download Document
- [ ] Verify termination date displayed on download screen
- [ ] Review collapsible info sections
- [ ] Tap download button
- [ ] Verify:
  - [ ] Loading indicator shows
  - [ ] PDF downloads successfully
  - [ ] PDF viewer opens
  - [ ] Success toast appears
- [ ] Verify PDF contains signature and termination details

### ✅ Phase 7: Profile Screen Update
- [ ] Navigate to Profile screen
- [ ] Verify termination option updated:
  - [ ] Icon: Green checkbox (was red document)
  - [ ] Text: "Termination Agreement Signed"
- [ ] Tap termination option
- [ ] Verify navigates to Download screen (not form)

### ✅ Phase 8: Additional Tests
- [ ] Try creating duplicate termination → Should fail
- [ ] Close/reopen app → Notification persists
- [ ] Test notification list pagination
- [ ] Test pull-to-refresh on notifications
- [ ] If termination period began → Verify vacation locked

---

## Test Data

**Valid Termination Date Range:**
- Minimum: Today + 14 days
- Maximum: Today + 60 days (2 months)

**Example:** If today is Jan 15, 2024:
- Earliest: Jan 29, 2024
- Latest: Mar 15, 2024

---

## Expected Notification Details

**Type:** TERMINATION_CONFIRMED (19)  
**Icon:** Checkbox (green/primary color)  
**Title:** "Kündigung abgeschlossen"  
**Message:** "Du hast deine Kündigung zum [date] erfolgreich abgeschlossen. Alle weiteren Infos und Dokumente findest du hier."  
**Navigation:** Profile Tab → TerminationDownloadStepScreen

---

## API Endpoints to Monitor

1. `POST /helperTermination` - Creates termination
2. `GET /helperTermination/document` - Gets draft document
3. `GET /documents/termination` - Gets final document
4. `GET /notifications` - Gets notifications
5. `POST /notifications/read` - Marks as read

---

## Success Criteria Summary

✅ Complete termination flow works end-to-end  
✅ Notification created and displayed correctly  
✅ Notification navigation works  
✅ Document download works  
✅ Profile screen updates correctly  
✅ Duplicate prevention works  








