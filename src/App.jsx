import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Board from "./globalComps/board/board.jsx";
import "./mainStyles/App.css";

function App() {

  return (
  <main>
    <Board></Board>
  </main>
  );
}

export default App;
