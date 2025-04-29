import websocket
import subprocess
import json
import os
import requests
import re
from tqdm import tqdm
import time
import platform
import psutil
import wmi
import winreg
import GPUtil
from datetime import datetime

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
            print(f"[{status.upper()}] {command}: {result}")
        else:
            print(f"[ERROR] Gagal mengirim log: {response.status_code}")
            
    except Exception as e:
        print(f"[ERROR] Gagal mengirim log: {str(e)}")

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
        winget_result = subprocess.run(
            f'winget list "{name}"', 
            shell=True, 
            capture_output=True, 
            text=True,
            encoding='utf-8'
        )
        
        reg_result = subprocess.run(
            f'reg query HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall /s /f "{name}"',
            shell=True,
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        
        store_result = subprocess.run(
            f'powershell -command "Get-AppxPackage *{name}*"',
            shell=True,
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        
        if (winget_result.returncode == 0 and name.lower() in winget_result.stdout.lower()) or \
           (reg_result.returncode == 0 and name.lower() in reg_result.stdout.lower()) or \
           (store_result.returncode == 0 and name.lower() in store_result.stdout.lower()):
            print(f"[INFO] Aplikasi {name} ditemukan")
            return True
            
        print(f"[INFO] Aplikasi {name} tidak ditemukan")
        return False
            
    except Exception as e:
        print(f"[ERROR] Gagal mengecek aplikasi: {str(e)}")
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
        result = subprocess.run(
            ["winget", "search", name, "--accept-source-agreements"], 
            capture_output=True, 
            text=True,
            encoding='utf-8'
        )
        
        print(f"[DEBUG] Winget search output: {result.stdout}")
        
        if result.returncode != 0:
            print(f"[ERROR] Winget search error: {result.stderr}")
            return None
            
        lines = result.stdout.splitlines()
        found_apps = []
        
        for line in lines:
            match = re.search(r'^([^\s].*?)\s+([^\s].*?)\s+([^\s].*?)\s+([^\s].*?)$', line)
            if match:
                app_name, id, version, source = match.groups()
                app_name = app_name.strip()
                id = id.strip()
                source = source.strip()
                
                if name.lower() in app_name.lower():
                    found_apps.append({
                        "name": app_name,
                        "id": id,
                        "source": source
                    })
                    print(f"[INFO] Menemukan aplikasi - Nama: {app_name}, ID: {id}, Source: {source}")
        
        if found_apps:
            winget_apps = [app for app in found_apps if "winget" in app["source"].lower()]
            if winget_apps:
                selected = winget_apps[0]
            else:
                selected = found_apps[0]
                
            print(f"[INFO] Menggunakan aplikasi: {selected['name']} dari {selected['source']}")
            return selected["id"]
                    
        print(f"[INFO] Tidak menemukan ID untuk aplikasi: {name}")
        return None
        
    except Exception as e:
        print(f"[ERROR] Error saat mencari app ID: {str(e)}")
        return None

def install_app_winget(name):
    try:
        if check_app_installed(name):
            message = f"Aplikasi {name} sudah terinstall di sistem"
            print("[INFO]", message)
            send_log("info", f"check_install {name}", message)
            return True, message
            
        print(f"[INFO] Mencari {name} di Winget...")
        app_id = find_app_id(name)
        
        if not app_id:
            error_msg = f"Tidak menemukan aplikasi {name} di Winget"
            print("[ERROR]", error_msg)
            send_log("error", f"install {name}", error_msg)
            return False, error_msg

        print(f"[INSTALL] Installing {app_id}...")
        install_cmd = [
            "winget", "install", 
            "--id", app_id,
            "--accept-source-agreements",
            "--accept-package-agreements",
            "--silent"
        ]
        
        result = subprocess.run(
            install_cmd,
            capture_output=True,
            text=True,
            encoding='utf-8'
        )

        print(f"[DEBUG] Install output: {result.stdout}")
        if result.stderr:
            print(f"[DEBUG] Install stderr: {result.stderr}")

        if result.returncode == 0:
            success_msg = f"{name} berhasil diinstall!"
            print("[SUCCESS]", success_msg)
            send_log("success", f"install {name}", success_msg)
            return True, success_msg
        else:
            error_msg = f"Error install {name}: {result.stderr or result.stdout}"
            print("[ERROR]", error_msg)
            send_log("error", f"install {name}", error_msg)
            return False, error_msg

    except Exception as e:
        error_msg = f"Exception saat install {name}: {str(e)}"
        print("[ERROR]", error_msg)
        send_log("error", f"install {name}", error_msg)
        return False, error_msg

def get_system_info():
    try:
        c = wmi.WMI()
        system = c.Win32_ComputerSystem()[0]
        os = c.Win32_OperatingSystem()[0]
        cpu = c.Win32_Processor()[0]
        bios = c.Win32_BIOS()[0]

        ram = psutil.virtual_memory()
        ram_total = ram.total / (1024 * 1024 * 1024)
        ram_used = ram.used / (1024 * 1024 * 1024)

        disks = []
        for disk in psutil.disk_partitions():
            try:
                usage = psutil.disk_usage(disk.mountpoint)
                disks.append({
                    'device': disk.device,
                    'mountpoint': disk.mountpoint,
                    'total': usage.total / (1024 * 1024 * 1024),
                    'used': usage.used / (1024 * 1024 * 1024)
                })
            except:
                continue

        gpus = []
        try:
            for gpu in GPUtil.getGPUs():
                gpus.append({
                    'name': gpu.name,
                    'memory_total': gpu.memoryTotal,
                    'memory_used': gpu.memoryUsed,
                    'temperature': gpu.temperature
                })
        except:
            pass

        system_info = {
            'computer_name': system.Name,
            'manufacturer': system.Manufacturer,
            'model': system.Model,
            'os_name': os.Caption,
            'os_version': os.Version,
            'os_arch': os.OSArchitecture,
            'cpu_name': cpu.Name,
            'cpu_cores': cpu.NumberOfCores,
            'cpu_threads': cpu.NumberOfLogicalProcessors,
            'ram_total': round(ram_total, 2),
            'ram_used': round(ram_used, 2),
            'bios_version': bios.Version,
            'disks': disks,
            'gpus': gpus,
            'last_boot': os.LastBootUpTime.split('.')[0],
            'timestamp': datetime.now().isoformat()
        }

        send_log("info", "system_info", json.dumps(system_info))
        return system_info
    except Exception as e:
        error_msg = f"Error getting system info: {str(e)}"
        print("[ERROR]", error_msg)
        send_log("error", "system_info", error_msg)
        return None

def get_installed_apps():
    try:
        apps = []
      
        paths = [
            r"SOFTWARE\Microsoft\Windows\CurrentVersion\\Uninstall",
            r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\\Uninstall"
        ]
        
        for path in paths:
            try:
                with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, path) as key:
                    for i in range(winreg.QueryInfoKey(key)[0]):
                        try:
                            subkey_name = winreg.EnumKey(key, i)
                            with winreg.OpenKey(key, subkey_name) as subkey:
                                try:
                                    name = winreg.QueryValueEx(subkey, "DisplayName")[0]
                                    version = winreg.QueryValueEx(subkey, "DisplayVersion")[0]
                                    apps.append({
                                        "name": name.strip(),
                                        "version": version.strip()
                                    })
                                except:
                                    continue
                        except:
                            continue
            except:
                continue

        try:
            result = subprocess.run("winget list", shell=True, capture_output=True, text=True)
            if result.returncode == 0:
                lines = result.stdout.splitlines()
                for line in lines[2:]: 
                    match = re.search(r'^(.*?)\s{2,}(.*?)\s{2,}(.*?)$', line)
                    if match:
                        name, _, version = match.groups()
                      
                        app_name = name.strip()
                        if not any(app["name"].lower() == app_name.lower() for app in apps):
                            apps.append({
                                "name": app_name,
                                "version": version.strip()
                            })
        except Exception as e:
            print("[ERROR] Gagal mendapatkan daftar aplikasi dari winget:", str(e))

        try:
            data = {
                "token": ROBOT_TOKEN,
                "installedApps": apps,
                "shouldGenerateCommands": False
            }
            response = requests.post(f"{API_BASE_URL}/system/update-apps", json=data)
            if response.status_code == 200:
                print("[INFO] Berhasil update daftar aplikasi di database")
                print(f"[INFO] Total aplikasi terdeteksi: {len(apps)}")
            else:
                print("[ERROR] Gagal update database:", response.text)
        except Exception as e:
            print("[ERROR] Gagal update database:", str(e))

        return apps
    except Exception as e:
        error_msg = f"Error getting installed apps: {str(e)}"
        print("[ERROR]", error_msg)
        send_log("error", "installed_apps", error_msg)
        return None

def get_registry_apps():
    apps = []
    paths = [
        r"SOFTWARE\Microsoft\Windows\CurrentVersion\\Uninstall",
        r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\\Uninstall"
    ]
    
    for path in paths:
        try:
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, path) as key:
                for i in range(winreg.QueryInfoKey(key)[0]):
                    try:
                        subkey_name = winreg.EnumKey(key, i)
                        with winreg.OpenKey(key, subkey_name) as subkey:
                            try:
                                name = winreg.QueryValueEx(subkey, "DisplayName")[0]
                                version = winreg.QueryValueEx(subkey, "DisplayVersion")[0]
                                publisher = winreg.QueryValueEx(subkey, "Publisher")[0]
                                install_date = winreg.QueryValueEx(subkey, "InstallDate")[0]
                                
                                apps.append({
                                    "name": name,
                                    "version": version,
                                    "publisher": publisher,
                                    "install_date": install_date
                                })
                            except:
                                continue
                    except:
                        continue
        except:
            continue
    
    return apps

def get_running_processes():
    try:
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                pinfo = proc.as_dict()
                processes.append({
                    'pid': pinfo['pid'],
                    'name': pinfo['name'],
                    'cpu_percent': pinfo['cpu_percent'],
                    'memory_percent': pinfo['memory_percent']
                })
            except:
                continue

        return processes
    except Exception as e:
        error_msg = f"Error getting running processes: {str(e)}"
        print("[ERROR]", error_msg)
        send_log("error", "running_processes", error_msg)
        return None

def close_all_apps():
    try:
        processes = get_running_processes()
        closed_apps = []
        
        for proc in processes:
            try:
                if proc['name'].lower() not in ['python.exe', 'pythonw.exe', 'explorer.exe', 'system']:
                    psutil.Process(proc['pid']).terminate()
                    closed_apps.append(proc['name'])
            except:
                continue

        success_msg = f"Berhasil menutup aplikasi: {', '.join(closed_apps)}"
        print("[SUCCESS]", success_msg)
        send_log("success", "close_all_apps", success_msg)
        return True
    except Exception as e:
        error_msg = f"Error closing apps: {str(e)}"
        print("[ERROR]", error_msg)
        send_log("error", "close_all_apps", error_msg)
        return False

def uninstall_app(name):
    try:
        print(f"[UNINSTALL] Menjalankan uninstall untuk: {name}")
        
        if not check_app_installed(name):
            error_msg = f"Aplikasi {name} tidak ditemukan"
            print(f"[ERROR] {error_msg}")
            return False, error_msg
            
        uninstall_commands = [
            f'winget uninstall --name "{name}" --silent',
            f'winget uninstall --id "{name}" --silent',
            f'wmic product where "name like \'%{name}%\'" call uninstall /nointeractive',
            f'powershell -command "Get-AppxPackage *{name}* | Remove-AppxPackage"'
        ]
        
        success = False
        for cmd in uninstall_commands:
            print(f"[DEBUG] Mencoba command: {cmd}")
            result = subprocess.run(
                cmd,
                shell=True, 
                capture_output=True, 
                text=True,
                encoding='utf-8'
            )

            print(f"[DEBUG] Output: {result.stdout}")
            if result.stderr:
                print(f"[DEBUG] Error: {result.stderr}")

            if result.returncode == 0 and not check_app_installed(name):
                success = True
                break
                
        if success:
            success_msg = f"Aplikasi {name} berhasil di-uninstall"
            print(f"[SUCCESS] {success_msg}")
            send_log("success", f"uninstall {name}", success_msg)
            
            time.sleep(2)
            get_installed_apps()
            return True
        else:
            error_msg = f"Gagal uninstall {name}"
            print(f"[ERROR] {error_msg}")
            send_log("error", f"uninstall {name}", error_msg)
            return False

    except Exception as e:
        error_msg = f"Error saat uninstall {name}: {str(e)}"
        print(f"[ERROR] {error_msg}")
        send_log("error", f"uninstall {name}", error_msg)
        return False

def on_message(ws, message):
    try:
        print("\n[DEBUG] -------- Pesan Baru --------")
        print(f"[DEBUG] Pesan diterima: {message}")
        data = json.loads(message)
        command = data.get("command")
        token = data.get("token")

        if not token:
            print("[ERROR] Token tidak ditemukan")
            return

        response = {
            "token": token,
            "status": "success",
            "result": "Command berhasil dieksekusi"
        }

        if isinstance(command, dict):
            command_type = command.get("type")
            print(f"[INFO] Menjalankan command type: {command_type}")
            
            if command_type == "shell_command":
                try:
                    cmd = command.get("command")
                    print(f"[EXEC] Menjalankan: {cmd}")
                    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8')
                    
                    if result.returncode == 0:
                        response["status"] = "success"
                        response["result"] = f"Command berhasil dieksekusi"
                        print(f"[SUCCESS] Command berhasil")
                    else:
                        response["status"] = "error"
                        response["result"] = f"Error: {result.stderr}"
                        print(f"[ERROR] Command gagal: {result.stderr}")
                except Exception as e:
                    response["status"] = "error"
                    response["result"] = str(e)
                    print(f"[ERROR] Exception: {str(e)}")
            
            elif command_type == "uninstall_app":
                name = command.get("name")
                if not name:
                    response["status"] = "error"
                    response["result"] = "Nama aplikasi tidak diberikan"
                else:
                    success, message = uninstall_app(name)
                    if success:
                        get_installed_apps() 
                        response["status"] = "success"
                        response["result"] = message
                    else:
                        response["status"] = "error"
                        response["result"] = message

            elif command_type == "install_app":
                method = command.get("method")
                name = command.get("name")
                url = command.get("download_url")

                if not name:
                    response["status"] = "error"
                    response["result"] = "Nama aplikasi tidak diberikan"
                elif method == "winget":
                    success, message = install_app_winget(name)
                    response["status"] = "success" if success else "error"
                    response["result"] = message
                elif method == "direct" and url:
                    if check_app_installed(name):
                        response["status"] = "info"
                        response["result"] = f"Aplikasi {name} sudah terinstall"
                    else:
                        install_from_url(name, url)
                        response["result"] = f"Aplikasi {name} berhasil diinstall"
                else:
                    response["status"] = "error"
                    response["result"] = "Invalid install command"
            else:
                response["status"] = "error"
                response["result"] = f"Tipe command tidak dikenal: {command_type}"
        else:
            response["status"] = "error"
            response["result"] = f"Format command tidak dikenali: {type(command)}"

        print(f"[RESPONSE] Mengirim: {response}")
        print("[DEBUG] -------- Selesai --------\n")
        ws.send(json.dumps(response))

    except Exception as e:
        print(f"[ERROR] Error tidak terduga: {str(e)}")
        if token:
            error_response = {
                "token": token,
                "status": "error",
                "result": str(e)
            }
            ws.send(json.dumps(error_response))

def on_error(ws, error):
    print("[ERROR] WebSocket:", error)

def on_close(ws, close_status_code, close_msg):
    print("[INFO] WebSocket ditutup")

def on_open(ws):
    print("[INFO] Tersambung ke WebSocket Server")
    
    system_info = get_system_info()
    installed_apps = get_installed_apps()
    
    try:
        data = {
            "token": ROBOT_TOKEN,
            "systemInfo": system_info,
            "installedApps": installed_apps
        }
        
        response = requests.post(f"{API_BASE_URL}/system/update", json=data)
        
        if response.status_code == 200:
            print("[INFO] Berhasil menyimpan informasi sistem ke database")
        else:
            print("[ERROR] Gagal menyimpan informasi sistem:", response.text)
            
    except Exception as e:
        print("[ERROR] Gagal mengirim informasi sistem:", str(e))

def run_websocket():
    while True:
        try:
            ws = websocket.WebSocketApp("ws://192.168.1.13:7071",
                                    on_open=on_open,
                                    on_message=on_message,
                                    on_error=on_error,
                                    on_close=on_close)
            
            ws.run_forever()
            print("[INFO] Mencoba reconnect dalam 5 detik...")
            time.sleep(5)
        except Exception as e:
            print(f"[ERROR] WebSocket error: {str(e)}")
            print("[INFO] Mencoba reconnect dalam 5 detik...")
            time.sleep(5)

if __name__ == "__main__":
    run_websocket()
