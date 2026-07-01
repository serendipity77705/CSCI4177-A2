import express from "express";
import { pool } from "../db.js";
import { auth } from "../auth.js";

const router = express.Router();

router.get("/patient/:id/appointments", auth, async (req, res) => {
  try {
    const requestedId = Number(req.params.id);
    const user = req.user;

    if (user.role !== "patient" && user.id !== requestedId) {
      return res.status(403).json({ error: "you do not have access to this data" });
    }

    const [rows] = await pool.query(
      "SELECT * FROM appointments WHERE patientId = ?",
      [requestedId]
    );

    res.status(200).json({
      message: "Appointments acquired successfully",
      appointments: rows
    });
  } catch (e) {
    res.status(400).json({ error: "invalid field entry; missing or incorrect data" });
  }
});

router.get("/physician/:id/appointments", auth, async (req, res) => {
  try {
    const requestedId = Number(req.params.id);
    const user = req.user;

    if (user.role !== "physician" && user.id !== requestedId) {
      return res.status(403).json({ error: "you do not have access to this data" });
    }

    const [rows] = await pool.query(
      "SELECT * FROM appointments WHERE physicianId = ?",
      [requestedId]
    );

    res.status(200).json({
      message: "Appointments acquired successfully",
      appointments: rows
    });
  } catch (e) {
    res.status(400).json({ error: "invalid field entry; missing or incorrect data" });
  }
});

router.get("/admin/appointments", auth, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "admin") {
      return res.status(403).json({ error: "you do not have access to this data" });
    }

    const { patientId, physicianId } = req.query;
    let query = "SELECT * FROM appointments";
    const params = [];

    if (patientId) {
      query += " WHERE patientId = ?";
      params.push(Number(patientId));
    } else if (physicianId) {
      query += " WHERE physicianId = ?";
      params.push(Number(physicianId));
    }

    const [rows] = await pool.query(query, params);

    res.status(200).json({
      message: "Appointments acquired successfully",
      appointments: rows
    });
  } catch (e) {
    res.status(400).json({ error: "invalid field entry; missing or incorrect data" });
  }
});

router.post("/appointments", auth, async (req, res) => {
  try {
    const user = req.user;
    const {
      id,
      patientId,
      physicianId,
      createdBy,
      startTime,
      endTime,
      reason,
    } = req.body;

    if (!patientId || !physicianId || !createdBy || !startTime || !endTime || !reason) {
      return res.status(400).json({ error: "missing or invalid fields" });
    }

    const [[creator]] = await pool.query("SELECT id, userRole FROM users WHERE id = ?", [createdBy]);
    if (!creator) {
    return res.status(404).json({ error: "creator id not found" });
    }

    if (creator.userRole === "PATIENT") {
    const [[patientProfile]] = await pool.query(
      "SELECT id FROM patients WHERE userID = ?",
      [creator.id]
    );

    if (!patientProfile || patientProfile.id !== patientId) {
      return res.status(403).json({ error: "patient cannot book for another patient" });
    }
}

else if (creator.userRole === "PHYSICIAN") {
    const [[physicianProfile]] = await pool.query(
      "SELECT id FROM physicians WHERE userID = ?",
      [creator.id]
    );

    if (!physicianProfile || physicianProfile.id !== physicianId) {
      return res.status(403).json({ error: "physician cannot book for another physician" });
    }
}

else if (creator.userRole !== "ADMIN") {
    return res.status(400).json({ error: "invalid creator role" });
}

    const [conflicts] = await pool.query(
      `SELECT * FROM appointments
       WHERE physicianId = ?
       AND ((startTime < ? AND endTime > ?) OR (startTime < ? AND endTime > ?))`,
      [physicianId, endTime, startTime, startTime, endTime]
    );

    if (conflicts.length > 0) {
      return res.status(409).json({ error: "conflicting time slot" });
    }

    const [result] = await pool.query(
      `INSERT INTO appointments
       (patientId, physicianId, createdBy, startTime, endTime, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [patientId, physicianId, createdBy, startTime, endTime, reason, "scheduled"]
    );

    res.status(201).json({
      id: result.insertId,
      message: "booking completed successfully"
    });
  } catch (e) {
    res.status(400).json({ error: "invalid field entry; missing or incorrect data" });
  }
});

export default router;