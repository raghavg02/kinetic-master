import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fname = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    
    cb(null, fname);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  
  if (file.mimetype.startsWith('video/') || file.mimetype === 'application/octet-stream') {
    cb(null, true);
  } else {
    
    cb(new Error('Only video files are allowed!'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});
