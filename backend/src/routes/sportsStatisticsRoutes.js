import express from "express";

import {
  getPublicSportsStatistics,
} from "../controllers/sportsStatisticsController.js";

const router = express.Router();

router.get(
  "/public",
  getPublicSportsStatistics
);

export default router;