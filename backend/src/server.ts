import cors from "cors";
import express from "express";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    status: "success",
    message: "VMA backend is running",
  });
});

app.listen(3000, "0.0.0.0", () => {
  console.log("VMA backend running on port 3000");
});