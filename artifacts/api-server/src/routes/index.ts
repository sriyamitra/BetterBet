import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import challengesRouter from "./challenges";
import checkinsRouter from "./checkins";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(challengesRouter);
router.use(checkinsRouter);
router.use(storageRouter);

export default router;
