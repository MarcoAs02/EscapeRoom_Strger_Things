import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HighScore, InsertHighScore } from "@shared/schema";

async function fetchHighScores(difficulty?: string): Promise<HighScore[]> {
  const url = difficulty 
    ? `/api/highscores?difficulty=${difficulty}&limit=10`
    : `/api/highscores?limit=10`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch high scores");
  }
  return response.json();
}

async function submitHighScore(score: InsertHighScore): Promise<HighScore> {
  const response = await fetch("/api/highscores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(score),
  });
  
  if (!response.ok) {
    throw new Error("Failed to submit high score");
  }
  return response.json();
}

export function useHighScores(difficulty?: string) {
  return useQuery({
    queryKey: ["highscores", difficulty],
    queryFn: () => fetchHighScores(difficulty),
    staleTime: 30000,
  });
}

export function useSubmitHighScore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: submitHighScore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highscores"] });
    },
  });
}
