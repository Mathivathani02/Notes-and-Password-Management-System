const express = require('express');
const router = express.Router();
const storageService = require('../services/storageService');
const { requireAuth } = require('./authRoutes');
// Protect notes endpoints
router.use(requireAuth);
/**
 * GET /api/notes
 */
router.get('/', (req, res) => {
  const notes = storageService.getNotes();
  res.json({
    success: true,
    count: notes.length,
    data: notes
  });
});
/**
 * POST /api/notes
 */
router.post('/', (req, res) => {
  const { title, content, category, tags, pinned } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: 'Note title is required.' });
  }
  const created = storageService.addNote({ title, content, category, tags, pinned });
  res.status(201).json({
    success: true,
    message: 'Note created successfully.',
    data: created
  });
});
/**
 * PUT /api/notes/:id
 */
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const updated = storageService.updateNote(id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Note not found.' });
  }
  res.json({
    success: true,
    message: 'Note updated successfully.',
    data: updated
  });
});
/**
 * PATCH /api/notes/:id/pin
 */
router.patch('/:id/pin', (req, res) => {
  const { id } = req.params;
  const note = storageService.toggleNotePin(id);
  if (!note) {
    return res.status(404).json({ success: false, error: 'Note not found.' });
  }
  res.json({
    success: true,
    data: note
  });
});
/**
 * DELETE /api/notes/:id
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const deleted = storageService.deleteNote(id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Note not found.' });
  }
  res.json({
    success: true,
    message: 'Note deleted successfully.'
  });
});
module.exports = router;
