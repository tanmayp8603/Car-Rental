package com.carrentalsystem.utility;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public class DateTimeUtils {

	public static String getProperDateTimeFormatFromEpochTime(String epochTimeString) {

		long epochTimeMillis = Long.parseLong(epochTimeString);

		Instant instant = Instant.ofEpochMilli(epochTimeMillis);
		ZoneId zoneId = ZoneId.systemDefault();

		LocalDateTime localDateTime = LocalDateTime.ofInstant(instant, zoneId);

		
		String dateFormatPattern = "yyyy-MM-dd HH:mm:ss";

		
		String formattedDateTime = formatLocalDateTime(localDateTime, dateFormatPattern);

		
		System.out.println("Formatted DateTime: " + formattedDateTime);

		return formattedDateTime;
	}

	private static String formatLocalDateTime(LocalDateTime dateTime, String dateFormatPattern) {
		DateTimeFormatter formatter = DateTimeFormatter.ofPattern(dateFormatPattern);
		return dateTime.format(formatter);
	}

}
