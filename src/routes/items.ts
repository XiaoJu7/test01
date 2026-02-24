import express from 'express';
import db from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const stmt = db.prepare('SELECT * FROM items WHERE user_id = ? ORDER BY expiration_date ASC');
    const items = stmt.all(userId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { name, category, production_date, expiration_date, weight, quantity, unit } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO items (user_id, name, category, production_date, expiration_date, weight, quantity, unit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(userId, name, category, production_date, expiration_date, weight || null, quantity || null, unit);
    
    // Record initial inbound transaction
    const transStmt = db.prepare(`
      INSERT INTO transactions (item_id, user_id, type, amount)
      VALUES (?, ?, 'inbound', ?)
    `);
    transStmt.run(info.lastInsertRowid, userId, weight || quantity);

    res.status(201).json({ id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const itemId = req.params.id;
    const { name, category, production_date, expiration_date, weight, quantity, unit } = req.body;
    
    const stmt = db.prepare(`
      UPDATE items 
      SET name = ?, category = ?, production_date = ?, expiration_date = ?, weight = ?, quantity = ?, unit = ?
      WHERE id = ? AND user_id = ?
    `);
    
    const info = stmt.run(name, category, production_date, expiration_date, weight || null, quantity || null, unit, itemId, userId);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Item not found or unauthorized' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const itemId = req.params.id;
    
    const stmt = db.prepare('DELETE FROM items WHERE id = ? AND user_id = ?');
    const info = stmt.run(itemId, userId);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Item not found or unauthorized' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
