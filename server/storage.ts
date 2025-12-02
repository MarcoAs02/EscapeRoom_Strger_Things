import { users, highScores, type User, type InsertUser, type HighScore, type InsertHighScore } from "@shared/schema";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getTopScores(limit?: number): Promise<HighScore[]>;
  getTopScoresByDifficulty(difficulty: string, limit?: number): Promise<HighScore[]>;
  createHighScore(score: InsertHighScore): Promise<HighScore>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getTopScores(limit: number = 10): Promise<HighScore[]> {
    return db.select().from(highScores).orderBy(desc(highScores.score)).limit(limit);
  }

  async getTopScoresByDifficulty(difficulty: string, limit: number = 10): Promise<HighScore[]> {
    return db.select().from(highScores)
      .where(eq(highScores.difficulty, difficulty))
      .orderBy(desc(highScores.score))
      .limit(limit);
  }

  async createHighScore(score: InsertHighScore): Promise<HighScore> {
    const [highScore] = await db.insert(highScores).values(score).returning();
    return highScore;
  }
}

export const storage = new DatabaseStorage();
