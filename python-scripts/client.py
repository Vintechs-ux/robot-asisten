import websocket
import subprocess
import json
import os
import requests
import re
from tqdm import tqdm
from win10toast import ToastNotifier
import time

toaster = ToastNotifier()

def download_with_progress(url, filename):
    try:
        response = requests.get(url, stream=True)
        total = int(response.headers.get('content-length', 0))
        with open(filename, 'wb') as file, tqdm(
            desc=f"Downloading {filename}",
            total=total,
            unit='iB',
            unit_scale=True,
            unit_divisor=1024,
        ) as bar:
            for data in response.iter_content(chunk_size=1024):
                size = file.write(data)
                bar.update(size)
        return True
    except Exception as e:
        print("[ERROR] Gagal download:", e)
        return False

def install_from_url(name, url):
    print(f"[INSTALL] Mengunduh dan menginstall {name} dari URL: {url}")
    filename = f"{name}_installer.exe"
    
    if download_with_progress(url, filename):
        subprocess.run(filename, shell=True)
        print(f"[DONE] {name} berhasil diinstall.")
        toaster.show_toast("Install Selesai", f"{name} berhasil diinstall!", duration=5)
    else:
        toaster.show_toast("Gagal Download", f"Gagal mengunduh {name}", duration=5)

def find_app_id(name):
    try:
        print(f"[INSTALL] Mencari aplikasi: {name}")
        result = subprocess.run(f"winget search {name}", shell=True, capture_output=True, text=True)

        output = result.stdout
        lines = output.splitlines()

        for line in lines:
            match = re.search(r'^\s*(.*?)\s{2,}(.*?)\s{2,}(.*?)$', line)
            if match:
                app_name, app_id, source = match.groups()
                if name.lower() in app_name.lower():
                    return app_id.strip()

        return None
    except Exception as e:
        print("[ERROR] Saat mencari app ID:", e)
        return None

def install_app_winget(name):
    try:
        toaster.show_toast("Install Aplikasi", f"Mencari {name} di Winget...", duration=5)

        app_id = find_app_id(name)
        if not app_id:
            toaster.show_toast("Install Gagal", f"Tidak menemukan aplikasi {name} di Winget.", duration=5)
            print("[ERROR] App ID tidak ditemukan")
            return

        toaster.show_toast("Install Aplikasi", f"Memulai install {name}...", duration=5)
        print(f"[INSTALL] Installing {app_id}...")

        result = subprocess.run(
            f"winget install --id {app_id} --exact --accept-source-agreements --accept-package-agreements --silent",
            shell=True, capture_output=True, text=True
        )

        if result.returncode == 0:
            toaster.show_toast("Install Selesai", f"{name} berhasil diinstall!", duration=5)
            print("[DONE]", result.stdout)
        else:
            toaster.show_toast("Install Gagal", f"Error install {name}", duration=5)
            print("[ERROR]", result.stdout, result.stderr)

    except Exception as e:
        toaster.show_toast("Install Gagal", f"Exception: {e}", duration=5)
        print("[EXCEPTION]", str(e))

def on_message(ws, message):
    try:
        print("[DEBUG] Pesan diterima:", message)
        data = json.loads(message)
        command = data.get("command")

        if isinstance(command, str):
            print("[EXEC]", command)
            subprocess.run(command, shell=True)

        elif isinstance(command, dict):
            if command.get("type") == "install_app":
                method = command.get("method")
                name = command.get("name")
                url = command.get("download_url")

                if method == "winget" and name:
                    install_app_winget(name)
                elif method == "direct" and url:
                    install_from_url(name, url)
                else:
                    print("[ERROR] Invalid install command:", command)
            else:
                print("[ERROR] Unknown command type:", command)
        else:
            print("[ERROR] Format command tidak dikenali:", command)

    except Exception as e:
        print("[EXCEPTION]", str(e))

def on_error(ws, error):
    print("[ERROR] WebSocket:", error)

def on_close(ws, close_status_code, close_msg):
    print("[INFO] WebSocket ditutup")

def on_open(ws):
    print("[INFO] Tersambung ke WebSocket Server")

ws = websocket.WebSocketApp("ws://192.168.1.13:7071",
                            on_open=on_open,
                            on_message=on_message,
                            on_error=on_error,
                            on_close=on_close)

ws.run_forever()
