/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'aynkaran-secret-desktop-token-key-2026';

// Multi-tenant high density authentication controller matched with admin accounts using MongoDB Atlas
export class AuthController {
  constructor(db) {
    this.db = db;
  }

  login = async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password credentials are required.' });
      }

      // Default fallback local desktop root administrator
      if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign(
          { id: 'usr-admin', username: 'admin', role: 'SuperAdmin' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        return res.json({
          success: true,
          token,
          user: { id: 'usr-admin', username: 'admin', role: 'SuperAdmin', displayName: 'Aynkaran Admin' }
        });
      }

      // Query database user structures if customized in MongoDB
      const user = await this.db.collection('users').findOne({ username });
      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid operation system credentials.' });
      }

      const token = jwt.sign(
        { id: user.id || user._id.toString(), username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        user: { id: user.id || user._id.toString(), username: user.username, role: user.role, displayName: user.displayName }
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };

  verifyToken = async (req, res) => {
    res.json({ success: true, user: req.user });
  };
}
