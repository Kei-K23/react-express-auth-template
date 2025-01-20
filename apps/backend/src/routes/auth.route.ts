import { Router } from "express";
import {
  getMe,
  login,
  logout,
  refreshToken,
  register,
} from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth";

const router: Router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/getMe", authenticate, getMe);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

export { router as authRouter };
