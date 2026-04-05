results = []
with open('backend/main.py', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if 'ai_client' in line:
            results.append(f"LINE {i}: {line.rstrip()}")

with open('backend/ai_client_lines.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(results))
print(f"Found {len(results)} lines")
