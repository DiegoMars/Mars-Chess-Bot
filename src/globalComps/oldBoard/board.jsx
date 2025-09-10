// This is a previous iteration of a chess board I had
// Switched to using react-chessboard

import Bbishop from "./../../assets/pieces/bishop-b.svg";
import Wbishop from "./../../assets/pieces/bishop-w.svg";
import Bking from "./../../assets/pieces/king-b.svg";
import Wking from "./../../assets/pieces/king-w.svg";
import Bknight from "./../../assets/pieces/knight-b.svg";
import Wknight from "./../../assets/pieces/knight-w.svg";
import Bpawn from "./../../assets/pieces/pawn-b.svg";
import Wpawn from "./../../assets/pieces/pawn-w.svg";
import Bqueen from "./../../assets/pieces/queen-b.svg";
import Wqueen from "./../../assets/pieces/queen-w.svg";
import Brook from "./../../assets/pieces/rook-b.svg";
import Wrook from "./../../assets/pieces/rook-w.svg";
import PlaceholderImg from "./../../assets/pieces/No_image.svg";
import { useState, useEffect } from "react";
import styles from "./board.module.css";

const renderRow = (fenElement, white) => {
  let row = [];
  let fen = fenElement;
  if (Array.isArray(fenElement)){
    fen = fenElement[0];
  }
  if (white) {
    for (let i=0; i < fen.length; i++) {
      let char = fen.charAt(i);
      let isNumber = !isNaN(char);
      if (isNumber) {
        for (let j = 0; j < char; j++){
          row.push(" ");
        }
      } else {
        row.push(char);
      }
    }
    return row;
  } else {
    for (let i=fen.length; i >= 0; i--) {
      let char = fen.charAt(i);
      let isNumber = !isNaN(char);
      if (isNumber) {
        for (let j = 0; j < char; j++){
          row.push(" ");
        }
      } else {
        row.push(char);
      }
    }
    return row;
  }
};

function Board() {
  const [pieces, setPieces] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [moves, setMoves] = useState("8/8/8/8/8/8/8/8");
  const [white, setWhite] = useState(true);

  // Ima try to use FEN to describe the board
  // https://en.wikipedia.org/wiki/Forsyth–Edwards_Notation
  const pieceImg = {
    p: Bpawn,
    r: Brook,
    n: Bknight,
    b: Bbishop,
    q: Bqueen,
    k: Bking,
    P: Wpawn,
    R: Wrook,
    N: Wknight,
    B: Wbishop,
    Q: Wqueen,
    K: Wking,
    " ": PlaceholderImg,
  }
  let fenPositions = pieces.split("/", 8);
  fenPositions[7] = fenPositions[7].split(" ", 1);
  let fenMoves = moves.split("/", 8);
  let Board = [];
  let Moves = [];
  if (white){
    for (let i = 0; i < 8; i++) {
      Board.push(renderRow(fenPositions[i], white));
      Moves.push(renderRow(fenMoves[i], white))
    }
  } else {
    for (let i = 7; i >= 0; i--) {
      Board.push(renderRow(fenPositions[i], white));
      Moves.push(renderRow(fenMoves[i], white))
    }
  }
  console.log(Moves);

  return (
    <section>
      <div className={styles.boards}>
        <table className={styles.mainBoard}>
          <tbody>
            {Board.map((Row,idx) => (
              <tr key={idx} className={styles.boardRow}>
                {Row.map((cell,idx) =>(
                  <td key={idx} className={styles.cell}>
                    <img src={PlaceholderImg} alt="placeholder"/>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <table className={styles.moves}>
          <tbody>
            {Moves.map((Row,idx) => (
              <tr key={idx}>
                {Row.map((cell,idx) =>(
                  <td key={idx} className={cell == "m" ? styles.move : styles.noMove}>
                    <img src={PlaceholderImg} alt="placeholder"/>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <table className={styles.pieces}>
          <tbody>
            {Board.map((Row,idx) => (
              <tr key={idx}>
                {Row.map((cell,idx) =>(
                  <td key={idx}>
                    <img src={pieceImg[cell]} alt={cell + " piece"} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default Board;
