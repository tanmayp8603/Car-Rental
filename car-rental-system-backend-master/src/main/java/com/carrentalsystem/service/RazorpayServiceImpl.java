package com.carrentalsystem.service;

import com.carrentalsystem.config.RazorpayConfig;
import com.carrentalsystem.dto.RazorpayOrderResponse;
import com.carrentalsystem.dto.RazorpayPaymentVerificationRequest;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.carrentalsystem.config.RazorpayConfig;
import com.carrentalsystem.dto.RazorpayOrderRequest;
import com.carrentalsystem.dto.RazorpayOrderResponse;
import com.carrentalsystem.dto.RazorpayPaymentVerificationRequest;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class RazorpayServiceImpl implements RazorpayService {

    @Autowired
    private RazorpayConfig razorpayConfig;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Logger logger = LoggerFactory.getLogger(RazorpayServiceImpl.class);

    @Override
    public RazorpayOrderResponse createOrder(RazorpayOrderRequest request) throws Exception {
        try {
            logger.info("Creating Razorpay order for booking ID: {}", request.getBookingId());
            logger.debug("Request details: amount={}, currency={}, customer={}", 
                request.getAmount(), request.getCurrency(), request.getCustomerName());
            JSONObject orderData = new JSONObject();
            System.out.println("DEBUG: request.getAmount() = " + request.getAmount() + ", type = " + (request.getAmount() == null ? "null" : request.getAmount().getClass().getName()));
            
            // The amount is already in paise from the frontend, so we don't need to multiply by 100
            int amountInPaise = Integer.parseInt(request.getAmount());
            orderData.put("amount", amountInPaise);
            orderData.put("currency", request.getCurrency());
            orderData.put("receipt", request.getOrderId());
            orderData.put("notes", new JSONObject()
                .put("customer_name", request.getCustomerName())
                .put("customer_email", request.getCustomerEmail())
                .put("customer_phone", request.getCustomerPhone())
                .put("description", request.getDescription()));

            System.out.println("DEBUG: Razorpay orderData payload = " + orderData.toString());
            String requestBody = orderData.toString();
            String auth = razorpayConfig.getKeyId() + ":" + razorpayConfig.getKeySecret();
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

            HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://api.razorpay.com/v1/orders"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Basic " + encodedAuth)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            HttpResponse<String> response = httpClient.send(httpRequest, 
                HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JSONObject jsonResponse = new JSONObject(response.body());
                RazorpayOrderResponse orderResponse = new RazorpayOrderResponse();
                orderResponse.setId(jsonResponse.getString("id"));
                orderResponse.setEntity(jsonResponse.getString("entity"));
                orderResponse.setAmount(jsonResponse.get("amount").toString());
                orderResponse.setAmount_paid(jsonResponse.get("amount_paid").toString());
                orderResponse.setAmount_due(jsonResponse.get("amount_due").toString());
                orderResponse.setCurrency(jsonResponse.getString("currency"));
                orderResponse.setReceipt(jsonResponse.getString("receipt"));
                orderResponse.setStatus(jsonResponse.getString("status"));
                orderResponse.setAttempts(jsonResponse.get("attempts").toString());
                orderResponse.setCreated_at(jsonResponse.get("created_at").toString());
                
                if (jsonResponse.has("notes")) {
                    orderResponse.setNotes(jsonResponse.getJSONObject("notes").toString());
                }
                
                return orderResponse;
            } else {
                String errorMsg = String.format("Failed to create Razorpay order. Status: %d, Response: %s", 
                    response.statusCode(), response.body());
                logger.error(errorMsg);
                throw new Exception(errorMsg);
            }
        } catch (Exception e) {
            logger.error("Error in createOrder: " + e.getMessage(), e);
            throw new Exception("Error creating Razorpay order: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean verifyPayment(RazorpayPaymentVerificationRequest request) throws Exception {
        try {
            String data = request.getRazorpay_order_id() + "|" + request.getRazorpay_payment_id();
            String expectedSignature = generateHmacSha256(data, razorpayConfig.getKeySecret());
            
            return expectedSignature.equals(request.getRazorpay_signature());
        } catch (Exception e) {
            throw new Exception("Error verifying Razorpay payment: " + e.getMessage());
        }
    }

    @Override
    public String getPaymentStatus(String orderId) throws Exception {
        try {
            String auth = razorpayConfig.getKeyId() + ":" + razorpayConfig.getKeySecret();
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

            HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://api.razorpay.com/v1/orders/" + orderId))
                .header("Authorization", "Basic " + encodedAuth)
                .GET()
                .build();

            HttpResponse<String> response = httpClient.send(httpRequest, 
                HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JSONObject jsonResponse = new JSONObject(response.body());
                return jsonResponse.getString("status");
            } else {
                throw new Exception("Failed to get payment status. Status: " + response.statusCode());
            }
        } catch (Exception e) {
            throw new Exception("Error getting payment status: " + e.getMessage());
        }
    }

    private String generateHmacSha256(String data, String secret) throws NoSuchAlgorithmException {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec secretKeySpec = new javax.crypto.spec.SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            // Convert to lowercase hex string
            StringBuilder hexString = new StringBuilder();
            for (byte b : hmacBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new NoSuchAlgorithmException("Error generating HMAC: " + e.getMessage());
        }
    }
}