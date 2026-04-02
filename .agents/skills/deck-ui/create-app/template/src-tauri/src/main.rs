// Prevents additional console window on Windows in release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    {{APP_NAME_SNAKE}}_lib::run();
}
