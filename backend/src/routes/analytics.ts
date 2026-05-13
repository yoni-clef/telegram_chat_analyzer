import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  activity,
  chats,
  emojis,
  media,
  messages,
  sentiment,
  summary
} from "../controllers/analyticsController";

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

analyticsRouter.get("/chats", chats);
analyticsRouter.get("/summary/:chatId", summary);
analyticsRouter.get("/messages/:chatId", messages);
analyticsRouter.get("/emojis/:chatId", emojis);
analyticsRouter.get("/activity/:chatId", activity);
analyticsRouter.get("/media/:chatId", media);
analyticsRouter.get("/sentiment/:chatId", sentiment);
