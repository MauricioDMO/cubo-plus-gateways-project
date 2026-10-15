"""Run with: python3 content/_migration/verify.py (standard library only)."""

import hashlib
import json
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit


def verify():
    root = Path(__file__).resolve().parents[1]
    inventory = json.loads((root / '_migration/inventory.json').read_text())
    pages = [page for page in inventory['pages'] if page['markdown_file']]
    assert len({page['markdown_file'] for page in pages}) == len(pages), 'Duplicate output paths'
    by_url = {page['url']: page for page in pages}
    for page in pages:
        path = root / page['markdown_file']
        text = path.read_text()
        assert text.startswith('---\n'), f'{path}: missing frontmatter'
        header, body = text[4:].split('\n---', 1)
        for field in ('title', 'source_url', 'canonical_url', 'language', 'captured_at', 'source_sha256', 'type'):
            assert re.search(rf'^{field}:', header, re.M), f'{path}: missing {field}'
        captured = re.search(r'^captured_at:\s*(.+)$', header, re.M).group(1).strip('\'"')
        assert captured == inventory['captured_at'], f'{path}: inconsistent capture timestamp'
        assert page['url'] in header, f'{path}: wrong source URL'
        assert page['source_sha256'] in header, f'{path}: missing source fingerprint'
        assert body.strip(), f'{path}: empty content'
        assert 'Checking your browser' not in body, f'{path}: anti-bot response'
        if page['kind'] == 'redirect':
            assert page['final_url'] in text, f'{path}: missing redirect destination'
            assert page['final_url'] in by_url, f'{path}: unknown redirect target'
        cached = Path(page['source_file'])
        if cached.exists():
            assert hashlib.sha256(cached.read_text().encode()).hexdigest() == page['source_sha256'], f'{path}: changed source snapshot'
    for path in root.rglob('*.md'):
        for target in re.findall(r'\]\(([^\s)]+)', path.read_text()):
            parsed = urlsplit(target.strip('<>'))
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            destination = (path.parent / unquote(parsed.path)).resolve()
            assert destination.is_relative_to(root), f'{path}: local link escapes content: {target}'
            assert destination.exists(), f'{path}: broken local link: {target}'
    for name in ('blog', 'properties', 'archives', 'general'):
        report = json.loads((root / f'_migration/{name}-verification.json').read_text())
        assert report, f'{name}: empty verification report'
    reviewed_urls = []
    for name in ('catalogs-archives', 'articles-pages'):
        report = json.loads((root / f'_migration/cross-verification-{name}.json').read_text())
        assert report['result'] == 'passed', f'{name}: content review incomplete'
        for record in report['records']:
            reviewed_urls.append(record['source_url'])
            current_hash = hashlib.sha256((root / record['markdown_file']).read_bytes()).hexdigest()
            assert current_hash == record['output_sha256'], f'{name}: output changed since content review: {record["markdown_file"]}'
            for key in ('missing_text', 'missing_text_nodes', 'missing_links', 'missing_images', 'missing_image_alts'):
                assert not record.get(key), f'{name}: unresolved {key} in {record["markdown_file"]}'
    assert len(reviewed_urls) == len(pages) and set(reviewed_urls) == set(by_url), 'Content review coverage gap'
    discovery = json.loads((root / '_migration/discovery-verification.json').read_text())
    for collection in discovery['collections'].values():
        assert not collection['missing_from_inventory'], 'Discovery gap in public WordPress content'
    print(f"OK: {len(pages)} Markdown pages, {len(inventory['pages'])} inventoried URLs, local links, fingerprints and verification reports.")


if __name__ == '__main__':
    verify()
