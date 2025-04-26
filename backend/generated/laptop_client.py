
import websocket
import subprocess
import json
import os
import requests
import re
from tqdm import tqdm
import time

API_BASE_URL = "http://192.168.1.13:5000/api/v1"
ROBOT_TOKEN = "129b30ba437ac551bf9622931f010d2e1206f85c06330a4cf3da2be0d74305f0"

def send_log(status, command, result):
    try:
        data = {
            "status": status,
            "command": command,
            "result": result,
            "token": ROBOT_TOKEN
        }
        
        response = requests.post(f"{API_BASE_URL}/user/log", json=data)
        
        if response.status_code == 200:
            print(f"[LOG] Berhasil mengirim log: {status} - {command}")
        else:
            print(f"[ERROR] Gagal mengirim log: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"[ERROR] Gagal mengirim log: {e}")

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

def check_app_installed(name):
    try:
        result = subprocess.run(f"winget list {name}", shell=True, capture_output=True, text=True)
        if result.returncode == 0 and name.lower() in result.stdout.lower():
            return True
        return False
    except Exception as e:
        print(f"[ERROR] Gagal mengecek aplikasi: {e}")
        return False

def install_from_url(name, url):
    try:
        if check_app_installed(name):
            message = f"Aplikasi {name} sudah terinstall di sistem"
            print("[INFO]", message)
            send_log("info", f"check_install {name}", message)
            return
            
        print(f"[INSTALL] Mengunduh dan menginstall {name} dari URL: {url}")
        filename = f"{name}_installer.exe"
        
        if download_with_progress(url, filename):
            result = subprocess.run(filename, shell=True, capture_output=True, text=True)
            success_msg = f"[DONE] {name} berhasil diinstall."
            print(success_msg)
            send_log("success", f"install {name}", success_msg)
        else:
            error_msg = f"Gagal mengunduh {name}"
            print("[ERROR]", error_msg)
            send_log("error", f"install {name}", error_msg)
    except Exception as e:
        error_msg = f"Error installing {name}: {str(e)}"
        print("[ERROR]", error_msg)
        send_log("error", f"install {name}", error_msg)

def find_app_id(name):
    try:
        print(f"[INSTALL] Mencari aplikasi: {name}")
        result = subprocess.run(f"winget search {name}", shell=True, capture_output=True, text=True)
        output = result.stdout
        lines = output.splitlines()
        for line in lines:
            match = re.search(r'^s*(.*?)s{2,}(.*?)s{2,}(.*?)$', line)
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
        if check_app_installed(name):
            message = f"Aplikasi {name} sudah terinstall di sistem"
            print("[INFO]", message)
            send_log("info", f"check_install {name}", message)
            return
            
        print(f"[INFO] Mencari {name} di Winget...")
        app_id = find_app_id(name)
        if not app_id:
            error_msg = f"Tidak menemukan aplikasi {name} di Winget"
            print("[ERROR]", error_msg)
            send_log("error", f"install {name}", error_msg)
            return

        print(f"[INSTALL] Installing {app_id}...")
        result = subprocess.run(
            f"winget install --id {app_id} --exact --accept-source-agreements --accept-package-agreements --silent",
            shell=True, capture_output=True, text=True
        )

        if result.returncode == 0:
            success_msg = f"{name} berhasil diinstall!"
            print("[SUCCESS]", success_msg)
            send_log("success", f"install {name}", success_msg)
        else:
            error_msg = f"Error install {name}: {result.stderr}"
            print("[ERROR]", error_msg)
            send_log("error", f"install {name}", error_msg)

    except Exception as e:
        error_msg = f"Exception saat install {name}: {str(e)}"
        print("[ERROR]", error_msg)
        send_log("error", f"install {name}", error_msg)

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
        send_log("error", "command_execution", str(e))

def on_error(ws, error):
    print("[ERROR] WebSocket:", error)
    send_log("error", "websocket", str(error))

def on_close(ws, close_status_code, close_msg):
    print("[INFO] WebSocket ditutup")
    send_log("info", "websocket", "Koneksi websocket terputus")

def on_open(ws):
    print("[INFO] Tersambung ke WebSocket Server")
    send_log("info", "websocket", "Koneksi websocket terhubung")

ws = websocket.WebSocketApp("ws://192.168.1.13:7071",
                            on_open=on_open,
                            on_message=on_message,
                            on_error=on_error,
                            on_close=on_close)

ws.run_forever()
