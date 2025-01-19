import { Router } from "express";
import { getMe, login, register } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth";

const router: Router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/getMe", authenticate, getMe);

export { router as authRouter };
