#!/usr/bin/env python3
"""data/questions.json + src/ -> index.html (단일 파일, 오프라인 실행용)
사용법: python3 build.py
문제를 고칠 때는 data/questions.json만 수정한 뒤 이 스크립트를 실행하세요."""
import json, pathlib, sys
root = pathlib.Path(__file__).parent
data = json.loads((root / 'data/questions.json').read_text(encoding='utf8'))
errors = []
seen = set()
for q in data['questions']:
    for k in ('id', 'd', 'lv', 'q', 'a', 'w', 'e', 'src', 'st'):
        if k not in q: errors.append(f"{q.get('id')}: '{k}' 없음")
    if len(q.get('w', [])) != 3: errors.append(f"{q['id']}: 오답은 3개여야 함")
    if q.get('a') in q.get('w', []): errors.append(f"{q['id']}: 정답이 오답 목록에 있음")
    if q['id'] in seen: errors.append(f"{q['id']}: ID 중복")
    if q['q'] in seen: errors.append(f"{q['id']}: 같은 문제 중복")
    seen.update([q['id'], q['q']])
    if q.get('d') not in [d['name'] for d in data['domains']]: errors.append(f"{q['id']}: 모르는 영역 {q.get('d')}")
if errors:
    print('\n'.join(errors)); sys.exit(1)
names = [d['name'] for d in data['domains']]
js = ''.join(f'const D{i+1}={json.dumps(n, ensure_ascii=False)};' for i, n in enumerate(names)) + '\n'
js += 'const BANK=' + json.dumps([[q['d'], q['q'], [q['a']] + q['w'], q['e']] for q in data['questions']], ensure_ascii=False) + ';\n'
js += 'const META=' + json.dumps([{'key': q['id'], 'lv': q['lv'], 'st': q['st'], 'src': {k: v for k, v in q['src'].items() if k in ('t', 'u')}} for q in data['questions']], ensure_ascii=False) + ';\n'
js += 'const STUDY={' + ','.join(f'[D{i+1}]:{json.dumps(d["study"], ensure_ascii=False)}' for i, d in enumerate(data['domains'])) + '};\n'
shell = (root / 'src/shell.html').read_text(encoding='utf8')
engine = (root / 'src/engine.js').read_text(encoding='utf8')
(root / 'index.html').write_text(shell.replace('/*DATA*/', js).replace('/*ENGINE*/', engine), encoding='utf8')
c = {}
for q in data['questions']: c[q['d']] = c.get(q['d'], 0) + 1
print(f"index.html 생성: {len(data['questions'])}문항", c)
