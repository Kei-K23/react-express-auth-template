// Helper to get a cookie by name
export const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

export const setCookie = (
  name: string,
  value: string,
  minutes: number
): void => {
  const date = new Date();
  date.setTime(date.getTime() + minutes * 60 * 1000); // Convert minutes to milliseconds
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; path=/; expires=${date.toUTCString()}; Secure; SameSite=Strict`;
};
