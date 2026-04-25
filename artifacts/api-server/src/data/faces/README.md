# Face Data Storage

Place face photos here for ration card family members.

## Naming Convention

```
{RationCardNumber}-{MemberFirstName}.jpg
```

### Examples

- `KA-BNG-2024-001-Revanna.jpg` → Face data for Revanna km (card holder of KA-BNG-2024-001)
- `KA-BNG-2024-001-Jayanthi.jpg` → Face data for Jayanthi (family member)
- `KA-BNG-2024-002-Jayanth.jpg` → Face data for Jayanth (card holder of KA-BNG-2024-002)

## Supported Formats

- `.jpg`
- `.jpeg`
- `.png`

## How It Works

1. Place face photo files in this folder using the naming convention above.
2. Restart the server — the seed script reads these files and stores them as base64 in MongoDB.
3. On the verify page, only members **with** stored face data will see the "Face Recognition" tab.
4. Members **without** face data will only see "OTP Verification".
5. When a user verifies via face, the captured photo is stored on the token for admin review.
6. Admin can compare the reference face (from here) vs the captured face side-by-side.
