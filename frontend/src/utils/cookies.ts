// Cookie utility functions for token management

export interface CookieOptions {
  expires?: Date;
  maxAge?: number; // seconds
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  httpOnly?: boolean;
}

export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.expires) {
    cookieString += `; expires=${options.expires.toUTCString()}`;
  }

  if (options.maxAge !== undefined) {
    cookieString += `; max-age=${options.maxAge}`;
  }

  if (options.path) {
    cookieString += `; path=${options.path}`;
  }

  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  if (options.secure) {
    cookieString += `; secure`;
  }

  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }

  // Note: httpOnly cannot be set from JavaScript for security reasons
  // It must be set server-side

  document.cookie = cookieString;
}

export function getCookie(name: string): string | null {
  const nameEQ = encodeURIComponent(name) + "=";
  const ca = document.cookie.split(";");

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") {
      c = c.substring(1, c.length);
    }
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }

  return null;
}

export function removeCookie(
  name: string,
  path: string = "/",
  domain?: string
): void {
  const options: CookieOptions = {
    expires: new Date(0),
    path,
  };

  if (domain) {
    options.domain = domain;
  }

  setCookie(name, "", options);
}

// Token-specific cookie functions
const TOKEN_COOKIE_NAME = "access_token";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 8; // 8 days (same as backend)

export function setTokenCookie(token: string): void {
  setCookie(TOKEN_COOKIE_NAME, token, {
    maxAge: TOKEN_MAX_AGE,
    path: "/",
    secure: process.env.NODE_ENV === "production", // Only secure in production
    sameSite: "lax", // Good balance of security and functionality
  });
}

export function getTokenCookie(): string | null {
  return getCookie(TOKEN_COOKIE_NAME);
}

export function removeTokenCookie(): void {
  removeCookie(TOKEN_COOKIE_NAME);
}
