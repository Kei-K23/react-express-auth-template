import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.route";
import { errorHandler } from "./middlewares/error";

const app = express();
const PORT = process.env.BACKEND_APP_PORT || 3001;

const corsOptions = {
  origin: "http://localhost:5173", // Replace with your frontend URL
  credentials: true, // Allow cookies to be sent
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
