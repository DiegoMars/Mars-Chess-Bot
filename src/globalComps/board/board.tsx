import { Chessboard, type PieceDropHandlerArgs } from "react-chessboard";
import { Chess } from 'chess.js';
import { useState, useEffect, useRef } from "react";
import styles from "./board.module.css";

function Board() {
  const gameRef = useRef(new Chess());
  const chessGame = gameRef.current;

  const [fen, setFen] = useState(chessGame.fen());

  const onPieceDrop = (sourceSquare: string, targetSquare: string) => {
    const game = chessGame;
    const move = game.move({ from: sourceSquare, to: targetSquare, promotion: "q" });

    if (move === null) return false;

    setFen(game.fen());
    console.log("Move made:", move);
    return true;
  };

  return (
    <section className={styles.boardContainer}>
      <Chessboard
        options={{
          onPieceDrop: {onPieceDrop},
          arePiecesDraggable: true,
          darkSquareStyle: { backgroundColor: "var(--secondary)" },
          lightSquareStyle: { backgroundColor: 'var(--primary)' },
        }}
      />
    </section>
  );
};

export default Board;
