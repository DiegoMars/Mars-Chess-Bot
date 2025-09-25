mod stockfish;
use std::sync::Mutex;
use tauri::{Builder, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    Builder::default()
        .setup(|app| {
            app.manage(Mutex::new(crate::stockfish::SharedStockfish::default()));
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        // .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use crate::stockfish;
    use tokio;

    #[tokio::test]
    async fn test_stockfish() {
        let _stockfish = stockfish::Stockfish::new();
        assert!(true);
    }
}
