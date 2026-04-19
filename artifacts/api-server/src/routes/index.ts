import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import rationRouter from "./ration";
import tokensRouter from "./tokens";
import rationCardsRouter from "./rationCards";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(rationRouter);
router.use(tokensRouter);
router.use(rationCardsRouter);

export default router;
