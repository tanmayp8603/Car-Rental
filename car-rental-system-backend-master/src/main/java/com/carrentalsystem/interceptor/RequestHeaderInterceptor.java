package com.carrentalsystem.interceptor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RequestHeaderInterceptor implements HandlerInterceptor {

	private final Logger LOG = LoggerFactory.getLogger(RequestHeaderInterceptor.class);

	
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
			throws Exception {

		// Skip logging for static resources to reduce noise
		String requestURI = request.getRequestURI();
		if (requestURI.contains("/variant/") || requestURI.contains("/license/") || 
			requestURI.contains(".css") || requestURI.contains(".js") || 
			requestURI.contains(".ico") || requestURI.contains(".png")) {
			return true;
		}

		LOG.info("=== REQUEST START ===");
		LOG.info("URL: {} {}", request.getMethod(), requestURI);
		LOG.info("Client IP: {}", getClientIP(request));
		LOG.info("User Agent: {}", request.getHeader("User-Agent"));

		return true;
	}

	public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler,
			ModelAndView modelAndView) throws Exception {
		HandlerInterceptor.super.postHandle(request, response, handler, modelAndView);
	}

	public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex)
			throws Exception {

		String requestURI = request.getRequestURI();
		// Skip logging for static resources
		if (requestURI.contains("/variant/") || requestURI.contains("/license/") || 
			requestURI.contains(".css") || requestURI.contains(".js") || 
			requestURI.contains(".ico") || requestURI.contains(".png")) {
			return;
		}

		int status = response.getStatus();
		String statusMessage = status >= 200 && status < 300 ? "SUCCESS" : 
							 status >= 400 && status < 500 ? "CLIENT_ERROR" : 
							 status >= 500 ? "SERVER_ERROR" : "UNKNOWN";

		LOG.info("Status: {} ({})", status, statusMessage);
		
		if (ex != null) {
			LOG.error("Exception occurred: {}", ex.getMessage());
		}
		
		LOG.info("=== REQUEST END ===");

		HandlerInterceptor.super.afterCompletion(request, response, handler, ex);
	}

	private String getClientIP(HttpServletRequest request) {
		String xForwardedFor = request.getHeader("X-Forwarded-For");
		if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
			return xForwardedFor.split(",")[0].trim();
		}
		return request.getRemoteAddr();
	}
}
