import { Router } from "express";

const router = Router();

router.post("/", (req, res) => {
  const { filename, size, copies, duration } = req.body;

  console.log("Received upload request:", {
    filename,
    size,
    copies,
    duration,
  });

  return res.json({
    success: true,
    message: "Upload request received by VaultX API",
  });
});

export default router;
