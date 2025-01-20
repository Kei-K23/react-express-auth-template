import { Router } from "express";
import {
  deleteMe,
  getMe,
  login,
  logout,
  refreshToken,
  register,
  updateMe,
} from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth";

const router: Router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/getMe", authenticate, getMe);
router.get("/updateMe", authenticate, updateMe);
router.get("/deleteMe", authenticate, deleteMe);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

export { router as authRouter };
