import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'No credential provided' });

    // Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ googleId });
    if (!user) {
      user = new User({ googleId, email, name, picture, streak: 1, lastLogin: new Date() });
      await user.save();
    } else {
      // Check streak logic (simplified: if last login was > 24h but < 48h ago)
      const now = new Date();
      if (user.lastLogin) {
        const diffHours = (now - user.lastLogin) / (1000 * 60 * 60);
        if (diffHours >= 24 && diffHours < 48) {
          user.streak += 1;
        } else if (diffHours >= 48) {
          user.streak = 1; // reset streak
        }
      }
      user.lastLogin = now;
      await user.save();
    }

    // Sign our own JWT
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user });
  } catch (error) {
    console.error('[auth/google]', error);
    res.status(401).json({ error: 'Authentication failed: ' + error.message });
  }
});

export default router;
