#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
睿信2521学习交流站 - finals/ 文件夹扫描索引工具
扫描 finals/ 目录下的所有文件，生成 JSON 索引供前端读取
"""

import os
import json
import sys


def scan_finals():
    folder = 'finals'
    files = []

    if os.path.exists(folder):
        for name in sorted(os.listdir(folder)):
            path = os.path.join(folder, name)
            if os.path.isfile(path):
                files.append({
                    'name': name,
                    'size': os.path.getsize(path)
                })

    # 写入索引文件
    os.makedirs('data', exist_ok=True)
    with open('data/finals_index.json', 'w', encoding='utf-8') as f:
        json.dump(files, f, ensure_ascii=False, indent=2)

    # 输出统计
    total_size = sum(f['size'] for f in files)
    if total_size < 1024:
        size_str = f'{total_size} B'
    elif total_size < 1024 * 1024:
        size_str = f'{total_size / 1024:.1f} KB'
    else:
        size_str = f'{total_size / (1024 * 1024):.2f} MB'

    print('[OK] 索引生成完成')
    print(f'     文件数: {len(files)} 个')
    print(f'     总大小: {size_str}')

    return len(files)


if __name__ == '__main__':
    try:
        count = scan_finals()
        sys.exit(0)
    except Exception as e:
        print(f'[ERROR] {e}', file=sys.stderr)
        sys.exit(1)
