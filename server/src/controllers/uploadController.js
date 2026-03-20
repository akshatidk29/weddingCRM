import fs from 'fs';
import path from 'path';
import Task from '../models/Task.js';
import Event from '../models/Event.js';

// @desc    Upload document to a task
// @route   POST /api/upload/task/:taskId
export const uploadToTask = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      // Clean up uploaded file if task not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Task not found' });
    }

    const newDoc = {
      name: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      uploadedBy: req.user._id
    };

    task.documents.push(newDoc);
    await task.save();

    await task.populate('documents.uploadedBy', 'name');
    res.status(200).json({ task, document: task.documents[task.documents.length - 1] });
  } catch (error) {
    console.error('Upload to Task Error:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Server error during upload' });
  }
};

// @desc    Upload document to an event
// @route   POST /api/upload/event/:eventId
export const uploadToEvent = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Event not found' });
    }

    const newDoc = {
      name: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      uploadedBy: req.user._id
    };

    event.documents.push(newDoc);
    await event.save();

    await event.populate('documents.uploadedBy', 'name');
    res.status(200).json({ event, document: event.documents[event.documents.length - 1] });
  } catch (error) {
    console.error('Upload to Event Error:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Server error during upload' });
  }
};

// Helper function to remove file from fs
const removeFile = (fileUrl) => {
  const filePath = path.join(process.cwd(), fileUrl);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// @desc    Delete document from a task
// @route   DELETE /api/upload/task/:taskId/:docId
export const deleteFromTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const docIndex = task.documents.findIndex(d => d._id.toString() === req.params.docId);
    if (docIndex === -1) return res.status(404).json({ message: 'Document not found' });

    removeFile(task.documents[docIndex].url);
    task.documents.splice(docIndex, 1);
    await task.save();

    res.status(200).json({ message: 'Document deleted successfully', task });
  } catch (error) {
    console.error('Delete from Task Error:', error);
    res.status(500).json({ message: 'Server error during deletion' });
  }
};

// @desc    Delete document from an event
// @route   DELETE /api/upload/event/:eventId/:docId
export const deleteFromEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const docIndex = event.documents.findIndex(d => d._id.toString() === req.params.docId);
    if (docIndex === -1) return res.status(404).json({ message: 'Document not found' });

    removeFile(event.documents[docIndex].url);
    event.documents.splice(docIndex, 1);
    await event.save();

    res.status(200).json({ message: 'Document deleted successfully', event });
  } catch (error) {
    console.error('Delete from Event Error:', error);
    res.status(500).json({ message: 'Server error during deletion' });
  }
};
