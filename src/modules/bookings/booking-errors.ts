/*
 * Errors the booking flow throws and the routes turn into HTTP answers.
 * Plain classes, no server-only imports, so client code can use them in tests.
 */

/** The thing asked for does not exist, or is not on the site. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

/** The request is well formed but the content is not allowed (a bad date, a missing field). */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** The requested dates are already taken. Routes answer 409 so the page can reload the calendar. */
export class DatesUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatesUnavailableError";
  }
}
