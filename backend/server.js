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

const roomContentsCache = new Map();
const ROOM_CACHE_TTL_MS = 15 * 1000;

function getRoomContentsCacheKey(pin, folder, limit, offset) {
    return `${pin}:${folder || 'all'}:${limit}:${offset}`;
}

function getCachedRoomContents(pin, folder, limit, offset) {
    const cacheKey = getRoomContentsCacheKey(pin, folder, limit, offset);
    const cacheEntry = roomContentsCache.get(cacheKey);

    if (!cacheEntry) {
        return null;
    }

    if (Date.now() - cacheEntry.cachedAt > ROOM_CACHE_TTL_MS) {
        roomContentsCache.delete(cacheKey);
        return null;
    }

    return cacheEntry.payload;
}

function setCachedRoomContents(pin, folder, limit, offset, payload) {
    const cacheKey = getRoomContentsCacheKey(pin, folder, limit, offset);
    roomContentsCache.set(cacheKey, {
        cachedAt: Date.now(),
        payload
    });
}

function invalidateRoomContentsCache(pin) {
    const prefix = `${pin}:`;
    for (const cacheKey of roomContentsCache.keys()) {
        if (cacheKey.startsWith(prefix)) {
            roomContentsCache.delete(cacheKey);
        }
    }
}

const SYSTEM_ROOM_NAMES_BY_PIN = {
    guest: 'guest',
    hassaan: 'hassaan',
    zaid: 'zaid',
    '1234': 'guest',
    '2345': 'hassaan',
    '3456': 'zaid'
};

function getSystemRoomName(pin) {
    return SYSTEM_ROOM_NAMES_BY_PIN[String(pin || '').toLowerCase()] || null;
}

function normalizeRoomPayload(room) {
    return {
        pin: room.pin,
        name: room.room_name || room.name || getSystemRoomName(room.pin) || String(room.pin),
        createdAt: room.created_at || null
    };
}

function generateRandomPin(length = 6) {
    const min = 10 ** (length - 1);
    const max = (10 ** length) - 1;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

async function generateUniquePin() {
    for (let attempt = 0; attempt < 20; attempt += 1) {
        const candidatePin = generateRandomPin();
        const { data: existingRoom, error } = await supabase
            .from('rooms')
            .select('pin')
            .eq('pin', candidatePin)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!existingRoom) {
            return candidatePin;
        }
    }

    throw new Error('Failed to generate a unique room pin');
}

// ============ ROOM ENDPOINTS ============

// List all rooms
app.get('/api/rooms', async (req, res) => {
    try {
        const { data: rooms, error } = await supabase
            .from('rooms')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            throw error;
        }

        const normalizedRooms = (rooms || []).map(normalizeRoomPayload);
        res.json({ rooms: normalizedRooms });
    } catch (error) {
        console.error('Error listing rooms:', error);
        res.status(500).json({ error: 'Failed to list rooms' });
    }
});

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
        const requestedPin = String(req.body?.pin || '').trim();
        const roomNameInput = String(req.body?.roomName || '').trim();

        const pin = requestedPin || await generateUniquePin();
        const roomName = roomNameInput || getSystemRoomName(pin) || pin;

        if (pin.length < 4 || pin.length > 12) {
            return res.status(400).json({ error: 'PIN must be between 4 and 12 characters' });
        }

        // Check if room already exists
        const { data: existing, error: existingError } = await supabase
            .from('rooms')
            .select('pin')
            .eq('pin', pin)
            .maybeSingle();

        if (existingError) {
            throw existingError;
        }

        if (existing) {
            return res.status(400).json({ error: 'Room already exists' });
        }

        // Create room with name when available in schema.
        let createdRoom = null;
        let createError = null;

        ({ data: createdRoom, error: createError } = await supabase
            .from('rooms')
            .insert({ pin, room_name: roomName })
            .select('*')
            .single());

        if (createError && String(createError.message || '').toLowerCase().includes('room_name')) {
            ({ data: createdRoom, error: createError } = await supabase
                .from('rooms')
                .insert({ pin })
                .select('*')
                .single());
        }

        if (createError) throw createError;

        if (!createdRoom) {
            throw new Error('Room creation failed');
        }

        res.json({
            success: true,
            room: {
                ...normalizeRoomPayload(createdRoom),
                name: createdRoom.room_name || roomName
            }
        });
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ error: 'Failed to create room' });
    }
});

// Get room contents
app.get('/api/rooms/:pin/contents', async (req, res) => {
    try {
        const { pin } = req.params;
        const { folder } = req.query;
        const parsedLimit = Number.parseInt(req.query.limit, 10);
        const parsedOffset = Number.parseInt(req.query.offset, 10);
        const limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20;
        const offset = Number.isInteger(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;
        const upperBound = offset + limit - 1;

        const cachedContents = getCachedRoomContents(pin, folder, limit, offset);
        if (cachedContents) {
            return res.json(cachedContents);
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

        const applyFolderFilter = (query) => {
            if (!folder) {
                return query;
            }

            // For guest folder, include items with NULL folder (backward compatibility)
            if (folder === 'guest') {
                return query.or('folder.eq.guest,folder.is.null');
            }

            return query.eq('folder', folder);
        };

        const [filesCountResult, textsCountResult, filesResult, textsResult] = await Promise.all([
            applyFolderFilter(
                supabase
                    .from('files')
                    .select('id', { count: 'exact', head: true })
                    .eq('room_pin', pin)
            ),
            applyFolderFilter(
                supabase
                    .from('texts')
                    .select('id', { count: 'exact', head: true })
                    .eq('room_pin', pin)
            ),
            applyFolderFilter(
                supabase
                    .from('files')
                    .select('id,original_name,size,uploaded_at')
                    .eq('room_pin', pin)
            )
                .order('uploaded_at', { ascending: false })
                .range(0, upperBound),
            applyFolderFilter(
                supabase
                    .from('texts')
                    .select('*')
                    .eq('room_pin', pin)
            )
                .order('uploaded_at', { ascending: false })
                .range(0, upperBound)
        ]);

        if (filesCountResult.error) throw filesCountResult.error;
        if (textsCountResult.error) throw textsCountResult.error;
        if (filesResult.error) throw filesResult.error;
        if (textsResult.error) throw textsResult.error;

        const files = filesResult.data || [];
        const texts = textsResult.data || [];

        // Normalize and merge by uploadedAt so offset/limit apply across all room items.
        const mergedItems = [
            ...files.map(file => ({
                itemType: 'file',
                sortTimestamp: file.uploaded_at,
                data: {
                    id: file.id,
                    originalName: file.original_name,
                    size: file.size
                }
            })),
            ...texts.map(text => ({
                itemType: 'text',
                sortTimestamp: text.uploaded_at,
                data: {
                    ...text,
                    uploadedBy: text.uploaded_by,
                    uploadedAt: text.uploaded_at,
                    folder: text.folder
                }
            }))
        ]
            .sort((a, b) => new Date(b.sortTimestamp).getTime() - new Date(a.sortTimestamp).getTime())
            .slice(offset, offset + limit);

        const filesWithUrls = mergedItems
            .filter(item => item.itemType === 'file')
            .map(item => item.data);

        const textsFormatted = mergedItems
            .filter(item => item.itemType === 'text')
            .map(item => item.data);

        const totalCount = (filesCountResult.count || 0) + (textsCountResult.count || 0);

        const responsePayload = {
            files: filesWithUrls,
            texts: textsFormatted,
            totalCount,
            limit,
            offset
        };

        setCachedRoomContents(pin, folder, limit, offset, responsePayload);
        res.json(responsePayload);
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
        const folder = String(req.body?.folder || 'general').trim() || 'general';
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
        const storagePath = `${pin}/${folder}/${fileId}.${fileExt}`;

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
                folder: folder,
                original_name: file.originalname,
                file_type: file.mimetype,
                size: file.size,
                storage_path: storagePath,
                uploaded_by: 'Anonymous'
            })
            .select()
            .single();

        if (dbError) throw dbError;

        invalidateRoomContentsCache(pin);

        const responseFile = {
            id: fileData.id,
            originalName: fileData.original_name,
            size: fileData.size,
            folder: fileData.folder
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

        invalidateRoomContentsCache(roomPin);

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
        const content = req.body?.content;
        const folder = String(req.body?.folder || 'general').trim() || 'general';

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
                folder: folder,
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
            uploadedAt: text.uploaded_at,
            folder: text.folder
        };

        invalidateRoomContentsCache(pin);

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

        invalidateRoomContentsCache(roomPin);

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
