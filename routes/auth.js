import express from "express";
import { login } from "../controllers/auth.js";

const router = express.Router();
// router.get("/login", (req, res) => {
//     res.json({
//         message: "Hello"
//     })
// })
router.post("/login", login);

export default router;