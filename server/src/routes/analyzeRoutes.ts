import { Router, Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { analyzeController } from '../controllers/analyzeController.js';

const router = Router();

// Configure multer for image uploads - store in memory for processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF`));
    }
  },
});

router.post('/analyze', upload.single('image'), analyzeController);

export { router as analyzeRoutes };
