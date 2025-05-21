import api from "@/api/axios";
import { SilverLockIcon } from "@/assets/icons";
import { XClose } from "@/assets/svgs";
import { AnimatedList, BetInput, Button, ProvablyFair } from "@/components";
import { GameType } from "@/game-types";
import { useAppDispatch, useAppSelector } from "@/hooks/store";
import { updateBalance } from "@/store/slices/wallet";
import socket from "@/utils/constants";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

enum GameStatus {
  win = "win",
  lose = "lose",
}
let savedStatus: GameStatus | null = null;
export default function Limbo() {
  const auth = useAppSelector((state) => state.auth);
  const { balance } = useAppSelector((state) => state.wallet);
  const [bet, setBet] = useState<Partial<Bet>>({
    stake: 0,
    gameType: GameType.LIMBO as Bet["gameType"],
    multiplier: 1,
    profit: 0,
  });
  const [result, setResult] = useState<number | null>(null);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null); // Track game win
  const [value, setValue] = useState(0);
  const duration = useState(1000)[0];

  const [historyItems, setHistoryItems] = useState<
    { id: string; text: string }[]
  >([]);

  const addHistoryItem = (item: string) => {
    if (item.trim()) {
      setHistoryItems([{ id: uuidv4(), text: item }, ...historyItems]);
    }
  };

  const dispatch = useAppDispatch();

  // const [balance, dispatch(updateBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  //   const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //     setBet((prev) => ({ ...prev, stake: Number(e.target.value) }));
  //   };

  useEffect(() => {
    if (!historyItems.length) {
      socket.emit("LIMBO:get_multipliers", auth.user?.username);
    }

    socket.on("LIMBO:multipliers", (data) => {
      if (!data) return;
      setHistoryItems(data);
    });

    socket.on(
      "LIMBO:result",
      ({
        profit,
        result,
        status,
      }: {
        result: number;
        status: GameStatus;
        profit: number;
      }) => {
        console.log("RESULT: ", {
          profit,
          result,
          status,
        });

        setResult(result);

        savedStatus = status; //   setGameStatus(GameStatus.win);
        setBet((prev) => ({ ...prev, profit: profit }));
        // if (status === GameStatus.win) {
        // } else {
        //   setBet((prev) => ({ ...prev, profit: 0 }));
        //   setGameStatus(GameStatus.lose);
        // }
      },
    );
  }, [auth.user?.username, historyItems.length]);

  const placeBet = async () => {
    if (!bet.stake) return toast.error("Invalid bet input");

    console.log("BET: ", { bet });

    if (bet?.stake > balance) {
      return toast.error("Insufficient balance");
    }

    try {
      setLoading(true);
      const response = await api.post("/bet", {
        ...bet,
        socketId: socket.id,
      });

      const data = response.data;

      if (!data.bet) return toast.error("Could not place bet");

      dispatch(updateBalance(balance - bet.stake!));

      toast.success("Bet placed");
    } catch (error) {
      console.error("PLACE_BET:LIMBO", error);
      return toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetGame = () => {
    setGameRunning(false);
  };

  useEffect(() => {
    if (!result) return;
    setGameStatus(null);
    const start = 0;
    const increment = result / (duration / 10); // Determines how much to increment each interval
    let currentValue = start;
    const stepTime = Math.abs(Math.floor(10)); // Update every 10ms

    const timer = setInterval(() => {
      currentValue += increment;
      if (currentValue >= result) {
        currentValue = result;
        clearInterval(timer);
        if (bet.profit !== undefined && bet.multiplier) {
          setGameStatus(savedStatus);
          dispatch(updateBalance(balance + bet.profit));
          addHistoryItem(
            (savedStatus === GameStatus.win ? bet.multiplier : 0)?.toFixed(2),
          );
        }
      }
      setValue(currentValue);
    }, stepTime);

    return () => clearInterval(timer); // Cleanup interval on component unmount
  }, [result]);

  useEffect(() => {
    console.log({ gameStatus });
  }, [gameStatus]);

  return (
    <>
      <div className="flex flex-col w-full">
        <div className="h-[50px] bg-dark-800 rounded-t-md border-b border-gray-700">
          <AnimatedList items={historyItems} />
          {/* <div className="w-full h-full flex gap-1.5 p-2  justify-start overflow-hidden relative shadow-dark-800 items-center">
            <div
              className="w-[6px] bg-dark-800 h-full absolute right-0 top-0 z-[5] "
              style={{ boxShadow: "0 0 30px 40px var(--tw-shadow-color)" }}
            ></div>
          </div> */}
        </div>
        <div className="flex flex-row w-full h-full max-md:flex-col-reverse">
          <div className="bg-dark-800 flex justify-start flex-col max-md:w-full w-[400px]">
            <div className="relative text-sm font-medium">
              {(!auth.isAuthenticated || loading || gameRunning) && (
                <div
                  onClick={() => {
                    !loading && resetGame();
                  }}
                  className="absolute top-0 left-0 z-10 w-full h-full cursor-not-allowed bg-dark-800 opacity-70"
                />
              )}
              <div className="relative flex flex-col gap-2 p-3 text-sm font-medium text-white">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-white">
                    Bet Amount
                  </span>
                  <BetInput
                    inputProps={{
                      value: bet?.stake,
                      onChange(e) {
                        setBet((prev) => ({
                          ...prev,
                          stake: parseFloat(e.target.value),
                        }));
                      },
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-white">
                    Auto Cashout
                  </span>
                  {/* <div className="bg-dark-700 h-[38px] text-gray-400 rounded-sm py-0.5 border transition-colors px-2 flex items-center gap-1.5 w-full border-dark-650"> */}
                  {/* <input
                      className="bg-transparent outline-none border-none p-1 text-[0.9rem] flex-grow text-white font-medium"
                      type="text"
                      value={
                        !isNaN(bet.multiplier as number) ? bet.multiplier : 2
                      }
                      onChange={handleMultiplierChange}
                    /> */}
                  <BetInput
                    leading={
                      <div className="flex items-center gap-2">
                        <XClose className="!fill-current" />
                      </div>
                    }
                    trailing={<></>}
                    inputProps={{
                      value: bet?.multiplier,
                      onChange(e) {
                        console.log("MULTIPLIER: ", parseFloat(e.target.value));
                        setBet((prev) => ({
                          ...prev,
                          multiplier: parseFloat(e.target.value),
                        }));
                      },
                    }}
                  />
                  <div className="flex items-center gap-2">
                    {/* <div className="flex gap-2.5 font-semibold">
                        <button className="transition-colors hover:text-white">
                          1/2
                        </button>
                        <button className="transition-colors hover:text-white">
                          2×
                        </button>
                      </div> */}
                  </div>
                  {/* </div> */}
                </div>
                <Button
                  onClick={async () => await placeBet()}
                  loading={loading}
                  aria-disabled="true"
                  className="text-sm py-2 w-full rounded-sm sc-1xm9mse-0 fzZXbl text-nowrap"
                >
                  Place Bet
                </Button>
                {/* <div className="absolute top-0 left-0 w-full h-full cursor-not-allowed z-5"></div> */}
              </div>
            </div>
          </div>
          <div className="overflow-hidden bg-dark-850 w-full h-full min-h-[400px] max-sm:min-h-[300px] flex justify-center relative">
            <div className="flex items-center justify-center md:min-h-[500px]">
              <span
                className={clsx(
                  "font-semibold select-none text-8xl",
                  gameStatus === GameStatus.win
                    ? "text-green-600"
                    : gameStatus === GameStatus.lose
                      ? "text-rose-700"
                      : "text-white",
                )}
              >
                {value ? value?.toFixed(2) : "1.00"}×
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-row-reverse items-center min-h-[50px] bg-dark-800 rounded-b-md border-t border-gray-700">
          <ProvablyFair />
        </div>
      </div>
      <div className="flex flex-col w-full gap-2 p-3 font-semibold text-gray-400 rounded-md bg-dark-800">
        <span className="text-2xl text-white">Limbo</span>
        <div className="flex flex-row gap-2 max-md:flex-col">
          <div className="flex flex-col min-w-[300px] max-md:w-full gap-2">
            <div className="text-sm h-[40px] max-h-[40px] rounded-sm bg-dark-750 p-2 flex-grow flex justify-between items-center gap-2">
              <span className="font-medium text-white">House Edge</span>
              <span className="flex items-center gap-1.5">4%</span>
            </div>
            <div className="text-sm h-[40px] max-h-[40px] rounded-sm bg-dark-750 p-2 flex-grow flex justify-between items-center gap-2">
              <span className="font-medium text-white">Max Bet</span>
              <span className="flex items-center gap-1.5">
                1,000.00
                <img
                  src={SilverLockIcon}
                  width="18"
                  height="18"
                  className="sc-x7t9ms-0 dnLnNz"
                />
              </span>
            </div>
            <div className="text-sm h-[40px] max-h-[40px] rounded-sm bg-dark-750 p-2 flex-grow flex justify-between items-center gap-2">
              <span className="font-medium text-white">Max Win</span>
              <span className="flex items-center gap-1.5">
                10,000.00
                <img
                  src={SilverLockIcon}
                  width="24"
                  height="24"
                  className="sc-x7t9ms-0 dnOqPg"
                />
              </span>
            </div>
            <div className="text-sm h-[40px] max-h-[40px] rounded-sm bg-dark-750 p-2 flex-grow flex justify-between items-center gap-2">
              <span className="font-medium text-white">Max Multiplier</span>
              <span className="flex items-center gap-1.5">10,000.00×</span>
            </div>
          </div>
          <div className="bg-dark-750 rounded-md  p-2.5 text-sm font-medium w-full text-justify leading-5">
            <span>
              Limbo is straightforward and simple, yet engaging all the same.
              This is why it's ideal for all players regardless of experience or
              expertise, as well as any budget and risks of appetite.
              <br />
              <br />
              You have the choice to go either really small or make a beeline
              for bigger wins as high a 1,000.00× your bet.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
