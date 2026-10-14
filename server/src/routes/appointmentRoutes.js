import { Router } from "express";
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../controllers/appointmentController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Protect all appointment routes - requires clinic JWT authentication
router.use(protect);

/**
 * @openapi
 * /api/appointments:
 *   get:
 *     summary: Get all appointments for the clinic
 *     tags:
 *       - Appointments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, completed, cancelled, no-show]
 *         description: Filter by appointment status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by patient name or phone number
 *     responses:
 *       200:
 *         description: List of appointments
 *       401:
 *         description: Unauthorized
 */
router.get("/", getAppointments);

/**
 * @openapi
 * /api/appointments:
 *   post:
 *     summary: Schedule a new appointment
 *     tags:
 *       - Appointments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientName
 *               - patientPhone
 *               - startTime
 *             properties:
 *               patientName:
 *                 type: string
 *                 example: John Doe
 *               patientPhone:
 *                 type: string
 *                 example: "+1234567890"
 *               patientEmail:
 *                 type: string
 *                 example: john@example.com
 *               serviceType:
 *                 type: string
 *                 example: Teeth Cleaning
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-10-15T10:00:00.000Z"
 *               durationMinutes:
 *                 type: integer
 *                 example: 30
 *               notes:
 *                 type: string
 *                 example: First time visit for cleaning
 *     responses:
 *       201:
 *         description: Appointment created
 *       400:
 *         description: Invalid input or missing fields
 *       409:
 *         description: Double-booking time slot conflict
 */
router.post("/", createAppointment);

/**
 * @openapi
 * /api/appointments/{id}:
 *   get:
 *     summary: Get appointment details by ID
 *     tags:
 *       - Appointments
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
 *         description: Appointment details
 *       404:
 *         description: Appointment not found
 */
router.get("/:id", getAppointmentById);

/**
 * @openapi
 * /api/appointments/{id}:
 *   patch:
 *     summary: Update or reschedule an appointment
 *     tags:
 *       - Appointments
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
 *               status:
 *                 type: string
 *                 enum: [scheduled, completed, cancelled, no-show]
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *               serviceType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *       404:
 *         description: Appointment not found
 *       409:
 *         description: Reschedule time slot conflict
 */
router.patch("/:id", updateAppointment);

/**
 * @openapi
 * /api/appointments/{id}:
 *   delete:
 *     summary: Delete an appointment
 *     tags:
 *       - Appointments
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
 *         description: Appointment deleted
 *       404:
 *         description: Appointment not found
 */
router.delete("/:id", deleteAppointment);

export default router;
