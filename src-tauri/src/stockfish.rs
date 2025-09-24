use std::{
    io::{BufRead, BufReader, Write},
    path::PathBuf,
    process::{Command, Stdio},
};

struct EngineMessage {
    // stockfish engine message in UCI format
    uci_message: String,
    // found best move for current position in format `e2e4`
    best_move: Option<String>,
    // found best move for opponent in format `e7e5`
    ponder: Option<String>,
    // material balance's difference in centipawns(IMPORTANT! stockfish gives the cp score in terms of whose turn it is)
    position_evaluation: Option<String>,
    // count of moves until mate
    possible_mate: Option<String>,
    // the best line found
    pv: Option<String>,
    // number of halfmoves the engine looks ahead
    depth: Option<u64>,
}

pub struct Stockfish {
    child: std::process::Child,
}

impl Stockfish {
    pub fn new() -> Self {
        let sf_binary = PathBuf::from("../stockfishBinary/stockfish");
        let mut child = Command::new(sf_binary.into_os_string())
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()
            .expect("Failed to launch Stockfish");
        let mut stdin = child.stdin.take().expect("Failed to open stdin");
        stdin
            .write_all("isready".as_bytes())
            .expect("Failed to write to stdin");
        Self { child }
    }
}

// I could implement these into the struct, then use a command to activate it
#[tauri::command]
pub async fn stockfish(app: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        let sf_binary = PathBuf::from("../stockfishBinary/");

        // Should prolly change this so that it can instead run an exe depending on the OS
        let stockfish = Command::new("./stockfish-windows-x86-64-avx2.exe");
    });
}
