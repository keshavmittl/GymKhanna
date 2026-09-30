import mongoose from 'mongoose';

/**
 * RefreshToken — persisted refresh-session record.
 *
 * Raw tokens are NEVER stored here.  Only a SHA-256 hash of the opaque
 * token string is persisted so that a DB compromise does not leak
 * usable credentials.
 *
 * Fields
 * ──────
 * userId         → owner
 * tokenHash      → SHA-256(raw refresh token)
 * expiresAt      → absolute expiry date
 * revokedAt      → set when explicitly revoked (logout / rotation)
 * replacedById   → points to the successor token after rotation
 * createdAt      → auto (timestamps: true)
 * updatedAt      → auto (timestamps: true)
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL — auto-purge expired docs
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    replacedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RefreshToken',
      default: null,
    },
  },
  { timestamps: true },
);

// Virtual: is this session still usable?
refreshTokenSchema.virtual('isActive').get(function () {
  return !this.revokedAt && this.expiresAt > new Date();
});

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
export default RefreshToken;
