import { Chessboard } from "react-chessboard";
import { Chess } from 'chess.js';
import { useState, useEffect } from "react";
import styles from "./board.module.css";

function Board() {

  return (
    <section>
      <Chessboard />
    </section>
  );
}

export default Board;
