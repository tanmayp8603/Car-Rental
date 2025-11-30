# Razorpay Payment Integration Guide

This guide explains how to set up and use Razorpay payment integration in the Car Rental System. This is the primary payment gateway for the application.

## Prerequisites

1. Razorpay Account: Sign up at [https://razorpay.com](https://razorpay.com)
2. Get your API keys from the Razorpay Dashboard
3. Java 17 or higher
4. Maven

## Setup Instructions

### 1. Configure Razorpay API Keys

Update the `application.properties` file with your Razorpay credentials:

```properties
# Razorpay Configuration
razorpay.key.id=rzp_test_YOUR_KEY_ID
razorpay.key.secret=YOUR_SECRET_KEY
razorpay.currency=INR
```

**Important:** 
- Replace `rzp_test_YOUR_KEY_ID` with your actual Razorpay test Key ID
- Replace `YOUR_SECRET_KEY` with your actual Razorpay test Secret Key
- For production, use live keys and change key ID to `rzp_live_` prefix

### 2. Database Schema Update

The Payment entity has been updated with new fields:
- `razorpayOrderId`: Stores the Razorpay order ID
- `razorpayPaymentId`: Stores the Razorpay payment ID  
- `razorpayPaymentMode`: Stores the payment mode used

Run the application to automatically update the database schema.

## API Endpoints

### Create Order
- **URL:** `POST /api/payment/razorpay/create-order`
- **Request Body:**
```json
{
  "orderId": "booking_123_1234567890",
  "amount": 1000.00,
  "currency": "INR",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "9999999999",
  "description": "Booking payment for booking ID: 123",
  "callbackUrl": "https://yourdomain.com/payment/success",
  "cancelUrl": "https://yourdomain.com/payment/cancel"
}
```

### Verify Payment
- **URL:** `POST /api/payment/razorpay/verify-payment`
- **Request Body:**
```json
{
  "razorpay_order_id": "order_123456789",
  "razorpay_payment_id": "pay_123456789",
  "razorpay_signature": "signature_hash",
  "amount": "1000.00",
  "currency": "INR"
}
```

## Payment Flow

1. **Order Creation:** When user clicks "Pay", the system creates a Razorpay order
2. **Payment Gateway:** User is redirected to Razorpay's payment gateway
3. **Payment Processing:** User completes payment on Razorpay's secure platform
4. **Return to App:** User is redirected back to your application
5. **Payment Verification:** System verifies the payment signature and updates booking status

## Security Features

- **Signature Verification:** All payments are verified using Razorpay's signature verification
- **Server-side Validation:** Payment verification happens on the server side
- **Secure API Calls:** All API calls use HTTPS with proper authentication headers
- **Error Handling:** Comprehensive error handling for failed payments

## Testing

### Test Environment
- **Test Mode:** Use test keys with `rzp_test_` prefix
- **Test Cards:** Use any valid test card numbers
- **Test UPI:** Use any valid UPI ID for testing

### Test Scenarios
1. **Successful Payment:** Complete payment with valid test data
2. **Failed Payment:** Use invalid card details or insufficient funds
3. **Cancelled Payment:** Cancel payment during the process
4. **Network Issues:** Test with poor network connectivity

## Production Deployment

### 1. Update API Keys
```properties
razorpay.key.id=rzp_live_YOUR_LIVE_KEY_ID
razorpay.key.secret=YOUR_LIVE_SECRET_KEY
razorpay.currency=INR
```

### 2. SSL Certificate
Ensure your domain has a valid SSL certificate for secure communication.

### 3. Webhook Configuration
Set up webhooks in Razorpay dashboard:
- **Webhook URL:** `https://yourdomain.com/api/payment/razorpay/webhook`
- **Events:** Order created, Payment successful, Payment failed

## Frontend Integration

### 1. Load Razorpay Script
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 2. Initialize Razorpay
```javascript
const options = {
  key: "rzp_test_YOUR_KEY_ID",
  amount: order.amount,
  currency: order.currency,
  name: "Car Rental System",
  description: "Booking payment",
  order_id: order.id,
  handler: function (response) {
    // Handle successful payment
  },
  prefill: {
    name: customerName,
    email: customerEmail,
    contact: customerPhone
  },
  theme: {
    color: "#3399cc"
  }
};

const rzp = new Razorpay(options);
rzp.open();
```

## Error Handling

### Common Errors
1. **Invalid API Keys:** Ensure correct key ID and secret
2. **Amount Mismatch:** Verify amount is in paise (multiply by 100)
3. **Signature Verification Failed:** Check webhook signature verification
4. **Order Not Found:** Ensure order exists before payment verification

### Debugging
- Check application logs for detailed error messages
- Verify API key permissions in Razorpay dashboard
- Test with Razorpay's test mode first

## Support

For technical support:
- Razorpay Documentation: [https://razorpay.com/docs](https://razorpay.com/docs)
- Razorpay Support: [https://razorpay.com/support](https://razorpay.com/support)
- Application Logs: Check `logs/application.log` for detailed error information 