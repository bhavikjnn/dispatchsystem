/**
 * Test script for login hours validation
 * Run with: npx tsx scripts/test-login-hours.ts
 */

// Simulate the isWithinAllowedHours function
function isWithinAllowedHours(allowedLoginHours?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
}): boolean {
    if (!allowedLoginHours || !allowedLoginHours.enabled) {
        return true;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = allowedLoginHours.startTime
        .split(":")
        .map(Number);
    const [endHour, endMinute] = allowedLoginHours.endTime
        .split(":")
        .map(Number);

    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    if (endTimeInMinutes < startTimeInMinutes) {
        return (
            currentTimeInMinutes >= startTimeInMinutes ||
            currentTimeInMinutes <= endTimeInMinutes
        );
    }

    return (
        currentTimeInMinutes >= startTimeInMinutes &&
        currentTimeInMinutes <= endTimeInMinutes
    );
}

// Test cases
console.log("=== Login Hours Validation Tests ===\n");

const now = new Date();
const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
console.log(`Current time: ${currentTime}\n`);

// Test 1: No restrictions
console.log("Test 1: No restrictions (undefined)");
console.log("Result:", isWithinAllowedHours(undefined));
console.log("Expected: true\n");

// Test 2: Restrictions disabled
console.log("Test 2: Restrictions disabled");
console.log(
    "Result:",
    isWithinAllowedHours({
        enabled: false,
        startTime: "09:00",
        endTime: "17:00",
    })
);
console.log("Expected: true\n");

// Test 3: Standard business hours (9 AM - 5 PM)
console.log("Test 3: Business hours (09:00 - 17:00)");
const businessHours = isWithinAllowedHours({
    enabled: true,
    startTime: "09:00",
    endTime: "17:00",
});
console.log("Result:", businessHours);
console.log(`Expected: ${now.getHours() >= 9 && now.getHours() < 17}\n`);

// Test 4: Overnight shift (10 PM - 6 AM)
console.log("Test 4: Overnight shift (22:00 - 06:00)");
const overnightShift = isWithinAllowedHours({
    enabled: true,
    startTime: "22:00",
    endTime: "06:00",
});
console.log("Result:", overnightShift);
const hour = now.getHours();
console.log(`Expected: ${hour >= 22 || hour < 6}\n`);

// Test 5: Early morning shift (6 AM - 2 PM)
console.log("Test 5: Early morning shift (06:00 - 14:00)");
const morningShift = isWithinAllowedHours({
    enabled: true,
    startTime: "06:00",
    endTime: "14:00",
});
console.log("Result:", morningShift);
console.log(`Expected: ${hour >= 6 && hour < 14}\n`);

// Test 6: Late shift (2 PM - 10 PM)
console.log("Test 6: Late shift (14:00 - 22:00)");
const lateShift = isWithinAllowedHours({
    enabled: true,
    startTime: "14:00",
    endTime: "22:00",
});
console.log("Result:", lateShift);
console.log(`Expected: ${hour >= 14 && hour < 22}\n`);

// Test 7: 24/7 access (00:00 - 23:59)
console.log("Test 7: 24/7 access (00:00 - 23:59)");
const allDay = isWithinAllowedHours({
    enabled: true,
    startTime: "00:00",
    endTime: "23:59",
});
console.log("Result:", allDay);
console.log("Expected: true\n");

console.log("=== Tests Complete ===");
