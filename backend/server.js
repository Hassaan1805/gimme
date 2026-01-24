import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase.js';

const app = express();
const httpServer = createServer(app);

// CORS Configuration
const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:5173'];

app.use(cors({ origin: corsOrigins }));
app.use(express.json());

// Socket.io setup
const io = new Server(httpServer, {
    cors: {
        origin: corsOrigins,
        methods: ['GET', 'POST']
    }
});

// Multer - memory storage for Supabase upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// ============ ROOM ENDPOINTS ============

// Check if room exists
app.get('/api/rooms/:pin', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('rooms')
            .select('pin')
            .eq('pin', req.params.pin)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        res.json({ exists: !!data });
    } catch (error) {
        console.error('Error checking room:', error);
        res.status(500).json({ error: 'Failed to check room' });
    }
});

// Create room
app.post('/api/rooms', async (req, res) => {
    try {
        const { pin } = req.body;

        if (!pin || pin.length < 4) {
            return res.status(400).json({ error: 'PIN must be at least 4 characters' });
        }

        // Check if room already exists
        const { data: existing } = await supabase
            .from('rooms')
            .select('pin')
            .eq('pin', pin)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Room already exists' });
        }

        // Create room
        const { error } = await supabase
            .from('rooms')
            .insert({ pin });

        if (error) throw error;

        res.json({ success: true, pin });
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ error: 'Failed to create room' });
    }
});

// Get room contents
app.get('/api/rooms/:pin/contents', async (req, res) => {
    try {
        const { pin } = req.params;

        // Verify room exists
        const { data: room } = await supabase
            .from('rooms')
            .select('pin')
            .eq('pin', pin)
            .single();

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Get files
        const { data: files, error: filesError } = await supabase
            .from('files')
            .select('*')
            .eq('room_pin', pin)
            .order('uploaded_at', { ascending: false });

        if (filesError) throw filesError;

        // Get texts
        const { data: texts, error: textsError } = await supabase
            .from('texts')
            .select('*')
            .eq('room_pin', pin)
            .order('uploaded_at', { ascending: false });

        if (textsError) throw textsError;

        // Add public URLs to files
        const filesWithUrls = files.map(file => ({
            ...file,
            originalName: file.original_name,
            fileType: file.file_type,
            uploadedBy: file.uploaded_by,
            uploadedAt: file.uploaded_at
        }));

        const textsFormatted = texts.map(text => ({
            ...text,
            uploadedBy: text.uploaded_by,
            uploadedAt: text.uploaded_at
        }));

        res.json({ files: filesWithUrls, texts: textsFormatted });
    } catch (error) {
        console.error('Error getting room contents:', error);
        res.status(500).json({ error: 'Failed to get room contents' });
    }
});

// ============ FILE ENDPOINTS ============

// Upload file
app.post('/api/rooms/:pin/files', upload.single('file'), async (req, res) => {
    try {
        const { pin } = req.params;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Verify room exists
        const { data: room } = await supabase
            .from('rooms')
            .select('pin')
            .eq('pin', pin)
            .single();

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Generate unique filename
        const fileId = uuidv4();
        const fileExt = file.originalname.split('.').pop();
        const storagePath = `${pin}/${fileId}.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(storagePath, file.buffer, {
                contentType: file.mimetype
            });

        if (uploadError) throw uploadError;

        // Save file metadata to database
        const { data: fileData, error: dbError } = await supabase
            .from('files')
            .insert({
                id: fileId,
                room_pin: pin,
                original_name: file.originalname,
                file_type: file.mimetype,
                size: file.size,
                storage_path: storagePath,
                uploaded_by: 'Anonymous'
            })
            .select()
            .single();

        if (dbError) throw dbError;

        const responseFile = {
            id: fileData.id,
            originalName: fileData.original_name,
            fileType: fileData.file_type,
            size: fileData.size,
            uploadedBy: fileData.uploaded_by,
            uploadedAt: fileData.uploaded_at,
            storage_path: fileData.storage_path
        };

        // Emit socket event
        io.to(pin).emit('file-added', responseFile);

        res.json(responseFile);
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Get file (preview/download)
app.get('/api/files/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;

        // Get file metadata
        const { data: file, error } = await supabase
            .from('files')
            .select('*')
            .eq('id', fileId)
            .single();

        if (error || !file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Get signed URL for download
        const { data: urlData, error: urlError } = await supabase.storage
            .from('uploads')
            .createSignedUrl(file.storage_path, 3600); // 1 hour expiry

        if (urlError) throw urlError;

        res.json({
            url: urlData.signedUrl,
            originalName: file.original_name,
            fileType: file.file_type
        });
    } catch (error) {
        console.error('Error getting file:', error);
        res.status(500).json({ error: 'Failed to get file' });
    }
});

// Download file (redirect to signed URL)
app.get('/api/files/:fileId/download', async (req, res) => {
    try {
        const { fileId } = req.params;

        const { data: file, error } = await supabase
            .from('files')
            .select('*')
            .eq('id', fileId)
            .single();

        if (error || !file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const { data: urlData, error: urlError } = await supabase.storage
            .from('uploads')
            .createSignedUrl(file.storage_path, 3600);

        if (urlError) throw urlError;

        res.redirect(urlData.signedUrl);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

// Delete file
app.delete('/api/files/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;

        // Get file first
        const { data: file, error: getError } = await supabase
            .from('files')
            .select('*')
            .eq('id', fileId)
            .single();

        if (getError || !file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const roomPin = file.room_pin;

        // Delete from storage
        await supabase.storage
            .from('uploads')
            .remove([file.storage_path]);

        // Delete from database
        const { error: deleteError } = await supabase
            .from('files')
            .delete()
            .eq('id', fileId);

        if (deleteError) throw deleteError;

        // Emit socket event
        io.to(roomPin).emit('file-deleted', fileId);

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// ============ TEXT ENDPOINTS ============

// Add text
app.post('/api/rooms/:pin/texts', async (req, res) => {
    try {
        const { pin } = req.params;
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Content is required' });
        }

        // Verify room exists
        const { data: room } = await supabase
            .from('rooms')
            .select('pin')
            .eq('pin', pin)
            .single();

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        const { data: text, error } = await supabase
            .from('texts')
            .insert({
                room_pin: pin,
                content: content.trim(),
                uploaded_by: 'Anonymous'
            })
            .select()
            .single();

        if (error) throw error;

        const responseText = {
            id: text.id,
            content: text.content,
            uploadedBy: text.uploaded_by,
            uploadedAt: text.uploaded_at
        };

        io.to(pin).emit('text-added', responseText);

        res.json(responseText);
    } catch (error) {
        console.error('Error adding text:', error);
        res.status(500).json({ error: 'Failed to add text' });
    }
});

// Delete text
app.delete('/api/texts/:textId', async (req, res) => {
    try {
        const { textId } = req.params;

        // Get text first to get room pin
        const { data: text, error: getError } = await supabase
            .from('texts')
            .select('room_pin')
            .eq('id', textId)
            .single();

        if (getError || !text) {
            return res.status(404).json({ error: 'Text not found' });
        }

        const roomPin = text.room_pin;

        const { error } = await supabase
            .from('texts')
            .delete()
            .eq('id', textId);

        if (error) throw error;

        io.to(roomPin).emit('text-deleted', textId);

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting text:', error);
        res.status(500).json({ error: 'Failed to delete text' });
    }
});

// ============ SOCKET.IO ============

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-room', (pin) => {
        socket.join(pin);
        console.log(`Socket ${socket.id} joined room ${pin}`);
    });

    socket.on('leave-room', (pin) => {
        socket.leave(pin);
        console.log(`Socket ${socket.id} left room ${pin}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// ============ START SERVER ============

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`CORS origins: ${corsOrigins.join(', ')}`);
});
