import websocket
import subprocess
import json
import os
import requests
import time

# --- KONFIGURASI ---
SERVER_WS = "ws://192.168.1.13:7071"
API_BASE = "http://192.168.1.13:5000"
# Masukkan token kamu yang ada di Preferences ESP32
ROBOT_TOKEN = "MASUKKAN_TOKEN_DISINI" 

def play_audio(url):
    print(f"[ASTRA] Memutar balasan: {url}")
    # Pakai mpv --no-video agar ringan dan tidak muncul window
    subprocess.run(["mpv", "--no-video", url])

def execute_linux_command(cmd_key):
    # Mapping perintah khusus Archcraft / Linux
    commands = {
        "OPEN_TERMINAL": "alacritty", # Archcraft biasanya pakai alacritty atau kitty
        "CHECK_SPECS": "alacritty -e neofetch && sleep 10",
        "FULL_UPGRADE": "alacritty -e sudo pacman -Syu",
        "OPEN_BROWSER": "brave", # Sesuaikan kalau pakai firefox
        "CLEAN_SYSTEM": "alacritty -e sudo pacman -Rns $(pacman -Qtdq)"
    }
    
    run_cmd = commands.get(cmd_key)
    if run_cmd:
        print(f"[EXEC] Menjalankan: {run_cmd}")
        # Popen supaya tidak nge-block script python-nya
        subprocess.Popen(run_cmd, shell=True)
    else:
        # Jika tidak ada di daftar, coba jalankan sebagai shell mentah
        subprocess.Popen(cmd_key, shell=True)

def on_message(ws, message):
    try:
        data = json.loads(message)
        print(f"[WS] Data diterima: {data}")

        # Jalankan Suara
        if data.get("type") == "PLAY_AUDIO":
            audio_url = data.get("url")
            play_audio(audio_url)

        # Jalankan Perintah Shell
        elif data.get("type") == "COMMAND":
            cmd = data.get("command")
            execute_linux_command(cmd)

    except Exception as e:
        print(f"[ERROR] Gagal proses pesan: {e}")

def on_open(ws):
    print("=== ASTRA LINUX CLIENT CONNECTED (ARCHCRAFT) ===")

# Jalankan Websocket
ws = websocket.WebSocketApp(SERVER_WS, on_message=on_message, on_open=on_open)
ws.run_forever()