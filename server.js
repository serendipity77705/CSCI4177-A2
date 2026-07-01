import "dotenv/config";
import appointments from "./routes/appointments.js";
import authentication from "./auth.js";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("IntelliCare API is running");
});
app.use("/api/auth", authentication);

app.use("/api/auth", appointments);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));

export default app;