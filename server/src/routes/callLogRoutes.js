import { Router } from "express";
import {
  getCallLogs,
  getCallLogById,
  createCallLog,
  updateCallLog,
  deleteCallLog,
} from "../controllers/callLogController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Protect all call log routes - requires clinic JWT authentication
router.use(protect);

/**
 * @openapi
 * /api/calls:
 *   get:
 *     summary: Retrieve clinic call logs with pagination and filtering
 *     tags:
 *       - Call Logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, in-progress, missed, transferred, failed]
 *         description: Filter calls by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query matching caller number, caller name, or summary
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of records per page (max 100)
 *     responses:
 *       200:
 *         description: List of call logs with pagination details
 *       401:
 *         description: Unauthorized
 */
router.get("/", getCallLogs);

/**
 * @openapi
 * /api/calls:
 *   post:
 *     summary: Create or log a new phone call record
 *     tags:
 *       - Call Logs
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - callerNumber
 *             properties:
 *               callerNumber:
 *                 type: string
 *                 example: "+15551234567"
 *               callerName:
 *                 type: string
 *                 example: "Sarah Connor"
 *               vapiCallId:
 *                 type: string
 *                 example: "vapi_call_abc123"
 *               duration:
 *                 type: integer
 *                 description: Duration in seconds
 *                 example: 135
 *               status:
 *                 type: string
 *                 enum: [completed, in-progress, missed, transferred, failed]
 *                 example: "completed"
 *               summary:
 *                 type: string
 *                 example: "Patient inquired about dental consultation availability for tomorrow."
 *               transcript:
 *                 type: string
 *                 example: "Agent: Hello, thanks for calling VoiceDesk Clinic. How can I help? Caller: I'd like to book an appointment."
 *               recordingUrl:
 *                 type: string
 *                 example: "https://recordings.vapi.ai/abc123.mp3"
 *               endedReason:
 *                 type: string
 *                 example: "customer-ended-call"
 *               appointmentId:
 *                 type: string
 *                 description: Optional ObjectId of linked appointment
 *                 example: "654321fedcba098765432101"
 *     responses:
 *       201:
 *         description: Call log recorded
 *       400:
 *         description: Missing callerNumber or invalid appointmentId
 */
router.post("/", createCallLog);

/**
 * @openapi
 * /api/calls/{id}:
 *   get:
 *     summary: Get details of a call log including full transcript and linked appointment
 *     tags:
 *       - Call Logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Call log details
 *       404:
 *         description: Call log not found
 */
router.get("/:id", getCallLogById);

/**
 * @openapi
 * /api/calls/{id}:
 *   patch:
 *     summary: Update an existing call log (e.g. caller name, summary, linked appointment)
 *     tags:
 *       - Call Logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               callerName:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [completed, in-progress, missed, transferred, failed]
 *               summary:
 *                 type: string
 *               transcript:
 *                 type: string
 *               recordingUrl:
 *                 type: string
 *               appointmentId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Call log updated
 *       404:
 *         description: Call log not found
 */
router.patch("/:id", updateCallLog);

/**
 * @openapi
 * /api/calls/{id}:
 *   delete:
 *     summary: Delete a call log
 *     tags:
 *       - Call Logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Call log deleted successfully
 *       404:
 *         description: Call log not found
 */
router.delete("/:id", deleteCallLog);

export default router;
