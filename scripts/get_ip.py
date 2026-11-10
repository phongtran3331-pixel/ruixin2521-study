#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
睿信2521学习交流站 - 网络信息获取工具
获取本机局域网 IP 地址，用于提示局域网访问地址
"""

import socket
import sys


def get_network_info():
    hostname = socket.gethostname()
    print(f'    主机名: {hostname}')

    # 方法1: 尝试连接外网获取本机出口 IP
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(2)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        if not ip.startswith('127.'):
            print(f'    局域网IP: {ip}')
            print(f'    访问地址: http://{ip}:8080')
            return ip
    except Exception:
        pass

    # 方法2: 通过 gethostbyname 获取
    try:
        ip = socket.gethostbyname(hostname)
        if not ip.startswith('127.'):
            print(f'    局域网IP: {ip}')
            print(f'    访问地址: http://{ip}:8080')
            return ip
    except Exception:
        pass

    print('    [WARN] 无法获取局域网 IP，请手动查询')
    return None


if __name__ == '__main__':
    get_network_info()
