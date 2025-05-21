import React, { useState } from "react";

const LimboGame: React.FC = () => {
  const [bet, setBet] = useState<number>(0);
  const [targetMultiplier, setTargetMultiplier] = useState<number>(2);
  const [balance, setBalance] = useState<number>(100);
  const [result, setResult] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBet(Number(e.target.value));
  };

  const handleMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetMultiplier(Number(e.target.value));
  };

  const playGame = () => {
    if (bet > balance) {
      setMessage("Insufficient balance");
      return;
    }

    const randomMultiplier = Math.random() * 10;
    setResult(randomMultiplier);

    if (randomMultiplier > targetMultiplier) {
      const winnings = bet * targetMultiplier;
      setBalance(balance + winnings - bet);
      setMessage(
        `You win! Multiplier: ${randomMultiplier?.toFixed(2)}. Winnings: ${winnings?.toFixed(2)}`,
      );
    } else {
      setBalance(balance - bet);
      setMessage(`You lose. Multiplier: ${randomMultiplier?.toFixed(2)}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Limbo Game</h1>
      <div className="mb-4">
        <label className="block mb-2">Bet Amount:</label>
        <input
          type="number"
          value={bet}
          onChange={handleBetChange}
          className="p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2">Target Multiplier:</label>
        <input
          type="number"
          value={targetMultiplier}
          onChange={handleMultiplierChange}
          className="p-2 border rounded"
        />
      </div>
      <button onClick={playGame} className="bg-blue-500 text-white p-2 rounded">
        Play
      </button>
      <div className="mt-4">
        <p>Balance: ${balance?.toFixed(2)}</p>
        {result !== null && <p>Resulting Multiplier: {result?.toFixed(2)}</p>}
        <p>{message}</p>
      </div>
    </div>
  );
};

export default LimboGame;
