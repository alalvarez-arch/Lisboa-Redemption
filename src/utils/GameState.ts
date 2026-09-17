/** Shared runtime state across scenes */
export const GameState = {
  lives: 3,
  score: 0,
  neptuno: 0,
  maxNeptuno: 100,
  missionComplete: false,

  reset() {
    this.lives = 3;
    this.score = 0;
    this.neptuno = 0;
    this.missionComplete = false;
  },

  addScore(n: number) {
    this.score += n;
  },

  addNeptuno(n: number) {
    this.neptuno = Math.min(this.maxNeptuno, this.neptuno + n);
  },

  canUseNeptuno(): boolean {
    return this.neptuno >= this.maxNeptuno;
  },

  consumeNeptuno() {
    this.neptuno = 0;
  },

  loseLife(): boolean {
    this.lives = Math.max(0, this.lives - 1);
    return this.lives <= 0;
  },
};
