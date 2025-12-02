import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHighScoreSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/highscores", async (req, res) => {
    try {
      const { difficulty, limit } = req.query;
      const limitNum = limit ? parseInt(limit as string, 10) : 10;
      
      if (difficulty && typeof difficulty === 'string') {
        const scores = await storage.getTopScoresByDifficulty(difficulty, limitNum);
        return res.json(scores);
      }
      
      const scores = await storage.getTopScores(limitNum);
      res.json(scores);
    } catch (error) {
      console.error("Error fetching high scores:", error);
      res.status(500).json({ error: "Failed to fetch high scores" });
    }
  });

  app.post("/api/highscores", async (req, res) => {
    try {
      const parsed = insertHighScoreSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid high score data", details: parsed.error });
      }
      
      const highScore = await storage.createHighScore(parsed.data);
      res.status(201).json(highScore);
    } catch (error) {
      console.error("Error creating high score:", error);
      res.status(500).json({ error: "Failed to save high score" });
    }
  });

  return httpServer;
}
