package com.carrentalsystem.dto;

public class CommonApiResponse {

	private String responseMessage;

	private boolean isSuccess;
	
	private Object data;

	// Default constructor
	public CommonApiResponse() {
	}

	// Constructor with success and message
	public CommonApiResponse(boolean isSuccess, String responseMessage) {
		this.isSuccess = isSuccess;
		this.responseMessage = responseMessage;
	}

	// Constructor with success, message and data
	public CommonApiResponse(boolean isSuccess, String responseMessage, Object data) {
		this.isSuccess = isSuccess;
		this.responseMessage = responseMessage;
		this.data = data;
	}

	public String getResponseMessage() {
		return responseMessage;
	}

	public void setResponseMessage(String responseMessage) {
		this.responseMessage = responseMessage;
	}

	public boolean isSuccess() {
		return isSuccess;
	}

	public void setSuccess(boolean isSuccess) {
		this.isSuccess = isSuccess;
	}

	public Object getData() {
		return data;
	}

	public void setData(Object data) {
		this.data = data;
	}

}
