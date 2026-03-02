# Hubtel SMS Setup Guide

This guide explains how to configure real SMS delivery for OTP authentication using Hubtel SMS API.

## Prerequisites

1. **Hubtel Account**: Sign up at [https://hubtel.com](https://hubtel.com)
2. **SMS API Credentials**: Get your API credentials from Hubtel dashboard
3. **SMS Sender ID**: Register a sender ID (e.g., "AGAHF")

## Environment Variables

Add these variables to your `.env.local` file:

```env
# OTP Mode - Set to "production" for real SMS, "mock" for testing
OTP_MODE=production

# Hubtel SMS Configuration
HUBTEL_CLIENT_ID=your_client_id_here
HUBTEL_CLIENT_SECRET=your_client_secret_here
HUBTEL_SENDER_ID=AGAHF

# Optional: Hubtel API Base URL (defaults to production URL)
# HUBTEL_API_URL=https://smsc.hubtel.com
```

## Configuration Steps

### 1. Get Hubtel API Credentials

1. Log in to your Hubtel dashboard
2. Navigate to **Settings** > **API Keys**
3. Create a new API key or use an existing one
4. Copy your **Client ID** and **Client Secret**

### 2. Register Sender ID

1. In Hubtel dashboard, go to **SMS** > **Sender IDs**
2. Register "AGAHF" (or your preferred name)
3. Wait for approval (usually takes 1-2 business days)
4. Once approved, use it as your `HUBTEL_SENDER_ID`

### 3. Update Environment Variables

Create or update `.env.local`:

```env
OTP_MODE=production
HUBTEL_CLIENT_ID=your_actual_client_id
HUBTEL_CLIENT_SECRET=your_actual_client_secret
HUBTEL_SENDER_ID=AGAHF
```

### 4. Restart Your Application

```bash
npm run dev
```

## Testing

### Mock Mode (Development)
```env
OTP_MODE=mock
```
- OTP is logged to console
- OTP is returned in API response
- No SMS is sent

### Production Mode (Real SMS)
```env
OTP_MODE=production
```
- OTP is sent via Hubtel SMS
- OTP is NOT returned in API response
- Failures are logged but don't block OTP creation

## SMS Message Format

The OTP SMS message sent to users:

```
Your AGAHF appointment verification code is: [123456]. Valid for 10 minutes. Do not share this code.
```

## How It Works

1. **User requests OTP** with X-Number
2. **System generates** 6-digit OTP
3. **OTP is stored** in database with 10-minute expiry
4. **If production mode:**
   - SMS is sent via Hubtel API
   - Success/failure is logged
   - OTP remains valid regardless of SMS delivery status
5. **If mock mode:**
   - OTP is logged to console
   - OTP is included in API response (for testing)

## Error Handling

The system handles SMS failures gracefully:

- If SMS sending fails, the OTP is still stored and valid
- Failures are logged for monitoring
- User can still verify if they receive OTP through other means

## Cost Considerations

- Each SMS costs based on your Hubtel pricing plan
- Typical cost: ~GHS 0.05 per SMS
- Consider implementing SMS sending limits/throttling for cost control

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use .env.local** for local development
3. **Use environment variables** in production (Vercel, etc.)
4. **Rotate API keys** regularly
5. **Monitor SMS usage** to detect abuse
6. **Implement rate limiting** (already configured in the app)

## Monitoring

Check logs for:
- `✅ OTP SMS sent successfully` - Successful delivery
- `SMS sending failed:` - Delivery failures
- `Error sending SMS:` - API errors

## Troubleshooting

### SMS Not Sending
1. Check environment variables are set correctly
2. Verify `OTP_MODE=production`
3. Check Hubtel account balance
4. Verify sender ID is approved
5. Check phone number format (should include country code)

### Invalid Phone Numbers
- Ensure phone numbers in database have correct format
- Ghana format: `+233XXXXXXXXX` or `0XXXXXXXXX`
- System should auto-format if needed

### API Errors
- Check Hubtel API credentials
- Verify account is active
- Check for rate limiting on Hubtel side

## Support

- **Hubtel Support**: support@hubtel.com
- **Hubtel Documentation**: https://developers.hubtel.com

## Migration from Mock to Production

1. Test thoroughly in mock mode
2. Set up Hubtel account and credentials
3. Update environment variables
4. Test with a few users first
5. Monitor logs for any issues
6. Gradually roll out to all users

---

**Note**: Keep `OTP_MODE=mock` during development to avoid SMS costs.
