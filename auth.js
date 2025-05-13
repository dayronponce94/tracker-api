const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('apollo-server-express');

const router = express.Router();

router.use(cors({
  origin: 'http://localhost:8000',
  credentials: true
}));

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-unsafe';
const client = new OAuth2Client(CLIENT_ID);

router.use((req, res, next) => {
  next();
});

router.get('/auth/user', (req, res) => {
  try {
    const token = req.cookies.jwt;
    if (!token) return res.json({ signedIn: false });

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json(decoded);
  } catch (error) {
    res.clearCookie('jwt');
    res.json({ signedIn: false });
  }
});

router.post('/auth/google', async (req, res) => {
  const { credential } = req.body;
  try {
    const userData = await verifyToken(credential);
    
    const user = {
      signedIn: true,
      givenName: userData.given_name,
      email: userData.email,
      picture: userData.picture
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 3600000
    });

    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
});

router.post('/auth/signout', (req, res) => {
  res.clearCookie('jwt');
  res.json({ success: true });
});

async function verifyToken(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    
    if (!payload.email_verified) throw new Error('Google email not verified');
    return payload;
  } catch (error) {
    throw error;
  }
}


function getUser(req) {
  const token = req.cookies?.jwt;
  if (!token) return { signedIn: false };

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return { signedIn: true, givenName: payload.givenName };
  } catch (err) {
    return { signedIn: false };
  }
}


function mustBeSignedIn(resolver) {
  return (root, args, context) => {
    if (!context.user?.signedIn) {
      throw new AuthenticationError('You must be signed in');
    }
    return resolver(root, args, context);
  };
}

module.exports = { 
  router, 
  getUser, 
  mustBeSignedIn 
};
