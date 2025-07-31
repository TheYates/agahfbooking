# Hubtel SMS Setup Guide

This guide will help you set up Hubtel for sending OTP SMS messages in the AGAHF Hospital Booking System.

## Prerequisites

1. A Hubtel account (sign up at [hubtel.com](https://hubtel.com))
2. Valid Ghana phone numbers for testing
3. Hubtel API credentials (Client ID & Secret)

## Step 1: Create a Hubtel Account

1. Go to [hubtel.com](https://hubtel.com) and sign up for an account
2. Verify your email address and phone number
3. Complete the account setup process
4. Navigate to the Developer section

## Step 2: Get Your Hubtel API Credentials

1. Log in to your Hubtel Dashboard
2. Go to **Settings** > **API Keys** or **Developer** section
3. Create a new API application
4. Find your **Client ID** and **Client Secret**
5. Copy these values - you'll need them for configuration

## Step 3: Choose Your Sender ID

1. You can use a custom sender ID (e.g., "AGAHF", "Hospital")
2. Or use the default "YourApp"
3. Custom sender IDs may require approval from Hubtel

## Step 4: Configure Environment Variables

Update your `.env.local` file with your Hubtel credentials:

```env
# Hubtel Configuration
HUBTEL_CLIENT_ID=your_actual_client_id_here
HUBTEL_CLIENT_SECRET=your_actual_client_secret_here
HUBTEL_SENDER_ID=AGAHF
```

**Important:** Replace the placeholder values with your actual Hubtel credentials.

## Step 5: Test the Configuration

1. Start your development server: `pnpm dev`
2. Go to the login page
3. Enter a valid X-number from your database
4. Check if you receive the OTP SMS on the registered phone number

## Development Mode

When Arkesel is not configured (missing credentials), the system will:

- Generate real OTPs and store them in the database
- Log the OTP to the console for testing
- Include the OTP in the API response (development mode only)

## Production Considerations

1. **Security**: Never expose your Arkesel API key in client-side code
2. **Rate Limiting**: Implement rate limiting to prevent SMS abuse
3. **Phone Number Validation**: Validate Ghana phone numbers before sending SMS
4. **Cost Management**: Monitor SMS usage to control costs
5. **Error Handling**: Implement proper error handling for failed SMS delivery
6. **Sender ID**: Use approved sender IDs for better delivery rates

## Troubleshooting

### Common Issues

1. **"Arkesel not configured" error**

   - Check that the API key is set correctly in `.env.local`
   - Restart your development server after updating `.env.local`

2. **SMS not received**

   - Verify the phone number is in the correct format (233240298713)
   - Check Arkesel Dashboard for delivery status
   - Ensure you have sufficient SMS credits

3. **"Invalid API key" error**
   - Verify the API key is correct and active
   - Check if the API key has SMS sending permissions

### Phone Number Format

Ensure phone numbers in your database are stored in international format:

- ✅ Correct: `+233240298713`, `233240298713`
- ❌ Incorrect: `0240298713`, `240298713`

## Arkesel API Features

- REST API for SMS sending
- Delivery reports
- Bulk messaging
- Scheduled SMS
- Two-way messaging
- Ghana-focused delivery optimization

## Support

For Arkesel-specific issues, refer to:

- [Arkesel Documentation](https://developers.arkesel.com)
- [Arkesel Support](https://arkesel.com/contact)

For application-specific issues, check the server logs and ensure your database contains valid client records with proper phone numbers.

## Benefits of Arkesel

- ✅ **Ghana-focused**: Excellent delivery rates in Ghana
- ✅ **Cost-effective**: Competitive pricing for Ghana market
- ✅ **Fast approval**: Quick API key approval process
- ✅ **Reliable**: High delivery success rates
- ✅ **Local support**: Ghana-based customer service
- ✅ **Developer-friendly**: Simple REST API
