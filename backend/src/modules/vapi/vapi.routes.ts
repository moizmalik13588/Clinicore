import { Router } from 'express';
import { vapiController } from './vapi.controller';

const router = Router();

// POST /vapi/tools  ← Vapi tool calls yahan aate hain
router.post('/tools', vapiController.handleToolCall);

// POST /vapi/events ← Call start/end events
router.post('/events', vapiController.handleEvent);

export default router;