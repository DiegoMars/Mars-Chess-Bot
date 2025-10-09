use regex::Regex;
use serde::Serialize;
use serde_json::json;
use std::{
    env::consts::OS,
    fs,
    io::{BufRead, BufReader, Write},
    path::PathBuf,
    process::{ChildStdin, Command, Stdio},
    sync::{Arc, Mutex},
    thread,
};
use tauri::{AppHandle, Emitter, State};

#[derive(Serialize)]
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
    // if stockfish is ready
    is_ready: Option<String>,
}

pub struct Stockfish {
    child: std::process::Child,
    shared_stdin: Arc<Mutex<ChildStdin>>,
    // Arc is for sharing smt between multiple threads
    // Mutex is to prevent multiple threads accessing and mutating something
    // at the same time
    stdout_thread: Option<std::thread::JoinHandle<()>>,
}

// Checking and downloading the right stockfish binary
async fn grab_sf_binary() -> PathBuf {
    let mut binary = PathBuf::from("./stockfishBinary/");
    if !(binary.exists()) {
        fs::create_dir_all(&binary).expect("Failed to make binary folder");
    }
    binary.push("stockfish");
    if OS == "windows" {
        binary.set_extension("exe");
    }
    if !(binary.exists()) {
        if (OS == "windows") {}
    }
    "temp".into()
}

impl Stockfish {
    fn new(app: AppHandle) -> Self {
        let sf_binary = PathBuf::from("./stockfishBinary/stockfish.exe");
        let mut child = Command::new(sf_binary.into_os_string()) // Passes binary
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()
            .expect("Failed to launch Stockfish");

        // Grabs input stream
        let stdin = child.stdin.take().expect("Failed to open stdin");

        // Grabs output stream
        let stdout = child.stdout.take().expect("Faild to open stdout");

        // Starts a thread that reads out the raw stockfish lines from output
        // stream
        let stdout_thread = thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                let raw_message = line.unwrap();
                println!("{}", raw_message);
                let message = parse_stockfish(&raw_message);
                let json_data = json!(message);
                app.emit("stockfish-says", json_data).unwrap();
            }
        });

        // Wraps the input stream so it can be used in the future
        let shared_stdin = Arc::new(Mutex::new(stdin));
        {
            // In brakets so "locked" gets dropped after calling
            // I believe this would be called a "block expression"
            let mut locked = shared_stdin.lock().unwrap();
            writeln!(locked, "uci").unwrap();
            locked.flush().unwrap();
            writeln!(locked, "isready").unwrap();
            locked.flush().unwrap();
            writeln!(locked, "setoption name ponder value true").unwrap();
            locked.flush().unwrap();
        }
        // std::thread::sleep(std::time::Duration::from_secs(1)); // Time for commands to go into the
        //                                                        // command
        println!("Stockfish started");
        Self {
            child: child,
            shared_stdin: shared_stdin,
            stdout_thread: Some(stdout_thread),
        }
    }
    fn tell_fen(&mut self, fen: String) {
        println!("Told stockfish fen");
        let mut stdin = self.shared_stdin.lock().unwrap();
        writeln!(stdin, "stop").unwrap();
        stdin.flush().unwrap();
        if fen == "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" {
            writeln!(stdin, "position startpos").unwrap();
            stdin.flush().unwrap();
            writeln!(stdin, "go depth 25 mate 5").unwrap();
            stdin.flush().unwrap();
            return;
        }
        writeln!(stdin, "position fen {}", fen).unwrap();
        stdin.flush().unwrap();
        writeln!(stdin, "d").unwrap();
        stdin.flush().unwrap();
        writeln!(stdin, "go depth 25 mate 5").unwrap();
        stdin.flush().unwrap();
    }
    fn tell_ponder(&mut self, fen: String) {
        println!("Told stockfish ponder");
        let mut stdin = self.shared_stdin.lock().unwrap();
        writeln!(stdin, "stop").unwrap();
        stdin.flush().unwrap();
        if fen == "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" {
            writeln!(stdin, "position startpos").unwrap();
            stdin.flush().unwrap();
            writeln!(stdin, "go depth 25 mate 5 ponder").unwrap();
            stdin.flush().unwrap();
            return;
        }
        writeln!(stdin, "position fen {}", fen).unwrap();
        stdin.flush().unwrap();
        writeln!(stdin, "d").unwrap();
        stdin.flush().unwrap();
        writeln!(stdin, "go depth 25 mate 5 ponder").unwrap();
        stdin.flush().unwrap();
    }
}
// When the reference for the stockfish struct is dropped, kill stockfish
impl Drop for Stockfish {
    fn drop(&mut self) {
        // Attempt to kill the child process
        if let Err(err) = self.child.kill() {
            eprintln!("Failed to kill Stockfish process: {:?}", err);
        }
        println!("Stockfish killed");
    }
}
// For parsing stockfish messages, if no match, just return none
fn parse_stockfish(line: &str) -> EngineMessage {
    let best_move_re = Regex::new(r"bestmove\s+(\S+)").unwrap();
    let ponder_re = Regex::new(r"ponder\s+(\S+)").unwrap();
    let cp_re = Regex::new(r"cp\s+(-?\d+)").unwrap();
    let mate_re = Regex::new(r"mate\s+(-?\d+)").unwrap();
    let pv_re = Regex::new(r"\spv\s+(.*)").unwrap();
    let depth_re = Regex::new(r"\sdepth\s+(\d+)").unwrap();

    let ready_re = Regex::new(r"^(readyok)$").unwrap();
    let ready = ready_re.captures(line).map(|c| c[1].to_string());
    if ready == Some("readyok".into()) {
        println!("Stockfish is ready")
    }

    EngineMessage {
        uci_message: line.to_string(),
        best_move: best_move_re.captures(line).map(|c| c[1].to_string()),
        ponder: ponder_re.captures(line).map(|c| c[1].to_string()),
        position_evaluation: cp_re.captures(line).map(|c| c[1].to_string()),
        possible_mate: mate_re.captures(line).map(|c| c[1].to_string()),
        pv: pv_re.captures(line).map(|c| c[1].to_string()),
        depth: depth_re.captures(line).map(|c| c[1].parse().unwrap_or(0)),
        is_ready: ready,
    }
}

// This is for Tauri to be able to integrate it into the app so the process
// doesn't die or smt like that. This is good so that the thread outputting what
// the engine is saying doesn't die
#[derive(Default)]
pub struct SharedStockfish(Arc<Mutex<Option<crate::stockfish::Stockfish>>>);
impl SharedStockfish {
    pub fn default() -> Self {
        SharedStockfish(Arc::new(Mutex::new(None)))
    }
}

#[tauri::command]
pub async fn start_stockfish(
    app: AppHandle,
    state: State<'_, SharedStockfish>,
) -> Result<String, ()> {
    // I THINK there is a layer of Arc and mutex that is just not needed, Tauri already implements
    // Arc but idk I think it is worth playing around with in the future
    let state = state.inner().0.clone();

    tauri::async_runtime::spawn(async move {
        let mut shared = state.lock().unwrap();
        if shared.is_none() {
            *shared = Some(Stockfish::new(app));
        } else {
            println!("Engine already exists");
        }
    });
    Ok("Stockfish started".into())
}

#[tauri::command]
pub async fn kill_stockfish(state: State<'_, SharedStockfish>) -> Result<String, ()> {
    let state = state.inner().0.clone();
    tauri::async_runtime::spawn(async move {
        let mut shared = state.lock().unwrap();
        if shared.is_none() {
            println!("Engine is already dead");
        } else {
            *shared = None; // Drops reference to stockfish
        }
    });
    Ok("Stockfish killed".into())
}

#[tauri::command]
pub async fn tell_stockfish_fen(
    state: State<'_, SharedStockfish>,
    fen: String,
) -> Result<String, ()> {
    let state = state.inner().0.clone();
    tauri::async_runtime::spawn(async move {
        let mut shared = state.lock().unwrap();
        if let Some(child) = shared.as_mut() {
            child.tell_fen(fen);
        } else {
            println!("There is no engine");
        }
    });
    Ok("Told stockfish".into())
}

#[tauri::command]
pub async fn tell_stockfish_ponder(
    state: State<'_, SharedStockfish>,
    fen: String,
) -> Result<String, ()> {
    let state = state.inner().0.clone();
    tauri::async_runtime::spawn(async move {
        let mut shared = state.lock().unwrap();
        if let Some(child) = shared.as_mut() {
            child.tell_ponder(fen);
        } else {
            println!("There is no engine");
        }
    });
    Ok("Told stockfish".into())
}
