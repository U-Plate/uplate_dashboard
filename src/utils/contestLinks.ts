const CONTEST_BASE_URL = 'https://contest.u-plate.com/';

/** Builds a contest join link, optionally attributed to a referrer. */
export function buildContestLink(contestId: number, referredByEmail?: string): string {
  const url = new URL(CONTEST_BASE_URL);
  url.searchParams.set('contestId', String(contestId));
  if (referredByEmail) {
    url.searchParams.set('referredBy', referredByEmail);
  }
  return url.toString();
}

/** Builds the link people use to sign up as a referrer for a referral contest. */
export function buildReferrerSignupLink(contestId: number): string {
  const url = new URL('refer', CONTEST_BASE_URL);
  url.searchParams.set('contestId', String(contestId));
  return url.toString();
}
