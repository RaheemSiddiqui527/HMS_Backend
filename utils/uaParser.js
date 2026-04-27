export const parseUA = (ua) => {
  const result = {
    browser: "Unknown",
    os: "Unknown",
    device: "Desktop",
  };

  if (!ua) return result;

  // Browser detection
  if (ua.includes("Firefox")) result.browser = "Firefox";
  else if (ua.includes("SamsungBrowser")) result.browser = "Samsung Browser";
  else if (ua.includes("Opera") || ua.includes("OPR")) result.browser = "Opera";
  else if (ua.includes("Trident")) result.browser = "Internet Explorer";
  else if (ua.includes("Edge")) result.browser = "Edge";
  else if (ua.includes("Chrome")) result.browser = "Chrome";
  else if (ua.includes("Safari")) result.browser = "Safari";

  // OS detection
  if (ua.includes("Windows")) result.os = "Windows";
  else if (ua.includes("Android")) result.os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iPod")) result.os = "iOS";
  else if (ua.includes("Mac OS X")) result.os = "macOS";
  else if (ua.includes("Linux")) result.os = "Linux";

  // Device detection
  if (ua.includes("Mobi")) result.device = "Mobile";
  if (ua.includes("Tablet") || ua.includes("iPad")) result.device = "Tablet";

  return result;
};
