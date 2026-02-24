import express from 'express';
import db from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { item_id, type, amount } = req.body;
    
    if (!['inbound', 'outbound'].includes(type)) {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }

    // Verify item belongs to user
    const itemStmt = db.prepare('SELECT * FROM items WHERE id = ? AND user_id = ?');
    const item = itemStmt.get(item_id, userId) as any;
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Update item quantity/weight
    const currentAmount = item.weight !== null ? item.weight : item.quantity;
    let newAmount = currentAmount;
    
    if (type === 'inbound') {
      newAmount += amount;
    } else if (type === 'outbound') {
      newAmount -= amount;
      if (newAmount < 0) newAmount = 0;
    }

    const updateStmt = db.prepare(`
      UPDATE items 
      SET ${item.weight !== null ? 'weight' : 'quantity'} = ? 
      WHERE id = ?
    `);
    updateStmt.run(newAmount, item_id);

    // Record transaction
    const transStmt = db.prepare(`
      INSERT INTO transactions (item_id, user_id, type, amount)
      VALUES (?, ?, ?, ?)
    `);
    const info = transStmt.run(item_id, userId, type, amount);

    res.status(201).json({ id: info.lastInsertRowid, newAmount });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:item_id', (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const itemId = req.params.item_id;
    
    const stmt = db.prepare(`
      SELECT * FROM transactions 
      WHERE item_id = ? AND user_id = ? 
      ORDER BY timestamp DESC
    `);
    const transactions = stmt.all(itemId, userId);
    
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
