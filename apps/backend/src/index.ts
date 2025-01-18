import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.BACKEND_APP_PORT || 3001;

app.use(cors());
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
