import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import rationRouter from "./ration";
import tokensRouter from "./tokens";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(rationRouter);
router.use(tokensRouter);

export default router;
