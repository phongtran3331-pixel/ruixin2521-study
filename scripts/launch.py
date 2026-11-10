#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
睿信2521学习交流站 - 启动器
"""

import os
import sys
import socket
import subprocess

SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(SCRIPT_DIR)


def print_banner():
    print("=" * 44)
    print("  睿信2521学习交流站 - 启动器")
    print("=" * 44)
    print()


def run_scan():
    print('[1/3] 正在扫描目录...')
    result = subprocess.run([sys.executable, 'scripts/scan_all.py'])
    if result.returncode != 0:
        print('      [WARN] 扫描可能有问题，继续启动...')
    print()


def get_network_info():
    print('[2/3] 正在获取网络信息...')
    hostname = socket.gethostname()
    print(f'      主机名: {hostname}')

    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(2)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        if not ip.startswith('127.'):
            print(f'      局域网IP: {ip}')
            print(f'      访问地址: http://{ip}:8080')
    except Exception:
        print('      [WARN] 无法获取局域网IP')
    print()


def start_server():
    print('[3/3] 正在启动 HTTP 服务器...')
    print('      绑定地址: 0.0.0.0:8080')
    print('      本地访问: http://localhost:8080')
    print()
    print("=" * 44)
    print("  服务器运行中，按 Ctrl+C 停止服务")
    print("=" * 44)
    print()

    try:
        subprocess.run([sys.executable, '-m', 'http.server', '8080', '--bind', '0.0.0.0'])
    except KeyboardInterrupt:
        pass

    print()
    print('服务器已停止。')
    input('按 Enter 键退出...')


def main():
    print_banner()
    run_scan()
    get_network_info()
    start_server()


if __name__ == '__main__':
    main()
