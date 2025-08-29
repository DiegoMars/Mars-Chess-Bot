import styles from "./board.module.css";

function Board() {
  let board = [];
  for (let i = 0; i < 8; i++) {
    let row = [];
    for (let j = i % 2; j < (8 + (i % 2)); j++){
      row.push(j % 2);
    }
    board.push(row);
  }
  console.log(board);

  return (
    <section className={styles.board}>
      
    </section>
  );
}

export default Board;
