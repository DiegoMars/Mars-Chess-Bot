import { Chessboard, type PieceDropHandlerArgs } from "react-chessboard";
import { Chess } from 'chess.js';
import { useState, useEffect, useRef } from "react";
import { invoke } from  '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import styles from "./board.module.css";

function Board() {
  // create a chess game using a ref to always have access to the latest game state within closures
  // and maintain the game state across renders
  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;

  // track the current position of the chess game in state to trigger a re-render of the chessboard
  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [moveFrom, setMoveFrom] = useState('');
  const [optionSquares, setOptionSquares] = useState({});

  // Stockfish stuff
  // Raw message
  const [rawSFMessage, setRawSFMessage] = useState(null);
  // Best move for current pos
  const [sfBestMove, setSFBestMove] = useState(null);
  // Best move for opp
  const [sfPonder, setSFPonder] = useState(null);
  // Eval
  const [sfPositionEvaluation, setSFPositionEvaluation] = useState(null);
  // Moves till mate
  const [sfPossibleMate, setSFPossibleMate] = useState(null);
  // Best line found
  const [sfPv, setSFPv] = useState(null);
  // Number of moves looked ahead
  const [sfDepth, setSFDepth] = useState(null);

  useEffect(() => {
    // Attempting to listen to stockfish
    const listener = listen("stockfish-says", (event) => {
      // If not null, set message
      if(event.payload.uci_message != null){
        setRawSFMessage(event.payload.uci_message);
      }
      if(event.payload.best_move != null){
        setSFBestMove(event.payload.best_move);
      }
      if(event.payload.ponder != null){
        setSFPonder(event.payload.ponder);
      }
      if(event.payload.ponder != null){
        setSFPositionEvaluation(event.payload.position_evaluation);
      }
      if(event.payload.ponder != null){
        setSFPossibleMate(event.payload.possible_mate);
      }
      if(event.payload.ponder != null){
        setSFPv(event.payload.pv);
      }
      if(event.payload.ponder != null){
        setSFDepth(event.payload.depth);
      }
    });
    // Starts stockfish
    invoke("start_stockfish");

    return () => {
      listener.then((f) => f());
      invoke("kill_stockfish");
    };
  }, []);

  // You can notice here that not all of the lines are logged her. This is
  // because not all of the setRawSFMessage() calls are rendered in, but rather
  // only the last call before the render is logged. This is because it updates
  // multiple times BEFORE the component renders again. This may seem like a
  // problem at first but thinking about it, the latest calls are the ones we
  // want anyways. Just make sure if a "null" is recieved for something, to
  // maybe ingnore it. Could reset certain variables after a move is made tho
  // so it doesn't interfere with the next move
  useEffect(() => {
    console.log(rawSFMessage);
  }, [rawSFMessage]);
  useEffect(() => {
    console.log(sfBestMove);
  }, [sfBestMove]);
  useEffect(() => {
    console.log(sfPonder);
  }, [sfPonder]);
  useEffect(() => {
    console.log(sfPositionEvaluation);
  }, [sfPositionEvaluation]);
  useEffect(() => {
    console.log(sfPossibleMate);
  }, [sfPossibleMate]);
  useEffect(() => {
    console.log(sfPv);
  }, [sfPv]);
  useEffect(() => {
    console.log(sfDepth);
  }, [sfDepth]);

  // get the move options for a square to show valid moves
  function getMoveOptions(square: Square) {
    // get the moves for the square
    const moves = chessGame.moves({
      square,
      verbose: true,
    });

    // if no moves, clear the option squares
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    // create a new object to store the option squares
    const newSquares: Record<string, React.CSSProperties> = {};

    // loop through the moves and set the option squares
    for (const move of moves) {
      newSquares[move.to] = {
        background:
          chessGame.get(move.to) &&
          chessGame.get(move.to)?.color !== chessGame.get(square)?.color
            ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)' // larger circle for capturing
            : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)', // smaller circle for moving
        borderRadius: '50%',
      };
    }

    // set the square clicked to move from to yellow
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)',
    };

    // set the option squares
    setOptionSquares(newSquares);

    // return true to indicate that there are move options
    return true;
  }

  function onSquareClick({ square, piece }: SquareHandlerArgs) {
    // piece clicked to move
    if (!moveFrom && piece) {
      // get the move options for the square
      const hasMoveOptions = getMoveOptions(square as Square);

      // if move options, set the moveFrom to the square
      if (hasMoveOptions) {
        setMoveFrom(square);
      }

      // return early
      return;
    }

    // square clicked to move to, check if valid move
    const moves = chessGame.moves({
      square: moveFrom as Square,
      verbose: true,
    });
    const foundMove = moves.find(
      (m) => m.from === moveFrom && m.to === square,
    );

    // not a valid move
    if (!foundMove) {
      // check if clicked on new piece
      const hasMoveOptions = getMoveOptions(square as Square);

      // if new piece, setMoveFrom, otherwise clear moveFrom
      setMoveFrom(hasMoveOptions ? square : '');

      // return early
      return;
    }

    // is normal move
    try {
      chessGame.move({
        from: moveFrom,
        to: square,
        promotion: 'q',
      });
    } catch {
      // if invalid, setMoveFrom and getMoveOptions
      const hasMoveOptions = getMoveOptions(square as Square);

      // if new piece, setMoveFrom, otherwise clear moveFrom
      if (hasMoveOptions) {
        setMoveFrom(square);
      }

      // return early
      return;
    }

    // update the position state
    setChessPosition(chessGame.fen());

    // make random cpu move after a short delay
    setTimeout(makeRandomMove, 300);

    // clear moveFrom and optionSquares
    setMoveFrom('');
    setOptionSquares({});
  }

  function onPieceDrag({ square, piece }: SquareHandlerArgs) {
    // piece started to be dragged
    if (!moveFrom && piece) {
      // get the move options for the square
      const hasMoveOptions = getMoveOptions(square as Square);

      // if move options, set the moveFrom to the square
      if (hasMoveOptions) {
        setMoveFrom(square);
      }

      return;
      // moveFrom and optionSquares will be cleared on drop
    }
  }

  // handle piece drop
  function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs) {
    // type narrow targetSquare potentially being null (e.g. if dropped off board)
    if (!targetSquare) {
      return false;
    }

    // try to make the move according to chess.js logic
    try {
      chessGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // always promote to a queen for example simplicity
      });

      // update the position state upon successful move to trigger a re-render of the chessboard
      setChessPosition(chessGame.fen());

      // clear moveFrom and optionSquares
      setMoveFrom('');
      setOptionSquares({});

      // return true as the move was successful
      return true;
    } catch {
      // return false as the move was not successful
      setMoveFrom('');
      setOptionSquares({});
      return false;
    }
  }
  // ------ END REACT CHESSBOARD STUFF ------

  return (
    <section className={styles.boardContainer}>
      <Chessboard
        options={{
          position: chessPosition,
          onPieceDrag: onPieceDrag,
          onPieceDrop: onPieceDrop,
          onSquareClick: onSquareClick,
          squareStyles: optionSquares,
          darkSquareStyle: { backgroundColor: "var(--secondary)" },
          lightSquareStyle: { backgroundColor: "var(--primary)" },
          boardStyle: { border: "1rem solid var(--accent-800)" },
          showNotation: false,
          animationDuration: 300,
        }}
      />
    </section>
  );
};

export default Board;
