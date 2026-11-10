#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
睿信2521学习交流站 - 统一扫描工具
扫描 class_files/ 和 notices/ 目录，生成索引文件
"""

import os
import json
import sys


def scan_tree(root_path):
    """递归扫描目录树，返回扁平化文件列表"""
    items = []
    if not os.path.exists(root_path):
        return items

    for dirpath, dirnames, filenames in os.walk(root_path):
        # 相对路径
        rel_dir = os.path.relpath(dirpath, root_path)
        if rel_dir == '.':
            rel_dir = ''

        # 记录文件夹
        if rel_dir:
            items.append({
                'type': 'folder',
                'path': rel_dir.replace('\\', '/')
            })

        # 记录文件
        for name in sorted(filenames):
            filepath = os.path.join(dirpath, name)
            rel_file = os.path.relpath(filepath, root_path).replace('\\', '/')
            items.append({
                'type': 'file',
                'path': rel_file,
                'size': os.path.getsize(filepath)
            })

    # 去重并排序
    seen = set()
    unique = []
    for item in items:
        key = item['type'] + ':' + item['path']
        if key not in seen:
            seen.add(key)
            unique.append(item)

    return sorted(unique, key=lambda x: (x['type'] != 'folder', x['path'].lower()))


def scan_notices(root_path):
    """扫描 notices/ 目录，每个子文件夹是一条通知"""
    notices = []
    if not os.path.exists(root_path):
        return notices

    for name in sorted(os.listdir(root_path), reverse=True):
        folder_path = os.path.join(root_path, name)
        if not os.path.isdir(folder_path):
            continue

        notice_file = os.path.join(folder_path, '通知.txt')
        if not os.path.exists(notice_file):
            continue

        # 解析通知内容
        item = {'folder': name, 'attachments': []}
        try:
            with open(notice_file, 'r', encoding='utf-8') as f:
                content = f.read()
            for line in content.split('\n'):
                line = line.strip()
                if not line:
                    continue
                match = line.split(':', 1)
                if len(match) == 2:
                    key = match[0].strip()
                    val = match[1].strip()
                    if key == '标题':
                        item['title'] = val
                    elif key == '时间':
                        item['time'] = val
                    elif key == '紧急':
                        item['urgent'] = (val == '是')
                    elif key == '内容':
                        item['content'] = val
        except Exception as e:
            print(f'  [WARN] 读取通知失败: {name} - {e}')
            continue

        # 收集附件（除了通知.txt以外的文件/文件夹）
        for sub in sorted(os.listdir(folder_path)):
            if sub == '通知.txt':
                continue
            item['attachments'].append(sub)

        notices.append(item)

    # 按时间倒序
    notices.sort(key=lambda x: x.get('time', ''), reverse=True)
    return notices


def main():
    os.makedirs('data', exist_ok=True)

    # 扫描班级文件
    print('[1/2] 扫描 class_files/ ...')
    class_files = scan_tree('class_files')
    with open('data/class_files_index.json', 'w', encoding='utf-8') as f:
        json.dump(class_files, f, ensure_ascii=False, indent=2)
    folder_count = sum(1 for x in class_files if x['type'] == 'folder')
    file_count = sum(1 for x in class_files if x['type'] == 'file')
    print(f'      [OK] {folder_count} 个文件夹, {file_count} 个文件')

    # 扫描通知
    print('[2/2] 扫描 notices/ ...')
    notices = scan_notices('notices')
    with open('data/notices_index.json', 'w', encoding='utf-8') as f:
        json.dump(notices, f, ensure_ascii=False, indent=2)
    print(f'      [OK] {len(notices)} 条通知')


if __name__ == '__main__':
    try:
        main()
        sys.exit(0)
    except Exception as e:
        print(f'[ERROR] {e}', file=sys.stderr)
        sys.exit(1)
