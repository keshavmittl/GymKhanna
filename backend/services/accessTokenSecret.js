export function getAccessTokenSecret() {
  return process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
}
