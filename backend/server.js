require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const NodeClam = require('clamscan'); // <-- ADD THIS
const fs = require('fs');
const path = require('path');
const si = require('systeminformation');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase Backend Client with God-Mode Key
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// --- GLOBAL SECURITY AUDIT LOGGER ---
const logAudit = async (userId, actionType, description, req) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
        await supabase.from('audit_logs').insert([{
            user_id: userId || null,
            action_type: actionType,
            description: description,
            ip_address: ip
        }]);
    } catch (error) {
        console.error("Failed to write audit log:", error);
    }
};

// --- 1. INDUSTRY STANDARD SECURITY MIDDLEWARE ---
// Explicitly allow your React app to talk to this server
// Explicitly allow both Localhost and the Live Domain
app.use(cors({
    origin: ['http://localhost:5173', 'https://victusg2.me', 'https://www.victusg2.me'],
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    credentials: true
}));

// Relax Helmet for local development so it doesn't block images/files
app.use(helmet({
    crossOriginResourcePolicy: false,
}));

app.use(express.json()); // Parses JSON data

// Rate Limiting (Prevents DDoS and spam)
// Ensure the 'uploads' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure where and how files are saved
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // We will organize files by User ID
        const userFolder = path.join(uploadDir, req.body.userId || 'anonymous');
        if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder, { recursive: true });
        cb(null, userFolder);
    },
    filename: (req, file, cb) => {
        // Create a unique filename so files with the same name don't overwrite
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

// --- CLAMAV ANTI-VIRUS ENGINE INITIALIZATION ---
let clamscan;
new NodeClam().init({
    removeInfected: true, // Automatically delete infected files
    quarantineInfected: false,
    scanLog: null,
    debugMode: false,
    fileList: null,
    scanRecursively: true,
    clamdscan: {
        socket: '/var/run/clamav/clamd.ctl',
        host: '127.0.0.1',
        port: 3310,
        timeout: 60000,
        localFallback: true,
        path: '/usr/bin/clamdscan',
        configFile: null,
        multiscan: true,
        reloadDb: false,
        active: true,
        bypassTest: false,
    },
    preference: 'clamdscan' // Use the fast background daemon we just installed
}).then(instance => {
    clamscan = instance;
    console.log("🛡️ ClamAV Engine Initialized Successfully.");
}).catch(err => {
    console.error("⚠️ ClamAV Failed to Initialize:", err.message);
});

// --- FILE UPLOAD SETUP (MULTER) ---
const upload = multer({ 
    storage: storage,
    // Removed the manual fileFilter! ClamAV handles the security now.
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit per individual file upload
});

// --- 3. API ROUTES ---

// Route: Server Health Stats (For your Admin Panel later)
app.get('/api/stats', async (req, res) => {
    try {
        const cpu = await si.currentLoad();
        const mem = await si.mem();
        const disk = await si.fsSize();
        
        res.json({
            cpuUsage: cpu.currentLoad.toFixed(2),
            ramTotal: (mem.total / 1024 / 1024 / 1024).toFixed(2), // GB
            ramUsed: (mem.used / 1024 / 1024 / 1024).toFixed(2),   // GB
            diskTotal: disk[0] ? (disk[0].size / 1024 / 1024 / 1024).toFixed(2) : 0, // GB
            diskUsed: disk[0] ? (disk[0].used / 1024 / 1024 / 1024).toFixed(2) : 0,  // GB
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch server stats" });
    }
});

// Route: Upload a File (Wrapped to catch Multer Security Errors)
app.post('/api/upload', (req, res) => {
    upload.single('file')(req, res, async (err) => {
        // 1. Check for Security or Size limits from Multer FIRST
        if (err instanceof multer.MulterError) {
            logAudit(req.body.userId, 'UPLOAD_FAILED', `Multer Error: ${err.message}`, req); // <-- ADD THIS
            return res.status(400).json({ error: `Upload Error: ${err.message}` });
        } else if (err) {
            // This catches our custom Anti-Malware throw Error()!
            logAudit(req.body.userId, 'MALWARE_BLOCKED', `Security Violation: Blocked malicious upload attempt`, req); // <-- ADD THIS
            return res.status(403).json({ error: err.message });
        }

        try {
            const { userId } = req.body;
        const file = req.file;

        if (!file || !userId) {
            return res.status(400).json({ error: "File and User ID are required." });
        }

        // 🛡️ INITIATE CLAMAV DEEP SCAN
        if (clamscan) {
            try {
                const { isInfected, viruses } = await clamscan.isInfected(file.path);
                if (isInfected) {
                    // Forcefully delete the file (just in case the daemon didn't)
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                    
                    // Log the massive security violation!
                    logAudit(userId, 'MALWARE_BLOCKED', `Anti-Virus triggered! Threat: ${viruses.join(', ')}`, req);
                    
                    return res.status(403).json({ error: `Malware Detected! File deleted. Threat: ${viruses.join(', ')}` });
                }
            } catch (scanError) {
                console.error("ClamAV Scan Error:", scanError);
                // Fail-Safe: If the scanner crashes, block the upload to be safe!
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                return res.status(500).json({ error: "Anti-Virus engine unavailable. Upload aborted for security." });
            }
        } else {
            console.warn("ClamAV is not loaded. Skipping deep scan.");
        }

        // 1. Check user's current storage and THEIR SPECIFIC max_storage
        const { data: profile } = await supabase
            .from('profiles')
            .select('storage_used, max_storage, role')
            .eq('id', userId)
            .single();

        const currentStorage = profile?.storage_used || 0;
        // Use their DB limit, or fallback to 1GB
        const MAX_STORAGE_LIMIT = profile?.max_storage || 1073741824; 

        // 2. Enforce Custom Quota limit (Unless they are an Admin!)
        if (profile?.role !== 'admin' && currentStorage + file.size > MAX_STORAGE_LIMIT) {
            // Delete the file we just downloaded because it exceeds the quota
            fs.unlinkSync(file.path); 
            return res.status(403).json({ error: `Storage limit exceeded! Max allowed: ${(MAX_STORAGE_LIMIT / (1024*1024*1024)).toFixed(1)}GB` });
        }

        // 3. Update Supabase Database
        const folderId = req.body.folderId === 'null' ? null : req.body.folderId; // Allow null for root

        // Add file record
        await supabase.from('files').insert([{
            user_id: userId,
            file_name: file.originalname,
            file_size: file.size,
            file_type: file.mimetype,
            file_path: file.path,
            folder_id: folderId // <-- ADD THIS
        }]);

        // Update user's total storage used
        await supabase.rpc('increment_storage', { 
            x: file.size, 
            row_id: userId 
        });

        res.json({ message: "File uploaded successfully!", file: file.originalname });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Server error during upload." });
        }
    });
});

// Route: Create a New Folder
app.post('/api/folders', async (req, res) => {
    try {
        const { userId, name, parentId } = req.body;
        if (!userId || !name) return res.status(400).json({ error: "Missing data" });

        const { data, error } = await supabase.from('folders').insert([{
            user_id: userId,
            name: name,
            parent_id: parentId || null
        }]).select().single();

        if (error) throw error;
        res.json({ message: "Folder created!", folder: data });
    } catch (error) {
        res.status(500).json({ error: "Failed to create folder." });
    }
});

// Route: Get Folders for a User (filtered by Parent ID)
app.get('/api/folders/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const parentId = req.query.parentId; // Optional query param

        let query = supabase.from('folders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        
        // If parentId is 'null', fetch root folders. Otherwise, fetch inside the specific folder.
        if (parentId === 'null' || !parentId) {
            query = query.is('parent_id', null);
        } else {
            query = query.eq('parent_id', parentId);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch folders" });
    }
});

        // Route: Admin Change User Storage Limit
app.post('/api/admin/set-limit', async (req, res) => {
    try {
        const { adminId, targetUserId, newLimitGB } = req.body;
        
        if (!adminId || !targetUserId || !newLimitGB) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // 1. Verify caller is an Admin
        const { data: adminUser } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', adminId)
            .single();

        if (adminUser?.role !== 'admin') {
            return res.status(403).json({ error: "Unauthorized. Admins only." });
        }

        // 2. Update target user's max_storage
        const limitInBytes = newLimitGB * 1024 * 1024 * 1024;
        
        const { error } = await supabase
            .from('profiles')
            .update({ max_storage: limitInBytes })
            .eq('id', targetUserId);

        if (error) throw error;
        
        res.json({ message: `Successfully updated storage limit to ${newLimitGB}GB` });
    } catch (error) {
        console.error("Admin set limit error:", error);
        res.status(500).json({ error: "Server error while updating limit" });
    }
});

// Route: Upload a Profile Picture (Avatar)
app.post('/api/avatar', (req, res) => {
    upload.single('avatar')(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message });
        try {
            const { userId } = req.body;
            if (!req.file || !userId) return res.status(400).json({ error: "Missing file or User ID" });

            // Create a public URL for the avatar
            const avatarUrl = `/api/view/avatars/${req.file.filename}`;

            // Save the URL to their Supabase profile
            await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId);

            res.json({ message: "Avatar updated!", avatar_url: avatarUrl });
        } catch (error) {
            res.status(500).json({ error: "Server error" });
        }
    });
});

// Route: View an Avatar (Bypasses RLS so everyone can see it)
app.get('/api/view/avatars/:filename', (req, res) => {
    // Search all user folders for this specific filename
    const uploadsPath = path.join(__dirname, 'uploads');
    const files = fs.readdirSync(uploadsPath, { withFileTypes: true });
    
    for (const dir of files) {
        if (dir.isDirectory()) {
            const possiblePath = path.join(uploadsPath, dir.name, req.params.filename);
            if (fs.existsSync(possiblePath)) {
                return res.sendFile(possiblePath);
            }
        }
    }
    res.status(404).send("Avatar not found");
});

// Route: Upload a GCash Receipt
app.post('/api/receipt', (req, res) => {
    upload.single('receipt')(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message });
        try {
            const { userId, requestedTier } = req.body;
            if (!req.file || !userId) return res.status(400).json({ error: "Missing file or data" });

            // Ensure it's an image
            if (!req.file.mimetype.includes('image')) {
                fs.unlinkSync(req.file.path);
                return res.status(400).json({ error: "Receipt must be an image." });
            }

            const receiptUrl = `/api/view/receipts/${req.file.filename}`;

            // Save request to Supabase
            const { error } = await supabase.from('upgrade_requests').insert([{
                user_id: userId,
                requested_tier: parseInt(requestedTier),
                receipt_url: receiptUrl
            }]);

            if (error) throw error;
            res.json({ message: "Receipt submitted for Admin review!" });
        } catch (error) {
            res.status(500).json({ error: "Server error" });
        }
    });
});

// Route: View a Receipt (Bypasses RLS so Admins can see it)
app.get('/api/view/receipts/:filename', (req, res) => {
    const uploadsPath = path.join(__dirname, 'uploads');
    const files = fs.readdirSync(uploadsPath, { withFileTypes: true });
    for (const dir of files) {
        if (dir.isDirectory()) {
            const possiblePath = path.join(uploadsPath, dir.name, req.params.filename);
            if (fs.existsSync(possiblePath)) return res.sendFile(possiblePath);
        }
    }
    res.status(404).send("Receipt not found");
});

// Route: Rename a File
app.put('/api/rename/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const { userId, newName } = req.body;

        // Verify ownership and update the database
        const { data, error } = await supabase
            .from('files')
            .update({ file_name: newName })
            .eq('id', fileId)
            .eq('user_id', userId) // Security check!
            .select()
            .single();

        if (error || !data) return res.status(403).json({ error: "Unauthorized or file not found" });

        res.json({ message: "File renamed successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to rename file" });
    }
});

// Route: Get Files (filtered by Folder ID)
app.get('/api/files/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const folderId = req.query.folderId;

        let query = supabase.from('files').select('*').eq('user_id', userId).order('upload_date', { ascending: false });
        
        if (folderId === 'null' || !folderId) {
            query = query.is('folder_id', null);
        } else {
            query = query.eq('folder_id', folderId);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch files" });
    }
});

// Route: Download a File
app.get('/api/download/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        
        // Find the file path in the database
        const { data: fileRecord, error } = await supabase
            .from('files')
            .select('file_path, file_name')
            .eq('id', fileId)
            .single();

        if (error || !fileRecord) return res.status(404).json({ error: "File not found" });

        // Send the physical file to the user's browser
        res.download(fileRecord.file_path, fileRecord.file_name);
    } catch (error) {
        res.status(500).json({ error: "Failed to download file" });
    }
});

// Route: View/Preview a File (For Thumbnails and In-Browser Viewing)
app.get('/api/view/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        
        const { data: fileRecord, error } = await supabase
            .from('files')
            .select('file_path, file_type')
            .eq('id', fileId)
            .single();

        if (error || !fileRecord) return res.status(404).send("File not found");

        // Set the content type so the browser knows it's an image/pdf
        res.contentType(fileRecord.file_type);
        // sendFile tells the browser to display it, not download it!
        res.sendFile(fileRecord.file_path);
    } catch (error) {
        res.status(500).send("Failed to view file");
    }
});

// Route: Delete a File
app.delete('/api/delete/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const { userId } = req.body; // Sent from frontend for security check

        // 1. Get file details
        const { data: fileRecord, error: fetchError } = await supabase
            .from('files')
            .select('*')
            .eq('id', fileId)
            .eq('user_id', userId) // Security: Ensure this user owns the file
            .single();

        if (fetchError || !fileRecord) return res.status(404).json({ error: "File not found or unauthorized" });

        // 2. Delete the physical file from the Ubuntu VM / Hard Drive
        if (fs.existsSync(fileRecord.file_path)) {
            fs.unlinkSync(fileRecord.file_path);
        }

        // 3. Delete the record from Supabase database
        await supabase.from('files').delete().eq('id', fileId);

        // 4. Refund the user's storage quota! (We send a negative number)
        await supabase.rpc('increment_storage', { 
            x: -Math.abs(fileRecord.file_size), 
            row_id: userId 
        });

        res.json({ message: "File deleted successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete file" });
    }
});

// --- 4. START SERVER ---
app.listen(PORT, () => {
    console.log(`🚀 VictusG2 Backend running on http://localhost:${PORT}`);
});

// ==========================================
// --- 5. GOD-MODE ADMIN ROUTES ---
// ==========================================

// Security Helper: Checks if the person requesting this is actually an Admin
const verifyAdmin = async (userId) => {
    if (!userId) return false;
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
    return data?.role === 'admin';
};

// Route: Get ALL files across the entire server
app.post('/api/admin/files', async (req, res) => {
    const { adminId } = req.body;
    if (!(await verifyAdmin(adminId))) return res.status(403).json({ error: "Unauthorized: Admins only" });

    // Fetch files and join the profile name of who uploaded it
    const { data, error } = await supabase
        .from('files')
        .select('*, profiles(full_name)')
        .order('upload_date', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Route: Promote or Demote a User
app.put('/api/admin/users/role', async (req, res) => {
    const { adminId, targetUserId, newRole } = req.body;
    if (!(await verifyAdmin(adminId))) return res.status(403).json({ error: "Unauthorized" });

    // 🛡️ SUPER ADMIN PROTECTION
    const { data: targetUser } = await supabase.from('profiles').select('role').eq('id', targetUserId).single();
    
    // Block the action IF the target is an Admin AND the person clicking the button is NOT the Root Owner!
    if (targetUser?.role === 'admin' && newRole === 'user' && adminId !== process.env.ROOT_ADMIN_ID) {
        logAudit(adminId, 'SECURITY_WARNING', `Attempted to unlawfully demote another Admin (ID: ${targetUserId})`, req);
        return res.status(403).json({ error: "Permission Denied: Only the Root Owner can demote Administrators." });
    }

    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', targetUserId);
    if (error) return res.status(500).json({ error: "Failed to update role" });
    
    // 📝 WRITE TO AUDIT LOG!
    logAudit(adminId, 'ROLE_CHANGED', `Changed user role to ${newRole.toUpperCase()}`, req);
    
    res.json({ message: `User is now an ${newRole}!` });
});

// Route: Upgrade/Downgrade User Storage Tier
app.put('/api/admin/users/storage', async (req, res) => {
    const { adminId, targetUserId, newStorageLimit } = req.body;
    if (!(await verifyAdmin(adminId))) return res.status(403).json({ error: "Unauthorized" });

    const { error } = await supabase.from('profiles').update({ max_storage: newStorageLimit }).eq('id', targetUserId);
    if (error) return res.status(500).json({ error: "Failed to update storage tier" });
    
    // Log the upgrade!
    logAudit(adminId, 'ACCOUNT_UPGRADED', `Admin changed user storage tier to ${(newStorageLimit / (1024*1024*1024)).toFixed(1)} GB`, req);
    
    res.json({ message: `User storage tier upgraded!` });
});

// Route: Delete ANY file from the server
app.delete('/api/admin/files/:fileId', async (req, res) => {
    const { adminId } = req.body;
    const { fileId } = req.params;
    if (!(await verifyAdmin(adminId))) return res.status(403).json({ error: "Unauthorized" });

    // Find the file
    const { data: fileRecord } = await supabase.from('files').select('*').eq('id', fileId).single();
    if (!fileRecord) return res.status(404).json({ error: "File not found" });

    // 1. Delete physical file from Ubuntu hard drive
    if (fs.existsSync(fileRecord.file_path)) fs.unlinkSync(fileRecord.file_path);

    // 2. Delete database record
    await supabase.from('files').delete().eq('id', fileId);
    
    // 3. Refund the storage quota to the user who owned it
    await supabase.rpc('increment_storage', { x: -Math.abs(fileRecord.file_size), row_id: fileRecord.user_id });

    res.json({ message: "File permanently deleted by Admin." });
});

// Route: WARN USER (Sends an in-app notification)
app.post('/api/admin/warn', async (req, res) => {
    const { adminId, targetUserId, message } = req.body;
    if (!(await verifyAdmin(adminId))) return res.status(403).json({ error: "Unauthorized" });

    try {
        // Use the God-Mode Service Key to bypass RLS and inject the notification
        const { error } = await supabase.from('notifications').insert([{
            user_id: targetUserId,
            title: '⚠️ Official Admin Warning',
            message: message
        }]);

        if (error) throw error;
        
        // Log the Warning!
        logAudit(adminId, 'USER_WARNED', `Admin sent warning to user ID: ${targetUserId} with message: ${message}`, req);

        res.json({ message: "Warning sent to user!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to send warning." });
    }
});

// Route: BAN USER (Wipes account, database rows, and physical files)
app.delete('/api/admin/users/:userId', async (req, res) => {
    const { adminId } = req.body;
    const targetUserId = req.params.userId;
    if (!(await verifyAdmin(adminId))) return res.status(403).json({ error: "Unauthorized" });

    // 🛡️ SUPER ADMIN PROTECTION
    const { data: targetUser } = await supabase.from('profiles').select('role').eq('id', targetUserId).single();
    
    // Block the ban IF the target is an Admin AND the person clicking the button is NOT the Root Owner!
    if (targetUser?.role === 'admin' && adminId !== process.env.ROOT_ADMIN_ID) {
        logAudit(adminId, 'SECURITY_WARNING', `Attempted to unlawfully BAN another Admin! (ID: ${targetUserId})`, req);
        return res.status(403).json({ error: "Permission Denied: Only the Root Owner can ban Administrators." });
    }

    try {
        const targetFolder = path.join(uploadDir, targetUserId);
        if (fs.existsSync(targetFolder)) fs.rmSync(targetFolder, { recursive: true, force: true });

        const { error } = await supabase.auth.admin.deleteUser(targetUserId);
        if (error) throw error;

        // 📝 WRITE TO AUDIT LOG!
        logAudit(adminId, 'USER_BANNED', `Admin banned and wiped user ID: ${targetUserId}`, req);

        res.json({ message: "User and all their files have been wiped." });
    } catch (error) {
        res.status(500).json({ error: "Failed to ban user." });
    }
});

// Route: Approve or Reject Upgrade Request (With 30-Day Expiry)
app.put('/api/admin/requests/:requestId', async (req, res) => {
    const { adminId, status, userId, requestedTier } = req.body;
    const { requestId } = req.params;
    
    if (!(await verifyAdmin(adminId))) return res.status(403).json({ error: "Unauthorized" });

    try {
        await supabase.from('upgrade_requests').update({ status }).eq('id', requestId);

        if (status === 'approved') {
            // 1. Calculate exactly 30 days from right now
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);

            // 2. Grant them the storage AND the expiry date
            await supabase.from('profiles').update({ 
                max_storage: requestedTier,
                plan_expires_at: expiryDate.toISOString() 
            }).eq('id', userId);

            await supabase.from('notifications').insert([{
                user_id: userId,
                title: '🎉 Upgrade Approved!',
                message: `Your account has been upgraded! Your subscription is active for 30 days.`
            }]);
        } else {
            await supabase.from('notifications').insert([{
                user_id: userId,
                title: '❌ Upgrade Rejected',
                message: `Your GCash receipt was invalid. Please try again.`
            }]);
        }

        res.json({ message: `Request ${status} successfully!` });
    } catch (error) {
        res.status(500).json({ error: "Failed to process request." });
    }
});