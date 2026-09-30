// Small, bounded little-endian NBT codec for this example's generated structures.
// It deliberately rejects types unused by the original NewUI structure schema.
import assert from 'node:assert/strict';

const types = new Set([1, 3, 5, 8, 9, 10]);
export const nbt = {
  byte: value => ({ type: 1, value }),
  int: value => ({ type: 3, value }),
  float: value => ({ type: 5, value }),
  string: value => ({ type: 8, value }),
  list: (type, items) => ({ type: 9, value: { type, items } }),
  compound: value => ({ type: 10, value }),
};

export function encodeStructure(root) {
  const parts = [];
  function number(method, size, value) { const bytes = Buffer.alloc(size); bytes[method](value); parts.push(bytes); }
  function string(value) {
    assert.equal(typeof value, 'string');
    const bytes = Buffer.from(value, 'utf8'); assert.ok(bytes.length <= 65535, 'NBT string too large');
    number('writeUInt16LE', 2, bytes.length); parts.push(bytes);
  }
  function payload(type, value, depth) {
    assert.ok(types.has(type) && depth <= 32, 'Unsupported NBT type or depth');
    if (type === 1) number('writeInt8', 1, value);
    else if (type === 3) number('writeInt32LE', 4, value);
    else if (type === 5) { assert.ok(Number.isFinite(value)); number('writeFloatLE', 4, value); }
    else if (type === 8) string(value);
    else if (type === 9) {
      assert.ok(types.has(value.type) && Array.isArray(value.items) && value.items.length <= 65536, 'Invalid NBT list');
      number('writeUInt8', 1, value.type); number('writeInt32LE', 4, value.items.length);
      for (const item of value.items) payload(value.type, item, depth + 1);
    } else {
      assert.ok(value && typeof value === 'object' && !Array.isArray(value));
      for (const [name, field] of Object.entries(value)) {
        number('writeUInt8', 1, field.type); string(name); payload(field.type, field.value, depth + 1);
      }
      number('writeUInt8', 1, 0);
    }
  }
  assert.equal(root.type, 10, 'Structure root must be a compound');
  number('writeUInt8', 1, 10); string(''); payload(10, root.value, 0);
  const output = Buffer.concat(parts); assert.ok(output.length <= 1024 * 1024, 'Structure too large');
  return output;
}

export function decodeStructure(bytes) {
  assert.ok(Buffer.isBuffer(bytes) && bytes.length <= 1024 * 1024, 'Invalid structure bytes');
  let offset = 0, fields = 0;
  function take(size) {
    assert.ok(Number.isInteger(size) && size >= 0 && offset + size <= bytes.length, 'Truncated NBT');
    const start = offset; offset += size; return start;
  }
  const number = (method, size) => bytes[method](take(size));
  function string() { const size = number('readUInt16LE', 2); const start = take(size); return new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(start, start + size)); }
  function payload(type, depth) {
    assert.ok(types.has(type) && depth <= 32, 'Unsupported NBT type or depth');
    if (type === 1) return number('readInt8', 1);
    if (type === 3) return number('readInt32LE', 4);
    if (type === 5) { const value = number('readFloatLE', 4); assert.ok(Number.isFinite(value)); return value; }
    if (type === 8) return string();
    if (type === 9) {
      const itemType = number('readUInt8', 1), count = number('readInt32LE', 4);
      assert.ok(types.has(itemType) && count >= 0 && count <= 65536, 'Invalid NBT list');
      return { type: itemType, items: Array.from({ length: count }, () => payload(itemType, depth + 1)) };
    }
    const value = Object.create(null);
    for (;;) {
      const childType = number('readUInt8', 1); if (childType === 0) break;
      const key = string(); assert.ok(!Object.hasOwn(value, key) && ++fields <= 2048, 'Duplicate or excessive NBT fields');
      value[key] = { type: childType, value: payload(childType, depth + 1) };
    }
    return value;
  }
  assert.equal(number('readUInt8', 1), 10, 'Expected uncompressed little-endian compound');
  assert.equal(string(), '', 'Expected unnamed structure root');
  const root = { type: 10, value: payload(10, 0) };
  assert.equal(offset, bytes.length, 'Trailing structure data');
  return root;
}

export function createCodexStructure(catalog, index) {
  const entry = catalog.entries[index], page = String(index).padStart(2, '0');
  assert.ok(entry && Number.isInteger(index));
  const local = catalog.entries.filter(candidate => candidate.category === entry.category);
  const buttons = [
    ...catalog.categories.map(category => [category.name, category.id]),
    ...local.map((candidate, slot) => [candidate.name, `slot${slot}`]),
    ['이전', 'prev'], ['다음', 'next'],
  ];
  const action = (name, command, mode) => ({ button_name: name, data: [{ cmd_line: command, cmd_ver: 38 }], mode, text: name || command, type: 1 });
  const actions = buttons.map(([name, id]) => action(name, `scriptevent newui:navigate ${id}`, 0));
  actions.push(action('', 'scriptevent newui:close close', 1));
  const entity = {
    identifier: nbt.string('newui:codex'),
    definitions: nbt.list(8, ['+newui:codex']),
    CustomName: nbt.string('NEWUI_CODEX_V1'), RawtextName: nbt.string('NEWUI_CODEX_V1'),
    // The engine's persisted key really is spelled InterativeText.
    InterativeText: nbt.string(`[NEWUI:C${entry.category}:E${page}]${entry.description}`),
    Actions: nbt.string(JSON.stringify(actions)),
    Tags: nbt.list(8, ['newui.codex.template', `newui.codex.entry_${page}`]),
    Pos: nbt.list(5, [0.5, 0, 0.5]), Rotation: nbt.list(5, [0, 0]),
    Persistent: nbt.byte(1), Variant: nbt.int(0), SkinID: nbt.int(0),
  };
  return nbt.compound({
    format_version: nbt.int(1), size: nbt.list(3, [1, 1, 1]),
    structure: nbt.compound({
      block_indices: nbt.list(9, [{ type: 3, items: [-1] }, { type: 3, items: [-1] }]),
      entities: nbt.list(10, [entity]),
      palette: nbt.compound({ default: nbt.compound({ block_palette: nbt.list(10, []), block_position_data: nbt.compound({}) }) }),
    }),
    structure_world_origin: nbt.list(3, [0, 0, 0]),
  });
}
