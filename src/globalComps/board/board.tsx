import { Chessboard } from "react-chessboard";
import { Chess } from 'chess.js';
import { useState, useEffect } from "react";
import styles from "./board.module.css";

function Board() {
  return (
    <section className={styles.boardContainer}>
      <Chessboard
        options={{
          darkSquareStyle: { backgroundColor: "var(--secondary)" },
          lightSquareStyle: { backgroundColor: 'var(--primary)' },
        }}
      />
    </section>
  );
};

export default Board;
