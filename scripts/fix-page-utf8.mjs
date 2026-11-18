import fs from 'node:fs';
import path from 'node:path';

const pagesDir = path.resolve('src/pages');

function findInvalidUtf8(buf) {
  const issues = [];
  let i = 0;
  while (i < buf.length) {
    const c = buf[i];
    if (c <= 0x7f) {
      i += 1;
      continue;
    }
    if ((c & 0xe0) === 0xc0) {
      if (i + 1 >= buf.length || (buf[i + 1] & 0xc0) !== 0x80 || c < 0xc2) {
        issues.push(i);
        i += 1;
        continue;
      }
      i += 2;
      continue;
    }
    if ((c & 0xf0) === 0xe0) {
      if (
        i + 2 >= buf.length ||
        (buf[i + 1] & 0xc0) !== 0x80 ||
        (buf[i + 2] & 0xc0) !== 0x80
      ) {
        issues.push(i);
        i += 1;
        continue;
      }
      i += 3;
      continue;
    }
    if ((c & 0xf8) === 0xf0) {
      if (
        i + 3 >= buf.length ||
        (buf[i + 1] & 0xc0) !== 0x80 ||
        (buf[i + 2] & 0xc0) !== 0x80 ||
        (buf[i + 3] & 0xc0) !== 0x80
      ) {
        issues.push(i);
        i += 1;
        continue;
      }
      i += 4;
      continue;
    }
    issues.push(i);
    i += 1;
  }
  return issues;
}

function repair(buf) {
  // Replace lone 0xB7 with UTF-8 middle dot; drop other lone high bytes as '?'
  const out = [];
  let i = 0;
  while (i < buf.length) {
    const c = buf[i];
    if (c <= 0x7f) {
      out.push(c);
      i += 1;
      continue;
    }
    // Valid multi-byte sequences pass through
    if ((c & 0xe0) === 0xc0 && i + 1 < buf.length && (buf[i + 1] & 0xc0) === 0x80 && c >= 0xc2) {
      out.push(c, buf[i + 1]);
      i += 2;
      continue;
    }
    if (
      (c & 0xf0) === 0xe0 &&
      i + 2 < buf.length &&
      (buf[i + 1] & 0xc0) === 0x80 &&
      (buf[i + 2] & 0xc0) === 0x80
    ) {
      out.push(c, buf[i + 1], buf[i + 2]);
      i += 3;
      continue;
    }
    if (
      (c & 0xf8) === 0xf0 &&
      i + 3 < buf.length &&
      (buf[i + 1] & 0xc0) === 0x80 &&
      (buf[i + 2] & 0xc0) === 0x80 &&
      (buf[i + 3] & 0xc0) === 0x80
    ) {
      out.push(c, buf[i + 1], buf[i + 2], buf[i + 3]);
      i += 4;
      continue;
    }
    if (c === 0xb7) {
      out.push(0xc2, 0xb7); // ·
    } else if (c === 0x96 || c === 0x97) {
      // CP1252 en/em dash → UTF-8 en/em dash
      if (c === 0x96) out.push(0xe2, 0x80, 0x93);
      else out.push(0xe2, 0x80, 0x94);
    } else {
      out.push(0x3f); // ?
    }
    i += 1;
  }
  return Buffer.from(out);
}

const files = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.tsx'));
for (const file of files) {
  const full = path.join(pagesDir, file);
  const buf = fs.readFileSync(full);
  const issues = findInvalidUtf8(buf);
  if (issues.length === 0) {
    // Still normalize known ASCII '?' stand-ins in category labels
    let s = buf.toString('utf8');
    const next = s
      .replaceAll("Sep 1?7", 'Sep 1–7')
      .replaceAll('Sep 8?14', 'Sep 8–14')
      .replaceAll('Sep 15?21', 'Sep 15–21')
      .replaceAll('Sep 22?28', 'Sep 22–28');
    if (next !== s) {
      fs.writeFileSync(full, next, 'utf8');
      console.log(file, 'normalized labels');
    } else {
      console.log(file, 'ok');
    }
    continue;
  }
  console.log(file, 'invalid at', issues.slice(0, 8), 'repairing…');
  const fixed = repair(buf);
  new TextDecoder('utf-8', { fatal: true }).decode(fixed);
  fs.writeFileSync(full, fixed);
  console.log(file, 'repaired', buf.length, '->', fixed.length);
}
