import styles from "./board.module.css";

const renderRow = (fenElement) => {
  let fen = fenElement[0];
  let row = [];
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
};

function Board() {
  // Ima try to use FEN to describe the board
  // https://en.wikipedia.org/wiki/Forsyth–Edwards_Notation
  // Lowercase for black, uppercase for white
  // Pawn = p
  // Rook = r
  // Knight = n
  // Bishop = b
  // Queen = q
  // King = k
  let Pieces = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  let fenPositions = Pieces.split("/", 8);
  fenPositions[7] = fenPositions[7].split(" ", 1);
  let Board = [];
  for (let i = 0; i < 8; i++) {
    Board.push(renderRow(fenPositions[i]));
  }
  console.log(Board);

  return (
    <section>
      <table className={styles.board}>
        <tbody>
          {Board.map((Row,idx) => (
            <tr key={idx}>
              {Row.map((cell,idx) =>(
                <td>
                  <div>{cell}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default Board;
